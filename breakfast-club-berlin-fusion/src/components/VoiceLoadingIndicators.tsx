import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Clock, CheckCircle, AlertCircle, Mic, Wifi } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner, PulseAnimation } from './VoiceAnimations';

interface VoiceLoadingIndicatorsProps {
  type: 'connecting' | 'processing' | 'parsing' | 'analyzing' | 'complete' | 'error';
  progress?: number;
  message?: string;
  duration?: number;
  className?: string;
  showProgress?: boolean;
}

export const VoiceLoadingIndicators: React.FC<VoiceLoadingIndicatorsProps> = ({
  type,
  progress = 0,
  message,
  duration = 0,
  className = '',
  showProgress = true,
}) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'connecting':
        return {
          icon: <Wifi className="h-5 w-5" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          defaultMessage: 'Connecting to voice service...',
          steps: ['Initializing', 'Establishing connection', 'Authenticating'],
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-5 w-5" />,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          defaultMessage: 'Processing audio...',
          steps: ['Analyzing audio', 'Converting speech', 'Generating transcript'],
        };
      case 'parsing':
        return {
          icon: <Mic className="h-5 w-5" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          defaultMessage: 'Parsing speech data...',
          steps: ['Extracting entities', 'Identifying structure', 'Formatting data'],
        };
      case 'analyzing':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          defaultMessage: 'Analyzing content...',
          steps: ['Processing text', 'Identifying patterns', 'Generating insights'],
        };
      case 'complete':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          defaultMessage: 'Processing complete!',
          steps: ['Success', 'Data ready', 'Complete'],
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          defaultMessage: 'An error occurred',
          steps: ['Error detected', 'Failed to process', 'Please retry'],
        };
      default:
        return {
          icon: <Loader2 className="h-5 w-5" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          defaultMessage: 'Processing...',
          steps: ['Processing', 'Working', 'Complete'],
        };
    }
  };

  const config = getTypeConfig();
  const currentStep = Math.floor((progress / 100) * config.steps.length);
  const currentStepText = config.steps[Math.min(currentStep, config.steps.length - 1)];

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
          {/* Loading Icon */}
          <div className={cn('flex items-center justify-center', config.color)}>
            {type === 'complete' ? (
              config.icon
            ) : type === 'error' ? (
              config.icon
            ) : (
              <PulseAnimation isActive={true} intensity="medium">
                <LoadingSpinner isActive={true} size="lg" />
              </PulseAnimation>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className={cn('font-medium', config.color)}>
                {message || config.defaultMessage}
              </h3>
              <Badge variant={type === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                {type.toUpperCase()}
              </Badge>
            </div>

            {/* Progress Bar */}
            {showProgress && type !== 'complete' && type !== 'error' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{currentStepText}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Duration */}
            {duration > 0 && (
              <div className="text-xs text-gray-500 font-mono">
                Duration: {formatDuration(duration)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact loading indicator
interface CompactLoadingIndicatorProps {
  type: 'connecting' | 'processing' | 'parsing' | 'complete' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CompactLoadingIndicator: React.FC<CompactLoadingIndicatorProps> = ({
  type,
  size = 'md',
  className = '',
}) => {
  const sizeConfig = {
    sm: { icon: 'h-3 w-3', text: 'text-xs' },
    md: { icon: 'h-4 w-4', text: 'text-sm' },
    lg: { icon: 'h-5 w-5', text: 'text-base' },
  };

  const config = sizeConfig[size];

  const getIcon = () => {
    switch (type) {
      case 'connecting': return <Wifi className={config.icon} />;
      case 'processing': return <LoadingSpinner isActive={true} size="sm" />;
      case 'parsing': return <Mic className={config.icon} />;
      case 'complete': return <CheckCircle className={config.icon} />;
      case 'error': return <AlertCircle className={config.icon} />;
      default: return <Loader2 className={config.icon} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'connecting': return 'text-blue-500';
      case 'processing': return 'text-purple-500';
      case 'parsing': return 'text-green-500';
      case 'complete': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex items-center justify-center', getColor())}>
        {getIcon()}
      </div>
      <span className={cn('font-medium', config.text, getColor())}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    </div>
  );
};

// Step-by-step progress indicator
interface StepProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const StepProgressIndicator: React.FC<StepProgressIndicatorProps> = ({
  steps,
  currentStep,
  className = '',
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
              index < currentStep ? 'bg-green-500 text-white' :
              index === currentStep ? 'bg-blue-500 text-white animate-pulse' :
              'bg-gray-200 text-gray-500'
            )}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <span className={cn(
              'text-sm',
              index < currentStep ? 'text-green-600' :
              index === currentStep ? 'text-blue-600 font-medium' :
              'text-gray-500'
            )}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Circular progress indicator
interface CircularProgressIndicatorProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularProgressIndicator: React.FC<CircularProgressIndicatorProps> = ({
  progress,
  size = 60,
  strokeWidth = 4,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-block', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-mono text-gray-600">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}; 