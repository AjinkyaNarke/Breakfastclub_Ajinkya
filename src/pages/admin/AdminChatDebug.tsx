// Debug component for Admin Chat Edge Function issues
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const AdminChatDebug = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDebugTests = async () => {
    setIsRunning(true);
    const results: any[] = [];

    try {
      // Test 1: Check authentication
      results.push({
        test: 'Authentication Check',
        status: '🔍 Testing...',
        details: 'Checking Supabase auth session'
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      results.push({
        test: 'Authentication Check',
        status: user ? '✅ PASSED' : '❌ FAILED',
        details: user ? `User ID: ${user.id}` : `Auth error: ${authError?.message || 'No user found'}`,
        error: !user
      });

      // Test 2: Test Edge Function ping
      results.push({
        test: 'Edge Function Ping',
        status: '🔍 Testing...',
        details: 'Calling admin-ai-chat function with simple action'
      });

      try {
        const { data: pingResponse, error: pingError } = await supabase.functions.invoke('admin-ai-chat', {
          body: { action: 'ping' }
        });

        results.push({
          test: 'Edge Function Ping',
          status: pingError ? '❌ FAILED' : '✅ PASSED',
          details: pingError ? `Error: ${pingError.message}` : `Response: ${JSON.stringify(pingResponse)}`,
          error: !!pingError
        });
      } catch (error) {
        results.push({
          test: 'Edge Function Ping',
          status: '❌ FAILED',
          details: `Exception: ${error}`,
          error: true
        });
      }

      // Test 3: Test get_conversations action
      results.push({
        test: 'Get Conversations',
        status: '🔍 Testing...',
        details: 'Testing get_conversations action'
      });

      try {
        const { data: conversationsResponse, error: conversationsError } = await supabase.functions.invoke('admin-ai-chat', {
          body: { action: 'get_conversations' }
        });

        results.push({
          test: 'Get Conversations',
          status: conversationsError ? '❌ FAILED' : '✅ PASSED',
          details: conversationsError ? 
            `Error: ${conversationsError.message}` : 
            `Found ${conversationsResponse?.conversations?.length || 0} conversations`,
          error: !!conversationsError
        });
      } catch (error) {
        results.push({
          test: 'Get Conversations',
          status: '❌ FAILED',
          details: `Exception: ${error}`,
          error: true
        });
      }

      // Test 4: Check admin_chat_conversations table access
      results.push({
        test: 'Database Table Access',
        status: '🔍 Testing...',
        details: 'Testing direct table access'
      });

      try {
        const { data: tableData, error: tableError } = await supabase
          .from('admin_chat_conversations')
          .select('id')
          .limit(1);

        results.push({
          test: 'Database Table Access',
          status: tableError ? '❌ FAILED' : '✅ PASSED',
          details: tableError ? 
            `Table error: ${tableError.message}` : 
            'Table accessible from client',
          error: !!tableError
        });
      } catch (error) {
        results.push({
          test: 'Database Table Access',
          status: '❌ FAILED',
          details: `Exception: ${error}`,
          error: true
        });
      }

    } finally {
      setIsRunning(false);
      setTestResults(results);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Chat Debug Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDebugTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Tests...' : 'Run Debug Tests'}
          </Button>

          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded border ${result.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
              >
                <div className="font-semibold">{result.test}</div>
                <div className="text-sm">{result.status}</div>
                <div className="text-xs text-gray-600 mt-1">{result.details}</div>
              </div>
            ))}
          </div>

          {testResults.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-800">Debug Summary:</h4>
              <ul className="text-sm text-blue-700 mt-2">
                <li>• Check browser console for detailed error messages</li>
                <li>• Verify Supabase environment variables are set</li>
                <li>• Ensure admin-ai-chat Edge Function is deployed</li>
                <li>• Check RLS policies on admin_chat_* tables</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

