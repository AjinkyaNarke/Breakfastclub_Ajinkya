import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ServiceUsageItem {
  used: number;
  limit: number;
  resetDate: string;
  status: 'healthy' | 'warning' | 'critical';
}

export interface ServiceUsage {
  deepgram: ServiceUsageItem;
  recraft: ServiceUsageItem;
  deepseek: ServiceUsageItem;
}

interface UseServiceUsageReturn {
  serviceUsage: ServiceUsage | null;
  loading: boolean;
  error: string | null;
  refreshUsage: () => Promise<void>;
}

// Default/fallback service usage data
const DEFAULT_SERVICE_USAGE: ServiceUsage = {
  deepgram: {
    used: 0,
    limit: 5000,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'healthy'
  },
  recraft: {
    used: 0,
    limit: 50,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'healthy'
  },
  deepseek: {
    used: 0,
    limit: 50000,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'healthy'
  }
};

export const useServiceUsage = (): UseServiceUsageReturn => {
  const [serviceUsage, setServiceUsage] = useState<ServiceUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Calculate service status based on usage
  const calculateStatus = useCallback((used: number, limit: number): 'healthy' | 'warning' | 'critical' => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'healthy';
  }, []);

  // Fetch actual service usage data
  const fetchServiceUsage = useCallback(async (): Promise<ServiceUsage> => {
    try {
      // Try to fetch from database - first check if we have a service_usage table
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'service_usage')
        .single();

      if (tableExists) {
        // Fetch real usage data from database
        const { data, error } = await supabase
          .from('service_usage')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          return {
            deepgram: {
              used: data.deepgram_used || 0,
              limit: data.deepgram_limit || 5000,
              resetDate: data.deepgram_reset_date || DEFAULT_SERVICE_USAGE.deepgram.resetDate,
              status: calculateStatus(data.deepgram_used || 0, data.deepgram_limit || 5000)
            },
            recraft: {
              used: data.recraft_used || 0,
              limit: data.recraft_limit || 50,
              resetDate: data.recraft_reset_date || DEFAULT_SERVICE_USAGE.recraft.resetDate,
              status: calculateStatus(data.recraft_used || 0, data.recraft_limit || 50)
            },
            deepseek: {
              used: data.deepseek_used || 0,
              limit: data.deepseek_limit || 50000,
              resetDate: data.deepseek_reset_date || DEFAULT_SERVICE_USAGE.deepseek.resetDate,
              status: calculateStatus(data.deepseek_used || 0, data.deepseek_limit || 50000)
            }
          };
        }
      }

      // If no database table exists or no data, try to get usage from environment/settings
      // This would be where you'd integrate with actual service APIs
      
      // For now, return calculated usage based on actual AI service calls
      const [deepgramUsage, recraftUsage, deepseekUsage] = await Promise.all([
        fetchDeepgramUsage(),
        fetchRecraftUsage(), 
        fetchDeepseekUsage()
      ]);

      return {
        deepgram: {
          ...deepgramUsage,
          status: calculateStatus(deepgramUsage.used, deepgramUsage.limit)
        },
        recraft: {
          ...recraftUsage,
          status: calculateStatus(recraftUsage.used, recraftUsage.limit)
        },
        deepseek: {
          ...deepseekUsage,
          status: calculateStatus(deepseekUsage.used, deepseekUsage.limit)
        }
      };

    } catch (error) {
      console.error('Error fetching service usage:', error);
      // Return default values if API calls fail
      return DEFAULT_SERVICE_USAGE;
    }
  }, [calculateStatus]);

  // Fetch Deepgram usage (could integrate with Deepgram API)
  const fetchDeepgramUsage = async (): Promise<ServiceUsageItem> => {
    try {
      // Count actual Deepgram API calls from your database logs or call Deepgram API
      const { count } = await supabase
        .from('ai_usage_logs')
        .select('id', { count: 'exact' })
        .eq('service', 'deepgram')
        .gte('created_at', getMonthStart());

      return {
        used: count || 0,
        limit: 5000,
        resetDate: getNextMonthStart(),
        status: 'healthy'
      };
    } catch {
      return DEFAULT_SERVICE_USAGE.deepgram;
    }
  };

  // Fetch Recraft usage (could integrate with Recraft API)
  const fetchRecraftUsage = async (): Promise<ServiceUsageItem> => {
    try {
      // Count actual Recraft API calls
      const { count } = await supabase
        .from('ai_usage_logs')
        .select('id', { count: 'exact' })
        .eq('service', 'recraft')
        .gte('created_at', getMonthStart());

      return {
        used: count || 0,
        limit: 50,
        resetDate: getNextMonthStart(),
        status: 'healthy'
      };
    } catch {
      return DEFAULT_SERVICE_USAGE.recraft;
    }
  };

  // Fetch DeepSeek usage (could integrate with DeepSeek API)
  const fetchDeepseekUsage = async (): Promise<ServiceUsageItem> => {
    try {
      // Count actual DeepSeek API calls or tokens
      const { count } = await supabase
        .from('ai_usage_logs')
        .select('id', { count: 'exact' })
        .eq('service', 'deepseek')
        .gte('created_at', getMonthStart());

      return {
        used: count || 0,
        limit: 50000,
        resetDate: getNextMonthStart(),
        status: 'healthy'
      };
    } catch {
      return DEFAULT_SERVICE_USAGE.deepseek;
    }
  };

  // Helper functions for date calculations
  const getMonthStart = (): string => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  };

  const getNextMonthStart = (): string => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
  };

  // Main refresh function
  const refreshUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usage = await fetchServiceUsage();
      setServiceUsage(usage);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch service usage';
      setError(errorMessage);
      
      // Set default values on error
      setServiceUsage(DEFAULT_SERVICE_USAGE);
      
      toast({
        title: 'Warning',
        description: 'Using default service usage data. Check your API connections.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchServiceUsage, toast]);

  // Auto-fetch on mount
  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  return {
    serviceUsage,
    loading,
    error,
    refreshUsage
  };
};