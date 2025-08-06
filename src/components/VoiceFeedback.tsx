import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceFeedbackProps {
  isListening: boolean;
  isConnected: boolean;
  audioLevel: number;
  confidence: number;
  duration: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceFeedback: React.FC<VoiceFeedbackProps> = ({
  isListening,
  isConnected,
  audioLevel,
  confidence,
  duration,
  className = '',
  size = 'md',
}) => {
  const micRef = useRef<HTMLDivElement>(null);
  const volumeBarsRef = useRef<HTMLDivElement>(null);

  // Size configurations
  const sizeConfig = {
    sm: {
      micSize: 'h-8 w-8',
      barHeight: 'h-12',
      barWidth: 'w-1',
      gap: 'gap-1',
      textSize: 'text-xs',
    },
    md: {
      micSize: 'h-12 w-12',
      barHeight: 'h-16',
      barWidth: 'w-1.5',
      gap: 'gap-1.5',
      textSize: 'text-sm',
    },
    lg: {
      micSize: 'h-16 w-16',
      barHeight: 'h-20',
      barWidth: 'w-2',
      gap: 'gap-2',
      textSize: 'text-base',
    },
  };

  const config = sizeConfig[size];

  // Animated microphone with pulsing effect
  useEffect(() => {
    if (!micRef.current) return;

    if (isListening) {
      micRef.current.classList.add('animate-pulse');
    } else {
      micRef.current.classList.remove('animate-pulse');
    }
  }, [isListening]);

  // Generate volume bars
  const generateVolumeBars = () => {
    const bars = [];
    const numBars = 8;
    const maxHeight = 100;

    for (let i = 0; i < numBars; i++) {
      const barHeight = isListening ? Math.random() * maxHeight * audioLevel : 0;
      const opacity = isListening ? 0.3 + (audioLevel * 0.7) : 0.1;
      
      bars.push(
        <div
          key={i}
          className={cn(
            'bg-blue-500 rounded-full transition-all duration-75 ease-out',
            config.barWidth
          )}
          style={{
            height: `${barHeight}%`,
            opacity,
          }}
        />
      );
    }

    return bars;
  };

  // Get confidence color
  const getConfidenceColor = () => {
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get status color
  const getStatusColor = () => {
    if (!isConnected) return 'text-gray-400';
    if (isListening) return 'text-blue-500';
    return 'text-green-500';
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      {/* Main Microphone Icon */}
      <div className="relative">
        <div
          ref={micRef}
          className={cn(
            'flex items-center justify-center rounded-full border-2 transition-all duration-300',
            config.micSize,
            isConnected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50',
            isListening && 'border-blue-600 bg-blue-100 shadow-lg'
          )}
        >
          {isConnected ? (
            <Mic className={cn('transition-colors duration-300', getStatusColor())} />
          ) : (
            <MicOff className="text-gray-400" />
          )}
        </div>

        {/* Pulsing ring effect when listening */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75" />
        )}

        {/* Connection status indicator */}
        <div
          className={cn(
            'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      </div>

      {/* Volume Bars */}
      <div className="flex items-end space-x-1">
        <div
          ref={volumeBarsRef}
          className={cn(
            'flex items-end',
            config.barHeight,
            config.gap
          )}
        >
          {generateVolumeBars()}
        </div>
      </div>

      {/* Status Information */}
      <div className="text-center space-y-1">
        {/* Status Text */}
        <p className={cn('font-medium', config.textSize, getStatusColor())}>
          {!isConnected
            ? 'Disconnected'
            : isListening
            ? 'Listening...'
            : 'Ready'}
        </p>

        {/* Duration */}
        {isListening && (
          <p className={cn('text-gray-500', config.textSize)}>
            {formatDuration(duration)}
          </p>
        )}

        {/* Confidence Score */}
        {confidence > 0 && (
          <div className="flex items-center justify-center gap-1">
            <Volume2 className="h-3 w-3 text-gray-400" />
            <span className={cn('font-mono', config.textSize, getConfidenceColor())}>
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Audio Level Indicator */}
      {isListening && (
        <div className="w-full max-w-xs">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-100 ease-out"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <span className={cn('text-gray-500', config.textSize)}>
              {Math.round(audioLevel * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Additional specialized components

interface AnimatedMicProps {
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedMic: React.FC<AnimatedMicProps> = ({
  isActive,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full border-2 transition-all duration-300',
          sizeClasses[size],
          isActive
            ? 'border-blue-500 bg-blue-50 animate-pulse'
            : 'border-gray-300 bg-gray-50'
        )}
      >
        <Mic className={cn('transition-colors duration-300', isActive ? 'text-blue-500' : 'text-gray-400')} />
      </div>
      
      {isActive && (
        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75" />
      )}
    </div>
  );
};

interface VolumeVisualizerProps {
  audioLevel: number;
  isActive: boolean;
  bars?: number;
  className?: string;
}

export const VolumeVisualizer: React.FC<VolumeVisualizerProps> = ({
  audioLevel,
  isActive,
  bars = 8,
  className = '',
}) => {
  const generateBars = () => {
    const barArray = [];
    for (let i = 0; i < bars; i++) {
      const height = isActive ? Math.random() * 100 * audioLevel : 0;
      const opacity = isActive ? 0.3 + (audioLevel * 0.7) : 0.1;
      
      barArray.push(
        <div
          key={i}
          className="bg-blue-500 rounded-full transition-all duration-75 ease-out w-1"
          style={{
            height: `${height}%`,
            opacity,
          }}
        />
      );
    }
    return barArray;
  };

  return (
    <div className={cn('flex items-end gap-1 h-16', className)}>
      {generateBars()}
    </div>
  );
}; 