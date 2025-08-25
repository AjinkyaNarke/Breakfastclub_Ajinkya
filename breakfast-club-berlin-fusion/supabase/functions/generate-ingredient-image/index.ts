import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface GenerateImageRequest {
  ingredient: {
    id: string;
    name: string;
    name_de?: string;
    name_en?: string;
    category_id: string;
    category?: {
      name: string;
    };
  };
}

interface RecraftResponse {
  data?: Array<{
    url: string;
  }>;
  url?: string;
  cost?: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const { ingredient }: GenerateImageRequest = await req.json()

    if (!ingredient) {
      throw new Error('Ingredient data is required')
    }

    // Get Recraft API key from secrets
    const recraftApiKey = Deno.env.get('RECRAFT_API_KEY')
    if (!recraftApiKey) {
      console.error('RECRAFT_API_KEY not configured in environment variables')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RECRAFT_API_KEY not configured. Please set the API key in Supabase Dashboard > Settings > Edge Functions > Environment Variables',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Generate smart prompt
    const prompt = generateSmartPrompt(ingredient)

    // Call Recraft API (using the same endpoint as the working menu function)
    const recraftResponse = await fetch('https://external.api.recraft.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${recraftApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        style: "realistic_image",
        size: "1024x1024",
        response_format: "url"
      }),
    })

    if (!recraftResponse.ok) {
      let errorData
      try {
        errorData = await recraftResponse.json()
      } catch {
        errorData = { message: recraftResponse.statusText }
      }
      
      console.error('Recraft API error:', errorData)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Recraft API error (${recraftResponse.status}): ${errorData.message || 'Unknown error'}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const data = await recraftResponse.json()
    
    // Extract image URL from response (same format as menu function)
    const imageUrl = data.data?.[0]?.url
    const cost = 0.001 // Same cost as menu function

    if (!imageUrl) {
      console.error('No image URL in Recraft response:', data)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No image URL received from Recraft API',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Download and upload to Supabase storage
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.arrayBuffer()
    
    const fileName = `ingredients/${ingredient.id}-${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('restaurant-images')
      .upload(fileName, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Storage upload error: ${uploadError.message}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('restaurant-images')
      .getPublicUrl(fileName)

    // Update AI usage tracking
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: existingUsage } = await supabaseClient
      .from('ai_usage_tracking')
      .select('total_cost, images_generated')
      .eq('month_year', currentMonth)
      .single()

    if (existingUsage) {
      await supabaseClient
        .from('ai_usage_tracking')
        .update({ 
          total_cost: (existingUsage.total_cost || 0) + cost,
          images_generated: (existingUsage.images_generated || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('month_year', currentMonth)
    } else {
      await supabaseClient
        .from('ai_usage_tracking')
        .insert({
          month_year: currentMonth,
          total_cost: cost,
          images_generated: 1,
          budget_limit: 10.00
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: urlData.publicUrl,
        cost: cost,
        prompt: prompt,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in generate-ingredient-image:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function generateSmartPrompt(ingredient: any): string {
  const name = ingredient.name_de || ingredient.name_en || ingredient.name
  const categoryName = ingredient.category?.name?.toLowerCase() || ''
  
  // Detect if it's a raw ingredient vs prepared dish
  const isRawIngredient = isRawIngredientType(categoryName, name)
  const isSpiceOrHerb = isSpiceOrHerbType(categoryName, name)
  const isPreparedDish = isPreparedDishType(categoryName, name)
  
  let prompt = ''
  
  if (isSpiceOrHerb) {
    prompt = `${name}, ingredient photography, clear detail, professional lighting, white background, high quality`
  } else if (isRawIngredient) {
    prompt = `${name}, product photography, white background, professional, clean, high quality`
  } else if (isPreparedDish) {
    prompt = `${name}, restaurant quality food photography, appetizing presentation, professional lighting, high quality`
  } else {
    // Default fallback
    prompt = `${name}, food ingredient, professional photography, white background, high quality`
  }
  
  return prompt
}

function isRawIngredientType(categoryName: string, ingredientName: string): boolean {
  const rawCategories = ['proteins', 'vegetables', 'fruits', 'dairy', 'grains', 'oils']
  const rawKeywords = ['raw', 'fresh', 'uncooked', 'whole', 'natural']
  
  return rawCategories.some(cat => categoryName.includes(cat)) ||
         rawKeywords.some(keyword => ingredientName.toLowerCase().includes(keyword))
}

function isSpiceOrHerbType(categoryName: string, ingredientName: string): boolean {
  const spiceCategories = ['spices', 'herbs', 'seasonings']
  const spiceKeywords = ['spice', 'herb', 'seasoning', 'powder', 'dried']
  
  return spiceCategories.some(cat => categoryName.includes(cat)) ||
         spiceKeywords.some(keyword => ingredientName.toLowerCase().includes(keyword))
}

function isPreparedDishType(categoryName: string, ingredientName: string): boolean {
  const preparedCategories = ['prepared', 'cooked', 'dishes', 'meals']
  const preparedKeywords = ['cooked', 'prepared', 'dish', 'meal', 'recipe']
  
  return preparedCategories.some(cat => categoryName.includes(cat)) ||
         preparedKeywords.some(keyword => ingredientName.toLowerCase().includes(keyword))
} 