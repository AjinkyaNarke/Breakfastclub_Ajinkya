# Translation API Documentation

## Overview
This document describes the translation and recipe caching functionality implemented using DeepSeek API for automatic translation and local storage for recipe caching.

## Translation Services

### DeepSeek Translation Integration

#### Basic Text Translation
**File:** `src/integrations/deepseek/translate.ts`

```typescript
translateText({ 
  text: string, 
  sourceLang: 'en' | 'de', 
  targetLang: 'en' | 'de' 
}): Promise<string>
```

**Usage:**
```typescript
import { translateText } from '@/integrations/deepseek/translate';

const translation = await translateText({
  text: "Hello World",
  sourceLang: 'en',
  targetLang: 'de'
});
// Returns: "Hallo Welt"
```

#### Recipe Translation
**File:** `src/integrations/deepseek/recipeTranslate.ts`

```typescript
translateRecipe({ 
  recipe: RecipeData, 
  sourceLang: 'en' | 'de', 
  targetLang: 'en' | 'de' 
}): Promise<TranslatedRecipeData>
```

**Recipe Data Structure:**
```typescript
interface RecipeData {
  name?: string;
  description?: string;
  ingredients?: string[];
  dietary_tags?: string[];
  category?: string;
}
```

**Translated Recipe Data Structure:**
```typescript
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
```

**Usage:**
```typescript
import { translateRecipe } from '@/integrations/deepseek/recipeTranslate';

const recipe = {
  name: "Spaghetti Carbonara",
  description: "Classic Italian pasta dish",
  ingredients: ["spaghetti", "eggs", "bacon", "parmesan"],
  dietary_tags: ["contains-gluten", "contains-dairy"]
};

const translation = await translateRecipe({
  recipe,
  sourceLang: 'en',
  targetLang: 'de'
});
```

#### Batch Recipe Translation
```typescript
translateBatchRecipes({ 
  recipes: RecipeData[], 
  sourceLang: 'en' | 'de', 
  targetLang: 'en' | 'de' 
}): Promise<TranslatedRecipeData[]>
```

**Features:**
- Processes up to 5 recipes per batch
- Automatic retry with individual translation on batch failure
- Rate limiting with 1-second delay between batches
- Error handling for individual recipe failures

## React Hooks

### useAutoTranslate Hook
**File:** `src/hooks/useAutoTranslate.tsx`

Basic translation hook for simple text translation.

```typescript
const { 
  translate, 
  translateToGerman, 
  translateToEnglish, 
  isTranslating, 
  error, 
  clearError 
} = useAutoTranslate({
  onSuccess: (translation) => console.log('Translated:', translation),
  onError: (error) => console.error('Translation error:', error)
});
```

### useRecipeTranslation Hook
**File:** `src/hooks/useRecipeTranslation.tsx`

Advanced hook for recipe translation with additional features.

```typescript
const { 
  translate, 
  translateToGerman, 
  translateToEnglish, 
  translateBatch, 
  translateRecipeToAllLanguages, 
  isTranslating, 
  error, 
  clearError 
} = useRecipeTranslation({
  onSuccess: (translation) => handleTranslationSuccess(translation),
  onError: (error) => handleTranslationError(error),
  showToasts: true
});
```

**Helper Functions:**
```typescript
// Merge original recipe with translations
const mergedRecipe = mergeRecipeWithTranslations(
  originalRecipe, 
  translations, 
  'en' // original language
);

// Extract recipe data from form values
const recipeData = extractRecipeFromForm(formValues);
```

## Recipe Cache System

### RecipeCache Service
**File:** `src/lib/recipeCache.ts`

Local storage-based caching system for recipes.

```typescript
interface CachedRecipe {
  id: string;
  name: string;
  name_en?: string;
  name_de?: string;
  description: string;
  description_en?: string;
  description_de?: string;
  ingredients: string[];
  ingredients_en?: string[];
  ingredients_de?: string[];
  dietary_tags: string[];
  dietary_tags_en?: string[];
  dietary_tags_de?: string[];
  category?: string;
  regular_price?: number;
  student_price?: number;
  created_at: string;
  last_used?: string;
}
```

### useRecipeCache Hook
```typescript
const {
  saveRecipe,
  getRecipe,
  getAllRecipes,
  deleteRecipe,
  updateLastUsed,
  clearCache,
  searchRecipes,
  getRecentlyUsed,
  exportCache,
  importCache,
  getCacheStats
} = useRecipeCache();
```

**Methods:**

#### saveRecipe(recipe)
Saves a new recipe to cache and returns generated ID.
```typescript
const recipeId = saveRecipe({
  name: "Test Recipe",
  description: "A test recipe",
  ingredients: ["ingredient1", "ingredient2"],
  dietary_tags: ["vegetarian"]
});
```

#### getRecipe(id)
Retrieves a specific recipe by ID.
```typescript
const recipe = getRecipe("recipe_123");
```

#### searchRecipes(query)
Searches recipes by name, description, ingredients, or tags.
```typescript
const results = searchRecipes("pasta");
```

#### getRecentlyUsed(limit?)
Gets most recently used recipes.
```typescript
const recent = getRecentlyUsed(5); // Last 5 used recipes
```

#### getCacheStats()
Returns cache statistics.
```typescript
const stats = getCacheStats();
// Returns: { totalRecipes, cacheSize, oldestRecipe, newestRecipe }
```

## UI Components

### AutoTranslateButton
**File:** `src/components/admin/AutoTranslateButton.tsx`

Button component for triggering translations.

```tsx
<AutoTranslateButton
  sourceText="Hello World"
  sourceLang="en"
  targetLang="de"
  onTranslated={(translation) => setTranslatedText(translation)}
  disabled={false}
  size="sm"
  variant="outline"
/>
```

**Props:**
- `sourceText`: Text to translate
- `sourceLang`: Source language ('en' | 'de')
- `targetLang`: Target language ('en' | 'de')
- `onTranslated`: Callback when translation completes
- `disabled?`: Button disabled state
- `size?`: Button size
- `variant?`: Button variant

### RecipeCacheDialog
**File:** `src/components/admin/RecipeCacheDialog.tsx`

Modal dialog for browsing and selecting cached recipes.

```tsx
<RecipeCacheDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onSelectRecipe={(recipe) => populateForm(recipe)}
  currentLanguage="en"
/>
```

**Features:**
- Search functionality
- Recently used filter
- Recipe details preview
- Auto-translation on selection
- Cache statistics display
- Individual recipe deletion

## Configuration

### Environment Variables
```env
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### Cache Configuration
```typescript
const CACHE_KEY = 'breakfast_club_recipe_cache';
const MAX_CACHE_SIZE = 50; // Maximum number of cached recipes
```

## Error Handling

### Translation Errors
- Network connectivity issues
- API key validation
- Rate limiting
- Invalid JSON responses
- Language validation

### Cache Errors
- Local storage quota exceeded
- Invalid JSON data
- Corrupted cache data

## Best Practices

### Translation
1. Always validate source and target languages are different
2. Implement proper error handling and user feedback
3. Use batch translation for multiple recipes
4. Add rate limiting for API calls
5. Provide fallback behavior when translation fails

### Caching
1. Regularly clean up old cache entries
2. Implement cache size limits
3. Provide export/import functionality for backups
4. Update `last_used` timestamps for better organization
5. Validate cached data before use

### Performance
1. Debounce search queries
2. Implement pagination for large recipe lists
3. Use lazy loading for recipe details
4. Cache translation results locally
5. Optimize batch sizes for API calls

## Integration Examples

### Menu Item Form Integration
```typescript
// In a menu item form component
const { saveRecipe } = useRecipeCache();
const { translateRecipeToAllLanguages } = useRecipeTranslation();

const handleSaveMenuItem = async (formData) => {
  // Save to database
  await saveMenuItem(formData);
  
  // Cache recipe for reuse
  const recipeData = extractRecipeFromForm(formData);
  saveRecipe(recipeData);
  
  // Auto-translate if needed
  if (formData.auto_translate) {
    const translation = await translateRecipeToAllLanguages(
      recipeData, 
      formData.source_language
    );
    // Update form with translations
    updateFormWithTranslations(translation);
  }
};
```

### Bulk Translation
```typescript
const handleBulkTranslate = async () => {
  const recipes = getAllRecipes();
  const englishRecipes = recipes.filter(r => !r.name_de);
  
  if (englishRecipes.length > 0) {
    const translations = await translateBatch(
      englishRecipes.map(extractRecipeFromForm),
      'en',
      'de'
    );
    
    // Update recipes with translations
    englishRecipes.forEach((recipe, index) => {
      const translation = translations[index];
      if (translation) {
        updateRecipeWithTranslation(recipe.id, translation);
      }
    });
  }
};
```

## Troubleshooting

### Common Issues
1. **Translation API Key**: Ensure `VITE_DEEPSEEK_API_KEY` is set
2. **Local Storage**: Check browser storage limits and permissions
3. **Network Issues**: Implement retry logic for API calls
4. **Cache Corruption**: Provide cache reset functionality
5. **Language Detection**: Validate language codes before API calls

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG_MODE = true;
```

This will log API calls, cache operations, and error details to console.