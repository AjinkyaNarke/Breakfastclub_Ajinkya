-- ================================================
-- TEST EMAIL FUNCTIONALITY WITH RESEND API
-- ================================================
-- Run this in Supabase SQL Editor after adding RESEND_API_KEY

-- Test 1: Create a test reservation to trigger email
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
    'Email Test Customer',
    'test@youremail.com',  -- Change this to your email for testing
    '+49123456789',
    CURRENT_DATE + interval '3 days',
    '20:00',
    2,
    'Testing email functionality with RESEND API',
    'pending',
    'en'
);

-- Test 2: Show the test reservation
SELECT 'EMAIL TEST RESERVATION' as test_name,
       id,
       customer_name,
       customer_email,
       reservation_date,
       reservation_time,
       party_size,
       status,
       created_at
FROM public.reservations 
WHERE customer_email = 'test@youremail.com'
ORDER BY created_at DESC 
LIMIT 1;

-- Test 3: Verify reservation exists for email testing
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.reservations WHERE customer_email = 'test@youremail.com')
        THEN '✅ Test reservation created - You can now test emails from frontend'
        ELSE '❌ No test reservation found'
    END as email_test_status;

-- Instructions for email testing:
-- 1. Go to your frontend reservation page
-- 2. Create a reservation with your real email
-- 3. Check if you receive confirmation email
-- 4. Check if admin receives notification at einfachlami@gmail.com

-- Cleanup (uncomment to remove test data after testing)
-- DELETE FROM public.reservations WHERE customer_email = 'test@youremail.com';


