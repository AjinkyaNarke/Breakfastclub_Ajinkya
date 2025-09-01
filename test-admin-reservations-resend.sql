-- ================================================================
-- TEST ADMIN RESERVATIONS & RESEND CONNECTION
-- ================================================================

-- 1. CHECK IF RESERVATIONS EXIST FOR ADMIN TO SEE
SELECT 
    '📊 ADMIN DASHBOARD DATA CHECK' as test_section,
    COUNT(*) as total_reservations,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - interval '7 days') as recent_reservations,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Admin should see reservation data'
        ELSE '❌ No reservations for admin to view'
    END as admin_visibility_status
FROM public.reservations;

-- 2. SHOW ACTUAL RESERVATIONS (what admin should see in dashboard)
SELECT 
    '📋 RESERVATIONS FOR ADMIN DASHBOARD' as section,
    id,
    customer_name,
    customer_email,
    reservation_date,
    reservation_time,
    party_size,
    status,
    special_requests,
    admin_notes,
    language_preference,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_timestamp
FROM public.reservations 
ORDER BY created_at DESC;

-- 3. CHECK ADMIN USER EXISTS (for login)
SELECT 
    '👤 ADMIN LOGIN CHECK' as section,
    username,
    CASE 
        WHEN password_hash IS NOT NULL THEN '✅ Can login to see reservations'
        ELSE '❌ Cannot login'
    END as login_status,
    created_at
FROM public.admin_users
WHERE username = 'Admin';

-- 4. TEST RLS POLICIES (admin access to reservations)
SELECT 
    '🔒 ADMIN ACCESS POLICIES' as section,
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname LIKE '%anyone%' OR policyname LIKE '%read%' OR policyname LIKE '%public%' 
        THEN '✅ Allows admin to see reservations'
        ELSE '⚠️ May block admin access'
    END as policy_effect
FROM pg_policies 
WHERE tablename = 'reservations' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 5. CREATE TEST RESERVATION TO CHECK RESEND CONNECTION
DO $$
DECLARE
    test_reservation_id uuid;
    test_email text := 'resend.connection.test@example.com';
BEGIN
    -- Insert test reservation that should trigger RESEND email
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
        'RESEND Connection Test',
        test_email,
        '+49123456789',
        CURRENT_DATE + interval '2 days',
        '19:30',
        4,
        'Testing RESEND API connection - ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        'pending',
        'en'
    ) RETURNING id INTO test_reservation_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST RESERVATION CREATED FOR RESEND CHECK';
    RAISE NOTICE '📧 Email should be sent to: %', test_email;
    RAISE NOTICE '📧 Admin notification should go to: einfachlami@gmail.com';
    RAISE NOTICE '🆔 Reservation ID: %', test_reservation_id;
    RAISE NOTICE '📋 This reservation should appear in admin dashboard';
    RAISE NOTICE '';
END $$;

-- 6. VERIFY TEST RESERVATION IS VISIBLE TO ADMIN
SELECT 
    '🧪 RESEND TEST RESERVATION' as section,
    id,
    customer_name,
    customer_email,
    reservation_date,
    reservation_time,
    status,
    created_at,
    '📧 Should have triggered RESEND emails' as email_status,
    '📋 Should be visible in admin panel' as admin_status
FROM public.reservations 
WHERE customer_email = 'resend.connection.test@example.com'
ORDER BY created_at DESC 
LIMIT 1;

-- 7. CHECK EDGE FUNCTION CONFIGURATION (indirect check)
SELECT 
    '⚙️ SYSTEM CONFIGURATION CHECK' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'reservations' AND table_schema = 'public'
        ) THEN '✅ Reservations table exists'
        ELSE '❌ Reservations table missing'
    END as table_status,
    
    CASE 
        WHEN has_table_privilege('anon', 'public.reservations', 'INSERT') 
        THEN '✅ Public can create reservations'
        ELSE '❌ Public cannot create reservations'
    END as public_insert_permission,
    
    CASE 
        WHEN has_table_privilege('authenticated', 'public.reservations', 'SELECT') 
        THEN '✅ Admin can read reservations'
        ELSE '❌ Admin cannot read reservations'
    END as admin_read_permission;

-- 8. ADMIN DASHBOARD SIMULATION
SELECT 
    '📊 ADMIN DASHBOARD STATS' as section,
    'Today: ' || COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE) as today_reservations,
    'Tomorrow: ' || COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE + 1) as tomorrow_reservations,
    'This Week: ' || COUNT(*) FILTER (WHERE reservation_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 6) as week_reservations,
    'Pending: ' || COUNT(*) FILTER (WHERE status = 'pending') as pending_status,
    'Confirmed: ' || COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_status,
    'Total: ' || COUNT(*) as total_count
FROM public.reservations;

-- 9. FINAL STATUS CHECK
SELECT 
    '🎯 FINAL STATUS REPORT' as section,
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM public.reservations) AND
            EXISTS (SELECT 1 FROM public.admin_users WHERE username = 'Admin') AND
            has_table_privilege('anon', 'public.reservations', 'INSERT') AND
            has_table_privilege('authenticated', 'public.reservations', 'SELECT')
        ) THEN '✅ ADMIN CAN SEE RESERVATIONS & RESEND SHOULD WORK'
        WHEN EXISTS (SELECT 1 FROM public.reservations) 
        THEN '⚠️ DATA EXISTS BUT CHECK ADMIN PERMISSIONS'
        ELSE '❌ NO RESERVATION DATA OR SYSTEM ISSUES'
    END as overall_system_status;

-- 10. TESTING INSTRUCTIONS
SELECT 
    '📝 MANUAL TESTING STEPS' as section,
    '1. Login to admin panel (Username: Admin, Password: admin123)' as step_1,
    '2. Go to Reservations Management page' as step_2,
    '3. Check if reservations from above queries are visible' as step_3,
    '4. Create new reservation from frontend with your email' as step_4,
    '5. Check your email inbox for RESEND confirmation' as step_5,
    '6. Check einfachlami@gmail.com for admin notification' as step_6;

-- Clean up test data (uncomment if needed)
-- DELETE FROM public.reservations WHERE customer_email = 'resend.connection.test@example.com';


