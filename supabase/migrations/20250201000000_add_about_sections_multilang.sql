-- Add multilingual fields to about_sections table
ALTER TABLE public.about_sections 
  ADD COLUMN IF NOT EXISTS title_de TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_de TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
  ADD COLUMN IF NOT EXISTS content_de TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Add multilingual fields to about_images table  
ALTER TABLE public.about_images 
  ADD COLUMN IF NOT EXISTS title_de TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS caption_de TEXT,
  ADD COLUMN IF NOT EXISTS caption_en TEXT,
  ADD COLUMN IF NOT EXISTS alt_text_de TEXT,
  ADD COLUMN IF NOT EXISTS alt_text_en TEXT;

-- Add multilingual fields to about_videos table
ALTER TABLE public.about_videos 
  ADD COLUMN IF NOT EXISTS title_de TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS caption_de TEXT,
  ADD COLUMN IF NOT EXISTS caption_en TEXT,
  ADD COLUMN IF NOT EXISTS alt_text_de TEXT,
  ADD COLUMN IF NOT EXISTS alt_text_en TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.about_sections.title_de IS 'German title for the about section';
COMMENT ON COLUMN public.about_sections.title_en IS 'English title for the about section';
COMMENT ON COLUMN public.about_sections.subtitle_de IS 'German subtitle for the about section';
COMMENT ON COLUMN public.about_sections.subtitle_en IS 'English subtitle for the about section';
COMMENT ON COLUMN public.about_sections.content_de IS 'German content for the about section';
COMMENT ON COLUMN public.about_sections.content_en IS 'English content for the about section';
