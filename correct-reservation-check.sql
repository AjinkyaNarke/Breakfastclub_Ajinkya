-- ================================================================
-- CORRECT RESERVATION SYSTEM CHECK (Fixed)
-- ================================================================
-- Run this in Supabase SQL Editor

-- 1. CHECK CURRENT RESERVATIONS
SELECT 
    '📋 CURRENT RESERVATIONS' as check_type,
    COUNT(*) as total_reservations,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_reservations
FROM public.reservations;

-- 2. SHOW LATEST RESERVATIONS (what admin should see)
SELECT 
    '📋 LATEST RESERVATIONS' as section,
    customer_name,
    customer_email,
    reservation_date,
    reservation_time,
    party_size,
    status,
    special_requests,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_time
FROM public.reservations 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. CHECK ADMIN USERS
SELECT 
    '👤 ADMIN USERS' as section,
    username,
    CASE 
        WHEN password_hash IS NOT NULL THEN '✅ Password Set'
        ELSE '❌ No Password'
    END as password_status,
    TO_CHAR(created_at, 'YYYY-MM-DD') as created_date
FROM public.admin_users;

-- 4. CHECK RLS POLICIES
SELECT 
    '🔒 RLS POLICIES' as section,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname LIKE '%anyone%' OR policyname LIKE '%public%' THEN '✅ Permissive (Good)'
        ELSE '⚠️ May be restrictive'
    END as policy_assessment
FROM pg_policies 
WHERE tablename = 'reservations' AND schemaname = 'public'
ORDER BY policyname;

-- 5. CREATE TEST RESERVATION TO CHECK EMAIL SYSTEM
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
    'RESEND Test User',
    'resend.test@example.com',
    '+49123456789',
    CURRENT_DATE + interval '1 day',
    '20:00',
    2,
    'Testing RESEND API email integration',
    'pending',
    'en'
);

-- 6. VERIFY TEST RESERVATION WAS CREATED
SELECT 
    '🧪 RESEND TEST VERIFICATION' as section,
    customer_name,
    customer_email,
    reservation_date,
    status,
    created_at,
    '📧 Should trigger RESEND email if API key is working' as note
FROM public.reservations 
WHERE customer_email = 'resend.test@example.com'
ORDER BY created_at DESC 
LIMIT 1;

-- 7. CHECK PERMISSIONS (should be working for our system)
SELECT 
    '🔑 PERMISSION CHECK' as section,
    'Reservations Table' as table_name,
    CASE 
        WHEN has_table_privilege('anon', 'public.reservations', 'INSERT') THEN '✅ Public Can Create'
        ELSE '❌ Public Cannot Create'
    END as public_insert,
    CASE 
        WHEN has_table_privilege('anon', 'public.reservations', 'SELECT') THEN '✅ Can Read'
        ELSE '❌ Cannot Read'
    END as public_read,
    CASE 
        WHEN has_table_privilege('authenticated', 'public.reservations', 'UPDATE') THEN '✅ Admin Can Update'
        ELSE '❌ Admin Cannot Update'
    END as admin_update;

-- 8. SYSTEM STATUS SUMMARY
SELECT 
    '🎯 SYSTEM STATUS' as section,
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM public.reservations) AND
            EXISTS (SELECT 1 FROM public.admin_users WHERE username = 'Admin') AND
            has_table_privilege('anon', 'public.reservations', 'INSERT')
        ) THEN '✅ RESERVATION SYSTEM OPERATIONAL'
        ELSE '⚠️ SYSTEM NEEDS ATTENTION'
    END as overall_status;

-- 9. TESTING INSTRUCTIONS
SELECT 
    '📝 NEXT STEPS TO TEST' as section,
    '1. Check if test reservation appears in admin dashboard' as step_1,
    '2. Create reservation from frontend to test RESEND emails' as step_2,
    '3. Check your email inbox for confirmation' as step_3,
    '4. Check einfachlami@gmail.com for admin notification' as step_4,
    '5. Try updating reservation status in admin panel' as step_5;

-- Optional: Clean up test data (uncomment if needed)
-- DELETE FROM public.reservations WHERE customer_email = 'resend.test@example.com';


