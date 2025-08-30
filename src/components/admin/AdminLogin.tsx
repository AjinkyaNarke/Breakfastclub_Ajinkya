
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import bcrypt from 'bcryptjs';

export const AdminLogin = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Block login after 5 failed attempts for 15 minutes
  const MAX_LOGIN_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

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
          title: t('login.error'), 
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
          title: t('login.error'), 
          description: t('login.errorDescription'), 
          variant: "destructive" 
        });
        return;
      }

      if (!adminUsers || adminUsers.length === 0) {
        // SECURITY: Don't log actual username in production
        if (import.meta.env.DEV) {
          console.log('No admin user found with username:', username);
        }
        handleFailedLogin();
        toast({ 
          title: t('login.failed'), 
          description: 'Invalid username or password', 
          variant: "destructive" 
        });
        return;
      }

      if (adminUsers.length > 1) {
        // SECURITY: Don't log actual username in production
        if (import.meta.env.DEV) {
          console.error('Multiple admin users found with same username:', username);
        }
        toast({ 
          title: t('login.error'), 
          description: 'System configuration error. Please contact administrator.', 
          variant: "destructive" 
        });
        return;
      }

      const adminUser = adminUsers[0];
      // SECURITY: Never log admin user details in production
      if (import.meta.env.DEV) {
        console.log('Admin user found - authentication proceeding');
      }

      // Secure password verification using bcrypt
      const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
      
      // SECURITY: Only log in development mode
      if (import.meta.env.DEV) {
        console.log('Password verification completed');
      }
      
      if (isPasswordValid) {
        // SECURITY: Only log in development mode
        if (import.meta.env.DEV) {
          console.log('Password verified successfully, updating last_login');
        }
        
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
        
        // SECURITY: Only log in development mode
        if (import.meta.env.DEV) {
          console.log('Authentication successful, redirecting...');
        }
        toast({ 
          title: 'Login Successful', 
          description: `Welcome back, ${username}!`, 
          variant: "default" 
        });
        
        // Use React Router navigation instead of window.location.href
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 100); // Small delay to ensure state updates
      } else {
        // SECURITY: Only log in development mode
        if (import.meta.env.DEV) {
          console.log('Password verification failed');
        }
        handleFailedLogin();
        toast({ 
          title: t('login.failed'), 
          description: 'Invalid username or password', 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      handleFailedLogin();
      toast({ 
        title: t('login.error'), 
        description: t('login.errorDescription'), 
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is already authenticated
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Login
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  disabled={isBlocked}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={isBlocked}
                  className="mt-1"
                />
              </div>
              
              {loginAttempts > 0 && (
                <div className="text-sm text-orange-600">
                  Failed attempts: {loginAttempts}/{MAX_LOGIN_ATTEMPTS}
                  {isBlocked && (
                    <div className="text-red-600 font-medium">
                      Account temporarily blocked
                    </div>
                  )}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading || isBlocked}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
