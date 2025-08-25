interface IngredientData {
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  dietary_properties?: string[];
  allergens?: string[];
  category?: string;
  supplier_info?: string;
  notes?: string;
}

interface TranslatedIngredientData {
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  dietary_properties: string[];
  allergens: string[];
  category: string;
  supplier_info: string;
  notes: string;
  confidence: number;
}

export async function translateIngredient({
  ingredient,
  sourceLang,
  targetLang
}: {
  ingredient: IngredientData;
  sourceLang: 'en' | 'de';
  targetLang: 'en' | 'de';
}): Promise<TranslatedIngredientData> {
  try {
    console.log(`🔄 Translating ingredient: ${ingredient.name} (${sourceLang} → ${targetLang})`);
    
    // Import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call Supabase Edge Function for translation
    const { data, error } = await supabase.functions.invoke('deepseek-translate', {
      body: {
        ingredient,
        sourceLang,
        targetLang,
        mode: 'single'
      }
    });

    if (error) {
      console.error('Translation service error:', error);
      throw new Error(`Translation service error: ${error.message}`);
    }

    if (!data || !data.success) {
      if (data?.fallback && data?.translation) {
        console.warn('Using fallback translation due to service issues');
        return data.translation;
      }
      
      throw new Error('Translation failed without fallback');
    }

    console.log(`✅ Translation successful: ${ingredient.name} → ${data.translation.name} (${Math.round(data.translation.confidence * 100)}% confidence)`);
    
    return data.translation;

  } catch (error) {
    console.error('Ingredient translation error:', error);
    
    // Try local translation as fallback
    const { translateText } = await import('./translate');
    
    let fallbackTranslation: TranslatedIngredientData = {
      name: ingredient.name || '',
      name_de: ingredient.name_de || ingredient.name || '',
      name_en: ingredient.name_en || ingredient.name || '',
      description: ingredient.description || '',
      description_de: ingredient.description_de || ingredient.description || '',
      description_en: ingredient.description_en || ingredient.description || '',
      dietary_properties: ingredient.dietary_properties || [],
      allergens: ingredient.allergens || [],
      category: ingredient.category || '',
      supplier_info: ingredient.supplier_info || '',
      notes: ingredient.notes || '',
      confidence: 0.3 // Low confidence for fallback
    };
    
    try {
      // Try to translate at least the name using local dictionary
      if (sourceLang === 'de' && targetLang === 'en' && ingredient.name && !ingredient.name_en) {
        const translatedName = await translateText({ text: ingredient.name, sourceLang: 'de', targetLang: 'en' });
        fallbackTranslation.name_en = translatedName;
        fallbackTranslation.name = translatedName;
        if (translatedName !== ingredient.name) {
          fallbackTranslation.confidence = 0.6; // Higher confidence if we found a translation
        }
      } else if (sourceLang === 'en' && targetLang === 'de' && ingredient.name && !ingredient.name_de) {
        const translatedName = await translateText({ text: ingredient.name, sourceLang: 'en', targetLang: 'de' });
        fallbackTranslation.name_de = translatedName;
        fallbackTranslation.name = translatedName;
        if (translatedName !== ingredient.name) {
          fallbackTranslation.confidence = 0.6; // Higher confidence if we found a translation
        }
      }
    } catch (fallbackError) {
      console.error('Fallback translation also failed:', fallbackError);
    }
    
    return fallbackTranslation;
  }
}

// Batch translation for multiple ingredients
export async function translateIngredientBatch({
  ingredients,
  sourceLang,
  targetLang,
  onProgress
}: {
  ingredients: IngredientData[];
  sourceLang: 'en' | 'de';
  targetLang: 'en' | 'de';
  onProgress?: (completed: number, total: number) => void;
}): Promise<TranslatedIngredientData[]> {
  try {
    console.log(`📦 Batch translating ${ingredients.length} ingredients (${sourceLang} → ${targetLang})`);
    
    // Import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call Supabase Edge Function for batch translation
    const { data, error } = await supabase.functions.invoke('deepseek-translate', {
      body: {
        ingredients,
        sourceLang,
        targetLang,
        mode: 'batch'
      }
    });

    if (error) {
      console.error('Batch translation service error:', error);
      throw new Error(`Batch translation service error: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error('Batch translation failed');
    }

    console.log(`✅ Batch translation complete: ${data.summary.successful}/${data.summary.total} successful (${Math.round(data.summary.averageConfidence * 100)}% avg confidence)`);
    
    // Report progress
    onProgress?.(ingredients.length, ingredients.length);
    
    return data.results;

  } catch (error) {
    console.error('Batch translation error:', error);
    
    // Fallback to individual translations
    console.log('🔄 Falling back to individual translations...');
    const results: TranslatedIngredientData[] = [];
    
    for (let i = 0; i < ingredients.length; i++) {
      try {
        const translated = await translateIngredient({
          ingredient: ingredients[i],
          sourceLang,
          targetLang
        });
        results.push(translated);
        
        // Rate limiting for fallback
        if (i < ingredients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        onProgress?.(i + 1, ingredients.length);
      } catch (error) {
        console.error(`Failed to translate ingredient ${i}:`, error);
        
        // Add fallback result
        const ingredient = ingredients[i];
        results.push({
          name: ingredient.name || '',
          name_de: ingredient.name_de || ingredient.name || '',
          name_en: ingredient.name_en || ingredient.name || '',
          description: ingredient.description || '',
          description_de: ingredient.description_de || ingredient.description || '',
          description_en: ingredient.description_en || ingredient.description || '',
          dietary_properties: ingredient.dietary_properties || [],
          allergens: ingredient.allergens || [],
          category: ingredient.category || '',
          supplier_info: ingredient.supplier_info || '',
          notes: ingredient.notes || '',
          confidence: 0.1 // Very low confidence for failed translation
        });
        
        onProgress?.(i + 1, ingredients.length);
      }
    }
    
    return results;
  }
}

// Quick ingredient name translation (for voice input)
export async function translateIngredientName({
  name,
  sourceLang,
  targetLang
}: {
  name: string;
  sourceLang: 'en' | 'de';
  targetLang: 'en' | 'de';
}): Promise<{ translatedName: string; confidence: number }> {
  try {
    console.log(`🔤 Translating name: ${name} (${sourceLang} → ${targetLang})`);
    
    // Import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call Supabase Edge Function for name translation
    const { data, error } = await supabase.functions.invoke('deepseek-translate', {
      body: {
        name,
        sourceLang,
        targetLang,
        mode: 'name'
      }
    });

    if (error) {
      console.error('Name translation service error:', error);
      throw new Error(`Name translation service error: ${error.message}`);
    }

    if (!data || !data.success) {
      console.warn('Name translation failed, using original name');
      return {
        translatedName: name,
        confidence: 0.1
      };
    }

    console.log(`✅ Name translation successful: ${name} → ${data.translatedName} (${Math.round(data.confidence * 100)}% confidence)`);
    
    return {
      translatedName: data.translatedName,
      confidence: data.confidence
    };

  } catch (error) {
    console.error('Ingredient name translation error:', error);
    
    // Try local translation as fallback
    try {
      const { translateText } = await import('./translate');
      const fallbackTranslation = await translateText({ text: name, sourceLang, targetLang });
      
      if (fallbackTranslation && fallbackTranslation !== name) {
        console.log(`✅ Fallback translation successful: ${name} → ${fallbackTranslation}`);
        return {
          translatedName: fallbackTranslation,
          confidence: 0.6 // Medium confidence for local translation
        };
      }
    } catch (fallbackError) {
      console.error('Fallback translation also failed:', fallbackError);
    }
    
    return {
      translatedName: name, // Return original if translation fails
      confidence: 0.1
    };
  }
}