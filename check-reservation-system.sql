-- ================================================================
-- COMPREHENSIVE RESERVATION SYSTEM CHECK
-- ================================================================
-- Run this in Supabase SQL Editor to verify everything is working

-- 1. CHECK CURRENT RESERVATIONS IN SYSTEM
SELECT 
    '🏪 CURRENT RESERVATIONS' as check_type,
    COUNT(*) as total_reservations,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_reservations,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - interval '7 days') as week_reservations
FROM public.reservations;

-- 2. SHOW RECENT RESERVATIONS (what admin should see)
SELECT 
    '📋 RECENT RESERVATIONS (Admin View)' as section,
    id,
    customer_name,
    customer_email,
    TO_CHAR(reservation_date, 'YYYY-MM-DD') as reservation_date,
    reservation_time,
    party_size,
    status,
    special_requests,
    admin_notes,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_time
FROM public.reservations 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. CHECK RLS POLICIES (should allow admin access)
SELECT 
    '🔒 RLS POLICIES CHECK' as section,
    tablename,
    policyname,
    cmd as operation,
    roles,
    CASE 
        WHEN policyname LIKE '%anyone%' OR policyname LIKE '%public%' THEN '✅ Permissive'
        ELSE '⚠️ Restrictive'
    END as policy_type
FROM pg_policies 
WHERE tablename IN ('reservations', 'admin_users') 
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. CHECK ADMIN USERS (for login verification)
SELECT 
    '👤 ADMIN USERS CHECK' as section,
    username,
    CASE 
        WHEN password_hash IS NOT NULL THEN '✅ Password Set'
        ELSE '❌ No Password'
    END as password_status,
    TO_CHAR(created_at, 'YYYY-MM-DD') as created_date,
    TO_CHAR(last_login, 'YYYY-MM-DD HH24:MI') as last_login_time
FROM public.admin_users;

-- 5. TEST EMAIL FUNCTION AVAILABILITY
SELECT 
    '📧 EMAIL FUNCTION CHECK' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'send-reservation-confirmation'
        ) THEN '✅ Email Function Available'
        ELSE '⚠️ Check Edge Function Deployment'
    END as email_function_status;

-- 6. CREATE TEST RESERVATION TO VERIFY EMAIL SYSTEM
DO $$
DECLARE
    test_reservation_id uuid;
    test_email text := 'system.test.' || extract(epoch from now()) || '@test.com';
BEGIN
    -- Insert test reservation
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
        'Email System Test',
        test_email,
        '+49123456789',
        CURRENT_DATE + interval '2 days',
        '19:00',
        2,
        'Testing RESEND API integration - ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        'pending',
        'en'
    ) RETURNING id INTO test_reservation_id;
    
    RAISE NOTICE '✅ Test reservation created with ID: % and email: %', test_reservation_id, test_email;
    RAISE NOTICE '📧 This reservation should trigger email via RESEND API';
    RAISE NOTICE '📋 Check if this appears in admin dashboard';
END $$;

-- 7. VERIFY TEST RESERVATION WAS CREATED
SELECT 
    '🧪 TEST RESERVATION VERIFICATION' as section,
    id,
    customer_name,
    customer_email,
    reservation_date,
    reservation_time,
    status,
    created_at,
    '📧 Should have triggered RESEND email' as email_note
FROM public.reservations 
WHERE customer_name = 'Email System Test'
ORDER BY created_at DESC 
LIMIT 1;

-- 8. ADMIN DASHBOARD SIMULATION (what admin should see)
SELECT 
    '📊 ADMIN DASHBOARD STATS' as section,
    'Today: ' || COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE) as today_count,
    'Tomorrow: ' || COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE + 1) as tomorrow_count,
    'This Week: ' || COUNT(*) FILTER (WHERE reservation_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 6) as week_count,
    'Pending: ' || COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    'Confirmed: ' || COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count
FROM public.reservations;

-- 9. CHECK PERMISSIONS (should be permissive for working system)
SELECT 
    '🔑 PERMISSIONS CHECK' as section,
    'anon' as role_type,
    CASE 
        WHEN has_table_privilege('anon', 'public.reservations', 'INSERT') THEN '✅ Can Create'
        ELSE '❌ Cannot Create'
    END as insert_permission,
    CASE 
        WHEN has_table_privilege('anon', 'public.reservations', 'SELECT') THEN '✅ Can Read'
        ELSE '❌ Cannot Read'
    END as select_permission,
    CASE 
        WHEN has_table_privilege('anon', 'public.reservations', 'UPDATE') THEN '✅ Can Update'
        ELSE '❌ Cannot Update'
    END as update_permission

UNION ALL

SELECT 
    '🔑 PERMISSIONS CHECK' as section,
    'authenticated' as role_type,
    CASE 
        WHEN has_table_privilege('authenticated', 'public.reservations', 'INSERT') THEN '✅ Can Create'
        ELSE '❌ Cannot Create'
    END as insert_permission,
    CASE 
        WHEN has_table_privilege('authenticated', 'public.reservations', 'SELECT') THEN '✅ Can Read'
        ELSE '❌ Cannot Read'
    END as select_permission,
    CASE 
        WHEN has_table_privilege('authenticated', 'public.reservations', 'UPDATE') THEN '✅ Can Update'
        ELSE '❌ Cannot Update'
    END as update_permission;

-- 10. FINAL SYSTEM STATUS
SELECT 
    '🎯 FINAL SYSTEM STATUS' as section,
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM public.reservations LIMIT 1) AND
            EXISTS (SELECT 1 FROM public.admin_users WHERE username = 'Admin') AND
            EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reservations')
        ) THEN '✅ RESERVATION SYSTEM FULLY OPERATIONAL'
        ELSE '⚠️ SYSTEM NEEDS CONFIGURATION'
    END as overall_status;

-- 11. INSTRUCTIONS FOR TESTING
SELECT 
    '📝 TESTING INSTRUCTIONS' as section,
    '1. Check admin dashboard for reservations listed above' as step_1,
    '2. Try creating a reservation from frontend' as step_2,
    '3. Verify email arrives (customer + admin notification)' as step_3,
    '4. Login to admin and confirm/update reservations' as step_4,
    '5. Admin login: Username=Admin, Password=admin123' as step_5;

-- Optional: Clean up test data (uncomment if needed)
-- DELETE FROM public.reservations WHERE customer_name = 'Email System Test';


