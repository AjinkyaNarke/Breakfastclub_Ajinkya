interface ParsedIngredientWithPrice {
  name_de: string;
  name_en?: string;
  price?: number;
  unit?: string;
  priceUnit?: string; // "per kg", "per piece", "per liter"
  tags: string[];
  confidence: 'high' | 'medium' | 'low';
  rawInput: string;
}

interface PriceMatch {
  price: number;
  currency: string;
  unit?: string;
  position: number;
  raw: string;
}

interface UnitMatch {
  unit: string;
  position: number;
  raw: string;
}

// Enhanced ingredient categories with more variations
const INGREDIENT_CATEGORIES = {
  'vegetables': [
    'Avocado', 'Kartoffel', 'Zwiebel', 'Knoblauch', 'Tomaten', 'Paprika', 'Karotten', 
    'Spinat', 'Salat', 'Gurken', 'Brokkoli', 'Blumenkohl', 'Zucchini', 'Aubergine',
    'Kürbis', 'Rote Beete', 'Sellerie', 'Lauch', 'Radieschen', 'Kohl', 'Rosenkohl'
  ],
  'oils': ['Olivenöl', 'Rapsöl', 'Sonnenblumenöl', 'Kokosöl', 'Sesamöl', 'Walnussöl'],
  'dairy': ['Milch', 'Butter', 'Käse', 'Joghurt', 'Sahne', 'Quark', 'Frischkäse', 'Mozzarella'],
  'meat': ['Hähnchen', 'Rind', 'Schwein', 'Lamm', 'Truthahn', 'Ente', 'Kalbfleisch'],
  'fish': ['Lachs', 'Thunfisch', 'Forelle', 'Kabeljau', 'Garnelen', 'Muscheln', 'Tintenfisch'],
  'grains': ['Reis', 'Nudeln', 'Brot', 'Mehl', 'Quinoa', 'Haferflocken', 'Bulgur', 'Couscous'],
  'spices': ['Salz', 'Pfeffer', 'Paprika', 'Oregano', 'Basilikum', 'Thymian', 'Rosmarin'],
  'fruits': ['Äpfel', 'Bananen', 'Zitronen', 'Orangen', 'Beeren', 'Trauben', 'Erdbeeren'],
  'herbs': ['Petersilie', 'Schnittlauch', 'Dill', 'Koriander', 'Minze', 'Salbei']
};

const DIETARY_PROPERTIES = {
  'vegetables': ['vegetarian', 'vegan'],
  'oils': ['vegetarian', 'vegan'],
  'fruits': ['vegetarian', 'vegan'],
  'grains': ['vegetarian', 'vegan'],
  'spices': ['vegetarian', 'vegan'],
  'herbs': ['vegetarian', 'vegan'],
  'dairy': ['vegetarian'],
  'meat': [],
  'fish': []
};

// Price parsing patterns
const PRICE_PATTERNS = [
  // German patterns
  /(\d+[,.]?\d*)\s*(Euro?|€)/gi,
  /€\s*(\d+[,.]?\d*)/gi,
  /(\d+[,.]?\d*)\s*EUR/gi,
  // Numbers that look like prices (context-dependent)
  /\b(\d+[,.]?\d{1,2})\b(?=\s*(?:pro|per|je|für))/gi,
  /(?:für|pro|je)\s*(\d+[,.]?\d*)/gi
];

// Unit patterns
const UNIT_PATTERNS = [
  // Weight units
  /\b(pro|per|je)\s*(kg|kilo|kilogramm|g|gramm)\b/gi,
  /\b(\d+[,.]?\d*)\s*(kg|kilo|kilogramm|g|gramm)\b/gi,
  // Volume units  
  /\b(pro|per|je)\s*(l|liter|ml|milliliter)\b/gi,
  /\b(\d+[,.]?\d*)\s*(l|liter|ml|milliliter)\b/gi,
  // Piece units
  /\b(pro|per|je)\s*(stück|piece|stk)\b/gi,
  /\b(\d+[,.]?\d*)\s*(stück|piece|stk)\b/gi
];

// Normalize German price format
function normalizePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(',', '.'));
}

// Extract prices from text
function extractPrices(text: string): PriceMatch[] {
  const prices: PriceMatch[] = [];
  
  for (const pattern of PRICE_PATTERNS) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const priceValue = normalizePrice(match[1]);
      if (priceValue > 0 && priceValue < 1000) { // Reasonable price range
        prices.push({
          price: priceValue,
          currency: 'EUR',
          position: match.index || 0,
          raw: match[0]
        });
      }
    }
  }
  
  return prices;
}

// Extract units from text
function extractUnits(text: string): UnitMatch[] {
  const units: UnitMatch[] = [];
  
  for (const pattern of UNIT_PATTERNS) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const unit = match[2] || match[1];
      if (unit) {
        units.push({
          unit: normalizeUnit(unit),
          position: match.index || 0,
          raw: match[0]
        });
      }
    }
  }
  
  return units;
}

// Normalize unit names
function normalizeUnit(unit: string): string {
  const unitMap: { [key: string]: string } = {
    'kg': 'kg',
    'kilo': 'kg', 
    'kilogramm': 'kg',
    'g': 'g',
    'gramm': 'g',
    'l': 'l',
    'liter': 'l',
    'ml': 'ml',
    'milliliter': 'ml',
    'stück': 'piece',
    'piece': 'piece',
    'stk': 'piece'
  };
  
  return unitMap[unit.toLowerCase()] || unit;
}

// Assign automatic tags based on ingredient name
function assignAutomaticTags(ingredientName: string): string[] {
  const name = ingredientName.toLowerCase();
  
  for (const [category, items] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (items.some(item => name.includes(item.toLowerCase()) || item.toLowerCase().includes(name))) {
      return DIETARY_PROPERTIES[category as keyof typeof DIETARY_PROPERTIES] || [];
    }
  }
  
  return [];
}

// Determine confidence level
function determineConfidence(ingredient: string, price?: number, unit?: string): 'high' | 'medium' | 'low' {
  let score = 0.5; // Base score
  
  // Higher confidence for known ingredients
  const isKnownIngredient = Object.values(INGREDIENT_CATEGORIES)
    .flat()
    .some(item => ingredient.toLowerCase().includes(item.toLowerCase()));
  
  if (isKnownIngredient) score += 0.3;
  
  // Higher confidence if price is reasonable
  if (price && price > 0.1 && price < 100) score += 0.2;
  
  // Higher confidence if unit is specified
  if (unit) score += 0.1;
  
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

// Smart ingredient splitting function that handles multiple separators and patterns
function smartSplitIngredients(text: string): string[] {
  // First try standard separators
  let segments = text.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
  
  // If we only have one segment, try more sophisticated splitting
  if (segments.length === 1) {
    const segment = segments[0];
    
    // Look for patterns that indicate ingredient boundaries:
    // 1. Price followed by ingredient name (e.g., "25 cent lemon")
    // 2. Ingredient followed by price followed by ingredient (e.g., "avocados 2 euro tomatoes")
    // 3. Multiple dots/periods that might indicate separation
    
    // Split on multiple dots/periods
    if (segment.includes('..') || segment.match(/\.\s+\./)) {
      segments = segment.split(/\.{2,}|\.\s+\./).map(s => s.trim()).filter(s => s.length > 0);
    }
    
    // If still one segment, try to split on price patterns
    if (segments.length === 1) {
      const priceMatches: { match: string; index: number; endIndex: number }[] = [];
      
      // Find all price patterns in the text
      for (const pattern of PRICE_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match: RegExpExecArray | null;
        while ((match = regex.exec(segment)) !== null) {
          priceMatches.push({
            match: match[0],
            index: match.index,
            endIndex: match.index + match[0].length
          });
        }
      }
      
      // Sort by position
      priceMatches.sort((a, b) => a.index - b.index);
      
      // If we found multiple prices or a price not at the end, try to split
      if (priceMatches.length > 0) {
        const newSegments = [];
        let currentStart = 0;
        
        for (const priceMatch of priceMatches) {
          // Look for word boundaries around the price to split intelligently
          const beforePrice = segment.substring(currentStart, priceMatch.index).trim();
          const afterPriceStart = priceMatch.endIndex;
          
          // Find the next word boundary after the price
          const remainingText = segment.substring(afterPriceStart);
          const nextWordMatch = remainingText.match(/^\s*([a-zA-ZäöüÄÖÜß]+)/);
          
          if (beforePrice && nextWordMatch) {
            // We have text before the price and a word after - this suggests a boundary
            newSegments.push(beforePrice + ' ' + priceMatch.match);
            currentStart = afterPriceStart;
          }
        }
        
        // Add any remaining text
        const remainingText = segment.substring(currentStart).trim();
        if (remainingText) {
          newSegments.push(remainingText);
        }
        
        if (newSegments.length > 1) {
          segments = newSegments;
        }
      }
    }
    
    // Last resort: split on potential ingredient words if we still have one long segment
    if (segments.length === 1 && segment.length > 50) {
      // Look for common ingredient indicators followed by potential prices
      const ingredientPattern = /\b(avocado|lemon|tomato|onion|potato|carrot|apple|banana|orange|bread|milk|cheese|meat|fish|chicken|beef|pork|rice|pasta|oil|vinegar|salt|pepper|sugar|flour|egg|butter|lettuce|spinach|cucumber|bell\s?pepper|zucchini|eggplant|garlic|ginger|basil|parsley|cilantro|rosemary|thyme|oregano|paprika|cumin|coriander|turmeric|cinnamon|vanilla|chocolate|coffee|tea|wine|beer|juice|water|honey|jam|nuts|almonds|walnuts|cashews|peanuts|pistachios|hazelnuts|beans|lentils|chickpeas|quinoa|oats|barley|wheat|corn|mushrooms|broccoli|cauliflower|cabbage|kale|brussels\s?sprouts|artichoke|asparagus|beets|radishes|turnips|leeks|shallots|scallions|chives|dill|sage|mint|lemongrass|star\s?anise|cardamom|cloves|nutmeg|allspice|bay\s?leaves|fennel|celery|chard|arugula|watercress|endive|radicchio|frisee|romaine|iceberg|Boston\s?lettuce|Bibb\s?lettuce)s?\b/gi;
      
      const words = segment.split(/\s+/);
      const newSegments = [];
      let currentSegment = '';
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        currentSegment += (currentSegment ? ' ' : '') + word;
        
        // Check if this word looks like an ingredient and the next few words contain a price
        if (ingredientPattern.test(word) && i < words.length - 1) {
          const nextFewWords = words.slice(i + 1, i + 4).join(' ');
          const hasPrice = PRICE_PATTERNS.some(pattern => pattern.test(nextFewWords));
          const nextWordIsIngredient = i + 1 < words.length && ingredientPattern.test(words[i + 1]);
          
          if (hasPrice && nextWordIsIngredient) {
            // Found ingredient followed by price and another ingredient
            const priceEnd = i + 1;
            while (priceEnd < words.length && !ingredientPattern.test(words[priceEnd])) {
              currentSegment += ' ' + words[priceEnd];
              i = priceEnd;
            }
            newSegments.push(currentSegment.trim());
            currentSegment = '';
          }
        }
      }
      
      if (currentSegment.trim()) {
        newSegments.push(currentSegment.trim());
      }
      
      if (newSegments.length > 1) {
        segments = newSegments;
      }
    }
  }
  
  return segments.filter(s => s.length > 0);
}

// Main parsing function
export function parseEnhancedIngredientList(text: string): ParsedIngredientWithPrice[] {
  const results: ParsedIngredientWithPrice[] = [];
  
  // Enhanced splitting logic to handle multiple ingredient boundaries
  const segments = smartSplitIngredients(text);
  
  for (const segment of segments) {
    const prices = extractPrices(segment);
    const units = extractUnits(segment);
    
    // Extract ingredient name by removing price and unit information
    let ingredientName = segment;
    
    // Remove price patterns
    for (const pricePattern of PRICE_PATTERNS) {
      ingredientName = ingredientName.replace(pricePattern, '');
    }
    
    // Remove unit patterns
    for (const unitPattern of UNIT_PATTERNS) {
      ingredientName = ingredientName.replace(unitPattern, '');
    }
    
    // Clean up ingredient name
    ingredientName = ingredientName
      .replace(/\b(pro|per|je|für|organic|bio)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (ingredientName.length > 0) {
      const price = prices[0]?.price;
      const unit = units[0]?.unit;
      const priceUnit = units[0] ? `per ${units[0].unit}` : undefined;
      
      results.push({
        name_de: ingredientName,
        price,
        unit: unit || 'piece', // Default unit
        priceUnit,
        tags: assignAutomaticTags(ingredientName),
        confidence: determineConfidence(ingredientName, price, unit),
        rawInput: segment
      });
    }
  }
  
  return results;
}

// Voice input examples for testing
export const VOICE_INPUT_EXAMPLES = [
  "Avocado 2 Euro, Kartoffel 1.50, Zwiebel 0.80 pro Kilo",
  "Bio Tomaten 4.50 pro kg, normale Zwiebeln 1.20, Premium Olivenöl 12 Euro pro Liter",
  "Hähnchenbrust 8 Euro pro kg, Lachs 15.50 pro kg, Garnelen 22 Euro",
  "Mehl 0.89 pro kg, Eier 2.50 für 12 Stück, Milch 1.20 pro Liter",
];

// Helper function to format parsed results for display
export function formatParsedIngredient(ingredient: ParsedIngredientWithPrice): string {
  const parts = [ingredient.name_de];
  
  if (ingredient.price) {
    parts.push(`€${ingredient.price.toFixed(2)}`);
  }
  
  if (ingredient.priceUnit) {
    parts.push(ingredient.priceUnit);
  }
  
  if (ingredient.tags.length > 0) {
    parts.push(`(${ingredient.tags.join(', ')})`);
  }
  
  return parts.join(' ');
}

// Validation function
export function validateParsedIngredient(ingredient: ParsedIngredientWithPrice): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!ingredient.name_de || ingredient.name_de.length < 2) {
    errors.push('Ingredient name too short');
  }
  
  if (ingredient.price && (ingredient.price <= 0 || ingredient.price > 1000)) {
    errors.push('Price out of reasonable range');
  }
  
  if (!ingredient.unit) {
    errors.push('Unit not specified');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}