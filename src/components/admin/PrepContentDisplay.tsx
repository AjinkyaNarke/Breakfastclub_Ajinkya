import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Languages, Eye, EyeOff } from 'lucide-react';
import { useReactivePrepTranslation } from '@/hooks/useReactivePrepTranslation';

interface PrepData {
  id: string;
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  instructions?: string;
  instructions_de?: string;
  instructions_en?: string;
  batch_yield?: string;
  notes?: string;
}

interface PrepContentDisplayProps {
  prep: PrepData;
  showInstructions?: boolean;
  showNotes?: boolean;
  autoTranslate?: boolean;
  onPrepUpdated?: (updatedPrep: PrepData) => void;
}

export const PrepContentDisplay: React.FC<PrepContentDisplayProps> = ({
  prep,
  showInstructions = true,
  showNotes = true,
  autoTranslate = true,
  onPrepUpdated
}) => {
  const { i18n } = useTranslation();
  const [showFullInstructions, setShowFullInstructions] = useState(false);
  
  const {
    translatedPrep,
    isTranslating,
    getDisplayText,
    hasTranslationForLanguage,
    currentLanguage
  } = useReactivePrepTranslation(prep, {
    translateOnLanguageChange: autoTranslate,
    sourceLanguage: 'en'
  });

  // Notify parent component when prep is updated with translations
  useEffect(() => {
    if (onPrepUpdated && translatedPrep !== prep) {
      onPrepUpdated(translatedPrep);
    }
  }, [translatedPrep, onPrepUpdated, prep]);

  const displayName = getDisplayText('name');
  const displayDescription = getDisplayText('description');
  const displayInstructions = getDisplayText('instructions');
  
  const hasCurrentLanguageTranslation = hasTranslationForLanguage(currentLanguage as 'en' | 'de');
  const translationQuality = hasCurrentLanguageTranslation ? 'complete' : 'missing';

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {displayName}
              {isTranslating && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant={translationQuality === 'complete' ? 'default' : 'secondary'}
                className="text-xs"
              >
                <Languages className="h-3 w-3 mr-1" />
                {currentLanguage.toUpperCase()}
                {translationQuality === 'missing' && ' (Auto-translating...)'}
              </Badge>
              
              {prep.batch_yield && (
                <Badge variant="outline" className="text-xs">
                  Yield: {prep.batch_yield}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        {displayDescription && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
            <p className="text-sm">{displayDescription}</p>
          </div>
        )}

        {/* Instructions */}
        {showInstructions && displayInstructions && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-muted-foreground">Instructions</h4>
              {displayInstructions.length > 100 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullInstructions(!showFullInstructions)}
                  className="h-6 text-xs"
                >
                  {showFullInstructions ? (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {showFullInstructions || displayInstructions.length <= 100
                ? displayInstructions
                : truncateText(displayInstructions)
              }
            </div>
          </div>
        )}

        {/* Notes */}
        {showNotes && prep.notes && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
            <p className="text-xs text-muted-foreground italic">{prep.notes}</p>
          </div>
        )}

        {/* Translation Status */}
        {isTranslating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Translating content to {currentLanguage.toUpperCase()}...
          </div>
        )}
      </CardContent>
    </Card>
  );
};