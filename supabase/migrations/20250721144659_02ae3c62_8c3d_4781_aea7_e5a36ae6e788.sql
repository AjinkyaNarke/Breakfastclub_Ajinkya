
-- Create consent management tables
CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_session_id TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  essential_cookies BOOLEAN NOT NULL DEFAULT true,
  functional_cookies BOOLEAN NOT NULL DEFAULT false,
  analytics_cookies BOOLEAN NOT NULL DEFAULT false,
  marketing_cookies BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year'),
  ip_address INET,
  user_agent TEXT,
  language_preference TEXT NOT NULL DEFAULT 'de',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cookie categories table
CREATE TABLE public.cookie_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_key TEXT NOT NULL UNIQUE,
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_de TEXT NOT NULL,
  description_en TEXT NOT NULL,
  is_essential BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cookie definitions table
CREATE TABLE public.cookie_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cookie_name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES cookie_categories(id) ON DELETE CASCADE,
  purpose_de TEXT NOT NULL,
  purpose_en TEXT NOT NULL,
  duration TEXT NOT NULL,
  third_party_provider TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create privacy policy versions table
CREATE TABLE public.privacy_policy_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_number TEXT NOT NULL,
  content_de TEXT NOT NULL,
  content_en TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data subject requests table
CREATE TABLE public.data_subject_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  request_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  admin_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for consent records
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage their own consent" ON public.consent_records FOR ALL USING (true);

-- Add RLS policies for cookie categories
ALTER TABLE public.cookie_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view cookie categories" ON public.cookie_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to cookie categories" ON public.cookie_categories FOR ALL USING (true);

-- Add RLS policies for cookie definitions
ALTER TABLE public.cookie_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view cookie definitions" ON public.cookie_definitions FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to cookie definitions" ON public.cookie_definitions FOR ALL USING (true);

-- Add RLS policies for privacy policy versions
ALTER TABLE public.privacy_policy_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active privacy policy" ON public.privacy_policy_versions FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to privacy policy versions" ON public.privacy_policy_versions FOR ALL USING (true);

-- Add RLS policies for data subject requests
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can create data subject requests" ON public.data_subject_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access to data subject requests" ON public.data_subject_requests FOR ALL USING (true);

-- Insert default cookie categories
INSERT INTO public.cookie_categories (category_key, name_de, name_en, description_de, description_en, is_essential, display_order) VALUES
('essential', 'Notwendige Cookies', 'Essential Cookies', 'Diese Cookies sind für das ordnungsgemäße Funktionieren der Website erforderlich.', 'These cookies are necessary for the website to function properly.', true, 1),
('functional', 'Funktionale Cookies', 'Functional Cookies', 'Diese Cookies ermöglichen erweiterte Funktionalitäten und Personalisierung.', 'These cookies enable enhanced functionality and personalization.', false, 2),
('analytics', 'Analyse-Cookies', 'Analytics Cookies', 'Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website nutzen.', 'These cookies help us understand how visitors use our website.', false, 3),
('marketing', 'Marketing-Cookies', 'Marketing Cookies', 'Diese Cookies werden für Werbezwecke verwendet.', 'These cookies are used for advertising purposes.', false, 4);

-- Insert default cookie definitions
INSERT INTO public.cookie_definitions (cookie_name, category_id, purpose_de, purpose_en, duration) VALUES
('session_id', (SELECT id FROM cookie_categories WHERE category_key = 'essential'), 'Verwaltung der Benutzersitzung', 'Managing user session', 'Session'),
('csrf_token', (SELECT id FROM cookie_categories WHERE category_key = 'essential'), 'Schutz vor Cross-Site-Request-Forgery', 'Protection against Cross-Site Request Forgery', 'Session'),
('consent_preferences', (SELECT id FROM cookie_categories WHERE category_key = 'essential'), 'Speicherung der Cookie-Einstellungen', 'Storage of cookie preferences', '1 Jahr'),
('language_preference', (SELECT id FROM cookie_categories WHERE category_key = 'functional'), 'Speicherung der Spracheinstellung', 'Storage of language preference', '1 Jahr');

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consent_records_updated_at BEFORE UPDATE ON public.consent_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cookie_categories_updated_at BEFORE UPDATE ON public.cookie_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cookie_definitions_updated_at BEFORE UPDATE ON public.cookie_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_privacy_policy_versions_updated_at BEFORE UPDATE ON public.privacy_policy_versions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_subject_requests_updated_at BEFORE UPDATE ON public.data_subject_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
