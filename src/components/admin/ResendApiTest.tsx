import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const ResendApiTest = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runResendTest = async () => {
    if (!testEmail) {
      alert('Please enter your email address for testing');
      return;
    }

    setLoading(true);
    const results: any[] = [];

    try {
      // Step 1: Create test reservation
      console.log('🧪 Creating test reservation...');
      const testReservation = {
        customer_name: 'RESEND API Test',
        customer_email: testEmail,
        customer_phone: '+49123456789',
        reservation_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reservation_time: '19:00',
        party_size: 2,
        special_requests: `RESEND API test - ${new Date().toISOString()}`,
        status: 'pending',
        language_preference: 'en'
      };

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert([testReservation])
        .select()
        .single();

      if (reservationError) {
        results.push({
          step: 'Create Reservation',
          status: 'error',
          message: `Failed to create reservation: ${reservationError.message}`,
          timestamp: new Date().toISOString()
        });
      } else {
        results.push({
          step: 'Create Reservation',
          status: 'success',
          message: `✅ Test reservation created (ID: ${reservation.id})`,
          data: reservation,
          timestamp: new Date().toISOString()
        });

        // Step 2: Test RESEND API directly
        console.log('📧 Testing RESEND API...');
        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke(
            'send-reservation-confirmation',
            {
              body: {
                reservation: reservation,
                language: 'en'
              }
            }
          );

          if (emailError) {
            results.push({
              step: 'RESEND API Call',
              status: 'error',
              message: `❌ RESEND API failed: ${emailError.message}`,
              error: emailError,
              timestamp: new Date().toISOString()
            });
          } else {
            results.push({
              step: 'RESEND API Call',
              status: 'success',
              message: '✅ RESEND API working! Emails sent successfully',
              data: emailResult,
              timestamp: new Date().toISOString()
            });
          }
        } catch (emailError: any) {
          results.push({
            step: 'RESEND API Call',
            status: 'error',
            message: `❌ RESEND API error: ${emailError.message}`,
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error: any) {
      results.push({
        step: 'General Error',
        status: 'error',
        message: `Unexpected error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-6 h-6" />
          RESEND API Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Input Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
          <h3 className="font-semibold">Test RESEND Email Integration</h3>
          <div className="space-y-2">
            <Label htmlFor="testEmail">Your Email Address (for testing)</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="your-email@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <p className="text-sm text-gray-600">
              You will receive a test reservation confirmation email at this address
            </p>
          </div>
          <Button 
            onClick={runResendTest} 
            disabled={loading || !testEmail}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Testing RESEND API...' : 'Test RESEND API Integration'}
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">RESEND API Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.step}</span>
                      <Badge className={getStatusBadge(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    <p className="text-xs text-gray-500">{result.timestamp}</p>
                  </div>
                </div>
                {result.data && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2">
                      View Response Data
                    </summary>
                    <pre className="p-2 bg-gray-100 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
                {result.error && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-600 hover:text-red-800 mb-2">
                      View Error Details
                    </summary>
                    <pre className="p-2 bg-red-50 rounded overflow-auto">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            {/* Email Check Instructions */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">📧 Email Check Instructions</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Customer Email:</strong> Check <code>{testEmail}</code> for reservation confirmation</p>
                <p><strong>Admin Email:</strong> Check <code>einfachlami@gmail.com</code> for admin notification</p>
                <p><strong>Timeline:</strong> Emails should arrive within 1-3 minutes</p>
                <p><strong>Check:</strong> Inbox and spam/junk folders</p>
                <p><strong>Content:</strong> Should include reservation details and professional formatting</p>
              </div>
            </div>

            {/* Troubleshooting Guide */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">🔧 RESEND API Troubleshooting</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <div><strong>No emails received:</strong> Check RESEND_API_KEY in Supabase Edge Functions environment variables</div>
                <div><strong>API errors:</strong> Go to Supabase → Edge Functions → send-reservation-confirmation → Logs</div>
                <div><strong>Domain issues:</strong> Verify myfckingbreakfastclub.com domain in RESEND dashboard</div>
                <div><strong>Rate limits:</strong> Check RESEND dashboard for sending limits or quota exceeded</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResendApiTest;


