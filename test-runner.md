# Speech Parsing and Ingredient Auto-Creation Test Suite

## Overview
Comprehensive test suite for the Deepgram voice UI enhancement backend system, including speech parsing and ingredient auto-creation functionality.

## Available Test Functions

### 1. Speech Parsing Tests (`speech-parsing-test`)
Tests the speech-to-structured-data parsing pipeline with various scenarios.

**Base URL:** `https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/speech-parsing-test`

#### Test Scenarios:
- Simple English dish
- Complex English dish with dietary info
- Italian pasta dish
- German schnitzel
- German vegetarian dish
- Asian fusion bowl
- Ingredient list extraction
- Short unclear input
- Very long detailed description

#### Usage:
```bash
# List available scenarios
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/speech-parsing-test"

# Run all scenarios
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/speech-parsing-test?all=true"

# Run specific scenario
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/speech-parsing-test?scenario=Simple%20English%20dish"
```

### 2. Ingredient Auto-Creation Tests (`ingredient-auto-create-test`)
Tests the automatic ingredient creation system with categorization and validation.

**Base URL:** `https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/ingredient-auto-create-test`

#### Test Scenarios:
- Basic vegetables (English)
- Basic German ingredients
- Protein ingredients
- Spices and herbs
- Exotic ingredients requiring new categories
- Dairy ingredients
- Asian cuisine ingredients
- No auto-categorization test
- Large ingredient batch
- Duplicate ingredient detection

#### Usage:
```bash
# List available scenarios
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/ingredient-auto-create-test"

# Run all scenarios
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/ingredient-auto-create-test?all=true"

# Cleanup test data
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/ingredient-auto-create-test?cleanup=true"
```

### 3. Integration Tests (`integration-test`)
Tests the complete workflow from speech input to ingredient creation.

**Base URL:** `https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/integration-test`

#### Test Scenarios:
- Complete workflow - Simple dish
- German dish workflow
- Complex fusion dish
- Vegetarian dish with dietary tags
- Ingredient listing context
- Exotic ingredients test
- Breakfast dish workflow
- Seafood specialty

#### Usage:
```bash
# List available scenarios
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/integration-test"

# Run all integration tests
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/integration-test?all=true"

# Cleanup integration test data
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/integration-test?cleanup=true"
```

## Test Output Format

### Speech Parsing Test Results
```json
{
  "success": true,
  "summary": {
    "total_tests": 9,
    "passed": 8,
    "failed": 1,
    "errors": 0,
    "success_rate": 89,
    "avg_processing_time_ms": 1250,
    "avg_confidence_score": 0.72,
    "performance_rating": "excellent"
  },
  "results": [
    {
      "scenario": "Simple English dish",
      "status": "passed",
      "processing_time_ms": 1100,
      "confidence_score": 0.85,
      "validation_results": {
        "passed": true,
        "details": {
          "confidence_score": { "passed": true },
          "name": { "passed": true },
          "ingredients": { "passed": true }
        }
      }
    }
  ]
}
```

### Ingredient Auto-Creation Test Results
```json
{
  "success": true,
  "summary": {
    "total_tests": 10,
    "passed": 9,
    "failed": 1,
    "errors": 0,
    "success_rate": 90,
    "avg_processing_time_ms": 2100,
    "total_ingredients_processed": 75,
    "total_ingredients_created": 65,
    "total_categories_created": 3,
    "performance_rating": "excellent"
  }
}
```

### Integration Test Results
```json
{
  "success": true,
  "summary": {
    "test_summary": {
      "total_tests": 8,
      "passed": 7,
      "failed": 1,
      "errors": 0,
      "success_rate": 88
    },
    "performance_metrics": {
      "avg_total_time_ms": 3200,
      "avg_parse_time_ms": 1100,
      "avg_ingredient_time_ms": 2100,
      "performance_rating": "excellent"
    },
    "workflow_metrics": {
      "dishes_processed": 8,
      "ingredients_processed": 45,
      "ingredients_created": 38,
      "creation_efficiency": 84
    }
  }
}
```

## Performance Benchmarks

### Expected Performance Targets:
- **Speech Parsing**: < 2000ms per request
- **Ingredient Creation**: < 3000ms per request
- **Integration Workflow**: < 5000ms per complete workflow
- **Success Rate**: > 80% for all test scenarios
- **Confidence Score**: > 0.6 average for speech parsing

### Quality Metrics:
- **Parsing Accuracy**: Dish name, ingredients, and cuisine type should be extracted correctly
- **Categorization Rate**: > 70% of ingredients should be automatically categorized
- **Failure Rate**: < 20% of ingredients should fail to be created
- **Duplicate Detection**: Should prevent creation of duplicate ingredients

## Running Tests in Development

To run tests during development, you'll need to:

1. **Set up authentication** with your Supabase user token
2. **Ensure DeepSeek API key** is configured in environment variables
3. **Have rate limiting enabled** but with generous limits for testing

Example test run script:
```bash
#!/bin/bash
export SUPABASE_ANON_KEY="your_anon_key_here"

echo "Running Speech Parsing Tests..."
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/speech-parsing-test?all=true" \
  | jq '.summary'

echo "Running Ingredient Auto-Creation Tests..."
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/ingredient-auto-create-test?all=true" \
  | jq '.summary'

echo "Running Integration Tests..."
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/integration-test?all=true" \
  | jq '.summary'

echo "Cleaning up test data..."
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "https://ckvwevclnhtcnsdmashv.supabase.co/functions/v1/ingredient-auto-create-test?cleanup=true"
```

## Monitoring and Analytics

The test functions automatically log their operations to the same analytics tables used by the production functions:
- `speech_parsing_logs` - For speech parsing operations
- `ingredient_creation_logs` - For ingredient creation operations

This allows you to monitor test performance and compare it with production usage patterns.