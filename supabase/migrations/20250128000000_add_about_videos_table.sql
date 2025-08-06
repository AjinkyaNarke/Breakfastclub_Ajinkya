-- Create about_videos table for video content in about sections
CREATE TABLE about_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES about_sections(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  video_type VARCHAR(50) DEFAULT 'uploaded', -- 'uploaded', 'youtube', 'vimeo'
  external_video_id TEXT, -- For YouTube/Vimeo videos
  duration INTEGER, -- Video duration in seconds
  file_size BIGINT, -- File size in bytes for uploaded videos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_about_videos_section_id ON about_videos(section_id);
CREATE INDEX idx_about_videos_display_order ON about_videos(display_order);

-- Add RLS policies
ALTER TABLE about_videos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published videos
CREATE POLICY "Public can view about videos" ON about_videos
  FOR SELECT USING (true);

-- Allow authenticated users to manage videos
CREATE POLICY "Authenticated users can manage about videos" ON about_videos
  FOR ALL USING (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_about_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER about_videos_updated_at
  BEFORE UPDATE ON about_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_about_videos_updated_at();