/**
 * Cost calculation functions and pricing algorithms
 * Handles ingredient costing, recipe calculations, and menu pricing suggestions
 */

import type { PricingCalculation, RecipeIngredient, ParsedIngredientWithCost } from '../integrations/supabase/enhanced-types';
import { UNIT_CONVERSIONS } from '../integrations/supabase/unitConversions';

// Cost calculation settings
export interface CostSettings {
  laborCostPerHour: number; // €/hour
  overheadPercentage: number; // % of food cost
  targetFoodCostPercentage: number; // % for pricing
  wastagePercentage: number; // % for ingredient waste
  vatPercentage: number; // % VAT
}

export const DEFAULT_COST_SETTINGS: CostSettings = {
  laborCostPerHour: 15, // €15/hour average for kitchen labor
  overheadPercentage: 25, // 25% overhead (utilities, rent, etc.)
  targetFoodCostPercentage: 30, // 30% food cost target
  wastagePercentage: 5, // 5% average wastage
  vatPercentage: 19, // 19% German VAT
};

/**
 * Calculate comprehensive recipe costing
 */
export function calculateRecipeCost(
  ingredients: RecipeIngredient[] | ParsedIngredientWithCost[],
  preparationTimeMinutes: number = 15,
  servings: number = 1,
  settings: CostSettings = DEFAULT_COST_SETTINGS
): PricingCalculation {
  console.log('💰 Calculating recipe cost for', ingredients.length, 'ingredients');
  
  // Calculate food cost
  const ingredientBreakdown = ingredients.map(ingredient => 
    calculateIngredientCost(ingredient, settings.wastagePercentage)
  );
  
  const totalFoodCost = ingredientBreakdown.reduce((sum, item) => sum + item.totalCost, 0);
  
  // Calculate labor cost
  const laborCost = (preparationTimeMinutes / 60) * settings.laborCostPerHour;
  
  // Calculate overhead cost
  const overheadCost = totalFoodCost * (settings.overheadPercentage / 100);
  
  // Total cost per batch
  const totalCostPerBatch = totalFoodCost + laborCost + overheadCost;
  const costPerServing = totalCostPerBatch / servings;
  
  // Calculate suggested prices for different food cost targets
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
  
  const result: PricingCalculation = {
    totalFoodCost,
    laborCost,
    overheadCost,
    totalCost: totalCostPerBatch,
    suggestedPrices,
    profitMargins,
    breakdown: ingredientBreakdown
  };
  
  console.log('💰 Cost calculation result:', result);
  return result;
}

/**
 * Calculate cost for a single ingredient
 */
function calculateIngredientCost(
  ingredient: RecipeIngredient | ParsedIngredientWithCost,
  wastagePercentage: number = 5
): {
  ingredient: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  percentage: number;
} {
  const { name, quantity, unit } = ingredient;
  
  // Get cost per unit
  let unitCost = 0;
  
  if ('pricePerKilo' in ingredient && ingredient.pricePerKilo) {
    // Convert quantity to kg and calculate cost
    const { quantity: kgQuantity } = convertToUnit(quantity, unit, 'kg');
    unitCost = ingredient.pricePerKilo * kgQuantity;
  } else if ('pricePerUnit' in ingredient && ingredient.pricePerUnit) {
    unitCost = ingredient.pricePerUnit * quantity;
  } else if ('unit_cost' in ingredient) {
    unitCost = ingredient.unit_cost;
  }
  
  // Apply wastage
  const totalCost = unitCost * (1 + wastagePercentage / 100);
  
  return {
    ingredient: name,
    quantity,
    unit,
    unitCost,
    totalCost,
    percentage: 0 // Will be calculated later as part of total
  };
}

/**
 * Calculate menu price based on cost and target food cost percentage
 */
export function calculateMenuPrice(costPerServing: number, targetFoodCostPercentage: number): number {
  if (costPerServing <= 0) return 0;
  
  const basePrice = costPerServing / (targetFoodCostPercentage / 100);
  return roundToMenuPrice(basePrice);
}

/**
 * Round price to common menu price endings
 */
export function roundToMenuPrice(price: number): number {
  if (price <= 0) return 0;
  
  // For prices under €5, round to nearest 0.10
  if (price < 5) {
    return Math.round(price * 10) / 10;
  }
  
  // For prices €5-15, round to .50, .90, or .95
  if (price < 15) {
    const base = Math.floor(price);
    const decimal = price - base;
    
    if (decimal < 0.25) return base;
    if (decimal < 0.75) return base + 0.5;
    if (decimal < 0.85) return base + 0.9;
    return base + 0.95;
  }
  
  // For higher prices, round to nearest €0.50
  return Math.round(price * 2) / 2;
}

/**
 * Convert between units for cost calculations
 */
export function convertToUnit(
  quantity: number, 
  fromUnit: string, 
  toUnit: string
): { quantity: number; success: boolean } {
  if (fromUnit === toUnit) {
    return { quantity, success: true };
  }
  
  // Check if conversion exists
  if (UNIT_CONVERSIONS[fromUnit] && UNIT_CONVERSIONS[fromUnit][toUnit]) {
    return {
      quantity: quantity * UNIT_CONVERSIONS[fromUnit][toUnit],
      success: true
    };
  }
  
  // Try reverse conversion
  if (UNIT_CONVERSIONS[toUnit] && UNIT_CONVERSIONS[toUnit][fromUnit]) {
    return {
      quantity: quantity / UNIT_CONVERSIONS[toUnit][fromUnit],
      success: true
    };
  }
  
  console.warn(`⚠️ Cannot convert from ${fromUnit} to ${toUnit}`);
  return { quantity, success: false };
}

/**
 * Calculate price recommendations based on competitive analysis
 */
export interface PriceRecommendation {
  conservative: number; // Higher food cost % (35%)
  balanced: number; // Standard food cost % (30%)
  competitive: number; // Lower food cost % (25%)
  premium: number; // Very low food cost % (20%)
  analysis: {
    minimumViablePrice: number;
    breakEvenPrice: number;
    recommendedRange: { min: number; max: number };
    competitivePosition: 'budget' | 'mid-market' | 'premium' | 'luxury';
  };
}

export function generatePriceRecommendations(
  totalCost: number,
  categoryAveragePrice?: number,
  competitorPrices?: number[]
): PriceRecommendation {
  const conservative = calculateMenuPrice(totalCost, 35);
  const balanced = calculateMenuPrice(totalCost, 30);
  const competitive = calculateMenuPrice(totalCost, 25);
  const premium = calculateMenuPrice(totalCost, 20);
  
  const minimumViablePrice = calculateMenuPrice(totalCost, 40); // Break-even
  const breakEvenPrice = totalCost;
  
  // Determine competitive position
  let competitivePosition: 'budget' | 'mid-market' | 'premium' | 'luxury' = 'mid-market';
  
  if (categoryAveragePrice) {
    if (balanced < categoryAveragePrice * 0.8) {
      competitivePosition = 'budget';
    } else if (balanced > categoryAveragePrice * 1.3) {
      competitivePosition = 'luxury';
    } else if (balanced > categoryAveragePrice * 1.1) {
      competitivePosition = 'premium';
    }
  }
  
  // Calculate recommended range
  const recommendedRange = {
    min: Math.max(minimumViablePrice, conservative),
    max: Math.min(premium, (categoryAveragePrice || premium) * 1.2)
  };
  
  return {
    conservative,
    balanced,
    competitive,
    premium,
    analysis: {
      minimumViablePrice,
      breakEvenPrice,
      recommendedRange,
      competitivePosition
    }
  };
}

/**
 * Calculate ingredient cost efficiency metrics
 */
export interface CostEfficiencyMetrics {
  costPerGram: number;
  costPerServing: number;
  valueScore: number; // 0-100 based on nutrition/cost ratio
  seasonalityFactor: number; // 0.5-2.0 based on seasonal availability
  substitutionSuggestions: Array<{
    ingredient: string;
    potentialSaving: number;
    impactOnTaste: 'low' | 'medium' | 'high';
  }>;
}

export function analyzeCostEfficiency(
  ingredient: ParsedIngredientWithCost,
  seasonalityData?: { factor: number },
  alternatives?: Array<{ name: string; costPerKilo: number; tasteImpact: 'low' | 'medium' | 'high' }>
): CostEfficiencyMetrics {
  const costPerKilo = ingredient.pricePerKilo || 0;
  
  // Convert to cost per gram
  const costPerGram = costPerKilo / 1000;
  
  // Estimate cost per serving (assuming typical serving size)
  const typicalServingSize = estimateServingSize(ingredient.name, ingredient.unit);
  const costPerServing = costPerGram * typicalServingSize;
  
  // Calculate value score (simplified - could be enhanced with nutritional data)
  const valueScore = calculateValueScore(ingredient.name, costPerKilo);
  
  // Seasonality factor
  const seasonalityFactor = seasonalityData?.factor || 1.0;
  
  // Generate substitution suggestions
  const substitutionSuggestions = alternatives?.map(alt => ({
    ingredient: alt.name,
    potentialSaving: costPerKilo - alt.costPerKilo,
    impactOnTaste: alt.tasteImpact
  })).filter(s => s.potentialSaving > 0) || [];
  
  return {
    costPerGram,
    costPerServing,
    valueScore,
    seasonalityFactor,
    substitutionSuggestions
  };
}

/**
 * Estimate typical serving size for an ingredient
 */
function estimateServingSize(ingredientName: string, unit: string): number {
  // Typical serving sizes in grams
  const servingSizes: Record<string, number> = {
    // Proteins
    'chicken': 150,
    'beef': 120,
    'pork': 120,
    'fish': 140,
    'eggs': 50, // per egg
    
    // Carbohydrates
    'rice': 60,
    'pasta': 80,
    'bread': 30,
    'potatoes': 200,
    
    // Vegetables
    'onions': 50,
    'tomatoes': 100,
    'carrots': 80,
    'mushrooms': 60,
    
    // Default
    'default': 100
  };
  
  const lowerName = ingredientName.toLowerCase();
  
  for (const [key, size] of Object.entries(servingSizes)) {
    if (lowerName.includes(key)) {
      return size;
    }
  }
  
  return servingSizes.default;
}

/**
 * Calculate value score based on ingredient type and cost
 */
function calculateValueScore(ingredientName: string, costPerKilo: number): number {
  // Simplified value scoring - could be enhanced with actual nutritional data
  const lowerName = ingredientName.toLowerCase();
  
  let baseScore = 50; // Neutral score
  
  // Adjust based on ingredient type
  if (lowerName.includes('chicken') || lowerName.includes('fish')) {
    baseScore += 20; // High protein value
  } else if (lowerName.includes('vegetable') || lowerName.includes('spinach') || lowerName.includes('broccoli')) {
    baseScore += 15; // High nutrient density
  } else if (lowerName.includes('oil') || lowerName.includes('butter')) {
    baseScore -= 10; // High calorie, lower nutrient density
  }
  
  // Adjust based on cost (lower cost = higher value)
  if (costPerKilo < 5) {
    baseScore += 15;
  } else if (costPerKilo > 20) {
    baseScore -= 15;
  }
  
  return Math.max(0, Math.min(100, baseScore));
}

/**
 * Generate cost optimization suggestions
 */
export interface CostOptimizationSuggestion {
  type: 'substitution' | 'portion' | 'seasonality' | 'supplier';
  title: string;
  description: string;
  potentialSaving: number;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
}

export function generateCostOptimizationSuggestions(
  ingredients: ParsedIngredientWithCost[],
  totalCost: number
): CostOptimizationSuggestion[] {
  const suggestions: CostOptimizationSuggestion[] = [];
  
  // Find most expensive ingredients
  const sortedByPrice = ingredients
    .filter(ing => ing.pricePerKilo || ing.pricePerUnit)
    .sort((a, b) => {
      const costA = (a.pricePerKilo || a.pricePerUnit || 0) * a.quantity;
      const costB = (b.pricePerKilo || b.pricePerUnit || 0) * b.quantity;
      return costB - costA;
    });
  
  // Generate substitution suggestions for expensive ingredients
  sortedByPrice.slice(0, 3).forEach(ingredient => {
    const cost = (ingredient.pricePerKilo || ingredient.pricePerUnit || 0) * ingredient.quantity;
    const costPercentage = (cost / totalCost) * 100;
    
    if (costPercentage > 20) {
      suggestions.push({
        type: 'substitution',
        title: `Consider ${ingredient.name} alternatives`,
        description: `${ingredient.name} accounts for ${costPercentage.toFixed(1)}% of total cost. Consider seasonal or local alternatives.`,
        potentialSaving: cost * 0.2, // Estimate 20% saving
        difficulty: 'medium',
        impact: 'medium'
      });
    }
  });
  
  // Portion size suggestions
  if (totalCost > 8) {
    suggestions.push({
      type: 'portion',
      title: 'Review portion sizes',
      description: 'Consider slightly reducing portion sizes of expensive ingredients to optimize costs.',
      potentialSaving: totalCost * 0.1,
      difficulty: 'easy',
      impact: 'low'
    });
  }
  
  // Seasonality suggestions
  suggestions.push({
    type: 'seasonality',
    title: 'Use seasonal ingredients',
    description: 'Replace out-of-season ingredients with seasonal alternatives for better pricing.',
    potentialSaving: totalCost * 0.15,
    difficulty: 'medium',
    impact: 'medium'
  });
  
  return suggestions;
}