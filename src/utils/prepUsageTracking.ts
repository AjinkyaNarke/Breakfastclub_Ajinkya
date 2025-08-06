/**
 * Prep usage tracking utilities
 * Monitors prep usage across menu items and provides analytics
 */

export interface Prep {
  id: string;
  name: string;
  name_de: string;
  name_en: string;
  batch_yield: string;
  cost_per_batch: number;
  notes: string;
}

export interface MenuItem {
  id: string;
  name: string;
  name_de?: string;
  name_en?: string;
  category_id: string;
  regular_price: number;
  student_price: number;
  is_available: boolean;
  is_featured: boolean;
}

export interface PrepUsage {
  prep_id: string;
  menu_item_id: string;
  quantity: number;
  unit: string;
  menu_item_name: string;
  prep_name: string;
  usage_date?: string;
}

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
  batch_utilization_rate: number; // % of batch yield typically used
}

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

/**
 * Calculate prep usage analytics from usage data
 */
export function calculatePrepUsageAnalytics(
  prepUsages: PrepUsage[],
  preps: Prep[],
  menuItems: MenuItem[]
): PrepUsageAnalytics[] {
  const prepMap = new Map(preps.map(prep => [prep.id, prep]));
  const menuItemMap = new Map(menuItems.map(item => [item.id, item]));

  // Group usages by prep
  const prepUsageGroups = new Map<string, PrepUsage[]>();
  prepUsages.forEach(usage => {
    if (!prepUsageGroups.has(usage.prep_id)) {
      prepUsageGroups.set(usage.prep_id, []);
    }
    prepUsageGroups.get(usage.prep_id)!.push(usage);
  });

  const analytics: PrepUsageAnalytics[] = [];

  prepUsageGroups.forEach((usages, prepId) => {
    const prep = prepMap.get(prepId);
    if (!prep) return;

    const uniqueMenuItems = new Set(usages.map(u => u.menu_item_id));
    const totalQuantity = usages.reduce((sum, u) => sum + u.quantity, 0);
    const totalCostContribution = usages.reduce((sum, u) => {
      const batchYield = parseBatchYield(prep.batch_yield);
      const costPerUnit = prep.cost_per_batch / batchYield.quantity;
      return sum + (costPerUnit * u.quantity);
    }, 0);

    const averageQuantity = totalQuantity / usages.length;
    const averageCostPerMenuItem = totalCostContribution / uniqueMenuItems.size;

    // Calculate batch utilization rate
    const batchYield = parseBatchYield(prep.batch_yield);
    const batchUtilizationRate = (totalQuantity / batchYield.quantity) * 100;

    // Determine cost efficiency
    const costEfficiency = getCostEfficiency(averageCostPerMenuItem);

    // Determine usage trend (simplified - could be enhanced with time series data)
    const usageTrend = getUsageTrend(usages.length, uniqueMenuItems.size);

    analytics.push({
      prep_id: prepId,
      prep_name: prep.name,
      total_usage_count: usages.length,
      unique_menu_items: uniqueMenuItems.size,
      total_quantity_used: totalQuantity,
      average_quantity_per_usage: averageQuantity,
      total_cost_contribution: totalCostContribution,
      average_cost_per_menu_item: averageCostPerMenuItem,
      popularity_rank: 0, // Will be set after sorting
      cost_efficiency: costEfficiency,
      usage_trend: usageTrend,
      menu_items_using: Array.from(uniqueMenuItems).map(id => 
        menuItemMap.get(id)?.name || 'Unknown'
      ),
      last_used: usages[usages.length - 1]?.usage_date,
      batch_utilization_rate: batchUtilizationRate,
    });
  });

  // Sort by popularity and assign ranks
  analytics.sort((a, b) => b.total_usage_count - a.total_usage_count);
  analytics.forEach((analytics, index) => {
    analytics.popularity_rank = index + 1;
  });

  return analytics;
}

/**
 * Generate insights from prep usage analytics
 */
export function generatePrepUsageInsights(
  analytics: PrepUsageAnalytics[]
): PrepUsageInsights {
  const sortedByPopularity = [...analytics].sort((a, b) => b.total_usage_count - a.total_usage_count);
  const sortedByCostEfficiency = [...analytics].sort((a, b) => {
    const efficiencyOrder = { excellent: 4, good: 3, moderate: 2, high: 1 };
    return efficiencyOrder[b.cost_efficiency] - efficiencyOrder[a.cost_efficiency];
  });
  const sortedByCost = [...analytics].sort((a, b) => b.total_cost_contribution - a.total_cost_contribution);

  // Find underutilized preps (low usage count)
  const underutilizedPreps = analytics.filter(prep => 
    prep.total_usage_count <= 2 && prep.unique_menu_items <= 1
  );

  // Generate recommendations
  const recommendations = generatePrepRecommendations(analytics);

  // Calculate overall stats
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
    prep_recommendations: recommendations,
    overall_stats: {
      total_preps: totalPreps,
      active_preps: activePreps,
      total_usage_count: totalUsageCount,
      average_usage_per_prep: averageUsagePerPrep,
      total_cost_contribution: totalCostContribution,
    }
  };
}

/**
 * Generate specific recommendations for prep optimization
 */
function generatePrepRecommendations(analytics: PrepUsageAnalytics[]): PrepRecommendation[] {
  const recommendations: PrepRecommendation[] = [];

  // High cost preps with low usage
  analytics.forEach(prep => {
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
  analytics.forEach(prep => {
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
  analytics.forEach(prep => {
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

  return recommendations;
}

/**
 * Parse batch yield string (e.g., "500ml", "1kg", "10 portions")
 */
function parseBatchYield(batchYield: string): { quantity: number; unit: string } {
  const match = batchYield.match(/^(\d+(?:\.\d+)?)\s*(ml|g|kg|l|portions?|servings?)$/i);
  if (match) {
    return {
      quantity: parseFloat(match[1]),
      unit: match[2].toLowerCase()
    };
  }
  
  // Default fallback
  return { quantity: 1, unit: 'portion' };
}

/**
 * Determine cost efficiency level
 */
function getCostEfficiency(averageCostPerMenuItem: number): 'excellent' | 'good' | 'moderate' | 'high' {
  if (averageCostPerMenuItem <= 2) return 'excellent';
  if (averageCostPerMenuItem <= 5) return 'good';
  if (averageCostPerMenuItem <= 10) return 'moderate';
  return 'high';
}

/**
 * Determine usage trend (simplified implementation)
 */
function getUsageTrend(usageCount: number, uniqueMenuItems: number): 'increasing' | 'stable' | 'decreasing' {
  if (usageCount >= 10 && uniqueMenuItems >= 3) return 'increasing';
  if (usageCount >= 5 && uniqueMenuItems >= 2) return 'stable';
  return 'decreasing';
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

/**
 * Get prep usage data for a specific menu item
 */
export function getPrepUsageForMenuItem(
  menuItemId: string,
  prepUsages: PrepUsage[]
): PrepUsage[] {
  return prepUsages.filter(usage => usage.menu_item_id === menuItemId);
}

/**
 * Get menu items using a specific prep
 */
export function getMenuItemsUsingPrep(
  prepId: string,
  prepUsages: PrepUsage[]
): PrepUsage[] {
  return prepUsages.filter(usage => usage.prep_id === prepId);
}

/**
 * Calculate prep cost impact on menu item
 */
export function calculatePrepCostImpact(
  prepId: string,
  menuItemId: string,
  prepUsages: PrepUsage[],
  preps: Prep[]
): number {
  const usage = prepUsages.find(u => u.prep_id === prepId && u.menu_item_id === menuItemId);
  if (!usage) return 0;

  const prep = preps.find(p => p.id === prepId);
  if (!prep) return 0;

  const batchYield = parseBatchYield(prep.batch_yield);
  const costPerUnit = prep.cost_per_batch / batchYield.quantity;
  
  return costPerUnit * usage.quantity;
} 