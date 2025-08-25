import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Edit3, Save, X, Eye, EyeOff, CheckCircle, AlertTriangle, Database, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface IngredientPreview {
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
  confidence: number;
  source: 'speech' | 'ai' | 'manual';
  isNew: boolean;
}

interface IngredientCategory {
  id: string;
  name: string;
}

interface IngredientPreviewEditorProps {
  ingredient: IngredientPreview;
  categories: IngredientCategory[];
  onSave: (ingredient: IngredientPreview) => void;
  onCancel: () => void;
  onDelete?: () => void;
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

export const IngredientPreviewEditor: React.FC<IngredientPreviewEditorProps> = ({
  ingredient,
  categories,
  onSave,
  onCancel,
  onDelete,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<IngredientPreview>(ingredient);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditData(ingredient);
  }, [ingredient]);

  const validateIngredient = (data: IngredientPreview): string[] => {
    const errors: string[] = [];

    if (!data.name.trim()) {
      errors.push('Name is required');
    } else if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (data.name.length > 50) {
      errors.push('Name must be less than 50 characters');
    }

    if (!data.category_id) {
      errors.push('Category is required');
    }

    if (data.cost_per_unit !== undefined && data.cost_per_unit < 0) {
      errors.push('Cost cannot be negative');
    }

    return errors;
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setValidationErrors([]);
  };

  const handleSave = async () => {
    const errors = validateIngredient(editData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      onSave(editData);
      setIsEditing(false);
      setValidationErrors([]);
      toast({
        title: "Ingredient Updated",
        description: "Ingredient details have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving ingredient:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save ingredient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(ingredient);
    setValidationErrors([]);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (!confirm('Are you sure you want to delete this ingredient?')) {
      return;
    }

    try {
      onDelete();
      toast({
        title: "Ingredient Deleted",
        description: "Ingredient has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete ingredient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleArrayField = (
    field: 'allergens' | 'dietary_properties' | 'seasonal_availability',
    value: string
  ) => {
    const currentArray = editData[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setEditData(prev => ({ ...prev, [field]: newArray }));
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

  const category = categories.find(c => c.id === editData.category_id);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isEditing ? <Edit3 className="h-5 w-5 text-blue-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
            {isEditing ? 'Edit Ingredient' : 'Ingredient Preview'}
            <div className="flex items-center gap-2">
              {editData.isNew && (
                <Badge variant="outline" className="text-xs text-green-600">
                  New
                </Badge>
              )}
              <div className={cn(
                'flex items-center gap-1',
                getSourceColor(editData.source)
              )}>
                {getSourceIcon(editData.source)}
                <span className="text-xs capitalize">{editData.source}</span>
              </div>
              <span className={cn(
                'text-xs font-mono',
                getConfidenceColor(editData.confidence)
              )}>
                {(editData.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button size="sm" variant="outline" onClick={handleStartEdit}>
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <X className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className={cn(
                    validationErrors.includes('Name is required') && 'border-red-300'
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={editData.category_id}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, category_id: value }))}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={editData.unit}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, unit: value }))}
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
                <Label htmlFor="cost">Cost per Unit (€)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={editData.cost_per_unit || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || undefined }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Multi-language Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_de">German Name</Label>
                <Input
                  id="name_de"
                  value={editData.name_de || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, name_de: e.target.value }))}
                  placeholder="German name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">English Name</Label>
                <Input
                  id="name_en"
                  value={editData.name_en || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="English name"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editData.description || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ingredient description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description_de">German Description</Label>
                <Textarea
                  id="description_de"
                  value={editData.description_de || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, description_de: e.target.value }))}
                  placeholder="German description..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_en">English Description</Label>
                <Textarea
                  id="description_en"
                  value={editData.description_en || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, description_en: e.target.value }))}
                  placeholder="English description..."
                  rows={2}
                />
              </div>
            </div>

            {/* Allergens */}
            <div className="space-y-2">
              <Label>Allergens</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ALLERGEN_OPTIONS.map((allergen) => (
                  <div key={allergen} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergen-${allergen}`}
                      checked={editData.allergens.includes(allergen)}
                      onCheckedChange={() => toggleArrayField('allergens', allergen)}
                    />
                    <Label htmlFor={`allergen-${allergen}`} className="text-sm capitalize">
                      {allergen.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Dietary Properties */}
            <div className="space-y-2">
              <Label>Dietary Properties</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {DIETARY_PROPERTIES.map((property) => (
                  <div key={property} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dietary-${property}`}
                      checked={editData.dietary_properties.includes(property)}
                      onCheckedChange={() => toggleArrayField('dietary_properties', property)}
                    />
                    <Label htmlFor={`dietary-${property}`} className="text-sm capitalize">
                      {property.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Availability */}
            <div className="space-y-2">
              <Label>Seasonal Availability</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SEASONAL_AVAILABILITY.map((season) => (
                  <div key={season} className="flex items-center space-x-2">
                    <Checkbox
                      id={`season-${season}`}
                      checked={editData.seasonal_availability.includes(season)}
                      onCheckedChange={() => toggleArrayField('seasonal_availability', season)}
                    />
                    <Label htmlFor={`season-${season}`} className="text-sm capitalize">
                      {season.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier Information</Label>
                <Input
                  id="supplier"
                  value={editData.supplier_info || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, supplier_info: e.target.value }))}
                  placeholder="Supplier details..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={editData.notes || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Error Messages */}
            {validationErrors.length > 0 && (
              <div className="space-y-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {error}
                  </p>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex-1" disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <p className="text-sm">{editData.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Category</Label>
                <p className="text-sm">{category?.name || 'Unknown'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Unit</Label>
                <p className="text-sm">{editData.unit}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Cost per Unit</Label>
                <p className="text-sm">
                  {editData.cost_per_unit !== undefined ? `€${editData.cost_per_unit.toFixed(2)}` : 'Not set'}
                </p>
              </div>
            </div>

            {editData.description && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="text-sm">{editData.description}</p>
              </div>
            )}

            {(editData.allergens.length > 0 || editData.dietary_properties.length > 0) && (
              <div className="space-y-2">
                {editData.allergens.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Allergens</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {editData.allergens.map((allergen) => (
                        <Badge key={allergen} variant="outline" className="text-xs">
                          {allergen.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {editData.dietary_properties.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Dietary Properties</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {editData.dietary_properties.map((property) => (
                        <Badge key={property} variant="outline" className="text-xs">
                          {property.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {editData.supplier_info && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Supplier Information</Label>
                <p className="text-sm">{editData.supplier_info}</p>
              </div>
            )}

            {editData.notes && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Notes</Label>
                <p className="text-sm">{editData.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 