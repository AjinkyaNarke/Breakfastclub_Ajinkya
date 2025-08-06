-- Create admin settings table for AI credits and other settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_credits DECIMAL(10,4) DEFAULT 10.00,
  ai_credits_limit DECIMAL(10,4) DEFAULT 10.00,
  image_generation_enabled BOOLEAN DEFAULT true,
  max_images_per_month INTEGER DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin full access to settings
CREATE POLICY "Admin full access to admin settings" 
  ON public.admin_settings FOR ALL 
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.admin_settings (ai_credits, ai_credits_limit) 
VALUES (10.00, 10.00)
ON CONFLICT DO NOTHING; 