-- Create branding storage bucket for logo and favicon uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for branding bucket
-- Allow public read access
CREATE POLICY "Public read access for branding bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'branding');

-- Allow authenticated users to upload/update branding files
CREATE POLICY "Authenticated users can upload branding files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'branding' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update branding files" ON storage.objects
FOR UPDATE USING (bucket_id = 'branding' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete branding files" ON storage.objects
FOR DELETE USING (bucket_id = 'branding' AND auth.role() = 'authenticated');