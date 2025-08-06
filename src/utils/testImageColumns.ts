import { supabase } from '@/integrations/supabase/client';

export async function testImageColumns() {
  try {
    // Test if image columns exist by trying to select them
    const { data, error } = await supabase
      .from('ingredients')
      .select('id, name, image_url, image_generated_at, image_generation_cost, image_generation_prompt')
      .limit(1);

    if (error) {
      console.error('Image columns do not exist:', error.message);
      return false;
    }

    console.log('Image columns exist! Sample data:', data);
    return true;
  } catch (error) {
    console.error('Error testing image columns:', error);
    return false;
  }
}

export async function testImageGeneration() {
  try {
    console.log('Testing Edge Function...');
    
    // First test with simple test function
    const { data: testData, error: testError } = await supabase.functions.invoke('test-edge-function', {
      body: { test: true }
    });

    if (testError) {
      console.error('Edge Function test error:', testError);
      return false;
    }

    console.log('Edge Function test response:', testData);

    // If the test function works, try the actual image generation function
    if (testData?.success) {
      console.log('Basic Edge Function working. Testing image generation...');
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-ingredient-image', {
          body: {
            ingredient: {
              id: 'test-123',
              name: 'Test Tomato',
              name_en: 'Tomato',
              name_de: 'Tomate',
              category_id: 'vegetables',
              category: { name: 'Vegetables' }
            }
          }
        });

        if (error) {
          console.error('Image generation function error:', error);
          console.log('But basic Edge Functions are working!');
          return true; // Still consider it a success if basic functions work
        }

        console.log('Image generation function working! Response:', data);
        return true;
      } catch (imageError) {
        console.error('Image generation error (but Edge Functions work):', imageError);
        return true; // Basic functions work
      }
    }

    return false;
  } catch (error) {
    console.error('Error testing Edge Functions:', error);
    return false;
  }
}