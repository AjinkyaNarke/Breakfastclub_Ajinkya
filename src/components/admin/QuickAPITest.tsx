import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  details: string;
}

export const QuickAPITest = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runAPITests = async () => {
    setLoading(true);
    setResults([]);
    const testResults: TestResult[] = [];

    // Test 1: Frontend DEEPSEEK API Key
    try {
      testResults.push({
        test: 'Frontend DEEPSEEK API',
        status: 'pending',
        details: 'Testing frontend API key...'
      });
      setResults([...testResults]);

      const deepSeekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
      
      if (!deepSeekApiKey || deepSeekApiKey.includes('your_')) {
        testResults[testResults.length - 1] = {
          test: 'Frontend DEEPSEEK API',
          status: 'error',
          details: 'API key not configured or still using placeholder'
        };
      } else {
        // Test actual API call
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepSeekApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'Say "API test successful"' }],
            max_tokens: 10,
            temperature: 0.1
          })
        });

        if (response.ok) {
          const data = await response.json();
          testResults[testResults.length - 1] = {
            test: 'Frontend DEEPSEEK API',
            status: 'success',
            details: `✅ API working: ${data.choices?.[0]?.message?.content || 'Success'}`
          };
        } else {
          const errorText = await response.text();
          testResults[testResults.length - 1] = {
            test: 'Frontend DEEPSEEK API',
            status: 'error',
            details: `❌ API Error: ${response.status} - ${errorText.substring(0, 100)}`
          };
        }
      }
    } catch (error) {
      testResults[testResults.length - 1] = {
        test: 'Frontend DEEPSEEK API',
        status: 'error',
        details: `❌ Exception: ${error}`
      };
    }
    setResults([...testResults]);

    // Test 2: Backend DEEPSEEK via Supabase Edge Function
    try {
      testResults.push({
        test: 'Backend DEEPSEEK via Supabase',
        status: 'pending',
        details: 'Testing Supabase Edge Function with DEEPSEEK...'
      });
      setResults([...testResults]);

      const { data, error } = await supabase.functions.invoke('admin-ai-chat', {
        body: {
          message: 'Say "Backend API test successful" if you can read this.',
          conversation_id: `test-${Date.now()}`
        }
      });

      if (error) {
        testResults[testResults.length - 1] = {
          test: 'Backend DEEPSEEK via Supabase',
          status: 'error',
          details: `❌ Supabase Error: ${error.message}`
        };
      } else if (data?.response) {
        testResults[testResults.length - 1] = {
          test: 'Backend DEEPSEEK via Supabase',
          status: 'success',
          details: `✅ Backend working: ${data.response.substring(0, 50)}...`
        };
      } else {
        testResults[testResults.length - 1] = {
          test: 'Backend DEEPSEEK via Supabase',
          status: 'error',
          details: '❌ No response data received'
        };
      }
    } catch (error) {
      testResults[testResults.length - 1] = {
        test: 'Backend DEEPSEEK via Supabase',
        status: 'error',
        details: `❌ Exception: ${error}`
      };
    }
    setResults([...testResults]);

    // Test 3: Translation Service
    try {
      testResults.push({
        test: 'Translation Service',
        status: 'pending',
        details: 'Testing translation function...'
      });
      setResults([...testResults]);

      const { data, error } = await supabase.functions.invoke('ingredient-translate', {
        body: {
          text: 'test ingredient',
          target_language: 'de',
          context: 'ingredient_name'
        }
      });

      if (error) {
        testResults[testResults.length - 1] = {
          test: 'Translation Service',
          status: 'error',
          details: `❌ Translation Error: ${error.message}`
        };
      } else if (data?.translated_text) {
        testResults[testResults.length - 1] = {
          test: 'Translation Service',
          status: 'success',
          details: `✅ Translation working: "${data.translated_text}"`
        };
      } else {
        testResults[testResults.length - 1] = {
          test: 'Translation Service',
          status: 'error',
          details: '❌ No translation result received'
        };
      }
    } catch (error) {
      testResults[testResults.length - 1] = {
        test: 'Translation Service',
        status: 'error',
        details: `❌ Exception: ${error}`
      };
    }
    setResults([...testResults]);

    // Test 4: Environment Variables Check
    testResults.push({
      test: 'Environment Variables',
      status: 'success',
      details: `✅ Configured: DEEPSEEK=${!!import.meta.env.VITE_DEEPSEEK_API_KEY && !import.meta.env.VITE_DEEPSEEK_API_KEY.includes('your_')}, DEEPGRAM=${!!import.meta.env.VITE_DEEPGRAM_API_KEY && !import.meta.env.VITE_DEEPGRAM_API_KEY.includes('your_')}, SUPABASE=${!!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY}`
    });
    setResults([...testResults]);

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'pending': return 'text-blue-700 bg-blue-50 border-blue-200';
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
          <CardTitle>🔑 Quick API Keys Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runAPITests} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing APIs...' : 'Test API Keys with Supabase'}
          </Button>

          <div className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <span>{getStatusIcon(result.status)}</span>
                  <span>{result.test}</span>
                  <Badge variant="outline" className="ml-auto">
                    {result.status}
                  </Badge>
                </div>
                <div className="text-sm mt-1">{result.details}</div>
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold mb-2">📊 Test Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-green-600">Passed</div>
                  <div>{results.filter(r => r.status === 'success').length}</div>
                </div>
                <div>
                  <div className="font-medium text-red-600">Failed</div>
                  <div>{results.filter(r => r.status === 'error').length}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Total</div>
                  <div>{results.length}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
