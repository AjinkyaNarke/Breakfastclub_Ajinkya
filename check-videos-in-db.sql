-- Check what videos exist in the restaurant_videos table
SELECT 
    'Video Check' as test_name,
    id,
    title,
    LEFT(video_url, 50) as video_url_preview,
    is_featured,
    featured_for_hero,
    display_order,
    autoplay,
    show_controls,
    created_at
FROM restaurant_videos 
ORDER BY display_order, created_at;

-- Check total count
SELECT 
    'Total Count' as test_name,
    COUNT(*) as total_videos
FROM restaurant_videos;

-- Check featured status
SELECT 
    'Featured Status' as test_name,
    is_featured,
    featured_for_hero,
    COUNT(*) as count
FROM restaurant_videos 
GROUP BY is_featured, featured_for_hero;

