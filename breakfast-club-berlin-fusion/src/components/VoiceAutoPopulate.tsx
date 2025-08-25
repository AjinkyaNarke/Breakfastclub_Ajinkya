import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, ArrowRight, Zap, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AutoPopulateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect';
  value: any;
  originalValue?: any;
  confidence: number;
  isPopulated: boolean;
  options?: string[];
  validation?: (value: any) => { isValid: boolean; error?: string };
}

interface VoiceAutoPopulateProps {
  fields: AutoPopulateField[];
  onFieldChange: (fieldId: string, value: any) => void;
  onConfirmAll: () => void;
  onResetAll: () => void;
  onUndoField: (fieldId: string) => void;
  className?: string;
}

export const VoiceAutoPopulate: React.FC<VoiceAutoPopulateProps> = ({
  fields,
  onFieldChange,
  onConfirmAll,
  onResetAll,
  onUndoField,
  className = '',
}) => {
  const [localFields, setLocalFields] = useState<AutoPopulateField[]>(fields);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

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

  const handleFieldChange = (fieldId: string, value: any) => {
    const field = localFields.find(f => f.id === fieldId);
    if (!field) return;

    // Validate the value
    if (field.validation) {
      const validation = field.validation(value);
      if (!validation.isValid) {
        setValidationErrors(prev => ({ ...prev, [fieldId]: validation.error || 'Invalid value' }));
        return;
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldId];
          return newErrors;
        });
      }
    }

    // Update local state
    setLocalFields(prev => 
      prev.map(f => 
        f.id === fieldId 
          ? { ...f, value, isPopulated: true }
          : f
      )
    );

    // Notify parent
    onFieldChange(fieldId, value);
  };

  const handleUndoField = (fieldId: string) => {
    const field = localFields.find(f => f.id === fieldId);
    if (!field || field.originalValue === undefined) return;

    setLocalFields(prev => 
      prev.map(f => 
        f.id === fieldId 
          ? { ...f, value: f.originalValue, isPopulated: false }
          : f
      )
    );

    onUndoField(fieldId);
  };

  const renderField = (field: AutoPopulateField) => {
    const hasError = validationErrors[field.id];
    const isModified = field.isPopulated && field.value !== field.originalValue;

    return (
      <div key={field.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">
            {field.label}
          </Label>
          <div className="flex items-center gap-2">
            {field.isPopulated && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Auto-filled
              </Badge>
            )}
            <Badge variant={getConfidenceBadge(field.confidence)} className="text-xs">
              {(field.confidence * 100).toFixed(0)}%
            </Badge>
            {isModified && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleUndoField(field.id)}
                className="p-1 h-6"
              >
                <Undo2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          {field.type === 'textarea' ? (
            <Textarea
              value={field.value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={cn(
                'transition-all duration-200',
                field.isPopulated && 'border-blue-300 bg-blue-50',
                hasError && 'border-red-300 bg-red-50'
              )}
              rows={3}
            />
          ) : field.type === 'select' ? (
            <Select
              value={field.value || ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              <SelectTrigger className={cn(
                'transition-all duration-200',
                field.isPopulated && 'border-blue-300 bg-blue-50',
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
                value={field.value || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className={cn(
                  'transition-all duration-200',
                  field.isPopulated && 'border-blue-300 bg-blue-50',
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
                        const currentValue = field.value || '';
                        const newValue = currentValue 
                          ? `${currentValue}, ${option}`
                          : option;
                        handleFieldChange(field.id, newValue);
                      }}
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Input
              type={field.type}
              value={field.value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={cn(
                'transition-all duration-200',
                field.isPopulated && 'border-blue-300 bg-blue-50',
                hasError && 'border-red-300 bg-red-50'
              )}
              step={field.type === 'number' ? '0.01' : undefined}
            />
          )}

          {/* Auto-populate indicator */}
          {field.isPopulated && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </div>
          )}

          {/* Error indicator */}
          {hasError && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {hasError}
          </p>
        )}

        {/* Confidence indicator */}
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

  const populatedFields = localFields.filter(f => f.isPopulated);
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Auto-Populated Fields</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {populatedFields.length} of {localFields.length} fields
            </Badge>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4 mb-4">
          {localFields.map(renderField)}
        </div>

        {/* Summary */}
        {populatedFields.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Auto-population Summary</span>
            </div>
            <div className="text-sm text-blue-600">
              {populatedFields.length} fields have been automatically populated from voice input.
              {hasErrors && (
                <span className="text-red-600 ml-2">
                  Please fix validation errors before proceeding.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onConfirmAll}
            disabled={hasErrors}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm All Fields
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

// Smart field mapper component
interface SmartFieldMapperProps {
  transcript: string;
  availableFields: Array<{
    id: string;
    label: string;
    type: string;
    keywords: string[];
  }>;
  onMapFields: (mappings: Record<string, any>) => void;
  className?: string;
}

export const SmartFieldMapper: React.FC<SmartFieldMapperProps> = ({
  transcript,
  availableFields,
  onMapFields,
  className = '',
}) => {
  const [mappings, setMappings] = useState<Record<string, any>>({});
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});

  // Simple keyword-based mapping
  const generateSuggestions = () => {
    const newSuggestions: Record<string, string[]> = {};
    const words = transcript.toLowerCase().split(/\s+/);

    availableFields.forEach(field => {
      const matches: string[] = [];
      
      field.keywords.forEach(keyword => {
        if (words.some(word => word.includes(keyword.toLowerCase()))) {
          matches.push(keyword);
        }
      });

      if (matches.length > 0) {
        newSuggestions[field.id] = matches;
      }
    });

    setSuggestions(newSuggestions);
  };

  useEffect(() => {
    generateSuggestions();
  }, [transcript]);

  const handleSuggestionClick = (fieldId: string, suggestion: string) => {
    setMappings(prev => ({
      ...prev,
      [fieldId]: suggestion
    }));
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Smart Field Mapping</h3>
        
        <div className="space-y-4">
          {availableFields.map(field => {
            const fieldSuggestions = suggestions[field.id] || [];
            const isMapped = mappings[field.id];

            return (
              <div key={field.id} className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {field.label}
                </Label>
                
                {isMapped ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700">{isMapped}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setMappings(prev => {
                          const newMappings = { ...prev };
                          delete newMappings[field.id];
                          return newMappings;
                        });
                      }}
                    >
                      <Undo2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fieldSuggestions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {fieldSuggestions.map(suggestion => (
                          <Badge
                            key={suggestion}
                            variant="outline"
                            className="cursor-pointer hover:bg-blue-50"
                            onClick={() => handleSuggestionClick(field.id, suggestion)}
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No suggestions found</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(mappings).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => onMapFields(mappings)}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Apply {Object.keys(mappings).length} Mappings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 