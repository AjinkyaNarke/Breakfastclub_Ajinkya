// Direct test of reservation system
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReservationSystem() {
  console.log('🧪 Testing Reservation System...');
  console.log('==================================');

  try {
    // Test 1: Check if we can access reservations table
    console.log('\n1. Testing table access...');
    const { data: tableTest, error: tableError } = await supabase
      .from('reservations')
      .select('id', { count: 'exact' });

    if (tableError) {
      console.log('❌ Table access failed:', tableError.message);
    } else {
      console.log(`✅ Table accessible - ${tableTest.length} existing reservations`);
    }

    // Test 2: Try to create a reservation (public access)
    console.log('\n2. Testing reservation creation...');
    const testReservation = {
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '+491234567890',
      reservation_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reservation_time: '19:00',
      party_size: 2,
      special_requests: 'Test reservation',
      status: 'pending',
      language_preference: 'en'
    };

    const { data: createdReservation, error: createError } = await supabase
      .from('reservations')
      .insert([testReservation])
      .select()
      .single();

    if (createError) {
      console.log('❌ Reservation creation failed:', createError.message);
      return;
    } else {
      console.log(`✅ Reservation created successfully! ID: ${createdReservation.id}`);
    }

    // Test 3: Try to read the created reservation
    console.log('\n3. Testing reservation reading...');
    const { data: readReservation, error: readError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', createdReservation.id)
      .single();

    if (readError) {
      console.log('❌ Reservation reading failed:', readError.message);
    } else {
      console.log('✅ Reservation reading successful:', {
        id: readReservation.id,
        customer_name: readReservation.customer_name,
        status: readReservation.status
      });
    }

    // Test 4: Try to update the reservation
    console.log('\n4. Testing reservation update...');
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update({ 
        status: 'confirmed',
        admin_notes: 'Confirmed via direct test'
      })
      .eq('id', createdReservation.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Reservation update failed:', updateError.message);
    } else {
      console.log('✅ Reservation update successful:', {
        id: updatedReservation.id,
        status: updatedReservation.status,
        admin_notes: updatedReservation.admin_notes
      });
    }

    // Test 5: Try to delete the test reservation (cleanup)
    console.log('\n5. Testing reservation deletion (cleanup)...');
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', createdReservation.id);

    if (deleteError) {
      console.log('❌ Reservation deletion failed:', deleteError.message);
    } else {
      console.log('✅ Reservation deletion successful (cleanup complete)');
    }

    // Test 6: Check admin_users table access
    console.log('\n6. Testing admin users access...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('username, created_at')
      .limit(1);

    if (adminError) {
      console.log('❌ Admin users access failed:', adminError.message);
    } else {
      console.log(`✅ Admin users accessible - ${adminUsers.length} admin(s) found`);
      if (adminUsers.length > 0) {
        console.log('  First admin:', adminUsers[0].username);
      }
    }

  } catch (error) {
    console.log('❌ Test failed with exception:', error.message);
  }

  console.log('\n==================================');
  console.log('🏁 Reservation system test complete');
}

// Run the test
testReservationSystem().catch(console.error);


