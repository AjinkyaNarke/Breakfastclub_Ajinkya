-- Add default menu categories if they don't exist
-- First, add a unique constraint on name to enable ON CONFLICT
ALTER TABLE public.menu_categories ADD CONSTRAINT unique_category_name UNIQUE (name);

-- Insert default categories
INSERT INTO public.menu_categories (name, name_de, name_en, description, description_de, description_en, display_order)
VALUES 
  ('Breakfast', 'Frühstück', 'Breakfast', 'Morning favorites to start your day', 'Morgenfavoriten für den perfekten Start in den Tag', 'Morning favorites to start your day', 10),
  ('Brunch', 'Brunch', 'Brunch', 'Perfect combination of breakfast and lunch', 'Perfekte Kombination aus Frühstück und Mittagessen', 'Perfect combination of breakfast and lunch', 20),
  ('Lunch', 'Mittagessen', 'Lunch', 'Hearty midday meals', 'Herzhafte Mittagsgerichte', 'Hearty midday meals', 30),
  ('Salads', 'Salate', 'Salads', 'Fresh and healthy salad options', 'Frische und gesunde Salat-Optionen', 'Fresh and healthy salad options', 40),
  ('Mains', 'Hauptgerichte', 'Mains', 'Satisfying main courses', 'Sättigende Hauptgerichte', 'Satisfying main courses', 50),
  ('Sides', 'Beilagen', 'Sides', 'Perfect accompaniments to your meal', 'Perfekte Begleitung zu Ihrem Essen', 'Perfect accompaniments to your meal', 60),
  ('Beverages', 'Getränke', 'Beverages', 'Refreshing drinks and beverages', 'Erfrischende Getränke', 'Refreshing drinks and beverages', 70),
  ('Desserts', 'Desserts', 'Desserts', 'Sweet endings to your meal', 'Süße Abschlüsse für Ihr Essen', 'Sweet endings to your meal', 80)
ON CONFLICT (name) DO NOTHING;