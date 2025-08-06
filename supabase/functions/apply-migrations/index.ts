import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Create preps table migration
    const createPrepsTable = `
      -- Create preps table for intermediate preparations
      CREATE TABLE IF NOT EXISTS public.preps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        name_de TEXT,
        name_en TEXT,
        description TEXT,
        description_de TEXT,
        description_en TEXT,
        batch_yield TEXT,
        batch_yield_amount DECIMAL(10,3),
        batch_yield_unit TEXT,
        instructions TEXT,
        instructions_de TEXT,
        instructions_en TEXT,
        notes TEXT,
        cost_per_batch DECIMAL(10,2) DEFAULT 0,
        cost_per_unit DECIMAL(10,4) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `

    const enableRLS = `
      -- Enable RLS
      ALTER TABLE public.preps ENABLE ROW LEVEL SECURITY;
    `

    const createPolicies = `
      -- Create policies for preps (drop if exists first)
      DROP POLICY IF EXISTS "Public can view active preps" ON public.preps;
      DROP POLICY IF EXISTS "Admin full access to preps" ON public.preps;
      
      CREATE POLICY "Public can view active preps" ON public.preps FOR SELECT USING (is_active = true);
      CREATE POLICY "Admin full access to preps" ON public.preps FOR ALL USING (true);
    `

    const createIndexes = `
      -- Create indexes for performance (if not exists)
      CREATE INDEX IF NOT EXISTS idx_preps_active ON public.preps (is_active);
      CREATE INDEX IF NOT EXISTS idx_preps_name ON public.preps (name);
      CREATE INDEX IF NOT EXISTS idx_preps_created_at ON public.preps (created_at);
    `

    const createPrepIngredientsTable = `
      -- Create prep_ingredients junction table
      CREATE TABLE IF NOT EXISTS public.prep_ingredients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prep_id UUID NOT NULL REFERENCES public.preps(id) ON DELETE CASCADE,
        ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
        quantity DECIMAL(10,3) NOT NULL,
        unit TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(prep_id, ingredient_id)
      );
    `

    const enablePrepIngredientsRLS = `
      -- Enable RLS
      ALTER TABLE public.prep_ingredients ENABLE ROW LEVEL SECURITY;
    `

    const createPrepIngredientsPolicies = `
      -- Create policies for prep_ingredients (drop if exists first)
      DROP POLICY IF EXISTS "Public can view prep ingredients" ON public.prep_ingredients;
      DROP POLICY IF EXISTS "Admin full access to prep ingredients" ON public.prep_ingredients;
      
      CREATE POLICY "Public can view prep ingredients" ON public.prep_ingredients FOR SELECT USING (true);
      CREATE POLICY "Admin full access to prep ingredients" ON public.prep_ingredients FOR ALL USING (true);
    `

    const createPrepIngredientsIndexes = `
      -- Create indexes for performance (if not exists)
      CREATE INDEX IF NOT EXISTS idx_prep_ingredients_prep_id ON public.prep_ingredients (prep_id);
      CREATE INDEX IF NOT EXISTS idx_prep_ingredients_ingredient_id ON public.prep_ingredients (ingredient_id);
    `

    const createCostCalculationFunction = `
      -- Create function to calculate prep costs automatically
      CREATE OR REPLACE FUNCTION public.calculate_prep_cost(prep_uuid UUID)
      RETURNS DECIMAL(10,2) AS $$
      DECLARE
        total_cost DECIMAL(10,2) := 0;
        ingredient_cost DECIMAL(10,2);
        prep_record RECORD;
      BEGIN
        -- Get prep details
        SELECT * INTO prep_record FROM public.preps WHERE id = prep_uuid;
        
        IF prep_record IS NULL THEN
          RETURN 0;
        END IF;
        
        -- Calculate total cost from ingredients
        SELECT COALESCE(SUM(
          CASE 
            WHEN i.cost_per_unit IS NOT NULL AND i.cost_per_unit > 0 THEN
              pi.quantity * i.cost_per_unit
            ELSE 0
          END
        ), 0) INTO total_cost
        FROM prep_ingredients pi
        JOIN ingredients i ON pi.ingredient_id = i.id
        WHERE pi.prep_id = prep_uuid AND i.is_active = true;
        
        -- Update prep cost
        UPDATE public.preps 
        SET 
          cost_per_batch = total_cost,
          cost_per_unit = CASE 
            WHEN prep_record.batch_yield_amount > 0 THEN total_cost / prep_record.batch_yield_amount
            ELSE total_cost
          END,
          updated_at = now()
        WHERE id = prep_uuid;
        
        RETURN total_cost;
      END;
      $$ LANGUAGE plpgsql;
    `

    const createTriggerFunction = `
      -- Create trigger to auto-update prep costs when ingredients change
      CREATE OR REPLACE FUNCTION public.update_prep_costs_trigger()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Handle different trigger events
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
          PERFORM public.calculate_prep_cost(NEW.prep_id);
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          PERFORM public.calculate_prep_cost(OLD.prep_id);
          RETURN OLD;
        END IF;
        
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `

    const createTriggers = `
      -- Drop trigger if exists and create new one
      DROP TRIGGER IF EXISTS update_prep_costs_on_ingredient_change ON public.prep_ingredients;
      
      CREATE TRIGGER update_prep_costs_on_ingredient_change
        AFTER INSERT OR UPDATE OR DELETE ON public.prep_ingredients
        FOR EACH ROW
        EXECUTE FUNCTION public.update_prep_costs_trigger();
    `

    const migrations = [
      createPrepsTable,
      enableRLS,
      createPolicies,
      createIndexes,
      createPrepIngredientsTable,
      enablePrepIngredientsRLS,
      createPrepIngredientsPolicies,
      createPrepIngredientsIndexes,
      createCostCalculationFunction,
      createTriggerFunction,
      createTriggers
    ]

    const results = []
    
    for (const migration of migrations) {
      try {
        const { data, error } = await supabaseClient.rpc('exec_sql', { sql: migration })
        if (error) {
          console.error('Migration error:', error)
          results.push({ success: false, error: error.message, sql: migration.substring(0, 100) + '...' })
        } else {
          results.push({ success: true, sql: migration.substring(0, 100) + '...' })
        }
      } catch (err) {
        console.error('Migration exception:', err)
        results.push({ success: false, error: err.message, sql: migration.substring(0, 100) + '...' })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Migrations applied',
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error applying migrations:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})