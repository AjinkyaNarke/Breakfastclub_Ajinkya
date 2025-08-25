-- Ensure all required multilingual fields exist for ingredients table
-- This migration ensures the schema cache is updated with all required columns

ALTER TABLE public.ingredients 
  ADD COLUMN IF NOT EXISTS name_de TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS description_de TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.ingredients.name_de IS 'German name of the ingredient';
COMMENT ON COLUMN public.ingredients.name_en IS 'English name of the ingredient';
COMMENT ON COLUMN public.ingredients.description IS 'Primary description of the ingredient';
COMMENT ON COLUMN public.ingredients.description_de IS 'German description of the ingredient';
COMMENT ON COLUMN public.ingredients.description_en IS 'English description of the ingredient';