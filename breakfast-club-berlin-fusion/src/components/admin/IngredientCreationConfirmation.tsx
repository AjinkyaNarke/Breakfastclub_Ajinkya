import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, X, AlertTriangle, Save, Edit3, Plus, Database, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface IngredientToCreate {
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
  source: 'speech' | 'ai' | 'manual';
}

interface IngredientCategory {
  id: string;
  name: string;
}

interface IngredientCreationConfirmationProps {
  ingredients: IngredientToCreate[];
  categories: IngredientCategory[];
  onConfirm: (ingredients: IngredientToCreate[]) => void;
  onCancel: () => void;
  onEdit: (index: number, ingredient: IngredientToCreate) => void;
  className?: string;
}

export const IngredientCreationConfirmation: React.FC<IngredientCreationConfirmationProps> = ({
  ingredients,
  categories,
  onConfirm,
  onCancel,
  onEdit,
  className = '',
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<IngredientToCreate | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const validateIngredient = (ingredient: IngredientToCreate, index: number): string[] => {
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

    onEdit(index, editData);
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

    setIsCreating(true);
    try {
      // Create ingredients in database
      const ingredientsToCreate = ingredients.filter(i => i.isNew).map(ingredient => ({
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

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'speech': return <Database className="h-3 w-3" />;
      case 'ai': return <Tag className="h-3 w-3" />;
      case 'manual': return <Edit3 className="h-3 w-3" />;
      default: return <Database className="h-3 w-3" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'speech': return 'text-blue-600';
      case 'ai': return 'text-purple-600';
      case 'manual': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const newIngredients = ingredients.filter(i => i.isNew);
  const existingIngredients = ingredients.filter(i => !i.isNew);

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            Confirm Ingredient Creation
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="outline" className="text-xs">
                {newIngredients.length} new
              </Badge>
              <Badge variant="outline" className="text-xs">
                {existingIngredients.length} existing
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Creation Summary</span>
              </div>
              <div className="text-sm text-blue-600 space-y-1">
                <p>{newIngredients.length} new ingredients will be created in the database.</p>
                <p>{existingIngredients.length} ingredients already exist and will be skipped.</p>
                <p>Please review and edit the details below before confirming.</p>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Ingredients to Process</h4>
            
            {ingredients.map((ingredient, index) => {
              const isEditing = editingIndex === index;
              const errors = validationErrors[index] || [];
              const hasErrors = errors.length > 0;
              const category = categories.find(c => c.id === ingredient.category_id);

              return (
                <Card
                  key={index}
                  className={cn(
                    'transition-all duration-200',
                    hasErrors ? 'border-red-200 bg-red-50' :
                    ingredient.isNew ? 'border-green-200 bg-green-50' :
                    'border-gray-200 bg-gray-50'
                  )}
                >
                  <CardContent className="p-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Unit</Label>
                            <Input
                              value={editData?.unit || ''}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, unit: e.target.value } : null)}
                              placeholder="e.g., kg, pieces"
                              className="text-sm"
                            />
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

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Description</Label>
                          <Textarea
                            value={editData?.description || ''}
                            onChange={(e) => setEditData(prev => prev ? { ...prev, description: e.target.value } : null)}
                            placeholder="Optional description..."
                            rows={2}
                            className="text-sm"
                          />
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
                          <div className={cn(
                            'flex items-center gap-1',
                            getSourceColor(ingredient.source)
                          )}>
                            {getSourceIcon(ingredient.source)}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {ingredient.name}
                              </span>
                              {ingredient.isNew && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  New
                                </Badge>
                              )}
                              {!ingredient.isNew && (
                                <Badge variant="outline" className="text-xs text-gray-600">
                                  Existing
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span>{category?.name || 'Unknown Category'}</span>
                              {ingredient.unit && <span>• {ingredient.unit}</span>}
                              {ingredient.cost_per_unit !== undefined && <span>• €{ingredient.cost_per_unit.toFixed(2)}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-mono',
                            getConfidenceColor(ingredient.confidence)
                          )}>
                            {(ingredient.confidence * 100).toFixed(0)}%
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(index)}
                            className="p-1 h-6"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleConfirmAll}
              disabled={Object.keys(validationErrors).length > 0 || isCreating}
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
                  Create {newIngredients.length} Ingredients
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