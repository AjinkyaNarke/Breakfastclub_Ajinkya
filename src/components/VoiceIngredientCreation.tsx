import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, CheckCircle, X, AlertTriangle, Save, Edit3, Tag, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface IngredientToCreate {
  name: string;
  category: string;
  description?: string;
  unit?: string;
  cost?: number;
  isNew: boolean;
  confidence: number;
  source: 'speech' | 'ai' | 'manual';
}

interface VoiceIngredientCreationProps {
  ingredients: IngredientToCreate[];
  existingCategories: string[];
  onConfirm: (ingredients: IngredientToCreate[]) => void;
  onCancel: () => void;
  onEdit: (index: number, ingredient: IngredientToCreate) => void;
  className?: string;
}

export const VoiceIngredientCreation: React.FC<VoiceIngredientCreationProps> = ({
  ingredients,
  existingCategories,
  onConfirm,
  onCancel,
  onEdit,
  className = '',
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<IngredientToCreate | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  const validateIngredient = (ingredient: IngredientToCreate, index: number): string[] => {
    const errors: string[] = [];

    if (!ingredient.name.trim()) {
      errors.push('Name is required');
    } else if (ingredient.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (ingredient.name.length > 50) {
      errors.push('Name must be less than 50 characters');
    }

    if (!ingredient.category) {
      errors.push('Category is required');
    }

    if (ingredient.cost !== undefined && ingredient.cost < 0) {
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

  const handleConfirmAll = () => {
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

    onConfirm(ingredients);
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
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-500" />
          Ingredient Creation
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="outline" className="text-xs">
              {newIngredients.length} new
            </Badge>
            <Badge variant="outline" className="text-xs">
              {existingIngredients.length} existing
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Creation Summary</span>
          </div>
          <div className="text-sm text-blue-600 space-y-1">
            <p>{newIngredients.length} new ingredients will be created.</p>
            <p>{existingIngredients.length} ingredients already exist in the database.</p>
          </div>
        </div>

        {/* Ingredients List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Ingredients to Process</h4>
          
          {ingredients.map((ingredient, index) => {
            const isEditing = editingIndex === index;
            const errors = validationErrors[index] || [];
            const hasErrors = errors.length > 0;

            return (
              <div
                key={index}
                className={cn(
                  'p-3 border rounded-lg transition-all duration-200',
                  hasErrors ? 'border-red-200 bg-red-50' :
                  ingredient.isNew ? 'border-green-200 bg-green-50' :
                  'border-gray-200 bg-gray-50'
                )}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Name *</Label>
                        <Input
                          value={editData?.name || ''}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className={cn(
                            'text-sm',
                            errors.includes('Name is required') && 'border-red-300'
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Category *</Label>
                        <Select
                          value={editData?.category || ''}
                          onValueChange={(value) => setEditData(prev => prev ? { ...prev, category: value } : null)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {existingCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Unit</Label>
                        <Input
                          value={editData?.unit || ''}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, unit: e.target.value } : null)}
                          placeholder="e.g., kg, pieces"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Cost (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editData?.cost || ''}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, cost: parseFloat(e.target.value) || undefined } : null)}
                          placeholder="0.00"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Description</Label>
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
                          <span>{ingredient.category}</span>
                          {ingredient.unit && <span>• {ingredient.unit}</span>}
                          {ingredient.cost !== undefined && <span>• €{ingredient.cost.toFixed(2)}</span>}
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
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleConfirmAll}
            disabled={Object.keys(validationErrors).length > 0}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Create {newIngredients.length} Ingredients
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Bulk ingredient creation component
interface BulkIngredientCreationProps {
  ingredients: string[];
  onProcess: (ingredients: IngredientToCreate[]) => void;
  onCancel: () => void;
  className?: string;
}

export const BulkIngredientCreation: React.FC<BulkIngredientCreationProps> = ({
  ingredients,
  onProcess,
  onCancel,
  className = '',
}) => {
  const [processedIngredients, setProcessedIngredients] = useState<IngredientToCreate[]>([]);
  const [defaultCategory, setDefaultCategory] = useState('');

  const processIngredients = () => {
    const processed = ingredients.map(name => ({
      name,
      category: defaultCategory || 'Other',
      description: '',
      unit: '',
      cost: undefined,
      isNew: true,
      confidence: 0.7,
      source: 'speech' as const
    }));

    setProcessedIngredients(processed);
  };

  const handleConfirm = () => {
    onProcess(processedIngredients);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-500" />
          Bulk Ingredient Creation
          <Badge variant="outline" className="text-xs ml-auto">
            {ingredients.length} ingredients
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Default Category</Label>
          <Select value={defaultCategory} onValueChange={setDefaultCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select default category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Vegetables">Vegetables</SelectItem>
              <SelectItem value="Fruits">Fruits</SelectItem>
              <SelectItem value="Meat">Meat</SelectItem>
              <SelectItem value="Dairy">Dairy</SelectItem>
              <SelectItem value="Grains">Grains</SelectItem>
              <SelectItem value="Spices">Spices</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Ingredients to Create</Label>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-sm">{ingredient}</span>
                <Badge variant="outline" className="text-xs">
                  New
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={processIngredients} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Process Ingredients
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 