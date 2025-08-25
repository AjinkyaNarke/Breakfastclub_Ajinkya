/**
 * Enhanced database types for ingredient costing, recipe tracking, and prep management
 * Extensions to the base Supabase types for cost calculation features
 */

import { Database } from './types';

// Enhanced ingredient with price tracking
export interface EnhancedIngredient extends Database['public']['Tables']['ingredients']['Row'] {
  // Price tracking fields (to be added to DB schema)
  price_per_kilo?: number;
  price_per_unit?: number;
  price_currency?: string;
  price_last_updated?: string;
  supplier_name?: string;
  bulk_price_breaks?: Array<{
    min_quantity: number;
    price_per_unit: number;
    unit: string;
  }>;
}

// Recipe ingredient with detailed costing
export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  ingredient: EnhancedIngredient;
  quantity: number;
  unit: string;
  // Costing fields
  unit_cost: number;
  total_cost: number;
  price_per_kilo_when_added: number;
  conversion_factor: number; // For unit conversions (e.g., 1 piece = 100g)
  waste_percentage: number; // Account for prep waste
  notes?: string;
  created_at: string;
}

// Recipe with full cost breakdown
export interface Recipe {
  id: string;
  menu_item_id: string;
  name: string;
  serving_size: number;
  servings_per_batch: number;
  total_cost: number;
  cost_per_serving: number;
  labor_cost_minutes: number;
  labor_cost_euros: number;
  overhead_percentage: number;
  total_food_cost: number;
  suggested_price_30_percent: number;
  suggested_price_25_percent: number;
  suggested_price_35_percent: number;
  ingredients: RecipeIngredient[];
  created_at: string;
  updated_at: string;
}

// Unit conversion system
export interface UnitConversion {
  from_unit: string;
  to_unit: string;
  factor: number;
  ingredient_type?: string; // Optional: specific to ingredient types
}

// Pricing calculation result
export interface PricingCalculation {
  totalFoodCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  suggestedPrices: {
    foodCost25: number; // 25% food cost target
    foodCost30: number; // 30% food cost target
    foodCost35: number; // 35% food cost target
  };
  profitMargins: {
    at25Percent: number;
    at30Percent: number;
    at35Percent: number;
  };
  breakdown: Array<{
    ingredient: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    percentage: number;
  }>;
}

// Speech parsing result for ingredients with pricing
export interface ParsedIngredientWithCost {
  name: string;
  quantity: number;
  unit: string;
  pricePerKilo?: number;
  pricePerUnit?: number;
  currency: string;
  confidence: number;
  originalText: string;
}

// Enhanced speech parsing result
export interface EnhancedVoiceParsingResult {
  dishName: string;
  description: string;
  ingredients: ParsedIngredientWithCost[];
  totalEstimatedCost: number;
  suggestedPrice: number;
  category: string;
  cuisineType: string;
  servingSize: number;
  preparationTime?: number;
  confidence: number;
}

// Database schema additions (for migration scripts)
export interface DatabaseMigrations {
  // Add to ingredients table
  addToIngredients: {
    price_per_kilo: 'DECIMAL(10,4) DEFAULT NULL',
    price_per_unit: 'DECIMAL(10,4) DEFAULT NULL',
    price_currency: 'VARCHAR(3) DEFAULT \'EUR\'',
    price_last_updated: 'TIMESTAMP DEFAULT NULL',
    supplier_name: 'VARCHAR(255) DEFAULT NULL',
    bulk_price_breaks: 'JSONB DEFAULT NULL',
    waste_percentage: 'DECIMAL(5,2) DEFAULT 0.00',
    conversion_factor_to_grams: 'DECIMAL(10,4) DEFAULT NULL'
  };
  
  // New recipe_ingredients table with costing
  createRecipeIngredientsTable: string;
  
  // New recipes table
  createRecipesTable: string;
  
  // Unit conversions table
  createUnitConversionsTable: string;
}

// Enhanced prep with detailed costing and usage tracking
export interface EnhancedPrep extends Database['public']['Tables']['preps']['Row'] {
  // Usage tracking fields
  total_usage_count?: number;
  unique_menu_items_count?: number;
  last_used_date?: string;
  batch_utilization_rate?: number; // Percentage of batch yield typically used
  cost_efficiency_rating?: 'excellent' | 'good' | 'moderate' | 'high';
  usage_trend?: 'increasing' | 'stable' | 'decreasing';
  
  // Enhanced costing fields
  cost_per_unit_calculated?: number;
  total_cost_contribution?: number;
  average_cost_per_menu_item?: number;
  
  // Related data
  ingredients?: PrepIngredient[];
  menu_items_using?: string[];
}

// Prep ingredient with detailed costing
export interface PrepIngredient {
  id: string;
  prep_id: string;
  ingredient_id: string;
  ingredient: EnhancedIngredient;
  quantity: number;
  unit: string;
  // Costing fields
  unit_cost: number;
  total_cost: number;
  percentage_of_prep_cost: number;
  notes?: string;
  created_at: string;
}

// Prep usage tracking
export interface PrepUsage {
  prep_id: string;
  menu_item_id: string;
  quantity: number;
  unit: string;
  usage_date: string;
  menu_item_name: string;
  prep_name: string;
  cost_contribution: number;
}

// Prep analytics summary
export interface PrepAnalytics {
  prep_id: string;
  prep_name: string;
  total_usage_count: number;
  unique_menu_items: number;
  total_quantity_used: number;
  average_quantity_per_usage: number;
  total_cost_contribution: number;
  average_cost_per_menu_item: number;
  popularity_rank: number;
  cost_efficiency: 'excellent' | 'good' | 'moderate' | 'high';
  usage_trend: 'increasing' | 'stable' | 'decreasing';
  menu_items_using: string[];
  last_used?: string;
  batch_utilization_rate: number;
}

// Prep optimization recommendation
export interface PrepRecommendation {
  type: 'optimization' | 'promotion' | 'discontinuation' | 'batch_adjustment';
  prep_id: string;
  prep_name: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  potential_savings?: number;
  action_items: string[];
}

// Menu item component (ingredient or prep)
export type MenuItemComponent = 
  | { type: 'ingredient'; ingredient: EnhancedIngredient; quantity: number; unit: string }
  | { type: 'prep'; prep: EnhancedPrep; quantity: number; unit: string };

// Enhanced menu item with prep support
export interface EnhancedMenuItem extends Database['public']['Tables']['menu_items']['Row'] {
  // Enhanced costing with prep support
  total_food_cost?: number;
  ingredient_cost?: number;
  prep_cost?: number;
  labor_cost?: number;
  overhead_cost?: number;
  total_cost?: number;
  cost_per_serving?: number;
  
  // Components (ingredients and preps)
  components?: MenuItemComponent[];
  
  // Suggested pricing
  suggested_prices?: {
    foodCost25: number;
    foodCost30: number;
    foodCost35: number;
  };
  
  // Profit margins
  profit_margins?: {
    at25Percent: number;
    at30Percent: number;
    at35Percent: number;
  };
}

// SQL for creating enhanced tables
export const CREATE_ENHANCED_TABLES = {
  recipe_ingredients: `
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
      ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
      quantity DECIMAL(10,4) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      unit_cost DECIMAL(10,4) NOT NULL,
      total_cost DECIMAL(10,4) NOT NULL,
      price_per_kilo_when_added DECIMAL(10,4),
      conversion_factor DECIMAL(10,4) DEFAULT 1.0,
      waste_percentage DECIMAL(5,2) DEFAULT 0.00,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `,
  
  recipes: `
    CREATE TABLE IF NOT EXISTS recipes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      serving_size DECIMAL(8,2) DEFAULT 1.0,
      servings_per_batch INTEGER DEFAULT 1,
      total_cost DECIMAL(10,4) DEFAULT 0.00,
      cost_per_serving DECIMAL(10,4) DEFAULT 0.00,
      labor_cost_minutes INTEGER DEFAULT 0,
      labor_cost_euros DECIMAL(8,4) DEFAULT 0.00,
      overhead_percentage DECIMAL(5,2) DEFAULT 0.00,
      total_food_cost DECIMAL(10,4) DEFAULT 0.00,
      suggested_price_30_percent DECIMAL(8,4) DEFAULT 0.00,
      suggested_price_25_percent DECIMAL(8,4) DEFAULT 0.00,
      suggested_price_35_percent DECIMAL(8,4) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `,
  
  unit_conversions: `
    CREATE TABLE IF NOT EXISTS unit_conversions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      from_unit VARCHAR(50) NOT NULL,
      to_unit VARCHAR(50) NOT NULL,
      factor DECIMAL(15,8) NOT NULL,
      ingredient_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(from_unit, to_unit, ingredient_type)
    );
  `
};

// Add enhanced columns to existing ingredients table
export const ALTER_INGREDIENTS_TABLE = `
  ALTER TABLE ingredients 
  ADD COLUMN IF NOT EXISTS price_per_kilo DECIMAL(10,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_currency VARCHAR(3) DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS price_last_updated TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bulk_price_breaks JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS waste_percentage DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS conversion_factor_to_grams DECIMAL(10,4) DEFAULT NULL;
`;