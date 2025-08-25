/**
 * Enhanced speech parsing for ingredient costs and pricing
 * Extracts weights, units, and prices from voice input
 */

import type { ParsedIngredientWithCost, EnhancedVoiceParsingResult } from '../integrations/supabase/enhanced-types';
import { UNIT_CONVERSIONS } from '../integrations/supabase/unitConversions';

// Regex patterns for parsing quantities, units, and prices
const QUANTITY_PATTERNS = [
  // Standard numbers: "200", "2.5", "half", "quarter"
  /(\d+(?:\.\d+)?)\s*(?:grams?|g|kg|kilograms?|pounds?|lbs?|ounces?|oz|ml|milliliters?|liters?|l|cups?|tablespoons?|tbsp|teaspoons?|tsp|pieces?|each|dozen)/gi,
  /(half|quarter|one|two|three|four|five|six|seven|eight|nine|ten|\d+(?:\.\d+)?)\s+(?:grams?|g|kg|kilograms?|pounds?|lbs?|ounces?|oz|ml|milliliters?|liters?|l|cups?|tablespoons?|tbsp|teaspoons?|tsp|pieces?|each|dozen)/gi,
];

const UNIT_PATTERNS = {
  // Weight units
  weight: {
    'grams': /\b(?:grams?|g)\b/gi,
    'kg': /\b(?:kg|kilograms?|kilos?)\b/gi,
    'pounds': /\b(?:pounds?|lbs?|lb)\b/gi,
    'ounces': /\b(?:ounces?|oz)\b/gi,
  },
  // Volume units
  volume: {
    'ml': /\b(?:ml|milliliters?|millilitres?)\b/gi,
    'liters': /\b(?:liters?|litres?|l)\b/gi,
    'cups': /\b(?:cups?)\b/gi,
    'tablespoons': /\b(?:tablespoons?|tbsp)\b/gi,
    'teaspoons': /\b(?:teaspoons?|tsp)\b/gi,
  },
  // Count units
  count: {
    'pieces': /\b(?:pieces?|pcs?)\b/gi,
    'each': /\b(?:each)\b/gi,
    'dozen': /\b(?:dozen)\b/gi,
  }
};

const PRICE_PATTERNS = [
  // German compound prices: "cent und ein euro", "5 cent und 2 euro"
  /(?:(\d+)\s*cent\s*und\s*(?:ein|eine)?\s*euro\s*(\d+)?)|(?:(?:ein|eine)?\s*euro\s*(\d+)?\s*und\s*(\d+)\s*cent)/gi,
  // Simple German prices: "ein euro", "5 euro", "50 cent"
  /(?:ein|eine)?\s*euro\s*(\d+)?|(?:(\d+)\s*euro)|(?:(\d+)\s*cent)/gi,
  // "at 3 euros per kilo", "3 euro per kg", "€3 per kilogram"
  /(?:at\s+)?(?:€|euros?|eur|dollars?|\$)?\s*(\d+(?:\.\d+)?)\s*(?:€|euros?|eur|dollars?|\$)?\s*(?:per|\/)\s*(kilo|kilogram|kg|pound|lb|liter|litre|l|dozen|piece|each)/gi,
  // "3.50 per kilo", "8 euro per kg"
  /(\d+(?:\.\d+)?)\s*(?:euros?|€|eur|dollars?|\$)?\s*(?:per|\/)\s*(kilo|kilogram|kg|pound|lb|liter|litre|l|dozen|piece|each)/gi,
  // "costs 3 euros per kilo"
  /(?:costs?|priced?\s+at)\s+(?:€|euros?|eur|dollars?|\$)?\s*(\d+(?:\.\d+)?)\s*(?:€|euros?|eur|dollars?|\$)?\s*(?:per|\/)\s*(kilo|kilogram|kg|pound|lb|liter|litre|l|dozen|piece|each)/gi,
];

// Word-to-number conversion for spoken numbers (German and English)
const WORD_TO_NUMBER: Record<string, number> = {
  // English
  'half': 0.5, 'quarter': 0.25,
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'hundred': 100, 'thousand': 1000,
  
  // German
  'ein': 1, 'eine': 1, 'einer': 1, 'eines': 1, 'einem': 1,
  'zwei': 2, 'drei': 3, 'vier': 4, 'fünf': 5, 'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10,
  'elf': 11, 'zwölf': 12, 'dreizehn': 13, 'vierzehn': 14, 'fünfzehn': 15,
  'sechzehn': 16, 'siebzehn': 17, 'achtzehn': 18, 'neunzehn': 19, 'zwanzig': 20,
  'dreißig': 30, 'vierzig': 40, 'fünfzig': 50, 'sechzig': 60, 'siebzig': 70, 'achtzig': 80, 'neunzig': 90,
  'hundert': 100, 'tausend': 1000,
  'halb': 0.5, 'halbe': 0.5, 'halber': 0.5, 'halbes': 0.5,
};

// German culinary terms and ingredient names
const GERMAN_INGREDIENTS: Record<string, string> = {
  'basilikum': 'basil',
  'bunt basilikum': 'mixed basil',
  'buntes basilikum': 'mixed basil',
  'tomaten': 'tomatoes',
  'tomate': 'tomato',
  'gurke': 'cucumber',
  'gurken': 'cucumbers',
  'zwiebel': 'onion',
  'zwiebeln': 'onions',
  'rote zwiebel': 'red onion',
  'rote zwiebeln': 'red onions',
  'salat': 'lettuce',
  'tomatensalat': 'tomato salad',
  'olivenöl': 'olive oil',
  'öl': 'oil',
  'salz': 'salt',
  'pfeffer': 'pepper',
  'petersilie': 'parsley',
  'schnittlauch': 'chives',
  'dill': 'dill',
  'oregano': 'oregano',
  'thymian': 'thyme',
  'rosmarin': 'rosemary',
  'knoblauch': 'garlic',
  'karotte': 'carrot',
  'karotten': 'carrots',
  'möhren': 'carrots',
  'paprika': 'bell pepper',
  'zitrone': 'lemon',
  'zitronen': 'lemons',
  'limette': 'lime',
  'limetten': 'limes'
};

/**
 * Parse enhanced voice input with ingredient costs
 */
export function parseEnhancedVoiceInput(text: string): EnhancedVoiceParsingResult {
  console.log('🎯 Parsing enhanced voice input:', text);
  
  const result: EnhancedVoiceParsingResult = {
    dishName: '',
    description: '',
    ingredients: [],
    totalEstimatedCost: 0,
    suggestedPrice: 0,
    category: '',
    cuisineType: '',
    servingSize: 1,
    confidence: 0.8
  };
  
  // Extract dish name (reuse existing logic)
  result.dishName = extractDishName(text);
  
  // Extract ingredients with costs
  result.ingredients = extractIngredientsWithCosts(text);
  
  // Calculate total cost and suggested price
  result.totalEstimatedCost = result.ingredients.reduce((sum, ing) => sum + (ing.quantity * (ing.pricePerKilo || ing.pricePerUnit || 0)), 0);
  result.suggestedPrice = calculateSuggestedPrice(result.totalEstimatedCost);
  
  // Extract serving size if mentioned
  result.servingSize = extractServingSize(text) || 1;
  
  // Extract preparation time if mentioned
  result.preparationTime = extractPreparationTime(text);
  
  console.log('🎯 Parsing result:', result);
  return result;
}

/**
 * Extract ingredients with quantities, units, and pricing information
 */
function extractIngredientsWithCosts(text: string): ParsedIngredientWithCost[] {
  const ingredients: ParsedIngredientWithCost[] = [];
  
  // Split text into segments for each ingredient
  const segments = splitIntoIngredientSegments(text);
  
  for (const segment of segments) {
    const ingredient = parseIngredientSegment(segment);
    if (ingredient) {
      ingredients.push(ingredient);
    }
  }
  
  return ingredients;
}

/**
 * Split text into individual ingredient segments
 */
function splitIntoIngredientSegments(text: string): string[] {
  // Look for patterns that separate ingredients
  const separators = [
    /,\s*(?=\d+)/g, // Comma followed by number
    /\s+and\s+(?=\d+)/g, // "and" followed by number
    /\s+with\s+(?=\d+)/g, // "with" followed by number
    /\s+plus\s+(?=\d+)/g, // "plus" followed by number
  ];
  
  let segments = [text];
  
  for (const separator of separators) {
    const newSegments: string[] = [];
    for (const segment of segments) {
      newSegments.push(...segment.split(separator));
    }
    segments = newSegments;
  }
  
  return segments.filter(s => s.trim().length > 0);
}

/**
 * Parse a single ingredient segment
 */
function parseIngredientSegment(segment: string): ParsedIngredientWithCost | null {
  console.log('🔍 Parsing ingredient segment:', segment);
  
  // Extract quantity and unit
  const quantityUnit = extractQuantityAndUnit(segment);
  if (!quantityUnit) {
    return null;
  }
  
  // Extract ingredient name
  const ingredientName = extractIngredientName(segment, quantityUnit);
  
  // Extract pricing information
  const pricing = extractPricing(segment);
  
  const ingredient: ParsedIngredientWithCost = {
    name: ingredientName,
    quantity: quantityUnit.quantity,
    unit: quantityUnit.unit,
    currency: 'EUR',
    confidence: 0.8,
    originalText: segment.trim(),
    ...pricing
  };
  
  console.log('✅ Parsed ingredient:', ingredient);
  return ingredient;
}

/**
 * Extract quantity and unit from text segment
 */
function extractQuantityAndUnit(text: string): { quantity: number; unit: string } | null {
  // Try each quantity pattern
  for (const pattern of QUANTITY_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const quantityStr = match[1] || match[0];
      let quantity = parseFloat(quantityStr);
      
      // Handle word numbers
      if (isNaN(quantity) && WORD_TO_NUMBER[quantityStr.toLowerCase()]) {
        quantity = WORD_TO_NUMBER[quantityStr.toLowerCase()];
      }
      
      if (!isNaN(quantity)) {
        // Extract unit from the match
        const unit = extractUnitFromMatch(match[0]);
        if (unit) {
          return { quantity, unit };
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract unit from a matched string
 */
function extractUnitFromMatch(matchText: string): string | null {
  // Check all unit patterns
  for (const [category, units] of Object.entries(UNIT_PATTERNS)) {
    for (const [unitName, pattern] of Object.entries(units)) {
      if (pattern.test(matchText)) {
        return unitName;
      }
    }
  }
  return null;
}

/**
 * Extract ingredient name from segment, excluding quantity/unit/price parts
 */
function extractIngredientName(segment: string, quantityUnit: { quantity: number; unit: string }): string {
  let cleanSegment = segment;
  
  // Remove quantity and unit
  cleanSegment = cleanSegment.replace(new RegExp(`\\b${quantityUnit.quantity}\\s*${quantityUnit.unit}s?\\b`, 'gi'), '');
  
  // Remove price information (German and English)
  cleanSegment = cleanSegment.replace(/\\b(?:ein|eine)?\\s*euro\\s*\\d*\\b/gi, '');
  cleanSegment = cleanSegment.replace(/\\b\\d*\\s*cent\\b/gi, '');
  cleanSegment = cleanSegment.replace(/\\b(?:cent\\s*und\\s*(?:ein|eine)?\\s*euro)\\b/gi, '');
  
  for (const pattern of PRICE_PATTERNS) {
    cleanSegment = cleanSegment.replace(pattern, '');
  }
  
  // Remove common connecting words (German and English)
  cleanSegment = cleanSegment.replace(/\\b(?:of|with|at|per|costs?|priced?|und|mit|für|kostet)\\b/gi, '');
  
  // Clean up extra spaces and punctuation
  cleanSegment = cleanSegment.replace(/[,;.]/g, '').replace(/\\s+/g, ' ').trim();
  
  // Remove leading/trailing articles and prepositions (German and English)
  cleanSegment = cleanSegment.replace(/^(?:the|a|an|some|of|ein|eine|der|die|das|den|dem|des)\\s+/gi, '');
  cleanSegment = cleanSegment.replace(/\\s+(?:at|per|for|für|pro)$/gi, '');
  
  // Normalize German ingredient names to English if needed
  const lowerClean = cleanSegment.toLowerCase().trim();
  if (GERMAN_INGREDIENTS[lowerClean]) {
    return GERMAN_INGREDIENTS[lowerClean];
  }
  
  // Handle compound German ingredients like "bunt basilikum"
  if (lowerClean.includes('bunt')) {
    const baseIngredient = lowerClean.replace('bunt', '').trim();
    if (GERMAN_INGREDIENTS[baseIngredient]) {
      return `mixed ${GERMAN_INGREDIENTS[baseIngredient]}`;
    }
    return `mixed ${baseIngredient}`;
  }
  
  return cleanSegment.trim() || 'Unknown ingredient';
}

/**
 * Extract pricing information from text segment
 */
function extractPricing(text: string): { pricePerKilo?: number; pricePerUnit?: number } {
  const pricing: { pricePerKilo?: number; pricePerUnit?: number } = {};
  
  // Handle German compound prices first
  const compoundPriceMatch = text.match(/(?:(\d+)\s*cent\s*und\s*(?:ein|eine)?\s*euro\s*(\d+)?)|(?:(?:ein|eine)?\s*euro\s*(\d+)?\s*und\s*(\d+)\s*cent)/gi);
  if (compoundPriceMatch) {
    for (const match of compoundPriceMatch) {
      const centMatch = match.match(/(\d+)\s*cent/i);
      const euroMatch = match.match(/(?:ein|eine|\d+)\s*euro/i);
      
      let totalPrice = 0;
      if (centMatch) {
        totalPrice += parseFloat(centMatch[1]) / 100; // Convert cents to euros
      }
      if (euroMatch) {
        const euroNum = euroMatch[0].match(/\d+/);
        totalPrice += euroNum ? parseFloat(euroNum[0]) : 1; // "ein euro" = 1
      }
      
      if (totalPrice > 0) {
        pricing.pricePerUnit = totalPrice;
      }
    }
    return pricing;
  }
  
  // Handle simple German prices
  const simpleGermanPrice = text.match(/(?:ein|eine)?\s*euro\s*(\d+)?|(?:(\d+)\s*euro)|(?:(\d+)\s*cent)/gi);
  if (simpleGermanPrice) {
    for (const match of simpleGermanPrice) {
      if (match.includes('cent')) {
        const centNum = match.match(/\d+/);
        if (centNum) {
          pricing.pricePerUnit = parseFloat(centNum[0]) / 100;
        }
      } else if (match.includes('euro')) {
        const euroNum = match.match(/\d+/);
        pricing.pricePerUnit = euroNum ? parseFloat(euroNum[0]) : 1; // "ein euro" = 1
      }
    }
    if (pricing.pricePerUnit) return pricing;
  }
  
  // Handle traditional price patterns
  for (const pattern of PRICE_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const price = parseFloat(match[1]);
      const unit = match[2]?.toLowerCase();
      
      if (!isNaN(price) && unit) {
        if (['kilo', 'kilogram', 'kg'].includes(unit)) {
          pricing.pricePerKilo = price;
        } else if (['pound', 'lb'].includes(unit)) {
          // Convert pound price to kilo price (1 kg = 2.20462 lbs)
          pricing.pricePerKilo = price * 2.20462;
        } else if (['liter', 'litre', 'l'].includes(unit)) {
          pricing.pricePerKilo = price; // Assuming similar density to water
        } else if (['dozen', 'piece', 'each'].includes(unit)) {
          pricing.pricePerUnit = price;
        }
      }
    }
  }
  
  return pricing;
}

/**
 * Extract dish name from the voice input
 */
function extractDishName(text: string): string {
  const patterns = [
    /(?:this is|we have|today we're making|i want to add|create|das ist|wir haben|heute machen wir|ich möchte hinzufügen)\\s+([^.,;]+?)\\s+(?:with|and|that|which|mit|und|das|die)/i,
    /(?:this is|we have|today we're making|i want to add|create|das ist|wir haben|heute machen wir|ich möchte hinzufügen)\\s+([^.,;]+)/i,
    /^([^.,;]+?)\\s+(?:with|and|that|which|mit|und|das|die)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Fallback to first few words
  return text.split(/\\s+/).slice(0, 3).join(' ');
}

/**
 * Extract serving size from text
 */
function extractServingSize(text: string): number | null {
  const patterns = [
    /(?:serves?|servings?|portions?)\\s+(\\d+)/gi,
    /(?:for|makes?)\\s+(\\d+)\\s+(?:people|persons?|servings?|portions?)/gi,
    /(\\d+)\\s+(?:person|people|serving|portion)/gi,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return null;
}

/**
 * Extract preparation time from text
 */
function extractPreparationTime(text: string): number | null {
  const patterns = [
    /(?:takes?|prep(?:aration)?(?:\\s+time)?|cooking(?:\\s+time)?)\\s+(\\d+)\\s*(?:minutes?|mins?|hours?|hrs?)/gi,
    /(\\d+)\\s*(?:minutes?|mins?|hours?|hrs?)\\s+(?:prep|preparation|cooking|to\\s+make|to\\s+cook)/gi,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let time = parseInt(match[1]);
      // Convert hours to minutes if needed
      if (match[0].includes('hour') || match[0].includes('hr')) {
        time *= 60;
      }
      return time;
    }
  }
  
  return null;
}

/**
 * Calculate suggested menu price based on food cost
 */
function calculateSuggestedPrice(foodCost: number, targetFoodCostPercentage: number = 30): number {
  if (foodCost <= 0) return 0;
  
  // Calculate price to achieve target food cost percentage
  const suggestedPrice = foodCost / (targetFoodCostPercentage / 100);
  
  // Round to reasonable menu price (e.g., .50, .90, .95)
  return roundToMenuPrice(suggestedPrice);
}

/**
 * Round price to common menu price endings
 */
function roundToMenuPrice(price: number): number {
  const roundedBase = Math.floor(price);
  const decimal = price - roundedBase;
  
  if (decimal < 0.25) {
    return roundedBase;
  } else if (decimal < 0.75) {
    return roundedBase + 0.5;
  } else if (decimal < 0.85) {
    return roundedBase + 0.9;
  } else {
    return roundedBase + 0.95;
  }
}

/**
 * Convert units to a standard base unit for calculations
 */
export function convertToBaseUnit(quantity: number, fromUnit: string, ingredientType: 'weight' | 'volume' | 'count' = 'weight'): { quantity: number; unit: string } {
  const baseUnits = {
    weight: 'grams',
    volume: 'ml',
    count: 'pieces'
  };
  
  const baseUnit = baseUnits[ingredientType];
  
  if (UNIT_CONVERSIONS[fromUnit] && UNIT_CONVERSIONS[fromUnit][baseUnit]) {
    return {
      quantity: quantity * UNIT_CONVERSIONS[fromUnit][baseUnit],
      unit: baseUnit
    };
  }
  
  // If no conversion found, return as-is
  return { quantity, unit: fromUnit };
}

/**
 * Validate and normalize parsed ingredient data
 */
export function validateAndNormalizeParsedIngredient(ingredient: ParsedIngredientWithCost): ParsedIngredientWithCost {
  const normalized = { ...ingredient };
  
  // Normalize ingredient name
  normalized.name = normalized.name.toLowerCase().trim();
  normalized.name = normalized.name.charAt(0).toUpperCase() + normalized.name.slice(1);
  
  // Ensure positive quantities
  normalized.quantity = Math.max(0, normalized.quantity);
  
  // Normalize units
  normalized.unit = normalizeUnit(normalized.unit);
  
  // Validate prices
  if (normalized.pricePerKilo && normalized.pricePerKilo < 0) {
    delete normalized.pricePerKilo;
  }
  if (normalized.pricePerUnit && normalized.pricePerUnit < 0) {
    delete normalized.pricePerUnit;
  }
  
  // Set confidence based on completeness
  let confidence = 0.5;
  if (normalized.name && normalized.name !== 'Unknown ingredient') confidence += 0.2;
  if (normalized.quantity > 0) confidence += 0.1;
  if (normalized.unit) confidence += 0.1;
  if (normalized.pricePerKilo || normalized.pricePerUnit) confidence += 0.1;
  
  normalized.confidence = Math.min(1.0, confidence);
  
  return normalized;
}

/**
 * Normalize unit names to standard forms
 */
function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'g': 'grams',
    'kg': 'kg',
    'lbs': 'pounds',
    'lb': 'pounds',
    'oz': 'ounces',
    'ml': 'ml',
    'l': 'liters',
    'tbsp': 'tablespoons',
    'tsp': 'teaspoons',
    'pcs': 'pieces',
    'pc': 'pieces',
  };
  
  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || lowerUnit;
}