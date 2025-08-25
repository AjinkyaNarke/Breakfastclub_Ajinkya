import { useState, useEffect, useRef, useCallback } from 'react';
import { optimizedWebSocketManager } from '../lib/optimizedWebSocketManager';
import { deepgramAuth } from '../lib/deepgramAuth';

interface OptimizedDeepgramConfig {
  model?: 'nova-2' | 'nova' | 'enhanced' | 'base';
  language?: string;
  smart_format?: boolean;
  interim_results?: boolean;
  utterance_end_ms?: number;
  vad_events?: boolean;
  punctuate?: boolean;
  diarize?: boolean;
}

interface TranscriptionResult {
  transcript: string;
  confidence: number;
  is_final: boolean;
  speaker?: number;
  start?: number;
  end?: number;
}

interface ConnectionMetrics {
  latency: number;
  bandwidth: number;
  messageCount: number;
  errorCount: number;
  isActive: boolean;
}

interface UseOptimizedDeepgramOptions {
  config?: OptimizedDeepgramConfig;
  onTranscript?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onMetrics?: (metrics: ConnectionMetrics) => void;
  autoConnect?: boolean;
  enableHeartbeat?: boolean;
  enableLatencyMonitoring?: boolean;
}

interface UseOptimizedDeepgramReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: string;
  
  // Audio state
  isListening: boolean;
  audioLevel: number;
  duration: number;
  
  // Results
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  transcripts: TranscriptionResult[];
  
  // Controls
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  sendAudio: (audioData: ArrayBuffer | Blob) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  
  // Metrics and monitoring
  metrics: ConnectionMetrics | null;
  connectionHealth: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Utilities
  reset: () => void;
  updateConfig: (config: Partial<OptimizedDeepgramConfig>) => void;
  
  // Usage status
  usageStatus: {
    can_use: boolean;
    current_usage: number;
    quota: number | null;
    remaining: number | null;
  } | null;
}

export function useOptimizedDeepgram(options: UseOptimizedDeepgramOptions = {}): UseOptimizedDeepgramReturn {
  const {
    config = {},
    onTranscript,
    onError,
    onConnectionChange,
    onMetrics,
    autoConnect = false,
    enableHeartbeat = true,
    enableLatencyMonitoring = true
  } = options;

  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ConnectionMetrics | null>(null);
  const [usageStatus, setUsageStatus] = useState<UseOptimizedDeepgramReturn['usageStatus']>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const connectionKeyRef = useRef<string>('');

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setCurrentTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setAudioLevel(0);
    setDuration(0);
    setError(null);
    setIsListening(false);
    setTranscripts([]);
  }, []);

  // Connect using optimized WebSocket manager
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Check audio permissions
      const hasPermission = await checkAudioPermissions();
      if (!hasPermission) {
        const permissionError = 'Microphone access denied. Please allow microphone permissions.';
        setError(permissionError);
        onError?.(permissionError);
        return;
      }

      // Get optimized WebSocket connection
      const ws = await optimizedWebSocketManager.getConnection(config);
      wsRef.current = ws;
      connectionKeyRef.current = `${config.model}-${config.language}-${Date.now()}`;

      // Set up event listeners for the optimized connection
      setupOptimizedEventListeners();

      setIsConnected(true);
      setIsConnecting(false);
      setConnectionState('connected');
      onConnectionChange?.(true);

      // Load usage status
      await loadUsageStatus();

    } catch (err) {
      const connectionError = err instanceof Error ? err.message : 'Failed to connect';
      setError(connectionError);
      onError?.(connectionError);
      setIsConnecting(false);
      setConnectionState('error');
    }
  }, [isConnected, isConnecting, config, onError, onConnectionChange]);

  // Set up optimized event listeners
  const setupOptimizedEventListeners = useCallback(() => {
    // Listen to WebSocket manager events
    optimizedWebSocketManager.on('connectionOpened', ({ connectionKey }) => {
      if (connectionKey === connectionKeyRef.current) {
        setIsConnected(true);
        setConnectionState('connected');
        onConnectionChange?.(true);
      }
    });

    optimizedWebSocketManager.on('connectionClosed', ({ connectionKey }) => {
      if (connectionKey === connectionKeyRef.current) {
        setIsConnected(false);
        setIsConnecting(false);
        setIsListening(false);
        setConnectionState('disconnected');
        onConnectionChange?.(false);
      }
    });

    optimizedWebSocketManager.on('connectionError', ({ connectionKey, error }) => {
      if (connectionKey === connectionKeyRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Connection error';
        setError(errorMessage);
        onError?.(errorMessage);
        setConnectionState('error');
      }
    });

    optimizedWebSocketManager.on('message', ({ connectionKey, message }) => {
      if (connectionKey === connectionKeyRef.current) {
        handleOptimizedMessage(message);
      }
    });

    optimizedWebSocketManager.on('reconnectionSuccess', ({ connectionKey }) => {
      if (connectionKey === connectionKeyRef.current) {
        console.log('Reconnection successful');
        setError(null);
      }
    });

    optimizedWebSocketManager.on('reconnectionFailed', ({ connectionKey }) => {
      if (connectionKey === connectionKeyRef.current) {
        const reconnectionError = 'Failed to reconnect after multiple attempts';
        setError(reconnectionError);
        onError?.(reconnectionError);
      }
    });

    // Listen to metrics updates
    optimizedWebSocketManager.on('metrics', (metricsData) => {
      const connectionMetrics = metricsData.connections.find(
        (conn: any) => conn.key === connectionKeyRef.current
      );
      
      if (connectionMetrics) {
        const metrics: ConnectionMetrics = {
          latency: connectionMetrics.latency || 0,
          bandwidth: connectionMetrics.bandwidth || 0,
          messageCount: connectionMetrics.messageCount || 0,
          errorCount: connectionMetrics.errorCount || 0,
          isActive: connectionMetrics.isActive || false
        };
        
        setMetrics(metrics);
        onMetrics?.(metrics);
      }
    });

  }, [onConnectionChange, onError, onMetrics]);

  // Handle optimized message processing
  const handleOptimizedMessage = useCallback((message: any) => {
    try {
      // Parse Deepgram response
      if (message.type === 'Results' && message.channel?.alternatives?.[0]) {
        const alternative = message.channel.alternatives[0];
        const result: TranscriptionResult = {
          transcript: alternative.transcript,
          confidence: alternative.confidence,
          is_final: message.is_final || message.speech_final || false,
          speaker: alternative.words?.[0]?.speaker,
          start: alternative.words?.[0]?.start,
          end: alternative.words?.[alternative.words.length - 1]?.end
        };

        setCurrentTranscript(result.transcript);
        setConfidence(result.confidence);

        if (result.is_final) {
          setFinalTranscript(result.transcript);
          setCurrentTranscript('');
          setTranscripts(prev => [...prev, result]);
        }

        onTranscript?.(result);
      }
    } catch (err) {
      console.error('Error processing optimized message:', err);
    }
  }, [onTranscript]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }

    // Clean up audio resources
    cleanupAudioResources();

    setIsConnected(false);
    setIsConnecting(false);
    setIsListening(false);
    setConnectionState('disconnected');
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  // Start listening with optimized audio processing
  const startListening = useCallback(async () => {
    if (!isConnected || isListening) return;

    try {
      setError(null);
      setIsListening(true);
      startTimeRef.current = Date.now();

      // Create optimized audio context
      audioContextRef.current = new AudioContext({
        sampleRate: 16000,
        latencyHint: 'interactive'
      });

      // Get audio stream with optimized settings
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up audio processing
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      source.connect(analyserRef.current);

      // Start optimized audio monitoring
      const updateAudioLevel = () => {
        if (!analyserRef.current || !isListening) return;

        const dataArray = new Float32Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getFloatTimeDomainData(dataArray);

        // Calculate RMS audio level
        const rms = Math.sqrt(
          dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length
        );
        const level = Math.min(100, Math.max(0, rms * 100));
        setAudioLevel(level);

        // Update duration
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();

    } catch (err) {
      const audioError = err instanceof Error ? err.message : 'Failed to start audio recording';
      setError(audioError);
      onError?.(audioError);
      setIsListening(false);
    }
  }, [isConnected, isListening, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    cleanupAudioResources();
  }, []);

  // Send audio data with optimization
  const sendAudio = useCallback((audioData: ArrayBuffer | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(audioData);
      } catch (err) {
        console.error('Error sending audio data:', err);
        setError('Failed to send audio data');
      }
    } else {
      console.warn('WebSocket not connected, cannot send audio');
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<OptimizedDeepgramConfig>) => {
    // Update WebSocket manager configuration
    optimizedWebSocketManager.updateConfig({
      maxConnections: 3,
      connectionTimeout: 30000,
      heartbeatConfig: {
        interval: enableHeartbeat ? 30000 : 0,
        timeout: 10000,
        maxMissedHeartbeats: 3
      },
      retryConfig: {
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2
      }
    });
  }, [enableHeartbeat]);

  // Helper functions
  const checkAudioPermissions = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  };

  const cleanupAudioResources = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  };

  const loadUsageStatus = async () => {
    try {
      const status = await deepgramAuth.validateUsage();
      setUsageStatus(status);
    } catch (error) {
      console.error('Error loading usage status:', error);
    }
  };

  // Calculate connection health based on metrics
  const connectionHealth = useCallback((): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (!metrics) return 'fair';

    const { latency, errorCount } = metrics;
    
    if (latency < 100 && errorCount === 0) return 'excellent';
    if (latency < 200 && errorCount < 2) return 'good';
    if (latency < 500 && errorCount < 5) return 'fair';
    return 'poor';
  }, [metrics]);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      optimizedWebSocketManager.off('connectionOpened', () => {});
      optimizedWebSocketManager.off('connectionClosed', () => {});
      optimizedWebSocketManager.off('connectionError', () => {});
      optimizedWebSocketManager.off('message', () => {});
      optimizedWebSocketManager.off('reconnectionSuccess', () => {});
      optimizedWebSocketManager.off('reconnectionFailed', () => {});
      optimizedWebSocketManager.off('metrics', () => {});
    };
  }, [disconnect]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionState,
    
    // Audio state
    isListening,
    audioLevel,
    duration,
    
    // Results
    currentTranscript,
    finalTranscript,
    confidence,
    transcripts,
    
    // Controls
    connect,
    disconnect,
    startListening,
    stopListening,
    sendAudio,
    
    // Error handling
    error,
    clearError,
    
    // Metrics and monitoring
    metrics,
    connectionHealth: connectionHealth(),
    
    // Utilities
    reset,
    updateConfig,
    
    // Usage status
    usageStatus
  };
}

interface UseOptimizedDeepgramRecordingOptions extends UseOptimizedDeepgramOptions {
  /**
   * MIME type for MediaRecorder (default: 'audio/webm;codecs=opus')
   * Options: 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/wav', etc.
   */
  mimeType?: string;
  /**
   * Audio chunk size in ms (default: 100)
   * Lower values = lower latency, higher values = better compression
   */
  chunkSizeMs?: number;
  /**
   * Maximum recording duration in ms (default: 5 minutes)
   * Recording will auto-stop and flush after this duration
   */
  maxDurationMs?: number;
  /**
   * Callback when max duration is reached
   */
  onMaxDuration?: () => void;
}

export function useOptimizedDeepgramRecording(options: UseOptimizedDeepgramRecordingOptions = {}) {
  const {
    mimeType = 'audio/webm;codecs=opus',
    chunkSizeMs = 100,
    maxDurationMs = 5 * 60 * 1000, // 5 minutes default
    onMaxDuration,
    ...deepgramOptions
  } = options;
  const deepgram = useOptimizedDeepgram(deepgramOptions);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Connect to Deepgram first
      await deepgram.connect();

      // Get optimized audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setAudioStream(stream);

      // Create optimized MediaRecorder
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType });
      } catch (err) {
        // Fallback to default if unsupported
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && deepgram.isConnected) {
          deepgram.sendAudio(event.data);
        }
      };

      // Optimize chunk size for real-time processing
      recorder.start(chunkSizeMs); // Send data every chunkSizeMs ms
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingStart(Date.now());

      // Set up max duration auto-stop
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
      maxDurationTimeoutRef.current = setTimeout(() => {
        stopRecording();
        if (onMaxDuration) onMaxDuration();
        else console.warn('Recording auto-stopped: maximum duration reached.');
      }, maxDurationMs);

    } catch (error) {
      console.error('Error starting optimized recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      // Set error through the hook's error handling
      console.error(errorMessage);
    }
  }, [deepgram, mimeType, chunkSizeMs, maxDurationMs, onMaxDuration]);

  const stopRecording = useCallback(() => {
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    deepgram.disconnect();
    setMediaRecorder(null);
    setIsRecording(false);
    setRecordingStart(null);
  }, [mediaRecorder, audioStream, deepgram]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  // Warn if recording is too long (for UI feedback)
  useEffect(() => {
    if (!isRecording || !recordingStart) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - recordingStart;
      if (elapsed > maxDurationMs) {
        stopRecording();
        if (onMaxDuration) onMaxDuration();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, recordingStart, maxDurationMs, onMaxDuration, stopRecording]);

  return {
    ...deepgram,
    isRecording,
    startRecording,
    stopRecording,
    mediaRecorder,
    audioStream,
    compression: mimeType,
    chunkSizeMs,
    maxDurationMs,
    recordingStart
  };
} 