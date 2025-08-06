import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  PrepUsageAnalytics,
  PrepUsageInsights,
  PrepRecommendation,
  PrepUsage
} from '@/types/preps';

interface UsePrepAnalyticsOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UsePrepAnalyticsReturn {
  // Data
  analytics: PrepUsageAnalytics[];
  insights: PrepUsageInsights | null;
  usageData: PrepUsage[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAnalytics: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  
  // Utilities
  getPrepAnalytics: (prepId: string) => PrepUsageAnalytics | undefined;
  getPopularPreps: (limit?: number) => PrepUsageAnalytics[];
  getCostEfficientPreps: (limit?: number) => PrepUsageAnalytics[];
  getUnderutilizedPreps: () => PrepUsageAnalytics[];
  getHighCostPreps: (limit?: number) => PrepUsageAnalytics[];
}

export const usePrepAnalytics = (options: UsePrepAnalyticsOptions = {}): UsePrepAnalyticsReturn => {
  const {
    autoFetch = true,
    refreshInterval
  } = options;

  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<PrepUsageAnalytics[]>([]);
  const [insights, setInsights] = useState<PrepUsageInsights | null>(null);
  const [usageData, setUsageData] = useState<PrepUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAnalytics();
    }
  }, [autoFetch]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchAnalytics();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Parse batch yield string
  const parseBatchYield = useCallback((batchYield: string): { quantity: number; unit: string } => {
    const match = batchYield.match(/^(\d+(?:\.\d+)?)\s*(ml|g|kg|l|portions?|servings?)$/i);
    if (match) {
      return {
        quantity: parseFloat(match[1]),
        unit: match[2].toLowerCase()
      };
    }
    
    return { quantity: 1, unit: 'portion' };
  }, []);

  // Fetch analytics by analyzing which menu items use ingredients that are used in preps
  const fetchAnalyticsFromIngredientUsage = useCallback(async () => {
    // First, get all preps and their ingredients
    const { data: prepsData, error: prepsError } = await supabase
      .from('preps')
      .select(`
        id,
        name,
        name_de,
        name_en,
        batch_yield,
        cost_per_batch,
        prep_ingredients (
          ingredient_id,
          quantity,
          unit
        )
      `);

    if (prepsError) {
      throw new Error(prepsError.message);
    }

    // Then get all menu items that use ingredients found in preps
    const prepIngredientIds = prepsData?.flatMap(prep => 
      prep.prep_ingredients.map(pi => pi.ingredient_id)
    ) || [];

    if (prepIngredientIds.length === 0) {
      setUsageData([]);
      setAnalytics([]);
      return;
    }

    const { data: menuItemIngredients, error: menuError } = await supabase
      .from('menu_item_ingredients')
      .select(`
        ingredient_id,
        quantity,
        unit,
        created_at,
        menu_item:menu_items (
          id,
          name
        )
      `)
      .in('ingredient_id', prepIngredientIds);

    if (menuError) {
      throw new Error(menuError.message);
    }

    // Calculate usage data by matching ingredients between menu items and preps
    const usage: PrepUsage[] = [];
    
    prepsData?.forEach(prep => {
      const prepIngredients = prep.prep_ingredients;
      
      // Find menu items that use any ingredients from this prep
      const menuItemsUsingPrep = new Set();
      
      prepIngredients.forEach(prepIngredient => {
        const menuItemsWithThisIngredient = menuItemIngredients?.filter(
          mi => mi.ingredient_id === prepIngredient.ingredient_id
        ) || [];
        
        menuItemsWithThisIngredient.forEach(mi => {
          if (mi.menu_item) {
            menuItemsUsingPrep.add(mi.menu_item.id);
            
            // Estimate prep usage based on ingredient usage
            const estimatedPrepQuantity = Math.min(1, mi.quantity / prepIngredient.quantity);
            let costContribution = 0;
            
            if (prep.cost_per_batch && prep.batch_yield) {
              const batchYield = parseBatchYield(prep.batch_yield);
              const costPerUnit = batchYield.quantity > 0 ? prep.cost_per_batch / batchYield.quantity : 0;
              costContribution = costPerUnit * estimatedPrepQuantity;
            }
            
            usage.push({
              prep_id: prep.id,
              menu_item_id: mi.menu_item.id,
              quantity: estimatedPrepQuantity,
              unit: 'portion',
              usage_date: mi.created_at || new Date().toISOString(),
              menu_item_name: mi.menu_item.name || '',
              prep_name: prep.name || '',
              cost_contribution: costContribution
            });
          }
        });
      });
    });

    setUsageData(usage);

    // Calculate analytics from estimated usage data  
    const analyticsData = calculateAnalytics(usage, usage.map(u => ({
      prep_id: u.prep_id,
      menu_item_id: u.menu_item_id,
      quantity: u.quantity,
      unit: u.unit,
      usage_date: u.usage_date,
      menu_item: { id: u.menu_item_id, name: u.menu_item_name },
      prep: prepsData?.find(p => p.id === u.prep_id)
    })));
    setAnalytics(analyticsData);
  }, [parseBatchYield]);

  // Fetch prep usage analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use ingredient usage analysis since there's no direct prep usage tracking
      await fetchAnalyticsFromIngredientUsage();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchAnalyticsFromIngredientUsage, toast]);

  // Calculate analytics from usage data
  const calculateAnalytics = useCallback((_usage: PrepUsage[], rawData: any[]): PrepUsageAnalytics[] => {
    const prepUsageMap = new Map<string, any[]>();
    
    rawData.forEach(item => {
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
      
      // Calculate cost contribution
      const batchYield = parseBatchYield(prep.batch_yield);
      const costPerUnit = batchYield.quantity > 0 ? prep.cost_per_batch / batchYield.quantity : 0;
      const totalCostContribution = usages.reduce((sum, u) => sum + (costPerUnit * u.quantity), 0);

      // Calculate batch utilization
      const batchUtilizationRate = batchYield.quantity > 0 ? (totalQuantity / batchYield.quantity) * 100 : 0;

      // Determine cost efficiency
      const avgCostPerMenuItem = uniqueMenuItems.size > 0 ? totalCostContribution / uniqueMenuItems.size : 0;
      const costEfficiency = avgCostPerMenuItem <= 2 ? 'excellent' : 
                           avgCostPerMenuItem <= 5 ? 'good' : 
                           avgCostPerMenuItem <= 10 ? 'moderate' : 'high';

      // Determine usage trend
      const usageTrend = usages.length >= 10 ? 'increasing' : 
                        usages.length >= 5 ? 'stable' : 'decreasing';

      return {
        prep_id: prepId,
        prep_name: prep.name,
        total_usage_count: usages.length,
        unique_menu_items: uniqueMenuItems.size,
        total_quantity_used: totalQuantity,
        average_quantity_per_usage: usages.length > 0 ? totalQuantity / usages.length : 0,
        total_cost_contribution: totalCostContribution,
        average_cost_per_menu_item: avgCostPerMenuItem,
        popularity_rank: 0, // Will be set after sorting
        cost_efficiency: costEfficiency,
        usage_trend: usageTrend,
        menu_items_using: Array.from(uniqueMenuItems).map(id => 
          usages.find(u => u.menu_item_id === id)?.menu_item?.name || 'Unknown'
        ),
        last_used: usages[usages.length - 1]?.usage_date,
        batch_utilization_rate: batchUtilizationRate
      };
    });

    // Sort by popularity and assign ranks
    analytics.sort((a, b) => b.total_usage_count - a.total_usage_count);
    analytics.forEach((item, index) => {
      item.popularity_rank = index + 1;
    });

    return analytics;
  }, []);

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let currentAnalytics = analytics;
      if (analytics.length === 0) {
        await fetchAnalytics();
        currentAnalytics = analytics;
      }

      const sortedByPopularity = [...currentAnalytics];
      const sortedByCostEfficiency = [...currentAnalytics].sort((a, b) => {
        const efficiencyOrder = { excellent: 4, good: 3, moderate: 2, high: 1 };
        return efficiencyOrder[b.cost_efficiency] - efficiencyOrder[a.cost_efficiency];
      });
      const sortedByCost = [...currentAnalytics].sort((a, b) => b.total_cost_contribution - a.total_cost_contribution);

      const underutilizedPreps = currentAnalytics.filter(prep => 
        prep.total_usage_count <= 2 && prep.unique_menu_items <= 1
      );

      // Generate recommendations
      const recommendations: PrepRecommendation[] = [];

      // High cost preps with low usage
      currentAnalytics.forEach(prep => {
        if (prep.total_cost_contribution > 50 && prep.total_usage_count <= 3) {
          recommendations.push({
            type: 'optimization',
            prep_id: prep.prep_id,
            prep_name: prep.prep_name,
            title: 'High Cost, Low Usage Prep',
            description: `${prep.prep_name} has high cost contribution (€${prep.total_cost_contribution.toFixed(2)}) but low usage (${prep.total_usage_count} times). Consider optimizing or finding alternatives.`,
            impact: 'high',
            potential_savings: prep.total_cost_contribution * 0.3,
            action_items: [
              'Review prep recipe for cost optimization',
              'Consider alternative ingredients',
              'Evaluate if prep is necessary',
              'Look for bulk purchasing opportunities'
            ]
          });
        }
      });

      // Underutilized preps
      currentAnalytics.forEach(prep => {
        if (prep.total_usage_count <= 1 && prep.batch_utilization_rate < 50) {
          recommendations.push({
            type: 'batch_adjustment',
            prep_id: prep.prep_id,
            prep_name: prep.prep_name,
            title: 'Low Batch Utilization',
            description: `${prep.prep_name} has low batch utilization (${prep.batch_utilization_rate.toFixed(1)}%). Consider adjusting batch size or finding more uses.`,
            impact: 'medium',
            action_items: [
              'Reduce batch size to minimize waste',
              'Find additional menu items to use this prep',
              'Consider freezing unused portions',
              'Review prep shelf life and storage'
            ]
          });
        }
      });

      // Popular preps with good efficiency
      currentAnalytics.forEach(prep => {
        if (prep.total_usage_count >= 5 && prep.cost_efficiency === 'excellent') {
          recommendations.push({
            type: 'promotion',
            prep_id: prep.prep_id,
            prep_name: prep.prep_name,
            title: 'High-Performing Prep',
            description: `${prep.prep_name} is popular (${prep.total_usage_count} uses) and cost-efficient. Consider expanding its use.`,
            impact: 'low',
            action_items: [
              'Consider using in more menu items',
              'Promote to other kitchen staff',
              'Document prep process for consistency',
              'Consider batch production for efficiency'
            ]
          });
        }
      });

      const totalPreps = currentAnalytics.length;
      const activePreps = currentAnalytics.filter(prep => prep.total_usage_count > 0).length;
      const totalUsageCount = currentAnalytics.reduce((sum, prep) => sum + prep.total_usage_count, 0);
      const averageUsagePerPrep = totalPreps > 0 ? totalUsageCount / totalPreps : 0;
      const totalCostContribution = currentAnalytics.reduce((sum, prep) => sum + prep.total_cost_contribution, 0);

      const insightsData: PrepUsageInsights = {
        most_popular_preps: sortedByPopularity.slice(0, 5),
        most_cost_efficient_preps: sortedByCostEfficiency.slice(0, 5),
        underutilized_preps: underutilizedPreps,
        high_cost_preps: sortedByCost.slice(0, 5),
        prep_recommendations: recommendations,
        overall_stats: {
          total_preps: totalPreps,
          active_preps: activePreps,
          total_usage_count: totalUsageCount,
          average_usage_per_prep: averageUsagePerPrep,
          total_cost_contribution: totalCostContribution,
        }
      };

      setInsights(insightsData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch insights';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [analytics, fetchAnalytics, toast]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchAnalytics(),
      fetchInsights()
    ]);
  }, [fetchAnalytics, fetchInsights]);

  // Utility functions
  const getPrepAnalytics = useCallback((prepId: string) => {
    return analytics.find(prep => prep.prep_id === prepId);
  }, [analytics]);

  const getPopularPreps = useCallback((limit = 5) => {
    return analytics
      .sort((a, b) => b.total_usage_count - a.total_usage_count)
      .slice(0, limit);
  }, [analytics]);

  const getCostEfficientPreps = useCallback((limit = 5) => {
    return analytics
      .filter(prep => prep.cost_efficiency === 'excellent' || prep.cost_efficiency === 'good')
      .sort((a, b) => {
        const efficiencyOrder = { excellent: 4, good: 3, moderate: 2, high: 1 };
        return efficiencyOrder[b.cost_efficiency] - efficiencyOrder[a.cost_efficiency];
      })
      .slice(0, limit);
  }, [analytics]);

  const getUnderutilizedPreps = useCallback(() => {
    return analytics.filter(prep => 
      prep.total_usage_count <= 2 && prep.unique_menu_items <= 1
    );
  }, [analytics]);

  const getHighCostPreps = useCallback((limit = 5) => {
    return analytics
      .sort((a, b) => b.total_cost_contribution - a.total_cost_contribution)
      .slice(0, limit);
  }, [analytics]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return {
    // Data
    analytics,
    insights,
    usageData,
    
    // State
    loading,
    error,
    
    // Actions
    fetchAnalytics,
    fetchInsights,
    refreshData,
    clearError,
    
    // Utilities
    getPrepAnalytics,
    getPopularPreps,
    getCostEfficientPreps,
    getUnderutilizedPreps,
    getHighCostPreps,
  };
}; 