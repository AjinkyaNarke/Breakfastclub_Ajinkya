import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceVolumeBarsProps {
  audioLevel: number;
  isActive: boolean;
  bars?: number;
  height?: number;
  width?: number;
  color?: string;
  className?: string;
  showLabels?: boolean;
  animate?: boolean;
}

export const VoiceVolumeBars: React.FC<VoiceVolumeBarsProps> = ({
  audioLevel,
  isActive,
  bars = 12,
  height = 80,
  width = 4,
  color = 'bg-blue-500',
  className = '',
  showLabels = false,
  animate = true,
}) => {
  const [barHeights, setBarHeights] = useState<number[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastAudioLevel = useRef<number>(0);

  // Generate random bar heights based on audio level
  const generateBarHeights = (level: number) => {
    const heights = [];
    for (let i = 0; i < bars; i++) {
      // Create a more natural wave pattern
      const waveFactor = Math.sin((i / bars) * Math.PI * 2 + Date.now() * 0.01);
      const randomFactor = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
      const height = isActive 
        ? Math.max(5, (level * 100) * randomFactor * (0.5 + waveFactor * 0.5))
        : 0;
      heights.push(height);
    }
    return heights;
  };

  // Animate bars
  useEffect(() => {
    if (!animate) {
      setBarHeights(generateBarHeights(audioLevel));
      return;
    }

    const animateBars = () => {
      if (!isActive) {
        setBarHeights(new Array(bars).fill(0));
        return;
      }

      // Smooth transition for audio level changes
      const targetLevel = audioLevel;
      const currentLevel = lastAudioLevel.current;
      const smoothLevel = currentLevel + (targetLevel - currentLevel) * 0.1;
      lastAudioLevel.current = smoothLevel;

      setBarHeights(generateBarHeights(smoothLevel));
      animationRef.current = requestAnimationFrame(animateBars);
    };

    animateBars();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevel, isActive, bars, animate]);

  // Get color based on audio level
  const getBarColor = (height: number) => {
    const percentage = height / 100;
    if (percentage > 0.8) return 'bg-red-500';
    if (percentage > 0.6) return 'bg-yellow-500';
    if (percentage > 0.3) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  // Get opacity based on height
  const getBarOpacity = (height: number) => {
    const percentage = height / 100;
    return Math.max(0.2, Math.min(1, percentage * 1.5));
  };

  return (
    <div className={cn('flex flex-col items-center space-y-2', className)}>
      {/* Volume Bars Container */}
      <div 
        className="flex items-end gap-1"
        style={{ height: `${height}px` }}
      >
        {barHeights.map((height, index) => (
          <div
            key={index}
            className={cn(
              'rounded-full transition-all duration-75 ease-out',
              getBarColor(height),
              animate && 'animate-pulse'
            )}
            style={{
              width: `${width}px`,
              height: `${height}%`,
              opacity: getBarOpacity(height),
              transform: `scaleY(${isActive ? 1 : 0.1})`,
            }}
          />
        ))}
      </div>

      {/* Audio Level Indicator */}
      {showLabels && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Peak</span>
          </div>
        </div>
      )}

      {/* Audio Level Percentage */}
      {showLabels && (
        <div className="text-xs text-gray-500 font-mono">
          {Math.round(audioLevel * 100)}%
        </div>
      )}
    </div>
  );
};

// Advanced Volume Visualizer with Frequency Analysis
interface FrequencyVisualizerProps {
  audioData: Float32Array | null;
  isActive: boolean;
  className?: string;
}

export const FrequencyVisualizer: React.FC<FrequencyVisualizerProps> = ({
  audioData,
  isActive,
  className = '',
}) => {
  const [frequencies, setFrequencies] = useState<number[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioData || !isActive) {
      setFrequencies(new Array(32).fill(0));
      return;
    }

    const animate = () => {
      // Simple frequency analysis (in real implementation, use FFT)
      const freqData = [];
      const chunkSize = Math.floor(audioData.length / 32);
      
      for (let i = 0; i < 32; i++) {
        const start = i * chunkSize;
        const end = start + chunkSize;
        let sum = 0;
        
        for (let j = start; j < end && j < audioData.length; j++) {
          sum += Math.abs(audioData[j]);
        }
        
        const average = sum / chunkSize;
        freqData.push(Math.min(100, average * 200)); // Scale for visualization
      }
      
      setFrequencies(freqData);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, isActive]);

  return (
    <div className={cn('flex items-end gap-0.5 h-20', className)}>
      {frequencies.map((freq, index) => (
        <div
          key={index}
          className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm transition-all duration-50"
          style={{
            width: '3px',
            height: `${freq}%`,
            opacity: freq > 0 ? 0.6 + (freq / 100) * 0.4 : 0.1,
          }}
        />
      ))}
    </div>
  );
};

// Circular Volume Indicator
interface CircularVolumeIndicatorProps {
  audioLevel: number;
  isActive: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const CircularVolumeIndicator: React.FC<CircularVolumeIndicatorProps> = ({
  audioLevel,
  isActive,
  size = 60,
  strokeWidth = 4,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = isActive ? audioLevel : 0;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  const getStrokeColor = () => {
    if (progress > 0.8) return '#ef4444'; // red
    if (progress > 0.6) return '#f59e0b'; // yellow
    if (progress > 0.3) return '#3b82f6'; // blue
    return '#9ca3af'; // gray
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-100 ease-out"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-mono text-gray-600">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}; 