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
  Newspaper
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: ChefHat, label: 'Menu', path: '/admin/menu' },
  { icon: Image, label: 'Gallery', path: '/admin/gallery' },
  { icon: Video, label: 'Videos', path: '/admin/videos' },
  { icon: Newspaper, label: 'Press', path: '/admin/press' },
  { icon: Calendar, label: 'Events', path: '/admin/events' },
  { icon: FileText, label: 'Content', path: '/admin/content' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export const AdminLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={cn(
        "bg-card border-r border-border transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            {sidebarOpen && (
              <span className="font-bold text-lg">Admin Panel</span>
            )}
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
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
        
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="outline"
            onClick={logout}
            className={cn(
              "w-full justify-start gap-2",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && "Logout"}
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
              fckingbreakfastclub Admin
            </h1>
            
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>
        
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};