-- Create prep_usage_log table for tracking real prep usage over time
CREATE TABLE prep_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prep_id UUID NOT NULL REFERENCES preps(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  cost_contribution DECIMAL(10,2) NOT NULL DEFAULT 0,
  usage_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_prep_usage_log_prep_id ON prep_usage_log(prep_id);
CREATE INDEX idx_prep_usage_log_menu_item_id ON prep_usage_log(menu_item_id);
CREATE INDEX idx_prep_usage_log_usage_date ON prep_usage_log(usage_date DESC);
CREATE INDEX idx_prep_usage_log_created_at ON prep_usage_log(created_at DESC);

-- Create RLS policies
ALTER TABLE prep_usage_log ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all prep usage logs
CREATE POLICY "Authenticated users can read prep usage logs" ON prep_usage_log
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Authenticated users can insert prep usage logs
CREATE POLICY "Authenticated users can insert prep usage logs" ON prep_usage_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update prep usage logs
CREATE POLICY "Authenticated users can update prep usage logs" ON prep_usage_log
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete prep usage logs
CREATE POLICY "Authenticated users can delete prep usage logs" ON prep_usage_log
  FOR DELETE TO authenticated
  USING (true);

-- Function to automatically calculate cost contribution when inserting/updating
CREATE OR REPLACE FUNCTION calculate_prep_usage_cost()
RETURNS TRIGGER AS $$
DECLARE
  prep_cost DECIMAL(10,2);
  prep_batch_yield TEXT;
  batch_quantity DECIMAL(10,3);
  cost_per_unit DECIMAL(10,2);
BEGIN
  -- Get prep cost and batch yield
  SELECT cost_per_batch, batch_yield 
  INTO prep_cost, prep_batch_yield
  FROM preps 
  WHERE id = NEW.prep_id;
  
  -- Parse batch yield to extract quantity (simple parsing for common formats)
  IF prep_batch_yield IS NOT NULL AND prep_cost IS NOT NULL THEN
    -- Extract numeric value from batch yield (e.g., "500ml" -> 500, "1kg" -> 1000)
    batch_quantity := CAST(regexp_replace(prep_batch_yield, '[^0-9.]', '', 'g') AS DECIMAL(10,3));
    
    -- Convert to base units (grams/ml) for consistency
    IF prep_batch_yield ILIKE '%kg%' THEN
      batch_quantity := batch_quantity * 1000;  -- kg to g
    ELSIF prep_batch_yield ILIKE '%l%' AND NOT prep_batch_yield ILIKE '%ml%' THEN
      batch_quantity := batch_quantity * 1000;  -- l to ml
    END IF;
    
    -- Calculate cost per unit
    IF batch_quantity > 0 THEN
      cost_per_unit := prep_cost / batch_quantity;
      NEW.cost_contribution := cost_per_unit * NEW.quantity;
    END IF;
  END IF;
  
  -- Set updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate cost contribution
CREATE TRIGGER trigger_calculate_prep_usage_cost
  BEFORE INSERT OR UPDATE ON prep_usage_log
  FOR EACH ROW
  EXECUTE FUNCTION calculate_prep_usage_cost();

-- Function to log prep usage when menu items are prepared
CREATE OR REPLACE FUNCTION log_prep_usage(
  p_prep_id UUID,
  p_menu_item_id UUID,
  p_quantity DECIMAL(10,3),
  p_unit VARCHAR(50),
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  usage_log_id UUID;
BEGIN
  INSERT INTO prep_usage_log (prep_id, menu_item_id, quantity, unit, usage_date, notes)
  VALUES (p_prep_id, p_menu_item_id, p_quantity, p_unit, NOW(), p_notes)
  RETURNING id INTO usage_log_id;
  
  RETURN usage_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy prep usage analytics
CREATE OR REPLACE VIEW prep_usage_analytics AS
SELECT 
  p.id as prep_id,
  p.name as prep_name,
  p.name_de as prep_name_de,
  p.name_en as prep_name_en,
  COUNT(pul.id) as total_usage_count,
  COUNT(DISTINCT pul.menu_item_id) as unique_menu_items_count,
  SUM(pul.quantity) as total_quantity_used,
  AVG(pul.quantity) as average_quantity_per_usage,
  SUM(pul.cost_contribution) as total_cost_contribution,
  AVG(pul.cost_contribution) as average_cost_per_usage,
  MAX(pul.usage_date) as last_used_date,
  p.cost_per_batch,
  p.batch_yield,
  -- Calculate batch utilization rate
  CASE 
    WHEN p.batch_yield IS NOT NULL THEN
      (SUM(pul.quantity) / NULLIF(CAST(regexp_replace(p.batch_yield, '[^0-9.]', '', 'g') AS DECIMAL(10,3)), 0)) * 100
    ELSE 0
  END as batch_utilization_rate
FROM preps p
LEFT JOIN prep_usage_log pul ON p.id = pul.prep_id
GROUP BY p.id, p.name, p.name_de, p.name_en, p.cost_per_batch, p.batch_yield
ORDER BY total_usage_count DESC NULLS LAST;

-- Grant permissions
GRANT SELECT ON prep_usage_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION log_prep_usage TO authenticated;