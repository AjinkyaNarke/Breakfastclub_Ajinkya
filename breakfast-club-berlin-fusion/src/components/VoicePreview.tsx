import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, X, Eye, EyeOff, AlertTriangle, Edit3, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PreviewData {
  dishName?: string;
  description?: string;
  ingredients?: string[];
  category?: string;
  price?: number;
  studentPrice?: number;
  confidence: number;
  isModified?: boolean;
}

interface VoicePreviewProps {
  parsedData: PreviewData | null;
  isVisible: boolean;
  onConfirm: (data: PreviewData) => void;
  onEdit: () => void;
  onReset: () => void;
  className?: string;
}

export const VoicePreview: React.FC<VoicePreviewProps> = ({
  parsedData,
  isVisible,
  onConfirm,
  onEdit,
  onReset,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showConfidence, setShowConfidence] = useState(true);

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

  const getOverallConfidence = () => {
    return parsedData.confidence;
  };

  const getDataCompleteness = () => {
    const fields = ['dishName', 'description', 'category', 'price'];
    const filledFields = fields.filter(field => parsedData[field as keyof PreviewData]);
    return (filledFields.length / fields.length) * 100;
  };

  const renderField = (label: string, value: any, confidence?: number) => {
    if (!value && value !== 0) return null;

    return (
      <div key={label} className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{label}:</span>
          <span className="text-sm text-gray-800">
            {Array.isArray(value) ? value.join(', ') : value}
          </span>
        </div>
        {confidence !== undefined && showConfidence && (
          <Badge variant={getConfidenceBadge(confidence)} className="text-xs">
            {(confidence * 100).toFixed(0)}%
          </Badge>
        )}
      </div>
    );
  };

  const overallConfidence = getOverallConfidence();
  const completeness = getDataCompleteness();

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-500" />
          Preview Menu Item
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowConfidence(!showConfidence)}
            >
              {showConfidence ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Badge variant="outline" className="text-xs">
              Preview
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className={cn('text-lg font-bold', getConfidenceColor(overallConfidence))}>
              {(overallConfidence * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {completeness.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {parsedData.isModified ? 'Modified' : 'Original'}
            </div>
            <div className="text-xs text-gray-600">Status</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          {/* Dish Name - Highlighted */}
          {parsedData.dishName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-700">Dish Name</span>
                {showConfidence && (
                  <Badge variant={getConfidenceBadge(overallConfidence)} className="text-xs">
                    {(overallConfidence * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold text-blue-800">{parsedData.dishName}</h3>
            </div>
          )}

          {/* Other Fields */}
          <div className="space-y-2">
            {renderField('Category', parsedData.category)}
            {renderField('Description', parsedData.description)}
            {parsedData.ingredients && parsedData.ingredients.length > 0 && (
              <div className="py-2">
                <span className="text-sm font-medium text-gray-700">Ingredients:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {parsedData.ingredients.map((ingredient, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {(parsedData.price || parsedData.studentPrice) && (
              <div className="py-2">
                <span className="text-sm font-medium text-gray-700">Pricing:</span>
                <div className="flex gap-4 mt-1">
                  {parsedData.price && (
                    <span className="text-sm text-gray-800">
                      Regular: €{Number(parsedData.price).toFixed(2)}
                    </span>
                  )}
                  {parsedData.studentPrice && (
                    <span className="text-sm text-gray-800">
                      Student: €{Number(parsedData.studentPrice).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed View Toggle */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-700"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Detailed Analysis</h4>
            
            {/* Confidence Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Overall Confidence</span>
                <span className={cn('text-xs font-mono', getConfidenceColor(overallConfidence))}>
                  {(overallConfidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    overallConfidence >= 0.9 ? 'bg-green-500' :
                    overallConfidence >= 0.7 ? 'bg-blue-500' :
                    overallConfidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${overallConfidence * 100}%` }}
                />
              </div>
            </div>

            {/* Data Quality Indicators */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  completeness >= 80 ? 'bg-green-500' :
                  completeness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                )} />
                <span>Data Completeness</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  overallConfidence >= 0.7 ? 'bg-green-500' :
                  overallConfidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                )} />
                <span>Recognition Quality</span>
              </div>
            </div>

            {/* Recommendations */}
            {overallConfidence < 0.7 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-700">Recommendations</span>
                </div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Consider editing low-confidence fields</li>
                  <li>• Verify pricing information</li>
                  <li>• Check ingredient spelling</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={() => onConfirm(parsedData)} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm & Add
          </Button>
          <Button variant="outline" onClick={onEdit} className="flex-1">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact preview component
interface CompactPreviewProps {
  parsedData: PreviewData | null;
  isVisible: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  className?: string;
}

export const CompactPreview: React.FC<CompactPreviewProps> = ({
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
        <h4 className="text-sm font-medium text-green-800">Ready to Add</h4>
        <Badge variant="default" className="text-xs">
          {(parsedData.confidence * 100).toFixed(0)}% confidence
        </Badge>
      </div>
      
      <div className="space-y-1 text-sm mb-3">
        {parsedData.dishName && (
          <div className="font-medium text-green-700">{parsedData.dishName}</div>
        )}
        {parsedData.category && (
          <div className="text-gray-600">{parsedData.category}</div>
        )}
        {parsedData.ingredients && parsedData.ingredients.length > 0 && (
          <div className="text-gray-600">
            {parsedData.ingredients.length} ingredients
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onConfirm} className="flex-1">
          <CheckCircle className="h-3 w-3 mr-1" />
          Add
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit3 className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
};

// Side-by-side comparison component
interface ComparisonPreviewProps {
  originalData: PreviewData | null;
  modifiedData: PreviewData | null;
  onConfirm: (data: PreviewData) => void;
  onRevert: () => void;
  className?: string;
}

export const ComparisonPreview: React.FC<ComparisonPreviewProps> = ({
  originalData,
  modifiedData,
  onConfirm,
  onRevert,
  className = '',
}) => {
  if (!originalData || !modifiedData) {
    return null;
  }

  const getChangedFields = () => {
    const changes: string[] = [];
    const fields = ['dishName', 'description', 'category', 'price', 'studentPrice'];
    
    fields.forEach(field => {
      const original = originalData[field as keyof PreviewData];
      const modified = modifiedData[field as keyof PreviewData];
      
      if (original !== modified) {
        changes.push(field);
      }
    });

    return changes;
  };

  const changedFields = getChangedFields();

  const renderComparisonField = (label: string, originalValue: any, modifiedValue: any) => {
    const isChanged = originalValue !== modifiedValue;

    return (
      <div key={label} className={cn(
        'p-2 rounded border',
        isChanged ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          {isChanged && (
            <Badge variant="outline" className="text-xs text-yellow-600">
              Modified
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Original:</span>
            <div className="text-gray-700">{originalValue || 'Not set'}</div>
          </div>
          <div>
            <span className="text-gray-500">Modified:</span>
            <div className="text-gray-700">{modifiedValue || 'Not set'}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Changes Detected
          <Badge variant="outline" className="text-xs ml-auto">
            {changedFields.length} changes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Changes Summary</span>
          </div>
          <div className="text-sm text-yellow-700">
            {changedFields.length} field(s) have been modified from the original parsed data.
          </div>
        </div>

        {/* Comparison */}
        <div className="space-y-2">
          {renderComparisonField('Dish Name', originalData.dishName, modifiedData.dishName)}
          {renderComparisonField('Category', originalData.category, modifiedData.category)}
          {renderComparisonField('Description', originalData.description, modifiedData.description)}
          {renderComparisonField('Price', originalData.price, modifiedData.price)}
          {renderComparisonField('Student Price', originalData.studentPrice, modifiedData.studentPrice)}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={() => onConfirm(modifiedData)} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onRevert} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Revert Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 