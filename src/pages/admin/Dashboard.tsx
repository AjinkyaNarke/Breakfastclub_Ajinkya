
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Image, Video, Calendar, Clock, Users, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DeepgramTestComponent } from '@/components/admin/DeepgramTestComponent';
import { format } from 'date-fns';

interface Stats {
  menuItems: number;
  galleryImages: number;
  videos: number;
  events: number;
  reservations: number;
}

interface Reservation {
  id: string;
  customer_name: string;
  customer_email: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  created_at: string;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    menuItems: 0,
    galleryImages: 0,
    videos: 0,
    events: 0,
    reservations: 0,
  });
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const { t } = useTranslation('admin');

  useEffect(() => {
    fetchStats();
    fetchRecentReservations();
  }, []);

  const fetchStats = async () => {
    try {
      const [menuResult, galleryResult, videoResult, eventResult, reservationResult] = await Promise.all([
        supabase.from('menu_items').select('id', { count: 'exact' }),
        supabase.from('gallery_images').select('id', { count: 'exact' }),
        supabase.from('restaurant_videos').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }),
        supabase.from('reservations').select('id', { count: 'exact' }),
      ]);

      setStats({
        menuItems: menuResult.count || 0,
        galleryImages: galleryResult.count || 0,
        videos: videoResult.count || 0,
        events: eventResult.count || 0,
        reservations: reservationResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, customer_name, customer_email, reservation_date, reservation_time, party_size, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentReservations(data || []);
    } catch (error) {
      console.error('Error fetching recent reservations:', error);
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
    {
      title: 'Reservations',
      value: stats.reservations,
      icon: CalendarDays,
      description: 'Total reservations made',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <Link to="/admin/reservations" className="text-primary hover:underline">
                Manage Reservations
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Latest Reservations</CardTitle>
              <CardDescription>
                Most recent reservation requests
              </CardDescription>
            </div>
            <Link to="/admin/reservations" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentReservations.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No reservations yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{reservation.customer_name}</span>
                        <span className="text-sm text-muted-foreground">{reservation.customer_email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>{format(new Date(reservation.reservation_date), 'MMM dd')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{reservation.reservation_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{reservation.party_size}</span>
                      </div>
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      
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
