import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedDish {
  name?: string;
  description?: string;
  ingredients: string[];
  cuisine_type?: string;
  cooking_method?: string;
  dietary_tags: string[];
  estimated_price?: {
    regular: number;
    student: number;
  };
  confidence_score: number;
  raw_text: string;
}

interface SpeechParsingRequest {
  text: string;
  language?: 'en' | 'de';
  context?: 'menu_creation' | 'ingredient_listing' | 'dish_description';
}

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { text, language = 'en', context = 'menu_creation' }: SpeechParsingRequest = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required for parsing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limits
    const rateLimitCheck = await supabaseClient.rpc('check_deepgram_rate_limit', {
      user_id: user.id,
      endpoint: 'speech_parsing',
      max_requests: 50,
      window_minutes: 60
    });

    if (rateLimitCheck === false) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the speech text using DeepSeek
    const parsedDish = await parseTextToStructuredData(text, language, context);

    // Log the parsing operation
    await supabaseClient
      .from('speech_parsing_logs')
      .insert({
        user_id: user.id,
        input_text: text,
        language,
        context,
        parsed_data: parsedDish,
        confidence_score: parsedDish.confidence_score,
        timestamp: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        parsed_dish: parsedDish,
        processing_time: Date.now()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in speech-parsing function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function parseTextToStructuredData(
  text: string, 
  language: string, 
  context: string
): Promise<ParsedDish> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  const systemPrompt = createSystemPrompt(language, context);
  const userPrompt = createUserPrompt(text, language);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from DeepSeek API');
    }

    const content = data.choices[0].message.content.trim();
    
    try {
      const parsed = JSON.parse(content);
      
      // Validate and normalize the parsed data
      const normalizedDish: ParsedDish = {
        name: parsed.name || extractDishName(text),
        description: parsed.description || '',
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        cuisine_type: parsed.cuisine_type || detectCuisineType(text),
        cooking_method: parsed.cooking_method || '',
        dietary_tags: Array.isArray(parsed.dietary_tags) ? parsed.dietary_tags : [],
        estimated_price: {
          regular: parsed.estimated_price?.regular || estimatePrice(text, 'regular'),
          student: parsed.estimated_price?.student || estimatePrice(text, 'student')
        },
        confidence_score: Math.min(Math.max(parsed.confidence_score || 0.7, 0), 1),
        raw_text: text
      };

      return normalizedDish;
      
    } catch (parseError) {
      console.error('Error parsing DeepSeek response:', parseError);
      
      // Fallback to basic parsing
      return {
        name: extractDishName(text),
        description: text,
        ingredients: extractBasicIngredients(text),
        cuisine_type: detectCuisineType(text),
        cooking_method: '',
        dietary_tags: extractDietaryTags(text),
        estimated_price: {
          regular: estimatePrice(text, 'regular'),
          student: estimatePrice(text, 'student')
        },
        confidence_score: 0.3,
        raw_text: text
      };
    }

  } catch (error) {
    console.error('DeepSeek API call failed:', error);
    
    // Fallback to basic parsing
    return {
      name: extractDishName(text),
      description: text,
      ingredients: extractBasicIngredients(text),
      cuisine_type: detectCuisineType(text),
      cooking_method: '',
      dietary_tags: extractDietaryTags(text),
      estimated_price: {
        regular: estimatePrice(text, 'regular'),
        student: estimatePrice(text, 'student')
      },
      confidence_score: 0.2,
      raw_text: text
    };
  }
}

function createSystemPrompt(language: string, context: string): string {
  const basePrompt = language === 'de' 
    ? `Du bist ein Experte für Kulinarik und Sprachverarbeitung, spezialisiert auf die präzise Analyse von Sprach- und Textbeschreibungen von Gerichten und Zutaten. Du verstehst sowohl deutsche als auch englische kulinarische Begriffe perfekt. Du ignorierst Füllwörter wie "äh", "um", "ahh", "hmm" und ähnliche Störgeräusche aus Spracherkennungsfehlern.`
    : `You are an expert in culinary arts and language processing, specialized in precise analysis of speech and text descriptions of dishes and ingredients. You understand both German and English culinary terms perfectly. You ignore filler words like "uh", "um", "ahh", "hmm" and similar noise from speech recognition errors.`;

  const contextSpecific = context === 'menu_creation'
    ? language === 'de'
      ? ` Du hilfst dabei, Sprachbeschreibungen in strukturierte Menüdaten mit detaillierten Zutatenlisten und Preisen umzuwandeln.`
      : ` You help convert speech descriptions into structured menu data with detailed ingredient lists and prices.`
    : language === 'de'
      ? ` Du hilfst bei der präzisen Extraktion und Kategorisierung von Zutaten mit Mengen, Einheiten und Preisen aus gesprochenen Beschreibungen.`
      : ` You help with precise extraction and categorization of ingredients with quantities, units, and prices from spoken descriptions.`;

  const instructions = language === 'de'
    ? `
Analysiere den gegebenen Text SEHR SORGFÄLTIG und extrahiere folgende Informationen:

1. **Gerichtname**: Erkenne den Hauptgerichtsnamen oder die Zutat
2. **Beschreibung**: Kurze, präzise Beschreibung
3. **Zutaten**: Array mit folgenden Details pro Zutat:
   - name: Zutatname (z.B. "Tomaten", "Gurke", "rote Zwiebel", "Basilikum")
   - quantity: Menge als Zahl (z.B. "ein" = 1, "eine" = 1, "fünf" = 5)
   - unit: Einheit (z.B. "Stück", "Bund", "kg", "g", "Liter")
   - price_per_unit: Preis pro Einheit in Euro als Zahl

4. **Küchenart**: z.B. fresh, salad, german, italian, fusion
5. **Kochmethode**: z.B. fresh, raw, grilled, fried, steamed, baked
6. **Diät-Tags**: [vegetarian, vegan, gluten-free, dairy-free, organic, local]
7. **Geschätzte Preise**: 
   - regular: Geschätzter Verkaufspreis
   - student: ca. 80% vom regular price
8. **Vertrauenswert**: 0-1

**WICHTIGE PARSING-REGELN FÜR DEUTSCHE EINGABEN:**
- IGNORIERE Füllwörter: "äh", "ähm", "um", "ahh", "hmm", "na", "also", "like", "so", "basically"
- Ignoriere Stottern und Wiederholungen: "le-le-lemon" → "lemon"
- INTELLIGENTE INGREDIENZERKENNUNG: Verwende Fuzzy-Matching für ähnlich klingende Zutaten
  * "lemmon" → "lemon", "tomatoe" → "tomato", "chiken" → "chicken"
  * "ryce" → "rice", "onyon" → "onion", "avacado" → "avocado"
- "ein" oder "eine" = Menge 1
- "cent" in "5 cent" = €0.05 (fünf Cent = 0.05 Euro)
- "ein euro" = €1.00
- "euro" ohne Zahl = €1.00  
- "€50.00" = 50.00
- "2.00 per" = €2.00
- "bunt" bedeutet "mixed/colorful" (z.B. "bunt basilikum" = gemischtes/buntes Basilikum)
- Zahlen in Worten: "fünf" = 5, "zwei" = 2, "drei" = 3, "vier" = 4
- "Bund" ist eine übliche Einheit für Kräuter wie Basilikum
- Bei unklaren Mengen verwende sinnvolle Standardwerte (z.B. 1 Bund Basilikum)
- Erkenne zusammengesetzte Preise: "cent und ein euro" = beide Preise addieren
- BEISPIELE MIT FÜLLWÖRTERN:
  * "äh umm lemon and ahh rice" → Lemon + Rice
  * "so like basically we have lemmon and ryce" → Lemon + Rice
  * "cent und ein bunt basilikum ein euro 5" → Basilikum: 1 Bund, €1.05
  * "Eine gurke ein euro" → Gurke: 1 Stück, €1.00
  * "tomaten . Eine gurke ein euro" → Tomaten + Gurke: 1 Stück, €1.00

Gib das Ergebnis als GÜLTIGES JSON zurück:`
    : `
Analyze the given text VERY CAREFULLY and extract the following information:

1. **Dish name**: Main dish name or ingredient name
2. **Description**: Brief, precise description  
3. **Ingredients**: Array with these details per ingredient:
   - name: ingredient name (e.g. "tomatoes", "cucumber", "red onion", "basil")
   - quantity: amount as number (e.g. "one" = 1, "five" = 5)
   - unit: unit type (e.g. "piece", "bunch", "kg", "g", "liter")
   - price_per_unit: price per unit in euros as number

4. **Cuisine type**: e.g. fresh, salad, german, italian, fusion
5. **Cooking method**: e.g. fresh, raw, grilled, fried, steamed, baked
6. **Dietary tags**: [vegetarian, vegan, gluten-free, dairy-free, organic, local]
7. **Estimated prices**:
   - regular: Estimated selling price
   - student: about 80% of regular price
8. **Confidence score**: 0-1

**IMPORTANT PARSING RULES FOR MIXED LANGUAGE INPUT:**
- IGNORE filler words: "uh", "um", "ahh", "hmm", "like", "so", "basically", "you know"
- Ignore stuttering and repetitions: "le-le-lemon" → "lemon"
- SMART INGREDIENT RECOGNITION: Use fuzzy matching for similar-sounding ingredients
  * "lemmon" → "lemon", "tomatoe" → "tomato", "chiken" → "chicken"
  * "ryce" → "rice", "onyon" → "onion", "avacado" → "avocado"
- "ein" or "eine" (German) = quantity 1
- "cent" in "5 cent" = €0.05 (five cents = 0.05 euros)
- "euro" without number = €1.00
- "€50.00" = 50.00
- "2.00 per" = €2.00
- Handle German-English mixed input gracefully
- Numbers in words: "five" = 5, "two" = 2, "three" = 3, "four" = 4
- "bunch" is common unit for herbs like basil
- "bunt" (German) means "mixed/colorful" - treat as adjective describing ingredient
- Use reasonable defaults for unclear quantities
- Parse compound prices: "cent und ein euro" = add both prices together
- EXAMPLES WITH FILLER WORDS:
  * "uh umm lemon and ahh rice" → Lemon + Rice
  * "so like basically we have lemmon and ryce" → Lemon + Rice
  * "cent und ein bunt basilikum ein euro 5" → Basil: 1 bunch, €1.05
  * "Eine gurke ein euro" → Cucumber: 1 piece, €1.00
  * "tomaten . Eine gurke ein euro" → Tomatoes + Cucumber: 1 piece, €1.00

Return the result as VALID JSON:`;

  return basePrompt + contextSpecific + instructions;
}

function createUserPrompt(text: string, language: string): string {
  const prompt = language === 'de'
    ? `Analysiere diese Gerichtbeschreibung und gib die strukturierten Daten als JSON zurück:\n\n"${text}"`
    : `Analyze this dish description and return the structured data as JSON:\n\n"${text}"`;

  return prompt;
}

// Fallback functions for basic parsing when AI fails
function extractDishName(text: string): string {
  // Try to find dish name patterns
  const sentences = text.split(/[.!?]/);
  const firstSentence = sentences[0]?.trim();
  
  if (firstSentence && firstSentence.length < 50) {
    return firstSentence;
  }
  
  // Extract first few words as potential dish name
  const words = text.trim().split(/\s+/);
  return words.slice(0, Math.min(4, words.length)).join(' ');
}

function extractBasicIngredients(text: string): string[] {
  const commonIngredients = [
    // English ingredients
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'tofu',
    'rice', 'noodles', 'pasta', 'bread', 'potato', 'tomato', 'onion', 'garlic',
    'egg', 'cheese', 'milk', 'cream', 'butter', 'oil', 'salt', 'pepper',
    'soy sauce', 'ginger', 'basil', 'oregano', 'parsley', 'cilantro',
    'cucumber', 'lettuce', 'carrot', 'broccoli', 'spinach', 'mushroom',
    
    // German ingredients  
    'huhn', 'rindfleisch', 'schweinefleisch', 'fisch', 'lachs', 'garnelen', 'tofu',
    'reis', 'nudeln', 'brot', 'kartoffel', 'tomate', 'tomaten', 'zwiebel', 'knoblauch',
    'ei', 'käse', 'milch', 'sahne', 'butter', 'öl', 'salz', 'pfeffer',
    'gurke', 'salat', 'karotte', 'brokkoli', 'spinat', 'pilz', 'pilze',
    'basilikum', 'petersilie', 'schnittlauch', 'dill', 'oregano',
    'rote zwiebel', 'grüne zwiebel', 'frühlingszwiebel',
    
    // Mixed/international
    'avocado', 'mozzarella', 'parmesan', 'feta', 'oliven', 'olive'
  ];

  const foundIngredients: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for multi-word ingredients first
  const multiWordIngredients = [
    'rote zwiebel', 'red onion', 'grüne zwiebel', 'green onion',
    'soy sauce', 'olive oil', 'coconut milk'
  ];
  
  multiWordIngredients.forEach(ingredient => {
    if (lowerText.includes(ingredient)) {
      foundIngredients.push(ingredient);
    }
  });

  // Then check single-word ingredients
  commonIngredients.forEach(ingredient => {
    if (lowerText.includes(ingredient) && !foundIngredients.some(found => found.includes(ingredient))) {
      foundIngredients.push(ingredient);
    }
  });

  return foundIngredients;
}

function detectCuisineType(text: string): string {
  const cuisineKeywords: { [key: string]: string[] } = {
    'asian': ['soy sauce', 'ginger', 'rice', 'noodles', 'asian', 'chinese', 'japanese', 'thai', 'korean'],
    'italian': ['pasta', 'tomato', 'basil', 'oregano', 'parmesan', 'italian', 'pizza'],
    'german': ['sauerkraut', 'bratwurst', 'schnitzel', 'german', 'deutsch'],
    'fusion': ['fusion', 'modern', 'contemporary'],
    'mediterranean': ['olive', 'mediterranean', 'greek', 'feta']
  };

  const lowerText = text.toLowerCase();
  
  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return cuisine;
    }
  }
  
  return 'fusion'; // default
}

function extractDietaryTags(text: string): string[] {
  const dietaryKeywords = {
    'vegetarian': ['vegetarian', 'vegetarisch'],
    'vegan': ['vegan'],
    'gluten-free': ['gluten-free', 'glutenfrei'],
    'dairy-free': ['dairy-free', 'laktosefrei'],
    'halal': ['halal'],
    'kosher': ['kosher']
  };

  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  Object.entries(dietaryKeywords).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      tags.push(tag);
    }
  });

  return tags;
}

function estimatePrice(text: string, type: 'regular' | 'student'): number {
  // Basic price estimation based on ingredients and complexity
  const lowerText = text.toLowerCase();
  let basePrice = 8.0; // default base price

  // Adjust based on expensive ingredients
  const expensiveIngredients = ['salmon', 'beef', 'lobster', 'truffle', 'lachs', 'rindfleisch'];
  const cheapIngredients = ['rice', 'pasta', 'potato', 'egg', 'reis', 'nudeln', 'kartoffel'];

  if (expensiveIngredients.some(ing => lowerText.includes(ing))) {
    basePrice += 4.0;
  }
  
  if (cheapIngredients.some(ing => lowerText.includes(ing))) {
    basePrice -= 2.0;
  }

  // Adjust based on complexity (number of ingredients mentioned)
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 20) {
    basePrice += 2.0;
  }

  basePrice = Math.max(basePrice, 5.0); // minimum price
  basePrice = Math.min(basePrice, 25.0); // maximum price

  // Student discount
  if (type === 'student') {
    basePrice *= 0.8; // 20% discount
  }

  return Math.round(basePrice * 100) / 100; // round to 2 decimal places
}