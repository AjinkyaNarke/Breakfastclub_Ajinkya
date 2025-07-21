
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Search } from 'lucide-react';
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
  cost_per_unit?: number;
  category?: {
    name: string;
  };
}

interface IngredientCategory {
  id: string;
  name: string;
}

interface SelectedIngredient {
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  ingredient: Ingredient;
}

interface IngredientSelectorProps {
  selectedIngredients: SelectedIngredient[];
  onIngredientsChange: (ingredients: SelectedIngredient[]) => void;
  menuItemId?: string;
}

export const IngredientSelector = ({ selectedIngredients, onIngredientsChange, menuItemId }: IngredientSelectorProps) => {
  const { t } = useTranslation('admin');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchIngredients();
    fetchCategories();
  }, []);

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
          id, name, unit, category_id, allergens, dietary_properties, cost_per_unit,
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

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ingredient.category_id === selectedCategory;
    const notAlreadySelected = !selectedIngredients.find(si => si.ingredient_id === ingredient.id);
    
    return matchesSearch && matchesCategory && notAlreadySelected;
  });

  const addIngredient = (ingredient: Ingredient) => {
    const newIngredient: SelectedIngredient = {
      ingredient_id: ingredient.id,
      quantity: 1,
      unit: ingredient.unit,
      notes: '',
      ingredient
    };
    
    onIngredientsChange([...selectedIngredients, newIngredient]);
  };

  const removeIngredient = (ingredientId: string) => {
    onIngredientsChange(selectedIngredients.filter(si => si.ingredient_id !== ingredientId));
  };

  const updateIngredient = (ingredientId: string, updates: Partial<SelectedIngredient>) => {
    onIngredientsChange(
      selectedIngredients.map(si => 
        si.ingredient_id === ingredientId ? { ...si, ...updates } : si
      )
    );
  };

  const getSmartSuggestions = () => {
    // Get ingredients that are commonly used together based on dietary properties
    const selectedProperties = new Set(
      selectedIngredients.flatMap(si => si.ingredient.dietary_properties || [])
    );
    
    return filteredIngredients
      .filter(ingredient => {
        // Suggest ingredients with similar dietary properties
        const hasCommonProperties = ingredient.dietary_properties?.some(prop => 
          selectedProperties.has(prop)
        );
        return hasCommonProperties;
      })
      .slice(0, 5);
  };

  const calculateTotalCost = () => {
    return selectedIngredients.reduce((total, si) => {
      const cost = si.ingredient.cost_per_unit || 0;
      return total + (cost * si.quantity);
    }, 0);
  };

  const smartSuggestions = getSmartSuggestions();

  if (loading) {
    return <div className="text-center py-4">{t('ingredientSelector.loadingIngredients')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Selected Ingredients */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{t('ingredientSelector.title')}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {t('ingredientSelector.totalCost', { cost: calculateTotalCost().toFixed(2) })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedIngredients.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t('ingredientSelector.noIngredients')}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedIngredients.map((si) => (
                <div key={si.ingredient_id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{si.ingredient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {si.ingredient.category?.name}
                    </div>
                    {si.ingredient.dietary_properties && si.ingredient.dietary_properties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {si.ingredient.dietary_properties.map((prop) => (
                          <Badge key={prop} variant="outline" className="text-xs">
                            {t(`ingredients.dietary.${prop}`, prop)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={si.quantity}
                      onChange={(e) => updateIngredient(si.ingredient_id, { 
                        quantity: parseFloat(e.target.value) || 0 
                      })}
                      className="w-20"
                      min="0"
                    />
                    <span className="text-sm text-muted-foreground min-w-fit">
                      {si.unit}
                    </span>
                    {si.ingredient.cost_per_unit && (
                      <span className="text-sm text-muted-foreground min-w-fit">
                        €{(si.ingredient.cost_per_unit * si.quantity).toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeIngredient(si.ingredient_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
            <CardTitle className="text-lg flex items-center gap-2">
              {t('ingredientSelector.smartSuggestions')}
              <Badge variant="secondary" className="text-xs">{t('ingredientSelector.aiPowered')}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {smartSuggestions.map((ingredient) => (
                <Button
                  key={ingredient.id}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-3"
                  onClick={() => addIngredient(ingredient)}
                >
                  <div className="text-left">
                    <div className="font-medium">{ingredient.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ingredient.category?.name}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingredient Search and Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('ingredientSelector.addIngredients')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('ingredientSelector.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
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
            </div>

            {/* Available Ingredients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {filteredIngredients.map((ingredient) => (
                <Card key={ingredient.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{ingredient.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {ingredient.category?.name} • {ingredient.unit}
                        </div>
                        {ingredient.cost_per_unit && (
                          <div className="text-xs text-muted-foreground">
                            €{ingredient.cost_per_unit}/{ingredient.unit}
                          </div>
                        )}
                        {ingredient.dietary_properties && ingredient.dietary_properties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ingredient.dietary_properties.slice(0, 2).map((prop) => (
                              <Badge key={prop} variant="outline" className="text-xs">
                                {t(`ingredients.dietary.${prop}`, prop)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addIngredient(ingredient)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredIngredients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? t('ingredientSelector.noMatchingIngredients') : t('ingredientSelector.noIngredientsAvailable')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
