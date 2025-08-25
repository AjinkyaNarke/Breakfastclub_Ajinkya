import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceStateTransitionProps {
  currentState: 'ready' | 'connecting' | 'connected' | 'listening' | 'processing' | 'parsing' | 'complete' | 'error';
  children: React.ReactNode;
  className?: string;
}

export const VoiceStateTransition: React.FC<VoiceStateTransitionProps> = ({
  currentState,
  children,
  className = '',
}) => {
  const [previousState, setPreviousState] = useState(currentState);

  useEffect(() => {
    setPreviousState(currentState);
  }, [currentState]);

  const getStateAnimation = (state: string) => {
    switch (state) {
      case 'ready':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
          transition: { duration: 0.3, ease: 'easeOut' }
        };
      case 'connecting':
        return {
          initial: { opacity: 0, y: -10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 10 },
          transition: { duration: 0.4, ease: 'easeInOut' }
        };
      case 'connected':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.1 },
          transition: { duration: 0.3, ease: 'easeOut' }
        };
      case 'listening':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.2 },
          transition: { duration: 0.5, ease: 'easeOut' }
        };
      case 'processing':
      case 'parsing':
        return {
          initial: { opacity: 0, rotateY: -15 },
          animate: { opacity: 1, rotateY: 0 },
          exit: { opacity: 0, rotateY: 15 },
          transition: { duration: 0.4, ease: 'easeInOut' }
        };
      case 'complete':
        return {
          initial: { opacity: 0, scale: 0.8, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 1.1, y: -20 },
          transition: { duration: 0.6, ease: 'easeOut' }
        };
      case 'error':
        return {
          initial: { opacity: 0, x: -20, rotateZ: -5 },
          animate: { opacity: 1, x: 0, rotateZ: 0 },
          exit: { opacity: 0, x: 20, rotateZ: 5 },
          transition: { duration: 0.4, ease: 'easeInOut' }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.3 }
        };
    }
  };

  const animation = getStateAnimation(currentState);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentState}
        initial={animation.initial}
        animate={animation.animate}
        exit={animation.exit}
        transition={animation.transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Pulse animation for listening state
interface PulseAnimationProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  isActive,
  children,
  className = '',
  intensity = 'medium',
}) => {
  const intensityConfig = {
    low: { scale: 1.02, duration: 2 },
    medium: { scale: 1.05, duration: 1.5 },
    high: { scale: 1.1, duration: 1 },
  };

  const config = intensityConfig[intensity];

  return (
    <motion.div
      animate={isActive ? {
        scale: [1, config.scale, 1],
        transition: {
          duration: config.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }
      } : { scale: 1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Wave animation for audio visualization
interface WaveAnimationProps {
  isActive: boolean;
  bars: number;
  className?: string;
}

export const WaveAnimation: React.FC<WaveAnimationProps> = ({
  isActive,
  bars,
  className = '',
}) => {
  return (
    <div className={cn('flex items-end gap-1', className)}>
      {Array.from({ length: bars }).map((_, index) => (
        <motion.div
          key={index}
          className="w-1 bg-blue-500 rounded-full"
          animate={isActive ? {
            height: [10, 40, 10],
            transition: {
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.1,
              ease: 'easeInOut',
            }
          } : { height: 10 }}
        />
      ))}
    </div>
  );
};

// Fade transition for text changes
interface FadeTransitionProps {
  children: React.ReactNode;
  key: string | number;
  className?: string;
  duration?: number;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  key,
  className = '',
  duration = 0.3,
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Slide transition for status changes
interface SlideTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
  duration?: number;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  direction = 'up',
  className = '',
  duration = 0.4,
}) => {
  const getDirectionOffset = () => {
    switch (direction) {
      case 'left': return { x: -50, y: 0 };
      case 'right': return { x: 50, y: 0 };
      case 'up': return { x: 0, y: -50 };
      case 'down': return { x: 0, y: 50 };
      default: return { x: 0, y: -50 };
    }
  };

  const offset = getDirectionOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...offset }}
      transition={{ duration, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Loading spinner with smooth rotation
interface LoadingSpinnerProps {
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isActive,
  size = 'md',
  className = '',
}) => {
  const sizeConfig = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <motion.div
      animate={isActive ? { rotate: 360 } : { rotate: 0 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={cn(sizeConfig[size], className)}
    >
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  );
};

// Bounce animation for notifications
interface BounceAnimationProps {
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
}

export const BounceAnimation: React.FC<BounceAnimationProps> = ({
  children,
  isVisible,
  className = '',
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Shake animation for errors
interface ShakeAnimationProps {
  children: React.ReactNode;
  isShaking: boolean;
  className?: string;
}

export const ShakeAnimation: React.FC<ShakeAnimationProps> = ({
  children,
  isShaking,
  className = '',
}) => {
  return (
    <motion.div
      animate={isShaking ? {
        x: [-10, 10, -10, 10, -10, 10, 0],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
        }
      } : { x: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}; 