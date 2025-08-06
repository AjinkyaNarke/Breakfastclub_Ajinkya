import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Package } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  name_de: string;
  name_en: string;
  unit: string;
  cost_per_unit: number;
  category?: { name: string };
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

export type MenuItemComponent =
  | { type: 'ingredient'; ingredient: Ingredient; quantity: number; unit: string }
  | { type: 'prep'; prep: Prep; quantity: number; unit: string };

interface MenuItemIngredientSelectorProps {
  selectedComponents: MenuItemComponent[];
  onComponentsChange: (components: MenuItemComponent[]) => void;
}

export const MenuItemIngredientSelector = ({ selectedComponents, onComponentsChange }: MenuItemIngredientSelectorProps) => {
  const { t } = useTranslation('admin');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [preps, setPreps] = useState<Prep[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchIngredients();
    fetchPreps();
  }, []);

  const fetchIngredients = async () => {
    // TODO: Replace with actual API call
    setIngredients([
      { id: '1', name: 'Ginger', name_de: 'Ingwer', name_en: 'Ginger', unit: 'g', cost_per_unit: 0.05 },
      { id: '2', name: 'Garlic', name_de: 'Knoblauch', name_en: 'Garlic', unit: 'g', cost_per_unit: 0.03 },
      { id: '3', name: 'Coconut Oil', name_de: 'Kokosöl', name_en: 'Coconut Oil', unit: 'ml', cost_per_unit: 0.02 },
    ]);
  };

  const fetchPreps = async () => {
    // TODO: Replace with actual API call
    setPreps([
      { id: 'p1', name: 'Green Curry Paste', name_de: 'Grüne Curry-Paste', name_en: 'Green Curry Paste', batch_yield: '500ml', cost_per_batch: 8.5, notes: 'Store in fridge' },
      { id: 'p2', name: 'Garlic Oil', name_de: 'Knoblauchöl', name_en: 'Garlic Oil', batch_yield: '250ml', cost_per_batch: 3.2, notes: 'Use within 1 week' },
    ]);
  };

  const getDisplayName = (item: Ingredient | Prep) => {
    const currentLang = t('language') === 'de' ? 'de' : 'en';
    return (item as any)[`name_${currentLang}`] || item.name;
  };

  const filteredIngredients = ingredients.filter(i => getDisplayName(i).toLowerCase().includes(search.toLowerCase()));
  const filteredPreps = preps.filter(p => getDisplayName(p).toLowerCase().includes(search.toLowerCase()));

  const handleAddIngredient = (ingredient: Ingredient) => {
    onComponentsChange([
      ...selectedComponents,
      { type: 'ingredient', ingredient, quantity: 1, unit: ingredient.unit },
    ]);
  };

  const handleAddPrep = (prep: Prep) => {
    onComponentsChange([
      ...selectedComponents,
      { type: 'prep', prep, quantity: 1, unit: 'g' },
    ]);
  };

  const handleRemove = (idx: number) => {
    onComponentsChange(selectedComponents.filter((_, i) => i !== idx));
  };

  const handleQuantityChange = (idx: number, quantity: number) => {
    onComponentsChange(selectedComponents.map((c, i) => i === idx ? { ...c, quantity } : c));
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder={t('preps.searchIngredients', 'Search ingredients or preps...')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-2"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('ingredients', 'Ingredients')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredIngredients.map(ingredient => (
              <div key={ingredient.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer" onClick={() => handleAddIngredient(ingredient)}>
                <span>{getDisplayName(ingredient)}</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('preps.title', 'Preps')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredPreps.map(prep => (
              <div key={prep.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer" onClick={() => handleAddPrep(prep)}>
                <span>Prep: {getDisplayName(prep)}</span>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('preps.selectedIngredients', 'Selected Components')}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedComponents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('preps.noIngredientsSelected', 'No ingredients or preps selected')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedComponents.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.type === 'ingredient' ? getDisplayName(item.ingredient) : t('preps.label', 'Prep:') + ' ' + getDisplayName(item.prep)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={e => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-20"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-sm text-muted-foreground w-12">
                      {item.type === 'ingredient' ? item.unit : t('preps.unit', 'g')}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(idx)} className="h-8 w-8 p-0 text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 