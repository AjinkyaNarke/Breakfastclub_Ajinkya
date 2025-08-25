import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface CreatedIngredient {
  id: string;
  name: string;
  category_id: string | null;
  category_name?: string;
  unit: string;
  cost_per_unit: number;
  dietary_properties: string[];
  allergens: string[];
  seasonal_availability: string[];
  supplier_info?: string;
  notes?: string;
  is_new: boolean;
  confidence_score: number;
}

interface IngredientCreationResult {
  created_ingredients: CreatedIngredient[];
  existing_ingredients: CreatedIngredient[];
  failed_ingredients: { name: string; reason: string }[];
  created_categories: { id: string; name: string }[];
  processing_summary: {
    total_processed: number;
    newly_created: number;
    already_existed: number;
    failed: number;
  };
}

interface IngredientAutoCreateOptions {
  onSuccess?: (result: IngredientCreationResult) => void;
  onError?: (error: string) => void;
  showToasts?: boolean;
  language?: 'en' | 'de';
  auto_categorize?: boolean;
  create_missing_categories?: boolean;
}

export function useIngredientAutoCreate(options: IngredientAutoCreateOptions = {}) {
  const { t } = useTranslation('admin');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<IngredientCreationResult | null>(null);
  
  const { 
    showToasts = true, 
    language = 'en',
    auto_categorize = true,
    create_missing_categories = true 
  } = options;

  const createIngredients = useCallback(async (
    ingredients: string[],
    context: {
      dish_name?: string;
      cuisine_type?: string;
      existing_ingredients?: string[];
    } = {}
  ): Promise<IngredientCreationResult> => {
    
    if (!ingredients || ingredients.length === 0) {
      throw new Error('Ingredients array is required');
    }

    setIsCreating(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('ingredient-auto-create', {
        body: {
          ingredients,
          language,
          context,
          auto_categorize,
          create_missing_categories
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Ingredient creation failed');
      }

      if (!data || !data.success) {
        throw new Error('Invalid response from ingredient creation service');
      }

      const result: IngredientCreationResult = {
        created_ingredients: data.created_ingredients || [],
        existing_ingredients: data.existing_ingredients || [],
        failed_ingredients: data.failed_ingredients || [],
        created_categories: data.created_categories || [],
        processing_summary: data.processing_summary || {
          total_processed: 0,
          newly_created: 0,
          already_existed: 0,
          failed: 0
        }
      };

      setLastResult(result);

      if (showToasts) {
        const { newly_created, already_existed, failed } = result.processing_summary;
        
        if (newly_created > 0) {
          toast.success(
            t('ingredientCreation.success', `Created ${newly_created} new ingredients`),
            {
              description: already_existed > 0 
                ? `${already_existed} ingredients already existed`
                : undefined
            }
          );
        } else if (already_existed > 0) {
          toast.info(
            t('ingredientCreation.allExisted', 'All ingredients already exist'),
            {
              description: `Found ${already_existed} existing ingredients`
            }
          );
        }

        if (failed > 0) {
          toast.warning(
            t('ingredientCreation.partialFailure', `${failed} ingredients failed to create`),
            {
              description: 'Check the failed ingredients list for details'
            }
          );
        }
      }

      options.onSuccess?.(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ingredient creation failed';
      setError(errorMessage);

      if (showToasts) {
        toast.error(
          t('ingredientCreation.error', 'Ingredient creation failed'),
          {
            description: errorMessage
          }
        );
      }

      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [language, auto_categorize, create_missing_categories, showToasts, t, options]);

  const createIngredientsFromParsedDish = useCallback(async (
    parsedDish: any
  ): Promise<IngredientCreationResult> => {
    const context = {
      dish_name: parsedDish.name,
      cuisine_type: parsedDish.cuisine_type,
      existing_ingredients: []
    };

    return createIngredients(parsedDish.ingredients || [], context);
  }, [createIngredients]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearLastResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    createIngredients,
    createIngredientsFromParsedDish,
    isCreating,
    error,
    lastResult,
    clearError,
    clearLastResult
  };
}

// Hook for getting ingredient creation analytics
export function useIngredientCreationAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: rpcError } = await supabase.rpc('get_ingredient_creation_analytics', {
        user_id: user.id
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setAnalytics(data?.[0] || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analytics,
    isLoading,
    error,
    loadAnalytics
  };
}

// Hook for getting ingredient creation patterns
export function useIngredientCreationPatterns() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatterns = useCallback(async (limit: number = 20) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: rpcError } = await supabase.rpc('get_ingredient_creation_patterns', {
        user_id: user.id,
        limit_count: limit
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      setPatterns(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patterns';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    patterns,
    isLoading,
    error,
    loadPatterns
  };
}

// Helper function to merge created ingredients with existing form data
export function mergeIngredientsWithFormData(
  result: IngredientCreationResult, 
  existingFormData: any = {}
): any {
  const allIngredients = [
    ...result.created_ingredients,
    ...result.existing_ingredients
  ];

  // Convert to the format expected by the form
  const selectedIngredients = allIngredients.map(ingredient => ({
    ingredient_id: ingredient.id,
    quantity: 1, // Default quantity
    unit: ingredient.unit,
    notes: ingredient.is_new ? 'Auto-created' : undefined,
    ingredient: {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      cost_per_unit: ingredient.cost_per_unit,
      category: ingredient.category_name
    }
  }));

  return {
    ...existingFormData,
    selected_ingredients: selectedIngredients
  };
}

// Helper function to validate ingredient creation result
export function validateIngredientCreationResult(result: IngredientCreationResult): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (result.processing_summary.failed > 0) {
    warnings.push(`${result.processing_summary.failed} ingredients failed to create`);
  }

  if (result.processing_summary.newly_created === 0 && result.processing_summary.already_existed === 0) {
    warnings.push('No ingredients were processed successfully');
  }

  // Check for low confidence scores
  const lowConfidenceIngredients = result.created_ingredients.filter(
    ing => ing.confidence_score < 0.5
  );
  
  if (lowConfidenceIngredients.length > 0) {
    warnings.push(`${lowConfidenceIngredients.length} ingredients have low confidence scores`);
  }

  return {
    isValid: result.processing_summary.failed === 0,
    warnings
  };
}

// Helper function to get ingredient creation summary text
export function getIngredientCreationSummary(result: IngredientCreationResult, t: any): string {
  const { newly_created, already_existed, failed } = result.processing_summary;
  
  const parts: string[] = [];
  
  if (newly_created > 0) {
    parts.push(t('ingredientCreation.summary.created', `${newly_created} created`));
  }
  
  if (already_existed > 0) {
    parts.push(t('ingredientCreation.summary.existed', `${already_existed} existed`));
  }
  
  if (failed > 0) {
    parts.push(t('ingredientCreation.summary.failed', `${failed} failed`));
  }

  if (result.created_categories.length > 0) {
    parts.push(t('ingredientCreation.summary.categories', `${result.created_categories.length} categories created`));
  }
  
  return parts.join(', ');
}

export type { CreatedIngredient, IngredientCreationResult, IngredientAutoCreateOptions };