/**
 * Enhanced cost calculation functions for both ingredients and preps
 * Provides comprehensive cost analysis and breakdowns
 */

export interface Ingredient {
  id: string;
  name: string;
  name_de: string;
  name_en: string;
  unit: string;
  cost_per_unit: number;
  category?: {
    name: string;
  };
}

export interface Prep {
  id: string;
  name: string;
  name_de: string;
  name_en: string;
  batch_yield: string;
  cost_per_batch: number;
  notes: string;
}

export type Component = 
  | { type: 'ingredient'; ingredient: Ingredient; quantity: number; unit: string }
  | { type: 'prep'; prep: Prep; quantity: number; unit: string };

export interface CostBreakdownItem {
  id: string;
  name: string;
  type: 'ingredient' | 'prep';
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  percentage: number;
  category?: string;
  batchYield?: string;
  costPerBatch?: number;
}

export interface EnhancedPricingCalculation {
  totalFoodCost: number;
  ingredientCost: number;
  prepCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  costPerServing: number;
  suggestedPrices: {
    foodCost25: number;
    foodCost30: number;
    foodCost35: number;
  };
  profitMargins: {
    at25Percent: number;
    at30Percent: number;
    at35Percent: number;
  };
  breakdown: CostBreakdownItem[];
  costAnalysis: {
    mostExpensiveComponent: CostBreakdownItem;
    costEfficiency: 'excellent' | 'good' | 'moderate' | 'high';
    prepUtilization: number; // % of total cost from preps
    ingredientUtilization: number; // % of total cost from ingredients
  };
}

export interface CostSettings {
  laborCostPerHour: number;
  overheadPercentage: number;
  targetFoodCostPercentage: number;
  wastagePercentage: number;
  vatPercentage: number;
}

export const DEFAULT_COST_SETTINGS: CostSettings = {
  laborCostPerHour: 15,
  overheadPercentage: 25,
  targetFoodCostPercentage: 30,
  wastagePercentage: 5,
  vatPercentage: 19,
};

/**
 * Calculate comprehensive cost for both ingredients and preps
 */
export function calculateEnhancedRecipeCost(
  components: Component[],
  preparationTimeMinutes: number = 15,
  servings: number = 1,
  settings: CostSettings = DEFAULT_COST_SETTINGS
): EnhancedPricingCalculation {
  console.log('💰 Calculating enhanced recipe cost for', components.length, 'components');
  
  // Calculate breakdown for each component
  const breakdown = components.map(component => calculateComponentCost(component, settings.wastagePercentage));
  
  // Calculate totals
  const totalFoodCost = breakdown.reduce((sum, item) => sum + item.totalCost, 0);
  const ingredientCost = breakdown
    .filter(item => item.type === 'ingredient')
    .reduce((sum, item) => sum + item.totalCost, 0);
  const prepCost = breakdown
    .filter(item => item.type === 'prep')
    .reduce((sum, item) => sum + item.totalCost, 0);
  
  // Calculate labor and overhead
  const laborCost = (preparationTimeMinutes / 60) * settings.laborCostPerHour;
  const overheadCost = totalFoodCost * (settings.overheadPercentage / 100);
  
  // Total cost
  const totalCost = totalFoodCost + laborCost + overheadCost;
  const costPerServing = totalCost / servings;
  
  // Calculate suggested prices
  const suggestedPrices = {
    foodCost25: calculateMenuPrice(costPerServing, 25),
    foodCost30: calculateMenuPrice(costPerServing, 30),
    foodCost35: calculateMenuPrice(costPerServing, 35),
  };
  
  // Calculate profit margins
  const profitMargins = {
    at25Percent: suggestedPrices.foodCost25 - costPerServing,
    at30Percent: suggestedPrices.foodCost30 - costPerServing,
    at35Percent: suggestedPrices.foodCost35 - costPerServing,
  };
  
  // Find most expensive component
  const mostExpensiveComponent = breakdown.reduce((max, item) => 
    item.totalCost > max.totalCost ? item : max
  );
  
  // Calculate cost efficiency
  const costEfficiency = getCostEfficiency(totalFoodCost);
  
  // Calculate utilization percentages
  const prepUtilization = totalFoodCost > 0 ? (prepCost / totalFoodCost) * 100 : 0;
  const ingredientUtilization = totalFoodCost > 0 ? (ingredientCost / totalFoodCost) * 100 : 0;
  
  const result: EnhancedPricingCalculation = {
    totalFoodCost,
    ingredientCost,
    prepCost,
    laborCost,
    overheadCost,
    totalCost,
    costPerServing,
    suggestedPrices,
    profitMargins,
    breakdown,
    costAnalysis: {
      mostExpensiveComponent,
      costEfficiency,
      prepUtilization,
      ingredientUtilization,
    }
  };
  
  console.log('💰 Enhanced cost calculation result:', result);
  return result;
}

/**
 * Calculate cost for a single component (ingredient or prep)
 */
function calculateComponentCost(
  component: Component,
  wastagePercentage: number = 5
): CostBreakdownItem {
  if (component.type === 'ingredient') {
    const { ingredient, quantity, unit } = component;
    const unitCost = ingredient.cost_per_unit;
    const totalCost = unitCost * quantity * (1 + wastagePercentage / 100);
    
    return {
      id: ingredient.id,
      name: ingredient.name,
      type: 'ingredient',
      quantity,
      unit,
      unitCost,
      totalCost,
      percentage: 0, // Will be calculated later
      category: ingredient.category?.name,
    };
  } else {
    const { prep, quantity, unit } = component;
    
    // For preps, we need to calculate cost per unit from batch cost
    const batchYield = parseBatchYield(prep.batch_yield);
    const costPerUnit = prep.cost_per_batch / batchYield.quantity;
    const totalCost = costPerUnit * quantity;
    
    return {
      id: prep.id,
      name: prep.name,
      type: 'prep',
      quantity,
      unit,
      unitCost: costPerUnit,
      totalCost,
      percentage: 0, // Will be calculated later
      batchYield: prep.batch_yield,
      costPerBatch: prep.cost_per_batch,
    };
  }
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
 * Calculate menu price based on food cost percentage
 */
function calculateMenuPrice(costPerServing: number, targetFoodCostPercentage: number): number {
  return Math.round((costPerServing / (targetFoodCostPercentage / 100)) * 100) / 100;
}

/**
 * Determine cost efficiency level
 */
function getCostEfficiency(totalFoodCost: number): 'excellent' | 'good' | 'moderate' | 'high' {
  if (totalFoodCost <= 5) return 'excellent';
  if (totalFoodCost <= 10) return 'good';
  if (totalFoodCost <= 15) return 'moderate';
  return 'high';
}

/**
 * Generate cost optimization suggestions
 */
export interface CostOptimizationSuggestion {
  type: 'substitution' | 'portion' | 'prep' | 'supplier';
  title: string;
  description: string;
  potentialSaving: number;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
}

export function generateCostOptimizationSuggestions(
  calculation: EnhancedPricingCalculation
): CostOptimizationSuggestion[] {
  const suggestions: CostOptimizationSuggestion[] = [];
  
  // High cost warning
  if (calculation.totalFoodCost > 15) {
    suggestions.push({
      type: 'portion',
      title: 'High Total Cost',
      description: `Total food cost of €${calculation.totalFoodCost.toFixed(2)} is above recommended levels. Consider reducing portions or finding cost-effective alternatives.`,
      potentialSaving: calculation.totalFoodCost * 0.2,
      difficulty: 'medium',
      impact: 'high'
    });
  }
  
  // Most expensive component suggestion
  const mostExpensive = calculation.costAnalysis.mostExpensiveComponent;
  if (mostExpensive.percentage > 30) {
    suggestions.push({
      type: 'substitution',
      title: 'High-Cost Component',
      description: `${mostExpensive.name} accounts for ${mostExpensive.percentage.toFixed(1)}% of total cost. Consider alternatives or bulk purchasing.`,
      potentialSaving: mostExpensive.totalCost * 0.15,
      difficulty: 'medium',
      impact: 'medium'
    });
  }
  
  // Prep utilization suggestion
  if (calculation.costAnalysis.prepUtilization > 50) {
    suggestions.push({
      type: 'prep',
      title: 'High Prep Dependency',
      description: `Preps account for ${calculation.costAnalysis.prepUtilization.toFixed(1)}% of total cost. Consider making preps in larger batches for better efficiency.`,
      potentialSaving: calculation.prepCost * 0.1,
      difficulty: 'easy',
      impact: 'medium'
    });
  }
  
  return suggestions;
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