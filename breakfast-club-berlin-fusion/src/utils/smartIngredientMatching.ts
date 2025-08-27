/**
 * Smart ingredient matching utilities for voice recognition
 * Implements fuzzy matching, phonetic matching, and context-aware suggestions
 */

export interface IngredientMatch {
  ingredient: string;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'phonetic' | 'substring' | 'context';
  originalInput: string;
}

export interface IngredientContext {
  dishType?: string;
  cuisineType?: string;
  previousIngredients?: string[];
  commonCombinations?: Record<string, string[]>;
}

// Common ingredient database for matching
const COMMON_INGREDIENTS = [
  // Vegetables
  'avocado', 'tomato', 'onion', 'garlic', 'ginger', 'carrot', 'celery', 'pepper', 'bell pepper',
  'mushroom', 'spinach', 'lettuce', 'cucumber', 'broccoli', 'cauliflower', 'zucchini', 'eggplant',
  'potato', 'sweet potato', 'corn', 'peas', 'beans', 'cabbage', 'kale', 'arugula', 'basil', 'parsley',
  
  // Proteins
  'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'eggs', 'tofu', 'tempeh',
  'bacon', 'ham', 'sausage', 'turkey', 'duck', 'cod', 'halibut', 'scallops', 'mussels', 'crab',
  
  // Dairy & Cheese
  'milk', 'cream', 'butter', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'goat cheese',
  'ricotta', 'cream cheese', 'yogurt', 'sour cream',
  
  // Grains & Starches
  'rice', 'pasta', 'bread', 'flour', 'quinoa', 'barley', 'oats', 'couscous', 'bulgur', 'noodles',
  'tortilla', 'pita', 'bagel', 'croissant',
  
  // Fruits
  'lemon', 'lime', 'orange', 'apple', 'banana', 'strawberry', 'blueberry', 'raspberry', 'blackberry',
  'grape', 'pineapple', 'mango', 'papaya', 'kiwi', 'peach', 'pear', 'plum', 'cherry', 'watermelon',
  
  // Pantry Items
  'salt', 'pepper', 'sugar', 'honey', 'vinegar', 'oil', 'olive oil', 'soy sauce', 'sesame oil',
  'vanilla', 'cinnamon', 'cumin', 'paprika', 'oregano', 'thyme', 'rosemary', 'bay leaves',
  
  // Nuts & Seeds
  'almonds', 'walnuts', 'cashews', 'peanuts', 'pine nuts', 'sesame seeds', 'sunflower seeds',
  'pumpkin seeds', 'chia seeds', 'flax seeds',
];

// Common ingredient combinations for context matching
const INGREDIENT_COMBINATIONS: Record<string, string[]> = {
  'pasta': ['tomato', 'basil', 'garlic', 'cheese', 'olive oil'],
  'salad': ['lettuce', 'tomato', 'cucumber', 'onion', 'avocado'],
  'stir fry': ['soy sauce', 'garlic', 'ginger', 'sesame oil', 'rice'],
  'pizza': ['cheese', 'tomato', 'basil', 'flour', 'olive oil'],
  'soup': ['onion', 'garlic', 'celery', 'carrot', 'broth'],
  'curry': ['curry powder', 'coconut milk', 'onion', 'garlic', 'ginger'],
  'sandwich': ['bread', 'lettuce', 'tomato', 'cheese', 'mayo'],
  'breakfast': ['eggs', 'bacon', 'toast', 'butter', 'coffee'],
  'rice dish': ['rice', 'soy sauce', 'garlic', 'ginger', 'sesame oil'],
};

/**
 * Calculate Levenshtein distance between two strings
 */
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  
  const distance = calculateLevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return (maxLength - distance) / maxLength;
}

/**
 * Create a phonetic representation of a string (simplified Soundex)
 */
function createPhoneticKey(str: string): string {
  const cleaned = str.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return '';
  
  let result = cleaned[0];
  
  const replacements: Record<string, string> = {
    'ph': 'f',
    'ck': 'k',
    'ch': 'k',
    'th': 't',
    'gh': 'g',
  };
  
  let phonetic = cleaned;
  for (const [pattern, replacement] of Object.entries(replacements)) {
    phonetic = phonetic.replace(new RegExp(pattern, 'g'), replacement);
  }
  
  // Remove consecutive duplicates
  phonetic = phonetic.replace(/(.)\1+/g, '$1');
  
  // Remove vowels except first letter
  phonetic = phonetic[0] + phonetic.slice(1).replace(/[aeiou]/g, '');
  
  return phonetic;
}

/**
 * Check if two strings are phonetically similar
 */
function arePhoneticallySimilar(str1: string, str2: string): number {
  const phone1 = createPhoneticKey(str1);
  const phone2 = createPhoneticKey(str2);
  
  if (phone1 === phone2) return 0.9;
  return calculateSimilarity(phone1, phone2) * 0.8;
}

/**
 * Find the best matching ingredient from the database
 */
export function findBestIngredientMatch(
  input: string,
  availableIngredients: string[] = COMMON_INGREDIENTS,
  context?: IngredientContext
): IngredientMatch | null {
  if (!input || input.trim().length === 0) return null;
  
  const cleanInput = input.toLowerCase().trim();
  const matches: IngredientMatch[] = [];
  
  // 1. Exact match
  for (const ingredient of availableIngredients) {
    if (ingredient.toLowerCase() === cleanInput) {
      matches.push({
        ingredient,
        confidence: 1.0,
        matchType: 'exact',
        originalInput: input,
      });
    }
  }
  
  // 2. Fuzzy matching (if no exact match)
  if (matches.length === 0) {
    for (const ingredient of availableIngredients) {
      const similarity = calculateSimilarity(cleanInput, ingredient.toLowerCase());
      
      if (similarity >= 0.7) {
        matches.push({
          ingredient,
          confidence: similarity,
          matchType: 'fuzzy',
          originalInput: input,
        });
      }
    }
  }
  
  // 3. Phonetic matching (for pronunciation variations)
  if (matches.length === 0 || matches[0].confidence < 0.9) {
    for (const ingredient of availableIngredients) {
      const phoneticScore = arePhoneticallySimilar(cleanInput, ingredient.toLowerCase());
      
      if (phoneticScore >= 0.6) {
        matches.push({
          ingredient,
          confidence: phoneticScore,
          matchType: 'phonetic',
          originalInput: input,
        });
      }
    }
  }
  
  // 4. Substring matching (for partial words)
  if (matches.length === 0 || matches[0].confidence < 0.8) {
    for (const ingredient of availableIngredients) {
      const ingredientLower = ingredient.toLowerCase();
      
      if (ingredientLower.includes(cleanInput) || cleanInput.includes(ingredientLower)) {
        const subScore = Math.min(cleanInput.length, ingredientLower.length) / 
                        Math.max(cleanInput.length, ingredientLower.length);
        
        if (subScore >= 0.5) {
          matches.push({
            ingredient,
            confidence: subScore * 0.7,
            matchType: 'substring',
            originalInput: input,
          });
        }
      }
    }
  }
  
  // 5. Context-aware matching
  if (context && context.dishType) {
    const contextIngredients = INGREDIENT_COMBINATIONS[context.dishType.toLowerCase()] || [];
    
    for (const contextIngredient of contextIngredients) {
      const similarity = calculateSimilarity(cleanInput, contextIngredient.toLowerCase());
      
      if (similarity >= 0.6) {
        matches.push({
          ingredient: contextIngredient,
          confidence: similarity * 0.9, // Boost for context relevance
          matchType: 'context',
          originalInput: input,
        });
      }
    }
  }
  
  // Sort by confidence and return the best match
  matches.sort((a, b) => b.confidence - a.confidence);
  
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Extract and match ingredients from a text string
 */
export function extractIngredientsFromText(
  text: string,
  availableIngredients: string[] = COMMON_INGREDIENTS,
  context?: IngredientContext
): IngredientMatch[] {
  if (!text || text.trim().length === 0) return [];
  
  const words = text.toLowerCase().split(/\s+/);
  const matches: IngredientMatch[] = [];
  const processedWords = new Set<string>();
  
  // Try single words first
  for (const word of words) {
    if (processedWords.has(word) || word.length < 3) continue;
    
    const match = findBestIngredientMatch(word, availableIngredients, context);
    if (match && match.confidence >= 0.7) {
      matches.push(match);
      processedWords.add(word);
    }
  }
  
  // Try two-word combinations
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (processedWords.has(words[i]) || processedWords.has(words[i + 1])) continue;
    
    const match = findBestIngredientMatch(phrase, availableIngredients, context);
    if (match && match.confidence >= 0.8) {
      matches.push(match);
      processedWords.add(words[i]);
      processedWords.add(words[i + 1]);
    }
  }
  
  // Remove duplicates and sort by confidence
  const uniqueMatches = matches.filter((match, index) => 
    matches.findIndex(m => m.ingredient.toLowerCase() === match.ingredient.toLowerCase()) === index
  );
  
  uniqueMatches.sort((a, b) => b.confidence - a.confidence);
  
  return uniqueMatches;
}

/**
 * Suggest possible ingredient corrections for low-confidence matches
 */
export function suggestIngredientCorrections(
  input: string,
  availableIngredients: string[] = COMMON_INGREDIENTS,
  limit: number = 5
): IngredientMatch[] {
  const matches: IngredientMatch[] = [];
  const cleanInput = input.toLowerCase().trim();
  
  for (const ingredient of availableIngredients) {
    const similarity = calculateSimilarity(cleanInput, ingredient.toLowerCase());
    const phoneticScore = arePhoneticallySimilar(cleanInput, ingredient.toLowerCase());
    const maxScore = Math.max(similarity, phoneticScore);
    
    if (maxScore >= 0.3) {
      matches.push({
        ingredient,
        confidence: maxScore,
        matchType: similarity > phoneticScore ? 'fuzzy' : 'phonetic',
        originalInput: input,
      });
    }
  }
  
  return matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}