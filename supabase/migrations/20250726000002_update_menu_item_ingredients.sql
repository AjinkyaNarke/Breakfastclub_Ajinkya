-- Update menu_item_ingredients table to support both ingredients and preps
-- Add optional prep_id column
ALTER TABLE public.menu_item_ingredients 
ADD COLUMN prep_id UUID REFERENCES public.preps(id) ON DELETE CASCADE;

-- Add check constraint to ensure either ingredient_id or prep_id is set, but not both
ALTER TABLE public.menu_item_ingredients 
ADD CONSTRAINT menu_item_ingredients_ingredient_or_prep_check 
CHECK (
  (ingredient_id IS NOT NULL AND prep_id IS NULL) OR 
  (ingredient_id IS NULL AND prep_id IS NOT NULL)
);

-- Update existing constraint to allow ingredient_id to be nullable
ALTER TABLE public.menu_item_ingredients 
ALTER COLUMN ingredient_id DROP NOT NULL;

-- Create index for prep_id
CREATE INDEX idx_menu_item_ingredients_prep_id ON public.menu_item_ingredients (prep_id);

-- Update the existing cost calculation function to include preps
CREATE OR REPLACE FUNCTION public.calculate_menu_item_cost(menu_item_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_cost DECIMAL(10,2) := 0;
  ingredient_cost DECIMAL(10,2) := 0;
  prep_cost DECIMAL(10,2) := 0;
BEGIN
  -- Calculate cost from direct ingredients
  SELECT COALESCE(SUM(
    CASE 
      WHEN i.cost_per_unit IS NOT NULL AND i.cost_per_unit > 0 THEN
        mii.quantity * i.cost_per_unit
      ELSE 0
    END
  ), 0) INTO ingredient_cost
  FROM menu_item_ingredients mii
  JOIN ingredients i ON mii.ingredient_id = i.id
  WHERE mii.menu_item_id = menu_item_uuid 
    AND mii.ingredient_id IS NOT NULL 
    AND i.is_active = true;
  
  -- Calculate cost from preps
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.cost_per_unit IS NOT NULL AND p.cost_per_unit > 0 THEN
        mii.quantity * p.cost_per_unit
      ELSE 0
    END
  ), 0) INTO prep_cost
  FROM menu_item_ingredients mii
  JOIN preps p ON mii.prep_id = p.id
  WHERE mii.menu_item_id = menu_item_uuid 
    AND mii.prep_id IS NOT NULL 
    AND p.is_active = true;
  
  total_cost := ingredient_cost + prep_cost;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update menu item costs when preps are used
CREATE OR REPLACE FUNCTION public.update_menu_item_costs_on_prep_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different trigger events
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update all menu items that use this prep
    UPDATE menu_items 
    SET updated_at = now()
    WHERE id IN (
      SELECT DISTINCT mii.menu_item_id 
      FROM menu_item_ingredients mii 
      WHERE mii.prep_id = NEW.id
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update all menu items that used this prep
    UPDATE menu_items 
    SET updated_at = now()
    WHERE id IN (
      SELECT DISTINCT mii.menu_item_id 
      FROM menu_item_ingredients mii 
      WHERE mii.prep_id = OLD.id
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_menu_items_on_prep_change
  AFTER INSERT OR UPDATE OR DELETE ON public.preps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_menu_item_costs_on_prep_change();