-- Create prep_ingredients junction table
CREATE TABLE public.prep_ingredients (
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

-- Create policies for prep_ingredients
CREATE POLICY "Public can view prep ingredients" ON public.prep_ingredients FOR SELECT USING (true);
CREATE POLICY "Admin full access to prep ingredients" ON public.prep_ingredients FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_prep_ingredients_prep_id ON public.prep_ingredients (prep_id);
CREATE INDEX idx_prep_ingredients_ingredient_id ON public.prep_ingredients (ingredient_id);

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

-- Create trigger to auto-update prep costs when ingredients change
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

CREATE TRIGGER update_prep_costs_on_ingredient_update
  AFTER UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_all_prep_costs_on_ingredient_price_change();