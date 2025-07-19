
-- Update RLS policies for restaurant_videos table to allow admin operations
-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admin full access to videos" ON public.restaurant_videos;
DROP POLICY IF EXISTS "Allow all operations on videos" ON public.restaurant_videos;

-- Create permissive policy for admin operations
CREATE POLICY "Allow all operations on videos" 
  ON public.restaurant_videos 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Ensure the table has RLS enabled
ALTER TABLE public.restaurant_videos ENABLE ROW LEVEL SECURITY;

-- Ensure restaurant-videos storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-videos', 
  'restaurant-videos', 
  true, 
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime'];

-- Create permissive storage policy for restaurant-videos bucket
INSERT INTO storage.policies (name, bucket_id, command, permissive, roles, using_expression, with_check_expression)
VALUES (
  'Allow all operations on restaurant videos',
  'restaurant-videos',
  'ALL',
  true,
  '{authenticated,anon}',
  'true',
  'true'
)
ON CONFLICT (name, bucket_id) DO NOTHING;
