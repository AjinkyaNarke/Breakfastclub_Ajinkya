import { deepgramAuth } from './deepgramAuth';

interface WebSocketConfig {
  model?: 'nova-2' | 'nova' | 'enhanced' | 'base';
  language?: string;
  smart_format?: boolean;
  interim_results?: boolean;
  utterance_end_ms?: number;
  vad_events?: boolean;
  punctuate?: boolean;
  diarize?: boolean;
}

interface ConnectionMetrics {
  connectionId: string;
  startTime: number;
  lastHeartbeat: number;
  messageCount: number;
  errorCount: number;
  latency: number;
  bandwidth: number;
}

interface ConnectionPool {
  [key: string]: {
    ws: WebSocket;
    config: WebSocketConfig;
    metrics: ConnectionMetrics;
    isActive: boolean;
    lastUsed: number;
  };
}

interface HeartbeatConfig {
  interval: number;
  timeout: number;
  maxMissedHeartbeats: number;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class OptimizedWebSocketManager {
  private connectionPool: ConnectionPool = {};
  private maxConnections = 3;
  private connectionTimeout = 30000; // 30 seconds
  private cleanupInterval = 60000; // 1 minute
  
  private heartbeatConfig: HeartbeatConfig = {
    interval: 30000, // 30 seconds
    timeout: 10000,  // 10 seconds
    maxMissedHeartbeats: 3
  };
  
  private retryConfig: RetryConfig = {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  private globalMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    totalMessages: 0,
    totalErrors: 0,
    averageLatency: 0
  };

  private eventListeners: {
    [event: string]: Array<(data: any) => void>
  } = {};

  constructor() {
    this.startCleanupInterval();
    this.startMetricsCollection();
  }

  /**
   * Get or create an optimized WebSocket connection
   */
  async getConnection(config: WebSocketConfig): Promise<WebSocket> {
    const connectionKey = this.generateConnectionKey(config);
    
    // Check if we have an existing active connection
    if (this.connectionPool[connectionKey]?.isActive) {
      const connection = this.connectionPool[connectionKey];
      connection.lastUsed = Date.now();
      return connection.ws;
    }

    // Check connection pool size
    if (Object.keys(this.connectionPool).length >= this.maxConnections) {
      this.cleanupInactiveConnections();
    }

    // Create new connection
    return this.createOptimizedConnection(connectionKey, config);
  }

  /**
   * Create an optimized WebSocket connection with advanced features
   */
  private async createOptimizedConnection(connectionKey: string, config: WebSocketConfig): Promise<WebSocket> {
    try {
      // Check usage quota
      const usageStatus = await deepgramAuth.validateUsage();
      if (!usageStatus.can_use) {
        throw new Error('Usage quota exceeded');
      }

      // Get API key
      const apiKey = await deepgramAuth.getApiKey();

      // Build optimized WebSocket URL
      const wsUrl = this.buildOptimizedWebSocketUrl(config);

      // Create WebSocket with optimized settings
      const ws = new WebSocket(wsUrl);
      
      // Note: Custom headers are not supported in browser WebSocket constructor
      // Authorization is handled via URL parameters or server-side proxy

      // Set up connection metrics
      const metrics: ConnectionMetrics = {
        connectionId: connectionKey,
        startTime: Date.now(),
        lastHeartbeat: Date.now(),
        messageCount: 0,
        errorCount: 0,
        latency: 0,
        bandwidth: 0
      };

      // Store connection in pool
      this.connectionPool[connectionKey] = {
        ws,
        config,
        metrics,
        isActive: false,
        lastUsed: Date.now()
      };

      // Set up optimized event handlers
      this.setupOptimizedEventHandlers(connectionKey, ws);

      // Start heartbeat monitoring
      this.startHeartbeatMonitoring(connectionKey);

      // Set connection timeout
      this.setConnectionTimeout(connectionKey);

      this.globalMetrics.totalConnections++;
      this.globalMetrics.activeConnections++;

      this.emit('connectionCreated', { connectionKey, config });
      return ws;

    } catch (error) {
      this.globalMetrics.failedConnections++;
      this.emit('connectionError', { connectionKey, error });
      throw error;
    }
  }

  /**
   * Build optimized WebSocket URL with performance parameters
   */
  private buildOptimizedWebSocketUrl(config: WebSocketConfig): string {
    const params = new URLSearchParams({
      model: config.model || 'nova-2',
      language: config.language || 'en',
      smart_format: String(config.smart_format ?? true),
      interim_results: String(config.interim_results ?? true),
      utterance_end_ms: String(config.utterance_end_ms || 1000),
      vad_events: String(config.vad_events ?? true),
      punctuate: String(config.punctuate ?? true),
      diarize: String(config.diarize ?? false),
      encoding: 'linear16',
      sample_rate: '16000',
      channels: '1',
      // Performance optimizations
      no_delay: 'true',
      compression: 'false' // Disable compression for real-time audio
    });

    return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  }

  /**
   * Set up optimized event handlers with error recovery
   */
  private setupOptimizedEventHandlers(connectionKey: string, ws: WebSocket): void {
    const connection = this.connectionPool[connectionKey];
    if (!connection) return;

    ws.onopen = () => {
      connection.isActive = true;
      connection.metrics.lastHeartbeat = Date.now();
      
      this.emit('connectionOpened', { connectionKey });
      console.log(`Optimized WebSocket connection opened: ${connectionKey}`);
    };

    ws.onmessage = (event) => {
      connection.metrics.messageCount++;
      connection.metrics.lastHeartbeat = Date.now();
      connection.lastUsed = Date.now();

      // Measure latency
      this.measureLatency(connectionKey);

      // Handle different message types
      this.handleOptimizedMessage(connectionKey, event.data);
    };

    ws.onclose = (event) => {
      connection.isActive = false;
      
      this.emit('connectionClosed', { 
        connectionKey, 
        code: event.code, 
        reason: event.reason 
      });

      // Attempt reconnection for unexpected closures
      if (event.code !== 1000) {
        this.attemptOptimizedReconnection(connectionKey);
      }

      this.cleanupConnection(connectionKey);
    };

    ws.onerror = (error) => {
      connection.metrics.errorCount++;
      this.globalMetrics.totalErrors++;
      
      this.emit('connectionError', { connectionKey, error });
      console.error(`WebSocket error for ${connectionKey}:`, error);
    };
  }

  /**
   * Handle optimized message processing
   */
  private handleOptimizedMessage(connectionKey: string, data: any): void {
    try {
      // Parse message efficiently
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Update bandwidth metrics
      this.updateBandwidthMetrics(connectionKey, data);

      // Emit message event
      this.emit('message', { connectionKey, message });

    } catch (error) {
      console.error('Error processing message:', error);
      this.emit('messageError', { connectionKey, error, data });
    }
  }

  /**
   * Start heartbeat monitoring for connection health
   */
  private startHeartbeatMonitoring(connectionKey: string): void {
    const connection = this.connectionPool[connectionKey];
    if (!connection) return;

    const heartbeatInterval = setInterval(() => {
      if (!connection.isActive) {
        clearInterval(heartbeatInterval);
        return;
      }

      const now = Date.now();
      const timeSinceLastHeartbeat = now - connection.metrics.lastHeartbeat;

      // Check if heartbeat is overdue
      if (timeSinceLastHeartbeat > this.heartbeatConfig.timeout) {
        console.warn(`Heartbeat timeout for connection ${connectionKey}`);
        this.handleHeartbeatTimeout(connectionKey);
        clearInterval(heartbeatInterval);
        return;
      }

      // Send heartbeat if needed
      if (connection.ws.readyState === WebSocket.OPEN) {
        try {
          // Send a minimal heartbeat message
          connection.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: now }));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, this.heartbeatConfig.interval);

    // Store interval reference for cleanup
    connection.metrics['heartbeatInterval'] = heartbeatInterval;
  }

  /**
   * Handle heartbeat timeout with reconnection logic
   */
  private handleHeartbeatTimeout(connectionKey: string): void {
    const connection = this.connectionPool[connectionKey];
    if (!connection) return;

    console.warn(`Heartbeat timeout detected for ${connectionKey}, attempting reconnection`);
    
    // Close existing connection
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.close(1000, 'Heartbeat timeout');
    }

    // Attempt reconnection
    this.attemptOptimizedReconnection(connectionKey);
  }

  /**
   * Attempt optimized reconnection with exponential backoff
   */
  private async attemptOptimizedReconnection(connectionKey: string): Promise<void> {
    const connection = this.connectionPool[connectionKey];
    if (!connection) return;

    let attempt = 0;
    const maxAttempts = this.retryConfig.maxAttempts;

    const attemptReconnection = async (): Promise<void> => {
      if (attempt >= maxAttempts) {
        console.error(`Max reconnection attempts reached for ${connectionKey}`);
        this.emit('reconnectionFailed', { connectionKey, attempts: attempt });
        return;
      }

      attempt++;
      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
        this.retryConfig.maxDelay
      );

      console.log(`Attempting reconnection ${attempt}/${maxAttempts} for ${connectionKey} in ${delay}ms`);

      setTimeout(async () => {
        try {
          // Create new connection
          const newWs = await this.createOptimizedConnection(connectionKey, connection.config);
          
          // Replace old connection
          this.cleanupConnection(connectionKey);
          this.connectionPool[connectionKey] = {
            ws: newWs,
            config: connection.config,
            metrics: {
              ...connection.metrics,
              startTime: Date.now(),
              lastHeartbeat: Date.now(),
              errorCount: 0
            },
            isActive: true,
            lastUsed: Date.now()
          };

          this.emit('reconnectionSuccess', { connectionKey, attempts: attempt });
          console.log(`Reconnection successful for ${connectionKey} after ${attempt} attempts`);

        } catch (error) {
          console.error(`Reconnection attempt ${attempt} failed for ${connectionKey}:`, error);
          attemptReconnection(); // Retry
        }
      }, delay);
    };

    await attemptReconnection();
  }

  /**
   * Measure connection latency
   */
  private measureLatency(connectionKey: string): void {
    const connection = this.connectionPool[connectionKey];
    if (!connection) return;

    const startTime = performance.now();
    
    // Send a small ping message
    if (connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(JSON.stringify({ type: 'ping', timestamp: startTime }));
        
        // Measure round-trip time
        setTimeout(() => {
          const endTime = performance.now();
          connection.metrics.latency = endTime - startTime;
          
          // Update global average latency
          this.updateGlobalLatency(connection.metrics.latency);
        }, 100);
      } catch (error) {
        console.error('Error measuring latency:', error);
      }
    }
  }

  /**
   * Update bandwidth metrics
   */
  private updateBandwidthMetrics(connectionKey: string, data: any): void {
    const connection = this.connectionPool[connectionKey];
    if (!connection) return;

    const dataSize = typeof data === 'string' ? data.length : data.byteLength || 0;
    connection.metrics.bandwidth = dataSize;
  }

  /**
   * Update global latency metrics
   */
  private updateGlobalLatency(latency: number): void {
    const totalConnections = Object.keys(this.connectionPool).length;
    if (totalConnections > 0) {
      this.globalMetrics.averageLatency = 
        (this.globalMetrics.averageLatency * (totalConnections - 1) + latency) / totalConnections;
    }
  }

  /**
   * Set connection timeout
   */
  private setConnectionTimeout(connectionKey: string): void {
    setTimeout(() => {
      const connection = this.connectionPool[connectionKey];
      if (connection && !connection.isActive) {
        console.warn(`Connection timeout for ${connectionKey}`);
        this.cleanupConnection(connectionKey);
      }
    }, this.connectionTimeout);
  }

  /**
   * Clean up inactive connections
   */
  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    Object.keys(this.connectionPool).forEach(connectionKey => {
      const connection = this.connectionPool[connectionKey];
      if (now - connection.lastUsed > inactiveThreshold) {
        console.log(`Cleaning up inactive connection: ${connectionKey}`);
        this.cleanupConnection(connectionKey);
      }
    });
  }

  /**
   * Clean up specific connection
   */
  private cleanupConnection(connectionKey: string): void {
    const connection = this.connectionPool[connectionKey];
    if (!connection) return;

    // Clear heartbeat interval
    if (connection.metrics['heartbeatInterval']) {
      clearInterval(connection.metrics['heartbeatInterval']);
    }

    // Close WebSocket
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.close(1000, 'Cleanup');
    }

    // Remove from pool
    delete this.connectionPool[connectionKey];
    this.globalMetrics.activeConnections--;

    this.emit('connectionCleaned', { connectionKey });
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, this.cleanupInterval);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.emit('metrics', this.getMetrics());
    }, 30000); // Every 30 seconds
  }

  /**
   * Generate unique connection key
   */
  private generateConnectionKey(config: WebSocketConfig): string {
    return `${config.model}-${config.language}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection metrics
   */
  getMetrics() {
    return {
      global: this.globalMetrics,
      connections: Object.keys(this.connectionPool).map(key => ({
        key,
        ...this.connectionPool[key].metrics,
        isActive: this.connectionPool[key].isActive
      }))
    };
  }

  /**
   * Get active connection count
   */
  getActiveConnectionCount(): number {
    return Object.values(this.connectionPool).filter(conn => conn.isActive).length;
  }

  /**
   * Close all connections
   */
  closeAllConnections(): void {
    Object.keys(this.connectionPool).forEach(connectionKey => {
      this.cleanupConnection(connectionKey);
    });
  }

  /**
   * Event emitter methods
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data: any): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<{
    maxConnections: number;
    connectionTimeout: number;
    heartbeatConfig: Partial<HeartbeatConfig>;
    retryConfig: Partial<RetryConfig>;
  }>): void {
    if (newConfig.maxConnections !== undefined) {
      this.maxConnections = newConfig.maxConnections;
    }
    if (newConfig.connectionTimeout !== undefined) {
      this.connectionTimeout = newConfig.connectionTimeout;
    }
    if (newConfig.heartbeatConfig) {
      this.heartbeatConfig = { ...this.heartbeatConfig, ...newConfig.heartbeatConfig };
    }
    if (newConfig.retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...newConfig.retryConfig };
    }
  }
}

// Export singleton instance
export const optimizedWebSocketManager = new OptimizedWebSocketManager(); 