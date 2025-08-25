import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface PrepData {
  id?: string;
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  batch_yield?: string;
  batch_yield_amount?: number;
  batch_yield_unit?: string;
  instructions?: string;
  instructions_de?: string;
  instructions_en?: string;
  notes?: string;
  is_active?: boolean;
  ingredients?: Array<{
    ingredient_id: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
}

interface PrepIngredient {
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes?: string;
}

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

    const { method, url } = req
    const urlParams = new URL(url)
    const prepId = urlParams.searchParams.get('id')

    let requestBody: any = null
    
    // Handle special translate action
    if (method === 'POST') {
      requestBody = await req.json()
      
      if (requestBody.action === 'translate' && requestBody.prepData) {
        try {
          const { prepData, sourceLang } = requestBody
          const targetLang = sourceLang === 'en' ? 'de' : 'en'
          
          const translateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/deepseek-translate`, {
            method: 'POST',
            headers: {
              'Authorization': req.headers.get('Authorization')!,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prep: prepData,
              sourceLang,
              targetLang,
              mode: 'prep'
            })
          })

          if (!translateResponse.ok) {
            throw new Error('Translation service error')
          }

          const translateResult = await translateResponse.json()
          
          if (translateResult.success) {
            return new Response(
              JSON.stringify({
                success: true,
                translation: translateResult.translation,
                confidence: translateResult.translation.confidence
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } else {
            throw new Error('Translation failed')
          }
        } catch (error) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: error.message,
              fallback: requestBody.prepData
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    switch (method) {
      case 'GET': {
        if (prepId) {
          // Get single prep with ingredients
          const { data: prep, error: prepError } = await supabaseClient
            .from('preps')
            .select(`
              *,
              prep_ingredients (
                id,
                quantity,
                unit,
                notes,
                ingredient:ingredients (
                  id,
                  name,
                  name_de,
                  name_en,
                  unit,
                  cost_per_unit
                )
              )
            `)
            .eq('id', prepId)
            .single()

          if (prepError) {
            return new Response(
              JSON.stringify({ error: prepError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ data: prep }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Get all preps
          const search = urlParams.searchParams.get('search')
          const active_only = urlParams.searchParams.get('active_only') === 'true'
          const include_ingredients = urlParams.searchParams.get('include_ingredients') === 'true'

          let query = supabaseClient
            .from('preps')
            .select(include_ingredients ? `
              *,
              prep_ingredients (
                id,
                quantity,
                unit,
                notes,
                ingredient:ingredients (
                  id,
                  name,
                  name_de,
                  name_en,
                  unit,
                  cost_per_unit
                )
              )
            ` : '*')

          if (active_only) {
            query = query.eq('is_active', true)
          }

          if (search) {
            query = query.or(`name.ilike.%${search}%,name_de.ilike.%${search}%,name_en.ilike.%${search}%`)
          }

          query = query.order('name')

          const { data: preps, error } = await query

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ data: preps }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      case 'POST': {
        const requestData = requestBody || await req.json()
        const prepData: PrepData = requestData.prep || requestData
        const autoTranslate = requestData.autoTranslate === true
        const sourceLang = requestData.sourceLang || 'en'
        
        // Validate required fields
        if (!prepData.name) {
          return new Response(
            JSON.stringify({ error: 'Name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        let finalPrepData = { ...prepData }

        // Auto-translate if requested
        if (autoTranslate) {
          try {
            const targetLang = sourceLang === 'en' ? 'de' : 'en'
            
            // Call translation service
            const translateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/deepseek-translate`, {
              method: 'POST',
              headers: {
                'Authorization': req.headers.get('Authorization')!,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                prep: prepData,
                sourceLang,
                targetLang,
                mode: 'prep'
              })
            })

            if (translateResponse.ok) {
              const translateResult = await translateResponse.json()
              if (translateResult.success) {
                finalPrepData = { 
                  ...prepData, 
                  ...translateResult.translation,
                  // Preserve original numeric values
                  batch_yield_amount: prepData.batch_yield_amount,
                  batch_yield_unit: prepData.batch_yield_unit,
                }
                console.log(`✅ Auto-translated prep: ${prepData.name} (${Math.round(translateResult.translation.confidence * 100)}% confidence)`)
              } else {
                console.warn('Auto-translation failed, proceeding with original data')
              }
            }
          } catch (translateError) {
            console.error('Auto-translation error:', translateError)
            // Continue without translation
          }
        }

        // Start transaction
        const { data: prep, error: prepError } = await supabaseClient
          .from('preps')
          .insert({
            name: finalPrepData.name,
            name_de: finalPrepData.name_de,
            name_en: finalPrepData.name_en,
            description: finalPrepData.description,
            description_de: finalPrepData.description_de,
            description_en: finalPrepData.description_en,
            batch_yield: finalPrepData.batch_yield,
            batch_yield_amount: finalPrepData.batch_yield_amount,
            batch_yield_unit: finalPrepData.batch_yield_unit,
            instructions: finalPrepData.instructions,
            instructions_de: finalPrepData.instructions_de,
            instructions_en: finalPrepData.instructions_en,
            notes: finalPrepData.notes,
            is_active: finalPrepData.is_active ?? true,
          })
          .select()
          .single()

        if (prepError) {
          return new Response(
            JSON.stringify({ error: prepError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Add ingredients if provided
        if (prepData.ingredients && prepData.ingredients.length > 0) {
          const ingredientInserts = prepData.ingredients.map(ing => ({
            prep_id: prep.id,
            ingredient_id: ing.ingredient_id,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
          }))

          const { error: ingredientError } = await supabaseClient
            .from('prep_ingredients')
            .insert(ingredientInserts)

          if (ingredientError) {
            // Rollback prep creation if ingredient insertion fails
            await supabaseClient.from('preps').delete().eq('id', prep.id)
            return new Response(
              JSON.stringify({ error: `Failed to add ingredients: ${ingredientError.message}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Recalculate cost
          await supabaseClient.rpc('calculate_prep_cost', { prep_uuid: prep.id })
        }

        return new Response(
          JSON.stringify({ data: prep, message: 'Prep created successfully' }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PUT': {
        if (!prepId) {
          return new Response(
            JSON.stringify({ error: 'Prep ID is required for updates' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const prepData: PrepData = await req.json()

        // Update prep
        const { data: prep, error: prepError } = await supabaseClient
          .from('preps')
          .update({
            name: prepData.name,
            name_de: prepData.name_de,
            name_en: prepData.name_en,
            description: prepData.description,
            description_de: prepData.description_de,
            description_en: prepData.description_en,
            batch_yield: prepData.batch_yield,
            batch_yield_amount: prepData.batch_yield_amount,
            batch_yield_unit: prepData.batch_yield_unit,
            instructions: prepData.instructions,
            instructions_de: prepData.instructions_de,
            instructions_en: prepData.instructions_en,
            notes: prepData.notes,
            is_active: prepData.is_active,
          })
          .eq('id', prepId)
          .select()
          .single()

        if (prepError) {
          return new Response(
            JSON.stringify({ error: prepError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update ingredients if provided
        if (prepData.ingredients !== undefined) {
          // Delete existing ingredients
          await supabaseClient
            .from('prep_ingredients')
            .delete()
            .eq('prep_id', prepId)

          // Add new ingredients
          if (prepData.ingredients.length > 0) {
            const ingredientInserts = prepData.ingredients.map(ing => ({
              prep_id: prepId,
              ingredient_id: ing.ingredient_id,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes,
            }))

            const { error: ingredientError } = await supabaseClient
              .from('prep_ingredients')
              .insert(ingredientInserts)

            if (ingredientError) {
              return new Response(
                JSON.stringify({ error: `Failed to update ingredients: ${ingredientError.message}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          }

          // Recalculate cost
          await supabaseClient.rpc('calculate_prep_cost', { prep_uuid: prepId })
        }

        return new Response(
          JSON.stringify({ data: prep, message: 'Prep updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'DELETE': {
        if (!prepId) {
          return new Response(
            JSON.stringify({ error: 'Prep ID is required for deletion' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if prep is used in any menu items
        const { data: usageCheck, error: usageError } = await supabaseClient
          .from('menu_item_ingredients')
          .select('id')
          .eq('prep_id', prepId)
          .limit(1)

        if (usageError) {
          return new Response(
            JSON.stringify({ error: usageError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (usageCheck && usageCheck.length > 0) {
          return new Response(
            JSON.stringify({ 
              error: 'Cannot delete prep that is used in menu items. Please remove it from menu items first or deactivate it instead.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete prep (ingredients will be cascade deleted)
        const { error: deleteError } = await supabaseClient
          .from('preps')
          .delete()
          .eq('id', prepId)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Prep deleted successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in prep-crud function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})