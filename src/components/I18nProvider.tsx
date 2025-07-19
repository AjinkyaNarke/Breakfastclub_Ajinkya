import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

const I18nLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  
  // Don't render children until i18n is initialized
  if (!i18n.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  return <>{children}</>;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <I18nLoader>{children}</I18nLoader>
    </Suspense>
  );
};