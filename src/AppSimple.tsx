import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simple test component to check if basic React is working
export function AppSimple() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🎉 App Loading Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg">
              ✅ React is working!
            </div>
            <div className="text-lg">
              ✅ Components are loading!
            </div>
            <div className="text-lg">
              ✅ Styles are applied!
            </div>
            
            <Button 
              onClick={() => alert('Button click works!')}
              className="w-full"
            >
              Test Button Click
            </Button>

            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Environment Check:</h3>
              <div className="text-sm space-y-1">
                <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
                <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
                <div>DeepSeek API: {import.meta.env.VITE_DEEPSEEK_API_KEY ? '✅ Set' : '❌ Missing'}</div>
                <div>Deepgram API: {import.meta.env.VITE_DEEPGRAM_API_KEY ? '✅ Set' : '❌ Missing'}</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h4 className="font-medium mb-2">Next Steps:</h4>
              <ol className="list-decimal list-inside text-sm space-y-1">
                <li>If you see this page, React is working</li>
                <li>Check browser console (F12) for any errors</li>
                <li>Switch back to full app once issues are identified</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
