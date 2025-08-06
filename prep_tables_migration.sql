-- ===================================================
-- PREP TABLES MIGRATION FOR REMOTE SUPABASE
-- ===================================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- and run it to create the prep tables and functions

-- First, check if update_updated_at_column function exists, if not create it
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- CREATE PREPS TABLE
-- ===================================================

-- Create preps table for intermediate preparations
CREATE TABLE IF NOT EXISTS public.preps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_de TEXT,
  name_en TEXT,
  description TEXT,
  description_de TEXT,
  description_en TEXT,
  batch_yield TEXT, -- e.g., "500ml", "1kg", "20 portions"
  batch_yield_amount DECIMAL(10,3), -- numeric value for calculations
  batch_yield_unit TEXT, -- unit for calculations
  instructions TEXT,
  instructions_de TEXT,
  instructions_en TEXT,
  notes TEXT,
  cost_per_batch DECIMAL(10,2) DEFAULT 0, -- auto-calculated
  cost_per_unit DECIMAL(10,4) DEFAULT 0, -- cost per smallest unit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.preps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Public can view active preps" ON public.preps;
DROP POLICY IF EXISTS "Admin full access to preps" ON public.preps;

CREATE POLICY "Public can view active preps" ON public.preps FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to preps" ON public.preps FOR ALL USING (true);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_preps_updated_at ON public.preps;
CREATE TRIGGER update_preps_updated_at
  BEFORE UPDATE ON public.preps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_preps_active ON public.preps (is_active);
CREATE INDEX IF NOT EXISTS idx_preps_name ON public.preps (name);
CREATE INDEX IF NOT EXISTS idx_preps_created_at ON public.preps (created_at);

-- ===================================================
-- CREATE PREP_INGREDIENTS TABLE
-- ===================================================

-- Create prep_ingredients junction table
CREATE TABLE IF NOT EXISTS public.prep_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_id UUID NOT NULL REFERENCES public.preps(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(prep_id, ingredient_id)
);

-- Enable RLS
ALTER TABLE public.prep_ingredients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Public can view prep ingredients" ON public.prep_ingredients;
DROP POLICY IF EXISTS "Admin full access to prep ingredients" ON public.prep_ingredients;

CREATE POLICY "Public can view prep ingredients" ON public.prep_ingredients FOR SELECT USING (true);
CREATE POLICY "Admin full access to prep ingredients" ON public.prep_ingredients FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prep_ingredients_prep_id ON public.prep_ingredients (prep_id);
CREATE INDEX IF NOT EXISTS idx_prep_ingredients_ingredient_id ON public.prep_ingredients (ingredient_id);

-- ===================================================
-- CREATE COST CALCULATION FUNCTIONS AND TRIGGERS
-- ===================================================

-- Create function to calculate prep costs automatically
CREATE OR REPLACE FUNCTION public.calculate_prep_cost(prep_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_cost DECIMAL(10,2) := 0;
  ingredient_cost DECIMAL(10,2);
  prep_record RECORD;
BEGIN
  -- Get prep details
  SELECT * INTO prep_record FROM public.preps WHERE id = prep_uuid;
  
  IF prep_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate total cost from ingredients
  SELECT COALESCE(SUM(
    CASE 
      WHEN i.cost_per_unit IS NOT NULL AND i.cost_per_unit > 0 THEN
        pi.quantity * i.cost_per_unit
      ELSE 0
    END
  ), 0) INTO total_cost
  FROM prep_ingredients pi
  JOIN ingredients i ON pi.ingredient_id = i.id
  WHERE pi.prep_id = prep_uuid AND i.is_active = true;
  
  -- Update prep cost
  UPDATE public.preps 
  SET 
    cost_per_batch = total_cost,
    cost_per_unit = CASE 
      WHEN prep_record.batch_yield_amount > 0 THEN total_cost / prep_record.batch_yield_amount
      ELSE total_cost
    END,
    updated_at = now()
  WHERE id = prep_uuid;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-update prep costs when ingredients change
CREATE OR REPLACE FUNCTION public.update_prep_costs_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different trigger events
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.calculate_prep_cost(NEW.prep_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_prep_cost(OLD.prep_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_prep_costs_on_ingredient_change ON public.prep_ingredients;

CREATE TRIGGER update_prep_costs_on_ingredient_change
  AFTER INSERT OR UPDATE OR DELETE ON public.prep_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prep_costs_trigger();

-- Also update prep costs when ingredient prices change
CREATE OR REPLACE FUNCTION public.update_all_prep_costs_on_ingredient_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if cost_per_unit changed
  IF OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit THEN
    -- Update all preps that use this ingredient
    PERFORM public.calculate_prep_cost(pi.prep_id)
    FROM prep_ingredients pi
    WHERE pi.ingredient_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_prep_costs_on_ingredient_update ON public.ingredients;

CREATE TRIGGER update_prep_costs_on_ingredient_update
  AFTER UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_all_prep_costs_on_ingredient_price_change();

-- ===================================================
-- VERIFICATION QUERIES
-- ===================================================

-- Verify tables were created successfully
SELECT 'PREPS TABLE CREATED' as status, count(*) as row_count FROM public.preps;
SELECT 'PREP_INGREDIENTS TABLE CREATED' as status, count(*) as row_count FROM public.prep_ingredients;

-- Show available functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%prep%'
ORDER BY routine_name;

-- ===================================================
-- MIGRATION COMPLETE
-- ===================================================
-- If you see verification results above, the migration was successful!
-- You can now use the prep management features in your application.