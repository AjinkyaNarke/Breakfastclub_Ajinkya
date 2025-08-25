-- Create reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 20),
  special_requests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  admin_notes TEXT,
  language_preference TEXT DEFAULT 'de' CHECK (language_preference IN ('de', 'en')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Create reservation settings table for configuration
CREATE TABLE public.reservation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for reservations
CREATE POLICY "Public can create reservations" 
  ON public.reservations FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admin full access to reservations" 
  ON public.reservations FOR ALL 
  USING (true);

-- Create policies for reservation settings
CREATE POLICY "Admin full access to reservation settings" 
  ON public.reservation_settings FOR ALL 
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservation_settings_updated_at
  BEFORE UPDATE ON public.reservation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.reservation_settings (setting_key, setting_value) VALUES
('opening_hours', '{"monday": {"open": "08:00", "close": "22:00"}, "tuesday": {"open": "08:00", "close": "22:00"}, "wednesday": {"open": "08:00", "close": "22:00"}, "thursday": {"open": "08:00", "close": "22:00"}, "friday": {"open": "08:00", "close": "22:00"}, "saturday": {"open": "09:00", "close": "23:00"}, "sunday": {"open": "09:00", "close": "21:00"}}'),
('max_capacity', '{"per_slot": 50, "max_party_size": 20}'),
('advance_booking', '{"min_hours": 2, "max_days": 30}'),
('time_slots', '{"interval_minutes": 30, "last_seating_before_close_minutes": 60}');