import { deepgramAuth } from './deepgramAuth';

interface DeepgramConfig {
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

interface DeepgramResponse {
  type: 'Results' | 'UtteranceEnd' | 'SpeechStarted' | 'Metadata' | 'Error';
  channel?: {
    alternatives?: Array<{
      transcript: string;
      confidence: number;
      words?: Array<{
        word: string;
        start: number;
        end: number;
        confidence: number;
        speaker?: number;
      }>;
    }>;
  };
  is_final?: boolean;
  speech_final?: boolean;
  metadata?: any;
  error?: string;
}

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private config: DeepgramConfig;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private connectionStartTime = 0;
  private isManualDisconnect = false;
  private connectionPromise: Promise<void> | null = null;
  private connectionResolver: (() => void) | null = null;
  private onTranscriptCallback?: (result: TranscriptionResult) => void;
  private onErrorCallback?: (error: string) => void;
  private onConnectionStateCallback?: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

  constructor(config: DeepgramConfig = {}) {
    this.config = {
      model: 'nova-2',
      language: 'en',
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
      punctuate: true,
      diarize: false,
      ...config
    };
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.connectionResolver = resolve;
      
      const connectInternal = async () => {
        try {
          this.isConnecting = true;
          this.isManualDisconnect = false;
          this.onConnectionStateCallback?.('connecting');

      // Check usage quota before connecting
      const usageStatus = await deepgramAuth.validateUsage();
      if (!usageStatus.can_use) {
        throw new Error('Usage quota exceeded. Please upgrade your plan.');
      }

      // Get API key
      const apiKey = await deepgramAuth.getApiKey();

      // API key loaded successfully (details hidden for security)
      console.log('🔑 API Key loaded successfully');
      console.log('🔍 API key length:', apiKey?.length);
      console.log('🔍 API key format check:', {
        exists: !!apiKey,
        length: apiKey?.length,
        isHex: /^[a-f0-9]+$/i.test(apiKey || ''),
        firstChars: apiKey?.substring(0, 8) + '...',
        lastChars: '...' + apiKey?.substring(apiKey.length - 8)
      });

      // Validate API key format
      if (!apiKey || apiKey.length !== 40 || !/^[a-f0-9]+$/i.test(apiKey)) {
        console.error('❌ API key validation failed:', {
          hasKey: !!apiKey,
          length: apiKey?.length,
          expectedLength: 40,
          isHexFormat: /^[a-f0-9]+$/i.test(apiKey || '')
        });
        throw new Error('Invalid API key format');
      }

      console.log('✅ API key format is valid');

      // Skip API key validation test due to CORS issues - WebSocket will validate it
      console.log('✅ Proceeding with WebSocket connection...');

      // Build WebSocket URL with proper parameters (no auth in URL)
      // Don't specify encoding - let Deepgram auto-detect the WebM format
      const params = new URLSearchParams({
        model: this.config.model!,
        language: this.config.language!,
        // Remove encoding parameter to allow auto-detection of WebM
        sample_rate: '16000', 
        channels: '1'
      });

      // Add optional parameters if set
      if (this.config.smart_format !== undefined) {
        params.set('smart_format', String(this.config.smart_format));
      }
      if (this.config.interim_results !== undefined) {
        params.set('interim_results', String(this.config.interim_results));
      }
      if (this.config.utterance_end_ms !== undefined) {
        params.set('utterance_end_ms', String(this.config.utterance_end_ms));
      }
      if (this.config.vad_events !== undefined) {
        params.set('vad_events', String(this.config.vad_events));
      }

      const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
      console.log('🌐 WebSocket URL:', wsUrl);

      // WebSocket connectivity verified

      // Create WebSocket connection with proper authorization
      console.log('🔗 Creating Deepgram WebSocket connection...');
      
      // Use the correct authorization method for Deepgram WebSocket API
      try {
        // Method 1: Try with Authorization header via subprotocols (Deepgram's actual method)
        // Note: Browsers don't support custom headers in WebSocket constructor, so we use subprotocols
        this.ws = new WebSocket(wsUrl, [`token`, apiKey]);
        console.log('✅ WebSocket created with token subprotocol authorization');
      } catch (error) {
        console.error('❌ WebSocket creation failed:', error);
        
        // Method 2: Fallback to URL-based auth (less reliable but sometimes works)
        try {
          console.log('🔄 Trying fallback URL-based authorization...');
          const authenticatedUrl = `${wsUrl}&authorization=Token%20${encodeURIComponent(apiKey)}`;
          this.ws = new WebSocket(authenticatedUrl);
          console.log('✅ WebSocket created with fallback URL-based authorization');
        } catch (fallbackError) {
          console.error('❌ Fallback WebSocket creation failed:', fallbackError);
          throw new Error('Failed to create WebSocket connection with any method: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      }

      this.connectionStartTime = Date.now();

      // Add immediate state logging
      console.log('🔍 WebSocket created, initial state:', {
        readyState: this.ws.readyState,
        url: this.ws.url,
        protocol: this.ws.protocol,
        extensions: this.ws.extensions,
        binaryType: this.ws.binaryType
      });

      // Log readyState changes
      const originalReadyState = this.ws.readyState;
      setTimeout(() => {
        if (this.ws && this.ws.readyState !== originalReadyState) {
          console.log('🔄 WebSocket state changed:', {
            from: originalReadyState,
            to: this.ws.readyState,
            timeElapsed: Date.now() - this.connectionStartTime + 'ms'
          });
        }
      }, 100);

      this.ws.onopen = () => {
        console.log('✅ Deepgram WebSocket connected successfully');
        console.log('🔍 Connection details:', {
          readyState: this.ws?.readyState,
          url: this.ws?.url,
          protocol: this.ws?.protocol,
          extensions: this.ws?.extensions
        });
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.isManualDisconnect = false;
        this.onConnectionStateCallback?.('connected');
        
        // Send initial configuration message
        this.sendConfigMessage();
        
        // Resolve the connection promise after a small delay to ensure state is updated
        setTimeout(() => {
          if (this.connectionResolver) {
            console.log('✅ Resolving connection promise - connection is stable');
            console.log('🔍 Final connection state:', {
              isConnected: this.isConnected,
              connectionState: this.connectionState,
              readyState: this.ws?.readyState
            });
            this.connectionResolver();
            this.connectionResolver = null;
          }
        }, 50);
      };

      this.ws.onmessage = (event) => {
        try {
          const response: DeepgramResponse = JSON.parse(event.data);
          console.log('📥 Deepgram message received:', {
            type: response.type,
            hasChannel: !!response.channel,
            hasAlternatives: !!response.channel?.alternatives,
            transcript: response.channel?.alternatives?.[0]?.transcript,
            isFinal: response.is_final,
            confidence: response.channel?.alternatives?.[0]?.confidence
          });
          this.handleResponse(response);
        } catch (error) {
          console.error('Error parsing Deepgram response:', error);
          console.error('Raw message data:', event.data);
        }
      };

      this.ws.onclose = (event) => {
        const connectionDuration = Date.now() - this.connectionStartTime;
        console.log('🔌 Deepgram WebSocket closed:', event.code, event.reason);
        console.log('🔍 Close event details:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          type: event.type,
          connectionDuration: `${connectionDuration}ms`,
          isManualDisconnect: this.isManualDisconnect,
          url: this.ws?.url
        });
        
        // Log common close codes for debugging
        const closeCodeMeaning = {
          1000: 'Normal Closure',
          1001: 'Going Away',
          1002: 'Protocol Error', 
          1003: 'Unsupported Data',
          1006: 'Abnormal Closure',
          1007: 'Invalid Data',
          1008: 'Policy Violation',
          1009: 'Message Too Big',
          1011: 'Unexpected Condition',
          4001: 'Invalid API Key',
          4002: 'Insufficient Credits',
          4003: 'Rate Limited'
        };
        
        console.log(`🔍 Close code meaning: ${closeCodeMeaning[event.code] || 'Unknown'}`);
        
        // Check if this was an immediate disconnect (connection lasted < 1 second)
        if (connectionDuration < 1000) {
          console.error('⚠️ IMMEDIATE DISCONNECT DETECTED - Connection lasted only', connectionDuration, 'ms');
          if (event.code === 4001 || event.code === 1008) {
            console.error('❌ This appears to be an authentication failure');
          }
        }
        
        this.isConnecting = false;
        this.onConnectionStateCallback?.('disconnected');
        
        // Log usage
        this.logSessionUsage();

        // Only attempt reconnection for unexpected closures and not manual disconnects
        if (!this.isManualDisconnect && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log('🔄 Attempting reconnection due to unexpected closure');
          this.attemptReconnection();
        } else if (this.isManualDisconnect) {
          console.log('ℹ️ Manual disconnect - no reconnection attempt');
        } else {
          console.log('ℹ️ Clean close or max reconnection attempts reached');
        }
      };

      this.ws.onerror = (error) => {
        const errorTime = Date.now() - this.connectionStartTime;
        console.error('❌ Deepgram WebSocket error:', error);
        console.error('❌ Error details:', {
          type: error.type,
          target: error.target,
          isTrusted: error.isTrusted,
          timeAfterCreation: errorTime + 'ms',
          currentState: this.ws?.readyState,
          url: this.ws?.url
        });
        
        // Log additional debugging info
        console.error('🔍 WebSocket state when error occurred:', this.ws?.readyState);
        console.error('🔍 Connection attempts:', this.reconnectAttempts);
        console.error('🔍 Error occurred after:', errorTime, 'ms');
        
        // Log readyState meaning
        const stateNames = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
        console.error('🔍 State meaning:', stateNames[this.ws?.readyState || 0]);
        
        this.isConnecting = false;
        this.onConnectionStateCallback?.('error');
        this.onErrorCallback?.('Connection error occurred');
      };

        } catch (error) {
          this.isConnecting = false;
          this.onConnectionStateCallback?.('error');
          
          const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Deepgram';
          console.error('❌ Failed to connect to Deepgram:', errorMessage);
          this.onErrorCallback?.(errorMessage);
          
          // Reset connection promise state
          this.connectionResolver = null;
          reject(new Error(errorMessage));
          
          // Try fallback methods
          await this.attemptFallbackConnection();
        }
      };
      
      connectInternal();
      
      // Add connection timeout
      setTimeout(() => {
        if (this.connectionResolver) {
          this.connectionResolver = null;
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 10000); // 10 second timeout
    });
    
    return this.connectionPromise;
  }

  private async attemptFallbackConnection(): Promise<void> {
    try {
      console.log('Attempting fallback connection method...');
      
      // Try using environment variable as fallback
      const fallbackKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      if (fallbackKey) {
        const params = new URLSearchParams({
          model: this.config.model!,
          language: this.config.language!,
          smart_format: String(this.config.smart_format!),
          interim_results: String(this.config.interim_results!),
          encoding: 'linear16',
          sample_rate: '16000',
          channels: '1'
        });

        // Add auth header to params
        params.set('authorization', `Token ${fallbackKey}`);
        const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
        
        this.ws = new WebSocket(wsUrl);

        this.setupWebSocketHandlers();
        return;
      }

      throw new Error('No fallback connection method available');
    } catch (error) {
      console.error('Fallback connection failed:', error);
      this.onErrorCallback?.('All connection methods failed');
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Fallback connection to Deepgram established');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.onConnectionStateCallback?.('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const response: DeepgramResponse = JSON.parse(event.data);
        this.handleResponse(response);
      } catch (error) {
        console.error('Error parsing Deepgram response:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('Fallback connection closed:', event.code, event.reason);
      this.onConnectionStateCallback?.('disconnected');
      this.logSessionUsage();
    };

    this.ws.onerror = (error) => {
      console.error('Fallback WebSocket error:', error);
      this.onConnectionStateCallback?.('error');
      this.onErrorCallback?.('Fallback connection error');
    };
  }

  private attemptReconnection(): void {
    if (this.isManualDisconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🛑 Reconnection cancelled - manual disconnect or max attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(async () => {
      if (this.isManualDisconnect) {
        console.log('🛑 Reconnection cancelled - manual disconnect detected');
        return;
      }
      
      try {
        await this.connect();
        console.log('✅ Reconnection successful');
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        
        // If we've reached max attempts, stop trying
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('🛑 Max reconnection attempts reached, giving up');
          this.onErrorCallback?.('Max reconnection attempts reached');
        }
      }
    }, delay);
  }

  private handleResponse(response: DeepgramResponse): void {
    switch (response.type) {
      case 'Results':
        if (response.channel?.alternatives?.[0]) {
          const alternative = response.channel.alternatives[0];
          const result: TranscriptionResult = {
            transcript: alternative.transcript,
            confidence: alternative.confidence,
            is_final: response.is_final || false
          };
          
          console.log('🎯 Processing transcript result:', {
            transcript: result.transcript,
            confidence: result.confidence,
            is_final: result.is_final,
            hasTranscript: !!result.transcript,
            transcriptLength: result.transcript?.length || 0
          });
          
          // Add speaker information if available
          if (alternative.words?.[0]?.speaker !== undefined) {
            result.speaker = alternative.words[0].speaker;
          }
          
          // Only call the callback if we have a transcript or if it's final
          if (result.transcript || result.is_final) {
            this.onTranscriptCallback?.(result);
          } else {
            console.log('🚫 Skipping empty non-final transcript');
          }
        }
        break;
        
      case 'UtteranceEnd':
        // Handle utterance end events
        break;
        
      case 'SpeechStarted':
        // Handle speech started events
        break;
        
      case 'Metadata':
        console.log('Deepgram metadata:', response.metadata);
        break;
        
      case 'Error':
        console.error('Deepgram error:', response.error);
        this.onErrorCallback?.(response.error || 'Unknown Deepgram error');
        break;
        
      default:
        console.log('Unknown Deepgram response type:', response);
    }
  }

  private sendConfigMessage(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // Send initial configuration if needed
      // Deepgram WebSocket connections typically don't require additional config messages
      // as configuration is passed via URL parameters
      console.log('✅ Configuration already sent via URL parameters');
    }
  }

  sendAudio(audioData: ArrayBuffer | Blob): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('🔊 Sending audio data:', {
        size: audioData instanceof Blob ? audioData.size : audioData.byteLength,
        type: audioData instanceof Blob ? audioData.type : 'ArrayBuffer',
        wsReadyState: this.ws.readyState
      });
      this.ws.send(audioData);
    } else {
      console.warn('WebSocket not connected, cannot send audio', {
        wsReadyState: this.ws?.readyState || 'no websocket',
        wsState: this.connectionState
      });
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    
    if (this.ws) {
      console.log('🔌 Manually disconnecting WebSocket');
      
      // Clear any pending connection promise
      if (this.connectionResolver) {
        this.connectionResolver();
        this.connectionResolver = null;
      }
      
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    // Reset connection state
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  private async logSessionUsage(): Promise<void> {
    if (this.connectionStartTime > 0) {
      const sessionDuration = (Date.now() - this.connectionStartTime) / 1000 / 60; // Convert to minutes
      
      try {
        await deepgramAuth.logUsage({
          duration: sessionDuration,
          model: this.config.model,
          feature: 'live_transcription'
        });
      } catch (error) {
        console.error('Error logging session usage:', error);
      }
    }
  }

  // Event handlers
  onTranscript(callback: (result: TranscriptionResult) => void): void {
    this.onTranscriptCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  onConnectionState(callback: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void): void {
    this.onConnectionStateCallback = callback;
  }

  // Getters
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'disconnecting';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<DeepgramConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Reset connection state (useful for debugging)
  resetConnectionState(): void {
    console.log('🔄 Resetting connection state');
    this.reconnectAttempts = 0;
    this.isManualDisconnect = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.connectionResolver = null;
  }

  // Force reconnect (bypasses manual disconnect check)
  async forceReconnect(): Promise<void> {
    console.log('🔄 Force reconnecting...');
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    this.resetConnectionState();
    return this.connect();
  }
}

export type { DeepgramConfig, TranscriptionResult, DeepgramResponse };