-- Create preps table for intermediate preparations
CREATE TABLE public.preps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_de TEXT,
  name_en TEXT,
  description TEXT,
  description_de TEXT,
  description_en TEXT,
  batch_yield TEXT, -- e.g., "500ml", "1kg", "20 portions"
  batch_yield_amount DECIMAL(10,3), -- numeric value for calculations
  batch_yield_unit TEXT, -- unit for calculations
  instructions TEXT,
  instructions_de TEXT,
  instructions_en TEXT,
  notes TEXT,
  cost_per_batch DECIMAL(10,2) DEFAULT 0, -- auto-calculated
  cost_per_unit DECIMAL(10,4) DEFAULT 0, -- cost per smallest unit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.preps ENABLE ROW LEVEL SECURITY;

-- Create policies for preps
CREATE POLICY "Public can view active preps" ON public.preps FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access to preps" ON public.preps FOR ALL USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_preps_updated_at
  BEFORE UPDATE ON public.preps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_preps_active ON public.preps (is_active);
CREATE INDEX idx_preps_name ON public.preps (name);
CREATE INDEX idx_preps_created_at ON public.preps (created_at);