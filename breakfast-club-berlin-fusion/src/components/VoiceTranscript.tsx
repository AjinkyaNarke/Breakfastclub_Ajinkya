import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Mic, MicOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface VoiceTranscriptProps {
  currentTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  isConnected: boolean;
  confidence: number;
  language: 'en' | 'de';
  className?: string;
  showConfidence?: boolean;
  maxHeight?: number;
  autoScroll?: boolean;
}

export const VoiceTranscript: React.FC<VoiceTranscriptProps> = ({
  currentTranscript,
  finalTranscript,
  isListening,
  isConnected,
  confidence,
  language,
  className = '',
  showConfidence = true,
  maxHeight = 200,
  autoScroll = true,
}) => {
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (!autoScroll || !transcriptRef.current) return;

    const scrollToBottom = () => {
      transcriptRef.current!.scrollTop = transcriptRef.current!.scrollHeight;
    };

    // Debounced scroll to avoid excessive scrolling
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [currentTranscript, finalTranscript, autoScroll]);

  // Track transcript changes for animations
  useEffect(() => {
    if (currentTranscript !== lastTranscript) {
      setLastTranscript(currentTranscript);
    }
  }, [currentTranscript, lastTranscript]);

  // Get confidence color
  const getConfidenceColor = () => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get confidence badge variant
  const getConfidenceBadge = () => {
    if (confidence >= 0.9) return 'default';
    if (confidence >= 0.7) return 'secondary';
    return 'destructive';
  };

  // Format confidence for display
  const formatConfidence = (conf: number) => {
    return `${(conf * 100).toFixed(1)}%`;
  };

  // Get language display name
  const getLanguageName = (lang: 'en' | 'de') => {
    return lang === 'en' ? 'English' : 'Deutsch';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!isConnected) return <MicOff className="h-4 w-4 text-gray-400" />;
    if (isListening) return <Mic className="h-4 w-4 text-blue-500 animate-pulse" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  // Get status text
  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (isListening) return 'Listening...';
    return 'Ready';
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </span>
            <Badge variant="outline" className="text-xs">
              {getLanguageName(language)}
            </Badge>
          </div>
          
          {showConfidence && confidence > 0 && (
            <Badge variant={getConfidenceBadge()} className="text-xs">
              {formatConfidence(confidence)}
            </Badge>
          )}
        </div>

        {/* Transcript Container */}
        <div
          ref={transcriptRef}
          className={cn(
            'border rounded-lg p-3 bg-gray-50 overflow-y-auto transition-all duration-200',
            isListening ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
          )}
          style={{ maxHeight: `${maxHeight}px` }}
          onScroll={() => setIsScrolling(true)}
        >
          {/* Final Transcript */}
          {finalTranscript && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium text-green-700">Final</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">
                {finalTranscript}
              </p>
            </div>
          )}

          {/* Current/Interim Transcript */}
          {currentTranscript && (
            <div className={cn(
              'transition-all duration-200',
              finalTranscript ? 'border-t pt-2' : ''
            )}>
              <div className="flex items-center gap-2 mb-1">
                <Mic className="h-3 w-3 text-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-blue-700">Listening...</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed italic">
                {currentTranscript}
                <span className="inline-block w-1 h-4 bg-blue-500 ml-1 animate-pulse" />
              </p>
            </div>
          )}

          {/* Empty State */}
          {!currentTranscript && !finalTranscript && (
            <div className="text-center py-8 text-gray-500">
              <MicOff className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No transcript yet</p>
              <p className="text-xs">Start speaking to see your words appear here</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {finalTranscript && currentTranscript 
              ? `${finalTranscript.length + currentTranscript.length} characters`
              : finalTranscript 
              ? `${finalTranscript.length} characters`
              : currentTranscript 
              ? `${currentTranscript.length} characters`
              : '0 characters'
            }
          </span>
          
          {autoScroll && (
            <span className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full transition-colors duration-200',
                isScrolling ? 'bg-green-500' : 'bg-gray-300'
              )} />
              Auto-scroll {isScrolling ? 'on' : 'off'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Specialized transcript components

interface LiveTranscriptProps {
  transcript: string;
  isActive: boolean;
  className?: string;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  transcript,
  isActive,
  className = '',
}) => {
  return (
    <div className={cn(
      'p-3 border rounded-lg transition-all duration-200',
      isActive 
        ? 'border-blue-300 bg-blue-50' 
        : 'border-gray-200 bg-gray-50',
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          'w-2 h-2 rounded-full animate-pulse',
          isActive ? 'bg-blue-500' : 'bg-gray-400'
        )} />
        <span className="text-xs font-medium text-gray-600">
          {isActive ? 'Live' : 'Inactive'}
        </span>
      </div>
      
      <p className={cn(
        'text-sm leading-relaxed',
        isActive ? 'text-gray-800' : 'text-gray-500'
      )}>
        {transcript || 'Waiting for speech...'}
        {isActive && transcript && (
          <span className="inline-block w-1 h-4 bg-blue-500 ml-1 animate-pulse" />
        )}
      </p>
    </div>
  );
};

interface TranscriptHistoryProps {
  transcripts: Array<{
    id: string;
    text: string;
    timestamp: Date;
    confidence: number;
    isFinal: boolean;
  }>;
  className?: string;
}

export const TranscriptHistory: React.FC<TranscriptHistoryProps> = ({
  transcripts,
  className = '',
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-gray-700 mb-2">Transcript History</h3>
      
      {transcripts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No transcripts yet
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {transcripts.map((transcript) => (
            <div
              key={transcript.id}
              className="p-2 border rounded text-sm bg-white"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  {transcript.timestamp.toLocaleTimeString()}
                </span>
                <Badge variant={transcript.isFinal ? 'default' : 'secondary'} className="text-xs">
                  {transcript.isFinal ? 'Final' : 'Interim'}
                </Badge>
              </div>
              <p className="text-gray-800">{transcript.text}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-gray-500">Confidence:</span>
                <span className={cn(
                  'text-xs font-mono',
                  transcript.confidence >= 0.9 ? 'text-green-600' :
                  transcript.confidence >= 0.7 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {(transcript.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 