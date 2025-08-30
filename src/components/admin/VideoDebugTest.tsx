// Video Debug Test Component
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VideoDebugResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  details: string;
  data?: any;
}

export const VideoDebugTest = () => {
  const [testResults, setTestResults] = useState<VideoDebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runVideoTests = async () => {
    setIsRunning(true);
    const results: VideoDebugResult[] = [];

    try {
      // Test 1: Basic video count query
      const { data: countData, error: countError } = await supabase
        .from('restaurant_videos')
        .select('id', { count: 'exact' });

      results.push({
        test: 'Basic Video Count',
        status: countError ? 'error' : 'success',
        details: countError ? 
          `Error: ${countError.message}` : 
          `Total videos in database: ${countData?.length || 0}`,
        data: { count: countData?.length || 0, error: countError }
      });

      // Test 2: Full video data query
      const { data: allVideos, error: allError } = await supabase
        .from('restaurant_videos')
        .select('*')
        .order('display_order');

      results.push({
        test: 'Full Video Data Query',
        status: allError ? 'error' : 'success',
        details: allError ? 
          `Error: ${allError.message}` : 
          `Retrieved ${allVideos?.length || 0} videos with full data`,
        data: allVideos || []
      });

      // Test 3: Featured videos check
      if (allVideos && allVideos.length > 0) {
        const featuredVideos = allVideos.filter(v => v.is_featured);
        const heroVideos = allVideos.filter(v => v.featured_for_hero);
        
        results.push({
          test: 'Video Status Analysis',
          status: 'success',
          details: `Featured: ${featuredVideos.length}, Hero: ${heroVideos.length}, Total: ${allVideos.length}`,
          data: {
            featured: featuredVideos,
            hero: heroVideos,
            all: allVideos
          }
        });
      }

      // Test 4: Check video URLs validity
      if (allVideos && allVideos.length > 0) {
        const videoUrlIssues = allVideos.filter(v => !v.video_url || v.video_url.trim() === '');
        
        results.push({
          test: 'Video URL Validation',
          status: videoUrlIssues.length > 0 ? 'warning' : 'success',
          details: videoUrlIssues.length > 0 ? 
            `${videoUrlIssues.length} videos have missing or empty URLs` :
            'All videos have valid URLs',
          data: videoUrlIssues
        });
      }

      // Test 5: Check display order
      if (allVideos && allVideos.length > 0) {
        const duplicateOrders = allVideos.filter((v, i, arr) => 
          arr.findIndex(other => other.display_order === v.display_order) !== i
        );
        
        results.push({
          test: 'Display Order Check',
          status: duplicateOrders.length > 0 ? 'warning' : 'success',
          details: duplicateOrders.length > 0 ? 
            `${duplicateOrders.length} videos have duplicate display orders` :
            'All videos have unique display orders',
          data: duplicateOrders
        });
      }

      // Test 6: Sample actual video data
      if (allVideos && allVideos.length > 0) {
        results.push({
          test: 'Sample Video Data',
          status: 'success',
          details: `First video: "${allVideos[0].title}" - URL: ${allVideos[0].video_url?.substring(0, 50)}...`,
          data: allVideos[0]
        });
      }

    } catch (error) {
      results.push({
        test: 'Video Test Exception',
        status: 'error',
        details: `Unexpected error: ${error}`,
        data: error
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎥 Video Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runVideoTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Video Tests...' : 'Run Video Debug Tests'}
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
                  <details className="text-xs mt-2 bg-white/50 p-2 rounded">
                    <summary className="cursor-pointer font-semibold">Show Data</summary>
                    <pre className="mt-2 overflow-auto max-h-32">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {testResults.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-800">Video Debug Summary:</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• <strong>Total Tests:</strong> {testResults.length}</li>
                <li>• <strong>Successful:</strong> {testResults.filter(r => r.status === 'success').length}</li>
                <li>• <strong>Warnings:</strong> {testResults.filter(r => r.status === 'warning').length}</li>
                <li>• <strong>Errors:</strong> {testResults.filter(r => r.status === 'error').length}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

