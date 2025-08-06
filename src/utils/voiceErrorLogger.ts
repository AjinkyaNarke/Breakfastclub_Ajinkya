// Voice error logging and reporting utilities
import { VoiceError } from './voiceUtils';

export interface VoiceErrorLog {
  id: string;
  timestamp: number;
  error: VoiceError;
  status: string;
  retryCount: number;
  connectionAttempts: number;
  userAgent: string;
  url: string;
  sessionId: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface VoiceErrorReport {
  errorType: string;
  errorCode?: string;
  message: string;
  frequency: number;
  lastOccurrence: number;
  affectedUsers: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface VoiceErrorLoggerOptions {
  enableLogging?: boolean;
  enableReporting?: boolean;
  logToConsole?: boolean;
  maxLogs?: number;
  reportThreshold?: number;
  sessionId?: string;
  userId?: string;
}

export class VoiceErrorLogger {
  private static instance: VoiceErrorLogger;
  private logs: VoiceErrorLog[] = [];
  private sessionId: string;
  private userId?: string;
  private options: VoiceErrorLoggerOptions;

  constructor(options: VoiceErrorLoggerOptions = {}) {
    this.options = {
      enableLogging: true,
      enableReporting: true,
      logToConsole: false,
      maxLogs: 100,
      reportThreshold: 5,
      ...options,
    };
    
    this.sessionId = options.sessionId || this.generateSessionId();
    this.userId = options.userId;
  }

  static getInstance(options?: VoiceErrorLoggerOptions): VoiceErrorLogger {
    if (!VoiceErrorLogger.instance) {
      VoiceErrorLogger.instance = new VoiceErrorLogger(options);
    }
    return VoiceErrorLogger.instance;
  }

  /**
   * Log a voice error
   */
  logError(
    error: VoiceError,
    status: string,
    retryCount: number = 0,
    connectionAttempts: number = 0,
    context?: Record<string, any>
  ): void {
    if (!this.options.enableLogging) return;

    const errorLog: VoiceErrorLog = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      error,
      status,
      retryCount,
      connectionAttempts,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      userId: this.userId,
      context,
    };

    this.logs.push(errorLog);

    // Keep logs under max limit
    if (this.logs.length > this.options.maxLogs!) {
      this.logs.shift();
    }

    // Log to console if enabled
    if (this.options.logToConsole) {
      console.error('Voice Error:', errorLog);
    }

    // Check if we should report this error
    if (this.options.enableReporting) {
      this.checkAndReportErrors();
    }

    // Store in localStorage for persistence
    this.persistLogs();
  }

  /**
   * Get all error logs
   */
  getLogs(): VoiceErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get error logs for a specific session
   */
  getLogsBySession(sessionId: string): VoiceErrorLog[] {
    return this.logs.filter(log => log.sessionId === sessionId);
  }

  /**
   * Get error logs for a specific user
   */
  getLogsByUser(userId: string): VoiceErrorLog[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get error logs for a specific time range
   */
  getLogsByTimeRange(startTime: number, endTime: number): VoiceErrorLog[] {
    return this.logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  /**
   * Get error frequency report
   */
  getErrorReport(): VoiceErrorReport[] {
    const errorMap = new Map<string, { count: number; lastTime: number; users: Set<string> }>();

    this.logs.forEach(log => {
      const key = `${log.error.type}:${log.error.code || 'NO_CODE'}`;
      const existing = errorMap.get(key);
      
      if (existing) {
        existing.count++;
        existing.lastTime = Math.max(existing.lastTime, log.timestamp);
        if (log.userId) existing.users.add(log.userId);
      } else {
        errorMap.set(key, {
          count: 1,
          lastTime: log.timestamp,
          users: new Set(log.userId ? [log.userId] : []),
        });
      }
    });

    return Array.from(errorMap.entries()).map(([key, data]) => {
      const [errorType, errorCode] = key.split(':');
      const severity = this.calculateSeverity(data.count, data.users.size);
      
      return {
        errorType,
        errorCode: errorCode === 'NO_CODE' ? undefined : errorCode,
        message: `Error occurred ${data.count} times`,
        frequency: data.count,
        lastOccurrence: data.lastTime,
        affectedUsers: data.users.size,
        severity,
      };
    }).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.persistLogs();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      logs: this.logs,
    }, null, 2);
  }

  /**
   * Import logs from JSON
   */
  importLogs(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.logs && Array.isArray(data.logs)) {
        this.logs = [...this.logs, ...data.logs];
        this.persistLogs();
      }
    } catch (error) {
      console.error('Failed to import logs:', error);
    }
  }

  /**
   * Send error report to server
   */
  async sendErrorReport(report: VoiceErrorReport): Promise<boolean> {
    try {
      const response = await fetch('/api/voice-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...report,
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: Date.now(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send error report:', error);
      return false;
    }
  }

  /**
   * Check if errors should be reported and send them
   */
  private async checkAndReportErrors(): Promise<void> {
    const report = this.getErrorReport();
    const errorsToReport = report.filter(error => 
      error.frequency >= this.options.reportThreshold!
    );

    for (const error of errorsToReport) {
      await this.sendErrorReport(error);
    }
  }

  /**
   * Calculate error severity
   */
  private calculateSeverity(frequency: number, affectedUsers: number): 'low' | 'medium' | 'high' | 'critical' {
    if (frequency >= 50 || affectedUsers >= 10) return 'critical';
    if (frequency >= 20 || affectedUsers >= 5) return 'high';
    if (frequency >= 10 || affectedUsers >= 2) return 'medium';
    return 'low';
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Persist logs to localStorage
   */
  private persistLogs(): void {
    try {
      const key = `voice_error_logs_${this.sessionId}`;
      const data = JSON.stringify({
        logs: this.logs,
        timestamp: Date.now(),
      });
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  loadPersistedLogs(): void {
    try {
      const key = `voice_error_logs_${this.sessionId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.logs && Array.isArray(parsed.logs)) {
          this.logs = parsed.logs;
        }
      }
    } catch (error) {
      console.error('Failed to load persisted logs:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByCode: Record<string, number>;
    averageRetries: number;
    mostCommonError: string;
  } {
    const errorsByType: Record<string, number> = {};
    const errorsByCode: Record<string, number> = {};
    let totalRetries = 0;

    this.logs.forEach(log => {
      // Count by type
      errorsByType[log.error.type] = (errorsByType[log.error.type] || 0) + 1;
      
      // Count by code
      const code = log.error.code || 'NO_CODE';
      errorsByCode[code] = (errorsByCode[code] || 0) + 1;
      
      totalRetries += log.retryCount;
    });

    const mostCommonError = Object.entries(errorsByType)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

    return {
      totalErrors: this.logs.length,
      errorsByType,
      errorsByCode,
      averageRetries: this.logs.length > 0 ? totalRetries / this.logs.length : 0,
      mostCommonError,
    };
  }

  /**
   * Get user feedback for errors
   */
  getUserFeedback(errorId: string): {
    helpful: boolean;
    comment?: string;
    timestamp: number;
  } | null {
    try {
      const key = `voice_error_feedback_${errorId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user feedback:', error);
      return null;
    }
  }

  /**
   * Save user feedback for errors
   */
  saveUserFeedback(errorId: string, feedback: { helpful: boolean; comment?: string }): void {
    try {
      const key = `voice_error_feedback_${errorId}`;
      const data = {
        ...feedback,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save user feedback:', error);
    }
  }
}

// Export singleton instance
export const voiceErrorLogger = VoiceErrorLogger.getInstance(); 