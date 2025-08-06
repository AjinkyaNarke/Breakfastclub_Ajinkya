import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ChatInterface from '@/components/ChatInterface';

export default function Chat() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('chat.title', 'AI Business Assistant')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('chat.subtitle', 'Ask me anything about your restaurant business, menu optimization, or get insights and recommendations.')}
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-primary">
              {t('chat.assistant', 'Business Intelligence Assistant')}
            </CardTitle>
            <CardDescription className="text-base">
              {t('chat.description', 'Powered by advanced AI to help you make data-driven decisions')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[600px] flex flex-col">
              <ChatInterface />
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {t('chat.disclaimer', 'This AI assistant is designed to help with business insights and recommendations. For specific operational questions, please contact the restaurant directly.')}
          </p>
        </div>
      </div>
    </div>
  );
} 