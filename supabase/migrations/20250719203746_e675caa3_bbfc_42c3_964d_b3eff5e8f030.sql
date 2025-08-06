
-- Phase 1: Database Schema Enhancement
-- Add new fields to existing menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS ingredients TEXT,
ADD COLUMN IF NOT EXISTS cuisine_type TEXT DEFAULT 'fusion',
ADD COLUMN IF NOT EXISTS ai_generated_image BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_prompt_used TEXT,
ADD COLUMN IF NOT EXISTS image_generation_cost DECIMAL(8,6) DEFAULT 0;

-- Create AI image generations tracking table
CREATE TABLE IF NOT EXISTS ai_image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  prompt_used TEXT NOT NULL,
  image_url TEXT NOT NULL,
  generation_cost DECIMAL(8,6) NOT NULL,
  cuisine_type TEXT,
  category TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI usage tracking table for budget management
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT UNIQUE NOT NULL,
  images_generated INTEGER DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  budget_limit DECIMAL(10,6) DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for new tables
ALTER TABLE ai_image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Admin full access to AI generation tables
CREATE POLICY "Admin full access to ai_image_generations" 
  ON ai_image_generations FOR ALL 
  USING (true);

CREATE POLICY "Admin full access to ai_usage_tracking" 
  ON ai_usage_tracking FOR ALL 
  USING (true);

-- Public can view successful generations (for analytics if needed)
CREATE POLICY "Public can view successful generations" 
  ON ai_image_generations FOR SELECT 
  USING (status = 'success');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_usage_tracking_updated_at
  BEFORE UPDATE ON ai_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_usage_updated_at();

-- Insert initial usage tracking record for current month
INSERT INTO ai_usage_tracking (month_year, images_generated, total_cost)
VALUES (
  TO_CHAR(NOW(), 'YYYY-MM'),
  0,
  0.00
)
ON CONFLICT (month_year) DO NOTHING;
