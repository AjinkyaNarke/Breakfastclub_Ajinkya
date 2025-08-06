// Common units with standardized conversions
export const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  // Weight conversions (to grams)
  'grams': { 'grams': 1, 'kg': 0.001, 'pounds': 0.00220462, 'ounces': 0.035274 },
  'kg': { 'grams': 1000, 'kg': 1, 'pounds': 2.20462, 'ounces': 35.274 },
  'pounds': { 'grams': 453.592, 'kg': 0.453592, 'pounds': 1, 'ounces': 16 },
  'ounces': { 'grams': 28.3495, 'kg': 0.0283495, 'pounds': 0.0625, 'ounces': 1 },
  
  // Volume conversions (to ml)
  'ml': { 'ml': 1, 'liters': 0.001, 'cups': 0.00422675, 'tablespoons': 0.067628, 'teaspoons': 0.202884 },
  'liters': { 'ml': 1000, 'liters': 1, 'cups': 4.22675, 'tablespoons': 67.628, 'teaspoons': 202.884 },
  'cups': { 'ml': 236.588, 'liters': 0.236588, 'cups': 1, 'tablespoons': 16, 'teaspoons': 48 },
  'tablespoons': { 'ml': 14.7868, 'liters': 0.0147868, 'cups': 0.0625, 'tablespoons': 1, 'teaspoons': 3 },
  'teaspoons': { 'ml': 4.92892, 'liters': 0.00492892, 'cups': 0.0208333, 'tablespoons': 0.333333, 'teaspoons': 1 },
  
  // Count-based units
  'pieces': { 'pieces': 1, 'dozen': 0.0833333, 'each': 1 },
  'dozen': { 'pieces': 12, 'dozen': 1, 'each': 12 },
  'each': { 'pieces': 1, 'dozen': 0.0833333, 'each': 1 }
}; 