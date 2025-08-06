import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntegrationTestScenario {
  name: string;
  description: string;
  speechInput: string;
  language: 'en' | 'de';
  context: 'menu_creation' | 'ingredient_listing' | 'dish_description';
  expectedOutcome: {
    shouldParseDish: boolean;
    shouldCreateIngredients: boolean;
    minIngredientsCreated: number;
    maxIngredientsCreated: number;
    expectedCategories?: string[];
  };
}

const INTEGRATION_TEST_SCENARIOS: IntegrationTestScenario[] = [
  {
    name: "Complete workflow - Simple dish",
    description: "Test full pipeline from speech to dish creation with ingredient auto-creation",
    speechInput: "Grilled chicken breast with roasted vegetables including carrots, broccoli, and sweet potatoes, served with quinoa",
    language: "en",
    context: "menu_creation",
    expectedOutcome: {
      shouldParseDish: true,
      shouldCreateIngredients: true,
      minIngredientsCreated: 3,
      maxIngredientsCreated: 6,
      expectedCategories: ["meat", "vegetables", "grains"]
    }
  },

  {
    name: "German dish workflow",
    description: "Test German language processing through full pipeline",
    speechInput: "Wiener Schnitzel mit Kartoffeln, Sauerkraut und grünen Bohnen, dazu eine cremige Pilzsauce",
    language: "de",
    context: "menu_creation",
    expectedOutcome: {
      shouldParseDish: true,
      shouldCreateIngredients: true,
      minIngredientsCreated: 4,
      maxIngredientsCreated: 7,
      expectedCategories: ["meat", "vegetables"]
    }
  },

  {
    name: "Complex fusion dish",
    description: "Test complex dish with multiple cuisine influences",
    speechInput: "Korean-style beef bulgogi tacos with kimchi, pickled daikon, cilantro, and sriracha mayo on corn tortillas",
    language: "en",
    context: "menu_creation",
    expectedOutcome: {
      shouldParseDish: true,
      shouldCreateIngredients: true,
      minIngredientsCreated: 5,
      maxIngredientsCreated: 8,
      expectedCategories: ["meat", "vegetables", "condiments", "grains"]
    }
  },

  {
    name: "Vegetarian dish with dietary tags",
    description: "Test vegetarian dish parsing and dietary tag extraction",
    speechInput: "Vegan lentil curry with coconut milk, spinach, tomatoes, onions, and aromatic spices like turmeric and cumin",
    language: "en",
    context: "menu_creation",
    expectedOutcome: {
      shouldParseDish: true,
      shouldCreateIngredients: true,
      minIngredientsCreated: 6,
      maxIngredientsCreated: 10,
      expectedCategories: ["legumes", "vegetables", "spices", "dairy"]
    }
  },

  {
    name: "Ingredient listing context",
    description: "Test ingredient extraction without dish creation",
    speechInput: "I need to add fresh basil, oregano, thyme, rosemary, and sage to our herb collection",
    language: "en",
    context: "ingredient_listing",
    expectedOutcome: {
      shouldParseDish: true,
      shouldCreateIngredients: true,
      minIngredientsCreated: 4,
      maxIngredientsCreated: 5,
      expectedCategories: ["spices", "herbs"]
    }
  },

  {
    name: "Exotic ingredients test",
    description: "Test handling of unusual ingredients that may require new categories",
    speechInput: "Asian fusion salad with dragon fruit, rambutan, lychee, and Thai basil, dressed with miso-ginger vinaigrette",
    language: "en",
    context: "menu_creation",
    expectedOutcome: {
      shouldParseDish: true,
      shouldCreateIngredients: true,
      minIngredientsCreated: 5,
      maxIngredientsCreated: 8,
      expectedCategories: ["exotic fruits", "spices", "condiments"]
    }
  },

  {
    name: "Breakfast dish workflow",
    description: "Test breakfast items with common ingredients",
    speechInput: "French toast with eggs, milk, cinnamon, vanilla extract, served with fresh berries and maple syrup",
    language: "en",
    context: "menu_creation",
    expectedOutcome: {
      shouldParseDish: true,
      shouldCreateIngredients: true,
      minIngredientsCreated: 5,
      maxIngredientsCreated: 8,
      expectedCategories: ["dairy", "spices", "fruits", "grains"]
    }
  },

  {
    name: "Seafood specialty",
    description: "Test seafood dish with complex preparation",
    speechInput: "Pan-seared salmon with lemon herb butter, served over risotto with asparagus and cherry tomatoes",
    language: "en",
    context: "menu_creation",
    expectedOutcome: {
      shouldParseDish: true,
      shouldCreateIngredients: true,
      minIngredientsCreated: 6,
      maxIngredientsCreated: 9,
      expectedCategories: ["seafood", "dairy", "grains", "vegetables"]
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const scenarioName = url.searchParams.get('scenario');
    const runAll = url.searchParams.get('all') === 'true';
    const cleanup = url.searchParams.get('cleanup') === 'true';

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle cleanup
    if (cleanup) {
      const cleanupResults = await cleanupIntegrationTestData(supabaseClient);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Integration test data cleaned up',
          cleanup_results: cleanupResults
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let results: any[] = [];

    if (runAll) {
      // Run all integration test scenarios
      for (const scenario of INTEGRATION_TEST_SCENARIOS) {
        const result = await runIntegrationTestScenario(scenario, supabaseClient);
        results.push(result);
      }
    } else if (scenarioName) {
      // Run specific scenario
      const scenario = INTEGRATION_TEST_SCENARIOS.find(s => s.name === scenarioName);
      if (!scenario) {
        return new Response(
          JSON.stringify({ error: `Scenario '${scenarioName}' not found` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const result = await runIntegrationTestScenario(scenario, supabaseClient);
      results.push(result);
    } else {
      // Return list of available scenarios
      return new Response(
        JSON.stringify({
          available_scenarios: INTEGRATION_TEST_SCENARIOS.map(s => ({
            name: s.name,
            description: s.description
          })),
          usage: {
            run_all: `${req.url}?all=true`,
            run_specific: `${req.url}?scenario=SCENARIO_NAME`,
            cleanup: `${req.url}?cleanup=true`
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate comprehensive summary
    const summary = calculateIntegrationTestSummary(results);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        results,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in integration test:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function runIntegrationTestScenario(scenario: IntegrationTestScenario, supabaseClient: any): Promise<any> {
  const startTime = Date.now();
  const result: any = {
    scenario: scenario.name,
    description: scenario.description,
    status: 'pending',
    steps: [],
    total_processing_time_ms: 0,
    validation_results: {}
  };

  try {
    // Step 1: Parse the speech input
    const parseStartTime = Date.now();
    const { data: parseData, error: parseError } = await supabaseClient.functions.invoke('speech-parsing', {
      body: {
        text: scenario.speechInput,
        language: scenario.language,
        context: scenario.context
      }
    });

    const parseEndTime = Date.now();
    const parseTime = parseEndTime - parseStartTime;

    result.steps.push({
      step: 'speech_parsing',
      processing_time_ms: parseTime,
      status: parseError ? 'failed' : 'success',
      error: parseError?.message
    });

    if (parseError || !parseData?.success) {
      result.status = 'failed';
      result.total_processing_time_ms = Date.now() - startTime;
      return result;
    }

    const parsedDish = parseData.parsed_dish;

    // Step 2: Create ingredients from parsed dish
    const ingredientStartTime = Date.now();
    const { data: ingredientData, error: ingredientError } = await supabaseClient.functions.invoke('ingredient-auto-create', {
      body: {
        ingredients: parsedDish.ingredients || [],
        language: scenario.language,
        context: {
          dish_name: parsedDish.name,
          cuisine_type: parsedDish.cuisine_type
        },
        auto_categorize: true,
        create_missing_categories: true
      }
    });

    const ingredientEndTime = Date.now();
    const ingredientTime = ingredientEndTime - ingredientStartTime;

    result.steps.push({
      step: 'ingredient_creation',
      processing_time_ms: ingredientTime,
      status: ingredientError ? 'failed' : 'success',
      error: ingredientError?.message
    });

    if (ingredientError || !ingredientData?.success) {
      result.status = 'failed';
      result.total_processing_time_ms = Date.now() - startTime;
      return result;
    }

    // Step 3: Validate the complete workflow
    const validation = validateIntegrationResult(parsedDish, ingredientData, scenario);
    
    result.status = validation.passed ? 'passed' : 'failed';
    result.validation_results = validation;
    result.total_processing_time_ms = Date.now() - startTime;

    // Include summary data
    result.workflow_summary = {
      parsed_dish: {
        name: parsedDish.name,
        ingredients_found: parsedDish.ingredients?.length || 0,
        cuisine_type: parsedDish.cuisine_type,
        dietary_tags: parsedDish.dietary_tags,
        confidence_score: parsedDish.confidence_score
      },
      ingredient_creation: {
        total_processed: ingredientData.processing_summary.total_processed,
        newly_created: ingredientData.processing_summary.newly_created,
        already_existed: ingredientData.processing_summary.already_existed,
        failed: ingredientData.processing_summary.failed,
        categories_created: ingredientData.created_categories?.length || 0
      }
    };

    return result;

  } catch (error) {
    result.status = 'error';
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.total_processing_time_ms = Date.now() - startTime;
    return result;
  }
}

function validateIntegrationResult(parsedDish: any, ingredientData: any, scenario: IntegrationTestScenario): any {
  const validation: any = {
    passed: true,
    details: {}
  };

  const expected = scenario.expectedOutcome;

  // Validate dish parsing
  if (expected.shouldParseDish) {
    const dishValid = parsedDish.name && 
                     parsedDish.ingredients && 
                     Array.isArray(parsedDish.ingredients) && 
                     parsedDish.ingredients.length > 0;

    validation.details.dish_parsing = {
      expected: 'Should successfully parse dish',
      dish_name: parsedDish.name,
      ingredients_count: parsedDish.ingredients?.length || 0,
      confidence_score: parsedDish.confidence_score,
      passed: dishValid
    };

    if (!dishValid) {
      validation.passed = false;
    }
  }

  // Validate ingredient creation
  if (expected.shouldCreateIngredients) {
    const createdCount = ingredientData.processing_summary.newly_created;
    const countInRange = createdCount >= expected.minIngredientsCreated && 
                        createdCount <= expected.maxIngredientsCreated;

    validation.details.ingredient_creation = {
      expected_range: `${expected.minIngredientsCreated}-${expected.maxIngredientsCreated}`,
      actual_created: createdCount,
      total_processed: ingredientData.processing_summary.total_processed,
      failed_count: ingredientData.processing_summary.failed,
      passed: countInRange
    };

    if (!countInRange) {
      validation.passed = false;
    }
  }

  // Validate categories
  if (expected.expectedCategories) {
    const createdCategories = ingredientData.created_categories?.map((cat: any) => cat.name.toLowerCase()) || [];
    const existingIngredientCategories = ingredientData.created_ingredients
      ?.map((ing: any) => ing.category_name?.toLowerCase())
      .filter(Boolean) || [];
    
    const allCategories = [...new Set([...createdCategories, ...existingIngredientCategories])];
    
    const expectedCategoriesFound = expected.expectedCategories.some(expectedCat => 
      allCategories.some(actualCat => actualCat.includes(expectedCat.toLowerCase()))
    );

    validation.details.categorization = {
      expected_categories: expected.expectedCategories,
      found_categories: allCategories,
      categories_matched: expectedCategoriesFound,
      passed: expectedCategoriesFound
    };

    if (!expectedCategoriesFound) {
      validation.passed = false;
    }
  }

  // Validate overall success rate
  const totalProcessed = ingredientData.processing_summary.total_processed;
  const failed = ingredientData.processing_summary.failed;
  const failureRate = totalProcessed > 0 ? (failed / totalProcessed) : 0;

  validation.details.success_rate = {
    total_processed: totalProcessed,
    failed: failed,
    failure_rate: Math.round(failureRate * 100),
    passed: failureRate < 0.3 // Allow up to 30% failure rate for integration tests
  };

  if (failureRate >= 0.3) {
    validation.passed = false;
  }

  return validation;
}

function calculateIntegrationTestSummary(results: any[]): any {
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;

  const avgTotalTime = results
    .filter(r => r.total_processing_time_ms)
    .reduce((sum, r) => sum + r.total_processing_time_ms, 0) / total;

  const avgParseTime = results
    .filter(r => r.steps?.find((s: any) => s.step === 'speech_parsing'))
    .reduce((sum, r) => sum + (r.steps.find((s: any) => s.step === 'speech_parsing')?.processing_time_ms || 0), 0) / total;

  const avgIngredientTime = results
    .filter(r => r.steps?.find((s: any) => s.step === 'ingredient_creation'))
    .reduce((sum, r) => sum + (r.steps.find((s: any) => s.step === 'ingredient_creation')?.processing_time_ms || 0), 0) / total;

  // Aggregate workflow statistics
  const totalDishesProcessed = results.filter(r => r.workflow_summary?.parsed_dish).length;
  const totalIngredientsProcessed = results
    .filter(r => r.workflow_summary?.ingredient_creation)
    .reduce((sum, r) => sum + r.workflow_summary.ingredient_creation.total_processed, 0);
  const totalIngredientsCreated = results
    .filter(r => r.workflow_summary?.ingredient_creation)
    .reduce((sum, r) => sum + r.workflow_summary.ingredient_creation.newly_created, 0);

  return {
    test_summary: {
      total_tests: total,
      passed: passed,
      failed: failed,
      errors: errors,
      success_rate: Math.round((passed / total) * 100)
    },
    performance_metrics: {
      avg_total_time_ms: Math.round(avgTotalTime),
      avg_parse_time_ms: Math.round(avgParseTime),
      avg_ingredient_time_ms: Math.round(avgIngredientTime),
      performance_rating: avgTotalTime < 5000 ? 'excellent' : 
                         avgTotalTime < 10000 ? 'good' : 'needs_improvement'
    },
    workflow_metrics: {
      dishes_processed: totalDishesProcessed,
      ingredients_processed: totalIngredientsProcessed,
      ingredients_created: totalIngredientsCreated,
      creation_efficiency: totalIngredientsProcessed > 0 ? 
        Math.round((totalIngredientsCreated / totalIngredientsProcessed) * 100) : 0
    }
  };
}

async function cleanupIntegrationTestData(supabaseClient: any): Promise<any> {
  try {
    const results = {
      ingredients_deleted: 0,
      categories_deleted: 0,
      logs_deleted: 0
    };

    // Clean up test ingredients
    const { data: testIngredients } = await supabaseClient
      .from('ingredients')
      .select('id')
      .or('notes.ilike.%auto-created%,notes.ilike.%integration test%');

    if (testIngredients && testIngredients.length > 0) {
      await supabaseClient
        .from('ingredients')
        .delete()
        .in('id', testIngredients.map(ing => ing.id));
      
      results.ingredients_deleted = testIngredients.length;
    }

    // Clean up old parsing logs (keep only last 24 hours)
    const { count: parseLogs } = await supabaseClient
      .from('speech_parsing_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    results.logs_deleted += parseLogs || 0;

    // Clean up old ingredient creation logs
    const { count: ingredientLogs } = await supabaseClient
      .from('ingredient_creation_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    results.logs_deleted += ingredientLogs || 0;

    return results;
  } catch (error) {
    console.error('Error in cleanup:', error);
    return { error: 'Cleanup failed' };
  }
}