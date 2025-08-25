import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

interface AnalysisRequest {
  ingredient?: string;
  prompt?: string;
  language?: 'en' | 'de';
  mode?: 'single' | 'batch' | 'recipe';
  temperature?: number;
  max_tokens?: number;
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
    const { ingredient, prompt, language = 'de', mode = 'single', temperature = 0.1, max_tokens = 2000 }: AnalysisRequest = await req.json()

    // Handle recipe analysis mode (for prep dialog)
    if (mode === 'recipe' && prompt) {
      const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
      if (!DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API key not configured')
      }

      // Make direct request to DeepSeek for recipe analysis
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
              role: 'user',
              content: prompt
            }
          ],
          temperature,
          max_tokens,
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
        throw new Error('No content received from DeepSeek')
      }

      return new Response(
        JSON.stringify({
          success: true,
          content,
          metadata: {
            model: 'deepseek-chat',
            language,
            mode,
            timestamp: new Date().toISOString()
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle ingredient analysis mode (original functionality)
    if (!ingredient || typeof ingredient !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Ingredient name or prompt is required' }),
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

    // Create intelligent prompt for DeepSeek
    const systemPrompt = `You are an advanced AI nutritionist and food safety expert with deep knowledge of:
- International culinary ingredients and their properties
- Food allergen identification and cross-contamination risks
- Dietary restrictions and nutritional classifications
- Regional food variations and cultural cooking practices
- Food science and ingredient interactions

Your task is to analyze ingredients with exceptional accuracy and provide detailed insights for restaurant management systems.

ANALYSIS REQUIREMENTS:
1. Provide highly accurate confidence scores based on your knowledge certainty
2. Consider cultural and regional variations in ingredient preparation
3. Identify potential allergen cross-contamination risks
4. Flag unusual or potentially unsafe ingredient combinations
5. Provide detailed reasoning for all assessments
6. Consider modern dietary trends and restrictions

Available dietary properties: ${DIETARY_PROPERTIES.join(', ')}
Available allergens: ${ALLERGENS.join(', ')}
Available categories: ${CATEGORIES.join(', ')}

CONFIDENCE SCORING GUIDELINES:
- 95-100%: Absolutely certain (e.g., "water is vegan")
- 85-94%: Very confident (e.g., "tomato is a vegetable")
- 70-84%: Confident with minor uncertainty (e.g., "processed ingredient properties")
- 50-69%: Moderate confidence (e.g., "regional ingredient variations")
- 30-49%: Low confidence (e.g., "ambiguous or uncommon ingredients")
- 0-29%: Very uncertain (e.g., "unknown or conflicting information")

Return ONLY a valid JSON object with this structure:
{
  "ingredient": "ingredient name",
  "dietaryProperties": [
    {
      "property": "vegan",
      "confidence": 95,
      "reasoning": "Plant-based ingredient with no animal derivatives commonly used in production"
    }
  ],
  "allergens": [
    {
      "allergen": "nuts",
      "confidence": 90,
      "reasoning": "Contains tree nuts which are major allergens; cross-contamination risk in processing facilities"
    }
  ],
  "category": {
    "name": "vegetables",
    "confidence": 92,
    "reasoning": "Botanically a fruit but culinarily treated as vegetable in most cuisines"
  },
  "overallConfidence": 88,
  "warnings": ["Consider seasonal availability variations", "May contain sulfites as preservative"]
}`

    const userPrompt = `Analyze this ${language === 'de' ? 'German' : 'English'} ingredient: "${ingredient}"

Please provide comprehensive analysis including:
1. All applicable dietary properties with confidence scores and detailed reasoning
2. Potential allergens including cross-contamination risks
3. Category classification with culinary context
4. Any warnings, concerns, or special considerations
5. Regional variations or preparation methods that might affect properties

Be thorough and consider edge cases, processing methods, and cultural variations.`

    // Make request to DeepSeek API
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
        max_tokens: 2000,
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
    
    // Try to extract JSON if wrapped in other text
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedContent = jsonMatch[0]
    }

    let analysis: IngredientAnalysis
    try {
      analysis = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Content:', cleanedContent)
      throw new Error('Failed to parse DeepSeek response as JSON')
    }

    // Validate and sanitize the response
    const validatedAnalysis = validateAndEnhanceAnalysis(analysis, ingredient)
    
    // Add intelligent enhancements
    const enhancedAnalysis = addIntelligentEnhancements(validatedAnalysis, language)

    return new Response(
      JSON.stringify({
        success: true,
        analysis: enhancedAnalysis,
        metadata: {
          model: 'deepseek-chat',
          language,
          timestamp: new Date().toISOString(),
          processingTime: Date.now()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('DeepSeek analysis error:', error)
    
    // Return intelligent fallback
    const fallbackAnalysis = createIntelligentFallback(
      req.method === 'POST' ? (await req.json()).ingredient : 'unknown',
      req.method === 'POST' ? (await req.json()).language || 'de' : 'de'
    )

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback: true,
        analysis: fallbackAnalysis
      }),
      { 
        status: 200, // Return 200 so the client can use fallback
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function validateAndEnhanceAnalysis(analysis: any, ingredientName: string): IngredientAnalysis {
  // Ensure all required fields exist with proper validation
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

  // Validate overall confidence
  validated.overallConfidence = Math.max(0, Math.min(100, Math.round(analysis.overallConfidence || 0)))

  // Validate warnings
  if (Array.isArray(analysis.warnings)) {
    validated.warnings = analysis.warnings
      .filter((warning: any) => typeof warning === 'string' && warning.length > 0)
      .slice(0, 5) // Limit to 5 warnings max
  }

  return validated
}

function addIntelligentEnhancements(analysis: IngredientAnalysis, language: 'en' | 'de'): IngredientAnalysis {
  const enhanced = { ...analysis }
  const name = analysis.ingredient.toLowerCase()

  // Add intelligent cross-checks and enhancements
  
  // Enhance confidence based on consistency
  if (enhanced.dietaryProperties.length > 0 && enhanced.allergens.length > 0) {
    // Check for logical consistency (e.g., vegan + dairy allergen should be flagged)
    const hasVegan = enhanced.dietaryProperties.some(p => p.property === 'vegan')
    const hasDairy = enhanced.allergens.some(a => a.allergen === 'dairy')
    
    if (hasVegan && hasDairy) {
      enhanced.warnings.push('Inconsistency detected: Ingredient marked as vegan but contains dairy allergen')
      enhanced.overallConfidence = Math.max(enhanced.overallConfidence - 20, 10)
    }
  }

  // Add seasonal awareness
  const seasonalIngredients = ['erdbeeren', 'strawberries', 'spargel', 'asparagus', 'kürbis', 'pumpkin']
  if (seasonalIngredients.some(seasonal => name.includes(seasonal))) {
    enhanced.warnings.push('Seasonal ingredient - availability and quality may vary by season')
  }

  // Add processing method awareness
  if (name.includes('bio') || name.includes('organic')) {
    enhanced.dietaryProperties.push({
      property: 'organic',
      confidence: 85,
      reasoning: 'Ingredient name indicates organic certification'
    })
  }

  // Add regional variation awareness
  if (language === 'de' && name.includes('wurst')) {
    enhanced.warnings.push('German sausage - composition varies significantly by region and producer')
  }

  // Enhance allergen detection with common cross-contamination
  const glutenContaining = ['weizen', 'wheat', 'gerste', 'barley', 'roggen', 'rye']
  if (glutenContaining.some(grain => name.includes(grain))) {
    const hasGluten = enhanced.allergens.some(a => a.allergen === 'gluten')
    if (!hasGluten) {
      enhanced.allergens.push({
        allergen: 'gluten',
        confidence: 95,
        reasoning: 'Contains gluten-containing grains'
      })
    }
  }

  return enhanced
}

function createIntelligentFallback(ingredient: string, language: 'en' | 'de'): IngredientAnalysis {
  // Create a smart fallback based on basic pattern matching
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
    warnings: ['AI analysis failed - using basic pattern matching', 'Manual review strongly recommended']
  }

  // Basic categorization
  const patterns = {
    vegetables: ['kartoffel', 'potato', 'zwiebel', 'onion', 'tomate', 'tomato', 'salat', 'lettuce'],
    fruits: ['apfel', 'apple', 'banane', 'banana', 'orange', 'zitrone', 'lemon'],
    dairy: ['milch', 'milk', 'käse', 'cheese', 'butter', 'joghurt', 'yogurt'],
    meat: ['fleisch', 'meat', 'hähnchen', 'chicken', 'rind', 'beef', 'schwein', 'pork'],
    grains: ['brot', 'bread', 'reis', 'rice', 'nudeln', 'pasta', 'mehl', 'flour']
  }

  for (const [category, items] of Object.entries(patterns)) {
    if (items.some(item => name.includes(item))) {
      fallback.category = {
        name: category,
        confidence: 30,
        reasoning: `Basic pattern matching identified as ${category}`
      }
      break
    }
  }

  return fallback
}