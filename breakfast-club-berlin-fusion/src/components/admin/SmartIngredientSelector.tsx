
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Search, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  category_id: string;
  allergens: string[];
  dietary_properties: string[];
  seasonal_availability: string[];
  cost_per_unit?: number;
  category?: {
    name: string;
  };
}

interface Prep {
  id: string;
  name: string;
  name_de: string;
  name_en: string;
  batch_yield: string;
  cost_per_batch: number;
  notes: string;
}

export type SmartComponent = 
  | { type: 'ingredient'; ingredient: Ingredient; quantity: number; unit: string; notes?: string }
  | { type: 'prep'; prep: Prep; quantity: number; unit: string; notes?: string };

interface SmartIngredientSelectorProps {
  selectedComponents: SmartComponent[];
  onComponentsChange: (components: SmartComponent[]) => void;
  menuItemId?: string;
}

export const SmartIngredientSelector = ({ selectedComponents, onComponentsChange, menuItemId }: SmartIngredientSelectorProps) => {
  const { t } = useTranslation('admin');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [preps, setPreps] = useState<Prep[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartComponent[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchIngredients();
    fetchPreps();
    fetchCategories();
  }, []);

  useEffect(() => {
    generateSmartSuggestions();
  }, [selectedComponents, ingredients, preps]);

  const fetchPreps = async () => {
    // TODO: Replace with actual API call
    setPreps([
      { id: 'p1', name: 'Green Curry Paste', name_de: 'Grüne Curry-Paste', name_en: 'Green Curry Paste', batch_yield: '500ml', cost_per_batch: 8.5, notes: 'Store in fridge' },
      { id: 'p2', name: 'Garlic Oil', name_de: 'Knoblauchöl', name_en: 'Garlic Oil', batch_yield: '250ml', cost_per_batch: 3.2, notes: 'Use within 1 week' },
    ]);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_categories')
        .select('id, name')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching ingredient categories:', error);
    }
  };

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          id, name, unit, category_id, allergens, dietary_properties, 
          seasonal_availability, cost_per_unit,
          category:ingredient_categories(name)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast({
        title: t('ingredients.messages.fetchError'),
        description: t('ingredients.messages.fetchError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (item: Ingredient | Prep) => {
    const currentLang = t('language') === 'de' ? 'de' : 'en';
    return (item as any)[`name_${currentLang}`] || item.name;
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = getDisplayName(ingredient).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ingredient.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredPreps = preps.filter(prep => {
    const matchesSearch = getDisplayName(prep).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const addIngredient = (ingredient: Ingredient) => {
    const existingIndex = selectedComponents.findIndex(
      item => item.type === 'ingredient' && item.ingredient.id === ingredient.id
    );

    if (existingIndex >= 0) {
      const updatedComponents = selectedComponents.map((item, index) =>
        index === existingIndex && item.type === 'ingredient'
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      onComponentsChange(updatedComponents);
    } else {
      onComponentsChange([
        ...selectedComponents,
        { type: 'ingredient', ingredient, quantity: 1, unit: ingredient.unit }
      ]);
    }
  };

  const addPrep = (prep: Prep) => {
    const existingIndex = selectedComponents.findIndex(
      item => item.type === 'prep' && item.prep.id === prep.id
    );

    if (existingIndex >= 0) {
      const updatedComponents = selectedComponents.map((item, index) =>
        index === existingIndex && item.type === 'prep'
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      onComponentsChange(updatedComponents);
    } else {
      onComponentsChange([
        ...selectedComponents,
        { type: 'prep', prep, quantity: 1, unit: 'g' }
      ]);
    }
  };

  const removeComponent = (index: number) => {
    onComponentsChange(selectedComponents.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, updates: Partial<Omit<SmartComponent, 'type'>>) => {
    onComponentsChange(selectedComponents.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const calculateTotalCost = () => {
    return selectedComponents.reduce((total, item) => {
      if (item.type === 'ingredient') {
        return total + (item.ingredient.cost_per_unit || 0) * item.quantity;
      } else if (item.type === 'prep') {
        // For now, assume cost_per_batch is for the batch_yield, and quantity is in grams/ml
        return total + (item.prep.cost_per_batch * (item.quantity / 100));
      }
      return total;
    }, 0);
  };

  const getCostWarnings = () => {
    const warnings: string[] = [];
    const totalCost = calculateTotalCost();

    if (totalCost > 15) {
      warnings.push(t('ingredientSelector.warnings.highCost'));
    }

    const expensiveComponents = selectedComponents.filter(item => {
      if (item.type === 'ingredient') {
        return (item.ingredient.cost_per_unit || 0) * item.quantity > 5;
      } else if (item.type === 'prep') {
        return item.prep.cost_per_batch * (item.quantity / 100) > 5;
      }
      return false;
    });

    if (expensiveComponents.length > 2) {
      warnings.push(t('ingredientSelector.warnings.expensiveIngredients'));
    }

    return warnings;
  };

  const getSeasonalWarnings = () => {
    const warnings: string[] = [];
    const currentSeason = getCurrentSeason();

    selectedComponents.forEach(item => {
      if (item.type === 'ingredient' && item.ingredient.seasonal_availability) {
        if (!item.ingredient.seasonal_availability.includes(currentSeason)) {
          warnings.push(t('ingredientSelector.warnings.notSeasonal', { ingredient: getDisplayName(item.ingredient) }));
        }
      }
    });

    return warnings;
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  const generateSmartSuggestions = () => {
    // TODO: Implement AI-powered suggestions based on selected components
    // For now, return empty array
    setSmartSuggestions([]);
  };

  if (loading) {
    return <div className="text-center py-4">{t('ingredientSelector.loadingIngredients')}</div>;
  }

  const costWarnings = getCostWarnings();
  const seasonalWarnings = getSeasonalWarnings();
  const totalCost = calculateTotalCost();

  return (
    <div className="space-y-4">
      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('ingredientSelector.costAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">{t('ingredientSelector.totalCost')}:</span>
            <span className="text-2xl font-bold text-green-600">€{totalCost.toFixed(2)}</span>
          </div>

          {costWarnings.length > 0 && (
            <div className="space-y-2">
              {costWarnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">{warning}</span>
                </div>
              ))}
            </div>
          )}

          {seasonalWarnings.length > 0 && (
            <div className="space-y-2 mt-4">
              {seasonalWarnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">{warning}</span>
                </div>
              ))}
            </div>
          )}

          {costWarnings.length === 0 && seasonalWarnings.length === 0 && (
            <p className="text-green-600 text-sm">{t('ingredientSelector.costOptimal')}</p>
          )}
        </CardContent>
      </Card>

      {/* Selected Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('ingredientSelector.selectedIngredients')}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedComponents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('ingredientSelector.noIngredients')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedComponents.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.type === 'ingredient' ? getDisplayName(item.ingredient) : `Prep: ${getDisplayName(item.prep)}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.type === 'ingredient' ? item.ingredient.category?.name : item.prep.batch_yield}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateComponent(index, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-20"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-sm text-muted-foreground w-12">
                      {item.unit}
                    </span>
                    <div className="text-sm font-medium w-16 text-right">
                      €{item.type === 'ingredient' 
                        ? ((item.ingredient.cost_per_unit || 0) * item.quantity).toFixed(2)
                        : (item.prep.cost_per_batch * (item.quantity / 100)).toFixed(2)
                      }
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeComponent(index)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t('ingredientSelector.smartSuggestions')}
              <Badge variant="secondary" className="text-xs">{t('ingredientSelector.aiPowered')}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {smartSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer">
                  <span>{suggestion.type === 'ingredient' ? getDisplayName(suggestion.ingredient) : `Prep: ${getDisplayName(suggestion.prep)}`}</span>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('ingredientSelector.addIngredients')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder={t('ingredientSelector.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('ingredientSelector.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('ingredientSelector.allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ingredients */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('ingredients', 'Ingredients')}</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredIngredients.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      {searchTerm ? t('ingredientSelector.noMatchingIngredients') : t('ingredientSelector.noIngredientsAvailable')}
                    </div>
                  ) : (
                    filteredIngredients.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                        onClick={() => addIngredient(ingredient)}
                      >
                        <div>
                          <div className="font-medium">{getDisplayName(ingredient)}</div>
                          <div className="text-sm text-muted-foreground">
                            {ingredient.category?.name} • €{(ingredient.cost_per_unit || 0).toFixed(2)}/{ingredient.unit}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Preps */}
              <div>
                <Label className="text-sm font-medium mb-2 block">{t('preps.title', 'Preps')}</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredPreps.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      {searchTerm ? t('ingredientSelector.noMatchingIngredients') : t('ingredientSelector.noIngredientsAvailable')}
                    </div>
                  ) : (
                    filteredPreps.map((prep) => (
                      <div
                        key={prep.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                        onClick={() => addPrep(prep)}
                      >
                        <div>
                          <div className="font-medium">Prep: {getDisplayName(prep)}</div>
                          <div className="text-sm text-muted-foreground">
                            {prep.batch_yield} • €{prep.cost_per_batch.toFixed(2)}/batch
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
