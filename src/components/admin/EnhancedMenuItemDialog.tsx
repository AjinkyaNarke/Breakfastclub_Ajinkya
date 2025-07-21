
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartIngredientSelector } from './SmartIngredientSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Wand2 } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  regular_price: number;
  student_price: number;
  category_id: string;
  is_featured: boolean;
  is_available: boolean;
  display_order: number;
  dietary_tags: string[];
  cuisine_type: string;
  image_url?: string;
}

interface SelectedIngredient {
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  ingredient: any;
}

interface EnhancedMenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  onSave: () => void;
}

export const EnhancedMenuItemDialog = ({ open, onOpenChange, item, onSave }: EnhancedMenuItemDialogProps) => {
  const { t } = useTranslation('admin');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    regular_price: 0,
    student_price: 0,
    category_id: '',
    is_featured: false,
    is_available: true,
    display_order: 0,
    cuisine_type: 'fusion',
    image_url: '',
  });

  useEffect(() => {
    fetchCategories();
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        regular_price: item.regular_price || 0,
        student_price: item.student_price || 0,
        category_id: item.category_id || '',
        is_featured: item.is_featured || false,
        is_available: item.is_available !== false,
        display_order: item.display_order || 0,
        cuisine_type: item.cuisine_type || 'fusion',
        image_url: item.image_url || '',
      });
      fetchMenuItemIngredients(item.id);
    } else {
      setFormData({
        name: '',
        description: '',
        regular_price: 0,
        student_price: 0,
        category_id: '',
        is_featured: false,
        is_available: true,
        display_order: 0,
        cuisine_type: 'fusion',
        image_url: '',
      });
      setSelectedIngredients([]);
    }
  }, [item, open]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMenuItemIngredients = async (menuItemId: string) => {
    try {
      const { data, error } = await supabase
        .from('menu_item_ingredients')
        .select(`
          ingredient_id, quantity, unit, notes,
          ingredient:ingredients(
            id, name, unit, category_id, allergens, dietary_properties,
            seasonal_availability, cost_per_unit,
            category:ingredient_categories(name)
          )
        `)
        .eq('menu_item_id', menuItemId);

      if (error) throw error;
      setSelectedIngredients(data || []);
    } catch (error) {
      console.error('Error fetching menu item ingredients:', error);
    }
  };

  const calculateTotalCost = () => {
    return selectedIngredients.reduce((total, si) => {
      const cost = si.ingredient?.cost_per_unit || 0;
      return total + (cost * si.quantity);
    }, 0);
  };

  const calculateProfitMargin = (price: number) => {
    const cost = calculateTotalCost();
    if (price === 0) return 0;
    return ((price - cost) / price * 100);
  };

  const generateDietaryTags = () => {
    const allProperties = new Set<string>();
    const allAllergens = new Set<string>();

    selectedIngredients.forEach(si => {
      si.ingredient?.dietary_properties?.forEach((prop: string) => allProperties.add(prop));
      si.ingredient?.allergens?.forEach((allergen: string) => allAllergens.add(allergen));
    });

    // Auto-generate dietary tags based on ingredients
    const dietaryTags = Array.from(allProperties);
    
    // Add allergen warnings
    const allergenTags = Array.from(allAllergens).map(allergen => `contains-${allergen}`);
    
    return [...dietaryTags, ...allergenTags];
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category_id) {
      toast({
        title: t('menu.messages.fillRequired'),
        description: t('menu.messages.fillRequired'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dietaryTags = generateDietaryTags();
      
      const saveData = {
        ...formData,
        dietary_tags: dietaryTags,
      };

      let menuItemId = item?.id;

      if (item?.id) {
        const { error } = await supabase
          .from('menu_items')
          .update(saveData)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('menu_items')
          .insert([saveData])
          .select('id')
          .single();
        if (error) throw error;
        menuItemId = data.id;
      }

      // Save ingredients
      if (menuItemId) {
        // Delete existing ingredients
        await supabase
          .from('menu_item_ingredients')
          .delete()
          .eq('menu_item_id', menuItemId);

        // Insert new ingredients
        if (selectedIngredients.length > 0) {
          const ingredientData = selectedIngredients.map(si => ({
            menu_item_id: menuItemId,
            ingredient_id: si.ingredient_id,
            quantity: si.quantity,
            unit: si.unit,
            notes: si.notes || '',
          }));

          const { error: ingredientError } = await supabase
            .from('menu_item_ingredients')
            .insert(ingredientData);

          if (ingredientError) throw ingredientError;
        }
      }

      toast({
        title: item?.id ? t('menu.messages.updateSuccess') : t('menu.messages.createSuccess'),
        description: item?.id ? t('menu.messages.updateSuccess') : t('menu.messages.createSuccess'),
      });

      onOpenChange(false);
      onSave();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: item?.id ? t('menu.messages.updateError') : t('menu.messages.createError'),
        description: item?.id ? t('menu.messages.updateError') : t('menu.messages.createError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCost = calculateTotalCost();
  const regularMargin = calculateProfitMargin(formData.regular_price);
  const studentMargin = calculateProfitMargin(formData.student_price);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item?.id ? t('menu.form.editTitle') : t('menu.form.createNew')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('menu.form.basicInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('menu.form.name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('menu.form.namePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('menu.form.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('menu.form.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">{t('menu.form.category')} *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('menu.form.selectCategory')} />
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

                <div className="space-y-2">
                  <Label htmlFor="cuisine">{t('menu.form.cuisineType')}</Label>
                  <Select
                    value={formData.cuisine_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cuisine_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fusion">Fusion</SelectItem>
                      <SelectItem value="korean">Korean</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Profitability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('menu.form.pricing')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="regular_price">{t('menu.form.regularPrice')}</Label>
                    <Input
                      id="regular_price"
                      type="number"
                      step="0.01"
                      value={formData.regular_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, regular_price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student_price">{t('menu.form.studentPrice')}</Label>
                    <Input
                      id="student_price"
                      type="number"
                      step="0.01"
                      value={formData.student_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, student_price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                {totalCost > 0 && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="text-sm font-medium">{t('menu.form.costAnalysis')}</div>
                    <div className="text-sm space-y-1">
                      <div>{t('menu.form.ingredientCost')}: €{totalCost.toFixed(2)}</div>
                      <div className={regularMargin > 50 ? "text-green-600" : regularMargin > 30 ? "text-yellow-600" : "text-red-600"}>
                        {t('menu.form.regularMargin')}: {regularMargin.toFixed(1)}%
                      </div>
                      <div className={studentMargin > 50 ? "text-green-600" : studentMargin > 30 ? "text-yellow-600" : "text-red-600"}>
                        {t('menu.form.studentMargin')}: {studentMargin.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                    />
                    <Label htmlFor="featured">{t('menu.form.featured')}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                    />
                    <Label htmlFor="available">{t('menu.form.available')}</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ingredients */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  {t('menu.form.ingredients')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SmartIngredientSelector
                  selectedIngredients={selectedIngredients}
                  onIngredientsChange={setSelectedIngredients}
                  menuItemId={item?.id}
                />
              </CardContent>
            </Card>

            {/* Auto-Generated Dietary Tags */}
            {selectedIngredients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('menu.form.autoDietaryTags')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {generateDietaryTags().map((tag) => (
                      <Badge 
                        key={tag} 
                        variant={tag.startsWith('contains-') ? "destructive" : "secondary"}
                      >
                        {t(`menu.dietary.${tag}`, tag)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('menu.form.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? t('menu.form.saving') : t('menu.form.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
