import { supabase } from '@/integrations/supabase/client';
import { Database } from '../types/database.types';

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  cost?: number;
  prompt?: string;
  error?: string;
}

type IngredientRow = Database['public']['Tables']['ingredients']['Row'];
export interface IngredientForGeneration extends IngredientRow {
  category?: {
    name: string;
  };
}

export class ImageGenerationService {
  private static readonly RECRAFT_API_URL = 'https://api.recraft.ai/v1/generation';
  private static readonly IMAGE_SIZE = '256x256';
  private static readonly MAX_IMAGES = 500;

  /**
   * Generate smart prompt based on ingredient characteristics
   */
  private static generateSmartPrompt(ingredient: IngredientForGeneration): string {
    const name = ingredient.name_de || ingredient.name_en || ingredient.name;
    const categoryName = ingredient.category?.name?.toLowerCase() || '';
    
    // Detect if it's a raw ingredient vs prepared dish
    const isRawIngredient = this.isRawIngredient(categoryName, name);
    const isSpiceOrHerb = this.isSpiceOrHerb(categoryName, name);
    const isPreparedDish = this.isPreparedDish(categoryName, name);
    
    let prompt = '';
    
    if (isSpiceOrHerb) {
      prompt = `${name}, ingredient photography, clear detail, professional lighting, white background, high quality, 256x256`;
    } else if (isRawIngredient) {
      prompt = `${name}, product photography, white background, professional, clean, high quality, 256x256`;
    } else if (isPreparedDish) {
      prompt = `${name}, restaurant quality food photography, appetizing presentation, professional lighting, high quality, 256x256`;
    } else {
      // Default fallback
      prompt = `${name}, food ingredient, professional photography, white background, high quality, 256x256`;
    }
    
    return prompt;
  }

  /**
   * Detect if ingredient is a raw ingredient
   */
  private static isRawIngredient(categoryName: string, ingredientName: string): boolean {
    const rawCategories = ['proteins', 'vegetables', 'fruits', 'dairy', 'grains', 'oils'];
    const rawKeywords = ['raw', 'fresh', 'uncooked', 'whole', 'natural'];
    
    return rawCategories.some(cat => categoryName.includes(cat)) ||
           rawKeywords.some(keyword => ingredientName.toLowerCase().includes(keyword));
  }

  /**
   * Detect if ingredient is a spice or herb
   */
  private static isSpiceOrHerb(categoryName: string, ingredientName: string): boolean {
    const spiceCategories = ['spices', 'herbs', 'seasonings'];
    const spiceKeywords = ['spice', 'herb', 'seasoning', 'powder', 'dried'];
    
    return spiceCategories.some(cat => categoryName.includes(cat)) ||
           spiceKeywords.some(keyword => ingredientName.toLowerCase().includes(keyword));
  }

  /**
   * Detect if ingredient is a prepared dish
   */
  private static isPreparedDish(categoryName: string, ingredientName: string): boolean {
    const preparedCategories = ['prepared', 'cooked', 'dishes', 'meals'];
    const preparedKeywords = ['cooked', 'prepared', 'dish', 'meal', 'recipe'];
    
    return preparedCategories.some(cat => categoryName.includes(cat)) ||
           preparedKeywords.some(keyword => ingredientName.toLowerCase().includes(keyword));
  }

  /**
   * Check if we have enough AI credits using ai_usage_tracking table
   */
  private static async checkCredits(): Promise<{ hasCredits: boolean; currentCredits: number; budgetLimit: number }> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const { data: usage } = await supabase
        .from('ai_usage_tracking')
        .select('total_cost, budget_limit')
        .eq('month_year', currentMonth)
        .single();
      
      const totalCost = usage?.total_cost || 0;
      const budgetLimit = usage?.budget_limit || 10.00;
      const remainingCredits = budgetLimit - totalCost;
      const hasCredits = remainingCredits > 0.01; // Minimum cost per image
      
      return { hasCredits, currentCredits: remainingCredits, budgetLimit };
    } catch (error) {
      console.error('Error checking credits:', error);
      return { hasCredits: false, currentCredits: 0, budgetLimit: 10.00 };
    }
  }

  /**
   * Update AI usage tracking
   */
  private static async updateUsageTracking(cost: number): Promise<boolean> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Try to update existing record
      const { data: existingUsage } = await supabase
        .from('ai_usage_tracking')
        .select('total_cost, images_generated')
        .eq('month_year', currentMonth)
        .single();
      
      if (existingUsage) {
        const { error: updateError } = await supabase
          .from('ai_usage_tracking')
          .update({ 
            total_cost: (existingUsage.total_cost || 0) + cost,
            images_generated: (existingUsage.images_generated || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('month_year', currentMonth);
        
        if (updateError) throw updateError;
      } else {
        // If no record exists, create one
        const { error: insertError } = await supabase
          .from('ai_usage_tracking')
          .insert({
            month_year: currentMonth,
            total_cost: cost,
            images_generated: 1,
            budget_limit: 10.00
          });
        
        if (insertError) throw insertError;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating usage tracking:', error);
      return false;
    }
  }

  /**
   * Generate image using Supabase Edge Function
   */
  private static async generateImageWithRecraft(ingredient: IngredientForGeneration): Promise<{ success: boolean; imageUrl?: string; cost?: number; error?: string }> {
    try {
      console.log('Calling Edge Function for ingredient:', ingredient.name);
      console.log('Ingredient data being sent:', ingredient);
      
      const response = await supabase.functions.invoke('generate-ingredient-image', {
        body: {
          ingredient: ingredient,
        },
      });

      console.log('Raw Edge Function response:', response);

      if (response.error) {
        console.error('Edge Function invocation error:', response.error);
        console.error('Full response object:', response);
        
        // Try to get more details from the error
        if (response.error.context) {
          console.error('Error context:', response.error.context);
        
        // Try to read the actual response body to see the exact error
        if (response.error.context && response.error.context.text) {
          response.error.context.text().then((errorText: string) => {
            console.error('📄 Edge Function error body:', errorText);
            try {
              const errorJson = JSON.parse(errorText);
              console.error('🔍 Parsed error:', errorJson);
            } catch (e) {
              console.error('Error parsing error response');
            }
          });
        }
        }
        
        // Check if it's specifically the RECRAFT_API_KEY error
        const errorMsg = response.error.message || 'Unknown error';
        if (errorMsg.includes('RECRAFT_API_KEY')) {
          console.error('🔑 SOLUTION: Set RECRAFT_API_KEY in Supabase Dashboard > Settings > Edge Functions > Environment Variables');
        }
        
        return { 
          success: false, 
          error: `Edge function error: ${errorMsg}` 
        };
      }

      const data = response.data;
      console.log('Edge Function data:', data);

      if (!data || !data.success) {
        const errorMessage = data?.error || 'Failed to generate image';
        console.error('Edge Function returned error:', errorMessage);
        return { 
          success: false, 
          error: errorMessage 
        };
      }

      return { 
        success: true, 
        imageUrl: data.imageUrl, 
        cost: data.cost || 0.01
      };
    } catch (error) {
      console.error('Error generating image with Edge Function:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Upload image to Supabase storage
   */
  private static async uploadToStorage(imageUrl: string, ingredientId: string): Promise<string> {
    try {
      // Download the image from Recraft
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Upload to Supabase storage
      const fileName = `ingredients/${ingredientId}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('restaurant-images')
        .upload(fileName, imageBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image to storage:', error);
      throw error;
    }
  }

  /**
   * Main method to generate image for an ingredient
   */
  static async generateImageForIngredient(ingredient: IngredientForGeneration): Promise<ImageGenerationResult> {
    try {
      // Check credits
      const { hasCredits, currentCredits } = await this.checkCredits();
      if (!hasCredits) {
        return { 
          success: false, 
          error: 'Insufficient AI credits. Please add credits in settings.' 
        };
      }

      // Generate smart prompt
      const prompt = this.generateSmartPrompt(ingredient);

      // Generate image with Recraft
      const generationResult = await this.generateImageWithRecraft(ingredient);
      if (!generationResult.success) {
        return { success: false, error: generationResult.error };
      }

      // Update usage tracking
      const usageUpdated = await this.updateUsageTracking(generationResult.cost || 0.01);
      if (!usageUpdated) {
        return { success: false, error: 'Failed to update usage tracking' };
      }

      // Upload to storage
      const storageUrl = await this.uploadToStorage(generationResult.imageUrl!, ingredient.id);

      // Update ingredient with image information
      console.log('💾 Updating ingredient in database:', ingredient.id);
      console.log('💾 Update data:', {
        image_url: storageUrl,
        image_generated_at: new Date().toISOString(),
        image_generation_cost: generationResult.cost,
        image_generation_prompt: prompt,
      });
      
      try {
        const { data, error: updateError } = await supabase
          .from('ingredients')
          .update({
            image_url: storageUrl,
            image_generated_at: new Date().toISOString(),
            image_generation_cost: generationResult.cost,
            image_generation_prompt: prompt,
          })
          .eq('id', ingredient.id)
          .select();

        if (updateError) {
          console.error('❌ Failed to update ingredient with image info:', updateError);
          // Continue anyway - the image was generated successfully
        } else {
          console.log('✅ Successfully updated ingredient in database:', data);
        }
      } catch (updateError) {
        console.error('❌ Error updating ingredient with image info:', updateError);
        // Continue anyway - maybe the columns don't exist yet
      }

      return {
        success: true,
        imageUrl: storageUrl,
        cost: generationResult.cost,
        prompt: prompt,
      };
    } catch (error) {
      console.error('Error in generateImageForIngredient:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Batch generate images for multiple ingredients
   */
  static async batchGenerateImages(ingredients: IngredientForGeneration[]): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ ingredientId: string; success: boolean; error?: string; imageUrl?: string }>;
  }> {
    const results: Array<{ ingredientId: string; success: boolean; error?: string; imageUrl?: string }> = [];
    let successful = 0;
    let failed = 0;

    for (const ingredient of ingredients) {
      try {
        const result = await this.generateImageForIngredient(ingredient);
        results.push({
          ingredientId: ingredient.id,
          success: result.success,
          error: result.error,
          imageUrl: result.imageUrl,
        });

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          ingredientId: ingredient.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return {
      total: ingredients.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Get ingredients without images
   */
  static async getIngredientsWithoutImages(): Promise<IngredientForGeneration[]> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          id,
          name,
          name_de,
          name_en,
          category_id,
          image_url,
          category:ingredient_categories(name)
        `)
        .is('image_url', null)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ingredients without images:', error);
      // Fallback: get all ingredients if image_url column doesn't exist
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('ingredients')
          .select(`
            id,
            name,
            name_de,
            name_en,
            category_id,
            category:ingredient_categories(name)
          `)
          .order('name');

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Get total image count (placeholder for now)
   */
  static async getTotalImageCount(): Promise<number> {
    // Placeholder - will be implemented when image columns are added
    return 0;
  }
} 