import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus, X, CheckCircle, AlertTriangle, Save, Edit3, Database, Tag, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkIngredient {
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  unit: string;
  category_id: string;
  cost_per_unit?: number;
  allergens: string[];
  dietary_properties: string[];
  seasonal_availability: string[];
  supplier_info?: string;
  notes?: string;
  isNew: boolean;
  confidence: number;
  source: 'speech' | 'ai' | 'manual' | 'bulk';
}

interface IngredientCategory {
  id: string;
  name: string;
}

interface BulkIngredientCreationProps {
  onConfirm: (ingredients: BulkIngredient[]) => void;
  onCancel: () => void;
  className?: string;
}

const ALLERGEN_OPTIONS = [
  'gluten', 'dairy', 'eggs', 'fish', 'shellfish', 'tree_nuts', 'peanuts', 'soy', 'wheat'
];

const DIETARY_PROPERTIES = [
  'vegan', 'vegetarian', 'organic', 'gluten_free', 'dairy_free', 'low_carb', 'high_protein', 'low_fat'
];

const SEASONAL_AVAILABILITY = [
  'spring', 'summer', 'autumn', 'winter', 'year_round'
];

const UNIT_OPTIONS = [
  'g', 'kg', 'ml', 'l', 'pieces', 'cups', 'tablespoons', 'teaspoons', 'ounces', 'pounds'
];

export const BulkIngredientCreation: React.FC<BulkIngredientCreationProps> = ({
  onConfirm,
  onCancel,
  className = '',
}) => {
  const [ingredients, setIngredients] = useState<BulkIngredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<BulkIngredient | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const { toast } = useToast();

  // Default values for bulk creation
  const [defaultValues, setDefaultValues] = useState({
    unit: 'g',
    category_id: '',
    cost_per_unit: undefined as number | undefined,
    allergens: [] as string[],
    dietary_properties: [] as string[],
    seasonal_availability: [] as string[],
    supplier_info: '',
    notes: '',
  });

  useEffect(() => {
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
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load ingredient categories.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateIngredient = (ingredient: BulkIngredient, index: number): string[] => {
    const errors: string[] = [];

    if (!ingredient.name.trim()) {
      errors.push('Name is required');
    } else if (ingredient.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (ingredient.name.length > 50) {
      errors.push('Name must be less than 50 characters');
    }

    if (!ingredient.category_id) {
      errors.push('Category is required');
    }

    if (ingredient.cost_per_unit !== undefined && ingredient.cost_per_unit < 0) {
      errors.push('Cost cannot be negative');
    }

    return errors;
  };

  const addIngredient = () => {
    const newIngredient: BulkIngredient = {
      name: '',
      unit: defaultValues.unit,
      category_id: defaultValues.category_id,
      cost_per_unit: defaultValues.cost_per_unit,
      allergens: [...defaultValues.allergens],
      dietary_properties: [...defaultValues.dietary_properties],
      seasonal_availability: [...defaultValues.seasonal_availability],
      supplier_info: defaultValues.supplier_info,
      notes: defaultValues.notes,
      isNew: true,
      confidence: 0.8,
      source: 'bulk',
    };

    setIngredients(prev => [...prev, newIngredient]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const updateIngredient = (index: number, updates: Partial<BulkIngredient>) => {
    setIngredients(prev => 
      prev.map((ingredient, i) => 
        i === index ? { ...ingredient, ...updates } : ingredient
      )
    );
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...ingredients[index] });
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const handleSaveEdit = (index: number) => {
    if (!editData) return;

    const errors = validateIngredient(editData, index);
    if (errors.length > 0) {
      setValidationErrors(prev => ({ ...prev, [index]: errors }));
      return;
    }

    updateIngredient(index, editData);
    setEditingIndex(null);
    setEditData(null);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditData(null);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[editingIndex!];
      return newErrors;
    });
  };

  const handleBulkImport = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newIngredients: BulkIngredient[] = lines.map(name => ({
      name: name.trim(),
      unit: defaultValues.unit,
      category_id: defaultValues.category_id,
      cost_per_unit: defaultValues.cost_per_unit,
      allergens: [...defaultValues.allergens],
      dietary_properties: [...defaultValues.dietary_properties],
      seasonal_availability: [...defaultValues.seasonal_availability],
      supplier_info: defaultValues.supplier_info,
      notes: defaultValues.notes,
      isNew: true,
      confidence: 0.8,
      source: 'bulk',
    }));

    setIngredients(prev => [...prev, ...newIngredients]);
    toast({
      title: "Ingredients Added",
      description: `Added ${newIngredients.length} ingredients from text import.`,
    });
  };

  const handleConfirmAll = async () => {
    // Validate all ingredients
    const allErrors: Record<number, string[]> = {};
    let hasErrors = false;

    ingredients.forEach((ingredient, index) => {
      const errors = validateIngredient(ingredient, index);
      if (errors.length > 0) {
        allErrors[index] = errors;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setValidationErrors(allErrors);
      return;
    }

    if (ingredients.length === 0) {
      toast({
        title: "No Ingredients",
        description: "Please add at least one ingredient before confirming.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create ingredients in database
      const ingredientsToCreate = ingredients.map(ingredient => ({
        name: ingredient.name,
        name_de: ingredient.name_de || ingredient.name,
        name_en: ingredient.name_en || ingredient.name,
        description: ingredient.description || '',
        description_de: ingredient.description_de || ingredient.description || '',
        description_en: ingredient.description_en || ingredient.description || '',
        unit: ingredient.unit,
        category_id: ingredient.category_id,
        cost_per_unit: ingredient.cost_per_unit || 0,
        allergens: ingredient.allergens || [],
        dietary_properties: ingredient.dietary_properties || [],
        seasonal_availability: ingredient.seasonal_availability || [],
        supplier_info: ingredient.supplier_info || '',
        notes: ingredient.notes || '',
        is_active: true,
      }));

      const { error } = await supabase
        .from('ingredients')
        .insert(ingredientsToCreate);

      if (error) throw error;

      toast({
        title: "Ingredients Created",
        description: `Successfully created ${ingredientsToCreate.length} new ingredients.`,
      });

      onConfirm(ingredients);
    } catch (error) {
      console.error('Error creating ingredients:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create ingredients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleDefaultArrayField = (
    field: 'allergens' | 'dietary_properties' | 'seasonal_availability',
    value: string
  ) => {
    const currentArray = defaultValues[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setDefaultValues(prev => ({ ...prev, [field]: newArray }));
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            Bulk Ingredient Creation
            <Badge variant="outline" className="text-xs ml-auto">
              {ingredients.length} ingredients
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Default Values Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Values</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Default Unit</Label>
                  <Select
                    value={defaultValues.unit}
                    onValueChange={(value) => setDefaultValues(prev => ({ ...prev, unit: value }))}
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
                  <Label>Default Category</Label>
                  <Select
                    value={defaultValues.category_id}
                    onValueChange={(value) => setDefaultValues(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Cost (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={defaultValues.cost_per_unit || ''}
                    onChange={(e) => setDefaultValues(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || undefined }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Default Dietary Properties</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DIETARY_PROPERTIES.map((property) => (
                    <div key={property} className="flex items-center space-x-2">
                      <Checkbox
                        id={`default-dietary-${property}`}
                        checked={defaultValues.dietary_properties.includes(property)}
                        onCheckedChange={() => toggleDefaultArrayField('dietary_properties', property)}
                      />
                      <Label htmlFor={`default-dietary-${property}`} className="text-sm capitalize">
                        {property.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bulk Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Import from Text (one ingredient per line)</Label>
                <Textarea
                  placeholder="Enter ingredient names, one per line:
Tofu
Quinoa
Chickpeas
..."
                  rows={4}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      handleBulkImport(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={addIngredient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Single Ingredient
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingredients to Create</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ingredients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No ingredients added yet.</p>
                  <p className="text-sm">Use the bulk import or add ingredients manually above.</p>
                </div>
              ) : (
                ingredients.map((ingredient, index) => {
                  const isEditing = editingIndex === index;
                  const errors = validationErrors[index] || [];
                  const hasErrors = errors.length > 0;
                  const category = categories.find(c => c.id === ingredient.category_id);

                  return (
                    <Card
                      key={index}
                      className={cn(
                        'transition-all duration-200',
                        hasErrors ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      )}
                    >
                      <CardContent className="p-4">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Name *</Label>
                                <Input
                                  value={editData?.name || ''}
                                  onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
                                  className={cn(
                                    'text-sm',
                                    errors.includes('Name is required') && 'border-red-300'
                                  )}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Category *</Label>
                                <Select
                                  value={editData?.category_id || ''}
                                  onValueChange={(value) => setEditData(prev => prev ? { ...prev, category_id: value } : null)}
                                >
                                  <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Unit</Label>
                                <Select
                                  value={editData?.unit || ''}
                                  onValueChange={(value) => setEditData(prev => prev ? { ...prev, unit: value } : null)}
                                >
                                  <SelectTrigger className="text-sm">
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
                                <Label className="text-sm font-medium">Cost (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editData?.cost_per_unit || ''}
                                  onChange={(e) => setEditData(prev => prev ? { ...prev, cost_per_unit: parseFloat(e.target.value) || undefined } : null)}
                                  placeholder="0.00"
                                  className="text-sm"
                                />
                              </div>
                            </div>

                            {/* Error Messages */}
                            {errors.length > 0 && (
                              <div className="space-y-1">
                                {errors.map((error, errorIndex) => (
                                  <p key={errorIndex} className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {error}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Edit Actions */}
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveEdit(index)}>
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-blue-600">
                                <Database className="h-3 w-3" />
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {ingredient.name}
                                  </span>
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    New
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <span>{category?.name || 'Unknown Category'}</span>
                                  {ingredient.unit && <span>• {ingredient.unit}</span>}
                                  {ingredient.cost_per_unit !== undefined && <span>• €{ingredient.cost_per_unit.toFixed(2)}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(index)}
                                className="p-1 h-6"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeIngredient(index)}
                                className="p-1 h-6 text-red-500 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleConfirmAll}
              disabled={ingredients.length === 0 || Object.keys(validationErrors).length > 0 || isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create {ingredients.length} Ingredients
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isCreating}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 