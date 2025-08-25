-- Create sales data table for restaurant analytics
CREATE TABLE IF NOT EXISTS sales_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    category VARCHAR(100) NOT NULL,
    description TEXT,
    items INTEGER DEFAULT 1 CHECK (items > 0),
    location VARCHAR(100),
    staff VARCHAR(100),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'digital')),
    source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'import', 'api')),
    confidence_score INTEGER DEFAULT 100 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    raw_transcript TEXT, -- For voice-input entries
    parsed_fields JSONB, -- Metadata from voice parsing
    validation_status VARCHAR(20) DEFAULT 'valid' CHECK (validation_status IN ('valid', 'flagged', 'review_required')),
    validation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- Admin user who created the entry
    updated_by UUID -- Admin user who last updated the entry
);

-- Create indexes for performance
CREATE INDEX idx_sales_data_date ON sales_data (date);
CREATE INDEX idx_sales_data_category ON sales_data (category);
CREATE INDEX idx_sales_data_created_at ON sales_data (created_at);
CREATE INDEX idx_sales_data_amount ON sales_data (amount);
CREATE INDEX idx_sales_data_validation_status ON sales_data (validation_status);

-- Create sales categories lookup table
CREATE TABLE IF NOT EXISTS sales_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_de VARCHAR(100),
    name_en VARCHAR(100),
    description TEXT,
    color VARCHAR(7), -- Hex color for UI
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default sales categories
INSERT INTO sales_categories (name, name_de, name_en, description, color, display_order) VALUES
('breakfast', 'Frühstück', 'Breakfast', 'Morning meal items', '#FF6B6B', 1),
('lunch', 'Mittagessen', 'Lunch', 'Midday meal items', '#4ECDC4', 2),
('dinner', 'Abendessen', 'Dinner', 'Evening meal items', '#45B7D1', 3),
('beverages', 'Getränke', 'Beverages', 'All drinks and beverages', '#96CEB4', 4),
('snacks', 'Snacks', 'Snacks', 'Light snacks and appetizers', '#FFEAA7', 5),
('desserts', 'Desserts', 'Desserts', 'Sweet desserts and treats', '#DDA0DD', 6),
('catering', 'Catering', 'Catering', 'Catering and event services', '#98D8C8', 7),
('merchandise', 'Merchandise', 'Merchandise', 'Restaurant merchandise and retail', '#A0A0A0', 8),
('other', 'Sonstiges', 'Other', 'Other miscellaneous sales', '#D3D3D3', 99)
ON CONFLICT (name) DO NOTHING;

-- Create business metrics summary table for caching
CREATE TABLE IF NOT EXISTS business_metrics_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    metrics_data JSONB NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_valid BOOLEAN DEFAULT true
);

-- Create index for cache lookups
CREATE INDEX idx_business_metrics_cache_key ON business_metrics_cache (cache_key);
CREATE INDEX idx_business_metrics_cache_expires ON business_metrics_cache (expires_at);

-- Create usage tracking table for AI analytics
CREATE TABLE IF NOT EXISTS analytics_usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_session VARCHAR(255),
    service VARCHAR(50) NOT NULL, -- 'deepseek-r1', 'deepseek-v3', 'deepgram', etc.
    operation VARCHAR(100) NOT NULL,
    points_used INTEGER NOT NULL CHECK (points_used >= 0),
    request_metadata JSONB,
    response_metadata JSONB,
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for usage tracking
CREATE INDEX idx_analytics_usage_created_at ON analytics_usage_tracking (created_at);
CREATE INDEX idx_analytics_usage_service ON analytics_usage_tracking (service);
CREATE INDEX idx_analytics_usage_user_session ON analytics_usage_tracking (user_session);

-- Create data summaries table for context management
CREATE TABLE IF NOT EXISTS data_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_id VARCHAR(255) NOT NULL,
    summary_name VARCHAR(255) NOT NULL,
    original_size INTEGER NOT NULL,
    summary_size INTEGER NOT NULL,
    compression_ratio DECIMAL(5,2) NOT NULL,
    key_insights TEXT[] NOT NULL,
    time_range_start TIMESTAMP WITH TIME ZONE,
    time_range_end TIMESTAMP WITH TIME ZONE,
    summary_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for data summaries
CREATE INDEX idx_data_summaries_folder_id ON data_summaries (folder_id);
CREATE INDEX idx_data_summaries_created_at ON data_summaries (created_at);

-- Create RLS (Row Level Security) policies
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_summaries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and write sales data
CREATE POLICY "Allow authenticated users to manage sales data" ON sales_data
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow all users to read sales categories (for dropdown options)
CREATE POLICY "Allow all to read sales categories" ON sales_categories
    FOR SELECT USING (true);

-- Allow authenticated users to manage categories
CREATE POLICY "Allow authenticated users to manage sales categories" ON sales_categories
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to read business metrics cache
CREATE POLICY "Allow authenticated users to read metrics cache" ON business_metrics_cache
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to manage metrics cache
CREATE POLICY "Allow service role to manage metrics cache" ON business_metrics_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own usage tracking
CREATE POLICY "Allow users to read own usage tracking" ON analytics_usage_tracking
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to manage usage tracking
CREATE POLICY "Allow service role to manage usage tracking" ON analytics_usage_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to manage data summaries
CREATE POLICY "Allow authenticated users to manage data summaries" ON data_summaries
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sales_data_updated_at 
    BEFORE UPDATE ON sales_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_categories_updated_at 
    BEFORE UPDATE ON sales_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM business_metrics_cache 
    WHERE expires_at < NOW() OR is_valid = false;
    
    DELETE FROM analytics_usage_tracking 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM data_summaries 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to validate sales data
CREATE OR REPLACE FUNCTION validate_sales_entry(
    p_date DATE,
    p_amount DECIMAL,
    p_category TEXT,
    p_source TEXT DEFAULT 'manual'
)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{"valid": true, "warnings": [], "errors": []}';
    warnings TEXT[] := '{}';
    errors TEXT[] := '{}';
BEGIN
    -- Check if date is in future
    IF p_date > CURRENT_DATE THEN
        errors := array_append(errors, 'Date cannot be in the future');
    END IF;
    
    -- Check if date is too far in past (more than 2 years)
    IF p_date < CURRENT_DATE - INTERVAL '2 years' THEN
        warnings := array_append(warnings, 'Date is more than 2 years old');
    END IF;
    
    -- Check amount is reasonable
    IF p_amount <= 0 THEN
        errors := array_append(errors, 'Amount must be greater than 0');
    END IF;
    
    IF p_amount > 10000 THEN
        warnings := array_append(warnings, 'Amount is unusually high');
    END IF;
    
    -- Check if category exists
    IF NOT EXISTS (SELECT 1 FROM sales_categories WHERE name = p_category AND is_active = true) THEN
        warnings := array_append(warnings, 'Category not found in predefined categories');
    END IF;
    
    -- Check for potential duplicates (same date, amount, category)
    IF EXISTS (
        SELECT 1 FROM sales_data 
        WHERE date = p_date 
        AND amount = p_amount 
        AND category = p_category 
        AND created_at > NOW() - INTERVAL '1 hour'
    ) THEN
        warnings := array_append(warnings, 'Potential duplicate entry detected');
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'valid', array_length(errors, 1) IS NULL,
        'warnings', warnings,
        'errors', errors
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;