-- Fix video display issues
-- This will help your car video and other videos show up

-- 1. Check current video status
SELECT 
    'Current Video Status' as check_type,
    title,
    is_featured,
    featured_for_hero,
    display_order,
    CASE 
        WHEN is_featured = true THEN 'Will show on homepage'
        ELSE 'Hidden from homepage'
    END as homepage_status
FROM restaurant_videos
ORDER BY display_order;

-- 2. Fix: Make at least one video featured for homepage display
-- (You can run this if you want your first video to show on homepage)
UPDATE restaurant_videos 
SET 
    is_featured = true,
    display_order = 1
WHERE id = (
    SELECT id 
    FROM restaurant_videos 
    ORDER BY created_at 
    LIMIT 1
);

-- 3. Alternative: Make car video featured if it exists
UPDATE restaurant_videos 
SET 
    is_featured = true,
    display_order = 1  
WHERE title ILIKE '%car%';

-- 4. Check results after update
SELECT 
    'After Fix' as check_type,
    title,
    is_featured,
    featured_for_hero,
    display_order,
    CASE 
        WHEN is_featured = true THEN '✅ Will show on homepage'
        ELSE '❌ Still hidden from homepage'
    END as homepage_status
FROM restaurant_videos
ORDER BY display_order;

