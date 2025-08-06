import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PrepUsageAnalytics } from '@/components/admin/PrepUsageAnalytics';
import { usePrepAnalytics } from '@/hooks/usePrepAnalytics';
import { useToast } from '@/hooks/use-toast';

export const PrepUsageAnalyticsPage = () => {
  const { t } = useTranslation('admin');
  const { toast } = useToast();
  
  // Use the real prep analytics hook instead of mock data
  const {
    analytics,
    insights,
    loading,
    error,
    fetchAnalytics,
    fetchInsights,
    refreshData,
    clearError
  } = usePrepAnalytics({
    autoFetch: true,
    refreshInterval: 300000 // Refresh every 5 minutes
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading prep usage analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prep Usage Analytics</h1>
        <p className="text-muted-foreground">
          Track prep utilization across menu items and optimize your kitchen operations
        </p>
      </div>

      {analytics && insights ? (
        <PrepUsageAnalytics 
          analytics={analytics} 
          insights={insights} 
        />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No prep usage data available</p>
        </div>
      )}
    </div>
  );
}; 