import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Languages, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { translateText, type TranslationRequest } from '@/utils/translation';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface TranslationButtonProps {
  text: string;
  fromLanguage: 'de' | 'en';
  toLanguage: 'de' | 'en';
  onTranslated: (translatedText: string, confidence: number) => void;
  context?: 'menu' | 'description' | 'ingredient' | 'general';
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  showLanguageIndicator?: boolean;
}

export const TranslationButton: React.FC<TranslationButtonProps> = ({
  text,
  fromLanguage,
  toLanguage,
  onTranslated,
  context = 'general',
  variant = 'outline',
  size = 'sm',
  className = '',
  disabled = false,
  showLanguageIndicator = true
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastTranslationConfidence, setLastTranslationConfidence] = useState<number | null>(null);

  const handleTranslate = async () => {
    if (!text || text.trim().length === 0) {
      toast({
        title: 'No text to translate',
        description: 'Please enter some text first.',
        variant: 'destructive',
      });
      return;
    }

    if (fromLanguage === toLanguage) {
      toast({
        title: 'Same language selected',
        description: 'Source and target languages are the same.',
        variant: 'destructive',
      });
      return;
    }

    setIsTranslating(true);
    
    try {
      const request: TranslationRequest = {
        text: text.trim(),
        fromLanguage,
        toLanguage,
        context
      };

      const response = await translateText(request);
      
      if (response.translatedText && response.translatedText.trim()) {
        setLastTranslationConfidence(response.confidence);
        onTranslated(response.translatedText.trim(), response.confidence);
        
        const fromLangName = fromLanguage === 'de' ? 'German' : 'English';
        const toLangName = toLanguage === 'de' ? 'German' : 'English';
        
        toast({
          title: 'Translation completed',
          description: `Translated from ${fromLangName} to ${toLangName} (${Math.round(response.confidence * 100)}% confidence)`,
          duration: 3000,
        });
      } else {
        throw new Error('Empty translation returned');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation failed',
        description: error instanceof Error ? error.message : 'Failed to translate text. Please try again.',
        variant: 'destructive',
      });
      setLastTranslationConfidence(null);
    } finally {
      setIsTranslating(false);
    }
  };

  const fromLangCode = fromLanguage.toUpperCase();
  const toLangCode = toLanguage.toUpperCase();
  
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-3 w-3" />;
    if (confidence >= 0.6) return <AlertCircle className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleTranslate}
        disabled={disabled || isTranslating || !text?.trim()}
        variant={variant}
        size={size}
        className={cn("flex items-center gap-2", className)}
      >
        {isTranslating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Languages className="h-4 w-4" />
        )}
        
        {showLanguageIndicator && (
          <span className="text-xs">
            {fromLangCode} → {toLangCode}
          </span>
        )}
        
        {isTranslating ? 'Translating...' : 'Translate'}
      </Button>
      
      {lastTranslationConfidence !== null && (
        <Badge 
          variant="outline" 
          className={cn("text-xs", getConfidenceColor(lastTranslationConfidence))}
        >
          <div className="flex items-center gap-1">
            {getConfidenceIcon(lastTranslationConfidence)}
            {Math.round(lastTranslationConfidence * 100)}%
          </div>
        </Badge>
      )}
    </div>
  );
};

interface QuickTranslateProps {
  germanText: string;
  englishText: string;
  onGermanChange: (text: string) => void;
  onEnglishChange: (text: string) => void;
  context?: 'menu' | 'description' | 'ingredient';
  className?: string;
}

export const QuickTranslate: React.FC<QuickTranslateProps> = ({
  germanText,
  englishText,
  onGermanChange,
  onEnglishChange,
  context = 'general',
  className = ''
}) => {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <TranslationButton
        text={germanText}
        fromLanguage="de"
        toLanguage="en"
        onTranslated={onEnglishChange}
        context={context}
        disabled={!germanText?.trim()}
        showLanguageIndicator={false}
      />
      
      <div className="text-xs text-muted-foreground">|</div>
      
      <TranslationButton
        text={englishText}
        fromLanguage="en"
        toLanguage="de"
        onTranslated={onGermanChange}
        context={context}
        disabled={!englishText?.trim()}
        showLanguageIndicator={false}
      />
    </div>
  );
};