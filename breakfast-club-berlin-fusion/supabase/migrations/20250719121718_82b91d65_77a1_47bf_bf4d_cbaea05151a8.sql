-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create menu categories table
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  regular_price DECIMAL(10,2),
  student_price DECIMAL(10,2),
  is_featured BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  dietary_tags TEXT[], -- array of tags like 'vegan', 'gluten-free'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gallery images table
CREATE TABLE public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'interior', 'kitchen', 'community', 'food'
  is_featured BOOLEAN DEFAULT false,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create restaurant videos table
CREATE TABLE public.restaurant_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  autoplay BOOLEAN DEFAULT false,
  show_controls BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content blocks table for homepage sections
CREATE TABLE public.content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name TEXT NOT NULL UNIQUE, -- 'hero', 'about', 'values'
  title TEXT,
  content TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('restaurant-images', 'restaurant-images', true),
  ('restaurant-videos', 'restaurant-videos', true);

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for website display)
CREATE POLICY "Public can view menu categories" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Public can view menu items" ON public.menu_items FOR SELECT USING (is_available = true);
CREATE POLICY "Public can view gallery images" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "Public can view videos" ON public.restaurant_videos FOR SELECT USING (true);
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view content blocks" ON public.content_blocks FOR SELECT USING (is_active = true);

-- Admin policies (will be authenticated through app logic for now)
CREATE POLICY "Admin full access to menu categories" ON public.menu_categories FOR ALL USING (true);
CREATE POLICY "Admin full access to menu items" ON public.menu_items FOR ALL USING (true);
CREATE POLICY "Admin full access to gallery images" ON public.gallery_images FOR ALL USING (true);
CREATE POLICY "Admin full access to videos" ON public.restaurant_videos FOR ALL USING (true);
CREATE POLICY "Admin full access to events" ON public.events FOR ALL USING (true);
CREATE POLICY "Admin full access to content blocks" ON public.content_blocks FOR ALL USING (true);
CREATE POLICY "Admin can view admin users" ON public.admin_users FOR SELECT USING (true);

-- Storage policies
CREATE POLICY "Public can view restaurant images" ON storage.objects FOR SELECT USING (bucket_id = 'restaurant-images');
CREATE POLICY "Admin can manage restaurant images" ON storage.objects FOR ALL USING (bucket_id = 'restaurant-images');
CREATE POLICY "Public can view restaurant videos" ON storage.objects FOR SELECT USING (bucket_id = 'restaurant-videos');
CREATE POLICY "Admin can manage restaurant videos" ON storage.objects FOR ALL USING (bucket_id = 'restaurant-videos');

-- Insert default admin user (password: Lami@007)
INSERT INTO public.admin_users (username, password_hash) VALUES 
  ('Admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- bcrypt hash of 'Lami@007'

-- Insert default menu categories
INSERT INTO public.menu_categories (name, description, display_order) VALUES
  ('Traditional', 'Classic breakfast dishes with authentic flavors', 1),
  ('Fusion', 'Creative breakfast combinations with international influences', 2),
  ('Sweet', 'Delicious sweet treats and desserts', 3),
  ('Hearty', 'Filling dishes for those big appetites', 4);

-- Insert sample content blocks
INSERT INTO public.content_blocks (section_name, title, content) VALUES
  ('hero', 'Welcome to fckingbreakfastclub', 'Where mornings meet community and every bite tells a story'),
  ('about', 'Our Story', 'A place where breakfast becomes an experience and community comes together'),
  ('values', 'Our Values', 'Quality ingredients, authentic flavors, and genuine connections');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_blocks_updated_at
  BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();