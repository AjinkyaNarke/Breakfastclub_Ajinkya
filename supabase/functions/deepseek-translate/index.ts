import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IngredientData {
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  dietary_properties?: string[];
  allergens?: string[];
  category?: string;
  supplier_info?: string;
  notes?: string;
}

interface TranslatedIngredientData {
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  dietary_properties: string[];
  allergens: string[];
  category: string;
  supplier_info: string;
  notes: string;
  confidence: number;
}

interface PrepData {
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  instructions?: string;
  instructions_de?: string;
  instructions_en?: string;
  notes?: string;
  batch_yield?: string;
  batch_yield_amount?: number;
  batch_yield_unit?: string;
}

interface TranslatedPrepData {
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  instructions: string;
  instructions_de: string;
  instructions_en: string;
  notes: string;
  batch_yield: string;
  confidence: number;
}

interface TranslationRequest {
  ingredient?: IngredientData;
  ingredients?: IngredientData[];
  prep?: PrepData;
  preps?: PrepData[];
  name?: string;
  sourceLang: 'en' | 'de';
  targetLang: 'en' | 'de';
  mode: 'single' | 'batch' | 'name' | 'prep' | 'prep_batch' | 'prep_name';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ingredient, ingredients, prep, preps, name, sourceLang, targetLang, mode }: TranslationRequest = await req.json()

    if (sourceLang === targetLang) {
      return new Response(
        JSON.stringify({ error: 'Source and target languages cannot be the same' }),
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

    if (mode === 'name' && name) {
      return await translateName(name, sourceLang, targetLang, DEEPSEEK_API_KEY)
    }

    if (mode === 'prep_name' && name) {
      return await translatePrepName(name, sourceLang, targetLang, DEEPSEEK_API_KEY)
    }

    if (mode === 'single' && ingredient) {
      return await translateIngredient(ingredient, sourceLang, targetLang, DEEPSEEK_API_KEY)
    }

    if (mode === 'prep' && prep) {
      return await translatePrep(prep, sourceLang, targetLang, DEEPSEEK_API_KEY)
    }

    if (mode === 'batch' && ingredients) {
      return await translateBatch(ingredients, sourceLang, targetLang, DEEPSEEK_API_KEY)
    }

    if (mode === 'prep_batch' && preps) {
      return await translatePrepBatch(preps, sourceLang, targetLang, DEEPSEEK_API_KEY)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request parameters' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Translation error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        fallback: true
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function translateName(
  name: string, 
  sourceLang: 'en' | 'de', 
  targetLang: 'en' | 'de',
  apiKey: string
): Promise<Response> {
  try {
    console.log(`🔤 Translating name: ${name} (${sourceLang} → ${targetLang})`)

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a professional culinary translator specializing in ingredient names. 
            Translate the ingredient name from ${sourceLang} to ${targetLang} using proper culinary terminology.
            Return ONLY the translated name, nothing else.
            
            Examples:
            - Kartoffel → Potato
            - Zwiebel → Onion  
            - Olive oil → Olivenöl
            - Chicken breast → Hähnchenbrust
            - Tomaten → Tomatoes
            - Milch → Milk
            - Käse → Cheese
            - Hähnchen → Chicken
            - Rind → Beef
            - Lachs → Salmon`
          },
          {
            role: 'user',
            content: name.trim()
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const translatedName = data.choices?.[0]?.message?.content?.trim()

    if (!translatedName) {
      throw new Error('No translation received')
    }

    // Calculate confidence based on translation quality
    const lengthRatio = translatedName.length / name.length
    let confidence = 0.85

    if (lengthRatio < 0.3 || lengthRatio > 3.0) confidence -= 0.2
    if (translatedName === name) confidence = 0.3 // Same text indicates potential failure
    if (translatedName.length < 2) confidence = 0.2 // Too short

    console.log(`✅ Name translated: ${name} → ${translatedName} (${Math.round(confidence * 100)}% confidence)`)

    return new Response(
      JSON.stringify({
        success: true,
        translatedName,
        confidence: Math.max(0.1, Math.min(1.0, confidence)),
        originalName: name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Name translation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        translatedName: name, // Return original if translation fails
        confidence: 0.1,
        originalName: name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function translateIngredient(
  ingredient: IngredientData,
  sourceLang: 'en' | 'de',
  targetLang: 'en' | 'de',
  apiKey: string
): Promise<Response> {
  try {
    console.log(`🥗 Translating ingredient: ${ingredient.name} (${sourceLang} → ${targetLang})`)

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a professional culinary translator specializing in German and English ingredient translations for restaurant management systems.

Your task is to translate ingredient information with high accuracy, maintaining culinary context and terminology.

Key requirements:
- Translate ingredient names using proper culinary terminology
- Maintain consistency with standard cooking terms
- Preserve dietary property meanings (vegan, vegetarian, gluten-free, etc.)
- Keep allergen information accurate and complete
- Translate descriptions naturally while preserving cooking context
- Use appropriate food industry vocabulary

Return ONLY a valid JSON object with all fields translated to ${targetLang === 'de' ? 'German' : 'English'}.
If a field is empty or null, return an empty string for that field.

Expected JSON structure:
{
  "name": "translated name",
  "name_de": "German name",
  "name_en": "English name", 
  "description": "translated description",
  "description_de": "German description",
  "description_en": "English description",
  "dietary_properties": ["translated", "properties"],
  "allergens": ["translated", "allergens"],
  "category": "translated category",
  "supplier_info": "translated supplier info",
  "notes": "translated notes",
  "confidence": 0.92
}

IMPORTANT: The confidence should be between 0.0 and 1.0 based on how certain you are about the translation quality.`
          },
          {
            role: 'user',
            content: `Translate this ingredient data from ${sourceLang} to ${targetLang}:

${JSON.stringify(ingredient, null, 2)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No translation content received')
    }

    // Clean and parse the JSON response
    let cleanedContent = content.trim()
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    // Try to extract JSON if wrapped in other text
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedContent = jsonMatch[0]
    }

    let translatedData: any
    try {
      translatedData = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Failed to parse translation response')
    }

    // Validate and ensure all required fields exist
    const validatedData: TranslatedIngredientData = {
      name: translatedData.name || ingredient.name || '',
      name_de: translatedData.name_de || ingredient.name_de || ingredient.name || '',
      name_en: translatedData.name_en || ingredient.name_en || ingredient.name || '',
      description: translatedData.description || ingredient.description || '',
      description_de: translatedData.description_de || ingredient.description_de || ingredient.description || '',
      description_en: translatedData.description_en || ingredient.description_en || ingredient.description || '',
      dietary_properties: Array.isArray(translatedData.dietary_properties) ? translatedData.dietary_properties : (ingredient.dietary_properties || []),
      allergens: Array.isArray(translatedData.allergens) ? translatedData.allergens : (ingredient.allergens || []),
      category: translatedData.category || ingredient.category || '',
      supplier_info: translatedData.supplier_info || ingredient.supplier_info || '',
      notes: translatedData.notes || ingredient.notes || '',
      confidence: typeof translatedData.confidence === 'number' ? Math.max(0.1, Math.min(1.0, translatedData.confidence)) : 0.8
    }

    console.log(`✅ Ingredient translated: ${ingredient.name} (${Math.round(validatedData.confidence * 100)}% confidence)`)

    return new Response(
      JSON.stringify({
        success: true,
        translation: validatedData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Ingredient translation error:', error)
    
    // Return fallback with original data
    const fallbackData: TranslatedIngredientData = {
      name: ingredient.name || '',
      name_de: ingredient.name_de || ingredient.name || '',
      name_en: ingredient.name_en || ingredient.name || '',
      description: ingredient.description || '',
      description_de: ingredient.description_de || ingredient.description || '',
      description_en: ingredient.description_en || ingredient.description || '',
      dietary_properties: ingredient.dietary_properties || [],
      allergens: ingredient.allergens || [],
      category: ingredient.category || '',
      supplier_info: ingredient.supplier_info || '',
      notes: ingredient.notes || '',
      confidence: 0.2 // Low confidence for fallback
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        translation: fallbackData,
        fallback: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function translateBatch(
  ingredients: IngredientData[],
  sourceLang: 'en' | 'de',
  targetLang: 'en' | 'de',
  apiKey: string
): Promise<Response> {
  console.log(`📦 Batch translating ${ingredients.length} ingredients (${sourceLang} → ${targetLang})`)
  
  const results: TranslatedIngredientData[] = []
  
  for (let i = 0; i < ingredients.length; i++) {
    try {
      const singleResponse = await translateIngredient(ingredients[i], sourceLang, targetLang, apiKey)
      const singleData = await singleResponse.json()
      
      if (singleData.success) {
        results.push(singleData.translation)
      } else {
        results.push(singleData.translation) // Even failed translations have fallback data
      }
      
      // Rate limiting: wait 600ms between requests
      if (i < ingredients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600))
      }
      
    } catch (error) {
      console.error(`Failed to translate ingredient ${i}:`, error)
      
      // Add fallback result
      const ingredient = ingredients[i]
      results.push({
        name: ingredient.name || '',
        name_de: ingredient.name_de || ingredient.name || '',
        name_en: ingredient.name_en || ingredient.name || '',
        description: ingredient.description || '',
        description_de: ingredient.description_de || ingredient.description || '',
        description_en: ingredient.description_en || ingredient.description || '',
        dietary_properties: ingredient.dietary_properties || [],
        allergens: ingredient.allergens || [],
        category: ingredient.category || '',
        supplier_info: ingredient.supplier_info || '',
        notes: ingredient.notes || '',
        confidence: 0.1 // Very low confidence for failed translation
      })
    }
  }

  const successCount = results.filter(r => r.confidence > 0.5).length
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length

  console.log(`✅ Batch translation complete: ${successCount}/${results.length} successful (${Math.round(avgConfidence * 100)}% avg confidence)`)

  return new Response(
    JSON.stringify({
      success: true,
      results,
      summary: {
        total: ingredients.length,
        successful: successCount,
        averageConfidence: avgConfidence
      }
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function translatePrepName(
  name: string, 
  sourceLang: 'en' | 'de', 
  targetLang: 'en' | 'de',
  apiKey: string
): Promise<Response> {
  try {
    console.log(`🔤 Translating prep name: ${name} (${sourceLang} → ${targetLang})`)

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a professional culinary translator specializing in prep and preparation names. 
            Translate the prep/preparation name from ${sourceLang} to ${targetLang} using proper culinary terminology.
            Return ONLY the translated name, nothing else.
            
            Examples for prep names:
            - Curry Paste → Curry Paste
            - Grüne Curry Paste → Green Curry Paste
            - Tomato Sauce → Tomatensauce
            - Marinara Sauce → Marinara-Sauce
            - Garlic Oil → Knoblauchöl
            - Herb Mix → Kräutermischung
            - Spice Blend → Gewürzmischung
            - Stock → Brühe`
          },
          {
            role: 'user',
            content: name
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const translatedName = data.choices?.[0]?.message?.content?.trim()

    if (!translatedName) {
      throw new Error('No translation received')
    }

    const confidence = translatedName !== name ? 0.9 : 0.3

    console.log(`✅ Prep name translated: ${name} → ${translatedName} (${Math.round(confidence * 100)}% confidence)`)

    return new Response(
      JSON.stringify({
        success: true,
        translatedName,
        confidence
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Prep name translation error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        translatedName: name,
        confidence: 0.1
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function translatePrep(
  prep: PrepData,
  sourceLang: 'en' | 'de',
  targetLang: 'en' | 'de',
  apiKey: string
): Promise<Response> {
  try {
    console.log(`🥣 Translating prep: ${prep.name} (${sourceLang} → ${targetLang})`)

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a professional culinary translator specializing in food preparation data.
            Translate ALL text fields from ${sourceLang} to ${targetLang}, maintaining culinary accuracy.
            
            Requirements:
            - Translate name, description, instructions, notes, and batch_yield to both languages
            - Keep batch_yield_amount and batch_yield_unit as numbers/units
            - Maintain cooking terminology and techniques accurately
            - Use proper German/English culinary vocabulary
            - Return valid JSON with ALL required fields
            - Add confidence score (0.1-1.0) based on translation quality
            
            Expected JSON structure:
            {
              "name": "translated name",
              "name_de": "German name",
              "name_en": "English name", 
              "description": "translated description",
              "description_de": "German description",
              "description_en": "English description",
              "instructions": "translated instructions",
              "instructions_de": "German instructions", 
              "instructions_en": "English instructions",
              "notes": "translated notes",
              "batch_yield": "translated yield description",
              "confidence": 0.9
            }`
          },
          {
            role: 'user',
            content: `Translate this prep data from ${sourceLang} to ${targetLang}:

${JSON.stringify(prep, null, 2)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No translation content received')
    }

    // Clean and parse the JSON response
    let cleanedContent = content.trim()
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    // Try to extract JSON if wrapped in other text
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedContent = jsonMatch[0]
    }

    let translatedData: any
    try {
      translatedData = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Failed to parse prep translation response')
    }

    // Validate and ensure all required fields exist
    const validatedData: TranslatedPrepData = {
      name: translatedData.name || prep.name || '',
      name_de: translatedData.name_de || prep.name_de || prep.name || '',
      name_en: translatedData.name_en || prep.name_en || prep.name || '',
      description: translatedData.description || prep.description || '',
      description_de: translatedData.description_de || prep.description_de || prep.description || '',
      description_en: translatedData.description_en || prep.description_en || prep.description || '',
      instructions: translatedData.instructions || prep.instructions || '',
      instructions_de: translatedData.instructions_de || prep.instructions_de || prep.instructions || '',
      instructions_en: translatedData.instructions_en || prep.instructions_en || prep.instructions || '',
      notes: translatedData.notes || prep.notes || '',
      batch_yield: translatedData.batch_yield || prep.batch_yield || '',
      confidence: typeof translatedData.confidence === 'number' ? Math.max(0.1, Math.min(1.0, translatedData.confidence)) : 0.8
    }

    console.log(`✅ Prep translated: ${prep.name} (${Math.round(validatedData.confidence * 100)}% confidence)`)

    return new Response(
      JSON.stringify({
        success: true,
        translation: validatedData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Prep translation error:', error)
    
    // Return fallback with original data
    const fallbackData: TranslatedPrepData = {
      name: prep.name || '',
      name_de: prep.name_de || prep.name || '',
      name_en: prep.name_en || prep.name || '',
      description: prep.description || '',
      description_de: prep.description_de || prep.description || '',
      description_en: prep.description_en || prep.description || '',
      instructions: prep.instructions || '',
      instructions_de: prep.instructions_de || prep.instructions || '',
      instructions_en: prep.instructions_en || prep.instructions || '',
      notes: prep.notes || '',
      batch_yield: prep.batch_yield || '',
      confidence: 0.2 // Low confidence for fallback
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        translation: fallbackData,
        fallback: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function translatePrepBatch(
  preps: PrepData[],
  sourceLang: 'en' | 'de',
  targetLang: 'en' | 'de',
  apiKey: string
): Promise<Response> {
  console.log(`📦 Batch translating ${preps.length} preps (${sourceLang} → ${targetLang})`)
  
  const results: TranslatedPrepData[] = []
  
  for (let i = 0; i < preps.length; i++) {
    try {
      const singleResponse = await translatePrep(preps[i], sourceLang, targetLang, apiKey)
      const singleData = await singleResponse.json()
      
      if (singleData.success) {
        results.push(singleData.translation)
      } else {
        results.push(singleData.translation) // Even failed translations have fallback data
      }
      
      // Rate limiting: wait 600ms between requests
      if (i < preps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600))
      }
      
    } catch (error) {
      console.error(`Failed to translate prep ${i}:`, error)
      
      // Add fallback result
      const prep = preps[i]
      results.push({
        name: prep.name || '',
        name_de: prep.name_de || prep.name || '',
        name_en: prep.name_en || prep.name || '',
        description: prep.description || '',
        description_de: prep.description_de || prep.description || '',
        description_en: prep.description_en || prep.description || '',
        instructions: prep.instructions || '',
        instructions_de: prep.instructions_de || prep.instructions || '',
        instructions_en: prep.instructions_en || prep.instructions || '',
        notes: prep.notes || '',
        batch_yield: prep.batch_yield || '',
        confidence: 0.1 // Very low confidence for failed translation
      })
    }
  }

  const successCount = results.filter(r => r.confidence > 0.5).length
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length

  console.log(`✅ Batch prep translation complete: ${successCount}/${results.length} successful (${Math.round(avgConfidence * 100)}% avg confidence)`)

  return new Response(
    JSON.stringify({
      success: true,
      results,
      summary: {
        total: preps.length,
        successful: successCount,
        averageConfidence: avgConfidence
      }
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}