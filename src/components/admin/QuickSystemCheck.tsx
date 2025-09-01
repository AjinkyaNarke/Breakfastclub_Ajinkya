import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Database, Mail, Users } from 'lucide-react';

interface QuickCheckResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export const QuickSystemCheck = () => {
  const [results, setResults] = useState<QuickCheckResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runQuickCheck = async () => {
    setLoading(true);
    const checkResults: QuickCheckResult[] = [];

    try {
      // 1. Check if we can fetch reservations (admin view)
      console.log('🔍 Testing admin reservation access...');
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (reservationError) {
        checkResults.push({
          test: 'Admin Reservation Access',
          status: 'error',
          message: `Cannot fetch reservations: ${reservationError.message}`,
        });
      } else {
        checkResults.push({
          test: 'Admin Reservation Access',
          status: 'success',
          message: `✅ Found ${reservations.length} reservations in admin view`,
          data: reservations.slice(0, 3) // Show first 3
        });
      }

      // 2. Test creating a reservation (simulates frontend)
      console.log('🔍 Testing reservation creation...');
      const testReservation = {
        customer_name: 'System Check User',
        customer_email: `check.${Date.now()}@test.com`,
        customer_phone: '+49123456789',
        reservation_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reservation_time: '19:00',
        party_size: 2,
        special_requests: 'System check - testing RESEND integration',
        status: 'pending',
        language_preference: 'en'
      };

      const { data: newReservation, error: createError } = await supabase
        .from('reservations')
        .insert([testReservation])
        .select()
        .single();

      if (createError) {
        checkResults.push({
          test: 'Reservation Creation',
          status: 'error',
          message: `Cannot create reservation: ${createError.message}`,
        });
      } else {
        checkResults.push({
          test: 'Reservation Creation',
          status: 'success',
          message: `✅ Reservation created successfully (ID: ${newReservation.id})`,
          data: newReservation
        });

        // 3. Test RESEND email function
        console.log('🔍 Testing RESEND email function...');
        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke(
            'send-reservation-confirmation',
            {
              body: {
                reservation: newReservation,
                language: 'en'
              }
            }
          );

          if (emailError) {
            checkResults.push({
              test: 'RESEND Email Function',
              status: 'error',
              message: `RESEND failed: ${emailError.message}`,
            });
          } else {
            checkResults.push({
              test: 'RESEND Email Function',
              status: 'success',
              message: `✅ RESEND API working! Emails sent successfully`,
              data: emailResult
            });
          }
        } catch (emailError: any) {
          checkResults.push({
            test: 'RESEND Email Function',
            status: 'error',
            message: `RESEND error: ${emailError.message}`,
          });
        }

        // 4. Test updating reservation (admin function)
        console.log('🔍 Testing admin update functionality...');
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ 
            status: 'confirmed',
            admin_notes: 'System check - confirmed via test'
          })
          .eq('id', newReservation.id);

        if (updateError) {
          checkResults.push({
            test: 'Admin Update Function',
            status: 'error',
            message: `Cannot update reservation: ${updateError.message}`,
          });
        } else {
          checkResults.push({
            test: 'Admin Update Function',
            status: 'success',
            message: `✅ Admin can update reservations successfully`,
          });
        }
      }

      // 5. Check admin user access
      console.log('🔍 Testing admin user access...');
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('username, created_at')
        .limit(1);

      if (adminError) {
        checkResults.push({
          test: 'Admin User Access',
          status: 'warning',
          message: `Admin table access issue: ${adminError.message}`,
        });
      } else {
        checkResults.push({
          test: 'Admin User Access',
          status: 'success',
          message: `✅ Admin system accessible (${adminUsers.length} admin users)`,
          data: adminUsers
        });
      }

    } catch (error: any) {
      checkResults.push({
        test: 'System Error',
        status: 'error',
        message: `Unexpected error: ${error.message}`,
      });
    }

    setResults(checkResults);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return null;
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-6 h-6" />
          Admin Reservations & RESEND Quick Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runQuickCheck} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Running System Check...' : 'Check Admin Dashboard & RESEND Connection'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">System Check Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{result.test}</span>
                      <Badge className={getStatusBadge(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          View Data
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5" />
                RESEND Email Check
              </h4>
              <p className="text-sm text-gray-700">
                If RESEND is working, you should receive:
              </p>
              <ul className="text-sm text-gray-600 mt-1 ml-4">
                <li>• Customer confirmation email at the test email address</li>
                <li>• Admin notification email at <strong>einfachlami@gmail.com</strong></li>
                <li>• Both emails should have proper HTML formatting and reservation details</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                Admin Dashboard Check
              </h4>
              <p className="text-sm text-gray-700">
                Go to your admin reservations page and verify:
              </p>
              <ul className="text-sm text-gray-600 mt-1 ml-4">
                <li>• All test reservations appear in the list</li>
                <li>• You can see customer names, emails, dates, and status</li>
                <li>• You can update reservation status and add notes</li>
                <li>• Recent reservations show at the top</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickSystemCheck;


