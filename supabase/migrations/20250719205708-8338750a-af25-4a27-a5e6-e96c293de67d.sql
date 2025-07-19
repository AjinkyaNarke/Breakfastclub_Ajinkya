-- Update RLS policy for menu_items to allow public viewing of available items
DROP POLICY IF EXISTS "Public can view menu items" ON menu_items;

CREATE POLICY "Public can view available menu items" 
  ON menu_items FOR SELECT 
  USING (is_available = true);

-- Also ensure menu_categories are publicly viewable
DROP POLICY IF EXISTS "Public can view menu categories" ON menu_categories;

CREATE POLICY "Public can view menu categories" 
  ON menu_categories FOR SELECT 
  USING (true);