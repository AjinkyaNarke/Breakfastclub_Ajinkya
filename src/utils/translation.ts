/**
 * Translation utilities using Supabase Edge Functions with DeepSeek API
 */

export interface TranslationRequest {
  text: string;
  fromLanguage: 'de' | 'en';
  toLanguage: 'de' | 'en';
  context?: 'menu' | 'description' | 'ingredient' | 'general';
}

export interface TranslationResponse {
  translatedText: string;
  confidence: number;
  detectedLanguage?: string;
}

/**
 * Translate text using Supabase Edge Function with DeepSeek API
 */
export async function translateText({
  text,
  fromLanguage,
  toLanguage,
  context = 'general'
}: TranslationRequest): Promise<TranslationResponse> {
  if (!text || text.trim().length === 0) {
    return { translatedText: '', confidence: 0 };
  }

  if (fromLanguage === toLanguage) {
    return { translatedText: text, confidence: 1.0 };
  }

  try {
    console.log(`🔄 Translating text via Supabase: "${text}" (${fromLanguage} → ${toLanguage}, context: ${context})`);
    
    // Import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Call Supabase Edge Function for translation
    const { data, error } = await supabase.functions.invoke('deepseek-translate', {
      body: {
        name: text,
        sourceLang: fromLanguage,
        targetLang: toLanguage,
        mode: 'name'
      }
    });

    if (error) {
      console.error('Translation service error:', error);
      throw new Error(`Translation service error: ${error.message}`);
    }

    if (data && data.success && data.translatedName) {
      console.log(`✅ AI translation successful: "${text}" → "${data.translatedName}" (${Math.round(data.confidence * 100)}% confidence)`);
      return {
        translatedText: data.translatedName,
        confidence: data.confidence,
        detectedLanguage: fromLanguage
      };
    }
    
    throw new Error('AI translation failed');

  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback to local dictionary translation
    console.log('🔄 Falling back to local translation...');
    const fallbackTranslation = await fallbackTranslate(text, fromLanguage, toLanguage);
    
    return {
      translatedText: fallbackTranslation || text,
      confidence: fallbackTranslation && fallbackTranslation !== text ? 0.6 : 0.2 // Higher confidence if we found a translation
    };
  }
}

/**
 * Calculate translation confidence based on various factors
 */
function calculateTranslationConfidence(
  originalText: string,
  translatedText: string,
  fromLang: string,
  toLang: string
): number {
  if (!translatedText || translatedText.length === 0) return 0;
  
  let confidence = 0.8; // Base confidence
  
  // Length similarity (translations should have reasonable length difference)
  const lengthRatio = translatedText.length / originalText.length;
  if (lengthRatio < 0.3 || lengthRatio > 3.0) {
    confidence -= 0.2;
  }
  
  // Check if translation is just the same as original (might indicate failure)
  if (originalText.toLowerCase() === translatedText.toLowerCase()) {
    confidence = 0.2;
  }
  
  // Check for common translation indicators
  if (toLang === 'de') {
    // German should have capitalized nouns
    const hasCapitalizedWords = /[A-ZÄÖÜ][a-zäöüß]+/.test(translatedText);
    if (hasCapitalizedWords) confidence += 0.1;
  }
  
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Fallback translation using simple word replacement
 */
async function fallbackTranslate(
  text: string,
  fromLanguage: 'de' | 'en',
  toLanguage: 'de' | 'en'
): Promise<string | null> {
  // Basic food term translations as fallback
  const basicTranslations: Record<string, Record<string, string>> = {
    'de-en': {
      'schnitzel': 'schnitzel',
      'spätzle': 'spaetzle',
      'bratwurst': 'bratwurst',
      'sauerkraut': 'sauerkraut',
      'kartoffel': 'potato',
      'fleisch': 'meat',
      'hähnchen': 'chicken',
      'gemüse': 'vegetables',
      'käse': 'cheese',
      'brot': 'bread',
      'mit': 'with',
      'und': 'and'
    },
    'en-de': {
      'chicken': 'Hähnchen',
      'meat': 'Fleisch',
      'vegetables': 'Gemüse',
      'potato': 'Kartoffel',
      'cheese': 'Käse',
      'bread': 'Brot',
      'with': 'mit',
      'and': 'und',
      'pancakes': 'Pfannkuchen',
      'eggs': 'Eier',
      'bacon': 'Speck'
    }
  };
  
  const translationKey = `${fromLanguage}-${toLanguage}`;
  const translations = basicTranslations[translationKey];
  
  if (!translations) return null;
  
  let result = text.toLowerCase();
  
  for (const [from, to] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    result = result.replace(regex, to);
  }
  
  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Batch translate multiple texts
 */
export async function batchTranslate(
  requests: TranslationRequest[]
): Promise<TranslationResponse[]> {
  const results: TranslationResponse[] = [];
  
  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchPromises = batch.map(request => translateText(request));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    } catch (error) {
      console.error(`Batch translation error for batch starting at index ${i}:`, error);
      // Add fallback results for failed batch
      const fallbackResults = batch.map(req => ({
        translatedText: req.text,
        confidence: 0.1
      }));
      results.push(...fallbackResults);
    }
    
    // Small delay between batches
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}