import axios from 'axios';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface RecipeData {
  name?: string;
  description?: string;
  ingredients?: string[];
  dietary_tags?: string[];
  category?: string;
}

interface TranslatedRecipeData {
  name_en?: string;
  name_de?: string;
  description_en?: string;
  description_de?: string;
  ingredients_en?: string[];
  ingredients_de?: string[];
  dietary_tags_en?: string[];
  dietary_tags_de?: string[];
}

export async function translateRecipe({ 
  recipe, 
  sourceLang, 
  targetLang 
}: { 
  recipe: RecipeData; 
  sourceLang: 'en' | 'de'; 
  targetLang: 'en' | 'de'; 
}): Promise<TranslatedRecipeData> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is not set.');
  }

  if (sourceLang === targetLang) {
    throw new Error('Source and target languages cannot be the same.');
  }

  const sourceLanguage = sourceLang === 'de' ? 'German' : 'English';
  const targetLanguage = targetLang === 'de' ? 'German' : 'English';
  
  const prompt = `You are a professional culinary translator. Translate the following recipe data from ${sourceLanguage} to ${targetLanguage}. 

Recipe data to translate:
${JSON.stringify(recipe, null, 2)}

Please return a JSON object with the translated fields. Keep the structure exactly the same but translate all text content. For ingredients, translate each item in the array. For dietary tags, use standard culinary terms in the target language.

Important guidelines:
- Maintain cooking terminology accuracy
- Keep portion sizes and measurements consistent
- Use appropriate culinary terms for the target language
- Return only valid JSON without any additional text or explanation
- If a field is empty or null, keep it as null in the response

Expected JSON structure:
{
  "name": "translated name",
  "description": "translated description", 
  "ingredients": ["translated ingredient 1", "translated ingredient 2"],
  "dietary_tags": ["translated tag 1", "translated tag 2"],
  "category": "translated category"
}`;

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional culinary translator. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const translatedContent = response.data.choices[0].message.content.trim();
      
      try {
        const translatedRecipe = JSON.parse(translatedContent);
        
        // Create the properly structured response
        const result: TranslatedRecipeData = {};
        
        if (targetLang === 'en') {
          result.name_en = translatedRecipe.name;
          result.description_en = translatedRecipe.description;
          result.ingredients_en = translatedRecipe.ingredients;
          result.dietary_tags_en = translatedRecipe.dietary_tags;
        } else {
          result.name_de = translatedRecipe.name;
          result.description_de = translatedRecipe.description;
          result.ingredients_de = translatedRecipe.ingredients;
          result.dietary_tags_de = translatedRecipe.dietary_tags;
        }
        
        return result;
      } catch (parseError) {
        throw new Error('Invalid JSON response from translation service.');
      }
    }
    
    throw new Error('No valid response from translation service.');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Translation API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

export async function translateBatchRecipes({ 
  recipes, 
  sourceLang, 
  targetLang 
}: { 
  recipes: RecipeData[]; 
  sourceLang: 'en' | 'de'; 
  targetLang: 'en' | 'de'; 
}): Promise<TranslatedRecipeData[]> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is not set.');
  }

  if (recipes.length === 0) {
    return [];
  }

  if (recipes.length === 1) {
    return [await translateRecipe({ recipe: recipes[0], sourceLang, targetLang })];
  }

  // For batch translation, process in smaller chunks to avoid API limits
  const BATCH_SIZE = 5;
  const results: TranslatedRecipeData[] = [];
  
  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(recipe => 
      translateRecipe({ recipe, sourceLang, targetLang })
    );
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    } catch (error) {
      // If batch fails, try individual translations
      for (const recipe of batch) {
        try {
          const result = await translateRecipe({ recipe, sourceLang, targetLang });
          results.push(result);
        } catch (individualError) {
          // Add empty result for failed translations
          results.push({});
        }
      }
    }
    
    // Add delay between batches to respect API rate limits
    if (i + BATCH_SIZE < recipes.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}