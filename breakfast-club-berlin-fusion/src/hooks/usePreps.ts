import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  EnhancedPrep,
  PrepFormData,
  PrepIngredientFormData,
  PrepUsageAnalytics,
  PrepUsageInsights,
  PrepSearchFilters,
  PrepCostCalculation,
  PrepListResponse,
  PrepDetailResponse,
  PrepCreateResponse,
  PrepUpdateResponse,
  PrepUsageResponse,
  BatchYieldParsed,
  PrepValidationErrors
} from '@/types/preps';
import { Database } from '@/integrations/supabase/types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];
type PrepIngredient = Database['public']['Tables']['prep_ingredients']['Row'];

interface UsePrepsOptions {
  autoFetch?: boolean;
  pageSize?: number;
  includeInactive?: boolean;
}

interface UsePrepsReturn {
  // Data
  preps: EnhancedPrep[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  
  // CRUD Operations
  createPrep: (prepData: PrepFormData) => Promise<PrepCreateResponse | null>;
  updatePrep: (id: string, prepData: PrepFormData) => Promise<PrepUpdateResponse | null>;
  deletePrep: (id: string) => Promise<boolean>;
  getPrep: (id: string) => Promise<PrepDetailResponse | null>;
  
  // Data Fetching
  fetchPreps: (filters?: PrepSearchFilters, page?: number) => Promise<void>;
  refreshPreps: () => Promise<void>;
  
  // Analytics
  fetchPrepUsageAnalytics: () => Promise<PrepUsageAnalytics[]>;
  fetchPrepUsageInsights: () => Promise<PrepUsageInsights>;
  
  // Cost Calculations
  calculatePrepCost: (prepId: string) => Promise<PrepCostCalculation | null>;
  calculatePrepCostFromData: (prepData: PrepFormData) => PrepCostCalculation;
  
  // Utilities
  parseBatchYield: (batchYield: string) => BatchYieldParsed;
  validatePrepData: (prepData: PrepFormData) => PrepValidationErrors;
  
  // State Management
  setPage: (page: number) => void;
  setFilters: (filters: PrepSearchFilters) => void;
  clearError: () => void;
}

export const usePreps = (options: UsePrepsOptions = {}): UsePrepsReturn => {
  const {
    autoFetch = true,
    pageSize = 20,
    includeInactive = false
  } = options;

  const { toast } = useToast();
  const [preps, setPreps] = useState<EnhancedPrep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<PrepSearchFilters>({});

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasMore = page < totalPages;

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchPreps();
    }
  }, [autoFetch]);

  // Fetch preps with filters and pagination
  const fetchPreps = useCallback(async (
    newFilters?: PrepSearchFilters,
    newPage?: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = newFilters || filters;
      const currentPage = newPage || page;
      const offset = (currentPage - 1) * pageSize;

      // Build query
      let query = supabase
        .from('preps')
        .select(`
          *,
          prep_ingredients (
            *,
            ingredient:ingredients (*)
          )
        `, { count: 'exact' });

      // Apply filters
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      if (currentFilters.search) {
        query = query.or(`name.ilike.%${currentFilters.search}%,name_de.ilike.%${currentFilters.search}%,name_en.ilike.%${currentFilters.search}%`);
      }

      if (currentFilters.is_active !== undefined) {
        query = query.eq('is_active', currentFilters.is_active);
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Transform data to EnhancedPrep
      const enhancedPreps: EnhancedPrep[] = (data || []).map(prep => ({
        ...prep,
        ingredients: prep.prep_ingredients?.map(pi => ({
          ...pi,
          ingredient: pi.ingredient as Ingredient,
          unit_cost: pi.ingredient?.cost_per_unit || 0,
          total_cost: (pi.ingredient?.cost_per_unit || 0) * pi.quantity,
          percentage_of_prep_cost: 0 // Will be calculated
        })) || []
      }));

      setPreps(enhancedPreps);
      setTotalCount(count || 0);
      setPage(currentPage);
      setFilters(currentFilters);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch preps';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, includeInactive, toast]);

  // Create new prep
  const createPrep = useCallback(async (prepData: PrepFormData): Promise<PrepCreateResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      // Validate data
      const validationErrors = validatePrepData(prepData);
      if (Object.keys(validationErrors).length > 0) {
        throw new Error('Invalid prep data');
      }

      // Calculate cost
      const costCalculation = calculatePrepCostFromData(prepData);

      // Insert prep
      const { data: prep, error: prepError } = await supabase
        .from('preps')
        .insert({
          name: prepData.name,
          name_de: prepData.name_de,
          name_en: prepData.name_en,
          description: prepData.description,
          description_de: prepData.description_de,
          description_en: prepData.description_en,
          batch_yield: prepData.batch_yield,
          batch_yield_amount: costCalculation.batch_yield_parsed.quantity,
          batch_yield_unit: costCalculation.batch_yield_parsed.unit,
          cost_per_batch: costCalculation.cost_per_batch,
          cost_per_unit: costCalculation.cost_per_unit,
          notes: prepData.notes,
          is_active: prepData.is_active,
          instructions: prepData.instructions,
          instructions_de: prepData.instructions_de,
          instructions_en: prepData.instructions_en,
        })
        .select()
        .single();

      if (prepError) {
        throw new Error(prepError.message);
      }

      // Insert prep ingredients
      if (prepData.ingredients.length > 0) {
        const prepIngredients = prepData.ingredients.map(ing => ({
          prep_id: prep.id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
        }));

        const { error: ingredientsError } = await supabase
          .from('prep_ingredients')
          .insert(prepIngredients);

        if (ingredientsError) {
          throw new Error(ingredientsError.message);
        }
      }

      toast({
        title: 'Success',
        description: 'Prep created successfully',
      });

      // Refresh the list
      await fetchPreps();

      return {
        prep: prep as EnhancedPrep,
        cost_calculation: costCalculation
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create prep';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPreps, toast]);

  // Update existing prep
  const updatePrep = useCallback(async (id: string, prepData: PrepFormData): Promise<PrepUpdateResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      // Validate data
      const validationErrors = validatePrepData(prepData);
      if (Object.keys(validationErrors).length > 0) {
        throw new Error('Invalid prep data');
      }

      // Calculate cost
      const costCalculation = calculatePrepCostFromData(prepData);

      // Update prep
      const { data: prep, error: prepError } = await supabase
        .from('preps')
        .update({
          name: prepData.name,
          name_de: prepData.name_de,
          name_en: prepData.name_en,
          description: prepData.description,
          description_de: prepData.description_de,
          description_en: prepData.description_en,
          batch_yield: prepData.batch_yield,
          batch_yield_amount: costCalculation.batch_yield_parsed.quantity,
          batch_yield_unit: costCalculation.batch_yield_parsed.unit,
          cost_per_batch: costCalculation.cost_per_batch,
          cost_per_unit: costCalculation.cost_per_unit,
          notes: prepData.notes,
          is_active: prepData.is_active,
          instructions: prepData.instructions,
          instructions_de: prepData.instructions_de,
          instructions_en: prepData.instructions_en,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (prepError) {
        throw new Error(prepError.message);
      }

      // Update prep ingredients (delete old, insert new)
      await supabase.from('prep_ingredients').delete().eq('prep_id', id);

      if (prepData.ingredients.length > 0) {
        const prepIngredients = prepData.ingredients.map(ing => ({
          prep_id: id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
        }));

        const { error: ingredientsError } = await supabase
          .from('prep_ingredients')
          .insert(prepIngredients);

        if (ingredientsError) {
          throw new Error(ingredientsError.message);
        }
      }

      toast({
        title: 'Success',
        description: 'Prep updated successfully',
      });

      // Refresh the list
      await fetchPreps();

      return {
        prep: prep as EnhancedPrep,
        cost_calculation: costCalculation
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update prep';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPreps, toast]);

  // Delete prep
  const deletePrep = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Delete prep ingredients first
      const { error: ingredientsError } = await supabase
        .from('prep_ingredients')
        .delete()
        .eq('prep_id', id);

      if (ingredientsError) {
        throw new Error(ingredientsError.message);
      }

      // Delete prep
      const { error: prepError } = await supabase
        .from('preps')
        .delete()
        .eq('id', id);

      if (prepError) {
        throw new Error(prepError.message);
      }

      toast({
        title: 'Success',
        description: 'Prep deleted successfully',
      });

      // Refresh the list
      await fetchPreps();

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete prep';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPreps, toast]);

  // Get single prep with details
  const getPrep = useCallback(async (id: string): Promise<PrepDetailResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('preps')
        .select(`
          *,
          prep_ingredients (
            *,
            ingredient:ingredients (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const enhancedPrep: EnhancedPrep = {
        ...data,
        ingredients: data.prep_ingredients?.map(pi => ({
          ...pi,
          ingredient: pi.ingredient as Ingredient,
          unit_cost: pi.ingredient?.cost_per_unit || 0,
          total_cost: (pi.ingredient?.cost_per_unit || 0) * pi.quantity,
          percentage_of_prep_cost: 0
        })) || []
      };

      return {
        prep: enhancedPrep
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prep';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch prep usage analytics
  const fetchPrepUsageAnalytics = useCallback(async (): Promise<PrepUsageAnalytics[]> => {
    try {
      const { data, error } = await supabase
        .from('menu_item_ingredients')
        .select(`
          prep_id,
          quantity,
          unit,
          menu_item:menu_items (
            id,
            name
          ),
          prep:preps (
            id,
            name,
            batch_yield,
            cost_per_batch
          )
        `)
        .not('prep_id', 'is', null);

      if (error) {
        throw new Error(error.message);
      }

      // Group by prep and calculate analytics
      const prepUsageMap = new Map<string, any[]>();
      data?.forEach(item => {
        if (item.prep_id && item.prep) {
          if (!prepUsageMap.has(item.prep_id)) {
            prepUsageMap.set(item.prep_id, []);
          }
          prepUsageMap.get(item.prep_id)!.push(item);
        }
      });

      const analytics: PrepUsageAnalytics[] = Array.from(prepUsageMap.entries()).map(([prepId, usages]) => {
        const prep = usages[0].prep;
        const uniqueMenuItems = new Set(usages.map(u => u.menu_item_id));
        const totalQuantity = usages.reduce((sum, u) => sum + u.quantity, 0);
        const totalCostContribution = usages.reduce((sum, u) => {
          const batchYield = parseBatchYield(prep.batch_yield);
          const costPerUnit = prep.cost_per_batch / batchYield.quantity;
          return sum + (costPerUnit * u.quantity);
        }, 0);

        return {
          prep_id: prepId,
          prep_name: prep.name,
          total_usage_count: usages.length,
          unique_menu_items: uniqueMenuItems.size,
          total_quantity_used: totalQuantity,
          average_quantity_per_usage: totalQuantity / usages.length,
          total_cost_contribution: totalCostContribution,
          average_cost_per_menu_item: totalCostContribution / uniqueMenuItems.size,
          popularity_rank: 0,
          cost_efficiency: totalCostContribution / uniqueMenuItems.size <= 2 ? 'excellent' : 
                          totalCostContribution / uniqueMenuItems.size <= 5 ? 'good' : 
                          totalCostContribution / uniqueMenuItems.size <= 10 ? 'moderate' : 'high',
          usage_trend: usages.length >= 10 ? 'increasing' : usages.length >= 5 ? 'stable' : 'decreasing',
          menu_items_using: Array.from(uniqueMenuItems).map(id => 
            usages.find(u => u.menu_item_id === id)?.menu_item?.name || 'Unknown'
          ),
          batch_utilization_rate: 0
        };
      });

      return analytics;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage analytics';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Fetch prep usage insights
  const fetchPrepUsageInsights = useCallback(async (): Promise<PrepUsageInsights> => {
    const analytics = await fetchPrepUsageAnalytics();
    
    // Sort by popularity
    analytics.sort((a, b) => b.total_usage_count - a.total_usage_count);
    analytics.forEach((item, index) => {
      item.popularity_rank = index + 1;
    });

    const sortedByPopularity = [...analytics];
    const sortedByCostEfficiency = [...analytics].sort((a, b) => {
      const efficiencyOrder = { excellent: 4, good: 3, moderate: 2, high: 1 };
      return efficiencyOrder[b.cost_efficiency] - efficiencyOrder[a.cost_efficiency];
    });
    const sortedByCost = [...analytics].sort((a, b) => b.total_cost_contribution - a.total_cost_contribution);

    const underutilizedPreps = analytics.filter(prep => 
      prep.total_usage_count <= 2 && prep.unique_menu_items <= 1
    );

    const totalPreps = analytics.length;
    const activePreps = analytics.filter(prep => prep.total_usage_count > 0).length;
    const totalUsageCount = analytics.reduce((sum, prep) => sum + prep.total_usage_count, 0);
    const averageUsagePerPrep = totalPreps > 0 ? totalUsageCount / totalPreps : 0;
    const totalCostContribution = analytics.reduce((sum, prep) => sum + prep.total_cost_contribution, 0);

    return {
      most_popular_preps: sortedByPopularity.slice(0, 5),
      most_cost_efficient_preps: sortedByCostEfficiency.slice(0, 5),
      underutilized_preps: underutilizedPreps,
      high_cost_preps: sortedByCost.slice(0, 5),
      prep_recommendations: [],
      overall_stats: {
        total_preps: totalPreps,
        active_preps: activePreps,
        total_usage_count: totalUsageCount,
        average_usage_per_prep: averageUsagePerPrep,
        total_cost_contribution: totalCostContribution,
      }
    };
  }, [fetchPrepUsageAnalytics]);

  // Calculate prep cost
  const calculatePrepCost = useCallback(async (prepId: string): Promise<PrepCostCalculation | null> => {
    try {
      const prepResponse = await getPrep(prepId);
      if (!prepResponse?.prep) {
        return null;
      }

      return calculatePrepCostFromData({
        name: prepResponse.prep.name,
        name_de: prepResponse.prep.name_de || '',
        name_en: prepResponse.prep.name_en || '',
        description: prepResponse.prep.description || '',
        description_de: prepResponse.prep.description_de || '',
        description_en: prepResponse.prep.description_en || '',
        batch_yield: prepResponse.prep.batch_yield || '',
        notes: prepResponse.prep.notes || '',
        is_active: prepResponse.prep.is_active,
        ingredients: prepResponse.prep.ingredients?.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes || ''
        })) || []
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate prep cost';
      setError(errorMessage);
      return null;
    }
  }, [getPrep]);

  // Calculate prep cost from form data
  const calculatePrepCostFromData = useCallback((prepData: PrepFormData): PrepCostCalculation => {
    const batchYieldParsed = parseBatchYield(prepData.batch_yield);
    
    // Calculate ingredient costs
    const ingredientBreakdown = prepData.ingredients.map(ing => {
      // This would need to fetch ingredient cost from database
      // For now, using mock data
      const unitCost = 0.05; // Mock cost per unit
      const totalCost = unitCost * ing.quantity;
      
      return {
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient_id, // Would need to fetch name
        quantity: ing.quantity,
        unit: ing.unit,
        unit_cost: unitCost,
        total_cost: totalCost,
        percentage: 0 // Will be calculated
      };
    });

    const totalCost = ingredientBreakdown.reduce((sum, ing) => sum + ing.totalCost, 0);
    const costPerUnit = batchYieldParsed.quantity > 0 ? totalCost / batchYieldParsed.quantity : 0;
    const costPerBatch = totalCost;

    // Calculate percentages
    ingredientBreakdown.forEach(ing => {
      ing.percentage = totalCost > 0 ? (ing.total_cost / totalCost) * 100 : 0;
    });

    return {
      total_cost: totalCost,
      cost_per_unit: costPerUnit,
      cost_per_batch: costPerBatch,
      batch_yield_parsed: batchYieldParsed,
      ingredient_breakdown: ingredientBreakdown
    };
  }, []);

  // Parse batch yield string
  const parseBatchYield = useCallback((batchYield: string): BatchYieldParsed => {
    const match = batchYield.match(/^(\d+(?:\.\d+)?)\s*(ml|g|kg|l|portions?|servings?)$/i);
    if (match) {
      return {
        quantity: parseFloat(match[1]),
        unit: match[2].toLowerCase(),
        isValid: true
      };
    }
    
    return {
      quantity: 1,
      unit: 'portion',
      isValid: false
    };
  }, []);

  // Validate prep data
  const validatePrepData = useCallback((prepData: PrepFormData): PrepValidationErrors => {
    const errors: PrepValidationErrors = {};

    if (!prepData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!prepData.batch_yield.trim()) {
      errors.batch_yield = 'Batch yield is required';
    } else {
      const parsed = parseBatchYield(prepData.batch_yield);
      if (!parsed.isValid) {
        errors.batch_yield = 'Invalid batch yield format (e.g., "500ml", "1kg")';
      }
    }

    if (prepData.ingredients.length === 0) {
      errors.ingredients = 'At least one ingredient is required';
    }

    return errors;
  }, [parseBatchYield]);

  // Refresh preps
  const refreshPreps = useCallback(() => fetchPreps(), [fetchPreps]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    // Data
    preps,
    loading,
    error,
    
    // Pagination
    page,
    totalPages,
    totalCount,
    hasMore,
    
    // CRUD Operations
    createPrep,
    updatePrep,
    deletePrep,
    getPrep,
    
    // Data Fetching
    fetchPreps,
    refreshPreps,
    
    // Analytics
    fetchPrepUsageAnalytics,
    fetchPrepUsageInsights,
    
    // Cost Calculations
    calculatePrepCost,
    calculatePrepCostFromData,
    
    // Utilities
    parseBatchYield,
    validatePrepData,
    
    // State Management
    setPage,
    setFilters,
    clearError,
  };
}; 