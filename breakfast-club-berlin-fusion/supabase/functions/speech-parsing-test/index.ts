import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestScenario {
  name: string;
  text: string;
  language: 'en' | 'de';
  context: 'menu_creation' | 'ingredient_listing' | 'dish_description';
  expectedFields: {
    name?: boolean;
    ingredients?: boolean;
    cuisine_type?: boolean;
    dietary_tags?: boolean;
    estimated_price?: boolean;
  };
  minConfidenceScore: number;
}

const TEST_SCENARIOS: TestScenario[] = [
  // English test scenarios
  {
    name: "Simple English dish",
    text: "Grilled chicken with rice and vegetables",
    language: "en",
    context: "menu_creation",
    expectedFields: {
      name: true,
      ingredients: true,
      cuisine_type: true,
      estimated_price: true
    },
    minConfidenceScore: 0.5
  },
  {
    name: "Complex English dish with dietary info",
    text: "Vegan quinoa salad with roasted vegetables, chickpeas, and tahini dressing - a healthy Mediterranean-inspired dish perfect for lunch",
    language: "en",
    context: "menu_creation",
    expectedFields: {
      name: true,
      ingredients: true,
      cuisine_type: true,
      dietary_tags: true,
      estimated_price: true
    },
    minConfidenceScore: 0.6
  },
  {
    name: "Italian pasta dish",
    text: "Spaghetti carbonara with bacon, eggs, parmesan cheese, and black pepper - traditional Italian pasta",
    language: "en",
    context: "menu_creation",
    expectedFields: {
      name: true,
      ingredients: true,
      cuisine_type: true,
      estimated_price: true
    },
    minConfidenceScore: 0.7
  },
  
  // German test scenarios
  {
    name: "German schnitzel",
    text: "Wiener Schnitzel mit Kartoffeln und Sauerkraut - ein klassisches deutsches Gericht",
    language: "de",
    context: "menu_creation",
    expectedFields: {
      name: true,
      ingredients: true,
      cuisine_type: true,
      estimated_price: true
    },
    minConfidenceScore: 0.6
  },
  {
    name: "German vegetarian dish",
    text: "Vegetarische Spätzle mit Pilzen und Zwiebeln in cremiger Sauce",
    language: "de",
    context: "menu_creation",
    expectedFields: {
      name: true,
      ingredients: true,
      dietary_tags: true,
      estimated_price: true
    },
    minConfidenceScore: 0.5
  },

  // Asian fusion dishes
  {
    name: "Asian fusion bowl",
    text: "Korean-style beef bulgogi bowl with jasmine rice, kimchi, pickled vegetables, and sesame oil",
    language: "en",
    context: "menu_creation",
    expectedFields: {
      name: true,
      ingredients: true,
      cuisine_type: true,
      estimated_price: true
    },
    minConfidenceScore: 0.6
  },

  // Ingredient listing context
  {
    name: "Ingredient list extraction",
    text: "We need tomatoes, onions, garlic, olive oil, basil, mozzarella cheese, and flour for the pizza",
    language: "en",
    context: "ingredient_listing",
    expectedFields: {
      ingredients: true
    },
    minConfidenceScore: 0.4
  },

  // Edge cases
  {
    name: "Short unclear input",
    text: "Something with chicken",
    language: "en",
    context: "menu_creation",
    expectedFields: {
      ingredients: true
    },
    minConfidenceScore: 0.2
  },
  {
    name: "Very long detailed description",
    text: "This is an elaborate fusion dish that combines traditional Japanese techniques with modern European flavors, featuring sustainably sourced salmon that has been cured for 24 hours in a mixture of sake, miso, and brown sugar, then lightly seared and served over a bed of forbidden black rice with pickled daikon radish, edamame beans, microgreens, and a delicate ponzu reduction sauce infused with yuzu and garnished with toasted sesame seeds and nori flakes",
    language: "en",
    context: "menu_creation",
    expectedFields: {
      name: true,
      ingredients: true,
      cuisine_type: true,
      estimated_price: true
    },
    minConfidenceScore: 0.7
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get query parameters
    const url = new URL(req.url);
    const scenarioName = url.searchParams.get('scenario');
    const runAll = url.searchParams.get('all') === 'true';

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

    let results: any[] = [];

    if (runAll) {
      // Run all test scenarios
      for (const scenario of TEST_SCENARIOS) {
        const result = await runTestScenario(scenario, supabaseClient);
        results.push(result);
      }
    } else if (scenarioName) {
      // Run specific scenario
      const scenario = TEST_SCENARIOS.find(s => s.name === scenarioName);
      if (!scenario) {
        return new Response(
          JSON.stringify({ error: `Scenario '${scenarioName}' not found` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const result = await runTestScenario(scenario, supabaseClient);
      results.push(result);
    } else {
      // Return list of available scenarios
      return new Response(
        JSON.stringify({
          available_scenarios: TEST_SCENARIOS.map(s => s.name),
          usage: {
            run_all: `${req.url}?all=true`,
            run_specific: `${req.url}?scenario=SCENARIO_NAME`
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate summary statistics
    const summary = calculateTestSummary(results);

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
    console.error('Error in speech-parsing test:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function runTestScenario(scenario: TestScenario, supabaseClient: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Call the speech-parsing function
    const { data, error } = await supabaseClient.functions.invoke('speech-parsing', {
      body: {
        text: scenario.text,
        language: scenario.language,
        context: scenario.context
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

    if (!data || !data.success || !data.parsed_dish) {
      return {
        scenario: scenario.name,
        status: 'failed',
        error: 'Invalid response from parsing service',
        processing_time_ms: processingTime
      };
    }

    const parsedDish = data.parsed_dish;
    
    // Validate the results against expected fields
    const validation = validateParsedResult(parsedDish, scenario);
    
    return {
      scenario: scenario.name,
      status: validation.passed ? 'passed' : 'failed',
      processing_time_ms: processingTime,
      confidence_score: parsedDish.confidence_score,
      validation_results: validation,
      parsed_data: {
        name: parsedDish.name,
        ingredients_count: parsedDish.ingredients?.length || 0,
        cuisine_type: parsedDish.cuisine_type,
        dietary_tags: parsedDish.dietary_tags,
        estimated_price: parsedDish.estimated_price
      },
      input_text: scenario.text
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

function validateParsedResult(parsedDish: any, scenario: TestScenario): any {
  const validationResults: any = {
    passed: true,
    details: {}
  };

  // Check confidence score
  if (parsedDish.confidence_score < scenario.minConfidenceScore) {
    validationResults.passed = false;
    validationResults.details.confidence_score = {
      expected_min: scenario.minConfidenceScore,
      actual: parsedDish.confidence_score,
      passed: false
    };
  } else {
    validationResults.details.confidence_score = {
      expected_min: scenario.minConfidenceScore,
      actual: parsedDish.confidence_score,
      passed: true
    };
  }

  // Check expected fields
  for (const [field, expected] of Object.entries(scenario.expectedFields)) {
    if (expected) {
      let fieldValue = parsedDish[field];
      let isValid = false;

      switch (field) {
        case 'name':
          isValid = fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0;
          break;
        case 'ingredients':
          isValid = Array.isArray(fieldValue) && fieldValue.length > 0;
          break;
        case 'cuisine_type':
          isValid = fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0;
          break;
        case 'dietary_tags':
          isValid = Array.isArray(fieldValue) && fieldValue.length > 0;
          break;
        case 'estimated_price':
          isValid = fieldValue && 
                   typeof fieldValue.regular === 'number' && fieldValue.regular > 0 &&
                   typeof fieldValue.student === 'number' && fieldValue.student > 0;
          break;
      }

      validationResults.details[field] = {
        expected: true,
        present: !!fieldValue,
        valid: isValid,
        passed: isValid,
        value: fieldValue
      };

      if (!isValid) {
        validationResults.passed = false;
      }
    }
  }

  return validationResults;
}

function calculateTestSummary(results: any[]): any {
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const errors = results.filter(r => r.status === 'error').length;

  const avgProcessingTime = results
    .filter(r => r.processing_time_ms)
    .reduce((sum, r) => sum + r.processing_time_ms, 0) / total;

  const avgConfidenceScore = results
    .filter(r => r.confidence_score)
    .reduce((sum, r) => sum + r.confidence_score, 0) / total;

  return {
    total_tests: total,
    passed: passed,
    failed: failed,
    errors: errors,
    success_rate: Math.round((passed / total) * 100),
    avg_processing_time_ms: Math.round(avgProcessingTime),
    avg_confidence_score: Math.round(avgConfidenceScore * 100) / 100,
    performance_rating: avgProcessingTime < 2000 ? 'excellent' : 
                       avgProcessingTime < 5000 ? 'good' : 'needs_improvement'
  };
}