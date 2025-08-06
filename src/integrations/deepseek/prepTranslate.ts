interface PrepData {
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  instructions?: string;
  instructions_de?: string;
  instructions_en?: string;
  notes?: string;
  batch_yield?: string;
  batch_yield_amount?: number;
  batch_yield_unit?: string;
}

interface TranslatedPrepData {
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  instructions: string;
  instructions_de: string;
  instructions_en: string;
  notes: string;
  batch_yield: string;
  confidence: number;
}

export async function translatePrep({
  prep,
  sourceLang,
  targetLang
}: {
  prep: PrepData;
  sourceLang: 'en' | 'de';
  targetLang: 'en' | 'de';
}): Promise<TranslatedPrepData> {
  try {
    console.log(`🔄 Translating prep: ${prep.name} (${sourceLang} → ${targetLang})`);
    
    // Import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call Supabase Edge Function for translation
    const { data, error } = await supabase.functions.invoke('deepseek-translate', {
      body: {
        prep,
        sourceLang,
        targetLang,
        mode: 'prep'
      }
    });

    if (error) {
      console.error('Prep translation service error:', error);
      throw new Error(`Prep translation service error: ${error.message}`);
    }

    if (!data || !data.success) {
      if (data?.fallback && data?.translation) {
        console.warn('Using fallback prep translation due to service issues');
        return data.translation;
      }
      
      throw new Error('Prep translation failed without fallback');
    }

    console.log(`✅ Prep translation successful: ${prep.name} → ${data.translation.name} (${Math.round(data.translation.confidence * 100)}% confidence)`);
    
    return data.translation;

  } catch (error) {
    console.error('Prep translation error:', error);
    
    // Try local translation as fallback
    const { translateText } = await import('./translate');
    
    let fallbackTranslation: TranslatedPrepData = {
      name: prep.name || '',
      name_de: prep.name_de || prep.name || '',
      name_en: prep.name_en || prep.name || '',
      description: prep.description || '',
      description_de: prep.description_de || prep.description || '',
      description_en: prep.description_en || prep.description || '',
      instructions: prep.instructions || '',
      instructions_de: prep.instructions_de || prep.instructions || '',
      instructions_en: prep.instructions_en || prep.instructions || '',
      notes: prep.notes || '',
      batch_yield: prep.batch_yield || '',
      confidence: 0.3 // Low confidence for fallback
    };
    
    try {
      // Try to translate at least the name using local dictionary
      if (sourceLang === 'de' && targetLang === 'en' && prep.name && !prep.name_en) {
        const translatedName = await translateText({ text: prep.name, sourceLang: 'de', targetLang: 'en' });
        fallbackTranslation.name_en = translatedName;
        fallbackTranslation.name = translatedName;
        if (translatedName !== prep.name) {
          fallbackTranslation.confidence = 0.6; // Higher confidence if we found a translation
        }
      } else if (sourceLang === 'en' && targetLang === 'de' && prep.name && !prep.name_de) {
        const translatedName = await translateText({ text: prep.name, sourceLang: 'en', targetLang: 'de' });
        fallbackTranslation.name_de = translatedName;
        fallbackTranslation.name = translatedName;
        if (translatedName !== prep.name) {
          fallbackTranslation.confidence = 0.6; // Higher confidence if we found a translation
        }
      }

      // Try to translate description if available
      if (prep.description && sourceLang === 'en' && targetLang === 'de' && !prep.description_de) {
        const translatedDesc = await translateText({ text: prep.description, sourceLang: 'en', targetLang: 'de' });
        fallbackTranslation.description_de = translatedDesc;
      } else if (prep.description && sourceLang === 'de' && targetLang === 'en' && !prep.description_en) {
        const translatedDesc = await translateText({ text: prep.description, sourceLang: 'de', targetLang: 'en' });
        fallbackTranslation.description_en = translatedDesc;
      }
    } catch (fallbackError) {
      console.error('Fallback prep translation also failed:', fallbackError);
    }
    
    return fallbackTranslation;
  }
}

// Batch translation for multiple preps
export async function translatePrepBatch({
  preps,
  sourceLang,
  targetLang,
  onProgress
}: {
  preps: PrepData[];
  sourceLang: 'en' | 'de';
  targetLang: 'en' | 'de';
  onProgress?: (completed: number, total: number) => void;
}): Promise<TranslatedPrepData[]> {
  try {
    console.log(`📦 Batch translating ${preps.length} preps (${sourceLang} → ${targetLang})`);
    
    // Import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call Supabase Edge Function for batch translation
    const { data, error } = await supabase.functions.invoke('deepseek-translate', {
      body: {
        preps,
        sourceLang,
        targetLang,
        mode: 'prep_batch'
      }
    });

    if (error) {
      console.error('Batch prep translation service error:', error);
      throw new Error(`Batch prep translation service error: ${error.message}`);
    }

    if (!data || !data.success) {
      throw new Error('Batch prep translation failed');
    }

    console.log(`✅ Batch prep translation complete: ${data.summary.successful}/${data.summary.total} successful (${Math.round(data.summary.averageConfidence * 100)}% avg confidence)`);
    
    // Report progress
    onProgress?.(preps.length, preps.length);
    
    return data.results;

  } catch (error) {
    console.error('Batch prep translation error:', error);
    
    // Fallback to individual translations
    console.log('🔄 Falling back to individual prep translations...');
    const results: TranslatedPrepData[] = [];
    
    for (let i = 0; i < preps.length; i++) {
      try {
        const translated = await translatePrep({
          prep: preps[i],
          sourceLang,
          targetLang
        });
        results.push(translated);
        
        // Rate limiting for fallback
        if (i < preps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        onProgress?.(i + 1, preps.length);
      } catch (error) {
        console.error(`Failed to translate prep ${i}:`, error);
        
        // Add fallback result
        const prep = preps[i];
        results.push({
          name: prep.name || '',
          name_de: prep.name_de || prep.name || '',
          name_en: prep.name_en || prep.name || '',
          description: prep.description || '',
          description_de: prep.description_de || prep.description || '',
          description_en: prep.description_en || prep.description || '',
          instructions: prep.instructions || '',
          instructions_de: prep.instructions_de || prep.instructions || '',
          instructions_en: prep.instructions_en || prep.instructions || '',
          notes: prep.notes || '',
          batch_yield: prep.batch_yield || '',
          confidence: 0.1 // Very low confidence for failed translation
        });
        
        onProgress?.(i + 1, preps.length);
      }
    }
    
    return results;
  }
}

// Quick prep name translation (for voice input or quick creation)
export async function translatePrepName({
  name,
  sourceLang,
  targetLang
}: {
  name: string;
  sourceLang: 'en' | 'de';
  targetLang: 'en' | 'de';
}): Promise<{ translatedName: string; confidence: number }> {
  try {
    console.log(`🔤 Translating prep name: ${name} (${sourceLang} → ${targetLang})`);
    
    // Import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call Supabase Edge Function for name translation
    const { data, error } = await supabase.functions.invoke('deepseek-translate', {
      body: {
        name,
        sourceLang,
        targetLang,
        mode: 'prep_name'
      }
    });

    if (error) {
      console.error('Prep name translation service error:', error);
      throw new Error(`Prep name translation service error: ${error.message}`);
    }

    if (!data || !data.success) {
      console.warn('Prep name translation failed, using original name');
      return {
        translatedName: name,
        confidence: 0.1
      };
    }

    console.log(`✅ Prep name translation successful: ${name} → ${data.translatedName} (${Math.round(data.confidence * 100)}% confidence)`);
    
    return {
      translatedName: data.translatedName,
      confidence: data.confidence
    };

  } catch (error) {
    console.error('Prep name translation error:', error);
    
    // Try local translation as fallback
    try {
      const { translateText } = await import('./translate');
      const fallbackTranslation = await translateText({ text: name, sourceLang, targetLang });
      
      if (fallbackTranslation && fallbackTranslation !== name) {
        console.log(`✅ Fallback prep name translation successful: ${name} → ${fallbackTranslation}`);
        return {
          translatedName: fallbackTranslation,
          confidence: 0.6 // Medium confidence for local translation
        };
      }
    } catch (fallbackError) {
      console.error('Fallback prep name translation also failed:', fallbackError);
    }
    
    return {
      translatedName: name, // Return original if translation fails
      confidence: 0.1
    };
  }
}