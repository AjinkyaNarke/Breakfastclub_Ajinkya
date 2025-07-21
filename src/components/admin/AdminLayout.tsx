
import { useState } from 'react';
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
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const AdminLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { t } = useTranslation('admin');

  const sidebarItems = [
    { icon: LayoutDashboard, label: t('navigation.dashboard'), path: '/admin' },
    { icon: ChefHat, label: t('navigation.menu'), path: '/admin/menu' },
    { icon: Package, label: 'Ingredients', path: '/admin/ingredients' },
    { icon: FolderOpen, label: 'Categories', path: '/admin/ingredient-categories' },
    { icon: FileText, label: 'About Us', path: '/admin/about' },
    { icon: Image, label: t('navigation.gallery'), path: '/admin/gallery' },
    { icon: Video, label: t('navigation.videos'), path: '/admin/videos' },
    { icon: Newspaper, label: t('navigation.press'), path: '/admin/press' },
    { icon: Calendar, label: t('navigation.events'), path: '/admin/events' },
    { icon: Calendar, label: 'Reservations', path: '/admin/reservations' },
    { icon: FileText, label: t('navigation.content'), path: '/admin/content' },
    { icon: Settings, label: t('navigation.settings'), path: '/admin/settings' },
  ];

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={cn(
        "bg-card border-r border-border transition-all duration-300 relative flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            {sidebarOpen && (
              <span className="font-bold text-lg">{t('layout.adminPanel')}</span>
            )}
          </div>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
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
        
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={logout}
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
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border p-4">
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
            
            <LanguageSwitcher />
          </div>
        </header>
        
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
