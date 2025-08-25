import React from 'react';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Volume2, Settings, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface VoiceMobileResponsiveProps {
  isListening: boolean;
  isConnected: boolean;
  audioLevel: number;
  confidence: number;
  currentTranscript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onReset: () => void;
  className?: string;
}

export const VoiceMobileResponsive: React.FC<VoiceMobileResponsiveProps> = ({
  isListening,
  isConnected,
  audioLevel,
  confidence,
  currentTranscript,
  onStartListening,
  onStopListening,
  onReset,
  className = '',
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white border-b">
        <h2 className="text-lg font-semibold text-gray-800">Voice Recognition</h2>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Voice Interface */}
      <Card className="mb-4">
        <CardContent className="p-6">
          {/* Large Touch-Friendly Button */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={isListening ? onStopListening : onStartListening}
              disabled={!isConnected}
              className={cn(
                'w-24 h-24 rounded-full transition-all duration-300',
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600',
                !isConnected && 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {isListening ? (
                <MicOff className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </Button>
          </div>

          {/* Status Display */}
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              {isListening ? 'Listening...' : isConnected ? 'Tap to start' : 'Connecting...'}
            </p>
            {confidence > 0 && (
              <p className="text-xs text-gray-500">
                Confidence: {(confidence * 100).toFixed(1)}%
              </p>
            )}
          </div>

          {/* Audio Level Visualization */}
          {isListening && (
            <div className="flex justify-center mb-4">
              <div className="flex items-end gap-1 h-12">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-2 bg-blue-500 rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(20, audioLevel * 100 * (index + 1) / 8)}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Display */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Transcript</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="p-1 h-6"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
          <div className="min-h-[80px] p-3 bg-gray-50 rounded-lg">
            {currentTranscript ? (
              <p className="text-sm text-gray-800 leading-relaxed">
                {currentTranscript}
                {isListening && (
                  <span className="inline-block w-1 h-4 bg-blue-500 ml-1 animate-pulse" />
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">
                {isListening ? 'Listening for speech...' : 'No transcript yet'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Controls */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={onReset}
          className="h-12 text-sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button
          variant="outline"
          className="h-12 text-sm"
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};

// Mobile-optimized voice feedback component
interface MobileVoiceFeedbackProps {
  isListening: boolean;
  isConnected: boolean;
  audioLevel: number;
  confidence: number;
  className?: string;
}

export const MobileVoiceFeedback: React.FC<MobileVoiceFeedbackProps> = ({
  isListening,
  isConnected,
  audioLevel,
  confidence,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Large Circular Indicator */}
      <div className="relative">
        <div className={cn(
          'w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300',
          isListening 
            ? 'border-blue-500 bg-blue-50 animate-pulse' 
            : isConnected 
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-gray-50'
        )}>
          {isListening ? (
            <Mic className="h-12 w-12 text-blue-500" />
          ) : isConnected ? (
            <Mic className="h-12 w-12 text-green-500" />
          ) : (
            <MicOff className="h-12 w-12 text-gray-400" />
          )}
        </div>
        
        {/* Audio Level Ring */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-75" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-800 mb-1">
          {isListening ? 'Listening' : isConnected ? 'Ready' : 'Disconnected'}
        </p>
        {confidence > 0 && (
          <p className="text-sm text-gray-600">
            {(confidence * 100).toFixed(1)}% confidence
          </p>
        )}
      </div>

      {/* Audio Level Bars */}
      {isListening && (
        <div className="flex items-end gap-1 h-16">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="w-3 bg-blue-500 rounded-full transition-all duration-100"
              style={{
                height: `${Math.max(20, audioLevel * 100 * (index + 1) / 6)}%`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Mobile-optimized transcript component
interface MobileTranscriptProps {
  transcript: string;
  isActive: boolean;
  className?: string;
}

export const MobileTranscript: React.FC<MobileTranscriptProps> = ({
  transcript,
  isActive,
  className = '',
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'p-4 rounded-lg border-2 transition-all duration-200',
        isActive 
          ? 'border-blue-300 bg-blue-50' 
          : 'border-gray-200 bg-gray-50'
      )}>
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
          )} />
          <span className="text-xs font-medium text-gray-600">
            {isActive ? 'Live' : 'Inactive'}
          </span>
        </div>
        
        <div className="min-h-[60px]">
          {transcript ? (
            <p className="text-sm text-gray-800 leading-relaxed">
              {transcript}
              {isActive && (
                <span className="inline-block w-1 h-4 bg-blue-500 ml-1 animate-pulse" />
              )}
            </p>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              {isActive ? 'Listening for speech...' : 'No transcript yet'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized confidence indicator
interface MobileConfidenceProps {
  confidence: number;
  className?: string;
}

export const MobileConfidence: React.FC<MobileConfidenceProps> = ({
  confidence,
  className = '',
}) => {
  const getColor = () => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-blue-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBackgroundColor = () => {
    if (confidence >= 0.9) return 'bg-green-100';
    if (confidence >= 0.7) return 'bg-blue-100';
    if (confidence >= 0.5) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className={cn(
      'flex items-center justify-center p-3 rounded-lg',
      getBackgroundColor(),
      className
    )}>
      <span className={cn('text-lg font-bold', getColor())}>
        {(confidence * 100).toFixed(0)}%
      </span>
      <span className="text-sm text-gray-600 ml-2">confidence</span>
    </div>
  );
}; 