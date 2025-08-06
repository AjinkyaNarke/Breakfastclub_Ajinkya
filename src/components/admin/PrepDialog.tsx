import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Calculator, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PrepIngredientSelector } from './PrepIngredientSelector';
import { 
  EnhancedPrep, 
  PrepFormData, 
  PrepIngredientFormData,
  PrepIngredientWithIngredient,
  PrepDialogProps as PrepDialogPropsType
} from '@/types/preps';
import { Database } from '@/integrations/supabase/types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];

export const PrepDialog = ({ open, onOpenChange, prep, onSave }: PrepDialogPropsType) => {
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ingredientSelectorOpen, setIngredientSelectorOpen] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<PrepIngredientWithIngredient[]>([]);
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<PrepFormData>({
    name: '',
    name_de: '',
    name_en: '',
    description: '',
    description_de: '',
    description_en: '',
    batch_yield: '',
    cost_per_batch: 0,
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      fetchIngredients();
      if (prep) {
        setFormData(prep);
        // TODO: Fetch prep ingredients when backend is ready
        // fetchPrepIngredients(prep.id);
      } else {
        setFormData({
          name: '',
          name_de: '',
          name_en: '',
          description: '',
          description_de: '',
          description_en: '',
          batch_yield: '',
          cost_per_batch: 0,
          notes: '',
          is_active: true,
        });
        setSelectedIngredients([]);
      }
    }
  }, [open, prep]);

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

  const handleInputChange = (field: keyof Prep, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddIngredient = (ingredient: Ingredient) => {
    const existingIndex = selectedIngredients.findIndex(
      item => item.ingredient_id === ingredient.id
    );

    if (existingIndex >= 0) {
      // Update existing ingredient quantity
      setSelectedIngredients(prev => prev.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Add new ingredient
      const newPrepIngredient: PrepIngredient = {
        ingredient_id: ingredient.id,
        quantity: 1,
        unit: ingredient.unit,
        ingredient: ingredient
      };
      setSelectedIngredients(prev => [...prev, newPrepIngredient]);
    }
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => prev.filter(item => item.ingredient_id !== ingredientId));
  };

  const handleIngredientQuantityChange = (ingredientId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveIngredient(ingredientId);
      return;
    }
    
    setSelectedIngredients(prev => prev.map(item =>
      item.ingredient_id === ingredientId
        ? { ...item, quantity }
        : item
    ));
  };

  const calculateTotalCost = () => {
    return selectedIngredients.reduce((total, item) => {
      return total + (item.ingredient.cost_per_unit * item.quantity);
    }, 0);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: t('preps.validationError', 'Validation Error'),
        description: t('preps.nameRequired', 'Prep name is required'),
        variant: 'destructive',
      });
      return;
    }

    if (selectedIngredients.length === 0) {
      toast({
        title: t('preps.validationError', 'Validation Error'),
        description: t('preps.ingredientsRequired', 'At least one ingredient is required'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      // TODO: Replace with actual API call once backend is implemented
      const totalCost = calculateTotalCost();
      const saveData = {
        ...formData,
        cost_per_batch: totalCost,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving prep:', saveData);
      console.log('Selected ingredients:', selectedIngredients);

      toast({
        title: t('preps.saveSuccess', 'Success'),
        description: prep 
          ? t('preps.updateSuccessDescription', 'Prep updated successfully')
          : t('preps.createSuccessDescription', 'Prep created successfully'),
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving prep:', error);
      toast({
        title: t('preps.saveError', 'Error'),
        description: t('preps.saveErrorDescription', 'Failed to save prep'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getDisplayName = (ingredient: Ingredient) => {
    const currentLang = t('language') === 'de' ? 'de' : 'en';
    return ingredient[`name_${currentLang}`] || ingredient.name;
  };

  const totalCost = calculateTotalCost();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {prep ? t('preps.editTitle', 'Edit Prep') : t('preps.createTitle', 'Create New Prep')}
          </DialogTitle>
          <DialogDescription>
            {t('preps.dialogDescription', 'Create or edit an intermediate prep with ingredients and cost tracking')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('preps.basicInfo', 'Basic Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name_en">{t('preps.nameEn', 'Name (English)')} *</Label>
                    <Input
                      id="name_en"
                      value={formData.name_en}
                      onChange={(e) => handleInputChange('name_en', e.target.value)}
                      placeholder={t('preps.nameEnPlaceholder', 'e.g., Green Curry Paste')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name_de">{t('preps.nameDe', 'Name (German)')}</Label>
                    <Input
                      id="name_de"
                      value={formData.name_de}
                      onChange={(e) => handleInputChange('name_de', e.target.value)}
                      placeholder={t('preps.nameDePlaceholder', 'e.g., Grüne Curry-Paste')}
                    />
                  </div>
                </div>

                {/* Description Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description_en">{t('preps.descriptionEn', 'Description (English)')}</Label>
                    <Textarea
                      id="description_en"
                      value={formData.description_en}
                      onChange={(e) => handleInputChange('description_en', e.target.value)}
                      placeholder={t('preps.descriptionEnPlaceholder', 'Brief description...')}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_de">{t('preps.descriptionDe', 'Description (German)')}</Label>
                    <Textarea
                      id="description_de"
                      value={formData.description_de}
                      onChange={(e) => handleInputChange('description_de', e.target.value)}
                      placeholder={t('preps.descriptionDePlaceholder', 'Kurze Beschreibung...')}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Batch Yield */}
                <div>
                  <Label htmlFor="batch_yield">{t('preps.batchYield', 'Batch Yield')} *</Label>
                  <Input
                    id="batch_yield"
                    value={formData.batch_yield}
                    onChange={(e) => handleInputChange('batch_yield', e.target.value)}
                    placeholder={t('preps.batchYieldPlaceholder', 'e.g., 500ml, 1kg, 10 portions')}
                  />
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">{t('preps.notes', 'Notes')}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder={t('preps.notesPlaceholder', 'Storage instructions, tips, etc.')}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Ingredients */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t('preps.ingredients', 'Ingredients')}</CardTitle>
                  <Button
                    onClick={() => setShowIngredientSelector(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t('preps.addIngredient', 'Add Ingredient')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedIngredients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('preps.noIngredientsSelected', 'No ingredients selected')}</p>
                    <Button
                      onClick={() => setShowIngredientSelector(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      {t('preps.selectIngredients', 'Select Ingredients')}
                    </Button>
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
                            {item.ingredient.category?.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleIngredientQuantityChange(item.ingredient_id, parseFloat(e.target.value) || 0)}
                            className="w-20"
                            min="0"
                            step="0.1"
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
                            onClick={() => handleRemoveIngredient(item.ingredient_id)}
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
                      <span className="font-medium">{t('preps.totalCost', 'Total Cost per Batch')}:</span>
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-green-600" />
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
            disabled={saving}
          >
            {t('preps.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.name_en.trim() || selectedIngredients.length === 0}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            {saving ? t('preps.saving', 'Saving...') : t('preps.save', 'Save Prep')}
          </Button>
        </div>

        {/* Ingredient Selector Component */}
        <PrepIngredientSelector
          open={showIngredientSelector}
          onOpenChange={setShowIngredientSelector}
          selectedIngredients={selectedIngredients}
          onIngredientsChange={setSelectedIngredients}
        />
      </DialogContent>
    </Dialog>
  );
}; 