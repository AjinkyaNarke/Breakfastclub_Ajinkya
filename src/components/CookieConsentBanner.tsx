import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useConsent, ConsentPreferences } from '@/hooks/useConsent';
import { Cookie, Settings, Shield, BarChart3, Target } from 'lucide-react';

export const CookieConsentBanner = () => {
  const { t } = useTranslation('common');
  const { hasConsent, preferences, acceptAll, acceptEssential, saveConsent } = useConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<ConsentPreferences>(preferences);

  if (hasConsent) return null;

  const handleCustomSave = async () => {
    try {
      await saveConsent(tempPreferences);
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const cookieCategories = [
    {
      key: 'essential',
      icon: Shield,
      title: t('cookies.categories.essential.title'),
      description: t('cookies.categories.essential.description'),
      required: true
    },
    {
      key: 'functional',
      icon: Settings,
      title: t('cookies.categories.functional.title'),
      description: t('cookies.categories.functional.description'),
      required: false
    },
    {
      key: 'analytics',
      icon: BarChart3,
      title: t('cookies.categories.analytics.title'),
      description: t('cookies.categories.analytics.description'),
      required: false
    },
    {
      key: 'marketing',
      icon: Target,
      title: t('cookies.categories.marketing.title'),
      description: t('cookies.categories.marketing.description'),
      required: false
    }
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-2">
                  {t('cookies.banner.title')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('cookies.banner.description')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={acceptAll} className="flex-shrink-0">
                    {t('cookies.banner.acceptAll')}
                  </Button>
                  <Button onClick={acceptEssential} variant="outline" className="flex-shrink-0">
                    {t('cookies.banner.acceptEssential')}
                  </Button>
                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="flex-shrink-0">
                        {t('cookies.banner.customize')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t('cookies.settings.title')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <p className="text-sm text-muted-foreground">
                          {t('cookies.settings.description')}
                        </p>
                        
                        {cookieCategories.map((category, index) => {
                          const IconComponent = category.icon;
                          const isChecked = tempPreferences[category.key as keyof ConsentPreferences];
                          
                          return (
                            <div key={category.key}>
                              <div className="flex items-start space-x-3">
                                <div className="flex items-center space-x-2 mt-1">
                                  <Checkbox
                                    id={category.key}
                                    checked={isChecked}
                                    disabled={category.required}
                                    onCheckedChange={(checked) => {
                                      if (!category.required) {
                                        setTempPreferences(prev => ({
                                          ...prev,
                                          [category.key]: !!checked
                                        }));
                                      }
                                    }}
                                  />
                                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{category.title}</h4>
                                    {category.required && (
                                      <span className="text-xs bg-muted px-2 py-1 rounded">
                                        {t('cookies.required')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {category.description}
                                  </p>
                                </div>
                              </div>
                              {index < cookieCategories.length - 1 && <Separator className="mt-4" />}
                            </div>
                          );
                        })}
                        
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button variant="outline" onClick={() => setShowSettings(false)}>
                            {t('common.cancel')}
                          </Button>
                          <Button onClick={handleCustomSave}>
                            {t('cookies.settings.save')}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};