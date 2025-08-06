// Voice processing utilities for Deepgram integration
export interface VoiceConfig {
  language: 'en' | 'de';
  model?: string;
  interimResults?: boolean;
  punctuate?: boolean;
  smartFormat?: boolean;
  diarize?: boolean;
}

export interface VoiceResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  channel: number;
  start: number;
  end: number;
}

export interface VoiceError {
  type: 'connection' | 'permission' | 'network' | 'api' | 'unknown';
  message: string;
  code?: string;
}

export class VoiceUtils {
  private static readonly DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';
  private static readonly DEFAULT_CONFIG: VoiceConfig = {
    language: 'en',
    model: 'nova-2',
    interimResults: true,
    punctuate: true,
    smartFormat: true,
    diarize: false,
  };

  /**
   * Create Deepgram WebSocket URL with configuration
   */
  static createWebSocketUrl(config: Partial<VoiceConfig> = {}): string {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const params = new URLSearchParams({
      model: finalConfig.model!,
      language: finalConfig.language,
      interim_results: finalConfig.interimResults!.toString(),
      punctuate: finalConfig.punctuate!.toString(),
      smart_format: finalConfig.smartFormat!.toString(),
      diarize: finalConfig.diarize!.toString(),
    });

    return `${this.DEEPGRAM_WS_URL}?${params.toString()}`;
  }

  /**
   * Format confidence score for display
   */
  static formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`;
  }

  /**
   * Get confidence color based on score
   */
  static getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Validate audio permissions
   */
  static async checkAudioPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Audio permission denied:', error);
      return false;
    }
  }

  /**
   * Get available audio devices
   */
  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      return [];
    }
  }

  /**
   * Create audio stream with specific device
   */
  static async createAudioStream(deviceId?: string): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error('Failed to create audio stream:', error);
      throw new Error('Failed to access microphone');
    }
  }

  /**
   * Parse Deepgram response
   */
  static parseDeepgramResponse(data: any): VoiceResult | null {
    try {
      if (data.type === 'Results') {
        const channel = data.channel;
        const alternative = channel.alternatives[0];
        
        return {
          transcript: alternative.transcript,
          confidence: alternative.confidence,
          isFinal: data.is_final,
          channel: channel.index,
          start: alternative.words?.[0]?.start || 0,
          end: alternative.words?.[alternative.words.length - 1]?.end || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to parse Deepgram response:', error);
      return null;
    }
  }

  /**
   * Create error object from various error types
   */
  static createError(error: any): VoiceError {
    if (error.name === 'NotAllowedError') {
      return {
        type: 'permission',
        message: 'Microphone access denied. Please allow microphone permissions.',
        code: 'PERMISSION_DENIED',
      };
    }

    if (error.name === 'NotFoundError') {
      return {
        type: 'permission',
        message: 'No microphone found. Please check your device.',
        code: 'NO_MICROPHONE',
      };
    }

    if (error.name === 'NetworkError') {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
      };
    }

    return {
      type: 'unknown',
      message: error.message || 'An unknown error occurred',
      code: error.code,
    };
  }

  /**
   * Debounce function for real-time updates
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for performance optimization
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Calculate audio levels from audio data
   */
  static calculateAudioLevel(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sum / audioData.length);
    return Math.min(1, rms * 5); // Scale for better visualization
  }

  /**
   * Format duration in seconds to MM:SS
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Clean up audio stream
   */
  static cleanupAudioStream(stream: MediaStream | null): void {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
  }
} 