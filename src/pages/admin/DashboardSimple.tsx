// Simple Dashboard Test Component to isolate loading issues
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DashboardSimple = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    menuItems: 0,
    galleryImages: 0,
    videos: 0,
    events: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔍 Dashboard: Starting to fetch stats...');
        
        // Test each query individually to see which one fails
        console.log('📊 Testing menu_items query...');
        const menuResult = await supabase.from('menu_items').select('id', { count: 'exact' });
        console.log('📊 Menu result:', menuResult);
        
        console.log('📊 Testing gallery_images query...');
        const galleryResult = await supabase.from('gallery_images').select('id', { count: 'exact' });
        console.log('📊 Gallery result:', galleryResult);
        
        console.log('📊 Testing restaurant_videos query...');
        const videoResult = await supabase.from('restaurant_videos').select('id', { count: 'exact' });
        console.log('📊 Video result:', videoResult);
        
        console.log('📊 Testing events query...');
        const eventResult = await supabase.from('events').select('id', { count: 'exact' });
        console.log('📊 Event result:', eventResult);

        // Check for errors
        if (menuResult.error) throw new Error(`Menu query failed: ${menuResult.error.message}`);
        if (galleryResult.error) throw new Error(`Gallery query failed: ${galleryResult.error.message}`);
        if (videoResult.error) throw new Error(`Video query failed: ${videoResult.error.message}`);
        if (eventResult.error) throw new Error(`Event query failed: ${eventResult.error.message}`);

        setStats({
          menuItems: menuResult.count || 0,
          galleryImages: galleryResult.count || 0,
          videos: videoResult.count || 0,
          events: eventResult.count || 0,
        });
        
        console.log('✅ Dashboard: All stats fetched successfully');
      } catch (error) {
        console.error('❌ Dashboard error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-600 mt-2">Check browser console for more details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Stats Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold">Menu Items</h3>
              <p className="text-2xl">{stats.menuItems}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold">Gallery Images</h3>
              <p className="text-2xl">{stats.galleryImages}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="font-semibold">Videos</h3>
              <p className="text-2xl">{stats.videos}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <h3 className="font-semibold">Events</h3>
              <p className="text-2xl">{stats.events}</p>
            </div>
          </div>
          <p className="text-sm text-green-600">✅ Dashboard loaded successfully!</p>
        </CardContent>
      </Card>
    </div>
  );
};

