
-- Create enhanced about sections table
CREATE TABLE public.about_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT,
  section_type TEXT DEFAULT 'text', -- 'text', 'gallery', 'team', 'timeline'
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table linked to sections
CREATE TABLE public.about_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES about_sections(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE public.about_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_images ENABLE ROW LEVEL SECURITY;

-- Create policies for about_sections
CREATE POLICY "Public can view published about sections" 
  ON public.about_sections FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Admin full access to about sections" 
  ON public.about_sections FOR ALL 
  USING (true);

-- Create policies for about_images
CREATE POLICY "Public can view about images" 
  ON public.about_images FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM about_sections 
    WHERE id = about_images.section_id 
    AND is_published = true
  ));

CREATE POLICY "Admin full access to about images" 
  ON public.about_images FOR ALL 
  USING (true);

-- Add trigger for updated_at on about_sections
CREATE TRIGGER update_about_sections_updated_at
  BEFORE UPDATE ON public.about_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default sections
INSERT INTO public.about_sections (section_key, title, subtitle, content, section_type, display_order, is_published) VALUES
('hero', 'Our Story', 'Where Asian Fusion Meets Berlin Soul', 'Welcome to My Fcking Breakfast Club - a place where culinary boundaries dissolve and flavors dance together in perfect harmony. Our journey began with a simple dream: to create a space where traditional Asian cuisine meets contemporary Berlin culture.', 'text', 1, true),
('story', 'The Beginning', 'From Dream to Reality', 'It all started in a small kitchen in Berlin, where our founder experimented with fusion recipes that would later become the heart of our menu. Each dish tells a story of cultural exchange and culinary innovation.', 'text', 2, true),
('mission', 'Our Mission', 'More Than Just Food', 'We believe food is a universal language that brings people together. Our mission is to create memorable experiences through exceptional Asian fusion cuisine while fostering a sense of community in the heart of Berlin.', 'text', 3, true);
