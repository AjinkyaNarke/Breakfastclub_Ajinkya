import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Loader2 } from 'lucide-react';
import { usePrepTranslation } from '@/hooks/usePrepTranslation';
import { Badge } from '@/components/ui/badge';

interface PrepData {
  id?: string;
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  instructions?: string;
  instructions_de?: string;
  instructions_en?: string;
  notes?: string;
  batch_yield?: string;
  batch_yield_amount?: number;
  batch_yield_unit?: string;
}

interface PrepTranslateButtonProps {
  prep: PrepData;
  onTranslated?: (translatedData: any) => void;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
  showBadges?: boolean;
}

export function PrepTranslateButton({
  prep,
  onTranslated,
  size = 'sm',
  variant = 'outline',
  showBadges = true
}: PrepTranslateButtonProps) {
  const { translateExistingPrep, isTranslating } = usePrepTranslation();

  const handleTranslate = async (sourceLang: 'en' | 'de') => {
    try {
      const result = await translateExistingPrep(prep, sourceLang);
      if (result && onTranslated) {
        onTranslated(result);
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  const hasGerman = Boolean(prep.name_de || prep.description_de || prep.instructions_de);
  const hasEnglish = Boolean(prep.name_en || prep.description_en || prep.instructions_en);

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isTranslating}
            className="flex items-center space-x-2"
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isTranslating ? 'Translating...' : 'Translate'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleTranslate('en')}
            disabled={isTranslating}
            className="flex items-center justify-between"
          >
            <span>English → German</span>
            {hasGerman && <Badge variant="secondary" className="ml-2 text-xs">Has DE</Badge>}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleTranslate('de')}
            disabled={isTranslating}
            className="flex items-center justify-between"
          >
            <span>German → English</span>
            {hasEnglish && <Badge variant="secondary" className="ml-2 text-xs">Has EN</Badge>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showBadges && (
        <div className="flex space-x-1">
          {hasEnglish && (
            <Badge variant="outline" className="text-xs">
              EN
            </Badge>
          )}
          {hasGerman && (
            <Badge variant="outline" className="text-xs">
              DE
            </Badge>
          )}
          {!hasEnglish && !hasGerman && (
            <Badge variant="secondary" className="text-xs">
              No translations
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}