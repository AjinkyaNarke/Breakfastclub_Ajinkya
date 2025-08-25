import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRecipeCache, CachedRecipe } from '@/lib/recipeCache';
import { useRecipeTranslation, mergeRecipeWithTranslations } from '@/hooks/useRecipeTranslation';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Clock, 
  Copy, 
  Trash2, 
  Languages, 
  ChefHat,
  Package,
  Tag,
  Euro
} from 'lucide-react';
import { toast } from 'sonner';

interface RecipeCacheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipe: (recipe: CachedRecipe) => void;
  currentLanguage?: 'en' | 'de';
}

export function RecipeCacheDialog({
  open,
  onOpenChange,
  onSelectRecipe,
  currentLanguage = 'en'
}: RecipeCacheDialogProps) {
  const { t } = useTranslation('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<CachedRecipe | null>(null);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  
  const {
    getAllRecipes,
    searchRecipes,
    getRecentlyUsed,
    deleteRecipe,
    updateLastUsed,
    getCacheStats
  } = useRecipeCache();

  const { translateRecipeToAllLanguages, isTranslating } = useRecipeTranslation({
    onSuccess: (translation) => {
      toast.success(t('translation.recipeSuccess', 'Recipe translated successfully'));
    }
  });

  const [recipes, setRecipes] = useState<CachedRecipe[]>([]);
  const [cacheStats, setCacheStats] = useState<ReturnType<typeof getCacheStats>>();

  useEffect(() => {
    if (open) {
      loadRecipes();
      setCacheStats(getCacheStats());
    }
  }, [open, searchQuery, showRecentOnly]);

  const loadRecipes = () => {
    if (showRecentOnly) {
      setRecipes(getRecentlyUsed(20));
    } else if (searchQuery.trim()) {
      setRecipes(searchRecipes(searchQuery));
    } else {
      setRecipes(getAllRecipes());
    }
  };

  const handleSelectRecipe = async (recipe: CachedRecipe) => {
    updateLastUsed(recipe.id);
    
    // If recipe doesn't have current language, offer to translate
    const needsTranslation = currentLanguage === 'en' 
      ? !recipe.name_en || !recipe.description_en
      : !recipe.name_de || !recipe.description_de;

    if (needsTranslation) {
      try {
        const sourceLang = currentLanguage === 'en' ? 'de' : 'en';
        const recipeData = {
          name: recipe.name,
          description: recipe.description,
          ingredients: recipe.ingredients,
          dietary_tags: recipe.dietary_tags,
          category: recipe.category
        };

        const translation = await translateRecipeToAllLanguages(recipeData, sourceLang);
        const mergedRecipe = mergeRecipeWithTranslations(recipeData, translation, sourceLang);
        
        onSelectRecipe({ ...recipe, ...mergedRecipe });
      } catch (error) {
        // If translation fails, use original recipe
        onSelectRecipe(recipe);
      }
    } else {
      onSelectRecipe(recipe);
    }
    
    onOpenChange(false);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (deleteRecipe(recipeId)) {
      toast.success(t('cache.recipeDeleted', 'Recipe deleted from cache'));
      loadRecipes();
      setCacheStats(getCacheStats());
    }
  };

  const getDisplayName = (recipe: CachedRecipe) => {
    if (currentLanguage === 'en' && recipe.name_en) return recipe.name_en;
    if (currentLanguage === 'de' && recipe.name_de) return recipe.name_de;
    return recipe.name;
  };

  const getDisplayDescription = (recipe: CachedRecipe) => {
    if (currentLanguage === 'en' && recipe.description_en) return recipe.description_en;
    if (currentLanguage === 'de' && recipe.description_de) return recipe.description_de;
    return recipe.description;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {t('cache.title', 'Recipe Cache')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full">
          {/* Search and filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('cache.searchPlaceholder', 'Search recipes...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showRecentOnly ? "default" : "outline"}
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {t('cache.recent', 'Recent')}
            </Button>
          </div>

          {/* Cache stats */}
          {cacheStats && (
            <div className="grid grid-cols-4 gap-2 text-sm text-muted-foreground">
              <div>{t('cache.totalRecipes', 'Total')}: {cacheStats.totalRecipes}</div>
              <div>{t('cache.cacheSize', 'Size')}: {cacheStats.cacheSize}</div>
              <div className="col-span-2">
                {cacheStats.newestRecipe && 
                  `${t('cache.newest', 'Newest')}: ${formatDate(cacheStats.newestRecipe)}`
                }
              </div>
            </div>
          )}

          <Separator />

          {/* Recipe list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {recipes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('cache.empty', 'No recipes in cache')}</p>
                  </div>
                ) : (
                  recipes.map((recipe) => (
                    <Card 
                      key={recipe.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedRecipe?.id === recipe.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium">
                            {getDisplayName(recipe)}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectRecipe(recipe);
                              }}
                              disabled={isTranslating}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRecipe(recipe.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {getDisplayDescription(recipe)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(recipe.created_at)}</span>
                          {recipe.last_used && (
                            <>
                              <span>•</span>
                              <span>{t('cache.lastUsed', 'Used')}: {formatDate(recipe.last_used)}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {recipe.dietary_tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(recipe.dietary_tags?.length || 0) > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(recipe.dietary_tags?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Recipe details */}
            <div className="border-l pl-4">
              {selectedRecipe ? (
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{getDisplayName(selectedRecipe)}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getDisplayDescription(selectedRecipe)}
                      </p>
                    </div>

                    {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4" />
                          {t('cache.ingredients', 'Ingredients')}
                        </Label>
                        <ul className="text-sm space-y-1">
                          {selectedRecipe.ingredients.map((ingredient, index) => (
                            <li key={index} className="text-muted-foreground">
                              • {ingredient}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedRecipe.dietary_tags && selectedRecipe.dietary_tags.length > 0 && (
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4" />
                          {t('cache.dietaryTags', 'Dietary Tags')}
                        </Label>
                        <div className="flex flex-wrap gap-1">
                          {selectedRecipe.dietary_tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedRecipe.regular_price || selectedRecipe.student_price) && (
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Euro className="h-4 w-4" />
                          {t('cache.pricing', 'Pricing')}
                        </Label>
                        <div className="text-sm space-y-1">
                          {selectedRecipe.regular_price && (
                            <div>Regular: €{selectedRecipe.regular_price.toFixed(2)}</div>
                          )}
                          {selectedRecipe.student_price && (
                            <div>Student: €{selectedRecipe.student_price.toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={() => handleSelectRecipe(selectedRecipe)}
                        disabled={isTranslating}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {isTranslating 
                          ? t('cache.translating', 'Translating...') 
                          : t('cache.useRecipe', 'Use Recipe')
                        }
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t('cache.selectRecipe', 'Select a recipe to view details')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}