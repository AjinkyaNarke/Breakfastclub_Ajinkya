import React from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Mic,
  MicOff,
  RefreshCw,
  XCircle,
  WifiOff,
  Wifi,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useVoiceStatus, type VoiceStatus } from '@/hooks/useVoiceStatus';
import { VoiceError } from '@/utils/voiceUtils';

interface VoiceStatusComponentProps {
  status: VoiceStatus;
  error: VoiceError | null;
  retryCount: number;
  connectionAttempts: number;
  isRetrying: boolean;
  canRetry: boolean;
  canConnect: boolean;
  isOffline: boolean;
  isTimeout: boolean;
  onRetry: () => void;
  onClearError: () => void;
  onForceOffline?: () => void;
  onGoOnline?: () => void;
  onProcessOfflineQueue?: () => void;
  offlineQueueLength?: number;
  className?: string;
}

export const VoiceStatusComponent: React.FC<VoiceStatusComponentProps> = ({
  status,
  error,
  retryCount,
  connectionAttempts,
  isRetrying,
  canRetry,
  canConnect,
  isOffline,
  isTimeout,
  onRetry,
  onClearError,
  onForceOffline,
  onGoOnline,
  onProcessOfflineQueue,
  offlineQueueLength = 0,
  className = '',
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
        return <Mic className="h-4 w-4" />;
      case 'connecting':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'listening':
        return <Mic className="h-4 w-4 animate-pulse" />;
      case 'processing':
      case 'parsing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
      case 'timeout':
        return <XCircle className="h-4 w-4" />;
      case 'disconnected':
        return <MicOff className="h-4 w-4" />;
      case 'offline':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Mic className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
      case 'connected':
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
      case 'listening':
      case 'processing':
      case 'parsing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
      case 'timeout':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'offline':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'ready':
        return 'Ready to start voice recognition';
      case 'connecting':
        return `Connecting to voice service... (Attempt ${connectionAttempts + 1}/5)`;
      case 'connected':
        return 'Connected and ready to listen';
      case 'listening':
        return 'Listening for speech...';
      case 'processing':
        return 'Processing audio...';
      case 'parsing':
        return 'Parsing speech data...';
      case 'complete':
        return 'Voice recognition complete';
      case 'error':
        return error?.message || 'An error occurred';
      case 'timeout':
        return 'Operation timed out. Please try again.';
      case 'disconnected':
        return 'Disconnected from voice service';
      case 'offline':
        return 'Working in offline mode';
      default:
        return 'Unknown status';
    }
  };

  const getErrorDetails = (error: VoiceError) => {
    switch (error.type) {
      case 'permission':
        return {
          title: 'Permission Error',
          description: 'Microphone access is required for voice recognition.',
          solution: 'Please allow microphone permissions in your browser settings.',
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      case 'connection':
        return {
          title: 'Connection Error',
          description: 'Failed to connect to the voice recognition service.',
          solution: 'Please check your internet connection and try again.',
          icon: <WifiOff className="h-4 w-4" />,
        };
      case 'network':
        return {
          title: 'Network Error',
          description: 'Network connection issues detected.',
          solution: 'Please check your internet connection and try again.',
          icon: <WifiOff className="h-4 w-4" />,
        };
      case 'api':
        return {
          title: 'Service Error',
          description: 'Voice recognition service is temporarily unavailable.',
          solution: 'Please try again in a few moments.',
          icon: <AlertCircle className="h-4 w-4" />,
        };
      default:
        return {
          title: 'Unknown Error',
          description: error.message,
          solution: 'Please try again or contact support if the problem persists.',
          icon: <AlertCircle className="h-4 w-4" />,
        };
    }
  };

  const getConnectionProgress = () => {
    if (status === 'connecting') {
      return Math.min((connectionAttempts / 5) * 100, 100);
    }
    return 0;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${getStatusColor()} flex items-center gap-1`}>
          {getStatusIcon()}
          <span className="capitalize">{status}</span>
        </Badge>

        {retryCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            Retry {retryCount}/3
          </Badge>
        )}

        {connectionAttempts > 0 && status !== 'connected' && (
          <Badge variant="secondary" className="text-xs">
            Connection {connectionAttempts}/5
          </Badge>
        )}

        {isOffline && offlineQueueLength > 0 && (
          <Badge variant="outline" className="text-xs text-yellow-600">
            {offlineQueueLength} queued
          </Badge>
        )}
      </div>

      {/* Connection Progress */}
      {status === 'connecting' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Connecting...</span>
            <span>{getConnectionProgress().toFixed(0)}%</span>
          </div>
          <Progress value={getConnectionProgress()} className="h-2" />
        </div>
      )}

      {/* Status Message */}
      <p className={`text-sm ${status === 'error' || status === 'timeout' ? 'text-red-600' : 'text-gray-600'}`}>
        {getStatusMessage()}
      </p>

      {/* Offline Mode Card */}
      {isOffline && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
              <WifiOff className="h-4 w-4" />
              Offline Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-yellow-700">
              Voice recognition is currently offline. Some features may be limited.
            </p>

            {offlineQueueLength > 0 && (
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <Info className="h-3 w-3" />
                <span>{offlineQueueLength} actions queued for when connection is restored</span>
              </div>
            )}

            <div className="flex gap-2">
              {onGoOnline && canConnect && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onGoOnline}
                  className="flex items-center gap-1"
                >
                  <Wifi className="h-3 w-3" />
                  Try Online
                </Button>
              )}

              {onProcessOfflineQueue && offlineQueueLength > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onProcessOfflineQueue}
                  className="flex items-center gap-1"
                >
                  <Zap className="h-3 w-3" />
                  Process Queue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div>
              <strong>{getErrorDetails(error).title}</strong>
              <p className="text-sm mt-1">{getErrorDetails(error).description}</p>
            </div>

            <div className="text-sm">
              <strong>Solution:</strong> {getErrorDetails(error).solution}
            </div>

            {/* Error Code for Debugging */}
            {error.code && (
              <div className="text-xs text-gray-500 mt-1">
                Error Code: {error.code}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              {canRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="flex items-center gap-1"
                >
                  {isRetrying ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
              )}

              {onForceOffline && canConnect && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onForceOffline}
                  className="flex items-center gap-1"
                >
                  <WifiOff className="h-3 w-3" />
                  Go Offline
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={onClearError}
                className="flex items-center gap-1"
              >
                <XCircle className="h-3 w-3" />
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Troubleshooting */}
      {status === 'error' && error?.type === 'connection' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
              <Info className="h-4 w-4" />
              Connection Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Ensure the voice service is available</li>
              <li>• Try refreshing the page</li>
              <li>• Check browser console for detailed errors</li>
              <li>• Try using a different browser</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Permission Troubleshooting */}
      {status === 'error' && error?.type === 'permission' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              Microphone Permission Help
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Click the microphone icon in your browser's address bar</li>
              <li>• Select "Allow" for microphone access</li>
              <li>• Refresh the page after granting permission</li>
              <li>• Check browser settings if the icon doesn't appear</li>
              <li>• Try using HTTPS if on HTTP</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Timeout Troubleshooting */}
      {isTimeout && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
              <Clock className="h-4 w-4" />
              Timeout Help
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>• Try speaking more clearly and slowly</li>
              <li>• Reduce background noise</li>
              <li>• Check your microphone is working</li>
              <li>• Try a shorter voice input</li>
              <li>• Check your internet connection speed</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isRetrying && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Attempting to reconnect...</span>
        </div>
      )}

      {/* User Feedback Collection */}
      {(status === 'error' || isTimeout) && (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">
              Help us improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 mb-2">
              Was this error helpful? Let us know what happened.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs">
                Report Issue
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                Not Helpful
              </Button>
            </div>
          </CardContent>
        </Card>
            )}
    </div>
  );
}; 