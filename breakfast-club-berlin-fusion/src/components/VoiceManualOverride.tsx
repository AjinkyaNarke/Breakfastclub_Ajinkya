import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Edit3, CheckCircle, X, AlertTriangle, Undo2, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface OverrideField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'boolean';
  originalValue: any;
  currentValue: any;
  confidence: number;
  isOverridden: boolean;
  options?: string[];
  validation?: (value: any) => { isValid: boolean; error?: string };
  required?: boolean;
}

interface VoiceManualOverrideProps {
  fields: OverrideField[];
  onFieldOverride: (fieldId: string, value: any) => void;
  onFieldRevert: (fieldId: string) => void;
  onSaveAll: () => void;
  onResetAll: () => void;
  className?: string;
}

export const VoiceManualOverride: React.FC<VoiceManualOverrideProps> = ({
  fields,
  onFieldOverride,
  onFieldRevert,
  onSaveAll,
  onResetAll,
  className = '',
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showOriginalValues, setShowOriginalValues] = useState(false);

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

  const handleStartEdit = (field: OverrideField) => {
    setEditingField(field.id);
    setEditValue(field.currentValue);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field.id];
      return newErrors;
    });
  };

  const handleSaveEdit = (field: OverrideField) => {
    // Validate the value
    if (field.validation) {
      const validation = field.validation(editValue);
      if (!validation.isValid) {
        setValidationErrors(prev => ({ 
          ...prev, 
          [field.id]: validation.error || 'Invalid value' 
        }));
        return;
      }
    }

    // Check required fields
    if (field.required && (!editValue || editValue === '')) {
      setValidationErrors(prev => ({ 
        ...prev, 
        [field.id]: 'This field is required' 
      }));
      return;
    }

    onFieldOverride(field.id, editValue);
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[editingField!];
      return newErrors;
    });
  };

  const handleRevertField = (field: OverrideField) => {
    onFieldRevert(field.id);
    if (editingField === field.id) {
      setEditingField(null);
      setEditValue('');
    }
  };

  const renderField = (field: OverrideField) => {
    const isEditing = editingField === field.id;
    const hasError = validationErrors[field.id];
    const isChanged = field.currentValue !== field.originalValue;

    return (
      <div key={field.id} className="space-y-3 p-3 border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Badge variant={getConfidenceBadge(field.confidence)} className="text-xs">
              {(field.confidence * 100).toFixed(0)}%
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {isChanged && (
              <Badge variant="outline" className="text-xs text-orange-600">
                Modified
              </Badge>
            )}
            {field.isOverridden && (
              <Badge variant="outline" className="text-xs text-blue-600">
                Manual
              </Badge>
            )}
          </div>
        </div>

        {/* Original Value Display */}
        {showOriginalValues && (
          <div className="p-2 bg-gray-50 rounded border-l-4 border-gray-300">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-3 w-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Original Value</span>
            </div>
            <span className="text-sm text-gray-700">
              {field.originalValue || 'Not set'}
            </span>
          </div>
        )}

        {/* Current Value Display/Edit */}
        <div className="relative">
          {isEditing ? (
            <div className="space-y-2">
              {field.type === 'textarea' ? (
                <Textarea
                  value={editValue || ''}
                  onChange={(e) => setEditValue(e.target.value)}
                  className={cn(
                    'transition-all duration-200',
                    hasError && 'border-red-300 bg-red-50'
                  )}
                  rows={3}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={editValue || ''}
                  onValueChange={(value) => setEditValue(value)}
                >
                  <SelectTrigger className={cn(
                    'transition-all duration-200',
                    hasError && 'border-red-300 bg-red-50'
                  )}>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'multiselect' ? (
                <div className="space-y-2">
                  <Input
                    value={editValue || ''}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={cn(
                      'transition-all duration-200',
                      hasError && 'border-red-300 bg-red-50'
                    )}
                    placeholder="Enter values separated by commas..."
                  />
                  {field.options && (
                    <div className="flex flex-wrap gap-1">
                      {field.options.map((option) => (
                        <Badge
                          key={option}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-blue-50"
                          onClick={() => {
                            const currentValue = editValue || '';
                            const newValue = currentValue 
                              ? `${currentValue}, ${option}`
                              : option;
                            setEditValue(newValue);
                          }}
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : field.type === 'boolean' ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editValue || false}
                    onCheckedChange={setEditValue}
                  />
                  <span className="text-sm text-gray-600">
                    {editValue ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ) : (
                <Input
                  type={field.type}
                  value={editValue || ''}
                  onChange={(e) => setEditValue(e.target.value)}
                  className={cn(
                    'transition-all duration-200',
                    hasError && 'border-red-300 bg-red-50'
                  )}
                  step={field.type === 'number' ? '0.01' : undefined}
                />
              )}

              {/* Edit Actions */}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSaveEdit(field)}>
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
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
              <div className="flex-1">
                {field.type === 'multiselect' && Array.isArray(field.currentValue) ? (
                  <div className="flex flex-wrap gap-1">
                    {field.currentValue.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : field.type === 'boolean' ? (
                  <span className="text-sm">
                    {field.currentValue ? 'Enabled' : 'Disabled'}
                  </span>
                ) : field.type === 'number' ? (
                  <span className="text-sm font-mono">
                    {field.currentValue ? Number(field.currentValue).toFixed(2) : '0.00'}
                  </span>
                ) : (
                  <span className="text-sm text-gray-800">
                    {field.currentValue || 'Not set'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStartEdit(field)}
                  className="p-1 h-6"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                {isChanged && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevertField(field)}
                    className="p-1 h-6"
                  >
                    <Undo2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {hasError && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {hasError}
          </p>
        )}

        {/* Confidence Bar */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex-1 bg-gray-200 rounded-full h-1">
            <div
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                field.confidence >= 0.9 ? 'bg-green-500' :
                field.confidence >= 0.7 ? 'bg-blue-500' :
                field.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${field.confidence * 100}%` }}
            />
          </div>
          <span className={cn('font-mono', getConfidenceColor(field.confidence))}>
            {(field.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    );
  };

  const overriddenFields = fields.filter(f => f.isOverridden);
  const changedFields = fields.filter(f => f.currentValue !== f.originalValue);
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-blue-500" />
          Manual Override
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowOriginalValues(!showOriginalValues)}
            >
              {showOriginalValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Badge variant="outline" className="text-xs">
              {overriddenFields.length} overridden
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {(overriddenFields.length > 0 || changedFields.length > 0) && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Override Summary</span>
            </div>
            <div className="text-sm text-blue-600 space-y-1">
              {overriddenFields.length > 0 && (
                <p>{overriddenFields.length} fields have been manually overridden.</p>
              )}
              {changedFields.length > 0 && (
                <p>{changedFields.length} fields have been modified from original values.</p>
              )}
              {hasErrors && (
                <p className="text-red-600">Please fix validation errors before saving.</p>
              )}
            </div>
          </div>
        )}

        {/* Fields */}
        <div className="space-y-3">
          {fields.map(renderField)}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={onSaveAll}
            disabled={hasErrors}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
          <Button
            variant="outline"
            onClick={onResetAll}
            className="flex-1"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Inline override component for single fields
interface InlineOverrideProps {
  field: OverrideField;
  onOverride: (value: any) => void;
  onRevert: () => void;
  className?: string;
}

export const InlineOverride: React.FC<InlineOverrideProps> = ({
  field,
  onOverride,
  onRevert,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.currentValue);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    // Validate
    if (field.validation) {
      const validation = field.validation(editValue);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid value');
        return;
      }
    }

    if (field.required && (!editValue || editValue === '')) {
      setError('This field is required');
      return;
    }

    onOverride(editValue);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditValue(field.currentValue);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            className={cn(
              'w-32',
              error && 'border-red-300'
            )}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Button size="sm" onClick={handleSave}>
            <CheckCircle className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm">{field.currentValue || 'Not set'}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          {field.currentValue !== field.originalValue && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRevert}
            >
              <Undo2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}; 