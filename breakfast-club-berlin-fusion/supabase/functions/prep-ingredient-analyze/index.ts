import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PrepAnalysisRequest {
  prepName: string;
  description?: string;
  batchYield: {
    amount: number;
    unit: string;
  };
  availableIngredients: {
    id: string;
    name: string;
    name_de?: string;
    name_en?: string;
    unit: string;
    cost_per_unit?: number;
  }[];
  language: 'en' | 'de';
}

interface IngredientSuggestion {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  confidence: number;
  reasoning: string;
  cost_estimate?: number;
}

interface PrepAnalysisResponse {
  success: boolean;
  suggestions: IngredientSuggestion[];
  totalEstimatedCost: number;
  confidence: number;
  reasoning: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: PrepAnalysisRequest = await req.json()
    
    const { prepName, description, batchYield, availableIngredients, language } = requestData

    if (!prepName || !batchYield || !availableIngredients) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: prepName, batchYield, or availableIngredients' 
        }),
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

    console.log(`🧠 Analyzing prep: ${prepName} (${batchYield.amount} ${batchYield.unit})`)

    // Create intelligent prompt for prep ingredient analysis
    const analysisPrompt = `You are a professional culinary AI assistant specializing in recipe development and ingredient analysis. 

Analyze this preparation and suggest realistic ingredients with accurate quantities:

PREPARATION DETAILS:
- Name: ${prepName}
- Description: ${description || 'Not provided'}
- Batch Yield: ${batchYield.amount} ${batchYield.unit}
- Language: ${language === 'de' ? 'German' : 'English'}

AVAILABLE INGREDIENTS IN DATABASE:
${availableIngredients.map(ing => {
  const localizedName = language === 'de' && ing.name_de ? ing.name_de : 
                       language === 'en' && ing.name_en ? ing.name_en : ing.name;
  return `- ${localizedName} (ID: ${ing.id}, Unit: ${ing.unit}${ing.cost_per_unit ? `, €${ing.cost_per_unit}/${ing.unit}` : ''})`;
}).join('\n')}

INSTRUCTIONS:
1. Analyze the preparation name and description to understand what it is
2. Consider the batch yield to calculate realistic ingredient quantities
3. Only suggest ingredients from the available database list
4. Provide quantities that match the ingredient's stored unit
5. Calculate confidence scores (0-1) based on how certain you are
6. Provide brief reasoning for each suggested quantity

EXAMPLE ANALYSIS:
For "Green Curry Paste" with 500ml yield:
- Coconut milk: 200ml (base liquid)
- Green chilies: 50g (main flavor)
- Garlic: 30g (aromatic base)
- etc.

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "ingredient_id": "exact_id_from_list",
      "ingredient_name": "exact_name_from_list",
      "quantity": 200,
      "unit": "ml",
      "confidence": 0.85,
      "reasoning": "Primary liquid base for curry paste, standard ratio"
    }
  ],
  "overall_confidence": 0.8,
  "total_reasoning": "Analysis based on traditional curry paste recipes scaled for 500ml yield"
}

IMPORTANT:
- Only use ingredient IDs and names exactly as provided in the available list
- Match units to what's specified for each ingredient in the database
- Be realistic with quantities for the given yield
- Higher confidence (0.8+) for standard preparations, lower (0.3-0.7) for unusual ones
- Consider traditional recipes and cooking principles
- Account for the batch size when calculating quantities`

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
            content: 'You are an expert culinary AI that provides precise ingredient analysis for recipe development. Always return valid JSON responses.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No analysis content received from DeepSeek')
    }

    // Clean and parse the JSON response
    let cleanedContent = content.trim()
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    // Extract JSON if wrapped in other text
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedContent = jsonMatch[0]
    }

    let analysisResult: any
    try {
      analysisResult = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw content:', content)
      throw new Error('Failed to parse analysis response')
    }

    // Validate and process the suggestions
    const validatedSuggestions: IngredientSuggestion[] = []
    let totalEstimatedCost = 0

    if (analysisResult.suggestions && Array.isArray(analysisResult.suggestions)) {
      for (const suggestion of analysisResult.suggestions) {
        // Find the matching ingredient in the database
        const matchingIngredient = availableIngredients.find(ing => 
          ing.id === suggestion.ingredient_id
        )

        if (!matchingIngredient) {
          console.warn(`Ingredient ID ${suggestion.ingredient_id} not found in database`)
          continue
        }

        // Validate suggestion data
        if (typeof suggestion.quantity !== 'number' || suggestion.quantity <= 0) {
          console.warn(`Invalid quantity for ${matchingIngredient.name}`)
          continue
        }

        const confidence = Math.max(0.1, Math.min(1.0, suggestion.confidence || 0.5))
        const costEstimate = matchingIngredient.cost_per_unit 
          ? suggestion.quantity * matchingIngredient.cost_per_unit
          : undefined

        if (costEstimate) {
          totalEstimatedCost += costEstimate
        }

        validatedSuggestions.push({
          ingredient_id: matchingIngredient.id,
          ingredient_name: matchingIngredient.name,
          quantity: suggestion.quantity,
          unit: suggestion.unit || matchingIngredient.unit,
          confidence,
          reasoning: suggestion.reasoning || 'AI suggested based on preparation analysis',
          cost_estimate: costEstimate
        })
      }
    }

    const overallConfidence = Math.max(0.1, Math.min(1.0, analysisResult.overall_confidence || 0.6))

    console.log(`✅ Prep analysis complete: ${validatedSuggestions.length} suggestions, €${totalEstimatedCost.toFixed(2)} estimated cost`)

    const result: PrepAnalysisResponse = {
      success: true,
      suggestions: validatedSuggestions,
      totalEstimatedCost,
      confidence: overallConfidence,
      reasoning: analysisResult.total_reasoning || `AI analysis of ${prepName} for ${batchYield.amount} ${batchYield.unit} yield`
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Prep ingredient analysis error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        suggestions: [],
        totalEstimatedCost: 0,
        confidence: 0.1,
        reasoning: 'Analysis failed'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})