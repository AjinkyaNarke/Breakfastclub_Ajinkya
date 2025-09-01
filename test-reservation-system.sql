-- ===================================================
-- RESERVATION SYSTEM TEST SCRIPT
-- ===================================================
-- Run this in Supabase SQL Editor to test reservations

-- 1. CHECK TABLE STRUCTURE
SELECT 
    'TABLE STRUCTURE CHECK' as test_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. CHECK RLS POLICIES
SELECT 
    'RLS POLICIES CHECK' as test_type,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'reservations'
ORDER BY policyname;

-- 3. TEST RESERVATION CREATION (what customers do)
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
    'John Doe Test',
    'john.test@example.com',
    '+49123456789',
    CURRENT_DATE + interval '2 days',
    '18:30',
    4,
    'Test reservation from SQL',
    'pending',
    'en'
);

-- 4. VERIFY RESERVATION WAS CREATED
SELECT 
    'CREATED RESERVATIONS' as test_type,
    id,
    customer_name,
    customer_email,
    reservation_date,
    reservation_time,
    party_size,
    status,
    created_at
FROM public.reservations 
WHERE customer_email LIKE '%test%'
ORDER BY created_at DESC
LIMIT 5;

-- 5. TEST ADMIN OPERATIONS (what admin panel does)
-- Update a test reservation
UPDATE public.reservations 
SET status = 'confirmed',
    admin_notes = 'Confirmed via SQL test',
    confirmed_at = NOW()
WHERE customer_email = 'john.test@example.com';

-- 6. CHECK UPDATED RESERVATION
SELECT 
    'UPDATED RESERVATION' as test_type,
    customer_name,
    status,
    admin_notes,
    confirmed_at,
    updated_at
FROM public.reservations 
WHERE customer_email = 'john.test@example.com';

-- 7. COUNT ALL RESERVATIONS
SELECT 
    'RESERVATION COUNTS' as test_type,
    status,
    COUNT(*) as count
FROM public.reservations 
GROUP BY status
ORDER BY status;

-- 8. CHECK ADMIN USERS TABLE ACCESS
SELECT 
    'ADMIN USERS CHECK' as test_type,
    username,
    created_at,
    last_login
FROM public.admin_users 
ORDER BY created_at DESC
LIMIT 3;

-- 9. CLEANUP TEST DATA (uncomment to clean up)
-- DELETE FROM public.reservations WHERE customer_email LIKE '%test%';

-- 10. FINAL STATUS
SELECT 
    'SYSTEM STATUS' as test_type,
    'Reservations table: ' || 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.reservations LIMIT 1) 
        THEN 'ACCESSIBLE ✓' 
        ELSE 'NO DATA OR ACCESS ISSUE ✗' 
    END as reservations_status,
    'Admin users table: ' || 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) 
        THEN 'ACCESSIBLE ✓' 
        ELSE 'NO ACCESS ✗' 
    END as admin_status;


