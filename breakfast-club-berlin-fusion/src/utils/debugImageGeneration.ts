import { supabase } from '@/integrations/supabase/client';

export async function debugImageGeneration() {
  try {
    console.log('🔍 Debugging image generation...');
    
    // Test with a simple ingredient
    const testIngredient = {
      id: 'test-123',
      name: 'Test Tomato',
      name_de: 'Tomate',
      name_en: 'Tomato',
      category_id: 'vegetables',
      category: { name: 'Vegetables' }
    };

    console.log('📤 Sending request with ingredient:', testIngredient);

    // Make the request and capture the full response
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-ingredient-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabase.supabaseKey,
      },
      body: JSON.stringify({
        ingredient: testIngredient
      })
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', [...response.headers.entries()]);

    const responseText = await response.text();
    console.log('📥 Raw response text:', responseText);

    if (responseText) {
      try {
        const responseJson = JSON.parse(responseText);
        console.log('📄 Parsed response:', responseJson);
        
        if (responseJson.error) {
          console.error('❌ Error from Edge Function:', responseJson.error);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
      }
    }

    return {
      status: response.status,
      statusText: response.statusText,
      responseText,
    };

  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return { error: error.message };
  }
}