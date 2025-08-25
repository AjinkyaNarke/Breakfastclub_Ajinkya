import React from 'react';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Pause, Square, AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PulseAnimation, LoadingSpinner } from './VoiceAnimations';

interface VoiceRecordingStatesProps {
  state: 'idle' | 'connecting' | 'connected' | 'listening' | 'paused' | 'processing' | 'error' | 'complete';
  audioLevel?: number;
  duration?: number;
  error?: string;
  className?: string;
}

export const VoiceRecordingStates: React.FC<VoiceRecordingStatesProps> = ({
  state,
  audioLevel = 0,
  duration = 0,
  error,
  className = '',
}) => {
  const getStateConfig = () => {
    switch (state) {
      case 'idle':
        return {
          icon: <MicOff className="h-6 w-6" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'Ready to record',
          description: 'Click to start voice recognition',
          badge: 'default',
        };
      case 'connecting':
        return {
          icon: <LoadingSpinner isActive={true} size="lg" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: 'Connecting...',
          description: 'Establishing connection to voice service',
          badge: 'secondary',
        };
      case 'connected':
        return {
          icon: <Wifi className="h-6 w-6" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Connected',
          description: 'Ready to listen for speech',
          badge: 'default',
        };
      case 'listening':
        return {
          icon: <Mic className="h-6 w-6" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: 'Listening',
          description: 'Speak now...',
          badge: 'secondary',
        };
      case 'paused':
        return {
          icon: <Pause className="h-6 w-6" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: 'Paused',
          description: 'Recording paused',
          badge: 'secondary',
        };
      case 'processing':
        return {
          icon: <LoadingSpinner isActive={true} size="lg" />,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          text: 'Processing',
          description: 'Analyzing speech...',
          badge: 'secondary',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-6 w-6" />,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Error',
          description: error || 'An error occurred',
          badge: 'destructive',
        };
      case 'complete':
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Complete',
          description: 'Voice recognition finished',
          badge: 'default',
        };
      default:
        return {
          icon: <Mic className="h-6 w-6" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: 'Unknown',
          description: 'Unknown state',
          badge: 'secondary',
        };
    }
  };

  const config = getStateConfig();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className={cn(
          'flex items-center gap-4 p-3 rounded-lg border transition-all duration-300',
          config.bgColor,
          config.borderColor
        )}>
          {/* State Icon */}
          <PulseAnimation isActive={state === 'listening'} intensity="medium">
            <div className={cn('flex items-center justify-center', config.color)}>
              {config.icon}
            </div>
          </PulseAnimation>

          {/* State Information */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn('font-medium', config.color)}>
                {config.text}
              </h3>
              <Badge variant={config.badge as any} className="text-xs">
                {state.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {config.description}
            </p>
          </div>

          {/* Additional Info */}
          <div className="text-right">
            {duration > 0 && (
              <div className="text-sm font-mono text-gray-500">
                {formatDuration(duration)}
              </div>
            )}
            {audioLevel > 0 && state === 'listening' && (
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(audioLevel * 100)}% volume
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact state indicator
interface CompactStateIndicatorProps {
  state: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const CompactStateIndicator: React.FC<CompactStateIndicatorProps> = ({
  state,
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeConfig = {
    sm: { icon: 'h-3 w-3', text: 'text-xs' },
    md: { icon: 'h-4 w-4', text: 'text-sm' },
    lg: { icon: 'h-5 w-5', text: 'text-base' },
  };

  const config = sizeConfig[size];

  const getStateIcon = () => {
    switch (state) {
      case 'idle': return <MicOff className={config.icon} />;
      case 'connecting': return <Clock className={config.icon} />;
      case 'connected': return <Wifi className={config.icon} />;
      case 'listening': return <Mic className={config.icon} />;
      case 'paused': return <Pause className={config.icon} />;
      case 'processing': return <LoadingSpinner isActive={true} size="sm" />;
      case 'error': return <AlertCircle className={config.icon} />;
      case 'complete': return <CheckCircle className={config.icon} />;
      default: return <Mic className={config.icon} />;
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'idle': return 'text-gray-400';
      case 'connecting': return 'text-blue-500';
      case 'connected': return 'text-green-500';
      case 'listening': return 'text-blue-500';
      case 'paused': return 'text-yellow-500';
      case 'processing': return 'text-purple-500';
      case 'error': return 'text-red-500';
      case 'complete': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex items-center justify-center', getStateColor())}>
        {getStateIcon()}
      </div>
      {showText && (
        <span className={cn('font-medium', config.text, getStateColor())}>
          {state.charAt(0).toUpperCase() + state.slice(1)}
        </span>
      )}
    </div>
  );
};

// Audio level indicator
interface AudioLevelIndicatorProps {
  level: number;
  isActive: boolean;
  className?: string;
}

export const AudioLevelIndicator: React.FC<AudioLevelIndicatorProps> = ({
  level,
  isActive,
  className = '',
}) => {
  const getLevelColor = () => {
    if (level > 0.8) return 'bg-red-500';
    if (level > 0.6) return 'bg-yellow-500';
    if (level > 0.3) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-end gap-1 h-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'w-1 rounded-full transition-all duration-100',
              getLevelColor(),
              isActive ? 'opacity-100' : 'opacity-30'
            )}
            style={{
              height: isActive ? `${Math.max(20, level * 100 * (index + 1) / 5)}%` : '20%',
            }}
          />
        ))}
      </div>
      {isActive && (
        <span className="text-xs text-gray-500 font-mono">
          {Math.round(level * 100)}%
        </span>
      )}
    </div>
  );
};

// Connection status indicator
interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  className = '',
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'w-2 h-2 rounded-full transition-all duration-300',
        isConnecting ? 'bg-yellow-500 animate-pulse' :
        isConnected ? 'bg-green-500' : 'bg-red-500'
      )} />
      <span className="text-xs text-gray-600">
        {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}; 