import React, { useState, useEffect } from 'react';
import { optimizedWebSocketManager } from '../lib/optimizedWebSocketManager';

interface ConnectionMetrics {
  latency: number;
  bandwidth: number;
  messageCount: number;
  errorCount: number;
  isActive: boolean;
}

interface GlobalMetrics {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  totalMessages: number;
  totalErrors: number;
  averageLatency: number;
}

interface WebSocketPerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
  refreshInterval?: number;
}

export function WebSocketPerformanceMonitor({
  className = '',
  showDetails = false,
  refreshInterval = 5000
}: WebSocketPerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<{
    global: GlobalMetrics;
    connections: Array<{
      key: string;
      latency: number;
      bandwidth: number;
      messageCount: number;
      errorCount: number;
      isActive: boolean;
    }>;
  } | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Get initial metrics
    const initialMetrics = optimizedWebSocketManager.getMetrics();
    setMetrics(initialMetrics);

    // Set up metrics listener
    const handleMetrics = (metricsData: any) => {
      setMetrics(metricsData);
    };

    optimizedWebSocketManager.on('metrics', handleMetrics);

    // Set up periodic refresh
    const interval = setInterval(() => {
      const currentMetrics = optimizedWebSocketManager.getMetrics();
      setMetrics(currentMetrics);
    }, refreshInterval);

    return () => {
      optimizedWebSocketManager.off('metrics', handleMetrics);
      clearInterval(interval);
    };
  }, [refreshInterval]);

  if (!metrics) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-sm text-gray-500">Loading performance metrics...</div>
      </div>
    );
  }

  const { global, connections } = metrics;

  // Calculate health indicators
  const getConnectionHealth = (latency: number, errorCount: number) => {
    if (latency < 100 && errorCount === 0) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (latency < 200 && errorCount < 2) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (latency < 500 && errorCount < 5) return { status: 'fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getGlobalHealth = () => {
    const avgLatency = global.averageLatency;
    const errorRate = global.totalErrors / Math.max(global.totalMessages, 1);
    
    if (avgLatency < 150 && errorRate < 0.01) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (avgLatency < 300 && errorRate < 0.05) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (avgLatency < 600 && errorRate < 0.1) return { status: 'fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const globalHealth = getGlobalHealth();

  return (
    <div className={`p-4 bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-sm font-medium text-gray-900">WebSocket Performance</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{global.activeConnections}</div>
          <div className="text-xs text-gray-500">Active Connections</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-semibold ${globalHealth.color}`}>
            {global.averageLatency.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500">Avg Latency</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{global.totalMessages}</div>
          <div className="text-xs text-gray-500">Total Messages</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">{global.totalErrors}</div>
          <div className="text-xs text-gray-500">Total Errors</div>
        </div>
      </div>

      {/* Health Status */}
      <div className={`p-3 rounded-lg ${globalHealth.bg} mb-4`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${globalHealth.color}`}>
            Overall Health: {globalHealth.status.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            {global.totalConnections} total connections
          </span>
        </div>
      </div>

      {/* Connection Details */}
      {isExpanded && showDetails && connections.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Connection Details</h4>
          {connections.map((connection) => {
            const health = getConnectionHealth(connection.latency, connection.errorCount);
            return (
              <div key={connection.key} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-gray-600 truncate">
                    {connection.key}
                  </span>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${health.bg} ${health.color}`}>
                    {health.status}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Latency:</span>
                    <span className="ml-1 font-medium">{connection.latency.toFixed(0)}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Messages:</span>
                    <span className="ml-1 font-medium">{connection.messageCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Errors:</span>
                    <span className="ml-1 font-medium text-red-600">{connection.errorCount}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500 text-xs">Bandwidth:</span>
                  <span className="ml-1 font-medium text-xs">
                    {(connection.bandwidth / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Performance Chart */}
      {isExpanded && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Trends</h4>
          <div className="h-20 bg-gray-50 rounded-lg p-2">
            <div className="flex items-end justify-between h-full space-x-1">
              {connections.slice(0, 10).map((connection, index) => {
                const height = Math.min(100, (connection.latency / 500) * 100);
                const health = getConnectionHealth(connection.latency, connection.errorCount);
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-t ${health.bg} ${health.color}`}
                    style={{ height: `${height}%` }}
                    title={`${connection.latency.toFixed(0)}ms latency`}
                  ></div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0ms</span>
            <span>500ms</span>
          </div>
        </div>
      )}

      {/* Optimization Tips */}
      {isExpanded && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Optimization Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            {global.averageLatency > 300 && (
              <li>• Consider reducing audio quality for lower latency</li>
            )}
            {global.totalErrors > 0 && (
              <li>• Check network stability and retry failed connections</li>
            )}
            {global.activeConnections > 2 && (
              <li>• Connection pool is active - optimizing resource usage</li>
            )}
            {global.averageLatency < 100 && (
              <li>• Excellent performance - connection optimization working well</li>
            )}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>Refresh: {refreshInterval / 1000}s</span>
        </div>
      </div>
    </div>
  );
}

// Compact version for status bar
export function WebSocketStatusIndicator() {
  const [isConnected, setIsConnected] = useState(false);
  const [health, setHealth] = useState<'excellent' | 'good' | 'fair' | 'poor'>('fair');

  useEffect(() => {
    const handleMetrics = (metricsData: any) => {
      const activeConnections = metricsData.global.activeConnections;
      const avgLatency = metricsData.global.averageLatency;
      const errorRate = metricsData.global.totalErrors / Math.max(metricsData.global.totalMessages, 1);

      setIsConnected(activeConnections > 0);

      if (avgLatency < 150 && errorRate < 0.01) setHealth('excellent');
      else if (avgLatency < 300 && errorRate < 0.05) setHealth('good');
      else if (avgLatency < 600 && errorRate < 0.1) setHealth('fair');
      else setHealth('poor');
    };

    optimizedWebSocketManager.on('metrics', handleMetrics);

    return () => {
      optimizedWebSocketManager.off('metrics', handleMetrics);
    };
  }, []);

  const getHealthColor = () => {
    switch (health) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <div className={`w-2 h-2 rounded-full ${getHealthColor()} ${isConnected ? 'animate-pulse' : ''}`}></div>
      <span className="text-xs text-gray-600">WS</span>
    </div>
  );
} 