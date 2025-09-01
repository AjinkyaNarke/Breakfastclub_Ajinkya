
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Coffee, Eye, EyeOff, Lock, User, Shield } from 'lucide-react';
import bcrypt from 'bcryptjs';
import heroBreakfast from '@/assets/hero-breakfast.jpg';

export const AdminLogin = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Site branding state
  const [siteBranding, setSiteBranding] = useState<{
    site_name: string;
    tagline: string;
    logo_url: string | null;
  } | null>(null);

  // Video background state
  const [heroVideo, setHeroVideo] = useState<any>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Block login after 5 failed attempts for 15 minutes
  const MAX_LOGIN_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Load site branding data
  useEffect(() => {
    const loadSiteBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('site_branding')
          .select('site_name, tagline, logo_url')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading site branding:', error);
          return;
        }

        if (data) {
          setSiteBranding(data);
        }
      } catch (error) {
        console.error('Error loading site branding:', error);
      }
    };

    loadSiteBranding();
  }, []);

  // Load hero video data
  useEffect(() => {
    const fetchHeroVideo = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurant_videos')
          .select('*')
          .eq('featured_for_hero', true)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching hero video:', error);
          return;
        }
        
        if (data) {
          console.log('Hero video found for admin login:', data);
          setHeroVideo(data);
        } else {
          console.log('No hero video found, using fallback image');
        }
      } catch (error) {
        console.error('Exception fetching hero video:', error);
      }
    };

    fetchHeroVideo();
  }, []);

  const handleVideoError = () => {
    console.error('Admin login video failed to load:', heroVideo?.video_url);
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    console.log('Admin login video loaded successfully');
    setIsVideoLoaded(true);
    setVideoError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast({ 
        title: 'Account Temporarily Blocked', 
        description: 'Too many failed attempts. Please try again later.', 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);

    try {
      // SECURITY: Only log in development mode
      if (import.meta.env.DEV) {
        console.log('Attempting login with username:', username);
      }
      
      // Check if admin_users table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);

      if (tableError) {
        console.error('Table check error:', tableError);
        toast({ 
          title: 'System Error', 
          description: 'Admin system not configured. Please contact administrator.', 
          variant: "destructive" 
        });
        return;
      }

      const { data: adminUsers, error: queryError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username);

      if (queryError) {
        console.error('Query error:', queryError);
        toast({ 
          title: 'Login Error', 
          description: 'Unable to process login request. Please try again.', 
          variant: "destructive" 
        });
        return;
      }

      if (!adminUsers || adminUsers.length === 0) {
        handleFailedLogin();
        toast({ 
          title: 'Login Failed', 
          description: 'Invalid username or password', 
          variant: "destructive" 
        });
        return;
      }

      if (adminUsers.length > 1) {
        toast({ 
          title: 'System Error', 
          description: 'System configuration error. Please contact administrator.', 
          variant: "destructive" 
        });
        return;
      }

      const adminUser = adminUsers[0];

      // Secure password verification using bcrypt
      const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
      
      if (isPasswordValid) {
        // Reset failed login attempts on successful login
        setLoginAttempts(0);
        setIsBlocked(false);
        
        // Update last login time
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', adminUser.id);

        if (updateError && import.meta.env.DEV) {
          console.warn('Failed to update last_login:', updateError);
        }

        // Set authentication state
        const loginTime = new Date().toISOString();
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminUsername', username);
        localStorage.setItem('adminLoginTime', loginTime);
        
        // Update the auth context immediately
        login(username);
        
        toast({ 
          title: 'Welcome Back!', 
          description: `Successfully logged in as ${username}`, 
          variant: "default" 
        });
        
        // Use React Router navigation instead of window.location.href
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 100); // Small delay to ensure state updates
      } else {
        handleFailedLogin();
        toast({ 
          title: 'Login Failed', 
          description: 'Invalid username or password', 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      handleFailedLogin();
      toast({ 
        title: 'Login Error', 
        description: 'An unexpected error occurred. Please try again.', 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFailedLogin = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      setIsBlocked(true);
      toast({ 
        title: 'Account Blocked', 
        description: `Too many failed attempts. Account blocked for ${BLOCK_DURATION / 60000} minutes.`, 
        variant: "destructive" 
      });
      
      // Auto-unblock after block duration
      setTimeout(() => {
        setIsBlocked(false);
        setLoginAttempts(0);
        toast({ 
          title: 'Account Unblocked', 
          description: 'You can now try logging in again.', 
          variant: "default" 
        });
      }, BLOCK_DURATION);
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Video Background */}
        {heroVideo && !videoError && (
          <video
            className="hero-video"
            autoPlay={heroVideo.autoplay}
            loop
            muted
            playsInline
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
          >
            <source src={heroVideo.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        
        {/* Fallback Background Image */}
        {(!heroVideo || !isVideoLoaded || videoError) && (
          <div 
            className="hero-video"
            style={{
              backgroundImage: `url(${heroBreakfast})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        {/* Dark Overlay */}
        <div className="video-overlay absolute inset-0 z-10" />

        <div className="text-center relative z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#584161] mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is already authenticated
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Video Background */}
      {heroVideo && !videoError && (
        <video
          className="hero-video"
          autoPlay={heroVideo.autoplay}
          loop
          muted
          playsInline
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onCanPlay={() => console.log('Admin login video can play')}
        >
          <source src={heroVideo.video_url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Fallback Background Image */}
      {(!heroVideo || !isVideoLoaded || videoError) && (
        <div 
          className="hero-video"
          style={{
            backgroundImage: `url(${heroBreakfast})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Dark Overlay */}
      <div className="video-overlay absolute inset-0 z-10" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-15">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#8c4fa4]/30 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-[#584161]/40 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-[#8c4fa4]/20 rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-20">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center space-y-4">
            {/* Logo */}
            <div className="relative">
              {siteBranding?.logo_url ? (
                <img 
                  src={siteBranding.logo_url} 
                  alt={siteBranding.site_name}
                  className="h-16 w-16 object-contain filter drop-shadow-lg"
                />
              ) : (
                <div className="p-4 bg-gradient-to-br from-[#584161] to-[#8c4fa4] rounded-full shadow-2xl">
                  <Coffee className="h-8 w-8 text-white" />
                </div>
              )}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#8c4fa4] rounded-full animate-pulse shadow-lg"></div>
            </div>
            
            {/* Site Name */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#584161] to-[#8c4fa4] bg-clip-text text-transparent">
                {siteBranding?.site_name || 'fckingbreakfastclub'}
              </h1>
              <p className="text-white/70 text-sm font-medium">
                {siteBranding?.tagline || 'Asian Fusion • Berlin'}
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-6 w-6 text-[#8c4fa4]" />
              <CardTitle className="text-xl font-bold text-white">
                Admin Access
              </CardTitle>
            </div>
            <CardDescription className="text-white/70">
              Enter your administrator credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/90 font-medium flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Username</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={isBlocked}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[#8c4fa4] focus:ring-[#8c4fa4]/20 transition-all duration-300"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90 font-medium flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isBlocked}
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[#8c4fa4] focus:ring-[#8c4fa4]/20 pr-10 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
                    disabled={isBlocked}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {/* Login Attempts Warning */}
              {loginAttempts > 0 && (
                <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                  <div className="text-sm text-orange-200">
                    ⚠️ Failed attempts: {loginAttempts}/{MAX_LOGIN_ATTEMPTS}
                    {isBlocked && (
                      <div className="text-red-300 font-medium mt-1">
                        🔒 Account temporarily blocked
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#584161] to-[#8c4fa4] hover:from-[#8c4fa4] to-[#584161] text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                disabled={loading || isBlocked}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Access Dashboard</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-white/50 text-xs">
            Secure admin portal • Protected by encryption
          </p>
        </div>
      </div>
    </div>
  );
};
