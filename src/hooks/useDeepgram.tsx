import { useState, useEffect, useRef, useCallback } from 'react';
import { DeepgramClient, DeepgramConfig, TranscriptionResult } from '../lib/deepgramClient';
import { useDeepgramAuth } from '../lib/deepgramAuth';


interface UseDeepgramOptions {
  config?: DeepgramConfig;
  onTranscript?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

interface UseDeepgramReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connectionState: string;
  error: string | null;
  transcripts: TranscriptionResult[];
  currentTranscript: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  forceReconnect: () => Promise<void>;
  resetConnectionState: () => void;
  sendAudio: (audioData: ArrayBuffer | Blob) => void;
  clearTranscripts: () => void;
  updateConfig: (config: Partial<DeepgramConfig>) => void;
  usageStatus: {
    can_use: boolean;
    current_usage: number;
    quota: number | null;
    remaining: number | null;
  } | null;
}

export function useDeepgram(options: UseDeepgramOptions = {}): UseDeepgramReturn {
  const { config, onTranscript, onError, autoConnect = false } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptionResult[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [usageStatus, setUsageStatus] = useState<UseDeepgramReturn['usageStatus']>(null);
  
  const clientRef = useRef<DeepgramClient | null>(null);
  const { validateUsage } = useDeepgramAuth();

  // Initialize client
  useEffect(() => {
    clientRef.current = new DeepgramClient(config);
    
    // Set up event listeners
    clientRef.current.onTranscript((result) => {
      setTranscripts(prev => [...prev, result]);
      
      if (result.is_final) {
        setCurrentTranscript('');
      } else {
        setCurrentTranscript(result.transcript);
      }
      
      onTranscript?.(result);
    });

    clientRef.current.onError((errorMessage) => {
      setError(errorMessage);
      onError?.(errorMessage);
    });

    clientRef.current.onConnectionState((state) => {
      setConnectionState(state);
      setIsConnected(state === 'connected');
      setIsConnecting(state === 'connecting');
      
      if (state === 'connected') {
        setError(null);
      }
    });

    // Auto-connect if requested
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  // Load usage status
  useEffect(() => {
    loadUsageStatus();
  }, []);

  const loadUsageStatus = async () => {
    try {
      const status = await validateUsage();
      setUsageStatus(status);
    } catch (error) {
      console.error('Error loading usage status:', error);
    }
  };

  const connect = useCallback(async () => {
    if (!clientRef.current) return;
    
    try {
      setError(null);
      await clientRef.current.connect();
      await loadUsageStatus(); // Refresh usage status after connecting
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionState('disconnected');
    }
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer | Blob) => {
    if (clientRef.current) {
      clientRef.current.sendAudio(audioData);
    }
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCurrentTranscript('');
  }, []);

  const updateConfig = useCallback((newConfig: Partial<DeepgramConfig>) => {
    if (clientRef.current) {
      clientRef.current.updateConfig(newConfig);
    }
  }, []);

  const forceReconnect = useCallback(async () => {
    if (clientRef.current) {
      try {
        setError(null);
        await clientRef.current.forceReconnect();
        await loadUsageStatus(); // Refresh usage status after reconnecting
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reconnect';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    }
  }, [onError]);

  const resetConnectionState = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.resetConnectionState();
      setError(null);
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    connectionState,
    error,
    transcripts,
    currentTranscript,
    connect,
    disconnect,
    forceReconnect,
    resetConnectionState,
    sendAudio,
    clearTranscripts,
    updateConfig,
    usageStatus
  };
}

// Hook for audio recording with Deepgram
export function useDeepgramRecording(options: UseDeepgramOptions = {}) {
  const { onError } = options;
  const deepgram = useDeepgram(options);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting recording process...');
      
      // Step 1: Check MediaRecorder support first
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder not supported in this browser');
      }
      
      // Step 2: Request microphone access with enhanced constraints
      console.log('🎤 Requesting microphone access...');
      
      let stream: MediaStream;
      try {
        // Try with optimal constraints first
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('✅ Microphone access granted with optimal settings');
      } catch (err) {
        console.warn('⚠️ Optimal constraints failed, trying basic:', err);
        try {
          // Fallback to basic constraints
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
          console.log('✅ Microphone access granted with basic settings');
        } catch (basicErr) {
          console.error('❌ All microphone access attempts failed:', basicErr);
          throw new Error(`Microphone access denied: ${basicErr instanceof Error ? basicErr.message : 'Unknown error'}`);
        }
      }
      
      // Validate stream immediately
      if (!stream || !stream.active) {
        throw new Error('Microphone stream is not active');
      }
      
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('No audio tracks available in microphone stream');
      }
      
      console.log('🔍 Stream details:', {
        active: stream.active,
        tracks: audioTracks.length,
        trackStates: audioTracks.map(track => ({
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        })),
        settings: audioTracks[0]?.getSettings()
      });
      
      setAudioStream(stream);
      
      // Step 3: Connect to Deepgram and wait for connection to complete
      console.log('🌐 Checking Deepgram connection...');
      
      try {
        // Check if already connected
        if (!deepgram.isConnected) {
          console.log('🌐 Deepgram not connected, connecting...');
          // The connect() method now returns a promise that resolves when connected
          await deepgram.connect();
          console.log('✅ Deepgram connected successfully');
        } else {
          console.log('✅ Deepgram already connected, reusing connection');
        }
        
        // Add a small delay to ensure connection state is properly updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify connection is actually open with retry logic
        let verificationAttempts = 0;
        const maxVerificationAttempts = 10;
        
        while (!deepgram.isConnected && verificationAttempts < maxVerificationAttempts) {
          console.log(`🔍 Connection verification attempt ${verificationAttempts + 1}/${maxVerificationAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 50));
          verificationAttempts++;
        }
        
        // Check if connection was manually disconnected during verification
        if (!deepgram.isConnected) {
          console.error('❌ Connection state after verification:', {
            isConnected: deepgram.isConnected,
            connectionState: deepgram.connectionState,
            isConnecting: deepgram.isConnecting
          });
          
          // Check if this was due to manual disconnect (race condition)
          if (deepgram.connectionState === 'disconnected') {
            console.error('🐛 RACE CONDITION DETECTED: Connection was manually disconnected during verification');
            console.error('💡 This suggests cleanup is running too early - investigating...');
          }
          
          throw new Error('Deepgram connection failed to establish properly');
        }
        
        console.log('✅ Deepgram connection verified and ready');
      } catch (error) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error(`Deepgram connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Step 4: Find best MIME type (prioritize formats better for speech recognition)
      const getSupportedMimeType = () => {
        const types = [
          'audio/wav',               // Best for speech recognition
          'audio/webm;codecs=pcm',   // Uncompressed WebM
          'audio/mp4',               // Good compatibility
          'audio/ogg;codecs=opus',   // Opus is good for speech
          'audio/webm;codecs=opus',  // Last resort WebM
          'audio/webm'               // Basic WebM
        ];
        
        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) {
            console.log('✅ Using MIME type:', type);
            return type;
          }
        }
        
        console.log('⚠️ No specific MIME type supported, using default');
        return undefined;
      };

      // Step 5: Create MediaRecorder with progressive fallbacks
      let recorder: MediaRecorder;
      const mimeType = getSupportedMimeType();

      console.log('🎤 Creating MediaRecorder...');
      
      // Check if MediaRecorder is supported at all
      if (!window.MediaRecorder) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('MediaRecorder is not supported in this browser');
      }
      
      try {
        // Validate stream before creating recorder
        if (!stream || stream.getTracks().length === 0) {
          throw new Error('Invalid audio stream');
        }
        
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error('No audio tracks found in stream');
        }
        
        // Check if audio track is enabled and not muted
        const firstTrack = audioTracks[0];
        if (!firstTrack.enabled || firstTrack.muted) {
          console.warn('⚠️ Audio track is disabled or muted, attempting to enable...');
          firstTrack.enabled = true;
        }
        
        // First try: with optimal settings
        const options: MediaRecorderOptions = {};
        if (mimeType) {
          options.mimeType = mimeType;
        }
        recorder = new MediaRecorder(stream, options);
        console.log('✅ MediaRecorder created with options:', options);
      } catch (err) {
        console.warn('⚠️ MediaRecorder with options failed, trying basic:', err);
        try {
          // Second try: completely basic
          recorder = new MediaRecorder(stream);
          console.log('✅ MediaRecorder created with basic setup');
        } catch (err2) {
          console.error('❌ All MediaRecorder creation attempts failed:', err2);
          stream.getTracks().forEach(track => track.stop());
          throw new Error(`MediaRecorder not supported: ${err2 instanceof Error ? err2.message : 'Unknown error'}`);
        }
      }
      
      // Step 6: Set up enhanced event handlers with connection monitoring
      recorder.ondataavailable = (event) => {
        console.log('📊 Data available:', event.data.size, 'bytes');
        console.log('🔍 Audio blob details:', {
          size: event.data.size,
          type: event.data.type,
          lastModified: event.data instanceof File ? event.data.lastModified : 'N/A'
        });
        
        // Enhanced validation before sending audio data
        if (event.data.size > 0) {
          if (deepgram.isConnected) {
            try {
              // Send WebM audio data directly to Deepgram
              deepgram.sendAudio(event.data);
              console.log('✅ WebM audio data sent to Deepgram successfully');
            } catch (error) {
              console.error('❌ Failed to send audio data:', error);
              // Don't stop recording on individual send failures
            }
          } else {
            console.warn('⚠️ Deepgram not connected, attempting reconnection...');
            // Attempt automatic reconnection without stopping recording
            deepgram.forceReconnect().catch(reconnectError => {
              console.error('❌ Failed to reconnect:', reconnectError);
            });
          }
        } else {
          console.warn('⚠️ Empty audio data received from MediaRecorder');
        }
      };
      
      recorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        console.error('❌ Error details:', {
          error: event.error,
          target: event.target,
          type: event.type
        });
        
        // Log stream state when error occurs
        const errorTracks = stream.getAudioTracks();
        console.error('❌ Stream state during error:', {
          streamActive: stream.active,
          trackCount: errorTracks.length,
          trackStates: errorTracks.map(track => ({
            id: track.id,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted
          }))
        });
        
        onError?.(`Recording error: ${event.error?.message || 'Unknown MediaRecorder error'}`);
      };
      
      recorder.onstart = () => {
        console.log('✅ MediaRecorder started successfully');
        setIsRecording(true);
        
        // Start monitoring track states during recording
        const trackMonitor = setInterval(() => {
          const monitorTracks = stream.getAudioTracks();
          const activeTracks = monitorTracks.filter(track => 
            track.enabled && track.readyState === 'live'
          );
          
          if (activeTracks.length === 0 && stream.active) {
            console.warn('⚠️ No active tracks detected during recording, attempting to re-enable...');
            monitorTracks.forEach(track => {
              if (track.readyState === 'live') {
                track.enabled = true;
              }
            });
          } else if (!stream.active) {
            console.error('❌ Audio stream became inactive during recording');
            clearInterval(trackMonitor);
            // Don't automatically stop - let the user handle it
          }
        }, 1000); // Check every second
        
        // Store monitor reference for cleanup
        (recorder as any)._trackMonitor = trackMonitor;
      };
      
      recorder.onstop = () => {
        console.log('⏹️ MediaRecorder stopped');
        setIsRecording(false);
        
        // Clear track monitor
        if ((recorder as any)._trackMonitor) {
          clearInterval((recorder as any)._trackMonitor);
        }
      };
      
      // Step 7: Wait for stream to be ready and start recording
      try {
        // Enhanced stream validation
        const audioTracks = stream.getAudioTracks();
        console.log('🔍 Audio tracks status:', audioTracks.map(track => ({
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        })));

        // Enhanced audio track management with proper timing
        console.log('🔍 Ensuring audio tracks are active and enabled...');
        
        // Enable all audio tracks immediately
        audioTracks.forEach(track => {
          if (track.readyState === 'live') {
            track.enabled = true;
            console.log(`✅ Enabled track ${track.id}: ${track.kind}`);
          } else {
            console.warn(`⚠️ Track ${track.id} is not live: ${track.readyState}`);
          }
        });
        
        // Enhanced stabilization delay with multiple checks
        let stabilizationAttempts = 0;
        const maxStabilizationAttempts = 10;
        const stabilizationDelay = 100; // Check every 100ms
        
        while (stabilizationAttempts < maxStabilizationAttempts) {
          await new Promise(resolve => setTimeout(resolve, stabilizationDelay));
          
          // Check track states after delay
          const currentTracks = stream.getAudioTracks();
          const activeTracks = currentTracks.filter(track => 
            track.enabled && track.readyState === 'live'
          );
          
          console.log(`🔍 Attempt ${stabilizationAttempts + 1}: ${activeTracks.length}/${currentTracks.length} tracks active`);
          
          if (activeTracks.length > 0) {
            console.log('✅ Audio tracks are stable and active');
            break;
          }
          
          // Re-enable tracks if they became disabled
          currentTracks.forEach(track => {
            if (track.readyState === 'live' && !track.enabled) {
              track.enabled = true;
              console.log(`🔄 Re-enabled track ${track.id}`);
            }
          });
          
          stabilizationAttempts++;
        }
        
        // Final validation before proceeding
        const finalTracks = stream.getAudioTracks();
        const finalActiveTracks = finalTracks.filter(track => 
          track.enabled && track.readyState === 'live'
        );
        
        if (finalActiveTracks.length === 0) {
          if (stream.active && finalTracks.length > 0) {
            // Last resort: if stream is active but tracks aren't reporting as live,
            // force enable them and proceed (some browsers have timing issues)
            console.log('⚠️ Forcing track activation as last resort...');
            finalTracks.forEach(track => {
              if (track.readyState !== 'ended') {
                track.enabled = true;
              }
            });
            // Give one more brief moment
            await new Promise(resolve => setTimeout(resolve, 50));
          } else {
            throw new Error('Audio stream is not active - no enabled tracks available');
          }
        }
        
        console.log(`✅ Audio track management complete: ${finalActiveTracks.length} active tracks ready`)

        console.log('🎤 Starting MediaRecorder with 100ms timeslice...');
        
        // Final validation before starting
        if (!stream.active) {
          throw new Error('Audio stream became inactive before starting recording');
        }
        
        const finalAudioTracks = stream.getAudioTracks();
        if (finalAudioTracks.length === 0) {
          throw new Error('No audio tracks available for recording');
        }
        
        // More lenient check - just ensure we have tracks and the stream is active
        const hasUsableTracks = finalAudioTracks.some(track => track.readyState !== 'ended');
        if (!hasUsableTracks) {
          throw new Error('No usable audio tracks available for recording');
        }
        
        // Enhanced MediaRecorder startup with stream monitoring
        console.log('🎤 Preparing MediaRecorder startup...');
        
        // Monitor stream and track states before starting
        const preStartValidation = () => {
          const currentTracks = stream.getAudioTracks();
          const activeTrackCount = currentTracks.filter(track => 
            track.enabled && track.readyState === 'live'
          ).length;
          
          console.log(`🔍 Pre-start validation: ${activeTrackCount}/${currentTracks.length} tracks active, stream active: ${stream.active}`);
          
          return {
            hasActiveTracks: activeTrackCount > 0,
            streamActive: stream.active,
            trackDetails: currentTracks.map(track => ({
              id: track.id,
              enabled: track.enabled,
              readyState: track.readyState,
              muted: track.muted
            }))
          };
        };
        
        const validation = preStartValidation();
        if (!validation.hasActiveTracks && !validation.streamActive) {
          throw new Error('Stream and tracks became inactive before MediaRecorder start');
        }
        
        // Ensure MediaRecorder is fully initialized with longer delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Start MediaRecorder with enhanced monitoring
        console.log('🎤 Initiating MediaRecorder start...');
        
        try {
          recorder.start(100); // Send data every 100ms
          console.log('✅ MediaRecorder start command sent');
        } catch (startError) {
          console.error('❌ MediaRecorder start command failed:', startError);
          throw new Error(`MediaRecorder start command failed: ${startError instanceof Error ? startError.message : 'Unknown error'}`);
        }
        
        // Enhanced startup monitoring with stream state tracking
        await new Promise((resolve, reject) => {
          const startTimeout = setTimeout(() => {
            recorder.removeEventListener('start', onStart);
            recorder.removeEventListener('error', onError);
            
            // Log final state for debugging
            const finalValidation = preStartValidation();
            console.error('❌ MediaRecorder start timeout. Final state:', finalValidation);
            
            reject(new Error('MediaRecorder start timeout - audio stream may have become inactive'));
          }, 5000); // Increased timeout to 5 seconds for better stability
          
          const onStart = () => {
            clearTimeout(startTimeout);
            recorder.removeEventListener('start', onStart);
            recorder.removeEventListener('error', onError);
            
            // Verify stream is still active after start
            const postStartValidation = preStartValidation();
            console.log('✅ MediaRecorder started successfully. Post-start state:', postStartValidation);
            
            resolve(void 0);
          };
          
          const onError = (event: any) => {
            clearTimeout(startTimeout);
            recorder.removeEventListener('start', onStart);
            recorder.removeEventListener('error', onError);
            
            const errorValidation = preStartValidation();
            console.error('❌ MediaRecorder error during start. Stream state:', errorValidation);
            
            reject(new Error(`MediaRecorder start error: ${event.error?.message || 'Unknown error'}`));
          };
          
          recorder.addEventListener('start', onStart);
          recorder.addEventListener('error', onError);
          
          // Monitor stream state during startup
          const streamMonitor = setInterval(() => {
            if (!stream.active) {
              clearInterval(streamMonitor);
              clearTimeout(startTimeout);
              recorder.removeEventListener('start', onStart);
              recorder.removeEventListener('error', onError);
              reject(new Error('Audio stream became inactive during MediaRecorder start'));
            }
          }, 50);
          
          // Clear monitor on success/error
          const originalResolve = resolve;
          const originalReject = reject;
          
          resolve = (value: any) => {
            clearInterval(streamMonitor);
            originalResolve(value);
          };
          
          reject = (reason: any) => {
            clearInterval(streamMonitor);
            originalReject(reason);
          };
        });
        
        console.log('✅ MediaRecorder startup sequence completed successfully');
      } catch (err) {
        console.error('❌ MediaRecorder start failed:', err);
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
        throw new Error(`MediaRecorder start failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      setMediaRecorder(recorder);
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Clean up any partial state
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      
      onError?.(`Failed to start recording: ${errorMessage}`);
    }
  }, [deepgram, onError, audioStream]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Initiating recording stop sequence...');
    
    // Enhanced MediaRecorder cleanup
    if (mediaRecorder) {
      console.log(`🔍 MediaRecorder state: ${mediaRecorder.state}`);
      
      // Clear track monitor if it exists
      if ((mediaRecorder as any)._trackMonitor) {
        clearInterval((mediaRecorder as any)._trackMonitor);
        console.log('✅ Track monitor cleared');
      }
      
      if (mediaRecorder.state === 'recording') {
        try {
          mediaRecorder.stop();
          console.log('✅ MediaRecorder stop command sent');
        } catch (error) {
          console.error('❌ Error stopping MediaRecorder:', error);
        }
      } else {
        console.log('ℹ️ MediaRecorder not in recording state, skipping stop');
      }
    }
    
    // Enhanced audio stream cleanup
    if (audioStream) {
      console.log('🔇 Stopping audio stream tracks...');
      const tracks = audioStream.getTracks();
      tracks.forEach((track, index) => {
        console.log(`🔇 Stopping track ${index + 1}/${tracks.length}: ${track.kind} (${track.id})`);
        try {
          track.stop();
          console.log(`✅ Track ${track.id} stopped`);
        } catch (error) {
          console.error(`❌ Error stopping track ${track.id}:`, error);
        }
      });
      setAudioStream(null);
      console.log('✅ Audio stream cleanup completed');
    }
    
    // Keep Deepgram connection alive for next recording
    console.log('🌐 Keeping Deepgram connection alive for next recording...');
    console.log('✅ Deepgram connection preserved');
    
    // Reset state
    setMediaRecorder(null);
    setIsRecording(false);
    
    console.log('✅ Recording stop sequence completed');
  }, [mediaRecorder, audioStream, deepgram]);

  // Cleanup on unmount only (not on stopRecording changes)
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up recording...');
      // Use the current state directly instead of the callback to avoid dependency issues
      if (mediaRecorder) {
        try {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        } catch (error) {
          console.error('❌ Error stopping MediaRecorder on unmount:', error);
        }
      }
      
      if (audioStream) {
        audioStream.getTracks().forEach(track => {
          try { 
            track.stop(); 
          } catch (error) {
            console.error('❌ Error stopping track on unmount:', error);
          }
        });
      }
      
      // Only disconnect if we're actually unmounting, not on re-renders
      deepgram.disconnect();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return {
    ...deepgram,
    isRecording,
    startRecording,
    stopRecording
  };
}

// Utility hook for processing audio files with Deepgram
export function useDeepgramFileProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { getApiKey, logUsage } = useDeepgramAuth();

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResult([]);

    try {
      const apiKey = await getApiKey();
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.results?.channels?.[0]?.alternatives?.[0]) {
        const alternative = data.results.channels[0].alternatives[0];
        const transcriptResult: TranscriptionResult = {
          transcript: alternative.transcript,
          confidence: alternative.confidence,
          is_final: true
        };
        
        setResult([transcriptResult]);
        
        // Log usage
        const duration = data.metadata?.duration || 0;
        await logUsage({
          duration: duration / 60, // Convert to minutes
          model: 'nova-2',
          feature: 'pre_recorded'
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      setError(errorMessage);
      console.error('File processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [getApiKey, logUsage]);

  return {
    processFile,
    isProcessing,
    result,
    error,
    clearResult: () => setResult([])
  };
}