-- ================================================================
-- TEST RESEND API KEY FUNCTIONALITY
-- ================================================================
-- This will create a test reservation and trigger the email system

-- 1. CREATE TEST RESERVATION TO TRIGGER RESEND
DO $$
DECLARE
    test_reservation_id uuid;
    test_email text := 'resend.api.test.' || extract(epoch from now()) || '@test.com';
    current_time timestamp := now();
BEGIN
    -- Insert test reservation that should trigger RESEND API
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
        'RESEND API Test User',
        test_email,
        '+49123456789',
        CURRENT_DATE + interval '1 day',
        '19:30',
        3,
        'URGENT: Testing RESEND API key integration - ' || to_char(current_time, 'YYYY-MM-DD HH24:MI:SS'),
        'pending',
        'en'
    ) RETURNING id INTO test_reservation_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 RESEND API TEST RESERVATION CREATED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📧 Test Email: %', test_email;
    RAISE NOTICE '🆔 Reservation ID: %', test_reservation_id;
    RAISE NOTICE '⏰ Created at: %', current_time;
    RAISE NOTICE '';
    RAISE NOTICE '📧 EXPECTED EMAILS:';
    RAISE NOTICE '1. Customer confirmation → %', test_email;
    RAISE NOTICE '2. Admin notification → einfachlami@gmail.com';
    RAISE NOTICE '';
    RAISE NOTICE '✅ If RESEND API key is working:';
    RAISE NOTICE '   - Both emails should be sent automatically';
    RAISE NOTICE '   - No errors in Supabase function logs';
    RAISE NOTICE '   - Emails arrive within 1-2 minutes';
    RAISE NOTICE '';
    RAISE NOTICE '❌ If RESEND API key is NOT working:';
    RAISE NOTICE '   - No emails will be sent';
    RAISE NOTICE '   - Check Supabase Edge Function logs for errors';
    RAISE NOTICE '   - Verify RESEND_API_KEY environment variable';
    RAISE NOTICE '';
END $$;

-- 2. VERIFY TEST RESERVATION WAS CREATED
SELECT 
    '🧪 RESEND TEST RESERVATION DETAILS' as section,
    id,
    customer_name,
    customer_email,
    reservation_date,
    reservation_time,
    party_size,
    special_requests,
    status,
    language_preference,
    created_at,
    '📧 Should trigger RESEND emails' as email_status
FROM public.reservations 
WHERE customer_name = 'RESEND API Test User'
ORDER BY created_at DESC 
LIMIT 1;

-- 3. CHECK RECENT RESERVATIONS (should include our test)
SELECT 
    '📋 RECENT RESERVATIONS (Including Test)' as section,
    customer_name,
    customer_email,
    reservation_date,
    status,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_time,
    CASE 
        WHEN customer_name = 'RESEND API Test User' THEN '🧪 TEST RESERVATION'
        ELSE '👤 REAL CUSTOMER'
    END as reservation_type
FROM public.reservations 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. RESEND API CHECK INSTRUCTIONS
SELECT 
    '📧 RESEND API CHECK INSTRUCTIONS' as section,
    'Step 1: Check your email logs in RESEND dashboard' as instruction_1,
    'Step 2: Go to Supabase → Edge Functions → send-reservation-confirmation → Logs' as instruction_2,
    'Step 3: Look for recent function invocations (last 5 minutes)' as instruction_3,
    'Step 4: Check for any error messages in the logs' as instruction_4,
    'Step 5: Verify emails actually arrived (check spam folder too)' as instruction_5;

-- 5. SIMULATE FRONTEND RESERVATION CREATION
DO $$
DECLARE
    frontend_test_id uuid;
    frontend_email text := 'frontend.test.' || extract(epoch from now()) || '@example.com';
BEGIN
    -- This simulates what happens when someone fills out the reservation form
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
        'Frontend Test Customer',
        frontend_email,
        '+49987654321',
        CURRENT_DATE + interval '2 days',
        '20:00',
        4,
        'Testing complete frontend → RESEND flow',
        'pending',
        'en'
    ) RETURNING id INTO frontend_test_id;
    
    RAISE NOTICE '🌐 FRONTEND SIMULATION RESERVATION';
    RAISE NOTICE '==================================';
    RAISE NOTICE '📧 Customer Email: %', frontend_email;
    RAISE NOTICE '🆔 Reservation ID: %', frontend_test_id;
    RAISE NOTICE '📧 This should also trigger RESEND emails';
    RAISE NOTICE '';
END $$;

-- 6. CHECK SYSTEM CONFIGURATION
SELECT 
    '⚙️ SYSTEM CONFIGURATION CHECK' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.reservations WHERE created_at >= NOW() - interval '5 minutes')
        THEN '✅ New reservations being created successfully'
        ELSE '⚠️ No recent reservations created'
    END as reservation_creation,
    
    CASE 
        WHEN has_table_privilege('anon', 'public.reservations', 'INSERT')
        THEN '✅ Public can create reservations (frontend works)'
        ELSE '❌ Public cannot create reservations (frontend broken)'
    END as frontend_access,
    
    'Check Supabase Dashboard → Edge Functions for RESEND_API_KEY' as api_key_location,
    'einfachlami@gmail.com' as admin_notification_email;

-- 7. RESEND API TROUBLESHOOTING GUIDE
SELECT 
    '🔧 RESEND API TROUBLESHOOTING' as section,
    'Issue: No emails received' as problem_1,
    'Solution: Check RESEND_API_KEY in Supabase Edge Functions env vars' as solution_1,
    'Issue: Emails rejected' as problem_2,
    'Solution: Verify domain myfckingbreakfastclub.com in RESEND dashboard' as solution_2,
    'Issue: Function errors' as problem_3,
    'Solution: Check Supabase Edge Function logs for specific error messages' as solution_3;

-- 8. FINAL RESEND STATUS CHECK
SELECT 
    '🎯 RESEND API STATUS VERIFICATION' as section,
    COUNT(*) as total_test_reservations_created,
    COUNT(*) FILTER (WHERE created_at >= NOW() - interval '10 minutes') as recent_tests,
    'Check your email inbox and spam folder' as email_check,
    'Check einfachlami@gmail.com for admin notifications' as admin_check,
    'If no emails arrive in 3-5 minutes, RESEND API key may not be working' as timeout_warning
FROM public.reservations 
WHERE customer_name IN ('RESEND API Test User', 'Frontend Test Customer');

-- Optional cleanup (uncomment to remove test data)
-- DELETE FROM public.reservations WHERE customer_name IN ('RESEND API Test User', 'Frontend Test Customer');


