import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export const AdminLoginTest = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    const results: any[] = [];

    try {
      // Test 1: Check if admin_users table exists
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('admin_users')
          .select('count')
          .limit(1);

        if (tableError) {
          results.push({
            test: 'Table Existence',
            status: '❌ FAILED',
            details: `Error: ${tableError.message}`,
            error: true
          });
        } else {
          results.push({
            test: 'Table Existence',
            status: '✅ PASSED',
            details: 'admin_users table accessible',
            error: false
          });
        }
      } catch (error) {
        results.push({
          test: 'Table Existence',
          status: '❌ FAILED',
          details: `Exception: ${error}`,
          error: true
        });
      }

      // Test 2: Check admin user data
      try {
        const { data: adminUsers, error: queryError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('username', 'Admin');

        if (queryError) {
          results.push({
            test: 'Admin User Query',
            status: '❌ FAILED',
            details: `Query error: ${queryError.message}`,
            error: true
          });
        } else if (!adminUsers || adminUsers.length === 0) {
          results.push({
            test: 'Admin User Query',
            status: '❌ FAILED',
            details: 'No admin user found with username "Admin"',
            error: true
          });
        } else {
          const adminUser = adminUsers[0];
          results.push({
            test: 'Admin User Query',
            status: '✅ PASSED',
            details: `Found admin user: ${adminUser.username}`,
            error: false
          });

          // Test 3: Check password hash format
          if (adminUser.password_hash) {
            const isBcryptHash = adminUser.password_hash.startsWith('$2a$') || 
                                adminUser.password_hash.startsWith('$2b$') ||
                                adminUser.password_hash.startsWith('$2x$') ||
                                adminUser.password_hash.startsWith('$2y$');
            const hashLength = adminUser.password_hash.length;
            const hashPrefix = adminUser.password_hash.substring(0, 4);
            
            results.push({
              test: 'Password Hash Format',
              status: isBcryptHash ? '✅ PASSED' : '❌ FAILED',
              details: `Hash prefix: ${hashPrefix}, Format: ${isBcryptHash ? 'bcrypt' : 'unknown'}, Length: ${hashLength}`,
              error: !isBcryptHash
            });

            // Test 4: Test password verification
            try {
              const testPassword = 'Lami@007';
              const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password_hash);
              
              results.push({
                test: 'Password Verification',
                status: isPasswordValid ? '✅ PASSED' : '❌ FAILED',
                details: `Password "Lami@007" ${isPasswordValid ? 'matches' : 'does not match'} stored hash`,
                error: !isPasswordValid
              });
            } catch (bcryptError) {
              results.push({
                test: 'Password Verification',
                status: '❌ FAILED',
                details: `Bcrypt error: ${bcryptError}`,
                error: true
              });
            }
          } else {
            results.push({
              test: 'Password Hash Format',
              status: '❌ FAILED',
              details: 'No password hash found',
              error: true
            });
          }
        }
      } catch (error) {
        results.push({
          test: 'Admin User Query',
          status: '❌ FAILED',
          details: `Exception: ${error}`,
          error: true
        });
      }

      // Test 5: Test connection to Supabase
      try {
        const { data, error } = await supabase.auth.getSession();
        results.push({
          test: 'Supabase Connection',
          status: '✅ PASSED',
          details: 'Successfully connected to Supabase',
          error: false
        });
      } catch (error) {
        results.push({
          test: 'Supabase Connection',
          status: '❌ FAILED',
          details: `Connection error: ${error}`,
          error: true
        });
      }

    } catch (error) {
      results.push({
        test: 'Overall Test',
        status: '❌ FAILED',
        details: `Unexpected error: ${error}`,
        error: true
      });
    }

    setTestResults(results);
    setIsRunning(false);

    // Show summary toast
    const passedTests = results.filter(r => !r.error).length;
    const totalTests = results.length;
    
    if (passedTests === totalTests) {
      toast({
        title: '🎉 All Tests Passed!',
        description: `Admin login system is working perfectly!`,
        variant: 'default'
      });
    } else {
      toast({
        title: '⚠️ Some Tests Failed',
        description: `${passedTests}/${totalTests} tests passed. Check results for details.`,
        variant: 'destructive'
      });
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">🔍 Admin Login System Test</CardTitle>
          <CardDescription>
            Run comprehensive tests to verify your admin login system is working properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Running Tests...' : '🧪 Run All Tests'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
              disabled={testResults.length === 0}
            >
              🗑️ Clear Results
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results:</h3>
              <div className="grid gap-3">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.error 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.test}</span>
                      <span className={`font-bold ${
                        result.error ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Summary:</h4>
                <p className="text-sm text-gray-600">
                  <strong>Passed:</strong> {testResults.filter(r => !r.error).length} | 
                  <strong>Failed:</strong> {testResults.filter(r => r.error).length} | 
                  <strong>Total:</strong> {testResults.length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
