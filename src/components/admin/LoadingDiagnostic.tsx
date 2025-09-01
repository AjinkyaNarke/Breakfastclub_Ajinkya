import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const LoadingDiagnostic = () => {
  const [checks, setChecks] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const results: Record<string, any> = {};

    try {
      // Check 1: Environment Variables
      results.env = {
        supabase_url: !!import.meta.env.VITE_SUPABASE_URL,
        supabase_anon_key: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        deepseek_api: !!import.meta.env.VITE_DEEPSEEK_API_KEY,
        deepgram_api: !!import.meta.env.VITE_DEEPGRAM_API_KEY
      };

      // Check 2: Translation files
      try {
        const commonEn = await fetch('/locales/en/common.json');
        results.translations = {
          common_en: commonEn.ok,
          common_en_status: commonEn.status
        };
      } catch (err) {
        results.translations = { error: err };
      }

      // Check 3: Basic fetch to Supabase
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.from('menu_items').select('count').limit(1);
        results.supabase = {
          connection: !error,
          error: error?.message || null,
          data: data ? 'connected' : 'no data'
        };
      } catch (err) {
        results.supabase = { error: err };
      }

      // Check 4: React Router
      results.router = {
        location: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      };

      // Check 5: Console errors
      results.console_errors = (window as any).__errorLog || 'No error tracking';

      setChecks(results);
    } catch (err) {
      setChecks({ diagnostic_error: err });
    }
    setLoading(false);
  };

  useEffect(() => {
    // Capture console errors
    const originalError = console.error;
    const errors: string[] = [];
    
    console.error = (...args) => {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };

    (window as any).__errorLog = errors;

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Loading Diagnostic Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDiagnostic} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Running Diagnostic...' : 'Check Loading Issues'}
          </Button>

          {Object.keys(checks).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Diagnostic Results:</h3>
              
              {checks.env && (
                <div className="p-3 bg-blue-50 rounded">
                  <h4 className="font-medium">Environment Variables:</h4>
                  <pre className="text-sm mt-2">{JSON.stringify(checks.env, null, 2)}</pre>
                </div>
              )}

              {checks.translations && (
                <div className="p-3 bg-green-50 rounded">
                  <h4 className="font-medium">Translation Files:</h4>
                  <pre className="text-sm mt-2">{JSON.stringify(checks.translations, null, 2)}</pre>
                </div>
              )}

              {checks.supabase && (
                <div className="p-3 bg-purple-50 rounded">
                  <h4 className="font-medium">Supabase Connection:</h4>
                  <pre className="text-sm mt-2">{JSON.stringify(checks.supabase, null, 2)}</pre>
                </div>
              )}

              {checks.router && (
                <div className="p-3 bg-yellow-50 rounded">
                  <h4 className="font-medium">Router Status:</h4>
                  <pre className="text-sm mt-2">{JSON.stringify(checks.router, null, 2)}</pre>
                </div>
              )}

              {checks.console_errors && (
                <div className="p-3 bg-red-50 rounded">
                  <h4 className="font-medium">Console Errors:</h4>
                  <pre className="text-sm mt-2">{JSON.stringify(checks.console_errors, null, 2)}</pre>
                </div>
              )}

              {checks.diagnostic_error && (
                <div className="p-3 bg-red-100 rounded border border-red-200">
                  <h4 className="font-medium text-red-700">Diagnostic Error:</h4>
                  <pre className="text-sm mt-2 text-red-600">{JSON.stringify(checks.diagnostic_error, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded text-sm">
            <h4 className="font-medium mb-2">How to use this diagnostic:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Check Loading Issues" to run all tests</li>
              <li>Review each section for errors or warnings</li>
              <li>Check your browser's Developer Console (F12) for additional errors</li>
              <li>Common issues: missing environment variables, translation file loading, or network errors</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
