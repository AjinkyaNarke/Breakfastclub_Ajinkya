import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Mail, Database, Users, Calendar } from 'lucide-react';

interface Reservation {
  id: string;
  customer_name: string;
  customer_email: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  created_at: string;
  special_requests?: string;
}

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export const ReservationSystemTest = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runSystemTests = async () => {
    setLoading(true);
    const results: TestResult[] = [];

    try {
      // Test 1: Check database connectivity
      results.push({
        name: "Database Connection",
        status: 'pending',
        message: "Testing connection..."
      });

      const { data: connectionTest, error: connectionError } = await supabase
        .from('reservations')
        .select('count', { count: 'exact' });

      if (connectionError) {
        results[0] = {
          name: "Database Connection",
          status: 'error',
          message: `Connection failed: ${connectionError.message}`
        };
      } else {
        results[0] = {
          name: "Database Connection",
          status: 'success',
          message: `✅ Connected to database`,
          data: { count: connectionTest.length }
        };
      }

      // Test 2: Fetch all reservations
      results.push({
        name: "Fetch Reservations",
        status: 'pending',
        message: "Loading reservations..."
      });

      const { data: reservationData, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        results[1] = {
          name: "Fetch Reservations",
          status: 'error',
          message: `Failed to fetch: ${fetchError.message}`
        };
      } else {
        setReservations(reservationData || []);
        results[1] = {
          name: "Fetch Reservations",
          status: 'success',
          message: `✅ Found ${reservationData?.length || 0} reservations`,
          data: reservationData
        };
      }

      // Test 3: Test admin permissions
      results.push({
        name: "Admin Permissions",
        status: 'pending',
        message: "Testing admin access..."
      });

      const { data: adminTest, error: adminError } = await supabase
        .from('admin_users')
        .select('username')
        .limit(1);

      if (adminError) {
        results[2] = {
          name: "Admin Permissions",
          status: 'error',
          message: `Admin access failed: ${adminError.message}`
        };
      } else {
        results[2] = {
          name: "Admin Permissions",
          status: 'success',
          message: `✅ Admin access working`,
          data: adminTest
        };
      }

      // Test 4: Create test reservation
      results.push({
        name: "Create Test Reservation",
        status: 'pending',
        message: "Creating test reservation..."
      });

      const testReservation = {
        customer_name: 'System Test User',
        customer_email: `test.${Date.now()}@example.com`,
        customer_phone: '+49123456789',
        reservation_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reservation_time: '19:00',
        party_size: 2,
        special_requests: 'System test - RESEND email should be triggered',
        status: 'pending',
        language_preference: 'en'
      };

      const { data: createdReservation, error: createError } = await supabase
        .from('reservations')
        .insert([testReservation])
        .select()
        .single();

      if (createError) {
        results[3] = {
          name: "Create Test Reservation",
          status: 'error',
          message: `Creation failed: ${createError.message}`
        };
      } else {
        results[3] = {
          name: "Create Test Reservation",
          status: 'success',
          message: `✅ Test reservation created (ID: ${createdReservation.id})`,
          data: createdReservation
        };

        // Test 5: Test email function (RESEND API)
        results.push({
          name: "RESEND Email Test",
          status: 'pending',
          message: "Testing email function..."
        });

        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke(
            'send-reservation-confirmation',
            {
              body: {
                reservation: createdReservation,
                language: 'en'
              }
            }
          );

          if (emailError) {
            results[4] = {
              name: "RESEND Email Test",
              status: 'error',
              message: `Email failed: ${emailError.message}`
            };
          } else {
            results[4] = {
              name: "RESEND Email Test",
              status: 'success',
              message: `✅ RESEND API working - emails sent!`,
              data: emailResult
            };
          }
        } catch (error: any) {
          results[4] = {
            name: "RESEND Email Test",
            status: 'error',
            message: `Email error: ${error.message}`
          };
        }

        // Refresh reservations to show new test reservation
        const { data: updatedReservations } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });
        
        setReservations(updatedReservations || []);
      }

    } catch (error: any) {
      results.push({
        name: "System Error",
        status: 'error',
        message: `Unexpected error: ${error.message}`
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            Reservation System Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runSystemTests} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Running Tests...' : 'Test Reservation System'}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-gray-600">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Current Reservations ({reservations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-gray-500">No reservations found. Run the test to create a sample reservation.</p>
          ) : (
            <div className="space-y-3">
              {reservations.slice(0, 10).map((reservation) => (
                <div key={reservation.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{reservation.customer_name}</h4>
                      <p className="text-sm text-gray-600">{reservation.customer_email}</p>
                    </div>
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span> {reservation.reservation_date}
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span> {reservation.reservation_time}
                    </div>
                    <div>
                      <span className="text-gray-500">Party:</span> {reservation.party_size}
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span> {new Date(reservation.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {reservation.special_requests && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Requests:</span> {reservation.special_requests}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReservationSystemTest;


