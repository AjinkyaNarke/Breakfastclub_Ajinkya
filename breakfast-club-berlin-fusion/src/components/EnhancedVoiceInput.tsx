import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeepgramRecording } from '@/hooks/useDeepgram';
import { Mic, MicOff, Wifi, WifiOff, AlertCircle, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { cleanVoiceInput } from '@/utils/textCleaning';

interface EnhancedVoiceInputProps {
  language?: string;
  onResult: (text: string, detectedLanguage?: string) => void;
  onError?: (error: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  model?: 'nova-2' | 'nova' | 'enhanced' | 'base';
  enableLanguageDetection?: boolean;
}

export const EnhancedVoiceInput: React.FC<EnhancedVoiceInputProps> = ({
  language = 'en',
  onResult,
  onError,
  label = 'Voice Input',
  className = '',
  disabled = false,
  model = 'nova-2',
  enableLanguageDetection = true
}) => {
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isStartingRecording, setIsStartingRecording] = useState(false);

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
      model,
      language,
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1500,
      vad_events: true
    },
    onTranscript: (result) => {
      if (result.is_final && result.transcript.trim()) {
        const newText = result.transcript.trim();
        setFinalTranscript(prev => prev ? `${prev} ${newText}` : newText);
      }
    },
    onError: (errorMessage) => {
      onError?.(errorMessage);
    }
  });

  // Send final transcript when recording stops
  useEffect(() => {
    if (!isRecording && finalTranscript) {
      // Clean the voice input and detect language
      const { cleanedText, detectedLanguage } = cleanVoiceInput(finalTranscript);
      
      if (cleanedText.trim()) {
        // Pass both cleaned text and detected language to parent
        onResult(cleanedText, enableLanguageDetection ? detectedLanguage : undefined);
        
        // Show toast with detected language info
        if (enableLanguageDetection && detectedLanguage !== 'unknown') {
          const langName = detectedLanguage === 'de' ? 'German' : 'English';
          toast({
            title: `${langName} detected`,
            description: `Input language: ${langName}`,
            duration: 2000,
          });
        }
      }
      
      setFinalTranscript('');
    }
  }, [isRecording, finalTranscript, onResult, enableLanguageDetection]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleToggleRecording = async () => {
    if (!isRecording && !isStartingRecording) {
      try {
        setIsStartingRecording(true);
        
        // Comprehensive browser compatibility checks
        console.log('🔍 Checking browser compatibility...');
        
        // Check WebSocket support
        if (!window.WebSocket) {
          throw new Error('WebSocket not supported in this browser. Please use Chrome, Edge, or Safari.');
        }
        
        // Check MediaDevices support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Microphone access not supported in this browser. Please use Chrome, Edge, or Safari.');
        }

        // Check MediaRecorder support
        if (!window.MediaRecorder) {
          throw new Error('MediaRecorder not supported in this browser. Please use Chrome, Edge, or Safari.');
        }

        // Check MediaRecorder constructor
        try {
          // Test if we can create a MediaRecorder with a dummy stream
          const dummyCanvas = document.createElement('canvas');
          const dummyStream = dummyCanvas.captureStream();
          const dummyRecorder = new MediaRecorder(dummyStream);
          dummyRecorder.stop(); // Clean up immediately
          console.log('✅ MediaRecorder constructor test passed');
        } catch (err) {
          console.error('❌ MediaRecorder constructor test failed:', err);
          throw new Error('MediaRecorder constructor not working in this browser. Please use Chrome, Edge, or Safari.');
        }

        // Check if running on HTTPS or localhost
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          throw new Error('Microphone access requires HTTPS or localhost. Please use HTTPS or localhost.');
        }

        // Check if we can get supported MIME types
        const supportedTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
          'audio/wav'
        ].filter(type => MediaRecorder.isTypeSupported(type));
        
        console.log('✅ Supported MIME types:', supportedTypes);
        
        if (supportedTypes.length === 0) {
          console.warn('⚠️ No supported MIME types found, proceeding with default');
        }

        console.log('✅ Browser compatibility check passed');
        console.log('🎤 Starting voice recording...');
        await startRecording();
      } catch (error) {
        console.error('❌ Failed to start recording:', error);
        toast({
          title: 'Recording Failed',
          description: error instanceof Error ? error.message : 'Failed to start recording',
          variant: 'destructive',
        });
      } finally {
        setIsStartingRecording(false);
      }
    } else if (isRecording) {
      console.log('⏹️ Stopping voice recording...');
      stopRecording();
    }
  };

  const getConnectionIcon = () => {
    switch (connectionState) {
      case 'connected': return <Wifi className="h-3 w-3 text-green-500" />;
      case 'connecting': return <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <WifiOff className="h-3 w-3 text-gray-500" />;
    }
  };

  const getButtonVariant = () => {
    if (error) return 'destructive';
    if (isRecording || isStartingRecording) return 'default';
    return 'outline';
  };

  const getButtonText = () => {
    if (error && error.includes('MediaRecorder')) return 'Browser Not Supported';
    if (error && error.includes('Permission')) return 'Permission Denied';
    if (error && error.includes('HTTPS')) return 'HTTPS Required';
    if (error && error.includes('API key')) return 'Setup Required';
    if (isStartingRecording) return 'Starting...';
    if (isConnecting) return 'Connecting...';
    if (isRecording) return 'Stop Recording';
    if (!isConnected && !error) return 'Connect & Record';
    if (error) return 'Retry Voice Input';
    return 'Start Voice Input';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with label and connection status */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {getConnectionIcon()}
          <Badge variant="outline" className="text-xs">
            {connectionState}
          </Badge>
        </div>
      </div>

      {/* Recording button with enhanced visual feedback */}
      <div className="relative">
        <Button
          type="button"
          onClick={handleToggleRecording}
          disabled={disabled || isConnecting || isStartingRecording}
          variant={getButtonVariant()}
          className={cn(
            "w-full flex items-center gap-2 transition-all duration-200",
            isRecording && "bg-red-500 hover:bg-red-600 text-white animate-pulse",
            isStartingRecording && "bg-orange-500 hover:bg-orange-600 text-white animate-pulse",
            (isConnecting || isStartingRecording) && "opacity-50"
          )}
        >
          {isRecording ? (
            <>
              <div className="relative">
                <MicOff className="h-4 w-4" />
                <div className="absolute -inset-1 bg-red-400 rounded-full animate-ping opacity-75" />
              </div>
              <Volume2 className="h-3 w-3 animate-bounce" />
            </>
          ) : isStartingRecording ? (
            <>
              <div className="relative">
                <Mic className="h-4 w-4 animate-spin" />
                <div className="absolute -inset-1 bg-orange-400 rounded-full animate-ping opacity-75" />
              </div>
            </>
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {getButtonText()}
        </Button>
        
        {/* Audio level indicator */}
        {isRecording && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 bg-red-400 rounded-full animate-pulse",
                  `h-${Math.floor(Math.random() * 4) + 2}`
                )}
                style={{
                  animationDelay: `${i * 100}ms`,
                  height: `${Math.floor(Math.random() * 12) + 4}px`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Real-time transcript display with enhanced styling */}
      {(currentTranscript || finalTranscript) && (
        <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
          {currentTranscript && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <div className="text-blue-700 text-xs font-medium">Listening...</div>
              </div>
              <div className="text-blue-800 text-sm italic leading-relaxed">{currentTranscript}</div>
            </div>
          )}
          
          {finalTranscript && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="text-green-700 text-xs font-medium">Recognized</div>
              </div>
              <div className="text-green-800 text-sm leading-relaxed font-medium">{finalTranscript}</div>
            </div>
          )}
        </div>
      )}

      {/* Usage info with progress bar */}
      {usageStatus && (
        <div className="bg-gray-50 rounded-lg p-3 border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">Voice Usage</span>
            <span className="text-xs text-gray-500">
              {usageStatus.current_usage?.toFixed(1) || 0}/{usageStatus.quota || '∞'} min
            </span>
          </div>
          {usageStatus.quota && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((usageStatus.current_usage / usageStatus.quota) * 100, 100)}%` 
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error display with enhanced styling and helpful guidance */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-3 shadow-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="h-4 w-4 animate-pulse" />
            <span className="font-medium text-sm">Voice Input Error</span>
          </div>
          <div className="text-red-600 text-sm leading-relaxed">{error}</div>
          <div className="text-xs text-red-500 mt-2 space-y-1">
            {error.includes('Permission') && (
              <div>• Allow microphone access in your browser settings</div>
            )}
            {error.includes('HTTPS') && (
              <div>• Voice input requires HTTPS or localhost</div>
            )}
            {error.includes('MediaRecorder') && (
              <div>• Try using Chrome, Edge, or Safari for best compatibility</div>
            )}
            {error.includes('API key') && (
              <div>• Please add your Deepgram API key to the .env.local file</div>
            )}
            {!error.includes('Permission') && !error.includes('HTTPS') && !error.includes('MediaRecorder') && !error.includes('API key') && (
              <div>• Try refreshing the page or check your microphone connection</div>
            )}
          </div>
        </div>
      )}

      {/* Language and model info with badges */}
      <div className="flex justify-between items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {language === 'de' ? '🇩🇪 German' : '🇺🇸 English'}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {model} AI
        </Badge>
      </div>
    </div>
  );
};

export default EnhancedVoiceInput;