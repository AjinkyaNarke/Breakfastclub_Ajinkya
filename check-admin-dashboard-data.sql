-- ================================================================
-- CHECK ADMIN DASHBOARD DATA - COMPLETE RESERVATION VIEW
-- ================================================================
-- This shows exactly what should appear in your admin panel

-- 1. ALL RESERVATIONS (Complete Admin Dashboard View)
SELECT 
    '📊 COMPLETE ADMIN DASHBOARD DATA' as section,
    'Total Reservations: ' || COUNT(*) as summary
FROM public.reservations;

-- 2. DETAILED RESERVATION LIST (What admin should see)
SELECT 
    '📋 ADMIN PANEL RESERVATIONS LIST' as section,
    ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_number,
    id as reservation_id,
    customer_name,
    customer_email,
    customer_phone,
    reservation_date,
    reservation_time,
    party_size,
    status,
    special_requests,
    admin_notes,
    language_preference,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_timestamp,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_timestamp,
    CASE 
        WHEN reservation_date = CURRENT_DATE THEN '🔥 TODAY'
        WHEN reservation_date = CURRENT_DATE + 1 THEN '⏰ TOMORROW'
        WHEN reservation_date > CURRENT_DATE THEN '📅 UPCOMING'
        ELSE '📝 PAST'
    END as timing_status
FROM public.reservations 
ORDER BY created_at DESC;

-- 3. DASHBOARD STATISTICS (Admin Overview)
SELECT 
    '📊 ADMIN DASHBOARD STATS' as section,
    COUNT(*) as total_reservations,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show_count,
    COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE) as today_count,
    COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE + 1) as tomorrow_count,
    COUNT(*) FILTER (WHERE reservation_date >= CURRENT_DATE) as upcoming_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - interval '7 days') as this_week_count
FROM public.reservations;

-- 4. RECENT RESERVATIONS (Top 10 for admin)
SELECT 
    '🆕 RECENT RESERVATIONS (Admin Priority View)' as section,
    customer_name,
    customer_email,
    reservation_date,
    reservation_time,
    party_size,
    status,
    CASE 
        WHEN special_requests IS NOT NULL THEN LEFT(special_requests, 50) || '...'
        ELSE 'No special requests'
    END as requests_preview,
    CASE 
        WHEN admin_notes IS NOT NULL THEN LEFT(admin_notes, 30) || '...'
        ELSE 'No admin notes'
    END as notes_preview,
    EXTRACT(HOUR FROM (NOW() - created_at)) as hours_since_created,
    created_at
FROM public.reservations 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. STATUS BREAKDOWN (For admin filtering)
SELECT 
    '📈 STATUS BREAKDOWN (Admin Filters)' as section,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    STRING_AGG(customer_name, ', ') as sample_customers
FROM public.reservations 
GROUP BY status
ORDER BY count DESC;

-- 6. DATE RANGE ANALYSIS (Admin Calendar View)
SELECT 
    '📅 DATE RANGE ANALYSIS (Admin Calendar)' as section,
    reservation_date,
    COUNT(*) as reservations_count,
    STRING_AGG(
        customer_name || ' (' || reservation_time || ', ' || party_size || ' guests)', 
        '; ' 
        ORDER BY reservation_time
    ) as daily_schedule,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_today,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_today
FROM public.reservations 
WHERE reservation_date >= CURRENT_DATE - interval '7 days'
    AND reservation_date <= CURRENT_DATE + interval '14 days'
GROUP BY reservation_date
ORDER BY reservation_date;

-- 7. ADMIN ACTION ITEMS (What needs attention)
SELECT 
    '⚡ ADMIN ACTION ITEMS' as section,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status = 'pending' AND reservation_date <= CURRENT_DATE + 1) > 0
        THEN '🔥 ' || COUNT(*) FILTER (WHERE status = 'pending' AND reservation_date <= CURRENT_DATE + 1) || ' pending reservations need immediate attention'
        ELSE '✅ No urgent pending reservations'
    END as urgent_actions,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status = 'pending') > 0
        THEN '📋 ' || COUNT(*) FILTER (WHERE status = 'pending') || ' total pending reservations'
        ELSE '✅ No pending reservations'
    END as pending_summary,
    CASE 
        WHEN COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE) > 0
        THEN '🍽️ ' || COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE) || ' reservations for today'
        ELSE '📅 No reservations scheduled for today'
    END as today_summary
FROM public.reservations;

-- 8. SEARCHABLE DATA (Admin Search Functionality)
SELECT 
    '🔍 SEARCHABLE CUSTOMER DATA' as section,
    customer_name,
    customer_email,
    customer_phone,
    COUNT(*) as total_reservations,
    MAX(reservation_date) as latest_reservation,
    STRING_AGG(DISTINCT status, ', ') as status_history,
    SUM(party_size) as total_guests_brought
FROM public.reservations 
GROUP BY customer_name, customer_email, customer_phone
ORDER BY COUNT(*) DESC, MAX(reservation_date) DESC;

-- 9. SYSTEM PERFORMANCE CHECK
SELECT 
    '⚙️ ADMIN SYSTEM PERFORMANCE' as section,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_reservation,
    MAX(created_at) as newest_reservation,
    COUNT(DISTINCT customer_email) as unique_customers,
    ROUND(AVG(party_size), 2) as average_party_size,
    MODE() WITHIN GROUP (ORDER BY status) as most_common_status
FROM public.reservations;

-- 10. FINAL ADMIN VERIFICATION
SELECT 
    '✅ ADMIN DASHBOARD VERIFICATION' as section,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            '✅ ' || COUNT(*) || ' reservations should be visible in admin dashboard'
        ELSE 
            '⚠️ No reservations found - admin dashboard will be empty'
    END as dashboard_status,
    CASE 
        WHEN COUNT(*) FILTER (WHERE created_at >= NOW() - interval '1 hour') > 0 THEN
            '🔄 Recent activity detected - dashboard should show fresh data'
        ELSE 
            '📊 Static data - dashboard shows historical reservations only'
    END as data_freshness,
    NOW() as check_timestamp
FROM public.reservations;


