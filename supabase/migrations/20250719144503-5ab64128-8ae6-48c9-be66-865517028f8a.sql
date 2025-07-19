
-- Insert sample events data to populate the events table
INSERT INTO public.events (title, description, event_date, max_participants, current_participants, image_url, is_active) VALUES
(
  'Acoustic Brunch & Asian Vibes',
  'Live acoustic music with traditional Asian breakfast and cultural exchange',
  '2025-01-25 10:00:00+00:00',
  30,
  24,
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
  true
),
(
  'Dim Sum Making Workshop',
  'Learn to make traditional dim sum with our chef from Hong Kong',
  '2025-01-26 11:00:00+00:00',
  20,
  18,
  'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&h=600&fit=crop',
  true
),
(
  'Community Connect',
  'Monthly gathering for international students and Berlin locals',
  '2025-01-27 09:30:00+00:00',
  40,
  32,
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop',
  true
);
