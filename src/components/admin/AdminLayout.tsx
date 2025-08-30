
import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Menu, 
  Image, 
  Video, 
  Calendar,
  FileText,
  Settings,
  LogOut,
  ChefHat,
  Newspaper,
  Package,
  FolderOpen,
  MessageCircle,
  BarChart3,
  AlertTriangle,
  TestTube
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { CompactThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';

export const AdminLayout = () => {
  const { isAuthenticated, isLoading, logout, username, loginTime, extendSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionWarningTime, setSessionWarningTime] = useState<number>(0);
  const location = useLocation();
  const { t } = useTranslation('admin');
  const { toast } = useToast();

  // Session timeout settings
  const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
  const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // 5 minutes before timeout

  useEffect(() => {
    if (!loginTime) return;

    const checkSessionTimeout = () => {
      const loginTimeMs = new Date(loginTime).getTime();
      const currentTime = new Date().getTime();
      const timeRemaining = SESSION_TIMEOUT - (currentTime - loginTimeMs);

      if (timeRemaining <= 0) {
        // Session expired, logout
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        });
        logout();
        return;
      }

      if (timeRemaining <= WARNING_BEFORE_TIMEOUT && !showSessionWarning) {
        // Show warning 5 minutes before timeout
        setShowSessionWarning(true);
        setSessionWarningTime(Math.ceil(timeRemaining / 60000)); // Convert to minutes
        
        toast({
          title: 'Session Expiring Soon',
          description: `Your session will expire in ${Math.ceil(timeRemaining / 60000)} minutes.`,
          variant: 'default'
        });
      }
    };

    // Check immediately
    checkSessionTimeout();

    // Check every minute
    const interval = setInterval(checkSessionTimeout, 60 * 1000);

    return () => clearInterval(interval);
  }, [loginTime, showSessionWarning, logout, toast]);

  const handleExtendSession = () => {
    extendSession();
    setShowSessionWarning(false);
    toast({
      title: 'Session Extended',
      description: 'Your session has been extended for another 8 hours.',
      variant: 'default'
    });
  };

  const handleLogout = () => {
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
      variant: 'default'
    });
    logout();
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: t('navigation.dashboard'), path: '/admin' },
    { icon: ChefHat, label: t('navigation.menu'), path: '/admin/menu' },
    { icon: Package, label: t('navigation.ingredients'), path: '/admin/ingredients' },
    { icon: FolderOpen, label: t('navigation.categories'), path: '/admin/ingredient-categories' },
    { icon: Package, label: t('navigation.preps'), path: '/admin/preps' },
    { icon: BarChart3, label: t('navigation.prepAnalytics'), path: '/admin/prep-analytics' },
    { icon: MessageCircle, label: t('navigation.aiChat', 'AI Chat'), path: '/admin/chat' },
    { icon: FileText, label: t('navigation.about'), path: '/admin/about' },
    { icon: Image, label: t('navigation.gallery'), path: '/admin/gallery' },
    { icon: Video, label: t('navigation.videos'), path: '/admin/videos' },
    { icon: Newspaper, label: t('navigation.press'), path: '/admin/press' },
    { icon: Calendar, label: t('navigation.events'), path: '/admin/events' },
    { icon: Calendar, label: t('navigation.reservations'), path: '/admin/reservations' },
    { icon: FileText, label: t('navigation.content'), path: '/admin/content' },
    { icon: Settings, label: t('navigation.settings'), path: '/admin/settings' },
    { icon: TestTube, label: 'System Test', path: '/admin/test' },
  ];

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Session Warning Modal */}
      {showSessionWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold">Session Expiring Soon</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Your session will expire in {sessionWarningTime} minutes. Would you like to extend it?
            </p>
            <div className="flex gap-3">
              <Button onClick={handleExtendSession} className="flex-1">
                Extend Session
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex-1">
                Logout Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "bg-card border-r border-border transition-all duration-300 relative flex flex-col h-full",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            {sidebarOpen && (
              <div>
                <span className="font-bold text-lg">{t('layout.adminPanel')}</span>
                {username && (
                  <div className="text-sm text-muted-foreground">
                    Welcome, {username}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start gap-2",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && t('layout.logout')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-card border-b border-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <h1 className="text-xl font-semibold">
              {t('layout.header')}
            </h1>
            
            <div className="flex items-center space-x-4">
              <CompactThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
