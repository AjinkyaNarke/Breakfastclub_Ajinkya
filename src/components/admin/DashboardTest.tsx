// Comprehensive Admin Dashboard Test Component
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  details: string;
  data?: any;
}

export const DashboardTest = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { isAuthenticated, username } = useAuth();

  const runDashboardTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Authentication Status
    results.push({
      test: 'Authentication Status',
      status: isAuthenticated ? 'success' : 'error',
      details: isAuthenticated ? `Logged in as: ${username}` : 'Not authenticated',
    });

    // Test 2: Menu Items Query
    try {
      results.push({
        test: 'Menu Items Query',
        status: 'pending',
        details: 'Testing menu_items table access...'
      });

      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('id', { count: 'exact' });

      results[results.length - 1] = {
        test: 'Menu Items Query',
        status: menuError ? 'error' : 'success',
        details: menuError ? 
          `Error: ${menuError.message}` : 
          `Found ${menuData?.length || 0} items (count: ${menuData?.length || 0})`,
        data: menuError ? menuError : { count: menuData?.length || 0 }
      };
    } catch (error) {
      results[results.length - 1] = {
        test: 'Menu Items Query',
        status: 'error',
        details: `Exception: ${error}`,
      };
    }

    // Test 3: Gallery Images Query
    try {
      results.push({
        test: 'Gallery Images Query',
        status: 'pending',
        details: 'Testing gallery_images table access...'
      });

      const { data: galleryData, error: galleryError } = await supabase
        .from('gallery_images')
        .select('id', { count: 'exact' });

      results[results.length - 1] = {
        test: 'Gallery Images Query',
        status: galleryError ? 'error' : 'success',
        details: galleryError ? 
          `Error: ${galleryError.message}` : 
          `Found ${galleryData?.length || 0} images (count: ${galleryData?.length || 0})`,
        data: galleryError ? galleryError : { count: galleryData?.length || 0 }
      };
    } catch (error) {
      results[results.length - 1] = {
        test: 'Gallery Images Query',
        status: 'error',
        details: `Exception: ${error}`,
      };
    }

    // Test 4: Restaurant Videos Query
    try {
      results.push({
        test: 'Restaurant Videos Query',
        status: 'pending',
        details: 'Testing restaurant_videos table access...'
      });

      const { data: videoData, error: videoError } = await supabase
        .from('restaurant_videos')
        .select('id', { count: 'exact' });

      results[results.length - 1] = {
        test: 'Restaurant Videos Query',
        status: videoError ? 'error' : 'success',
        details: videoError ? 
          `Error: ${videoError.message}` : 
          `Found ${videoData?.length || 0} videos (count: ${videoData?.length || 0})`,
        data: videoError ? videoError : { count: videoData?.length || 0 }
      };
    } catch (error) {
      results[results.length - 1] = {
        test: 'Restaurant Videos Query',
        status: 'error',
        details: `Exception: ${error}`,
      };
    }

    // Test 5: Events Query
    try {
      results.push({
        test: 'Events Query',
        status: 'pending',
        details: 'Testing events table access...'
      });

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id', { count: 'exact' });

      results[results.length - 1] = {
        test: 'Events Query',
        status: eventError ? 'error' : 'success',
        details: eventError ? 
          `Error: ${eventError.message}` : 
          `Found ${eventData?.length || 0} events (count: ${eventData?.length || 0})`,
        data: eventError ? eventError : { count: eventData?.length || 0 }
      };
    } catch (error) {
      results[results.length - 1] = {
        test: 'Events Query',
        status: 'error',
        details: `Exception: ${error}`,
      };
    }

    // Test 6: All Queries Combined (Dashboard Style)
    try {
      results.push({
        test: 'Combined Dashboard Query',
        status: 'pending',
        details: 'Testing all queries together like the dashboard...'
      });

      const [menuResult, galleryResult, videoResult, eventResult] = await Promise.all([
        supabase.from('menu_items').select('id', { count: 'exact' }),
        supabase.from('gallery_images').select('id', { count: 'exact' }),
        supabase.from('restaurant_videos').select('id', { count: 'exact' }),
        supabase.from('events').select('id', { count: 'exact' }),
      ]);

      const hasErrors = [menuResult, galleryResult, videoResult, eventResult].some(r => r.error);
      const stats = {
        menuItems: menuResult.count || 0,
        galleryImages: galleryResult.count || 0,
        videos: videoResult.count || 0,
        events: eventResult.count || 0,
      };

      results[results.length - 1] = {
        test: 'Combined Dashboard Query',
        status: hasErrors ? 'error' : 'success',
        details: hasErrors ? 
          'Some queries failed' : 
          `All queries successful - Menu: ${stats.menuItems}, Gallery: ${stats.galleryImages}, Videos: ${stats.videos}, Events: ${stats.events}`,
        data: stats
      };
    } catch (error) {
      results[results.length - 1] = {
        test: 'Combined Dashboard Query',
        status: 'error',
        details: `Exception: ${error}`,
      };
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Admin Dashboard Comprehensive Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDashboardTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Tests...' : 'Run Dashboard Tests'}
          </Button>

          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <span>{getStatusIcon(result.status)}</span>
                  <span>{result.test}</span>
                </div>
                <div className="text-sm mt-1">{result.details}</div>
                {result.data && (
                  <div className="text-xs mt-2 bg-white/50 p-2 rounded">
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {testResults.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-800">Dashboard Status Summary:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• <strong>Successful Tests:</strong> {testResults.filter(r => r.status === 'success').length}</li>
                <li>• <strong>Failed Tests:</strong> {testResults.filter(r => r.status === 'error').length}</li>
                <li>• <strong>Overall Status:</strong> {testResults.every(r => r.status === 'success') ? '✅ All Working' : '⚠️ Issues Found'}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

