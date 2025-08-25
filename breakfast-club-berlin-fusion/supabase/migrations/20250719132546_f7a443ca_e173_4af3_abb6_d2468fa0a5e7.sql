
-- Create press_articles table to store press coverage
CREATE TABLE public.press_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  publication_name TEXT NOT NULL,
  article_url TEXT NOT NULL,
  publication_date DATE NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for press articles
ALTER TABLE public.press_articles ENABLE ROW LEVEL SECURITY;

-- Allow public to view press articles
CREATE POLICY "Public can view press articles" 
  ON public.press_articles 
  FOR SELECT 
  USING (true);

-- Allow admin full access to press articles
CREATE POLICY "Admin full access to press articles" 
  ON public.press_articles 
  FOR ALL 
  USING (true);

-- Add trigger to update updated_at column
CREATE TRIGGER update_press_articles_updated_at
  BEFORE UPDATE ON public.press_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
