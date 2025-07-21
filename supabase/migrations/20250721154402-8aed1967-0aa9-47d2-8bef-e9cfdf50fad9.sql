
-- Create ingredient categories table
CREATE TABLE public.ingredient_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ingredients table
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES ingredient_categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'g', -- g, ml, piece, cup, etc.
  cost_per_unit NUMERIC(10,2),
  allergens TEXT[], -- array of allergen names
  dietary_properties TEXT[], -- vegetarian, vegan, gluten-free, etc.
  seasonal_availability TEXT[], -- spring, summer, fall, winter
  supplier_info TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, unit) -- same ingredient can have different units
);

-- Create menu item ingredients junction table
CREATE TABLE public.menu_item_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(menu_item_id, ingredient_id)
);

-- Add RLS policies for ingredient categories
ALTER TABLE public.ingredient_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view ingredient categories" ON public.ingredient_categories FOR SELECT USING (true);
CREATE POLICY "Admin full access to ingredient categories" ON public.ingredient_categories FOR ALL USING (true);

-- Add RLS policies for ingredients
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active ingredients" ON public.ingredients FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to ingredients" ON public.ingredients FOR ALL USING (true);

-- Add RLS policies for menu item ingredients
ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view menu item ingredients" ON public.menu_item_ingredients FOR SELECT USING (true);
CREATE POLICY "Admin full access to menu item ingredients" ON public.menu_item_ingredients FOR ALL USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_ingredient_categories_updated_at BEFORE UPDATE ON public.ingredient_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default ingredient categories
INSERT INTO public.ingredient_categories (name, description, display_order) VALUES
('Proteins', 'Meat, fish, eggs, tofu, etc.', 1),
('Vegetables', 'Fresh vegetables and greens', 2),
('Grains & Starches', 'Rice, noodles, bread, potatoes', 3),
('Dairy', 'Milk, cheese, yogurt, butter', 4),
('Sauces & Condiments', 'Soy sauce, sesame oil, vinegar, etc.', 5),
('Spices & Herbs', 'Fresh and dried herbs, spices', 6),
('Oils & Fats', 'Cooking oils, sesame oil, etc.', 7),
('Others', 'Miscellaneous ingredients', 8);

-- Insert some common Korean/Asian ingredients
INSERT INTO public.ingredients (name, category_id, unit, allergens, dietary_properties, seasonal_availability) VALUES
-- Proteins
('Bulgogi Beef', (SELECT id FROM ingredient_categories WHERE name = 'Proteins'), 'g', '{}', '{}', '{spring,summer,fall,winter}'),
('Chicken Breast', (SELECT id FROM ingredient_categories WHERE name = 'Proteins'), 'g', '{}', '{}', '{spring,summer,fall,winter}'),
('Tofu', (SELECT id FROM ingredient_categories WHERE name = 'Proteins'), 'g', '{soy}', '{vegetarian,vegan}', '{spring,summer,fall,winter}'),
('Eggs', (SELECT id FROM ingredient_categories WHERE name = 'Proteins'), 'piece', '{eggs}', '{vegetarian}', '{spring,summer,fall,winter}'),
('Salmon', (SELECT id FROM ingredient_categories WHERE name = 'Proteins'), 'g', '{fish}', '{}', '{spring,summer,fall,winter}'),

-- Vegetables
('Kimchi', (SELECT id FROM ingredient_categories WHERE name = 'Vegetables'), 'g', '{}', '{vegan,fermented}', '{spring,summer,fall,winter}'),
('Bean Sprouts', (SELECT id FROM ingredient_categories WHERE name = 'Vegetables'), 'g', '{}', '{vegan,vegetarian}', '{spring,summer,fall,winter}'),
('Shiitake Mushrooms', (SELECT id FROM ingredient_categories WHERE name = 'Vegetables'), 'g', '{}', '{vegan,vegetarian}', '{fall,winter}'),
('Cucumber', (SELECT id FROM ingredient_categories WHERE name = 'Vegetables'), 'g', '{}', '{vegan,vegetarian}', '{spring,summer}'),
('Carrot', (SELECT id FROM ingredient_categories WHERE name = 'Vegetables'), 'g', '{}', '{vegan,vegetarian}', '{fall,winter}'),
('Green Onions', (SELECT id FROM ingredient_categories WHERE name = 'Vegetables'), 'g', '{}', '{vegan,vegetarian}', '{spring,summer,fall,winter}'),

-- Grains & Starches
('Steamed Rice', (SELECT id FROM ingredient_categories WHERE name = 'Grains & Starches'), 'g', '{}', '{vegan,vegetarian,gluten-free}', '{spring,summer,fall,winter}'),
('Ramen Noodles', (SELECT id FROM ingredient_categories WHERE name = 'Grains & Starches'), 'g', '{gluten}', '{vegan,vegetarian}', '{spring,summer,fall,winter}'),
('Sweet Potato', (SELECT id FROM ingredient_categories WHERE name = 'Grains & Starches'), 'g', '{}', '{vegan,vegetarian,gluten-free}', '{fall,winter}'),

-- Sauces & Condiments
('Soy Sauce', (SELECT id FROM ingredient_categories WHERE name = 'Sauces & Condiments'), 'ml', '{soy,gluten}', '{}', '{spring,summer,fall,winter}'),
('Sesame Oil', (SELECT id FROM ingredient_categories WHERE name = 'Oils & Fats'), 'ml', '{sesame}', '{vegan,vegetarian}', '{spring,summer,fall,winter}'),
('Gochujang', (SELECT id FROM ingredient_categories WHERE name = 'Sauces & Condiments'), 'g', '{soy}', '{vegan,vegetarian}', '{spring,summer,fall,winter}'),
('Rice Vinegar', (SELECT id FROM ingredient_categories WHERE name = 'Sauces & Condiments'), 'ml', '{}', '{vegan,vegetarian,gluten-free}', '{spring,summer,fall,winter}'),

-- Spices & Herbs
('Sesame Seeds', (SELECT id FROM ingredient_categories WHERE name = 'Spices & Herbs'), 'g', '{sesame}', '{vegan,vegetarian}', '{spring,summer,fall,winter}'),
('Garlic', (SELECT id FROM ingredient_categories WHERE name = 'Spices & Herbs'), 'g', '{}', '{vegan,vegetarian}', '{spring,summer,fall,winter}'),
('Ginger', (SELECT id FROM ingredient_categories WHERE name = 'Spices & Herbs'), 'g', '{}', '{vegan,vegetarian}', '{spring,summer,fall,winter}');

-- Create function to auto-update dietary tags based on ingredients
CREATE OR REPLACE FUNCTION update_menu_item_dietary_tags()
RETURNS TRIGGER AS $$
DECLARE
    dietary_tags_array TEXT[] := '{}';
    ingredient_props TEXT[];
    allergen_list TEXT[] := '{}';
BEGIN
    -- Get all dietary properties and allergens from ingredients
    SELECT 
        ARRAY_AGG(DISTINCT prop) FILTER (WHERE prop IS NOT NULL),
        ARRAY_AGG(DISTINCT allergen) FILTER (WHERE allergen IS NOT NULL)
    INTO dietary_tags_array, allergen_list
    FROM (
        SELECT UNNEST(i.dietary_properties) AS prop, UNNEST(i.allergens) AS allergen
        FROM menu_item_ingredients mii
        JOIN ingredients i ON i.id = mii.ingredient_id
        WHERE mii.menu_item_id = COALESCE(NEW.menu_item_id, OLD.menu_item_id)
    ) props;
    
    -- Update the menu item with computed dietary tags
    UPDATE menu_items 
    SET 
        dietary_tags = COALESCE(dietary_tags_array, '{}'),
        updated_at = now()
    WHERE id = COALESCE(NEW.menu_item_id, OLD.menu_item_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update dietary tags when ingredients change
CREATE TRIGGER update_dietary_tags_on_ingredient_change
    AFTER INSERT OR UPDATE OR DELETE ON menu_item_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_menu_item_dietary_tags();
