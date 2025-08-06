// Local translation dictionary for common ingredient terms
const LOCAL_TRANSLATIONS = {
  'de_to_en': {
    'kartoffel': 'potato',
    'zwiebel': 'onion',
    'knoblauch': 'garlic',
    'tomate': 'tomato',
    'tomaten': 'tomatoes',
    'karotte': 'carrot',
    'karotten': 'carrots',
    'spinat': 'spinach',
    'salat': 'lettuce',
    'gurke': 'cucumber',
    'gurken': 'cucumbers',
    'paprika': 'bell pepper',
    'zucchini': 'zucchini',
    'aubergine': 'eggplant',
    'brokkoli': 'broccoli',
    'blumenkohl': 'cauliflower',
    'avocado': 'avocado',
    'milch': 'milk',
    'butter': 'butter',
    'käse': 'cheese',
    'joghurt': 'yogurt',
    'sahne': 'cream',
    'hähnchen': 'chicken',
    'rind': 'beef',
    'schwein': 'pork',
    'lachs': 'salmon',
    'thunfisch': 'tuna',
    'reis': 'rice',
    'nudeln': 'pasta',
    'brot': 'bread',
    'mehl': 'flour',
    'olivenöl': 'olive oil',
    'salz': 'salt',
    'pfeffer': 'pepper',
    'basilikum': 'basil',
    'petersilie': 'parsley'
  },
  'en_to_de': {
    'potato': 'kartoffel',
    'onion': 'zwiebel',
    'garlic': 'knoblauch',
    'tomato': 'tomate',
    'tomatoes': 'tomaten',
    'carrot': 'karotte',
    'carrots': 'karotten',
    'spinach': 'spinat',
    'lettuce': 'salat',
    'cucumber': 'gurke',
    'cucumbers': 'gurken',
    'bell pepper': 'paprika',
    'zucchini': 'zucchini',
    'eggplant': 'aubergine',
    'broccoli': 'brokkoli',
    'cauliflower': 'blumenkohl',
    'avocado': 'avocado',
    'milk': 'milch',
    'butter': 'butter',
    'cheese': 'käse',
    'yogurt': 'joghurt',
    'cream': 'sahne',
    'chicken': 'hähnchen',
    'beef': 'rind',
    'pork': 'schwein',
    'salmon': 'lachs',
    'tuna': 'thunfisch',
    'rice': 'reis',
    'pasta': 'nudeln',
    'bread': 'brot',
    'flour': 'mehl',
    'olive oil': 'olivenöl',
    'salt': 'salz',
    'pepper': 'pfeffer',
    'basil': 'basilikum',
    'parsley': 'petersilie'
  }
};

function getLocalTranslation(text: string, sourceLang: string, targetLang: string): string | null {
  if (!text || !sourceLang || !targetLang) return null;
  
  const key = `${sourceLang}_to_${targetLang}`;
  const dictionary = LOCAL_TRANSLATIONS[key as keyof typeof LOCAL_TRANSLATIONS];
  
  if (!dictionary) return null;
  
  const lowerText = text.toLowerCase().trim();
  return dictionary[lowerText as keyof typeof dictionary] || null;
}

export async function translateText({ text, sourceLang, targetLang }: { text: string; sourceLang: string; targetLang: string; }): Promise<string> {
  try {
    // Validate inputs
    if (!text || text.trim().length === 0) {
      console.warn('Empty text provided for translation');
      return text || '';
    }
    
    if (!sourceLang || !targetLang) {
      console.warn('Missing language parameters:', { sourceLang, targetLang });
      return text;
    }
    
    if (sourceLang === targetLang) {
      return text;
    }
    
    console.log(`🔄 Translating text: "${text}" (${sourceLang} → ${targetLang})`);
    
    // Try local translation first for common terms
    const localTranslation = getLocalTranslation(text, sourceLang, targetLang);
    if (localTranslation) {
      console.log(`✅ Local translation: "${text}" → "${localTranslation}"`);
      return localTranslation;
    }
    
    // Only proceed with AI translation for supported languages
    if (!['en', 'de'].includes(sourceLang) || !['en', 'de'].includes(targetLang)) {
      console.warn(`Unsupported language pair: ${sourceLang} → ${targetLang}`);
      return text;
    }
    
    try {
      // Import Supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Call Supabase Edge Function for text translation
      const { data, error } = await supabase.functions.invoke('deepseek-translate', {
        body: {
          name: text,
          sourceLang: sourceLang as 'en' | 'de',
          targetLang: targetLang as 'en' | 'de',
          mode: 'name'
        }
      });

      if (error) {
        console.error('Text translation service error:', error);
        throw new Error(`Translation service error: ${error.message}`);
      }

      if (data && data.success && data.translatedName) {
        console.log(`✅ AI translation successful: "${text}" → "${data.translatedName}" (${Math.round(data.confidence * 100)}% confidence)`);
        return data.translatedName;
      }
      
      throw new Error('AI translation failed');
      
    } catch (aiError) {
      console.warn('AI translation failed, using original text:', aiError);
      return text;
    }

  } catch (error) {
    console.error('Text translation error:', error);
    // Always return the original text as final fallback
    return text || '';
  }
} 