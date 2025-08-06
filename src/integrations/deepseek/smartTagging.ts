interface IngredientAnalysis {
  ingredient: string;
  dietaryProperties: {
    property: string;
    confidence: number; // 0-100
    reasoning: string;
  }[];
  allergens: {
    allergen: string;
    confidence: number;
    reasoning: string;
  }[];
  category: {
    name: string;
    confidence: number;
    reasoning: string;
  };
  overallConfidence: number;
  warnings: string[];
}

export interface SmartTaggingResult {
  suggestedTags: string[];
  suggestedAllergens: string[];
  suggestedCategory: string;
  analysis: IngredientAnalysis;
  shouldAutoApply: boolean; // true if confidence > 90%
}

const DIETARY_PROPERTIES = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 
  'low-sodium', 'organic', 'local', 'fermented', 'raw'
];

const ALLERGENS = [
  'gluten', 'dairy', 'eggs', 'fish', 'shellfish', 'nuts', 'peanuts', 
  'soy', 'sesame', 'sulfites', 'lupin', 'celery', 'mustard'
];

const CATEGORIES = [
  'vegetables', 'fruits', 'grains', 'proteins', 'dairy', 'oils', 
  'spices', 'herbs', 'nuts', 'seeds', 'legumes', 'meat', 'fish', 'seafood'
];

// Local ingredient knowledge base for analysis
const INGREDIENT_KNOWLEDGE = {
  vegetables: {
    items: ['kartoffel', 'potato', 'zwiebel', 'onion', 'knoblauch', 'garlic', 'tomate', 'tomato', 'karotte', 'carrot', 'spinat', 'spinach', 'salat', 'lettuce', 'gurke', 'cucumber', 'paprika', 'pepper', 'zucchini', 'aubergine', 'eggplant', 'brokkoli', 'broccoli', 'blumenkohl', 'cauliflower', 'kohl', 'cabbage', 'rosenkohl', 'brussels sprouts', 'spargel', 'asparagus', 'sellerie', 'celery', 'lauch', 'leek', 'radieschen', 'radish', 'rote beete', 'beetroot', 'kürbis', 'pumpkin', 'avocado'],
    dietaryProperties: ['vegetarian', 'vegan'],
    allergens: []
  },
  fruits: {
    items: ['apfel', 'apple', 'banane', 'banana', 'orange', 'zitrone', 'lemon', 'limette', 'lime', 'beeren', 'berries', 'erdbeeren', 'strawberries', 'himbeeren', 'raspberries', 'blaubeeren', 'blueberries', 'trauben', 'grapes', 'birne', 'pear', 'pfirsich', 'peach', 'pflaume', 'plum', 'kirsche', 'cherry', 'ananas', 'pineapple', 'mango', 'kiwi'],
    dietaryProperties: ['vegetarian', 'vegan'],
    allergens: []
  },
  dairy: {
    items: ['milch', 'milk', 'butter', 'käse', 'cheese', 'joghurt', 'yogurt', 'sahne', 'cream', 'quark', 'frischkäse', 'cream cheese', 'mozzarella', 'parmesan', 'feta', 'gouda', 'camembert', 'ricotta'],
    dietaryProperties: ['vegetarian'],
    allergens: ['dairy']
  },
  meat: {
    items: ['hähnchen', 'chicken', 'rind', 'beef', 'schwein', 'pork', 'lamm', 'lamb', 'truthahn', 'turkey', 'ente', 'duck', 'kalbfleisch', 'veal', 'wurst', 'sausage', 'schinken', 'ham', 'speck', 'bacon'],
    dietaryProperties: [],
    allergens: []
  },
  fish: {
    items: ['lachs', 'salmon', 'thunfisch', 'tuna', 'forelle', 'trout', 'kabeljau', 'cod', 'garnelen', 'shrimp', 'muscheln', 'mussels', 'tintenfisch', 'squid', 'hering', 'herring', 'makrele', 'mackerel', 'sardinen', 'sardines'],
    dietaryProperties: [],
    allergens: ['fish', 'shellfish']
  },
  grains: {
    items: ['reis', 'rice', 'nudeln', 'pasta', 'brot', 'bread', 'mehl', 'flour', 'quinoa', 'haferflocken', 'oats', 'bulgur', 'couscous', 'gerste', 'barley', 'weizen', 'wheat', 'roggen', 'rye', 'mais', 'corn', 'hirse', 'millet'],
    dietaryProperties: ['vegetarian', 'vegan'],
    allergens: ['gluten']
  },
  oils: {
    items: ['olivenöl', 'olive oil', 'rapsöl', 'canola oil', 'sonnenblumenöl', 'sunflower oil', 'kokosöl', 'coconut oil', 'sesamöl', 'sesame oil', 'walnussöl', 'walnut oil', 'leinöl', 'flaxseed oil'],
    dietaryProperties: ['vegetarian', 'vegan'],
    allergens: []
  },
  spices: {
    items: ['salz', 'salt', 'pfeffer', 'pepper', 'paprika', 'oregano', 'basilikum', 'basil', 'thymian', 'thyme', 'rosmarin', 'rosemary', 'kümmel', 'cumin', 'koriander', 'coriander', 'zimt', 'cinnamon', 'muskat', 'nutmeg', 'ingwer', 'ginger', 'knoblauchpulver', 'garlic powder', 'zwiebelpulver', 'onion powder'],
    dietaryProperties: ['vegetarian', 'vegan'],
    allergens: []
  },
  herbs: {
    items: ['petersilie', 'parsley', 'schnittlauch', 'chives', 'dill', 'minze', 'mint', 'salbei', 'sage', 'lorbeer', 'bay leaves', 'estragon', 'tarragon', 'majoran', 'marjoram'],
    dietaryProperties: ['vegetarian', 'vegan'],
    allergens: []
  },
  nuts: {
    items: ['mandeln', 'almonds', 'walnüsse', 'walnuts', 'haselnüsse', 'hazelnuts', 'cashews', 'erdnüsse', 'peanuts', 'pistazien', 'pistachios', 'paranüsse', 'brazil nuts', 'pekannüsse', 'pecans', 'macadamia'],
    dietaryProperties: ['vegetarian', 'vegan'],
    allergens: ['nuts', 'peanuts']
  }
};

// Perform local analysis based on ingredient knowledge
function performLocalAnalysis(ingredientName: string, language: 'en' | 'de'): IngredientAnalysis {
  const name = ingredientName.toLowerCase().trim();
  
  // Find matching category
  let matchedCategory = '';
  let dietaryProperties: { property: string; confidence: number; reasoning: string }[] = [];
  let allergens: { allergen: string; confidence: number; reasoning: string }[] = [];
  let overallConfidence = 30; // Default low confidence
  let warnings: string[] = [];

  // Check each category for matches
  for (const [category, data] of Object.entries(INGREDIENT_KNOWLEDGE)) {
    const isMatch = data.items.some(item => 
      name.includes(item.toLowerCase()) || item.toLowerCase().includes(name)
    );
    
    if (isMatch) {
      matchedCategory = category;
      overallConfidence = 75; // Higher confidence for known ingredients
      
      // Add dietary properties
      dietaryProperties = data.dietaryProperties.map(prop => ({
        property: prop,
        confidence: 80,
        reasoning: `Ingredient category '${category}' typically has '${prop}' property`
      }));
      
      // Add allergens
      allergens = data.allergens.map(allergen => ({
        allergen: allergen,
        confidence: 85,
        reasoning: `Ingredient category '${category}' contains '${allergen}' allergen`
      }));
      
      break;
    }
  }
  
  // If no match found, provide conservative analysis
  if (!matchedCategory) {
    warnings.push('Ingredient not recognized - manual review recommended');
    overallConfidence = 20;
  }
  
  // Special handling for certain words that might indicate allergens
  if (name.includes('gluten') || name.includes('weizen') || name.includes('wheat')) {
    allergens.push({
      allergen: 'gluten',
      confidence: 90,
      reasoning: 'Contains gluten-related terms'
    });
  }
  
  if (name.includes('milch') || name.includes('milk') || name.includes('käse') || name.includes('cheese')) {
    allergens.push({
      allergen: 'dairy',
      confidence: 90,
      reasoning: 'Contains dairy-related terms'
    });
  }
  
  if (name.includes('nuss') || name.includes('nut') || name.includes('mandel') || name.includes('almond')) {
    allergens.push({
      allergen: 'nuts',
      confidence: 90,
      reasoning: 'Contains nut-related terms'
    });
  }

  return {
    ingredient: ingredientName,
    dietaryProperties,
    allergens,
    category: {
      name: matchedCategory,
      confidence: matchedCategory ? 75 : 0,
      reasoning: matchedCategory ? `Matched to ${matchedCategory} category` : 'No category match found'
    },
    overallConfidence,
    warnings
  };
}

export async function analyzeIngredientWithDeepSeek(
  ingredientName: string,
  language: 'en' | 'de' = 'de'
): Promise<SmartTaggingResult> {
  try {
    console.log(`🧠 Analyzing ingredient with DeepSeek AI: ${ingredientName} (${language})`);
    
    // Import Supabase client
    const { supabase } = (await import('@/integrations/supabase/client'));
    
    // Call Supabase Edge Function for DeepSeek analysis
    const { data, error } = await supabase.functions.invoke('deepseek-analyze', {
      body: {
        ingredient: ingredientName,
        language,
        mode: 'single'
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Analysis service error: ${error.message}`);
    }

    if (!data || !data.success) {
      if (data?.fallback && data?.analysis) {
        console.warn('Using fallback analysis due to AI service unavailability');
        const analysis = data.analysis;
        
        // Process fallback analysis
        const suggestedTags = analysis.dietaryProperties
          .filter((prop: any) => prop.confidence >= 30)
          .map((prop: any) => prop.property);

        const suggestedAllergens = analysis.allergens
          .filter((allergen: any) => allergen.confidence >= 40)
          .map((allergen: any) => allergen.allergen);

        const suggestedCategory = analysis.category.confidence >= 25 
          ? analysis.category.name 
          : '';

        return {
          suggestedTags,
          suggestedAllergens,
          suggestedCategory,
          analysis,
          shouldAutoApply: false // Never auto-apply fallback results
        };
      }
      
      throw new Error('Analysis failed and no fallback available');
    }

    const analysis = data.analysis;
    
    console.log(`✅ DeepSeek analysis completed for ${ingredientName}:`, {
      confidence: analysis.overallConfidence,
      properties: analysis.dietaryProperties.length,
      allergens: analysis.allergens.length,
      category: analysis.category.name,
      warnings: analysis.warnings.length
    });
    
    // Extract suggestions with intelligent confidence filtering
    const suggestedTags = analysis.dietaryProperties
      .filter((prop: any) => prop.confidence >= 65) // Higher threshold for AI suggestions
      .map((prop: any) => prop.property);

    const suggestedAllergens = analysis.allergens
      .filter((allergen: any) => allergen.confidence >= 75) // Even higher threshold for allergens (safety critical)
      .map((allergen: any) => allergen.allergen);

    const suggestedCategory = analysis.category.confidence >= 70 
      ? analysis.category.name 
      : '';

    // Intelligent auto-apply logic based on AI confidence and safety
    const shouldAutoApply = (
      analysis.overallConfidence >= 88 && // High AI confidence
      analysis.warnings.length === 0 && // No warnings
      isKnownSafeIngredient(ingredientName) && // Known safe ingredient
      analysis.allergens.every((a: any) => a.confidence >= 90) // High confidence on allergens if any
    );

    return {
      suggestedTags,
      suggestedAllergens,
      suggestedCategory,
      analysis,
      shouldAutoApply
    };

  } catch (error) {
    console.error('❌ DeepSeek ingredient analysis error:', error);
    
    // Try local analysis as final fallback
    console.log('🔄 Falling back to local analysis...');
    const fallbackAnalysis = performLocalAnalysis(ingredientName, language);
    
    return {
      suggestedTags: fallbackAnalysis.dietaryProperties.map(p => p.property),
      suggestedAllergens: fallbackAnalysis.allergens.map(a => a.allergen),
      suggestedCategory: fallbackAnalysis.category.name,
      analysis: fallbackAnalysis,
      shouldAutoApply: false // Never auto-apply fallback results
    };
  }
}

function validateAnalysis(analysis: any, ingredientName: string): IngredientAnalysis {
  // Ensure all required fields exist with defaults
  return {
    ingredient: analysis.ingredient || ingredientName,
    dietaryProperties: Array.isArray(analysis.dietaryProperties) 
      ? analysis.dietaryProperties.filter((prop: any) => 
          DIETARY_PROPERTIES.includes(prop.property) && 
          typeof prop.confidence === 'number' &&
          prop.confidence >= 0 && prop.confidence <= 100
        )
      : [],
    allergens: Array.isArray(analysis.allergens)
      ? analysis.allergens.filter((allergen: any) =>
          ALLERGENS.includes(allergen.allergen) &&
          typeof allergen.confidence === 'number' &&
          allergen.confidence >= 0 && allergen.confidence <= 100
        )
      : [],
    category: {
      name: CATEGORIES.includes(analysis.category?.name) ? analysis.category.name : '',
      confidence: Math.max(0, Math.min(100, analysis.category?.confidence || 0)),
      reasoning: analysis.category?.reasoning || 'No reasoning provided'
    },
    overallConfidence: Math.max(0, Math.min(100, analysis.overallConfidence || 0)),
    warnings: Array.isArray(analysis.warnings) ? analysis.warnings : []
  };
}

// Conservative whitelist of ingredients we're confident about
function isKnownSafeIngredient(ingredientName: string): boolean {
  const name = ingredientName.toLowerCase();
  const knownSafeIngredients = [
    // Basic vegetables
    'kartoffel', 'potato', 'zwiebel', 'onion', 'knoblauch', 'garlic',
    'tomate', 'tomato', 'karotte', 'carrot', 'spinat', 'spinach',
    // Basic fruits
    'apfel', 'apple', 'banane', 'banana', 'zitrone', 'lemon', 'orange',
    // Basic grains
    'reis', 'rice', 'mehl', 'flour', 'haferflocken', 'oats',
    // Basic oils
    'olivenöl', 'olive oil', 'rapsöl', 'canola oil',
    // Basic spices
    'salz', 'salt', 'pfeffer', 'pepper', 'basilikum', 'basil'
  ];
  
  return knownSafeIngredients.some(safe => 
    name.includes(safe) || safe.includes(name)
  );
}

// Intelligent batch analysis for multiple ingredients
export async function analyzeIngredientBatch(
  ingredients: string[],
  language: 'en' | 'de' = 'de',
  onProgress?: (completed: number, total: number) => void
): Promise<SmartTaggingResult[]> {
  console.log(`🚀 Starting intelligent batch analysis of ${ingredients.length} ingredients`);
  
  // For larger batches, use the dedicated batch endpoint for better efficiency
  if (ingredients.length <= 15) {
    try {
      return await analyzeBatchWithEdgeFunction(ingredients, language, onProgress);
    } catch (error) {
      console.warn('⚠️ Batch edge function failed, falling back to individual analysis:', error);
    }
  }
  
  // Fallback to individual analysis for larger batches or if batch function fails
  return await analyzeIndividually(ingredients, language, onProgress);
}

// Use dedicated batch edge function for optimal performance
async function analyzeBatchWithEdgeFunction(
  ingredients: string[],
  language: 'en' | 'de',
  onProgress?: (completed: number, total: number) => void
): Promise<SmartTaggingResult[]> {
  console.log(`🎯 Using intelligent batch edge function for ${ingredients.length} ingredients`);
  
  const { supabase } = (await import('@/integrations/supabase/client'));
  
  // Call the batch analysis edge function
  const { data, error } = await supabase.functions.invoke('deepseek-batch-analyze', {
    body: {
      ingredients,
      language,
      options: {
        conservativeMode: true,
        autoApplyThreshold: 88
      }
    }
  });

  if (error) {
    console.error('❌ Batch edge function error:', error);
    throw new Error(`Batch analysis error: ${error.message}`);
  }

  if (!data || !data.success) {
    if (data?.fallback && data?.results) {
      console.warn('⚠️ Using batch fallback results');
      
      // Process fallback results
      const results = data.results.map((analysis: any) => ({
        suggestedTags: analysis.dietaryProperties.map((p: any) => p.property),
        suggestedAllergens: analysis.allergens.map((a: any) => a.allergen),
        suggestedCategory: analysis.category.name,
        analysis,
        shouldAutoApply: false
      }));
      
      // Report progress
      onProgress?.(ingredients.length, ingredients.length);
      
      return results;
    }
    
    throw new Error('Batch analysis failed without fallback');
  }

  console.log(`✅ Batch analysis insights:`, data.insights?.summary);
  
  // Process successful batch results
  const results: SmartTaggingResult[] = data.results.map((analysis: any) => {
    const suggestedTags = analysis.dietaryProperties
      .filter((prop: any) => prop.confidence >= 65)
      .map((prop: any) => prop.property);

    const suggestedAllergens = analysis.allergens
      .filter((allergen: any) => allergen.confidence >= 75)
      .map((allergen: any) => allergen.allergen);

    const suggestedCategory = analysis.category.confidence >= 70 
      ? analysis.category.name 
      : '';

    // Intelligent auto-apply logic
    const shouldAutoApply = (
      analysis.overallConfidence >= 88 &&
      analysis.warnings.length === 0 &&
      isKnownSafeIngredient(analysis.ingredient) &&
      analysis.allergens.every((a: any) => a.confidence >= 90)
    );

    return {
      suggestedTags,
      suggestedAllergens,
      suggestedCategory,
      analysis,
      shouldAutoApply
    };
  });

  // Report final progress
  onProgress?.(ingredients.length, ingredients.length);
  
  // Log batch insights
  if (data.insights) {
    console.log(`📊 Batch insights:`, {
      successRate: data.insights.summary.successRate,
      topCategories: data.insights.topCategories,
      recommendations: data.insights.recommendations
    });
  }

  return results;
}

// Individual analysis fallback
async function analyzeIndividually(
  ingredients: string[],
  language: 'en' | 'de',
  onProgress?: (completed: number, total: number) => void
): Promise<SmartTaggingResult[]> {
  console.log(`🔄 Falling back to individual analysis for ${ingredients.length} ingredients`);
  
  const results: SmartTaggingResult[] = [];
  const batchSize = 3; // Process in smaller batches to avoid rate limiting
  
  // Process ingredients in batches
  for (let batchStart = 0; batchStart < ingredients.length; batchStart += batchSize) {
    const batch = ingredients.slice(batchStart, Math.min(batchStart + batchSize, ingredients.length));
    console.log(`📦 Processing batch ${Math.floor(batchStart / batchSize) + 1}: ${batch.join(', ')}`);
    
    // Process batch items in parallel for better performance
    const batchPromises = batch.map(async (ingredient, batchIndex) => {
      const globalIndex = batchStart + batchIndex;
      
      try {
        const result = await analyzeIngredientWithDeepSeek(ingredient, language);
        onProgress?.(globalIndex + 1, ingredients.length);
        return { index: globalIndex, result };
      } catch (error) {
        console.error(`❌ Failed to analyze ingredient ${ingredient}:`, error);
        
        // Use intelligent fallback
        const fallbackAnalysis = performLocalAnalysis(ingredient, language);
        const fallbackResult: SmartTaggingResult = {
          suggestedTags: fallbackAnalysis.dietaryProperties.map(p => p.property),
          suggestedAllergens: fallbackAnalysis.allergens.map(a => a.allergen),
          suggestedCategory: fallbackAnalysis.category.name,
          analysis: {
            ...fallbackAnalysis,
            warnings: [...fallbackAnalysis.warnings, 'AI analysis failed - using local fallback']
          },
          shouldAutoApply: false
        };
        
        onProgress?.(globalIndex + 1, ingredients.length);
        return { index: globalIndex, result: fallbackResult };
      }
    });
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Add results in correct order
    batchResults.forEach(({ index, result }) => {
      results[index] = result;
    });
    
    // Rate limiting between batches
    if (batchStart + batchSize < ingredients.length) {
      console.log('⏳ Waiting 1.5s between batches to respect rate limits...');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  // Generate summary
  const successful = results.filter(r => r.analysis.overallConfidence > 50).length;
  const highConfidence = results.filter(r => r.analysis.overallConfidence > 80).length;
  const autoApplied = results.filter(r => r.shouldAutoApply).length;
  
  console.log(`✅ Individual analysis complete:`, {
    total: ingredients.length,
    successful,
    highConfidence,
    autoApplied,
    needsReview: ingredients.length - autoApplied
  });
  
  return results;
}

// Helper function to format analysis for display
export function formatAnalysisForDisplay(analysis: IngredientAnalysis): string {
  const parts = [`${analysis.ingredient} (${analysis.overallConfidence}% confidence)`];
  
  if (analysis.dietaryProperties.length > 0) {
    const props = analysis.dietaryProperties
      .map(p => `${p.property} (${p.confidence}%)`)
      .join(', ');
    parts.push(`Properties: ${props}`);
  }
  
  if (analysis.allergens.length > 0) {
    const allergens = analysis.allergens
      .map(a => `${a.allergen} (${a.confidence}%)`)
      .join(', ');
    parts.push(`Allergens: ${allergens}`);
  }
  
  if (analysis.category.name) {
    parts.push(`Category: ${analysis.category.name} (${analysis.category.confidence}%)`);
  }
  
  if (analysis.warnings.length > 0) {
    parts.push(`Warnings: ${analysis.warnings.join(', ')}`);
  }
  
  return parts.join(' | ');
}