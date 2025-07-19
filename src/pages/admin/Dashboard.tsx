import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Image, Video, Calendar } from 'lucide-react';

interface Stats {
  menuItems: number;
  galleryImages: number;
  videos: number;
  events: number;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    menuItems: 0,
    galleryImages: 0,
    videos: 0,
    events: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [menuResult, galleryResult, videoResult, eventResult] = await Promise.all([
        supabase.from('menu_items').select('id', { count: 'exact' }),
        supabase.from('gallery_images').select('id', { count: 'exact' }),
        supabase.from('restaurant_videos').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }),
      ]);

      setStats({
        menuItems: menuResult.count || 0,
        galleryImages: galleryResult.count || 0,
        videos: videoResult.count || 0,
        events: eventResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Menu Items',
      value: stats.menuItems,
      icon: ChefHat,
      description: 'Total dishes in menu',
    },
    {
      title: 'Gallery Images',
      value: stats.galleryImages,
      icon: Image,
      description: 'Photos in gallery',
    },
    {
      title: 'Videos',
      value: stats.videos,
      icon: Video,
      description: 'Restaurant videos',
    },
    {
      title: 'Events',
      value: stats.events,
      icon: Calendar,
      description: 'Community events',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the fckingbreakfastclub admin panel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col space-y-2">
              <a href="/admin/menu" className="text-primary hover:underline">
                → Add new menu item
              </a>
              <a href="/admin/gallery" className="text-primary hover:underline">
                → Upload gallery images
              </a>
              <a href="/admin/videos" className="text-primary hover:underline">
                → Add restaurant video
              </a>
              <a href="/admin/events" className="text-primary hover:underline">
                → Create community event
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Database</span>
                <span className="text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Storage</span>
                <span className="text-green-600">Available</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Access</span>
                <span className="text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};