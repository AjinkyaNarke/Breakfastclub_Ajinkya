
-- Add featured_for_hero column to restaurant_videos table to distinguish hero videos from regular videos
ALTER TABLE public.restaurant_videos 
ADD COLUMN featured_for_hero boolean DEFAULT false;

-- Create a unique constraint to ensure only one video can be featured for hero at a time
CREATE UNIQUE INDEX idx_unique_hero_featured 
ON public.restaurant_videos (featured_for_hero) 
WHERE featured_for_hero = true;

-- Update one existing video to be featured for hero (if any videos exist)
UPDATE public.restaurant_videos 
SET featured_for_hero = true 
WHERE id = (
  SELECT id FROM public.restaurant_videos 
  ORDER BY created_at DESC 
  LIMIT 1
);
