import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

export interface ConsentPreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  id: string;
  userSessionId: string;
  consentVersion: string;
  essentialCookies: boolean;
  functionalCookies: boolean;
  analyticsCookies: boolean;
  marketingCookies: boolean;
  consentTimestamp: string;
  expiresAt: string;
  languagePreference: string;
}

const CONSENT_VERSION = '1.0';
const CONSENT_KEY = 'gdpr_consent_preferences';
const SESSION_KEY = 'user_session_id';

export const useConsent = () => {
  const { i18n } = useTranslation();
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false
  });
  const [loading, setLoading] = useState(true);

  // Generate or get session ID
  const getSessionId = useCallback(() => {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  }, []);

  // Load existing consent from localStorage and database
  const loadConsent = useCallback(async () => {
    try {
      const savedConsent = localStorage.getItem(CONSENT_KEY);
      const sessionId = getSessionId();

      if (savedConsent) {
        const parsed = JSON.parse(savedConsent);
        if (parsed.version === CONSENT_VERSION && new Date(parsed.expires) > new Date()) {
          setPreferences({
            essential: parsed.essential,
            functional: parsed.functional,
            analytics: parsed.analytics,
            marketing: parsed.marketing
          });
          setHasConsent(true);
          setLoading(false);
          return;
        }
      }

      // Check database for existing consent
      const { data } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_session_id', sessionId)
        .eq('consent_version', CONSENT_VERSION)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (data) {
        const newPreferences = {
          essential: data.essential_cookies,
          functional: data.functional_cookies,
          analytics: data.analytics_cookies,
          marketing: data.marketing_cookies
        };
        setPreferences(newPreferences);
        setHasConsent(true);
        
        // Sync to localStorage
        localStorage.setItem(CONSENT_KEY, JSON.stringify({
          version: CONSENT_VERSION,
          expires: data.expires_at,
          ...newPreferences
        }));
      } else {
        setHasConsent(false);
      }
    } catch (error) {
      console.error('Error loading consent:', error);
      setHasConsent(false);
    } finally {
      setLoading(false);
    }
  }, [getSessionId]);

  // Save consent preferences
  const saveConsent = useCallback(async (newPreferences: ConsentPreferences) => {
    try {
      const sessionId = getSessionId();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Save to database
      await supabase.from('consent_records').insert({
        user_session_id: sessionId,
        consent_version: CONSENT_VERSION,
        essential_cookies: newPreferences.essential,
        functional_cookies: newPreferences.functional,
        analytics_cookies: newPreferences.analytics,
        marketing_cookies: newPreferences.marketing,
        expires_at: expiresAt.toISOString(),
        ip_address: null, // Could be populated server-side
        user_agent: navigator.userAgent,
        language_preference: i18n.language
      });

      // Save to localStorage
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        expires: expiresAt.toISOString(),
        ...newPreferences
      }));

      setPreferences(newPreferences);
      setHasConsent(true);
    } catch (error) {
      console.error('Error saving consent:', error);
      throw error;
    }
  }, [getSessionId, i18n.language]);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    return saveConsent(allAccepted);
  }, [saveConsent]);

  // Accept only essential cookies
  const acceptEssential = useCallback(() => {
    const essentialOnly = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    return saveConsent(essentialOnly);
  }, [saveConsent]);

  // Withdraw consent
  const withdrawConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    setHasConsent(false);
    setPreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    });
  }, []);

  useEffect(() => {
    loadConsent();
  }, [loadConsent]);

  return {
    hasConsent,
    preferences,
    loading,
    saveConsent,
    acceptAll,
    acceptEssential,
    withdrawConsent,
    getSessionId
  };
};