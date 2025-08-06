import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IngredientTestScenario {
  name: string;
  ingredients: string[];
  language: 'en' | 'de';
  context: {
    dish_name?: string;
    cuisine_type?: string;
    existing_ingredients?: string[];
  };
  auto_categorize: boolean;
  create_missing_categories: boolean;
  expectedResults: {
    min_created: number;
    max_created: number;
    should_categorize: boolean;
    should_create_categories: boolean;
    expected_categories?: string[];
  };
}

const INGREDIENT_TEST_SCENARIOS: IngredientTestScenario[] = [
  // Basic English ingredients
  {
    name: "Basic vegetables - English",
    ingredients: ["tomato", "onion", "garlic", "carrot", "spinach"],
    language: "en",
    context: {
      dish_name: "Mixed vegetable salad",
      cuisine_type: "mediterranean"
    },
    auto_categorize: true,
    create_missing_categories: true,
    expectedResults: {
      min_created: 3, // Some might already exist
      max_created: 5,
      should_categorize: true,
      should_create_categories: false, // vegetables category should exist
      expected_categories: ["vegetables"]
    }
  },

  // Basic German ingredients
  {
    name: "Basic German ingredients",
    ingredients: ["kartoffel", "zwiebel", "knoblauch", "karotte"],
    language: "de",
    context: {
      dish_name: "Deutsche Gemüsesuppe",
      cuisine_type: "german"
    },
    auto_categorize: true,
    create_missing_categories: true,
    expectedResults: {
      min_created: 2,
      max_created: 4,
      should_categorize: true,
      should_create_categories: false,
      expected_categories: ["vegetables"]
    }
  },

  // Meat and protein ingredients
  {
    name: "Protein ingredients",
    ingredients: ["chicken breast", "salmon fillet", "beef sirloin", "tofu"],
    language: "en",
    context: {
      dish_name: "Mixed protein platter",
      cuisine_type: "fusion"
    },
    auto_categorize: true,
    create_missing_categories: true,
    expectedResults: {
      min_created: 3,
      max_created: 4,
      should_categorize: true,
      should_create_categories: false,
      expected_categories: ["meat", "seafood"]
    }
  },

  // Spices and seasonings
  {
    name: "Spices and herbs",
    ingredients: ["basil", "oregano", "thyme", "paprika", "cumin", "coriander"],
    language: "en",
    context: {
      dish_name: "Herb-crusted chicken",
      cuisine_type: "mediterranean"
    },
    auto_categorize: true,
    create_missing_categories: true,
    expectedResults: {
      min_created: 4,
      max_created: 6,
      should_categorize: true,
      should_create_categories: false,
      expected_categories: ["spices"]
    }
  },

  // Mixed categories with new category creation
  {
    name: "Exotic ingredients requiring new categories",
    ingredients: ["dragon fruit", "durian", "rambutan", "lychee"],
    language: "en",
    context: {
      dish_name: "Tropical fruit salad",
      cuisine_type: "asian"
    },
    auto_categorize: true,
    create_missing_categories: true,
    expectedResults: {
      min_created: 3,
      max_created: 4,
      should_categorize: true,
      should_create_categories: true,
      expected_categories: ["exotic fruits", "tropical fruits"]
    }
  },

  // Dairy and cheese varieties
  {
    name: "Dairy ingredients",
    ingredients: ["mozzarella", "parmesan", "ricotta", "heavy cream", "butter"],
    language: "en",
    context: {
      dish_name: "Four cheese pasta",
      cuisine_type: "italian"
    },
    auto_categorize: true,
    create_missing_categories: true,
    expectedResults: {
      min_created: 3,
      max_created: 5,
      should_categorize: true,
      should_create_categories: false,
      expected_categories: ["dairy"]
    }
  },

  // Asian ingredients
  {
    name: "Asian cuisine ingredients",
    ingredients: ["soy sauce", "sesame oil", "miso paste", "shiitake mushrooms", "rice vinegar"],
    language: "en",
    context: {
      dish_name: "Asian stir fry",
      cuisine_type: "asian"
    },
    auto_categorize: true,
    create_missing_categories: true,
    expectedResults: {
      min_created: 4,
      max_created: 5,
      should_categorize: true,
      should_create_categories: false,
      expected_categories: ["condiments", "vegetables", "oils"]
    }
  },

  // Test without auto-categorization
  {
    name: "No auto-categorization test",
    ingredients: ["mystery ingredient 1", "mystery ingredient 2"],
    language: "en",
    context: {},
    auto_categorize: false,
    create_missing_categories: false,
    expectedResults: {
      min_created: 2,
      max_created: 2,
      should_categorize: false,
      should_create_categories: false
    }
  },

  // Large batch test
  {
    name: "Large ingredient batch",
    ingredients: [
      "flour", "sugar", "eggs", "butter", "vanilla extract",
      "baking powder", "salt", "milk", "chocolate chips", "walnuts",
      "cinnamon", "nutmeg", "honey", "cream cheese", "powdered sugar"
    ],
    language: "en",
    context: {
      dish_name: "Chocolate chip cookies with cream cheese frosting",
      cuisine_type: "american"
    },
    auto_categorize: true,
    create_missing_categories: true,
    expectedResults: {
      min_created: 10,
      max_created: 15,
      should_categorize: true,
      should_create_categories: false,
      expected_categories: ["grains", "dairy", "spices", "nuts"]
    }
  },

  // Duplicate detection test
  {
    name: "Duplicate ingredient detection",
    ingredients: ["tomato", "tomato", "red tomato", "cherry tomato"],
    language: "en",
    context: {
      dish_name: "Tomato salad",
      cuisine_type: "mediterranean"
    },
    auto_categorize: true,
    create_missing_categories: true,
    expectedResults: {
      min_created: 1, // Should detect some as duplicates
      max_created: 4,
      should_categorize: true,
      should_create_categories: false
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

    // Handle cleanup of test data
    if (cleanup) {
      const cleanupResult = await cleanupTestData(supabaseClient);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test data cleaned up',
          deleted_count: cleanupResult
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let results: any[] = [];

    if (runAll) {
      // Run all test scenarios
      for (const scenario of INGREDIENT_TEST_SCENARIOS) {
        const result = await runIngredientTestScenario(scenario, supabaseClient);
        results.push(result);
      }
    } else if (scenarioName) {
      // Run specific scenario
      const scenario = INGREDIENT_TEST_SCENARIOS.find(s => s.name === scenarioName);
      if (!scenario) {
        return new Response(
          JSON.stringify({ error: `Scenario '${scenarioName}' not found` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const result = await runIngredientTestScenario(scenario, supabaseClient);
      results.push(result);
    } else {
      // Return list of available scenarios
      return new Response(
        JSON.stringify({
          available_scenarios: INGREDIENT_TEST_SCENARIOS.map(s => s.name),
          usage: {
            run_all: `${req.url}?all=true`,
            run_specific: `${req.url}?scenario=SCENARIO_NAME`,
            cleanup: `${req.url}?cleanup=true`
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate summary statistics
    const summary = calculateIngredientTestSummary(results);

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
    console.error('Error in ingredient-auto-create test:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function runIngredientTestScenario(scenario: IngredientTestScenario, supabaseClient: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Call the ingredient-auto-create function
    const { data, error } = await supabaseClient.functions.invoke('ingredient-auto-create', {
      body: {
        ingredients: scenario.ingredients,
        language: scenario.language,
        context: scenario.context,
        auto_categorize: scenario.auto_categorize,
        create_missing_categories: scenario.create_missing_categories
      }
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    if (error) {
      return {
        scenario: scenario.name,
        status: 'error',
        error: error.message,
        processing_time_ms: processingTime
      };
    }

    if (!data || !data.success) {
      return {
        scenario: scenario.name,
        status: 'failed',
        error: 'Invalid response from ingredient creation service',
        processing_time_ms: processingTime
      };
    }

    // Validate the results against expected outcomes
    const validation = validateIngredientResult(data, scenario);
    
    return {
      scenario: scenario.name,
      status: validation.passed ? 'passed' : 'failed',
      processing_time_ms: processingTime,
      validation_results: validation,
      results_summary: {
        total_processed: data.processing_summary.total_processed,
        newly_created: data.processing_summary.newly_created,
        already_existed: data.processing_summary.already_existed,
        failed: data.processing_summary.failed,
        categories_created: data.created_categories?.length || 0
      },
      input_ingredients: scenario.ingredients,
      created_ingredients: data.created_ingredients?.map((ing: any) => ({
        name: ing.name,
        category: ing.category_name,
        confidence: ing.confidence_score
      })) || []
    };

  } catch (error) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    return {
      scenario: scenario.name,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: processingTime
    };
  }
}

function validateIngredientResult(data: any, scenario: IngredientTestScenario): any {
  const validationResults: any = {
    passed: true,
    details: {}
  };

  const summary = data.processing_summary;
  const expected = scenario.expectedResults;

  // Check created count
  const totalCreated = summary.newly_created;
  const createdInRange = totalCreated >= expected.min_created && totalCreated <= expected.max_created;
  
  validationResults.details.created_count = {
    expected_range: `${expected.min_created}-${expected.max_created}`,
    actual: totalCreated,
    passed: createdInRange
  };

  if (!createdInRange) {
    validationResults.passed = false;
  }

  // Check categorization
  if (expected.should_categorize) {
    const categorizedCount = data.created_ingredients?.filter((ing: any) => ing.category_id).length || 0;
    const categorizationRate = totalCreated > 0 ? (categorizedCount / totalCreated) : 0;
    
    validationResults.details.categorization = {
      expected: 'Most ingredients should be categorized',
      categorized_count: categorizedCount,
      total_created: totalCreated,
      categorization_rate: Math.round(categorizationRate * 100),
      passed: categorizationRate > 0.5 // At least 50% should be categorized
    };

    if (categorizationRate <= 0.5) {
      validationResults.passed = false;
    }
  }

  // Check category creation
  const categoriesCreated = data.created_categories?.length || 0;
  if (expected.should_create_categories && categoriesCreated === 0) {
    validationResults.details.category_creation = {
      expected: 'Should create new categories',
      categories_created: categoriesCreated,
      passed: false
    };
    validationResults.passed = false;
  } else if (!expected.should_create_categories && categoriesCreated > 0) {
    validationResults.details.category_creation = {
      expected: 'Should not create new categories',
      categories_created: categoriesCreated,
      passed: false
    };
    validationResults.passed = false;
  } else {
    validationResults.details.category_creation = {
      expected: expected.should_create_categories ? 'Should create categories' : 'Should not create categories',
      categories_created: categoriesCreated,
      passed: true
    };
  }

  // Check failure rate
  const failureRate = summary.total_processed > 0 ? (summary.failed / summary.total_processed) : 0;
  validationResults.details.failure_rate = {
    failed_count: summary.failed,
    total_processed: summary.total_processed,
    failure_rate: Math.round(failureRate * 100),
    passed: failureRate < 0.2 // Less than 20% failure rate is acceptable
  };

  if (failureRate >= 0.2) {
    validationResults.passed = false;
  }

  // Check for duplicates in results
  const ingredientNames = data.created_ingredients?.map((ing: any) => ing.name.toLowerCase()) || [];
  const uniqueNames = new Set(ingredientNames);
  const hasDuplicates = uniqueNames.size !== ingredientNames.length;
  
  validationResults.details.duplicate_check = {
    total_results: ingredientNames.length,
    unique_results: uniqueNames.size,
    has_duplicates: hasDuplicates,
    passed: !hasDuplicates
  };

  if (hasDuplicates) {
    validationResults.passed = false;
  }

  return validationResults;
}

function calculateIngredientTestSummary(results: any[]): any {
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;

  const avgProcessingTime = results
    .filter(r => r.processing_time_ms)
    .reduce((sum, r) => sum + r.processing_time_ms, 0) / total;

  const totalIngredientsProcessed = results
    .filter(r => r.results_summary)
    .reduce((sum, r) => sum + r.results_summary.total_processed, 0);

  const totalIngredientsCreated = results
    .filter(r => r.results_summary)
    .reduce((sum, r) => sum + r.results_summary.newly_created, 0);

  const totalCategoriesCreated = results
    .filter(r => r.results_summary)
    .reduce((sum, r) => sum + r.results_summary.categories_created, 0);

  return {
    total_tests: total,
    passed: passed,
    failed: failed,
    errors: errors,
    success_rate: Math.round((passed / total) * 100),
    avg_processing_time_ms: Math.round(avgProcessingTime),
    total_ingredients_processed: totalIngredientsProcessed,
    total_ingredients_created: totalIngredientsCreated,
    total_categories_created: totalCategoriesCreated,
    performance_rating: avgProcessingTime < 3000 ? 'excellent' : 
                       avgProcessingTime < 7000 ? 'good' : 'needs_improvement'
  };
}

async function cleanupTestData(supabaseClient: any): Promise<number> {
  try {
    // Delete test ingredients (those with "test" in notes or specific test names)
    const { data: testIngredients, error: selectError } = await supabaseClient
      .from('ingredients')
      .select('id')
      .or('notes.ilike.%auto-created%,notes.ilike.%test%,name.ilike.%mystery ingredient%');

    if (selectError) {
      console.error('Error finding test ingredients:', selectError);
      return 0;
    }

    if (testIngredients && testIngredients.length > 0) {
      const { error: deleteError } = await supabaseClient
        .from('ingredients')
        .delete()
        .in('id', testIngredients.map(ing => ing.id));

      if (deleteError) {
        console.error('Error deleting test ingredients:', deleteError);
        return 0;
      }

      return testIngredients.length;
    }

    return 0;
  } catch (error) {
    console.error('Error in cleanup:', error);
    return 0;
  }
}