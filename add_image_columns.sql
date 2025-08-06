-- Add image-related columns to ingredients table (if they don't exist)
DO $$ 
BEGIN
  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ingredients' AND column_name = 'image_url') THEN
    ALTER TABLE ingredients ADD COLUMN image_url TEXT;
  END IF;
  
  -- Add image_generated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ingredients' AND column_name = 'image_generated_at') THEN
    ALTER TABLE ingredients ADD COLUMN image_generated_at TIMESTAMP;
  END IF;
  
  -- Add image_generation_cost column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ingredients' AND column_name = 'image_generation_cost') THEN
    ALTER TABLE ingredients ADD COLUMN image_generation_cost DECIMAL(10,4);
  END IF;
  
  -- Add image_generation_prompt column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ingredients' AND column_name = 'image_generation_prompt') THEN
    ALTER TABLE ingredients ADD COLUMN image_generation_prompt TEXT;
  END IF;
END $$;

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_ingredients_image_generated_at ON ingredients(image_generated_at);
CREATE INDEX IF NOT EXISTS idx_ingredients_image_url ON ingredients(image_url) WHERE image_url IS NOT NULL;