
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Search, Package, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

import { BulkVoiceIngredientCreation } from '@/components/admin/BulkVoiceIngredientCreation';
import { StreamlinedIngredientDialog } from '@/components/admin/StreamlinedIngredientDialog';
import { IngredientImage } from '@/components/IngredientImage';

interface Ingredient {
  id: string;
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  unit: string;
  category_id: string;
  allergens: string[];
  dietary_properties: string[];
  seasonal_availability: string[];
  cost_per_unit?: number;
  supplier_info?: string;
  notes?: string;
  is_active: boolean;
  image_url?: string;
  image_generated_at?: string;
  image_generation_cost?: number;
  image_generation_prompt?: string;
  category?: {
    name: string;
  };
}

interface IngredientCategory {
  id: string;
  name: string;
  description?: string;
}



export const IngredientManagement = () => {
  const { t } = useTranslation('admin');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<{ [id: string]: string | null }>({}); // { [ingredientId]: 'delete' | null }
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Form data is now handled by StreamlinedIngredientDialog component
  // We only need to track the editing item for the dialog

  // The StreamlinedIngredientDialog handles its own form state
  // No need to manage form data here anymore

  // Auto-translation is now handled by the StreamlinedIngredientDialog component

  useEffect(() => {
    fetchIngredients();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          category:ingredient_categories(name)
        `)
        .order('name');

      if (error) throw error;
      setIngredients(
        (data || []).map((item: any) => ({
          id: item.id,
          name: item.name || '',
          name_de: item.name_de || '',
          name_en: item.name_en || '',
          description: item.description || '',
          description_de: item.description_de || '',
          description_en: item.description_en || '',
          unit: item.unit || 'g',
          category_id: item.category_id || '',
          allergens: item.allergens || [],
          dietary_properties: item.dietary_properties || [],
          seasonal_availability: item.seasonal_availability || [],
          cost_per_unit: item.cost_per_unit || 0,
          supplier_info: item.supplier_info || '',
          notes: item.notes || '',
          is_active: item.is_active !== false,
          image_url: item.image_url || null,
          image_generated_at: item.image_generated_at || null,
          image_generation_cost: item.image_generation_cost || null,
          image_generation_prompt: item.image_generation_prompt || null,
          category: item.category || { name: '' },
        }))
      );
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ingredients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ingredient.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item: Ingredient) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  // On save, the StreamlinedIngredientDialog handles the actual saving
  // This function is just called after successful save to refresh the list
  const handleSave = async () => {
    // The StreamlinedIngredientDialog component handles all validation and saving internally
    // We just need to refresh the ingredients list after successful save
    await fetchIngredients();
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    setActionLoading(prev => ({ ...prev, [id]: 'delete' }));
    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Ingredient deleted successfully",
      });
      fetchIngredients();
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast({
        title: "Error",
        description: "Failed to delete ingredient",
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('ingredients.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('ingredients.title')}</h1>
          <p className="text-muted-foreground">
            {t('ingredients.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <Mic className="h-4 w-4 mr-2" />
            Bulk Add Ingredients
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('ingredients.addIngredient')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('menu.filtersAndSearch')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('ingredients.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('ingredients.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('ingredients.allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            {t('ingredients.showingItems', { count: filteredIngredients.length, total: ingredients.length })}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIngredients.map((ingredient) => (
          <Card key={ingredient.id}>
            <CardHeader>
              <div className="flex gap-3 items-start">
                <IngredientImage 
                  ingredient={ingredient} 
                  size="md"
                  showGenerateButton={!ingredient.image_url}
                  onImageGenerated={fetchIngredients}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{ingredient.name}</CardTitle>
                      <CardDescription>
                        {ingredient.category?.name} • {ingredient.unit}
                        {ingredient.cost_per_unit && (
                          <span> • €{ingredient.cost_per_unit}/{ingredient.unit}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={ingredient.is_active ? "default" : "secondary"}>
                      {ingredient.is_active ? t('ingredients.active') : t('ingredients.inactive')}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {ingredient.dietary_properties && ingredient.dietary_properties.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Dietary Properties</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ingredient.dietary_properties.map((prop) => (
                        <Badge key={prop} variant="outline" className="text-xs">
                          {t(`ingredients.dietary.${prop}`, prop)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {ingredient.allergens && ingredient.allergens.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Allergens</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ingredient.allergens.map((allergen) => (
                        <Badge key={allergen} variant="destructive" className="text-xs">
                          {t(`ingredients.allergens.${allergen}`, allergen)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {ingredient.seasonal_availability && ingredient.seasonal_availability.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Seasonal Availability</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ingredient.seasonal_availability.map((season) => (
                        <Badge key={season} variant="secondary" className="text-xs">
                          {t(`ingredients.seasons.${season}`, season)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(ingredient)}
                    aria-label="Edit Ingredient"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteIngredient(ingredient.id)}
                    aria-label="Delete Ingredient"
                    disabled={actionLoading[ingredient.id] === 'delete'}
                  >
                    {actionLoading[ingredient.id] === 'delete' ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIngredients.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {ingredients.length === 0 ? t('ingredients.noIngredients') : t('ingredients.noIngredientsMatch')}
          </p>
          {ingredients.length === 0 && (
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              {t('ingredients.addFirstIngredient')}
            </Button>
          )}
        </div>
      )}

      {/* Ingredient Dialog */}
      <StreamlinedIngredientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ingredient={editingItem}
        onSave={handleSave}
      />

      {/* Bulk Voice Ingredient Creation Dialog */}
      <BulkVoiceIngredientCreation
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        onComplete={fetchIngredients}
      />


    </div>
  );
};
