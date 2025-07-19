import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Prompt generation function
const generateFoodPrompt = (dishName: string, ingredients: string, cuisineType: string, category: string): string => {
  const basePrompt = `${dishName}, featuring ${ingredients}`;
  
  const styleModifiers: Record<string, string> = {
    korean: "Korean style plating, traditional Korean tableware, banchan side dishes",
    japanese: "Japanese minimalist presentation, wooden serving board, clean aesthetic",
    chinese: "Chinese restaurant style, ceramic bowls and plates, family style presentation",
    vietnamese: "Vietnamese fresh presentation, banana leaf elements, herbs and garnishes",
    fusion: "modern fusion plating, contemporary restaurant style, artistic presentation"
  };
  
  const categoryStyles: Record<string, string> = {
    breakfast: "breakfast lighting, morning ambiance, fresh and inviting",
    brunch: "natural daylight, relaxed brunch atmosphere, casual elegance",
    beverages: "beverage photography, condensation effects, refreshing presentation",
    desserts: "dessert presentation, elegant plating, tempting and indulgent"
  };
  
  const cuisineStyle = styleModifiers[cuisineType?.toLowerCase()] || styleModifiers.fusion;
  const categoryStyle = categoryStyles[category?.toLowerCase()] || "restaurant quality presentation";
  
  return `${basePrompt}, ${cuisineStyle}, ${categoryStyle}, professional food photography, 4K ultra-high resolution, restaurant quality lighting, clean background, appetizing presentation, sharp focus, vibrant colors, top-down view, styled for menu photography`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { dishName, ingredients, cuisineType, category, menuItemId } = await req.json()

    if (!dishName || !ingredients) {
      return new Response(
        JSON.stringify({ error: 'Dish name and ingredients are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Check current month usage and budget
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const { data: usageData } = await supabaseClient
      .from('ai_usage_tracking')
      .select('*')
      .eq('month_year', currentMonth)
      .single()

    if (usageData && usageData.total_cost >= usageData.budget_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'Monthly budget limit reached. Please increase budget or wait for next month.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      )
    }

    // Generate the prompt
    const prompt = generateFoodPrompt(dishName, ingredients, cuisineType, category)
    console.log('Generated prompt:', prompt)

    // For demo purposes, we'll simulate image generation
    // In production, you would integrate with your preferred AI image generation service
    const mockImageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`
    const generationCost = 0.001 // $0.001 per image

    // Upload mock image to Supabase storage (in production, upload the actual generated image)
    const fileName = `menu-images/${dishName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`
    
    // For now, we'll just return the mock URL as if it was uploaded
    const finalImageUrl = mockImageUrl

    // Save generation metadata
    const { error: saveError } = await supabaseClient
      .from('ai_image_generations')
      .insert({
        menu_item_id: menuItemId || null,
        prompt_used: prompt,
        image_url: finalImageUrl,
        generation_cost: generationCost,
        cuisine_type: cuisineType,
        category: category,
        status: 'success'
      })

    if (saveError) {
      console.error('Error saving generation metadata:', saveError)
    }

    // Update usage tracking
    const { error: usageError } = await supabaseClient
      .from('ai_usage_tracking')
      .upsert({
        month_year: currentMonth,
        images_generated: (usageData?.images_generated || 0) + 1,
        total_cost: (usageData?.total_cost || 0) + generationCost,
        budget_limit: usageData?.budget_limit || 10.00
      })

    if (usageError) {
      console.error('Error updating usage tracking:', usageError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: finalImageUrl,
        prompt: prompt,
        cost: generationCost,
        usage: {
          monthlyGenerated: (usageData?.images_generated || 0) + 1,
          monthlyCost: (usageData?.total_cost || 0) + generationCost,
          budgetLimit: usageData?.budget_limit || 10.00
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in generate-menu-image function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})