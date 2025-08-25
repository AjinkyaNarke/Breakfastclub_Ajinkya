import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface VoiceConfidenceProps {
  confidence: number;
  previousConfidence?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoiceConfidence: React.FC<VoiceConfidenceProps> = ({
  confidence,
  previousConfidence,
  showDetails = true,
  size = 'md',
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      progressHeight: 'h-1',
      textSize: 'text-xs',
      iconSize: 'h-3 w-3',
      badgeSize: 'text-xs',
    },
    md: {
      progressHeight: 'h-2',
      textSize: 'text-sm',
      iconSize: 'h-4 w-4',
      badgeSize: 'text-sm',
    },
    lg: {
      progressHeight: 'h-3',
      textSize: 'text-base',
      iconSize: 'h-5 w-5',
      badgeSize: 'text-base',
    },
  };

  const config = sizeConfig[size];

  // Get confidence level and color
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.95) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200' };
    if (conf >= 0.9) return { level: 'Very Good', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (conf >= 0.8) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (conf >= 0.7) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    if (conf >= 0.6) return { level: 'Poor', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    return { level: 'Very Poor', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  // Get progress color
  const getProgressColor = (conf: number) => {
    if (conf >= 0.9) return 'bg-green-500';
    if (conf >= 0.7) return 'bg-blue-500';
    if (conf >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get badge variant
  const getBadgeVariant = (conf: number) => {
    if (conf >= 0.9) return 'default';
    if (conf >= 0.7) return 'secondary';
    return 'destructive';
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (!previousConfidence) return <Minus className={config.iconSize} />;
    
    const diff = confidence - previousConfidence;
    if (diff > 0.05) return <TrendingUp className={cn(config.iconSize, 'text-green-500')} />;
    if (diff < -0.05) return <TrendingDown className={cn(config.iconSize, 'text-red-500')} />;
    return <Minus className={cn(config.iconSize, 'text-gray-400')} />;
  };

  // Get status icon
  const getStatusIcon = () => {
    const { level } = getConfidenceLevel(confidence);
    if (level === 'Excellent' || level === 'Very Good') {
      return <CheckCircle className={cn(config.iconSize, 'text-green-500')} />;
    }
    if (level === 'Poor' || level === 'Very Poor') {
      return <AlertTriangle className={cn(config.iconSize, 'text-red-500')} />;
    }
    return <Minus className={cn(config.iconSize, 'text-yellow-500')} />;
  };

  const confidenceLevel = getConfidenceLevel(confidence);
  const progressColor = getProgressColor(confidence);
  const badgeVariant = getBadgeVariant(confidence);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Main Confidence Display */}
      <div className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        confidenceLevel.bgColor,
        confidenceLevel.borderColor
      )}>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <p className={cn('font-medium', config.textSize, confidenceLevel.color)}>
              {confidenceLevel.level}
            </p>
            <p className={cn('text-gray-600', config.textSize)}>
              Confidence Score
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <Badge variant={badgeVariant} className={config.badgeSize}>
            {(confidence * 100).toFixed(1)}%
          </Badge>
          {previousConfidence && (
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon()}
              <span className={cn('text-gray-500', config.textSize)}>
                {((confidence - previousConfidence) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn('text-gray-600', config.textSize)}>Accuracy</span>
          <span className={cn('font-mono', config.textSize, confidenceLevel.color)}>
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <Progress 
          value={confidence * 100} 
          className={cn(config.progressHeight)}
          style={{
            '--progress-color': confidence >= 0.9 ? '#10b981' : 
                               confidence >= 0.7 ? '#3b82f6' : 
                               confidence >= 0.5 ? '#f59e0b' : '#ef4444'
          } as React.CSSProperties}
        />
      </div>

      {/* Detailed Analysis */}
      {showDetails && (
        <Card className="mt-3">
          <CardHeader className="pb-2">
            <CardTitle className={cn('text-gray-700', config.textSize)}>
              Confidence Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Confidence Ranges */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>90-100%: Excellent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>80-89%: Good</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>70-79%: Fair</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>&lt;70%: Poor</span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="border-t pt-2">
              <p className={cn('font-medium text-gray-700 mb-1', config.textSize)}>
                Recommendations:
              </p>
              <ul className={cn('text-gray-600 space-y-1', config.textSize)}>
                {confidence < 0.7 && (
                  <>
                    <li>• Speak more clearly and slowly</li>
                    <li>• Reduce background noise</li>
                    <li>• Move closer to the microphone</li>
                  </>
                )}
                {confidence >= 0.7 && confidence < 0.9 && (
                  <>
                    <li>• Good recognition, minor improvements possible</li>
                    <li>• Consider speaking slightly slower</li>
                  </>
                )}
                {confidence >= 0.9 && (
                  <li>• Excellent recognition quality!</li>
                )}
              </ul>
            </div>

            {/* Historical Comparison */}
            {previousConfidence && (
              <div className="border-t pt-2">
                <p className={cn('font-medium text-gray-700 mb-1', config.textSize)}>
                  Previous Score: {(previousConfidence * 100).toFixed(1)}%
                </p>
                <p className={cn('text-gray-600', config.textSize)}>
                  {confidence > previousConfidence 
                    ? 'Improvement detected' 
                    : confidence < previousConfidence 
                    ? 'Quality decreased' 
                    : 'No change in quality'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Compact confidence indicator
interface CompactConfidenceProps {
  confidence: number;
  showPercentage?: boolean;
  className?: string;
}

export const CompactConfidence: React.FC<CompactConfidenceProps> = ({
  confidence,
  showPercentage = true,
  className = '',
}) => {
  const getColor = () => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-blue-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIcon = () => {
    if (confidence >= 0.9) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.7) return <Minus className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {getIcon()}
      {showPercentage && (
        <span className={cn('font-mono text-sm', getColor())}>
          {(confidence * 100).toFixed(1)}%
        </span>
      )}
    </div>
  );
};

// Confidence meter with visual indicator
interface ConfidenceMeterProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  confidence,
  size = 'md',
  className = '',
}) => {
  const sizeConfig = {
    sm: { width: 60, height: 8 },
    md: { width: 80, height: 10 },
    lg: { width: 120, height: 12 },
  };

  const config = sizeConfig[size];

  const getGradient = () => {
    if (confidence >= 0.9) return 'from-green-400 to-green-600';
    if (confidence >= 0.7) return 'from-blue-400 to-blue-600';
    if (confidence >= 0.5) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full bg-gray-200 overflow-hidden',
          `bg-gradient-to-r ${getGradient()}`
        )}
        style={{
          width: config.width,
          height: config.height,
        }}
      >
        <div
          className="h-full bg-white transition-all duration-300 ease-out"
          style={{
            width: `${(1 - confidence) * 100}%`,
            marginLeft: 'auto',
          }}
        />
      </div>
      <span className="text-sm font-mono text-gray-600">
        {(confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
}; 