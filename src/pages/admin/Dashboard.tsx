
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Image, Video, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DeepgramTestComponent } from '@/components/admin/DeepgramTestComponent';

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
  const { t } = useTranslation('admin');

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
      title: t('dashboard.stats.menuItems'),
      value: stats.menuItems,
      icon: ChefHat,
      description: t('dashboard.stats.menuItemsDesc'),
    },
    {
      title: t('dashboard.stats.galleryImages'),
      value: stats.galleryImages,
      icon: Image,
      description: t('dashboard.stats.galleryImagesDesc'),
    },
    {
      title: t('dashboard.stats.videos'),
      value: stats.videos,
      icon: Video,
      description: t('dashboard.stats.videosDesc'),
    },
    {
      title: t('dashboard.stats.events'),
      value: stats.events,
      icon: Calendar,
      description: t('dashboard.stats.eventsDesc'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.description')}
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
            <CardTitle>{t('dashboard.quickActions.title')}</CardTitle>
            <CardDescription>
              {t('dashboard.quickActions.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col space-y-2">
              <Link to="/admin/menu" className="text-primary hover:underline">
                {t('dashboard.quickActions.addMenuItem')}
              </Link>
              <Link to="/admin/gallery" className="text-primary hover:underline">
                {t('dashboard.quickActions.uploadImages')}
              </Link>
              <Link to="/admin/videos" className="text-primary hover:underline">
                {t('dashboard.quickActions.addVideo')}
              </Link>
              <Link to="/admin/events" className="text-primary hover:underline">
                {t('dashboard.quickActions.createEvent')}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.systemStatus.title')}</CardTitle>
            <CardDescription>
              {t('dashboard.systemStatus.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('dashboard.systemStatus.database')}</span>
                <span className="text-green-600">{t('dashboard.systemStatus.connected')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('dashboard.systemStatus.storage')}</span>
                <span className="text-green-600">{t('dashboard.systemStatus.available')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('dashboard.systemStatus.adminAccess')}</span>
                <span className="text-green-600">{t('dashboard.systemStatus.active')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deepgram Test Component - Remove this in production */}
      {import.meta.env.VITE_DEBUG_MODE === 'true' && (
        <Card>
          <CardHeader>
            <CardTitle>🎤 Voice Integration Test</CardTitle>
            <CardDescription>
              Test Deepgram voice features (Debug Mode Only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeepgramTestComponent />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
