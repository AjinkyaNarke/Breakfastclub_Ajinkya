-- Test Data Setup for Berlin Fusion Breakfast Club
-- This script creates test data for comprehensive testing

-- =====================================================
-- CLEANUP EXISTING TEST DATA
-- =====================================================

-- Delete existing test data (if any)
DELETE FROM ingredients WHERE name LIKE 'Test%';
DELETE FROM menu_items WHERE name LIKE 'Test%';
DELETE FROM ingredient_categories WHERE name LIKE 'Test%';
DELETE FROM site_branding WHERE site_name LIKE 'Test%';

-- =====================================================
-- INGREDIENT CATEGORIES
-- =====================================================

INSERT INTO ingredient_categories (id, name, description, display_order) VALUES
('test-vegetables', 'Test Vegetables', 'Test vegetable ingredients', 1),
('test-meat', 'Test Meat', 'Test meat and poultry', 2),
('test-dairy', 'Test Dairy', 'Test dairy products', 3),
('test-grains', 'Test Grains', 'Test grains and breads', 4),
('test-spices', 'Test Spices', 'Test herbs and spices', 5),
('test-oils', 'Test Oils', 'Test oils and fats', 6);

-- =====================================================
-- INGREDIENTS
-- =====================================================

INSERT INTO ingredients (
    id, name, name_de, name_en, description, description_de, description_en,
    category_id, unit, cost_per_unit, allergens, dietary_properties,
    seasonal_availability, supplier_info, notes, is_active
) VALUES
-- Test Vegetables
('test-tomato', 'Test Tomato', 'Test Tomate', 'Test Tomato', 
 'Fresh red tomato for testing', 'Frische rote Tomate zum Testen', 'Fresh red tomato for testing',
 'test-vegetables', 'piece', 0.50, ARRAY['none'], ARRAY['vegetarian', 'vegan', 'organic'],
 ARRAY['spring', 'summer', 'autumn'], 'Test Supplier A', 'Test note for tomato', true),

('test-avocado', 'Test Avocado', 'Test Avocado', 'Test Avocado',
 'Ripe avocado for testing', 'Reife Avocado zum Testen', 'Ripe avocado for testing',
 'test-vegetables', 'piece', 1.20, ARRAY['none'], ARRAY['vegetarian', 'vegan'],
 ARRAY['spring', 'summer'], 'Test Supplier B', 'Test note for avocado', true),

('test-onion', 'Test Onion', 'Test Zwiebel', 'Test Onion',
 'Fresh onion for testing', 'Frische Zwiebel zum Testen', 'Fresh onion for testing',
 'test-vegetables', 'piece', 0.30, ARRAY['none'], ARRAY['vegetarian', 'vegan'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier A', 'Test note for onion', true),

-- Test Meat
('test-chicken', 'Test Chicken Breast', 'Test Hähnchenbrust', 'Test Chicken Breast',
 'Fresh chicken breast for testing', 'Frische Hähnchenbrust zum Testen', 'Fresh chicken breast for testing',
 'test-meat', 'kg', 8.50, ARRAY['none'], ARRAY['organic'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier C', 'Test note for chicken', true),

('test-eggs', 'Test Eggs', 'Test Eier', 'Test Eggs',
 'Fresh eggs for testing', 'Frische Eier zum Testen', 'Fresh eggs for testing',
 'test-meat', 'piece', 0.25, ARRAY['eggs'], ARRAY['vegetarian', 'organic'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier D', 'Test note for eggs', true),

-- Test Dairy
('test-cheese', 'Test Cheese', 'Test Käse', 'Test Cheese',
 'Fresh cheese for testing', 'Frischer Käse zum Testen', 'Fresh cheese for testing',
 'test-dairy', 'kg', 12.00, ARRAY['dairy'], ARRAY['vegetarian'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier E', 'Test note for cheese', true),

('test-milk', 'Test Milk', 'Test Milch', 'Test Milk',
 'Fresh milk for testing', 'Frische Milch zum Testen', 'Fresh milk for testing',
 'test-dairy', 'L', 1.20, ARRAY['dairy'], ARRAY['vegetarian', 'organic'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier F', 'Test note for milk', true),

-- Test Grains
('test-bread', 'Test Bread', 'Test Brot', 'Test Bread',
 'Fresh bread for testing', 'Frisches Brot zum Testen', 'Fresh bread for testing',
 'test-grains', 'piece', 2.50, ARRAY['gluten'], ARRAY['vegetarian'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier G', 'Test note for bread', true),

('test-flour', 'Test Flour', 'Test Mehl', 'Test Flour',
 'All-purpose flour for testing', 'Universalmehl zum Testen', 'All-purpose flour for testing',
 'test-grains', 'kg', 1.80, ARRAY['gluten'], ARRAY['vegetarian', 'vegan'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier H', 'Test note for flour', true),

-- Test Spices
('test-salt', 'Test Salt', 'Test Salz', 'Test Salt',
 'Sea salt for testing', 'Meersalz zum Testen', 'Sea salt for testing',
 'test-spices', 'kg', 0.50, ARRAY['none'], ARRAY['vegetarian', 'vegan'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier I', 'Test note for salt', true),

('test-pepper', 'Test Pepper', 'Test Pfeffer', 'Test Pepper',
 'Black pepper for testing', 'Schwarzer Pfeffer zum Testen', 'Black pepper for testing',
 'test-spices', 'kg', 15.00, ARRAY['none'], ARRAY['vegetarian', 'vegan'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier J', 'Test note for pepper', true),

-- Test Oils
('test-olive-oil', 'Test Olive Oil', 'Test Olivenöl', 'Test Olive Oil',
 'Extra virgin olive oil for testing', 'Natives Olivenöl zum Testen', 'Extra virgin olive oil for testing',
 'test-oils', 'L', 8.00, ARRAY['none'], ARRAY['vegetarian', 'vegan', 'organic'],
 ARRAY['spring', 'summer', 'autumn', 'winter'], 'Test Supplier K', 'Test note for olive oil', true);

-- =====================================================
-- MENU ITEMS
-- =====================================================

INSERT INTO menu_items (
    id, name, name_de, name_en, description, description_de, description_en,
    price, category_id, is_active, allergens, dietary_properties,
    preparation_time, cost_per_serving, profit_margin
) VALUES
-- Test Breakfast Items
('test-avocado-toast', 'Test Avocado Toast', 'Test Avocado Toast', 'Test Avocado Toast',
 'Fresh avocado on toasted bread', 'Frische Avocado auf geröstetem Brot', 'Fresh avocado on toasted bread',
 12.50, 'breakfast', true, ARRAY['gluten'], ARRAY['vegetarian'],
 10, 3.50, 72.0),

('test-eggs-benedict', 'Test Eggs Benedict', 'Test Benedict Eier', 'Test Eggs Benedict',
 'Poached eggs with hollandaise sauce', 'Pochierte Eier mit Hollandaise-Sauce', 'Poached eggs with hollandaise sauce',
 15.00, 'breakfast', true, ARRAY['eggs', 'dairy', 'gluten'], ARRAY['vegetarian'],
 15, 5.20, 65.3),

('test-chicken-sandwich', 'Test Chicken Sandwich', 'Test Hähnchen-Sandwich', 'Test Chicken Sandwich',
 'Grilled chicken with fresh vegetables', 'Gegrilltes Hähnchen mit frischem Gemüse', 'Grilled chicken with fresh vegetables',
 14.00, 'lunch', true, ARRAY['gluten'], ARRAY['organic'],
 12, 6.80, 51.4),

-- Test Lunch Items
('test-vegetable-soup', 'Test Vegetable Soup', 'Test Gemüsesuppe', 'Test Vegetable Soup',
 'Fresh vegetable soup with herbs', 'Frische Gemüsesuppe mit Kräutern', 'Fresh vegetable soup with herbs',
 8.50, 'lunch', true, ARRAY['none'], ARRAY['vegetarian', 'vegan'],
 8, 2.10, 75.3),

('test-caesar-salad', 'Test Caesar Salad', 'Test Caesar Salat', 'Test Caesar Salad',
 'Classic Caesar salad with dressing', 'Klassischer Caesar Salat mit Dressing', 'Classic Caesar salad with dressing',
 11.00, 'lunch', true, ARRAY['dairy', 'eggs'], ARRAY['vegetarian'],
 7, 3.80, 65.5),

-- Test Dinner Items
('test-grilled-salmon', 'Test Grilled Salmon', 'Test Gegrillter Lachs', 'Test Grilled Salmon',
 'Fresh grilled salmon with vegetables', 'Frischer gegrillter Lachs mit Gemüse', 'Fresh grilled salmon with vegetables',
 22.00, 'dinner', true, ARRAY['fish'], ARRAY['organic'],
 20, 12.50, 43.2),

('test-vegetable-pasta', 'Test Vegetable Pasta', 'Test Gemüse-Pasta', 'Test Vegetable Pasta',
 'Fresh pasta with seasonal vegetables', 'Frische Pasta mit saisonalem Gemüse', 'Fresh pasta with seasonal vegetables',
 16.00, 'dinner', true, ARRAY['gluten'], ARRAY['vegetarian'],
 15, 7.20, 55.0);

-- =====================================================
-- MENU ITEM INGREDIENTS (RELATIONSHIPS)
-- =====================================================

INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit) VALUES
-- Avocado Toast Ingredients
('test-avocado-toast', 'test-avocado', 1, 'piece'),
('test-avocado-toast', 'test-bread', 2, 'piece'),
('test-avocado-toast', 'test-olive-oil', 0.02, 'L'),
('test-avocado-toast', 'test-salt', 0.005, 'kg'),
('test-avocado-toast', 'test-pepper', 0.002, 'kg'),

-- Eggs Benedict Ingredients
('test-eggs-benedict', 'test-eggs', 2, 'piece'),
('test-eggs-benedict', 'test-bread', 1, 'piece'),
('test-eggs-benedict', 'test-butter', 0.05, 'kg'),
('test-eggs-benedict', 'test-salt', 0.003, 'kg'),
('test-eggs-benedict', 'test-pepper', 0.001, 'kg'),

-- Chicken Sandwich Ingredients
('test-chicken-sandwich', 'test-chicken', 0.15, 'kg'),
('test-chicken-sandwich', 'test-bread', 2, 'piece'),
('test-chicken-sandwich', 'test-tomato', 0.5, 'piece'),
('test-chicken-sandwich', 'test-onion', 0.25, 'piece'),
('test-chicken-sandwich', 'test-cheese', 0.05, 'kg'),

-- Vegetable Soup Ingredients
('test-vegetable-soup', 'test-tomato', 2, 'piece'),
('test-vegetable-soup', 'test-onion', 1, 'piece'),
('test-vegetable-soup', 'test-olive-oil', 0.01, 'L'),
('test-vegetable-soup', 'test-salt', 0.01, 'kg'),
('test-vegetable-soup', 'test-pepper', 0.003, 'kg');

-- =====================================================
-- SITE BRANDING
-- =====================================================

INSERT INTO site_branding (id, site_name, tagline, logo_url, favicon_url) VALUES
('test-branding-1', 'Test Berlin Fusion Breakfast Club', 'Test Premium Fusion Breakfast Experience', 
 'https://test-storage.supabase.co/branding/test-logo.png', 
 'https://test-storage.supabase.co/branding/test-favicon.ico');

-- =====================================================
-- SERVICE USAGE TRACKING
-- =====================================================

INSERT INTO service_usage (
    id, deepgram_used, deepgram_limit, recraft_used, recraft_limit, 
    deepseek_used, deepseek_limit, month_year, created_at, updated_at
) VALUES
('test-usage-1', 1250, 5000, 15, 50, 8500, 50000, 
 '2025-01', NOW(), NOW());

-- =====================================================
-- AI USAGE LOGS
-- =====================================================

INSERT INTO ai_usage_logs (
    id, user_id, service, feature, duration, tokens, cost, 
    model, timestamp, metadata
) VALUES
-- Deepgram usage logs
('test-deepgram-1', 'test-user-1', 'deepgram', 'voice_transcription', 120, NULL, 0.0024, 
 'nova-2', NOW() - INTERVAL '1 hour', '{"language": "en", "confidence": 0.95}'),

('test-deepgram-2', 'test-user-1', 'deepgram', 'voice_transcription', 180, NULL, 0.0036, 
 'nova-2', NOW() - INTERVAL '2 hours', '{"language": "de", "confidence": 0.92}'),

-- Recraft usage logs
('test-recraft-1', 'test-user-1', 'recraft', 'image_generation', NULL, NULL, 0.05, 
 'realistic', NOW() - INTERVAL '3 hours', '{"prompt": "fresh tomato", "size": "256x256"}'),

('test-recraft-2', 'test-user-1', 'recraft', 'image_generation', NULL, NULL, 0.05, 
 'realistic', NOW() - INTERVAL '4 hours', '{"prompt": "avocado toast", "size": "256x256"}'),

-- DeepSeek usage logs
('test-deepseek-1', 'test-user-1', 'deepseek', 'translation', NULL, 150, 0.003, 
 'deepseek-chat', NOW() - INTERVAL '5 hours', '{"from": "en", "to": "de", "text_length": 50}'),

('test-deepseek-2', 'test-user-1', 'deepseek', 'translation', NULL, 200, 0.004, 
 'deepseek-chat', NOW() - INTERVAL '6 hours', '{"from": "de", "to": "en", "text_length": 75}');

-- =====================================================
-- TEST USER ACCOUNTS
-- =====================================================

-- Note: These are example user IDs - in real testing, use actual Supabase auth users
-- INSERT INTO profiles (id, email, role, created_at) VALUES
-- ('test-admin-1', 'admin@test-breakfastclub.com', 'admin', NOW()),
-- ('test-user-1', 'user@test-breakfastclub.com', 'user', NOW());

-- =====================================================
-- TEST EVENTS
-- =====================================================

INSERT INTO events (
    id, title, title_de, description, description_de, 
    event_date, start_time, end_time, location, max_capacity, 
    current_registrations, price, is_active, created_at
) VALUES
('test-event-1', 'Test Breakfast Workshop', 'Test Frühstücks-Workshop', 
 'Learn to make perfect breakfast dishes', 'Lernen Sie, perfekte Frühstücksgerichte zuzubereiten',
 '2025-02-15', '09:00:00', '12:00:00', 'Test Kitchen', 20, 8, 45.00, true, NOW()),

('test-event-2', 'Test Wine Tasting', 'Test Weinprobe', 
 'Evening wine tasting with food pairing', 'Abendliche Weinprobe mit Speisenpaarung',
 '2025-02-20', '19:00:00', '22:00:00', 'Test Dining Room', 15, 12, 65.00, true, NOW());

-- =====================================================
-- TEST GALLERY IMAGES
-- =====================================================

INSERT INTO gallery_images (
    id, title, description, image_url, alt_text, 
    category, display_order, is_active, created_at
) VALUES
('test-gallery-1', 'Test Breakfast Spread', 'Beautiful breakfast table setup', 
 'https://test-storage.supabase.co/gallery/test-breakfast-1.jpg', 
 'Test breakfast table with various dishes', 'food', 1, true, NOW()),

('test-gallery-2', 'Test Restaurant Interior', 'Cozy restaurant interior', 
 'https://test-storage.supabase.co/gallery/test-interior-1.jpg', 
 'Test restaurant interior with warm lighting', 'interior', 2, true, NOW()),

('test-gallery-3', 'Test Chef at Work', 'Chef preparing dishes', 
 'https://test-storage.supabase.co/gallery/test-chef-1.jpg', 
 'Test chef working in the kitchen', 'people', 3, true, NOW());

-- =====================================================
-- TEST VIDEOS
-- =====================================================

INSERT INTO restaurant_videos (
    id, title, description, video_url, thumbnail_url, 
    duration, category, is_active, created_at
) VALUES
('test-video-1', 'Test Cooking Tutorial', 'Learn to make perfect eggs', 
 'https://test-storage.supabase.co/videos/test-cooking-1.mp4', 
 'https://test-storage.supabase.co/videos/test-cooking-1-thumb.jpg',
 180, 'tutorial', true, NOW()),

('test-video-2', 'Test Restaurant Tour', 'Virtual tour of our restaurant', 
 'https://test-storage.supabase.co/videos/test-tour-1.mp4', 
 'https://test-storage.supabase.co/videos/test-tour-1-thumb.jpg',
 120, 'tour', true, NOW());

-- =====================================================
-- TEST PRESS ARTICLES
-- =====================================================

INSERT INTO press_articles (
    id, title, title_de, content, content_de, 
    source, publication_date, url, is_active, created_at
) VALUES
('test-press-1', 'Test Restaurant Review', 'Test Restaurant-Bewertung', 
 'Excellent fusion breakfast experience', 'Ausgezeichnete Fusion-Frühstückserfahrung',
 'Test Food Magazine', '2025-01-15', 'https://test-magazine.com/review', true, NOW()),

('test-press-2', 'Test Chef Interview', 'Test Koch-Interview', 
 'Interview with our head chef', 'Interview mit unserem Küchenchef',
 'Test Culinary Blog', '2025-01-20', 'https://test-blog.com/interview', true, NOW());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify test data was inserted correctly
SELECT 'Ingredients' as table_name, COUNT(*) as count FROM ingredients WHERE name LIKE 'Test%'
UNION ALL
SELECT 'Menu Items' as table_name, COUNT(*) as count FROM menu_items WHERE name LIKE 'Test%'
UNION ALL
SELECT 'Categories' as table_name, COUNT(*) as count FROM ingredient_categories WHERE name LIKE 'Test%'
UNION ALL
SELECT 'Events' as table_name, COUNT(*) as count FROM events WHERE title LIKE 'Test%'
UNION ALL
SELECT 'Gallery Images' as table_name, COUNT(*) as count FROM gallery_images WHERE title LIKE 'Test%'
UNION ALL
SELECT 'Videos' as table_name, COUNT(*) as count FROM restaurant_videos WHERE title LIKE 'Test%'
UNION ALL
SELECT 'Press Articles' as table_name, COUNT(*) as count FROM press_articles WHERE title LIKE 'Test%';

-- =====================================================
-- CLEANUP FUNCTION (for after testing)
-- =====================================================

-- To clean up test data after testing, run:
/*
DELETE FROM menu_item_ingredients WHERE menu_item_id IN (SELECT id FROM menu_items WHERE name LIKE 'Test%');
DELETE FROM menu_items WHERE name LIKE 'Test%';
DELETE FROM ingredients WHERE name LIKE 'Test%';
DELETE FROM ingredient_categories WHERE name LIKE 'Test%';
DELETE FROM events WHERE title LIKE 'Test%';
DELETE FROM gallery_images WHERE title LIKE 'Test%';
DELETE FROM restaurant_videos WHERE title LIKE 'Test%';
DELETE FROM press_articles WHERE title LIKE 'Test%';
DELETE FROM site_branding WHERE site_name LIKE 'Test%';
DELETE FROM service_usage WHERE id LIKE 'test%';
DELETE FROM ai_usage_logs WHERE id LIKE 'test%';
*/ 