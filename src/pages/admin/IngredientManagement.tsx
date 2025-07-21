
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  supplier_info?: string;
  notes?: string;
  is_active: boolean;
  category?: {
    name: string;
  };
}

interface IngredientCategory {
  id: string;
  name: string;
  description?: string;
}

const ALLERGEN_OPTIONS = [
  'gluten', 'dairy', 'eggs', 'fish', 'shellfish', 'nuts', 'peanuts', 'soy', 'sesame'
];

const DIETARY_PROPERTY_OPTIONS = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-sodium', 'organic', 'local'
];

const SEASON_OPTIONS = ['spring', 'summer', 'fall', 'winter'];

const UNIT_OPTIONS = ['g', 'kg', 'ml', 'l', 'piece', 'cup', 'tbsp', 'tsp', 'oz', 'lb'];

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

  const [formData, setFormData] = useState<Partial<Ingredient>>({
    name: '',
    unit: 'g',
    category_id: '',
    allergens: [],
    dietary_properties: [],
    seasonal_availability: [],
    cost_per_unit: 0,
    supplier_info: '',
    notes: '',
    is_active: true,
  });

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
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item: Ingredient) => {
    setEditingItem(item);
    setFormData({ ...item });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      unit: 'g',
      category_id: '',
      allergens: [],
      dietary_properties: [],
      seasonal_availability: [],
      cost_per_unit: 0,
      supplier_info: '',
      notes: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category_id) {
      toast({
        title: t('ingredients.messages.fillRequired'),
        description: t('ingredients.messages.fillRequired'),
        variant: "destructive",
      });
      return;
    }

    try {
      const saveData = {
        name: formData.name!,
        unit: formData.unit!,
        category_id: formData.category_id!,
        cost_per_unit: formData.cost_per_unit,
        supplier_info: formData.supplier_info,
        notes: formData.notes,
        is_active: formData.is_active!,
        allergens: formData.allergens || [],
        dietary_properties: formData.dietary_properties || [],
        seasonal_availability: formData.seasonal_availability || [],
      };

      if (editingItem?.id) {
        const { error } = await supabase
          .from('ingredients')
          .update(saveData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ingredients')
          .insert([saveData]);
        if (error) throw error;
      }

      toast({
        title: editingItem?.id ? t('ingredients.messages.updateSuccess') : t('ingredients.messages.createSuccess'),
        description: editingItem?.id ? t('ingredients.messages.updateSuccess') : t('ingredients.messages.createSuccess'),
      });

      setDialogOpen(false);
      fetchIngredients();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      toast({
        title: editingItem?.id ? t('ingredients.messages.updateError') : t('ingredients.messages.createError'),
        description: editingItem?.id ? t('ingredients.messages.updateError') : t('ingredients.messages.createError'),
        variant: "destructive",
      });
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm(t('ingredients.deleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('ingredients.messages.deleteSuccess'),
        description: t('ingredients.messages.deleteSuccess'),
      });
      
      fetchIngredients();
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast({
        title: t('ingredients.messages.deleteError'),
        description: t('ingredients.messages.deleteError'),
        variant: "destructive",
      });
    }
  };

  const toggleMultiSelect = (
    field: keyof Pick<Ingredient, 'allergens' | 'dietary_properties' | 'seasonal_availability'>,
    value: string
  ) => {
    const currentArray = formData[field] as string[] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setFormData(prev => ({ ...prev, [field]: newArray }));
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
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('ingredients.addIngredient')}
        </Button>
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
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {ingredient.dietary_properties && ingredient.dietary_properties.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('ingredients.form.dietaryProperties')}</Label>
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
                    <Label className="text-xs text-muted-foreground">{t('ingredients.form.allergens')}</Label>
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
                    <Label className="text-xs text-muted-foreground">{t('ingredients.form.seasonalAvailability')}</Label>
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
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteIngredient(ingredient.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id ? t('ingredients.form.editTitle') : t('ingredients.form.createNew')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('ingredients.form.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('ingredients.form.namePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('ingredients.form.category')} *</Label>
                <Select
                  value={formData.category_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('ingredients.form.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">{t('ingredients.form.unit')}</Label>
                <Select
                  value={formData.unit || 'g'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">{t('ingredients.form.costPerUnit')}</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                  placeholder={t('ingredients.form.costPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('ingredients.form.dietaryProperties')}</Label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_PROPERTY_OPTIONS.map((prop) => (
                  <Badge
                    key={prop}
                    variant={formData.dietary_properties?.includes(prop) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMultiSelect('dietary_properties', prop)}
                  >
                    {t(`ingredients.dietary.${prop}`, prop)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('ingredients.form.allergens')}</Label>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((allergen) => (
                  <Badge
                    key={allergen}
                    variant={formData.allergens?.includes(allergen) ? "destructive" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMultiSelect('allergens', allergen)}
                  >
                    {t(`ingredients.allergens.${allergen}`, allergen)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('ingredients.form.seasonalAvailability')}</Label>
              <div className="flex flex-wrap gap-2">
                {SEASON_OPTIONS.map((season) => (
                  <Badge
                    key={season}
                    variant={formData.seasonal_availability?.includes(season) ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMultiSelect('seasonal_availability', season)}
                  >
                    {t(`ingredients.seasons.${season}`, season)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">{t('ingredients.form.supplierInfo')}</Label>
              <Input
                id="supplier"
                value={formData.supplier_info || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_info: e.target.value }))}
                placeholder={t('ingredients.form.supplierPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('ingredients.form.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('ingredients.form.notesPlaceholder')}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="active">{t('ingredients.form.active')}</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('ingredients.form.cancel')}
              </Button>
              <Button onClick={handleSave}>
                {t('ingredients.form.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
