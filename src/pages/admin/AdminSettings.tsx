import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  CreditCard, 
  Mic, 
  Image as ImageIcon, 
  Brain,
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Zap,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Upload,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useServiceUsage } from '@/hooks/useServiceUsage';
import UsageMonitor from '@/components/UsageMonitor';
import { supabase } from '@/integrations/supabase/client';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  defaultLanguage: string;
  timezone: string;
  enableNotifications: boolean;
  enableAutoBackup: boolean;
  maintenanceMode: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  activityDigest: boolean;
}


interface SiteBranding {
  id: string;
  site_name: string;
  tagline: string;
  favicon_url: string | null;
  logo_url: string | null;
}

const AdminSettings: React.FC = () => {
  const { t } = useTranslation('admin');
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  
  // Profile management state
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'Berlin Fusion Breakfast Club',
    siteDescription: 'Premium fusion breakfast experience in Berlin',
    defaultLanguage: 'en',
    timezone: 'Europe/Berlin',
    enableNotifications: true,
    enableAutoBackup: true,
    maintenanceMode: false,
  });
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme: 'system',
    language: 'en',
    emailNotifications: true,
    pushNotifications: false,
    activityDigest: true,
  });

  const [siteBranding, setSiteBranding] = useState<SiteBranding | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  // Real service usage data from API
  const { 
    serviceUsage, 
    loading: serviceUsageLoading, 
    refreshUsage 
  } = useServiceUsage();

  // Load site branding data
  useEffect(() => {
    const loadSiteBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('site_branding')
          .select('*')
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

  const saveSystemSettings = async () => {
    setLoading(true);
    try {
      // Save settings to database
      // TODO: Implement actual settings save to database
      
      toast({
        title: t('settings.messages.settingsSaved'),
        description: t('settings.messages.settingsSavedDesc'),
        variant: "default"
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: t('settings.messages.settingsError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveUserPreferences = async () => {
    setLoading(true);
    try {
      // Save user preferences to database  
      // TODO: Implement actual user preferences save to database
      
      toast({
        title: t('settings.messages.preferencesUpdated'),
        description: t('settings.messages.preferencesUpdatedDesc'),
        variant: "default"
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: t('settings.messages.preferencesError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshUsageData = async () => {
    setLoading(true);
    try {
      // Refresh usage data from real APIs
      if (refreshUsage) {
        await refreshUsage();
      }
      
      toast({
        title: t('settings.messages.usageUpdated'),
        description: t('settings.messages.usageUpdatedDesc'),
        variant: "default"
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: t('settings.messages.usageError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Profile management functions
  const canUpdateProfile = () => {
    if (newPassword && newPassword !== confirmPassword) return false;
    if (newPassword && !currentPassword) return false;
    if (newUsername && newUsername.trim().length < 3) return false;
    return true;
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const currentUsername = user?.username || 'Admin';
      const updates: { username?: string; password_hash?: string } = {};

      // Verify current password if changing password
      if (newPassword) {
        const { data: adminUser, error: queryError } = await supabase
          .from('admin_users')
          .select('password_hash')
          .eq('username', currentUsername)
          .single();

        if (queryError || !adminUser) {
          toast({
            title: 'Error',
            description: 'Could not verify current password',
            variant: "destructive"
          });
          return;
        }

        // Verify current password using bcrypt
        const bcrypt = await import('bcryptjs');
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminUser.password_hash);
        
        if (!isCurrentPasswordValid) {
          toast({
            title: 'Error',
            description: 'Current password is incorrect',
            variant: "destructive"
          });
          return;
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        updates.password_hash = newPasswordHash;
      }

      // Update username if provided
      if (newUsername && newUsername.trim()) {
        updates.username = newUsername.trim();
      }

      // Update database
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('admin_users')
          .update(updates)
          .eq('username', currentUsername);

        if (error) throw error;

        // Update local storage if username changed
        if (updates.username) {
          localStorage.setItem('adminUsername', updates.username);
        }

        // Clear form
        setNewUsername('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        toast({
          title: 'Success',
          description: 'Profile updated successfully',
          variant: "default"
        });

        // Refresh page to update user context
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const validateFile = (file: File, type: 'logo' | 'favicon'): string | null => {
    const maxSizes = {
      logo: 2 * 1024 * 1024, // 2MB
      favicon: 1 * 1024 * 1024 // 1MB
    };

    if (file.size > maxSizes[type]) {
      return `File size exceeds ${type === 'logo' ? '2MB' : '1MB'} limit`;
    }

    const allowedTypes = {
      logo: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
      favicon: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/jpeg', 'image/gif']
    };

    if (!allowedTypes[type].includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes[type].join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (file: File, type: 'logo' | 'favicon') => {
    const validationError = validateFile(file, type);
    
    if (validationError) {
      toast({
        title: t('settings.messages.invalidFile'),
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    if (type === 'logo') {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setFaviconPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}.${fileExt}`;
      
      // First, try to create the bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage.createBucket('branding', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 2097152 // 2MB
      });
      
      // Ignore bucket already exists error
      if (bucketError && !bucketError.message.includes('already exists')) {
        console.warn('Bucket creation warning:', bucketError);
      }

      const { data, error } = await supabase.storage
        .from('branding')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const saveBrandingSettings = async () => {
    if (!siteBranding) return;
    
    setLoading(true);
    try {
      let logoUrl = siteBranding.logo_url;
      let faviconUrl = siteBranding.favicon_url;

      // Upload logo if selected
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'logo');
      }

      // Upload favicon if selected
      if (faviconFile) {
        faviconUrl = await uploadFile(faviconFile, 'favicon');
      }

      // Update database
      const { error } = await supabase
        .from('site_branding')
        .update({
          site_name: siteBranding.site_name,
          tagline: siteBranding.tagline,
          logo_url: logoUrl,
          favicon_url: faviconUrl
        })
        .eq('id', siteBranding.id);

      if (error) throw error;

      // Update local state
      setSiteBranding(prev => prev ? {
        ...prev,
        logo_url: logoUrl,
        favicon_url: faviconUrl
      } : null);

      // Clear file selections
      setLogoFile(null);
      setFaviconFile(null);
      setLogoPreview(null);
      setFaviconPreview(null);

      // Update favicon in document head
      if (faviconUrl) {
        const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (faviconLink) {
          faviconLink.href = faviconUrl;
        } else {
          const newFaviconLink = document.createElement('link');
          newFaviconLink.rel = 'icon';
          newFaviconLink.href = faviconUrl;
          document.head.appendChild(newFaviconLink);
        }
      }

      toast({
        title: t('settings.messages.brandingUpdated'),
        description: t('settings.messages.brandingUpdatedDesc'),
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({
        title: t('settings.messages.error'),
        description: t('settings.messages.brandingError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('settings.description')}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={refreshUsageData}
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {t('settings.refreshData')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            {t('settings.tabs.general')}
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            {t('settings.tabs.branding')}
          </TabsTrigger>
          <TabsTrigger value="usage">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('settings.tabs.usage')}
          </TabsTrigger>
          <TabsTrigger value="services">
            <Zap className="h-4 w-4 mr-2" />
            {t('settings.tabs.services')}
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            {t('settings.tabs.account')}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            {t('settings.tabs.security')}
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.general.title')}</CardTitle>
              <CardDescription>
                {t('settings.general.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">{t('settings.general.siteName')}</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.siteName}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('settings.general.timezone')}</Label>
                  <Input
                    id="timezone"
                    value={systemSettings.timezone}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, timezone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">{t('settings.general.siteDescription')}</Label>
                <Input
                  id="siteDescription"
                  value={systemSettings.siteDescription}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('settings.general.systemFeatures')}</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.general.enableNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.general.enableNotificationsDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableNotifications}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({ ...prev, enableNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.general.autoBackup')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.general.autoBackupDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableAutoBackup}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({ ...prev, enableAutoBackup: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.general.maintenanceMode')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.general.maintenanceModeDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => 
                      setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSystemSettings} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('settings.general.saveChanges')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.branding.title')}</CardTitle>
              <CardDescription>
                {t('settings.branding.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {siteBranding && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">{t('settings.branding.siteName')}</Label>
                      <Input
                        id="siteName"
                        value={siteBranding.site_name}
                        onChange={(e) => setSiteBranding(prev => prev ? ({ ...prev, site_name: e.target.value }) : null)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tagline">{t('settings.branding.tagline')}</Label>
                      <Input
                        id="tagline"
                        value={siteBranding.tagline}
                        onChange={(e) => setSiteBranding(prev => prev ? ({ ...prev, tagline: e.target.value }) : null)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">{t('settings.branding.logo')}</h4>
                    <div className="flex items-start gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="logoUpload">{t('settings.branding.uploadLogo')}</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Input
                              id="logoUpload"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file, 'logo');
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex items-center justify-center w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                              <Upload className="h-4 w-4 mr-2" />
                              {logoFile ? logoFile.name : t('settings.branding.chooseLogo')}
                            </div>
                          </div>
                          {logoFile && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreview(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.branding.logoRecommended')}
                        </p>
                      </div>
                      
                      {/* Logo Preview */}
                      <div className="space-y-2">
                        <Label>{t('settings.branding.currentLogo')}</Label>
                        <div className="border rounded-md p-4 bg-muted/50 min-h-[80px] min-w-[120px] flex items-center justify-center">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo preview" className="max-h-16 max-w-[100px] object-contain" />
                          ) : siteBranding.logo_url ? (
                            <img src={siteBranding.logo_url} alt="Current logo" className="max-h-16 max-w-[100px] object-contain" />
                          ) : (
                            <div className="text-xs text-muted-foreground text-center">
                              {t('settings.branding.noLogoUploaded')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Favicon Upload */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">{t('settings.branding.favicon')}</h4>
                    <div className="flex items-start gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="faviconUpload">{t('settings.branding.uploadFavicon')}</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Input
                              id="faviconUpload"
                              type="file"
                              accept="image/*,.ico"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file, 'favicon');
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex items-center justify-center w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                              <Upload className="h-4 w-4 mr-2" />
                              {faviconFile ? faviconFile.name : t('settings.branding.chooseFavicon')}
                            </div>
                          </div>
                          {faviconFile && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFaviconFile(null);
                                setFaviconPreview(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.branding.faviconRecommended')}
                        </p>
                      </div>
                      
                      {/* Favicon Preview */}
                      <div className="space-y-2">
                        <Label>{t('settings.branding.currentFavicon')}</Label>
                        <div className="border rounded-md p-4 bg-muted/50 min-h-[60px] min-w-[60px] flex items-center justify-center">
                          {faviconPreview ? (
                            <img src={faviconPreview} alt="Favicon preview" className="w-8 h-8 object-contain" />
                          ) : siteBranding.favicon_url ? (
                            <img src={siteBranding.favicon_url} alt="Current favicon" className="w-8 h-8 object-contain" />
                          ) : (
                            <div className="text-xs text-muted-foreground text-center">
                              {t('settings.branding.noFavicon')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveBrandingSettings} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {t('settings.branding.saveBranding')}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage & Credits Tab */}
        <TabsContent value="usage" className="space-y-6">
          <UsageMonitor />
        </TabsContent>

        {/* AI Services Tab */}
        <TabsContent value="services" className="space-y-6">
          {serviceUsage ? (
            <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Deepgram Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Deepgram
                </CardTitle>
                <Badge variant={serviceUsage.deepgram.status === 'healthy' ? 'default' : 'destructive'}>
                  {serviceUsage.deepgram.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {serviceUsage.deepgram.used.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {serviceUsage.deepgram.limit.toLocaleString()} minutes
                </p>
                <div className="mt-4">
                  <Progress 
                    value={(serviceUsage.deepgram.used / serviceUsage.deepgram.limit) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Resets on {formatDate(serviceUsage.deepgram.resetDate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recraft AI Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Recraft AI
                </CardTitle>
                <Badge variant={serviceUsage.recraft.status === 'healthy' ? 'default' : 'destructive'}>
                  {serviceUsage.recraft.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {serviceUsage.recraft.used}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {serviceUsage.recraft.limit} image credits
                </p>
                <div className="mt-4">
                  <Progress 
                    value={(serviceUsage.recraft.used / serviceUsage.recraft.limit) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Resets on {formatDate(serviceUsage.recraft.resetDate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* DeepSeek Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  DeepSeek AI
                </CardTitle>
                <Badge variant={serviceUsage.deepseek.status === 'healthy' ? 'default' : 'destructive'}>
                  {serviceUsage.deepseek.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {serviceUsage.deepseek.used.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {serviceUsage.deepseek.limit.toLocaleString()} tokens
                </p>
                <div className="mt-4">
                  <Progress 
                    value={(serviceUsage.deepseek.used / serviceUsage.deepseek.limit) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Resets on {formatDate(serviceUsage.deepseek.resetDate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Service Status Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('settings.services.servicesInfo')}
              </AlertDescription>
            </Alert>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading service usage data...</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Profile Management - New Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Management
              </CardTitle>
              <CardDescription>
                Change your admin username and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentUsername">Current Username</Label>
                  <Input
                    id="currentUsername"
                    value={user?.username || 'Admin'}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current username cannot be changed directly
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newUsername">New Username</Label>
                  <Input
                    id="newUsername"
                    placeholder="Enter new username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to keep current username
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Password Change</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleProfileUpdate} 
                    disabled={loading || !canUpdateProfile()}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Update Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.account.title')}</CardTitle>
              <CardDescription>
                {t('settings.account.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">{t('settings.account.theme')}</Label>
                  <select
                    id="theme"
                    value={userPreferences.theme}
                    onChange={(e) => setUserPreferences(prev => ({ 
                      ...prev, 
                      theme: e.target.value as 'light' | 'dark' | 'system' 
                    }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="system">{t('settings.account.systemDefault')}</option>
                    <option value="light">{t('settings.account.light')}</option>
                    <option value="dark">{t('settings.account.dark')}</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">{t('settings.account.language')}</Label>
                  <select
                    id="language"
                    value={userPreferences.language}
                    onChange={(e) => setUserPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="en">{t('settings.account.english')}</option>
                    <option value="de">{t('settings.account.german')}</option>
                  </select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('settings.account.notifications')}</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.account.emailNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.account.emailNotificationsDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.emailNotifications}
                    onCheckedChange={(checked) => 
                      setUserPreferences(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.account.pushNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.account.pushNotificationsDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.pushNotifications}
                    onCheckedChange={(checked) => 
                      setUserPreferences(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.account.activityDigest')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.account.activityDigestDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.activityDigest}
                    onCheckedChange={(checked) => 
                      setUserPreferences(prev => ({ ...prev, activityDigest: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveUserPreferences} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('settings.account.savePreferences')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.account.accountInfo')}</CardTitle>
              <CardDescription>
                {t('settings.account.accountInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('settings.account.email')}</Label>
                  <p className="text-sm text-muted-foreground">{user?.email || t('settings.account.notAvailable')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('settings.account.userId')}</Label>
                  <p className="text-sm text-muted-foreground font-mono">{user?.id || t('settings.account.notAvailable')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('settings.account.role')}</Label>
                  <Badge variant="outline">{t('settings.account.administrator')}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('settings.account.lastLogin')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.security.title')}</CardTitle>
              <CardDescription>
                {t('settings.security.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  {t('settings.security.securityInfo')}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{t('settings.security.twoFactor')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.security.twoFactorDesc')}
                    </p>
                  </div>
                  <Badge variant="outline">{t('settings.security.comingSoon')}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{t('settings.security.sessionManagement')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.security.sessionManagementDesc')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('settings.security.viewSessions')}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{t('settings.security.apiKeys')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.security.apiKeysDesc')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('settings.security.manageKeys')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.security.dataPrivacy')}</CardTitle>
              <CardDescription>
                {t('settings.security.dataPrivacyDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{t('settings.security.exportData')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.security.exportDataDesc')}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {t('settings.security.export')}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{t('settings.security.deleteAccount')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.security.deleteAccountDesc')}
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  {t('settings.security.delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;