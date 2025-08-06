import { Button } from "../ui/button";
import { Languages, Loader2 } from "lucide-react";
import { useAutoTranslate } from "../../hooks/useAutoTranslate";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface AutoTranslateButtonProps {
  sourceText: string;
  sourceLang: 'en' | 'de';
  targetLang: 'en' | 'de';
  onTranslated: (translation: string) => void;
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function AutoTranslateButton({
  sourceText,
  sourceLang,
  targetLang,
  onTranslated,
  disabled = false,
  size = "sm",
  variant = "outline"
}: AutoTranslateButtonProps) {
  const { t } = useTranslation('admin');
  
  const { translate, isTranslating } = useAutoTranslate({
    onSuccess: (translation) => {
      onTranslated(translation);
      toast.success(t('translation.success', 'Translation completed'));
    },
    onError: (error) => {
      toast.error(t('translation.error', `Translation failed: ${error}`));
    }
  });

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.warning(t('translation.emptyText', 'Please enter text to translate'));
      return;
    }

    try {
      await translate(sourceText, sourceLang, targetLang);
    } catch (error) {
      // Error already handled in useAutoTranslate hook
    }
  };

  const getButtonText = () => {
    if (isTranslating) return t('translation.translating', 'Translating...');
    
    const targetLangName = targetLang === 'de' ? t('translation.german', 'German') : t('translation.english', 'English');
    return t('translation.translateTo', `Translate to ${targetLangName}`, { language: targetLangName });
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleTranslate}
      disabled={disabled || isTranslating || !sourceText.trim()}
      className="flex items-center gap-2"
    >
      {isTranslating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Languages className="h-4 w-4" />
      )}
      {getButtonText()}
    </Button>
  );
}