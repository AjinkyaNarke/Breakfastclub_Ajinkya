import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BatchAnalysisRequest {
  ingredients: string[];
  language: 'en' | 'de';
  options?: {
    conservativeMode?: boolean;
    autoApplyThreshold?: number;
  };
}

interface IngredientAnalysis {
  ingredient: string;
  dietaryProperties: {
    property: string;
    confidence: number;
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

const DIETARY_PROPERTIES = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 
  'low-sodium', 'organic', 'local', 'fermented', 'raw', 'paleo', 'keto'
];

const ALLERGENS = [
  'gluten', 'dairy', 'eggs', 'fish', 'shellfish', 'nuts', 'peanuts', 
  'soy', 'sesame', 'sulfites', 'lupin', 'celery', 'mustard', 'mollusks'
];

const CATEGORIES = [
  'vegetables', 'fruits', 'grains', 'proteins', 'dairy', 'oils', 
  'spices', 'herbs', 'nuts', 'seeds', 'legumes', 'meat', 'fish', 
  'seafood', 'condiments', 'sweeteners', 'beverages'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ingredients, language = 'de', options = {} }: BatchAnalysisRequest = await req.json()

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Ingredients array is required and cannot be empty' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (ingredients.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Maximum 20 ingredients per batch request' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured')
    }

    console.log(`🚀 Processing batch of ${ingredients.length} ingredients: ${ingredients.join(', ')}`)

    // Create intelligent batch prompt for better efficiency
    const systemPrompt = `You are an expert AI nutritionist analyzing multiple ingredients simultaneously for a restaurant management system.

TASK: Analyze the provided list of ingredients and return a JSON array with detailed analysis for each ingredient.

REQUIREMENTS:
1. Provide highly accurate confidence scores (0-100) based on your certainty
2. Consider cultural and regional variations in ingredient preparation
3. Identify potential allergen cross-contamination risks
4. Flag unusual combinations or safety concerns
5. Provide detailed reasoning for all assessments
6. Consider modern dietary trends and restrictions

Available dietary properties: ${DIETARY_PROPERTIES.join(', ')}
Available allergens: ${ALLERGENS.join(', ')}
Available categories: ${CATEGORIES.join(', ')}

CONFIDENCE GUIDELINES:
- 95-100%: Absolutely certain (basic ingredients like salt, water)
- 85-94%: Very confident (common ingredients like tomato, chicken)
- 70-84%: Confident with minor uncertainty (regional variations)
- 50-69%: Moderate confidence (processed or ambiguous ingredients)
- 30-49%: Low confidence (unknown or unclear ingredients)
- 0-29%: Very uncertain (conflicting or insufficient information)

Return ONLY a valid JSON array where each object follows this structure:
[
  {
    "ingredient": "ingredient name",
    "dietaryProperties": [
      {
        "property": "vegan",
        "confidence": 95,
        "reasoning": "Plant-based with no animal derivatives"
      }
    ],
    "allergens": [
      {
        "allergen": "nuts",
        "confidence": 88,
        "reasoning": "Contains tree nuts; potential cross-contamination risk"
      }
    ],
    "category": {
      "name": "vegetables",
      "confidence": 92,
      "reasoning": "Botanically fruit but culinarily treated as vegetable"
    },
    "overallConfidence": 89,
    "warnings": ["Seasonal availability may vary", "Check for organic certification"]
  }
]

IMPORTANT: Analyze each ingredient thoroughly but efficiently. Be consistent in your analysis approach across all ingredients.`

    const userPrompt = `Analyze these ${language === 'de' ? 'German' : 'English'} ingredients as a batch:

${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

For each ingredient, provide:
- Complete dietary property analysis with confidence scores
- Comprehensive allergen identification including cross-contamination risks
- Accurate category classification
- Any warnings, seasonal considerations, or special notes
- Regional variations or preparation methods that affect properties

Return a JSON array with analysis for each ingredient in the same order as provided.`

    // Make batch request to DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000, // Higher limit for batch processing
        top_p: 0.95,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API error:', response.status, errorText)
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No analysis content received from DeepSeek')
    }

    // Clean and parse the JSON response
    let cleanedContent = content.trim()
    
    // Remove markdown code blocks if present
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    // Try to extract JSON array if wrapped in other text
    const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      cleanedContent = jsonMatch[0]
    }

    let analysisArray: IngredientAnalysis[]
    try {
      analysisArray = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Content:', cleanedContent)
      throw new Error('Failed to parse DeepSeek batch response as JSON')
    }

    if (!Array.isArray(analysisArray)) {
      throw new Error('DeepSeek response is not an array')
    }

    // Validate and enhance each analysis
    const validatedResults = analysisArray.map((analysis, index) => {
      const ingredientName = ingredients[index] || `Unknown-${index}`
      const validated = validateAndEnhanceAnalysis(analysis, ingredientName)
      return addIntelligentEnhancements(validated, language)
    })

    // Ensure we have results for all ingredients (pad with fallbacks if needed)
    while (validatedResults.length < ingredients.length) {
      const missingIndex = validatedResults.length
      const missingIngredient = ingredients[missingIndex]
      validatedResults.push(createIntelligentFallback(missingIngredient, language))
    }

    // Generate batch insights
    const batchInsights = generateBatchInsights(validatedResults, ingredients)

    console.log(`✅ Batch analysis complete for ${ingredients.length} ingredients`)

    return new Response(
      JSON.stringify({
        success: true,
        results: validatedResults,
        insights: batchInsights,
        metadata: {
          model: 'deepseek-chat',
          language,
          batchSize: ingredients.length,
          timestamp: new Date().toISOString(),
          processingTime: Date.now()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('DeepSeek batch analysis error:', error)
    
    // Return intelligent fallbacks for all ingredients
    const request = await req.json().catch(() => ({ ingredients: [], language: 'de' }))
    const fallbackResults = (request.ingredients || []).map((ingredient: string) => 
      createIntelligentFallback(ingredient, request.language || 'de')
    )

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback: true,
        results: fallbackResults
      }),
      { 
        status: 200, // Return 200 so client can use fallbacks
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function validateAndEnhanceAnalysis(analysis: any, ingredientName: string): IngredientAnalysis {
  const validated: IngredientAnalysis = {
    ingredient: analysis.ingredient || ingredientName,
    dietaryProperties: [],
    allergens: [],
    category: {
      name: '',
      confidence: 0,
      reasoning: 'Analysis failed'
    },
    overallConfidence: 0,
    warnings: []
  }

  // Validate dietary properties
  if (Array.isArray(analysis.dietaryProperties)) {
    validated.dietaryProperties = analysis.dietaryProperties
      .filter((prop: any) => 
        prop && 
        typeof prop.property === 'string' &&
        DIETARY_PROPERTIES.includes(prop.property) &&
        typeof prop.confidence === 'number' &&
        prop.confidence >= 0 && prop.confidence <= 100 &&
        typeof prop.reasoning === 'string'
      )
      .map((prop: any) => ({
        property: prop.property,
        confidence: Math.round(prop.confidence),
        reasoning: prop.reasoning
      }))
  }

  // Validate allergens
  if (Array.isArray(analysis.allergens)) {
    validated.allergens = analysis.allergens
      .filter((allergen: any) =>
        allergen &&
        typeof allergen.allergen === 'string' &&
        ALLERGENS.includes(allergen.allergen) &&
        typeof allergen.confidence === 'number' &&
        allergen.confidence >= 0 && allergen.confidence <= 100 &&
        typeof allergen.reasoning === 'string'
      )
      .map((allergen: any) => ({
        allergen: allergen.allergen,
        confidence: Math.round(allergen.confidence),
        reasoning: allergen.reasoning
      }))
  }

  // Validate category
  if (analysis.category && typeof analysis.category === 'object') {
    if (CATEGORIES.includes(analysis.category.name)) {
      validated.category = {
        name: analysis.category.name,
        confidence: Math.max(0, Math.min(100, Math.round(analysis.category.confidence || 0))),
        reasoning: analysis.category.reasoning || 'Category assigned by AI analysis'
      }
    }
  }

  validated.overallConfidence = Math.max(0, Math.min(100, Math.round(analysis.overallConfidence || 0)))

  if (Array.isArray(analysis.warnings)) {
    validated.warnings = analysis.warnings
      .filter((warning: any) => typeof warning === 'string' && warning.length > 0)
      .slice(0, 5)
  }

  return validated
}

function addIntelligentEnhancements(analysis: IngredientAnalysis, language: 'en' | 'de'): IngredientAnalysis {
  const enhanced = { ...analysis }
  const name = analysis.ingredient.toLowerCase()

  // Add consistency checks
  const hasVegan = enhanced.dietaryProperties.some(p => p.property === 'vegan')
  const hasDairy = enhanced.allergens.some(a => a.allergen === 'dairy')
  
  if (hasVegan && hasDairy) {
    enhanced.warnings.push('Consistency check: Vegan classification conflicts with dairy allergen')
    enhanced.overallConfidence = Math.max(enhanced.overallConfidence - 15, 10)
  }

  // Add seasonal awareness
  const seasonalIngredients = ['erdbeeren', 'strawberries', 'spargel', 'asparagus', 'kürbis', 'pumpkin']
  if (seasonalIngredients.some(seasonal => name.includes(seasonal))) {
    enhanced.warnings.push('Seasonal ingredient - availability varies')
  }

  return enhanced
}

function createIntelligentFallback(ingredient: string, language: 'en' | 'de'): IngredientAnalysis {
  const name = ingredient.toLowerCase()
  
  const fallback: IngredientAnalysis = {
    ingredient,
    dietaryProperties: [],
    allergens: [],
    category: {
      name: '',
      confidence: 0,
      reasoning: 'Fallback analysis - AI service unavailable'
    },
    overallConfidence: 15,
    warnings: ['AI analysis failed - manual review required']
  }

  // Basic pattern matching
  const patterns = {
    vegetables: ['kartoffel', 'potato', 'zwiebel', 'onion', 'tomate', 'tomato'],
    fruits: ['apfel', 'apple', 'banane', 'banana', 'orange'],
    dairy: ['milch', 'milk', 'käse', 'cheese', 'butter'],
    meat: ['fleisch', 'meat', 'hähnchen', 'chicken']
  }

  for (const [category, items] of Object.entries(patterns)) {
    if (items.some(item => name.includes(item))) {
      fallback.category = {
        name: category,
        confidence: 25,
        reasoning: `Pattern matching identified as ${category}`
      }
      break
    }
  }

  return fallback
}

function generateBatchInsights(results: IngredientAnalysis[], ingredients: string[]) {
  const totalIngredients = results.length
  const highConfidence = results.filter(r => r.overallConfidence >= 80).length
  const withWarnings = results.filter(r => r.warnings.length > 0).length
  const categorized = results.filter(r => r.category.name).length
  
  const topCategories = results
    .filter(r => r.category.name)
    .reduce((acc, r) => {
      acc[r.category.name] = (acc[r.category.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const commonAllergens = results
    .flatMap(r => r.allergens.map(a => a.allergen))
    .reduce((acc, allergen) => {
      acc[allergen] = (acc[allergen] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  return {
    summary: {
      totalIngredients,
      highConfidence,
      withWarnings,
      categorized,
      successRate: Math.round((highConfidence / totalIngredients) * 100)
    },
    topCategories: Object.entries(topCategories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count })),
    commonAllergens: Object.entries(commonAllergens)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([allergen, count]) => ({ allergen, count })),
    recommendations: generateRecommendations(results)
  }
}

function generateRecommendations(results: IngredientAnalysis[]): string[] {
  const recommendations: string[] = []
  
  const lowConfidenceCount = results.filter(r => r.overallConfidence < 60).length
  if (lowConfidenceCount > 0) {
    recommendations.push(`${lowConfidenceCount} ingredients need manual review due to low confidence`)
  }
  
  const warningCount = results.filter(r => r.warnings.length > 0).length
  if (warningCount > 0) {
    recommendations.push(`${warningCount} ingredients have warnings that should be reviewed`)
  }
  
  const allergenCount = results.filter(r => r.allergens.length > 0).length
  if (allergenCount > 0) {
    recommendations.push(`${allergenCount} ingredients contain allergens - ensure proper labeling`)
  }
  
  return recommendations
}