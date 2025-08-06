
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe, Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';

export const LanguageSwitcher = () => {
  const { t } = useTranslation('common');
  const { currentLanguage, switchLanguage } = useLanguageSwitch({
    showToasts: true,
    onLanguageChange: (newLang, oldLang) => {
      console.log(`Language changed from ${oldLang} to ${newLang}`);
      // This triggers the reactive translation hooks automatically
    }
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          {currentLanguage === 'de' ? 'DE' : 'EN'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLanguage('de')}>
          🇩🇪 {t('language.german')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLanguage('en')}>
          🇬🇧 {t('language.english')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
