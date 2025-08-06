import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceError } from '@/utils/voiceUtils';

export type VoiceStatus = 
  | 'ready'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'processing'
  | 'parsing'
  | 'complete'
  | 'error'
  | 'disconnected'
  | 'offline'
  | 'timeout';

export interface VoiceStatusState {
  status: VoiceStatus;
  error: VoiceError | null;
  retryCount: number;
  lastErrorTime: number | null;
  isRetrying: boolean;
  timeoutId: NodeJS.Timeout | null;
  offlineQueue: Array<() => void>;
  lastActivityTime: number;
  connectionAttempts: number;
}

export interface UseVoiceStatusOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  maxConnectionAttempts?: number;
  onStatusChange?: (status: VoiceStatus) => void;
  onError?: (error: VoiceError) => void;
  onTimeout?: () => void;
  onOfflineMode?: () => void;
  enableOfflineMode?: boolean;
}

export interface UseVoiceStatusReturn {
  // Current state
  status: VoiceStatus;
  error: VoiceError | null;
  retryCount: number;
  isRetrying: boolean;
  connectionAttempts: number;
  
  // Status checks
  isReady: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isComplete: boolean;
  hasError: boolean;
  isOffline: boolean;
  isTimeout: boolean;
  
  // Actions
  setStatus: (status: VoiceStatus) => void;
  setError: (error: VoiceError | null) => void;
  clearError: () => void;
  retry: () => void;
  reset: () => void;
  forceOffline: () => void;
  goOnline: () => void;
  
  // Utilities
  canRetry: boolean;
  canConnect: boolean;
  getStatusMessage: () => string;
  getStatusColor: () => string;
  getStatusIcon: () => string;
  getTimeSinceLastActivity: () => number;
  addToOfflineQueue: (action: () => void) => void;
  processOfflineQueue: () => void;
}

export function useVoiceStatus(options: UseVoiceStatusOptions = {}): UseVoiceStatusReturn {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000, // 30 seconds
    maxConnectionAttempts = 5,
    onStatusChange,
    onError,
    onTimeout,
    onOfflineMode,
    enableOfflineMode = true,
  } = options;

  const [state, setState] = useState<VoiceStatusState>({
    status: 'ready',
    error: null,
    retryCount: 0,
    lastErrorTime: null,
    isRetrying: false,
    timeoutId: null,
    offlineQueue: [],
    lastActivityTime: Date.now(),
    connectionAttempts: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // Update last activity time
  const updateActivity = useCallback(() => {
    setState(prev => ({ ...prev, lastActivityTime: Date.now() }));
  }, []);

  // Set status with enhanced logic
  const setStatus = useCallback((newStatus: VoiceStatus) => {
    setState(prev => {
      const newState = { ...prev, status: newStatus };
      
      // Clear existing timeouts
      clearAllTimeouts();
      
      // Update activity time
      updateActivity();
      
      // Set timeout for certain statuses
      if (newStatus === 'listening' || newStatus === 'processing' || newStatus === 'parsing') {
        timeoutRef.current = setTimeout(() => {
          setState(current => ({
            ...current,
            status: 'timeout',
            error: {
              type: 'api',
              message: 'Operation timed out. Please try again.',
              code: 'TIMEOUT',
            },
          }));
          onTimeout?.();
        }, timeout);
      }

      // Set connection timeout
      if (newStatus === 'connecting') {
        connectionTimeoutRef.current = setTimeout(() => {
          setState(current => ({
            ...current,
            status: 'error',
            error: {
              type: 'connection',
              message: 'Connection timeout. Please check your internet connection.',
              code: 'CONNECTION_TIMEOUT',
            },
            connectionAttempts: current.connectionAttempts + 1,
          }));
        }, 10000); // 10 second connection timeout
      }

      // Reset connection attempts on successful connection
      if (newStatus === 'connected') {
        newState.connectionAttempts = 0;
      }

      // Handle offline mode
      if (newStatus === 'offline' && enableOfflineMode) {
        onOfflineMode?.();
      }
      
      onStatusChange?.(newStatus);
      return newState;
    });
  }, [timeout, onStatusChange, onTimeout, onOfflineMode, enableOfflineMode, clearAllTimeouts, updateActivity]);

  // Set error with enhanced retry logic
  const setError = useCallback((error: VoiceError | null) => {
    setState(prev => {
      const newState = {
        ...prev,
        error,
        lastErrorTime: error ? Date.now() : null,
        status: error ? 'error' : prev.status,
      };

      if (error) {
        // Increment connection attempts for connection errors
        if (error.type === 'connection') {
          newState.connectionAttempts = prev.connectionAttempts + 1;
        }

        // Auto-retry for certain error types
        if (error.type === 'network' && prev.retryCount < maxRetries) {
          setTimeout(() => retry(), retryDelay);
        }

        onError?.(error);
      }

      return newState;
    });
  }, [maxRetries, retryDelay, onError]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      lastErrorTime: null,
    }));
  }, []);

  // Enhanced retry logic
  const retry = useCallback(() => {
    if (state.retryCount >= maxRetries) {
      setError({
        type: 'api',
        message: `Maximum retry attempts (${maxRetries}) exceeded. Please try again later.`,
        code: 'MAX_RETRIES_EXCEEDED',
      });
      return;
    }

    if (state.connectionAttempts >= maxConnectionAttempts) {
      setError({
        type: 'connection',
        message: `Maximum connection attempts (${maxConnectionAttempts}) exceeded. Switching to offline mode.`,
        code: 'MAX_CONNECTION_ATTEMPTS_EXCEEDED',
      });
      if (enableOfflineMode) {
        setStatus('offline');
      }
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
      error: null,
    }));

    retryTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isRetrying: false,
        status: 'ready',
      }));
    }, retryDelay);
  }, [state.retryCount, state.connectionAttempts, maxRetries, maxConnectionAttempts, retryDelay, setError, setStatus, enableOfflineMode]);

  // Reset all state
  const reset = useCallback(() => {
    clearAllTimeouts();
    setState({
      status: 'ready',
      error: null,
      retryCount: 0,
      lastErrorTime: null,
      isRetrying: false,
      timeoutId: null,
      offlineQueue: [],
      lastActivityTime: Date.now(),
      connectionAttempts: 0,
    });
  }, [clearAllTimeouts]);

  // Force offline mode
  const forceOffline = useCallback(() => {
    if (enableOfflineMode) {
      setStatus('offline');
    }
  }, [setStatus, enableOfflineMode]);

  // Go online
  const goOnline = useCallback(() => {
    setStatus('ready');
  }, [setStatus]);

  // Add action to offline queue
  const addToOfflineQueue = useCallback((action: () => void) => {
    if (enableOfflineMode) {
      setState(prev => ({
        ...prev,
        offlineQueue: [...prev.offlineQueue, action],
      }));
    }
  }, [enableOfflineMode]);

  // Process offline queue
  const processOfflineQueue = useCallback(() => {
    setState(prev => {
      const queue = [...prev.offlineQueue];
      // Process all queued actions
      queue.forEach(action => {
        try {
          action();
        } catch (error) {
          console.error('Error processing offline queue action:', error);
        }
      });
      return {
        ...prev,
        offlineQueue: [],
      };
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Status checks
  const isReady = state.status === 'ready';
  const isConnecting = state.status === 'connecting';
  const isConnected = state.status === 'connected';
  const isListening = state.status === 'listening';
  const isProcessing = state.status === 'processing' || state.status === 'parsing';
  const isComplete = state.status === 'complete';
  const hasError = state.status === 'error';
  const isOffline = state.status === 'offline';
  const isTimeout = state.status === 'timeout';

  // Can retry check
  const canRetry = state.retryCount < maxRetries && !state.isRetrying;
  const canConnect = state.connectionAttempts < maxConnectionAttempts;

  // Get status message
  const getStatusMessage = useCallback((): string => {
    switch (state.status) {
      case 'ready':
        return 'Ready to start voice recognition';
      case 'connecting':
        return `Connecting to voice service... (Attempt ${state.connectionAttempts + 1}/${maxConnectionAttempts})`;
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
        return state.error?.message || 'An error occurred';
      case 'disconnected':
        return 'Disconnected from voice service';
      case 'offline':
        return 'Working in offline mode';
      case 'timeout':
        return 'Operation timed out';
      default:
        return 'Unknown status';
    }
  }, [state.status, state.error, state.connectionAttempts, maxConnectionAttempts]);

  // Get status color for UI
  const getStatusColor = useCallback((): string => {
    switch (state.status) {
      case 'ready':
      case 'connected':
      case 'complete':
        return 'text-green-600';
      case 'connecting':
      case 'listening':
      case 'processing':
      case 'parsing':
        return 'text-blue-600';
      case 'error':
      case 'timeout':
        return 'text-red-600';
      case 'disconnected':
        return 'text-gray-600';
      case 'offline':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }, [state.status]);

  // Get status icon
  const getStatusIcon = useCallback((): string => {
    switch (state.status) {
      case 'ready':
        return 'mic';
      case 'connecting':
        return 'clock';
      case 'connected':
        return 'check-circle';
      case 'listening':
        return 'mic';
      case 'processing':
      case 'parsing':
        return 'refresh-cw';
      case 'complete':
        return 'check-circle';
      case 'error':
      case 'timeout':
        return 'x-circle';
      case 'disconnected':
        return 'mic-off';
      case 'offline':
        return 'wifi-off';
      default:
        return 'mic';
    }
  }, [state.status]);

  // Get time since last activity
  const getTimeSinceLastActivity = useCallback((): number => {
    return Date.now() - state.lastActivityTime;
  }, [state.lastActivityTime]);

  return {
    // Current state
    status: state.status,
    error: state.error,
    retryCount: state.retryCount,
    isRetrying: state.isRetrying,
    connectionAttempts: state.connectionAttempts,
    
    // Status checks
    isReady,
    isConnecting,
    isConnected,
    isListening,
    isProcessing,
    isComplete,
    hasError,
    isOffline,
    isTimeout,
    
    // Actions
    setStatus,
    setError,
    clearError,
    retry,
    reset,
    forceOffline,
    goOnline,
    
    // Utilities
    canRetry,
    canConnect,
    getStatusMessage,
    getStatusColor,
    getStatusIcon,
    getTimeSinceLastActivity,
    addToOfflineQueue,
    processOfflineQueue,
  };
} 