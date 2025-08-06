import { supabase } from '@/integrations/supabase/client';

interface DeepgramCredentials {
  api_key: string;
  expires_at: string;
}

interface UsageData {
  duration?: number;
  model?: string;
  feature?: string;
}

interface UsageStatus {
  can_use: boolean;
  current_usage: number;
  quota: number | null;
  remaining: number | null;
}

class DeepgramAuthManager {
  private credentials: DeepgramCredentials | null = null;
  private isRefreshing = false;

  async getApiKey(): Promise<string> {
    // Check if we have valid credentials
    if (this.credentials && new Date(this.credentials.expires_at) > new Date(Date.now() + 60000)) {
      return this.credentials.api_key;
    }

    // If already refreshing, wait for it to complete
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        const checkCredentials = () => {
          if (!this.isRefreshing) {
            if (this.credentials) {
              resolve(this.credentials.api_key);
            } else {
              reject(new Error('Failed to refresh credentials'));
            }
          } else {
            setTimeout(checkCredentials, 100);
          }
        };
        checkCredentials();
      });
    }

    // Refresh credentials
    return this.refreshCredentials();
  }

  private async refreshCredentials(): Promise<string> {
    this.isRefreshing = true;

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('⚠️ No active session for Deepgram authentication');
        console.info('🔄 Skipping Supabase Edge Function authentication, trying environment fallback');
        // Skip server-side auth if no session, go straight to fallback
        throw new Error('No active session');
      }

      // Try server-side authentication first (now that DEEPGRAM_API_KEY is configured in Supabase)
      const { data, error } = await supabase.functions.invoke('deepgram-auth', {
        body: { action: 'get_token' }
      });

      if (!error && data && data.api_key) {
        console.log('✅ Successfully authenticated with Supabase Deepgram Edge Function');
        console.log('🔑 Using API key from Supabase Edge Function (DEEPGRAM_API_KEY secret)');
        this.credentials = {
          api_key: data.api_key,
          expires_at: data.expires_at
        };
        return this.credentials.api_key;
      }

      // Log the error for debugging
      if (error) {
        console.warn('❌ Supabase Edge Function authentication failed:', error.message);
        console.warn('💡 Make sure DEEPGRAM_API_KEY is configured in Supabase Edge Function secrets');
      } else {
        console.warn('❌ Supabase Edge Function returned no data or API key');
      }

      // Fallback to environment variable for development and testing
      const fallbackKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      const isDev = import.meta.env.NODE_ENV === 'development' || 
                    import.meta.env.VITE_DEBUG_MODE === 'true' ||
                    window.location.hostname === 'localhost';
      
      // Check if fallback key is valid (not a placeholder)
      const isValidApiKey = fallbackKey && 
                           fallbackKey !== 'YOUR_DEEPGRAM_API_KEY_HERE' &&
                           fallbackKey.length > 10 &&
                           !fallbackKey.includes('YOUR_') &&
                           !fallbackKey.includes('_HERE');
      
      if (isValidApiKey) {
        if (isDev) {
          console.warn('✅ Using local Deepgram API key for development');
          console.warn('🔑 API key source: VITE_DEEPGRAM_API_KEY environment variable');
        } else {
          console.warn('✅ Server authentication failed, using local API key');
          console.warn('🔑 API key source: VITE_DEEPGRAM_API_KEY environment variable');
        }
        this.credentials = {
          api_key: fallbackKey,
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        };
        return fallbackKey;
      } else if (fallbackKey) {
        console.error('❌ Environment variable VITE_DEEPGRAM_API_KEY contains placeholder value:', fallbackKey);
        console.error('💡 Placeholder detected - forcing use of Supabase Edge Function');
        console.error('🔧 To fix: Set a real Deepgram API key in .env.local or ensure DEEPGRAM_API_KEY is configured in Supabase secrets');
      }

      throw new Error(`Authentication failed: ${error?.message || 'No fallback available'}`);
    } catch (error) {
      console.error('Error refreshing Deepgram credentials:', error);
      
      // Final fallback to environment variable
      const finalFallbackKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      const isValidFinalKey = finalFallbackKey && 
                             finalFallbackKey !== 'YOUR_DEEPGRAM_API_KEY_HERE' &&
                             finalFallbackKey.length > 10 &&
                             !finalFallbackKey.includes('YOUR_') &&
                             !finalFallbackKey.includes('_HERE');
      
      if (isValidFinalKey) {
        console.warn('✅ Using final fallback Deepgram API key from environment');
        console.warn('🔑 API key source: VITE_DEEPGRAM_API_KEY environment variable (final fallback)');
        this.credentials = {
          api_key: finalFallbackKey,
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        };
        return finalFallbackKey;
      } else if (finalFallbackKey) {
        console.error('❌ Final fallback also contains placeholder value:', finalFallbackKey);
        console.error('🚫 Authentication completely failed: No valid API key source available');
        console.error('🔧 To fix this issue:');
        console.error('   1. Set DEEPGRAM_API_KEY in Supabase Edge Function secrets, OR');
        console.error('   2. Replace placeholder in .env.local with real Deepgram API key');
      }

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async validateUsage(): Promise<UsageStatus> {
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('No active session for usage validation');
        // Allow usage in development mode or return default for public users
        const isDev = import.meta.env.NODE_ENV === 'development' || import.meta.env.VITE_DEBUG_MODE === 'true';
        return {
          can_use: isDev,
          current_usage: 0,
          quota: null,
          remaining: null
        };
      }

      // Try server-side usage validation first
      const { data, error } = await supabase.functions.invoke('deepgram-auth', {
        body: { action: 'validate_usage' }
      });

      if (!error && data) {
        console.log('Successfully validated usage with server');
        return data;
      }

      // Log warning if server validation fails
      if (error) {
        console.warn('Server-side usage validation failed:', error.message);
      }

      // In development mode or if server fails, allow usage
      const isDev = import.meta.env.NODE_ENV === 'development' || import.meta.env.VITE_DEBUG_MODE === 'true';
      
      if (isDev) {
        console.log('Development mode: Allowing usage without server validation');
      } else {
        console.warn('Server validation failed, allowing usage by default');
      }

      return {
        can_use: true,
        current_usage: 0,
        quota: null,
        remaining: null
      };
    } catch (error) {
      console.error('Error validating usage:', error);
      // Default to allowing usage if validation fails
      return {
        can_use: true,
        current_usage: 0,
        quota: null,
        remaining: null
      };
    }
  }

  async logUsage(usageData: UsageData): Promise<void> {
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('No active session for usage logging');
        const isDev = import.meta.env.NODE_ENV === 'development' || import.meta.env.VITE_DEBUG_MODE === 'true';
        if (isDev) {
          console.log('Development mode: Logging usage locally:', usageData);
        }
        return;
      }

      // Try server-side usage logging first
      const { error } = await supabase.functions.invoke('deepgram-auth', {
        body: { 
          action: 'log_usage',
          usage_data: usageData
        }
      });

      if (!error) {
        console.log('Successfully logged usage to server:', usageData);
        return;
      }

      // Log warning if server logging fails
      console.warn('Server-side usage logging failed:', error.message);
      
      // In development mode or if server fails, log locally
      const isDev = import.meta.env.NODE_ENV === 'development' || import.meta.env.VITE_DEBUG_MODE === 'true';
      
      if (isDev) {
        console.log('Development mode: Logging usage locally:', usageData);
      } else {
        console.log('Server logging failed, logging locally:', usageData);
      }
    } catch (error) {
      console.error('Error logging usage:', error);
      // Don't throw error - usage logging should not break the main functionality
      console.log('Fallback: Logging usage locally:', usageData);
    }
  }

  clearCredentials(): void {
    this.credentials = null;
  }

  // Get current credentials without refreshing (for debugging)
  getCurrentCredentials(): DeepgramCredentials | null {
    return this.credentials;
  }

  // Check if credentials are valid
  hasValidCredentials(): boolean {
    return this.credentials !== null && 
           new Date(this.credentials.expires_at) > new Date(Date.now() + 60000);
  }
}

// Singleton instance
export const deepgramAuth = new DeepgramAuthManager();

// React hook for using Deepgram authentication
export function useDeepgramAuth() {
  return {
    getApiKey: deepgramAuth.getApiKey.bind(deepgramAuth),
    validateUsage: deepgramAuth.validateUsage.bind(deepgramAuth),
    logUsage: deepgramAuth.logUsage.bind(deepgramAuth),
    clearCredentials: deepgramAuth.clearCredentials.bind(deepgramAuth),
    hasValidCredentials: deepgramAuth.hasValidCredentials.bind(deepgramAuth)
  };
}

export type { DeepgramCredentials, UsageData, UsageStatus };