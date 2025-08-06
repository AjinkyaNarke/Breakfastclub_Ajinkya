// Usage:
// <VoiceInput language="de" onResult={text => setField(text)} label="Dictate Ingredient" />
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  language: string;
  onResult: (text: string) => void;
  label?: string;
  onStateChange?: (state: {
    isListening: boolean;
    isConnected: boolean;
    audioLevel: number;
    confidence: number;
    duration: number;
  }) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ language, onResult, label, onStateChange }) => {
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const recognitionRef = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const isSpeechSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  // Focus the button on mount for keyboard users
  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.tabIndex = 0;
    }
  }, []);

  // Keyboard shortcut: Space/Enter to start/stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === buttonRef.current) {
        if ((e.key === ' ' || e.key === 'Enter') && !loading) {
          e.preventDefault();
          if (listening) stopListening();
          else startListening();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listening, loading]);

  // Whenever relevant state changes, call onStateChange if provided
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isListening: listening,
        isConnected: !loading && !error,
        audioLevel: 0, // If you have audio level logic, set it here
        confidence: confidence || 0,
        duration: 0 // If you have duration logic, set it here
      });
    }
  }, [listening, loading, error, confidence, onStateChange]);

  const startListening = () => {
    if (!isSpeechSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    setError(null);
    setResult(null);
    setConfidence(null);
    setListening(true);
    setLoading(true);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === 'de' ? 'de-DE' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setLoading(false);
    };
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      const conf = event.results[0][0].confidence;
      setConfidence(conf);
      
      // Process with DeepSeek if available
      try {
        const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
        if (DEEPSEEK_API_KEY) {
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                {
                  role: 'system',
                  content: 'You are a text processor for restaurant menu dictation. Clean up the transcribed text, fix grammar, and format it properly. Return only the cleaned text without additional commentary.'
                },
                {
                  role: 'user',
                  content: transcript
                }
              ],
              max_tokens: 500,
              temperature: 0.1
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
              const processedText = data.choices[0].message.content.trim();
              setResult(processedText);
              onResult(processedText);
            } else {
              setResult(transcript);
              onResult(transcript);
            }
          } else {
            setResult(transcript);
            onResult(transcript);
          }
        } else {
          setResult(transcript);
          onResult(transcript);
        }
      } catch (err) {
        console.warn('DeepSeek processing failed, using raw transcript:', err);
        setResult(transcript);
        onResult(transcript);
      }
      
      setListening(false);
      setLoading(false);
      setRetryCount(0);
    };

    recognition.onerror = (event: any) => {
      let message = '';
      switch (event.error) {
        case 'not-allowed':
          message = 'Microphone access denied. Please allow microphone permissions.';
          break;
        case 'no-speech':
          message = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          message = 'No microphone found. Please check your device.';
          break;
        default:
          message = `Speech recognition error: ${event.error}`;
      }
      setError(message);
      setListening(false);
      setLoading(false);
      // Retry up to 2 times for recoverable errors
      if ((event.error === 'no-speech' || event.error === 'audio-capture') && retryCount < 2) {
        setRetryCount(retryCount + 1);
        setTimeout(() => startListening(), 1000);
      } else {
        setRetryCount(0);
      }
    };

    recognition.onend = () => {
      setListening(false);
      setLoading(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium mb-2" htmlFor="voice-dictation-btn">{label}</label>}
      <div className="flex items-center space-x-2">
        <Button
          id="voice-dictation-btn"
          ref={buttonRef}
          type="button"
          variant={listening ? "destructive" : "default"}
          size="sm"
          aria-pressed={listening}
          aria-label={listening ? 'Stop dictation' : 'Start dictation'}
          aria-live="polite"
          aria-controls="voice-dictation-transcript"
          onClick={listening ? stopListening : startListening}
          disabled={loading}
          className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {listening ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
          <span className="sr-only">{listening ? 'Stop dictation' : 'Start dictation'}</span>
          {listening ? 'Stop Listening' : 'Start Dictation'}
        </Button>
        {loading && <span className="text-sm text-muted-foreground" role="status">Processing...</span>}
      </div>
      {error && <div className="text-sm text-red-600 mt-1" role="alert">{error}</div>}
      <div
        id="voice-dictation-transcript"
        ref={transcriptRef}
        className="text-sm text-green-700 mt-2 p-2 bg-green-50 rounded border"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        {result && (
          <>
            <strong>Transcribed:</strong> {result}
            {confidence !== null && (
              <span className="ml-2 text-xs text-gray-500">(Confidence: {(confidence * 100).toFixed(1)}%)</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Add proper type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
} 