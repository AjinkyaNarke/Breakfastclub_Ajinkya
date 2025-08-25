/**
 * Prep-related TypeScript types and interfaces
 * Centralized type definitions for prep management functionality
 */

import { Database } from '@/integrations/supabase/types';

// Base prep type from database
export type Prep = Database['public']['Tables']['preps']['Row'];
export type PrepInsert = Database['public']['Tables']['preps']['Insert'];
export type PrepUpdate = Database['public']['Tables']['preps']['Update'];

// Base prep ingredient type from database
export type PrepIngredient = Database['public']['Tables']['prep_ingredients']['Row'];
export type PrepIngredientInsert = Database['public']['Tables']['prep_ingredients']['Insert'];
export type PrepIngredientUpdate = Database['public']['Tables']['prep_ingredients']['Update'];

// Base menu item ingredient type from database (supports both ingredients and preps)
export type MenuItemIngredient = Database['public']['Tables']['menu_item_ingredients']['Row'];
export type MenuItemIngredientInsert = Database['public']['Tables']['menu_item_ingredients']['Insert'];
export type MenuItemIngredientUpdate = Database['public']['Tables']['menu_item_ingredients']['Update'];

// Enhanced prep with additional computed fields
export interface EnhancedPrep extends Prep {
  // Usage analytics
  total_usage_count?: number;
  unique_menu_items_count?: number;
  last_used_date?: string;
  batch_utilization_rate?: number;
  cost_efficiency_rating?: 'excellent' | 'good' | 'moderate' | 'high';
  usage_trend?: 'increasing' | 'stable' | 'decreasing';
  
  // Cost calculations
  cost_per_unit_calculated?: number;
  total_cost_contribution?: number;
  average_cost_per_menu_item?: number;
  
  // Related data
  ingredients?: PrepIngredientWithIngredient[];
  menu_items_using?: string[];
}

// Prep ingredient with full ingredient details
export interface PrepIngredientWithIngredient extends PrepIngredient {
  ingredient: Database['public']['Tables']['ingredients']['Row'];
  unit_cost?: number;
  total_cost?: number;
  percentage_of_prep_cost?: number;
}

// Menu item component (discriminated union for ingredients or preps)
export type MenuItemComponent = 
  | { type: 'ingredient'; ingredient: Database['public']['Tables']['ingredients']['Row']; quantity: number; unit: string }
  | { type: 'prep'; prep: EnhancedPrep; quantity: number; unit: string };

// Prep usage tracking
export interface PrepUsage {
  prep_id: string;
  menu_item_id: string;
  quantity: number;
  unit: string;
  usage_date?: string;
  menu_item_name: string;
  prep_name: string;
  cost_contribution?: number;
}

// Prep analytics summary
export interface PrepUsageAnalytics {
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

// Prep usage insights
export interface PrepUsageInsights {
  most_popular_preps: PrepUsageAnalytics[];
  most_cost_efficient_preps: PrepUsageAnalytics[];
  underutilized_preps: PrepUsageAnalytics[];
  high_cost_preps: PrepUsageAnalytics[];
  prep_recommendations: PrepRecommendation[];
  overall_stats: {
    total_preps: number;
    active_preps: number;
    total_usage_count: number;
    average_usage_per_prep: number;
    total_cost_contribution: number;
  };
}

// Prep form data for creation/editing
export interface PrepFormData {
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  batch_yield: string;
  notes?: string;
  is_active: boolean;
  ingredients: PrepIngredientFormData[];
}

// Prep ingredient form data
export interface PrepIngredientFormData {
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes?: string;
}

// Prep cost calculation result
export interface PrepCostCalculation {
  total_cost: number;
  cost_per_unit: number;
  cost_per_batch: number;
  batch_yield_parsed: {
    quantity: number;
    unit: string;
  };
  ingredient_breakdown: Array<{
    ingredient_id: string;
    ingredient_name: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
    percentage: number;
  }>;
}

// Prep search and filter options
export interface PrepSearchFilters {
  search?: string;
  is_active?: boolean;
  cost_efficiency?: 'excellent' | 'good' | 'moderate' | 'high';
  usage_trend?: 'increasing' | 'stable' | 'decreasing';
  min_usage_count?: number;
  max_usage_count?: number;
}

// Prep batch yield parsing result
export interface BatchYieldParsed {
  quantity: number;
  unit: string;
  isValid: boolean;
}

// Prep validation errors
export interface PrepValidationErrors {
  name?: string;
  batch_yield?: string;
  ingredients?: string;
  general?: string;
}

// Prep API response types
export interface PrepListResponse {
  preps: EnhancedPrep[];
  total: number;
  page: number;
  limit: number;
}

export interface PrepDetailResponse {
  prep: EnhancedPrep;
  usage_analytics?: PrepUsageAnalytics;
  recommendations?: PrepRecommendation[];
}

export interface PrepCreateResponse {
  prep: EnhancedPrep;
  cost_calculation: PrepCostCalculation;
}

export interface PrepUpdateResponse {
  prep: EnhancedPrep;
  cost_calculation: PrepCostCalculation;
}

// Prep usage tracking response
export interface PrepUsageResponse {
  usages: PrepUsage[];
  analytics: PrepUsageAnalytics[];
  insights: PrepUsageInsights;
}

// Utility types for component props
export interface PrepManagementProps {
  onPrepCreated?: (prep: EnhancedPrep) => void;
  onPrepUpdated?: (prep: EnhancedPrep) => void;
  onPrepDeleted?: (prepId: string) => void;
}

export interface PrepDialogProps {
  prep?: EnhancedPrep;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (prep: PrepFormData) => Promise<void>;
}

export interface PrepAnalyticsProps {
  analytics: PrepUsageAnalytics[];
  insights: PrepUsageInsights;
  className?: string;
}

// Type guards
export function isPrepComponent(component: MenuItemComponent): component is { type: 'prep'; prep: EnhancedPrep; quantity: number; unit: string } {
  return component.type === 'prep';
}

export function isIngredientComponent(component: MenuItemComponent): component is { type: 'ingredient'; ingredient: Database['public']['Tables']['ingredients']['Row']; quantity: number; unit: string } {
  return component.type === 'ingredient';
}

// Helper types for form validation
export type PrepFormField = keyof PrepFormData;
export type PrepValidationField = keyof PrepValidationErrors;

// Constants
export const PREP_COST_EFFICIENCY_THRESHOLDS = {
  excellent: 2,
  good: 5,
  moderate: 10,
  high: Infinity
} as const;

export const PREP_USAGE_TREND_THRESHOLDS = {
  increasing: { usageCount: 10, uniqueMenuItems: 3 },
  stable: { usageCount: 5, uniqueMenuItems: 2 },
  decreasing: { usageCount: 0, uniqueMenuItems: 0 }
} as const; 