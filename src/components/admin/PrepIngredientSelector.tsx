import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Package, Loader2, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Ingredient {
  id: string;
  name: string;
  name_de: string;
  name_en: string;
  unit: string;
  cost_per_unit: number;
  category?: {
    id: string;
    name: string;
    name_de: string;
    name_en: string;
  };
  allergens?: string[];
  dietary_properties?: string[];
}

interface PrepIngredient {
  id?: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

interface PrepIngredientSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIngredients: PrepIngredient[];
  onIngredientsChange: (ingredients: PrepIngredient[]) => void;
  title?: string;
  description?: string;
}

export const PrepIngredientSelector = ({
  open,
  onOpenChange,
  selectedIngredients,
  onIngredientsChange,
  title,
  description
}: PrepIngredientSelectorProps) => {
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchIngredients();
      fetchCategories();
    }
  }, [open]);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call once backend is implemented
      const mockIngredients: Ingredient[] = [
        {
          id: '1',
          name: 'Ginger',
          name_de: 'Ingwer',
          name_en: 'Ginger',
          unit: 'g',
          cost_per_unit: 0.05,
          category: { id: '1', name: 'Spices & Herbs', name_de: 'Gewürze & Kräuter', name_en: 'Spices & Herbs' },
          allergens: [],
          dietary_properties: ['vegan', 'gluten-free']
        },
        {
          id: '2',
          name: 'Garlic',
          name_de: 'Knoblauch',
          name_en: 'Garlic',
          unit: 'g',
          cost_per_unit: 0.03,
          category: { id: '2', name: 'Vegetables', name_de: 'Gemüse', name_en: 'Vegetables' },
          allergens: [],
          dietary_properties: ['vegan', 'gluten-free']
        },
        {
          id: '3',
          name: 'Coconut Oil',
          name_de: 'Kokosöl',
          name_en: 'Coconut Oil',
          unit: 'ml',
          cost_per_unit: 0.02,
          category: { id: '3', name: 'Oils & Fats', name_de: 'Öle & Fette', name_en: 'Oils & Fats' },
          allergens: [],
          dietary_properties: ['vegan', 'gluten-free']
        },
        {
          id: '4',
          name: 'Lemongrass',
          name_de: 'Zitronengras',
          name_en: 'Lemongrass',
          unit: 'g',
          cost_per_unit: 0.08,
          category: { id: '1', name: 'Spices & Herbs', name_de: 'Gewürze & Kräuter', name_en: 'Spices & Herbs' },
          allergens: [],
          dietary_properties: ['vegan', 'gluten-free']
        },
        {
          id: '5',
          name: 'Chili Peppers',
          name_de: 'Chilischoten',
          name_en: 'Chili Peppers',
          unit: 'g',
          cost_per_unit: 0.06,
          category: { id: '2', name: 'Vegetables', name_de: 'Gemüse', name_en: 'Vegetables' },
          allergens: [],
          dietary_properties: ['vegan', 'gluten-free']
        },
        {
          id: '6',
          name: 'Fish Sauce',
          name_de: 'Fischsauce',
          name_en: 'Fish Sauce',
          unit: 'ml',
          cost_per_unit: 0.04,
          category: { id: '4', name: 'Sauces & Condiments', name_de: 'Soßen & Gewürze', name_en: 'Sauces & Condiments' },
          allergens: ['fish'],
          dietary_properties: []
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setIngredients(mockIngredients);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast({
        title: t('preps.ingredientsError', 'Error'),
        description: t('preps.ingredientsErrorDescription', 'Failed to fetch ingredients'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // TODO: Replace with actual API call once backend is implemented
      const mockCategories = [
        { id: 'all', name: 'All Categories', name_de: 'Alle Kategorien', name_en: 'All Categories' },
        { id: '1', name: 'Spices & Herbs', name_de: 'Gewürze & Kräuter', name_en: 'Spices & Herbs' },
        { id: '2', name: 'Vegetables', name_de: 'Gemüse', name_en: 'Vegetables' },
        { id: '3', name: 'Oils & Fats', name_de: 'Öle & Fette', name_en: 'Oils & Fats' },
        { id: '4', name: 'Sauces & Condiments', name_de: 'Soßen & Gewürze', name_en: 'Sauces & Condiments' }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getDisplayName = (ingredient: Ingredient) => {
    const currentLang = t('language') === 'de' ? 'de' : 'en';
    return ingredient[`name_${currentLang}`] || ingredient.name;
  };

  const getDisplayCategoryName = (category: any) => {
    const currentLang = t('language') === 'de' ? 'de' : 'en';
    return category[`name_${currentLang}`] || category.name;
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = getDisplayName(ingredient).toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || ingredient.category?.id === selectedCategory;
    
    const matchesDietary = selectedDietary === 'all' || 
                          (ingredient.dietary_properties?.includes(selectedDietary) || false);
    
    return matchesSearch && matchesCategory && matchesDietary;
  });

  const handleAddIngredient = (ingredient: Ingredient) => {
    const existingIndex = selectedIngredients.findIndex(
      item => item.ingredient_id === ingredient.id
    );

    if (existingIndex >= 0) {
      // Update existing ingredient quantity
      const updatedIngredients = selectedIngredients.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      onIngredientsChange(updatedIngredients);
    } else {
      // Add new ingredient
      const newPrepIngredient: PrepIngredient = {
        ingredient_id: ingredient.id,
        quantity: 1,
        unit: ingredient.unit,
        ingredient: ingredient
      };
      onIngredientsChange([...selectedIngredients, newPrepIngredient]);
    }
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    onIngredientsChange(selectedIngredients.filter(item => item.ingredient_id !== ingredientId));
  };

  const handleQuantityChange = (ingredientId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveIngredient(ingredientId);
      return;
    }
    
    const updatedIngredients = selectedIngredients.map(item =>
      item.ingredient_id === ingredientId
        ? { ...item, quantity }
        : item
    );
    onIngredientsChange(updatedIngredients);
  };

  const calculateTotalCost = () => {
    return selectedIngredients.reduce((total, item) => {
      return total + (item.ingredient.cost_per_unit * item.quantity);
    }, 0);
  };

  const getDietaryBadgeVariant = (property: string) => {
    switch (property) {
      case 'vegan': return 'default';
      case 'vegetarian': return 'secondary';
      case 'gluten-free': return 'outline';
      default: return 'outline';
    }
  };

  const totalCost = calculateTotalCost();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title || t('preps.selectIngredients', 'Select Ingredients')}
          </DialogTitle>
          <DialogDescription>
            {description || t('preps.selectIngredientsDescription', 'Choose ingredients for your prep and see the cost breakdown')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Ingredient Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t('preps.searchIngredients', 'Search ingredients...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category-filter">{t('preps.filterByCategory', 'Filter by Category')}</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {getDisplayCategoryName(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dietary-filter">{t('preps.filterByDietary', 'Filter by Dietary')}</Label>
                    <Select value={selectedDietary} onValueChange={setSelectedDietary}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('preps.allDietary', 'All Dietary')}</SelectItem>
                        <SelectItem value="vegan">{t('preps.vegan', 'Vegan')}</SelectItem>
                        <SelectItem value="vegetarian">{t('preps.vegetarian', 'Vegetarian')}</SelectItem>
                        <SelectItem value="gluten-free">{t('preps.glutenFree', 'Gluten-Free')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchQuery || selectedCategory !== 'all' || selectedDietary !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedDietary('all');
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    {t('preps.clearFilters', 'Clear Filters')}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Ingredients List */}
            <Card>
              <CardContent className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredIngredients.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t('preps.noIngredientsFound', 'No ingredients found')}</p>
                        <p className="text-sm">{t('preps.tryAdjustingFilters', 'Try adjusting your search or filters')}</p>
                      </div>
                    ) : (
                      filteredIngredients.map((ingredient) => (
                        <div
                          key={ingredient.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => handleAddIngredient(ingredient)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{getDisplayName(ingredient)}</div>
                            <div className="text-sm text-muted-foreground">
                              {ingredient.category && getDisplayCategoryName(ingredient.category)} • 
                              €{ingredient.cost_per_unit.toFixed(2)}/{ingredient.unit}
                            </div>
                            <div className="flex gap-1 mt-1">
                                                             {ingredient.dietary_properties?.map((property) => (
                                 <Badge key={property} variant={getDietaryBadgeVariant(property)}>
                                   {t(`preps.dietary.${property}`, property)}
                                 </Badge>
                               ))}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Selected Ingredients */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('preps.selectedIngredients', 'Selected Ingredients')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedIngredients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('preps.noIngredientsSelected', 'No ingredients selected')}</p>
                    <p className="text-sm">{t('preps.clickToAdd', 'Click on ingredients to add them')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedIngredients.map((item) => (
                      <div
                        key={item.ingredient_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{getDisplayName(item.ingredient)}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.ingredient.category && getDisplayCategoryName(item.ingredient.category)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.ingredient_id, parseFloat(e.target.value) || 0)}
                            className="w-20"
                            min="0"
                            step="0.1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {item.unit}
                          </span>
                          <div className="text-sm font-medium w-16 text-right">
                            €{(item.ingredient.cost_per_unit * item.quantity).toFixed(2)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveIngredient(item.ingredient_id);
                            }}
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Cost */}
                {selectedIngredients.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('preps.totalCost', 'Total Cost')}:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-green-600">
                          €{totalCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('preps.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            {t('preps.confirmSelection', 'Confirm Selection')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 