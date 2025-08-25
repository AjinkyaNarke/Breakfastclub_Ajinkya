-- Ensure site_branding table has a default row
INSERT INTO public.site_branding (
  site_name, 
  tagline, 
  favicon_url, 
  logo_url
) VALUES (
  'fckingbreakfastclub',
  'Asian Fusion • Berlin',
  '/favicon.ico',
  null
)
ON CONFLICT (id) DO NOTHING;

-- If no rows exist, insert the default
INSERT INTO public.site_branding (
  site_name, 
  tagline, 
  favicon_url, 
  logo_url
)
SELECT 
  'fckingbreakfastclub',
  'Asian Fusion • Berlin',
  '/favicon.ico',
  null
WHERE NOT EXISTS (SELECT 1 FROM public.site_branding);