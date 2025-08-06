import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeepgramRecording } from '@/hooks/useDeepgram';
import { useDeepgramAuth } from '@/lib/deepgramAuth';
import { Mic, MicOff, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

export function DeepgramTestComponent() {
  const [authStatus, setAuthStatus] = useState<string>('');
  const { getApiKey, validateUsage } = useDeepgramAuth();

  const {
    isRecording,
    isConnected,
    isConnecting,
    connectionState,
    transcripts,
    currentTranscript,
    startRecording,
    stopRecording,
    error,
    usageStatus
  } = useDeepgramRecording({
    config: {
      model: 'nova-2',
      language: 'en',
      smart_format: true,
      interim_results: true
    },
    onTranscript: (result) => {
      console.log('Transcript received:', result);
    },
    onError: (error) => {
      console.error('Deepgram error:', error);
    }
  });

  const testAuth = async () => {
    try {
      setAuthStatus('Testing authentication...');
      const apiKey = await getApiKey();
      if (apiKey) {
        setAuthStatus('✅ Authentication successful');
      }
    } catch (error) {
      setAuthStatus(`❌ Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testUsage = async () => {
    try {
      setAuthStatus('Checking usage status...');
      const status = await validateUsage();
      setAuthStatus(`📊 Usage: ${status.current_usage}/${status.quota || '∞'} ${status.can_use ? '(OK)' : '(EXCEEDED)'}`);
    } catch (error) {
      setAuthStatus(`❌ Usage check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionState) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting': return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Deepgram Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <span className="text-sm">
              Connection: <Badge variant={isConnected ? 'default' : 'secondary'}>
                {connectionState}
              </Badge>
            </span>
          </div>

          {/* Usage Status */}
          {usageStatus && (
            <div className="text-sm">
              Usage: {usageStatus.current_usage}/{usageStatus.quota || '∞'} minutes
              {usageStatus.remaining && ` (${usageStatus.remaining} remaining)`}
            </div>
          )}

          {/* Authentication Test */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button size="sm" onClick={testAuth}>
                Test Auth
              </Button>
              <Button size="sm" onClick={testUsage}>
                Check Usage
              </Button>
            </div>
            {authStatus && (
              <div className="text-sm bg-gray-100 p-2 rounded">
                {authStatus}
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="space-y-2">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isConnected && !isRecording}
              variant={isRecording ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            
            {isConnecting && (
              <div className="text-sm text-gray-600">Connecting to Deepgram...</div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error</span>
              </div>
              <div className="text-red-600 text-sm mt-1">{error}</div>
            </div>
          )}

          {/* Current Transcript */}
          {currentTranscript && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-blue-700 font-medium text-sm">Speaking...</div>
              <div className="text-blue-600 italic">{currentTranscript}</div>
            </div>
          )}

          {/* Final Transcripts */}
          {transcripts.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium text-sm">Transcripts:</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {transcripts.filter(t => t.is_final).map((transcript, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded p-2">
                    <div className="text-green-700 text-sm">{transcript.transcript}</div>
                    <div className="text-green-600 text-xs">
                      Confidence: {(transcript.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}