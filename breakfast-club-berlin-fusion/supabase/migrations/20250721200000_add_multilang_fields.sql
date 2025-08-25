-- Add multi-language fields for menu_items
ALTER TABLE public.menu_items 
  ADD COLUMN IF NOT EXISTS name_de TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_de TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Add multi-language fields for menu_categories
ALTER TABLE public.menu_categories 
  ADD COLUMN IF NOT EXISTS name_de TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_de TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Add multi-language fields for ingredients
ALTER TABLE public.ingredients 
  ADD COLUMN IF NOT EXISTS name_de TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT;

-- Add multi-language fields for content_blocks
ALTER TABLE public.content_blocks 
  ADD COLUMN IF NOT EXISTS title_de TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS content_de TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT; 