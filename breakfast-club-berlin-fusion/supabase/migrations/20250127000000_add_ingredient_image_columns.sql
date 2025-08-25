-- Add image-related columns to ingredients table
ALTER TABLE ingredients 
ADD COLUMN image_url TEXT,
ADD COLUMN image_generated_at TIMESTAMP,
ADD COLUMN image_generation_cost DECIMAL(10,4),
ADD COLUMN image_generation_prompt TEXT;

-- Add image generation tracking to AI usage tracking (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_usage_tracking') THEN
        ALTER TABLE ai_usage_tracking 
        ADD COLUMN image_generation_count INTEGER DEFAULT 0,
        ADD COLUMN image_generation_cost_total DECIMAL(10,4) DEFAULT 0;
    END IF;
END $$;

-- Create index for faster queries on image generation status
CREATE INDEX IF NOT EXISTS idx_ingredients_image_generated_at ON ingredients(image_generated_at);
CREATE INDEX IF NOT EXISTS idx_ingredients_image_url ON ingredients(image_url) WHERE image_url IS NOT NULL; 