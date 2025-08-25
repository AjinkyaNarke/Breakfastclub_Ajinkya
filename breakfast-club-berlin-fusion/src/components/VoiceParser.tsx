import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Edit3, X, Plus, Minus, ChefHat, Tag, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ParsedData {
  dishName?: string;
  description?: string;
  ingredients?: string[];
  category?: string;
  price?: number;
  studentPrice?: number;
  confidence: number;
}

interface VoiceParserProps {
  parsedData: ParsedData | null;
  isVisible: boolean;
  onConfirm: (data: ParsedData) => void;
  onEdit: (field: keyof ParsedData, value: any) => void;
  onReset: () => void;
  className?: string;
}

export const VoiceParser: React.FC<VoiceParserProps> = ({
  parsedData,
  isVisible,
  onConfirm,
  onEdit,
  onReset,
  className = '',
}) => {
  const [editingField, setEditingField] = useState<keyof ParsedData | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isVisible || !parsedData) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-blue-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return 'default';
    if (confidence >= 0.7) return 'secondary';
    return 'destructive';
  };

  const handleEdit = (field: keyof ParsedData, currentValue: any) => {
    setEditingField(field);
    setEditValue(Array.isArray(currentValue) ? currentValue.join(', ') : String(currentValue || ''));
  };

  const handleSaveEdit = () => {
    if (editingField) {
      let value: any = editValue;
      
      // Handle special cases
      if (editingField === 'ingredients') {
        value = editValue.split(',').map((item: string) => item.trim()).filter(Boolean);
      } else if (editingField === 'price' || editingField === 'studentPrice') {
        value = parseFloat(editValue) || 0;
      }
      
      onEdit(editingField, value);
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const renderField = (label: string, field: keyof ParsedData, icon?: React.ReactNode) => {
    const value = parsedData[field];
    const isEditing = editingField === field;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="text-sm font-medium text-gray-700">{label}</Label>
          <Badge variant={getConfidenceBadge(parsedData.confidence)} className="text-xs">
            {(parsedData.confidence * 100).toFixed(1)}%
          </Badge>
        </div>
        
        {isEditing ? (
          <div className="flex gap-2">
            {field === 'description' ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1"
                rows={3}
              />
            ) : field === 'ingredients' ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1"
                placeholder="Enter ingredients separated by commas"
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1"
                type={field.includes('Price') ? 'number' : 'text'}
                step={field.includes('Price') ? '0.01' : undefined}
              />
            )}
            <Button size="sm" onClick={handleSaveEdit}>
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <div className="flex-1">
              {field === 'ingredients' && Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1">
                  {value.map((ingredient, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              ) : field.includes('Price') ? (
                <span className="text-sm font-mono">
                  €{value ? Number(value).toFixed(2) : '0.00'}
                </span>
              ) : (
                <span className="text-sm text-gray-800">
                  {value || 'Not detected'}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(field, value)}
              className="ml-2"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-blue-500" />
          Parsed Menu Item
          <Badge variant="outline" className="ml-auto">
            Auto-detected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dish Name */}
        {renderField('Dish Name', 'dishName', <ChefHat className="h-4 w-4 text-gray-500" />)}

        {/* Description */}
        {renderField('Description', 'description', <Tag className="h-4 w-4 text-gray-500" />)}

        {/* Category */}
        {renderField('Category', 'category', <Tag className="h-4 w-4 text-gray-500" />)}

        {/* Ingredients */}
        {renderField('Ingredients', 'ingredients', <Plus className="h-4 w-4 text-gray-500" />)}

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          {renderField('Regular Price', 'price', <Euro className="h-4 w-4 text-gray-500" />)}
          {renderField('Student Price', 'studentPrice', <Euro className="h-4 w-4 text-gray-500" />)}
        </div>

        {/* Confidence Summary */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Overall Confidence</span>
          </div>
          <span className={cn('text-sm font-bold', getConfidenceColor(parsedData.confidence))}>
            {(parsedData.confidence * 100).toFixed(1)}%
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={() => onConfirm(parsedData)} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm & Add
          </Button>
          <Button variant="outline" onClick={onReset}>
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact parsing preview
interface ParsingPreviewProps {
  parsedData: ParsedData | null;
  isVisible: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  className?: string;
}

export const ParsingPreview: React.FC<ParsingPreviewProps> = ({
  parsedData,
  isVisible,
  onConfirm,
  onEdit,
  className = '',
}) => {
  if (!isVisible || !parsedData) {
    return null;
  }

  return (
    <div className={cn('p-3 bg-green-50 border border-green-200 rounded-lg', className)}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-green-800">Parsed Successfully</h4>
        <Badge variant="default" className="text-xs">
          {(parsedData.confidence * 100).toFixed(0)}% confidence
        </Badge>
      </div>
      
      <div className="space-y-1 text-sm">
        {parsedData.dishName && (
          <div className="flex items-center gap-2">
            <ChefHat className="h-3 w-3 text-gray-500" />
            <span className="text-gray-700">{parsedData.dishName}</span>
          </div>
        )}
        {parsedData.category && (
          <div className="flex items-center gap-2">
            <Tag className="h-3 w-3 text-gray-500" />
            <span className="text-gray-700">{parsedData.category}</span>
          </div>
        )}
        {parsedData.ingredients && parsedData.ingredients.length > 0 && (
          <div className="flex items-center gap-2">
            <Plus className="h-3 w-3 text-gray-500" />
            <span className="text-gray-700">
              {parsedData.ingredients.length} ingredients
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={onConfirm} className="flex-1">
          <CheckCircle className="h-3 w-3 mr-1" />
          Use
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit3 className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
};

// Ingredient list component
interface IngredientListProps {
  ingredients: string[];
  onAdd: (ingredient: string) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number, ingredient: string) => void;
  className?: string;
}

export const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  onAdd,
  onRemove,
  onEdit,
  className = '',
}) => {
  const [newIngredient, setNewIngredient] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (newIngredient.trim()) {
      onAdd(newIngredient.trim());
      setNewIngredient('');
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(ingredients[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      onEdit(editingIndex, editValue.trim());
      setEditingIndex(null);
      setEditValue('');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-sm font-medium">Ingredients</Label>
      
      {/* Add new ingredient */}
      <div className="flex gap-2">
        <Input
          value={newIngredient}
          onChange={(e) => setNewIngredient(e.target.value)}
          placeholder="Add ingredient..."
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Ingredient list */}
      <div className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
            {editingIndex === index ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
                <Button size="sm" onClick={handleSaveEdit}>
                  <CheckCircle className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingIndex(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{ingredient}</span>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(index)}>
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onRemove(index)}>
                  <Minus className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 