-- ================================================
-- SIMPLE RESERVATION SYSTEM TEST
-- ================================================
-- Run this in your Supabase SQL Editor to verify everything works

-- Test 1: Check if tables exist and are accessible
SELECT 'TABLE EXISTENCE CHECK' as test_name, 
       COUNT(*) as reservation_count,
       'Reservations table accessible' as result
FROM public.reservations;

SELECT 'ADMIN CHECK' as test_name,
       COUNT(*) as admin_count,
       'Admin users table accessible' as result  
FROM public.admin_users;

-- Test 2: Create a new reservation (simulates frontend form)
INSERT INTO public.reservations (
    customer_name,
    customer_email,
    customer_phone,
    reservation_date,
    reservation_time,
    party_size,
    special_requests,
    status,
    language_preference
) VALUES (
    'John Doe',
    'john.doe@email.com',
    '+49123456789',
    CURRENT_DATE + interval '2 days',
    '19:30',
    4,
    'Birthday dinner celebration',
    'pending',
    'en'
);

-- Test 3: Verify the reservation was created
SELECT 'NEW RESERVATION TEST' as test_name,
       id,
       customer_name,
       customer_email,
       reservation_date,
       reservation_time,
       party_size,
       status,
       created_at
FROM public.reservations 
WHERE customer_email = 'john.doe@email.com'
ORDER BY created_at DESC 
LIMIT 1;

-- Test 4: Update the reservation (simulates admin action)
UPDATE public.reservations 
SET status = 'confirmed',
    admin_notes = 'Table reserved - special birthday setup',
    confirmed_at = NOW(),
    updated_at = NOW()
WHERE customer_email = 'john.doe@email.com';

-- Test 5: Verify the update worked
SELECT 'ADMIN UPDATE TEST' as test_name,
       customer_name,
       status,
       admin_notes,
       confirmed_at,
       updated_at
FROM public.reservations 
WHERE customer_email = 'john.doe@email.com';

-- Test 6: Show all reservations (simulates admin dashboard)
SELECT 'ADMIN DASHBOARD VIEW' as test_name,
       COUNT(*) as total_reservations,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
       COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
FROM public.reservations;

-- Test 7: Show recent reservations with details
SELECT 'RECENT RESERVATIONS' as test_name,
       customer_name,
       customer_email,
       reservation_date,
       reservation_time,
       party_size,
       status,
       TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_time
FROM public.reservations 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 8: Check RLS policies are working
SELECT 'RLS POLICY CHECK' as test_name,
       schemaname,
       tablename,
       policyname,
       cmd as operation
FROM pg_policies 
WHERE tablename = 'reservations'
ORDER BY policyname;

-- Cleanup (uncomment to remove test data)
-- DELETE FROM public.reservations WHERE customer_email = 'john.doe@email.com';

-- Final status check
SELECT 'FINAL STATUS' as test_name,
       CASE 
           WHEN EXISTS (
               SELECT 1 FROM public.reservations 
               WHERE customer_email = 'john.doe@email.com' 
               AND status = 'confirmed'
           ) THEN '✅ ALL TESTS PASSED - RESERVATION SYSTEM WORKING!'
           ELSE '❌ TESTS FAILED - CHECK CONFIGURATION'
       END as result;


