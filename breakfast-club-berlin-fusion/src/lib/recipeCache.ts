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

interface RecipeCacheManager {
  saveRecipe: (recipe: Omit<CachedRecipe, 'id' | 'created_at'>) => string;
  getRecipe: (id: string) => CachedRecipe | null;
  getAllRecipes: () => CachedRecipe[];
  deleteRecipe: (id: string) => boolean;
  updateLastUsed: (id: string) => void;
  clearCache: () => void;
  searchRecipes: (query: string) => CachedRecipe[];
  getRecentlyUsed: (limit?: number) => CachedRecipe[];
}

const CACHE_KEY = 'breakfast_club_recipe_cache';
const MAX_CACHE_SIZE = 50;

class RecipeCacheService implements RecipeCacheManager {
  private getCache(): CachedRecipe[] {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error reading recipe cache:', error);
      return [];
    }
  }

  private setCache(recipes: CachedRecipe[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(recipes));
    } catch (error) {
      console.error('Error saving recipe cache:', error);
    }
  }

  private generateId(): string {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  saveRecipe(recipe: Omit<CachedRecipe, 'id' | 'created_at'>): string {
    const recipes = this.getCache();
    const id = this.generateId();
    
    const newRecipe: CachedRecipe = {
      ...recipe,
      id,
      created_at: new Date().toISOString(),
      last_used: new Date().toISOString()
    };

    // Add to beginning of array (most recent first)
    recipes.unshift(newRecipe);

    // Maintain cache size limit
    if (recipes.length > MAX_CACHE_SIZE) {
      recipes.splice(MAX_CACHE_SIZE);
    }

    this.setCache(recipes);
    return id;
  }

  getRecipe(id: string): CachedRecipe | null {
    const recipes = this.getCache();
    return recipes.find(recipe => recipe.id === id) || null;
  }

  getAllRecipes(): CachedRecipe[] {
    return this.getCache();
  }

  deleteRecipe(id: string): boolean {
    const recipes = this.getCache();
    const index = recipes.findIndex(recipe => recipe.id === id);
    
    if (index !== -1) {
      recipes.splice(index, 1);
      this.setCache(recipes);
      return true;
    }
    
    return false;
  }

  updateLastUsed(id: string): void {
    const recipes = this.getCache();
    const recipe = recipes.find(r => r.id === id);
    
    if (recipe) {
      recipe.last_used = new Date().toISOString();
      
      // Move to front of array
      const index = recipes.indexOf(recipe);
      recipes.splice(index, 1);
      recipes.unshift(recipe);
      
      this.setCache(recipes);
    }
  }

  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }

  searchRecipes(query: string): CachedRecipe[] {
    if (!query.trim()) {
      return this.getAllRecipes();
    }

    const recipes = this.getCache();
    const searchTerm = query.toLowerCase();

    return recipes.filter(recipe => {
      const searchableText = [
        recipe.name,
        recipe.name_en,
        recipe.name_de,
        recipe.description,
        recipe.description_en,
        recipe.description_de,
        recipe.category,
        ...(recipe.ingredients || []),
        ...(recipe.ingredients_en || []),
        ...(recipe.ingredients_de || []),
        ...(recipe.dietary_tags || []),
        ...(recipe.dietary_tags_en || []),
        ...(recipe.dietary_tags_de || [])
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }

  getRecentlyUsed(limit: number = 10): CachedRecipe[] {
    const recipes = this.getCache();
    
    // Sort by last_used date (most recent first)
    const sorted = recipes
      .filter(recipe => recipe.last_used)
      .sort((a, b) => {
        const dateA = new Date(a.last_used!).getTime();
        const dateB = new Date(b.last_used!).getTime();
        return dateB - dateA;
      });

    return sorted.slice(0, limit);
  }

  // Export recipes for backup
  exportCache(): string {
    const recipes = this.getCache();
    return JSON.stringify(recipes, null, 2);
  }

  // Import recipes from backup
  importCache(jsonData: string): boolean {
    try {
      const recipes = JSON.parse(jsonData);
      if (Array.isArray(recipes)) {
        this.setCache(recipes);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing recipe cache:', error);
      return false;
    }
  }

  // Get cache statistics
  getCacheStats(): {
    totalRecipes: number;
    cacheSize: string;
    oldestRecipe?: string;
    newestRecipe?: string;
  } {
    const recipes = this.getCache();
    const cacheData = localStorage.getItem(CACHE_KEY) || '';
    
    return {
      totalRecipes: recipes.length,
      cacheSize: `${(cacheData.length / 1024).toFixed(2)} KB`,
      oldestRecipe: recipes.length > 0 ? recipes[recipes.length - 1].created_at : undefined,
      newestRecipe: recipes.length > 0 ? recipes[0].created_at : undefined
    };
  }
}

// Singleton instance
export const recipeCache = new RecipeCacheService();

// React hook for using recipe cache
export function useRecipeCache() {
  return {
    saveRecipe: recipeCache.saveRecipe.bind(recipeCache),
    getRecipe: recipeCache.getRecipe.bind(recipeCache),
    getAllRecipes: recipeCache.getAllRecipes.bind(recipeCache),
    deleteRecipe: recipeCache.deleteRecipe.bind(recipeCache),
    updateLastUsed: recipeCache.updateLastUsed.bind(recipeCache),
    clearCache: recipeCache.clearCache.bind(recipeCache),
    searchRecipes: recipeCache.searchRecipes.bind(recipeCache),
    getRecentlyUsed: recipeCache.getRecentlyUsed.bind(recipeCache),
    exportCache: recipeCache.exportCache.bind(recipeCache),
    importCache: recipeCache.importCache.bind(recipeCache),
    getCacheStats: recipeCache.getCacheStats.bind(recipeCache)
  };
}

export type { CachedRecipe, RecipeCacheManager };