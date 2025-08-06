import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IngredientCreationRequest {
  ingredients: string[];
  language?: 'en' | 'de';
  context?: {
    dish_name?: string;
    cuisine_type?: string;
    existing_ingredients?: string[];
  };
  auto_categorize?: boolean;
  create_missing_categories?: boolean;
}

interface CreatedIngredient {
  id: string;
  name: string;
  category_id: string | null;
  category_name?: string;
  unit: string;
  cost_per_unit: number;
  dietary_properties: string[];
  allergens: string[];
  seasonal_availability: string[];
  supplier_info?: string;
  notes?: string;
  is_new: boolean;
  confidence_score: number;
}

interface IngredientCreationResponse {
  created_ingredients: CreatedIngredient[];
  existing_ingredients: CreatedIngredient[];
  failed_ingredients: { name: string; reason: string }[];
  created_categories: { id: string; name: string }[];
  processing_summary: {
    total_processed: number;
    newly_created: number;
    already_existed: number;
    failed: number;
  };
}

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { 
      ingredients, 
      language = 'en', 
      context = {}, 
      auto_categorize = true,
      create_missing_categories = true 
    }: IngredientCreationRequest = await req.json()

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Ingredients array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limits
    const rateLimitCheck = await supabaseClient.rpc('check_deepgram_rate_limit', {
      user_id: user.id,
      endpoint: 'ingredient_creation',
      max_requests: 100,
      window_minutes: 60
    });

    if (rateLimitCheck === false) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process ingredients
    const result = await processIngredients(
      supabaseClient, 
      ingredients, 
      language, 
      context, 
      auto_categorize, 
      create_missing_categories
    );

    // Log the operation
    await supabaseClient
      .from('ingredient_creation_logs')
      .insert({
        user_id: user.id,
        input_ingredients: ingredients,
        language,
        context,
        created_count: result.processing_summary.newly_created,
        existing_count: result.processing_summary.already_existed,
        failed_count: result.processing_summary.failed,
        timestamp: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        ...result
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ingredient-auto-create function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processIngredients(
  supabaseClient: any,
  ingredients: string[],
  language: string,
  context: any,
  auto_categorize: boolean,
  create_missing_categories: boolean
): Promise<IngredientCreationResponse> {
  
  const result: IngredientCreationResponse = {
    created_ingredients: [],
    existing_ingredients: [],
    failed_ingredients: [],
    created_categories: [],
    processing_summary: {
      total_processed: ingredients.length,
      newly_created: 0,
      already_existed: 0,
      failed: 0
    }
  };

  // Get existing ingredients to avoid duplicates
  const { data: existingIngredients } = await supabaseClient
    .from('ingredients')
    .select('id, name, category_id, unit, cost_per_unit, dietary_properties, allergens, seasonal_availability')
    .in('name', ingredients.map(name => name.toLowerCase()));

  // Get existing categories
  const { data: existingCategories } = await supabaseClient
    .from('ingredient_categories')
    .select('id, name');

  const categoryMap = new Map(existingCategories?.map(cat => [cat.name.toLowerCase(), cat]) || []);

  // Process each ingredient
  for (const ingredientName of ingredients) {
    const normalizedName = ingredientName.trim().toLowerCase();
    
    // Check if ingredient already exists
    const existingIngredient = existingIngredients?.find(
      ing => ing.name.toLowerCase() === normalizedName
    );

    if (existingIngredient) {
      result.existing_ingredients.push({
        ...existingIngredient,
        is_new: false,
        confidence_score: 1.0
      });
      result.processing_summary.already_existed++;
      continue;
    }

    try {
      // Generate ingredient data using AI
      const ingredientData = await generateIngredientData(
        ingredientName, 
        language, 
        context
      );

      // Handle category creation/assignment
      let categoryId = null;
      if (auto_categorize && ingredientData.suggested_category) {
        const categoryKey = ingredientData.suggested_category.toLowerCase();
        
        if (categoryMap.has(categoryKey)) {
          categoryId = categoryMap.get(categoryKey)!.id;
        } else if (create_missing_categories) {
          // Create new category
          const { data: newCategory, error: categoryError } = await supabaseClient
            .from('ingredient_categories')
            .insert({
              name: ingredientData.suggested_category,
              description: `Auto-created category for ${ingredientData.suggested_category} ingredients`,
              display_order: existingCategories?.length || 0
            })
            .select()
            .single();

          if (!categoryError && newCategory) {
            categoryId = newCategory.id;
            categoryMap.set(categoryKey, newCategory);
            result.created_categories.push({
              id: newCategory.id,
              name: newCategory.name
            });
          }
        }
      }

      // Create the ingredient
      const { data: newIngredient, error: ingredientError } = await supabaseClient
        .from('ingredients')
        .insert({
          name: ingredientData.name || ingredientName,
          category_id: categoryId,
          unit: ingredientData.unit || 'piece',
          cost_per_unit: ingredientData.estimated_cost || 1.0,
          dietary_properties: ingredientData.dietary_properties || [],
          allergens: ingredientData.allergens || [],
          seasonal_availability: ingredientData.seasonal_availability || ['spring', 'summer', 'autumn', 'winter'],
          supplier_info: ingredientData.supplier_info || null,
          notes: ingredientData.notes || `Auto-created from speech input: "${ingredientName}"`,
          is_active: true
        })
        .select()
        .single();

      if (ingredientError) {
        result.failed_ingredients.push({
          name: ingredientName,
          reason: ingredientError.message
        });
        result.processing_summary.failed++;
        continue;
      }

      result.created_ingredients.push({
        ...newIngredient,
        category_name: categoryId ? categoryMap.get(ingredientData.suggested_category?.toLowerCase() || '')?.name : undefined,
        is_new: true,
        confidence_score: ingredientData.confidence_score || 0.8
      });
      result.processing_summary.newly_created++;

    } catch (error) {
      result.failed_ingredients.push({
        name: ingredientName,
        reason: error instanceof Error ? error.message : 'Unknown error during processing'
      });
      result.processing_summary.failed++;
    }
  }

  return result;
}

async function generateIngredientData(
  ingredientName: string, 
  language: string, 
  context: any
): Promise<any> {
  
  if (!DEEPSEEK_API_KEY) {
    // Fallback to basic data generation
    return generateBasicIngredientData(ingredientName, language);
  }

  const systemPrompt = createIngredientSystemPrompt(language);
  const userPrompt = createIngredientUserPrompt(ingredientName, context, language);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
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
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
      }
    }
    
  } catch (error) {
    console.error('AI ingredient generation failed:', error);
  }

  // Fallback to basic generation
  return generateBasicIngredientData(ingredientName, language);
}

function createIngredientSystemPrompt(language: string): string {
  return language === 'de' 
    ? `Du bist ein Experte für Lebensmittel und Zutaten. Analysiere Zutaten und gib strukturierte Daten zurück.

Gib für jede Zutat folgende Informationen als JSON zurück:
- name: Standardisierter Zutatname
- suggested_category: Vorgeschlagene Kategorie (Gemüse, Fleisch, Gewürze, etc.)
- unit: Standard-Einheit (kg, liter, stück, etc.)
- estimated_cost: Geschätzte Kosten pro Einheit (EUR)
- dietary_properties: Array mit diätetischen Eigenschaften
- allergens: Array mit Allergenen
- seasonal_availability: Array mit Saisons
- supplier_info: Lieferantentyp
- notes: Zusätzliche Informationen
- confidence_score: Vertrauenswert (0-1)

Nutze deutsche Begriffe.`
    : `You are a food and ingredient expert. Analyze ingredients and return structured data.

Return the following information for each ingredient as JSON:
- name: Standardized ingredient name
- suggested_category: Suggested category (vegetables, meat, spices, etc.)
- unit: Standard unit (kg, liter, piece, etc.)
- estimated_cost: Estimated cost per unit (EUR)
- dietary_properties: Array of dietary properties
- allergens: Array of allergens
- seasonal_availability: Array of seasons
- supplier_info: Supplier type
- notes: Additional information
- confidence_score: Confidence score (0-1)

Use English terms.`;
}

function createIngredientUserPrompt(ingredientName: string, context: any, language: string): string {
  const contextInfo = context.dish_name 
    ? language === 'de'
      ? `Kontext: Diese Zutat wird für das Gericht "${context.dish_name}" verwendet.`
      : `Context: This ingredient is used for the dish "${context.dish_name}".`
    : '';

  const cuisineInfo = context.cuisine_type
    ? language === 'de'
      ? ` Küchenart: ${context.cuisine_type}.`
      : ` Cuisine type: ${context.cuisine_type}.`
    : '';

  return language === 'de'
    ? `Analysiere diese Zutat und gib strukturierte Daten zurück: "${ingredientName}"\n${contextInfo}${cuisineInfo}`
    : `Analyze this ingredient and return structured data: "${ingredientName}"\n${contextInfo}${cuisineInfo}`;
}

function generateBasicIngredientData(ingredientName: string, language: string): any {
  const name = ingredientName.toLowerCase().trim();
  
  // Basic categorization
  const categoryRules = {
    'vegetables': ['tomato', 'onion', 'garlic', 'carrot', 'potato', 'spinach', 'lettuce', 'tomate', 'zwiebel', 'knoblauch', 'karotte', 'kartoffel'],
    'meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'huhn', 'rindfleisch', 'schweinefleisch', 'lamm'],
    'seafood': ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'fisch', 'lachs', 'garnelen'],
    'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'milch', 'käse', 'butter', 'sahne'],
    'grains': ['rice', 'wheat', 'flour', 'pasta', 'bread', 'reis', 'weizen', 'mehl', 'nudeln', 'brot'],
    'spices': ['salt', 'pepper', 'basil', 'oregano', 'thyme', 'salz', 'pfeffer', 'basilikum'],
    'oils': ['oil', 'olive oil', 'coconut oil', 'öl', 'olivenöl']
  };

  let suggestedCategory = 'other';
  for (const [category, keywords] of Object.entries(categoryRules)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      suggestedCategory = category;
      break;
    }
  }

  // Basic unit detection
  const unitRules = {
    'kg': ['meat', 'fish', 'potato', 'flour', 'fleisch', 'fisch', 'kartoffel', 'mehl'],
    'liter': ['milk', 'oil', 'water', 'milch', 'öl', 'wasser'],
    'piece': ['egg', 'onion', 'tomato', 'ei', 'zwiebel', 'tomate'],
    'gram': ['spice', 'salt', 'pepper', 'gewürz', 'salz', 'pfeffer']
  };

  let unit = 'piece';
  for (const [unitType, keywords] of Object.entries(unitRules)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      unit = unitType;
      break;
    }
  }

  // Basic cost estimation
  const costRules = {
    high: ['salmon', 'beef', 'lamb', 'truffle', 'lachs', 'rindfleisch', 'lamm'],
    medium: ['chicken', 'cheese', 'oil', 'huhn', 'käse', 'öl'],
    low: ['potato', 'onion', 'flour', 'salt', 'kartoffel', 'zwiebel', 'mehl', 'salz']
  };

  let estimatedCost = 2.0; // default
  if (costRules.high.some(keyword => name.includes(keyword))) estimatedCost = 8.0;
  else if (costRules.medium.some(keyword => name.includes(keyword))) estimatedCost = 4.0;
  else if (costRules.low.some(keyword => name.includes(keyword))) estimatedCost = 1.0;

  // Basic dietary properties
  const dietaryRules = {
    'vegetarian': !['meat', 'fish', 'chicken', 'beef', 'fleisch', 'fisch', 'huhn'].some(keyword => name.includes(keyword)),
    'vegan': !['meat', 'fish', 'milk', 'cheese', 'egg', 'fleisch', 'fisch', 'milch', 'käse', 'ei'].some(keyword => name.includes(keyword)),
    'gluten-free': !['wheat', 'flour', 'bread', 'pasta', 'weizen', 'mehl', 'brot', 'nudeln'].some(keyword => name.includes(keyword))
  };

  const dietaryProperties = Object.entries(dietaryRules)
    .filter(([_, isTrue]) => isTrue)
    .map(([property]) => property);

  return {
    name: ingredientName,
    suggested_category: suggestedCategory,
    unit: unit,
    estimated_cost: estimatedCost,
    dietary_properties: dietaryProperties,
    allergens: [], // Would need more sophisticated detection
    seasonal_availability: ['spring', 'summer', 'autumn', 'winter'], // Default to all seasons
    supplier_info: null,
    notes: `Auto-created ingredient`,
    confidence_score: 0.6
  };
}