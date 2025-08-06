-- Add description fields to ingredients table
-- These fields are expected by the StreamlinedIngredientDialog component but were missing from the schema

ALTER TABLE public.ingredients 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS description_de TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.ingredients.description IS 'Primary description of the ingredient';
COMMENT ON COLUMN public.ingredients.description_de IS 'German description of the ingredient';
COMMENT ON COLUMN public.ingredients.description_en IS 'English description of the ingredient';