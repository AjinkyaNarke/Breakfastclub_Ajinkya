import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  details: string;
  error?: boolean;
}

export const AdminSystemTest = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runSystemTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);
    const totalTests = 15; // Updated test count
    let completedTests = 0;

    const updateProgress = () => {
      completedTests++;
      setProgress((completedTests / totalTests) * 100);
    };

    const addResult = (result: TestResult) => {
      setTestResults(prev => [...prev, result]);
      updateProgress();
    };

    try {
      // Test 1: Database Connection
      setCurrentTest('Testing Database Connection...');
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('count')
          .limit(1);
        
        addResult({
          test: 'Database Connection',
          status: error ? 'error' : 'success',
          details: error ? `Failed: ${error.message}` : 'Connected successfully',
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Database Connection',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 2: DEEPSEEK API Key Test (Frontend)
      setCurrentTest('Testing DEEPSEEK API Key (Frontend)...');
      try {
        const deepSeekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
        
        if (!deepSeekApiKey) {
          addResult({
            test: 'DEEPSEEK API Key (Frontend)',
            status: 'warning',
            details: 'VITE_DEEPSEEK_API_KEY not configured in environment',
            error: false
          });
        } else {
          // Test the API key with a simple request
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${deepSeekApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                {
                  role: 'user',
                  content: 'Say "API test successful" if you can read this.'
                }
              ],
              max_tokens: 10,
              temperature: 0.1
            })
          });

          if (response.ok) {
            const data = await response.json();
            addResult({
              test: 'DEEPSEEK API Key (Frontend)',
              status: 'success',
              details: `API key valid, response: ${data.choices?.[0]?.message?.content || 'Success'}`,
              error: false
            });
          } else {
            const errorText = await response.text();
            addResult({
              test: 'DEEPSEEK API Key (Frontend)',
              status: 'error',
              details: `API request failed: ${response.status} - ${errorText}`,
              error: true
            });
          }
        }
      } catch (err) {
        addResult({
          test: 'DEEPSEEK API Key (Frontend)',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 3: DEEPSEEK API Key Test (Backend/Supabase)
      setCurrentTest('Testing DEEPSEEK API Key (Backend)...');
      try {
        const { data, error } = await supabase.functions.invoke('admin-ai-chat', {
          body: {
            message: 'API test - respond with "Backend API working" if you can read this.',
            conversation_id: 'test-' + Date.now()
          }
        });

        if (error) {
          addResult({
            test: 'DEEPSEEK API Key (Backend)',
            status: 'error',
            details: `Supabase function error: ${error.message}`,
            error: true
          });
        } else if (data && data.response) {
          addResult({
            test: 'DEEPSEEK API Key (Backend)',
            status: 'success',
            details: `Backend API working, response: ${data.response.substring(0, 100)}...`,
            error: false
          });
        } else {
          addResult({
            test: 'DEEPSEEK API Key (Backend)',
            status: 'warning',
            details: 'Function responded but no response data',
            error: false
          });
        }
      } catch (err) {
        addResult({
          test: 'DEEPSEEK API Key (Backend)',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 4: Menu Items Table
      setCurrentTest('Testing Menu Items Table...');
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('id, name, category_id')
          .limit(5);
        
        addResult({
          test: 'Menu Items Table',
          status: error ? 'error' : 'success',
          details: error ? `Failed: ${error.message}` : `Found ${data?.length || 0} menu items`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Menu Items Table',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 5: Ingredients Table
      setCurrentTest('Testing Ingredients Table...');
      try {
        const { data, error } = await supabase
          .from('ingredients')
          .select('id, name, category_id')
          .limit(5);
        
        addResult({
          test: 'Ingredients Table',
          status: error ? 'error' : 'success',
          details: error ? `Failed: ${error.message}` : `Found ${data?.length || 0} ingredients`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Ingredients Table',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 6: Reservations Table
      setCurrentTest('Testing Reservations Table...');
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('id, customer_name, status')
          .limit(5);
        
        addResult({
          test: 'Reservations Table',
          status: error ? 'error' : 'success',
          details: error ? `Failed: ${error.message}` : `Found ${data?.length || 0} reservations`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Reservations Table',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 7: Gallery Images Table
      setCurrentTest('Testing Gallery Images...');
      try {
        const { data, error } = await supabase
          .from('gallery_images')
          .select('id, title, image_url')
          .limit(3);
        
        addResult({
          test: 'Gallery Images',
          status: error ? 'error' : 'success',
          details: error ? `Failed: ${error.message}` : `Found ${data?.length || 0} gallery images`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Gallery Images',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 8: Events Table
      setCurrentTest('Testing Events Table...');
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, event_date')
          .limit(3);
        
        addResult({
          test: 'Events Table',
          status: error ? 'error' : 'success',
          details: error ? `Failed: ${error.message}` : `Found ${data?.length || 0} events`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Events Table',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 9: Press Articles Table
      setCurrentTest('Testing Press Articles...');
      try {
        const { data, error } = await supabase
          .from('press_articles')
          .select('id, title, publication_date')
          .limit(3);
        
        addResult({
          test: 'Press Articles',
          status: error ? 'error' : 'success',
          details: error ? `Failed: ${error.message}` : `Found ${data?.length || 0} press articles`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Press Articles',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 10: Content Management
      setCurrentTest('Testing Content Management...');
      try {
        const { data, error } = await supabase
          .from('content_pages')
          .select('id, page_key, language')
          .limit(3);
        
        addResult({
          test: 'Content Management',
          status: error ? 'error' : 'success',
          details: error ? `Failed: ${error.message}` : `Found ${data?.length || 0} content entries`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Content Management',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 11: Prep Management
      setCurrentTest('Testing Prep Management...');
      try {
        const { data, error } = await supabase
          .from('preps')
          .select('id, name, prep_category')
          .limit(3);
        
        addResult({
          test: 'Prep Management',
          status: error ? 'error' : 'success',
          details: error ? `Failed: ${error.message}` : `Found ${data?.length || 0} prep items`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Prep Management',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 12: Translation Function Test
      setCurrentTest('Testing Translation Services...');
      try {
        const { data, error } = await supabase.functions.invoke('ingredient-translate', {
          body: {
            text: 'test ingredient',
            target_language: 'de',
            context: 'ingredient_name'
          }
        });

        addResult({
          test: 'Translation Services',
          status: error ? 'error' : 'success',
          details: error ? `Translation failed: ${error.message}` : `Translation working: ${data?.translated_text || 'Success'}`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Translation Services',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 13: Admin Chat Function
      setCurrentTest('Testing Admin Chat AI...');
      try {
        const { data, error } = await supabase.functions.invoke('admin-ai-chat', {
          body: {
            message: 'Hello, this is a test message. Please respond briefly.',
            conversation_id: 'test-admin-' + Date.now()
          }
        });

        addResult({
          test: 'Admin Chat AI',
          status: error ? 'error' : 'success',
          details: error ? `Chat failed: ${error.message}` : `Chat working: ${data?.response?.substring(0, 50) || 'Success'}...`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Admin Chat AI',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 14: Image Generation Service
      setCurrentTest('Testing Image Generation...');
      try {
        const { data, error } = await supabase.functions.invoke('generate-recipe-image', {
          body: {
            recipe_name: 'Test Dish',
            ingredients: ['test ingredient'],
            style: 'professional'
          }
        });

        addResult({
          test: 'Image Generation',
          status: error ? 'error' : 'success',
          details: error ? `Image gen failed: ${error.message}` : `Image generation working`,
          error: !!error
        });
      } catch (err) {
        addResult({
          test: 'Image Generation',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

      // Test 15: Environment Configuration
      setCurrentTest('Testing Environment Configuration...');
      try {
        const envTests = {
          supabase_url: !!import.meta.env.VITE_SUPABASE_URL,
          supabase_anon_key: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          deepseek_api_key: !!import.meta.env.VITE_DEEPSEEK_API_KEY,
          deepgram_api_key: !!import.meta.env.VITE_DEEPGRAM_API_KEY
        };

        const configuredCount = Object.values(envTests).filter(Boolean).length;
        const envStatus = configuredCount === 4 ? 'success' : configuredCount >= 2 ? 'warning' : 'error';

        addResult({
          test: 'Environment Configuration',
          status: envStatus,
          details: `${configuredCount}/4 environment variables configured: ${Object.entries(envTests).filter(([, value]) => value).map(([key]) => key).join(', ')}`,
          error: envStatus === 'error'
        });
      } catch (err) {
        addResult({
          test: 'Environment Configuration',
          status: 'error',
          details: `Exception: ${err}`,
          error: true
        });
      }

    } catch (error) {
      addResult({
        test: 'System Error',
        status: 'error',
        details: `Unexpected error: ${error}`,
        error: true
      });
    }

    setCurrentTest('Tests Complete');
    setProgress(100);
    setIsRunning(false);

    // Show summary toast
    const passedTests = testResults.filter(r => !r.error).length;
    const totalCompletedTests = testResults.length;
    
    if (passedTests === totalCompletedTests) {
      toast({
        title: '🎉 All Systems Operational!',
        description: `All ${totalCompletedTests} tests passed. System is working perfectly!`,
        variant: 'default'
      });
    } else {
      toast({
        title: '⚠️ System Issues Detected',
        description: `${passedTests}/${totalCompletedTests} tests passed. Check results for details.`,
        variant: 'destructive'
      });
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setProgress(0);
    setCurrentTest('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'pending': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 System Diagnostics & DEEPSEEK API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runSystemTests} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? 'Running Tests...' : 'Run Complete System Test'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={isRunning}
            >
              Clear Results
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{currentTest}</p>
            </div>
          )}

          <div className="space-y-3">
            {testResults.map((result, index) => (
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

          {testResults.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold mb-2">📊 Test Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-green-600">Passed</div>
                  <div>{testResults.filter(r => r.status === 'success').length}</div>
                </div>
                <div>
                  <div className="font-medium text-red-600">Failed</div>
                  <div>{testResults.filter(r => r.status === 'error').length}</div>
                </div>
                <div>
                  <div className="font-medium text-yellow-600">Warnings</div>
                  <div>{testResults.filter(r => r.status === 'warning').length}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Total</div>
                  <div>{testResults.length}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
