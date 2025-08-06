import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VoiceFeedback } from '../VoiceFeedback'

describe('VoiceFeedback', () => {
  const defaultProps = {
    isListening: false,
    isConnected: true,
    audioLevel: 0,
    confidence: 0.8,
    duration: 0,
    className: '',
    size: 'md' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<VoiceFeedback {...defaultProps} />)
      
      expect(screen.getByTestId('voice-feedback')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      render(<VoiceFeedback {...defaultProps} className="custom-class" />)
      
      const feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('custom-class')
    })
  })

  describe('Listening State', () => {
    it('shows listening indicator when isListening is true', () => {
      render(<VoiceFeedback {...defaultProps} isListening={true} />)
      
      expect(screen.getByTestId('listening-indicator')).toBeInTheDocument()
    })

    it('hides listening indicator when isListening is false', () => {
      render(<VoiceFeedback {...defaultProps} isListening={false} />)
      
      expect(screen.queryByTestId('listening-indicator')).not.toBeInTheDocument()
    })

    it('applies listening animation classes', () => {
      render(<VoiceFeedback {...defaultProps} isListening={true} />)
      
      const indicator = screen.getByTestId('listening-indicator')
      expect(indicator).toHaveClass('animate-pulse')
    })
  })

  describe('Connection State', () => {
    it('shows connected state when isConnected is true', () => {
      render(<VoiceFeedback {...defaultProps} isConnected={true} />)
      
      expect(screen.getByTestId('connection-status')).toBeInTheDocument()
    })

    it('shows disconnected state when isConnected is false', () => {
      render(<VoiceFeedback {...defaultProps} isConnected={false} />)
      
      expect(screen.getByTestId('connection-status')).toBeInTheDocument()
    })
  })

  describe('Audio Level Display', () => {
    it('shows volume bars when listening', () => {
      render(<VoiceFeedback {...defaultProps} isListening={true} audioLevel={0.5} />)
      
      expect(screen.getByTestId('volume-bars')).toBeInTheDocument()
    })

    it('hides volume bars when not listening', () => {
      render(<VoiceFeedback {...defaultProps} isListening={false} audioLevel={0.5} />)
      
      expect(screen.queryByTestId('volume-bars')).not.toBeInTheDocument()
    })

    it('displays correct audio level', () => {
      render(<VoiceFeedback {...defaultProps} isListening={true} audioLevel={0.75} />)
      
      const volumeBars = screen.getByTestId('volume-bars')
      expect(volumeBars).toHaveAttribute('data-audio-level', '0.75')
    })

    it('handles zero audio level', () => {
      render(<VoiceFeedback {...defaultProps} isListening={true} audioLevel={0} />)
      
      const volumeBars = screen.getByTestId('volume-bars')
      expect(volumeBars).toHaveAttribute('data-audio-level', '0')
    })

    it('handles maximum audio level', () => {
      render(<VoiceFeedback {...defaultProps} isListening={true} audioLevel={1} />)
      
      const volumeBars = screen.getByTestId('volume-bars')
      expect(volumeBars).toHaveAttribute('data-audio-level', '1')
    })
  })

  describe('Confidence Display', () => {
    it('shows confidence score', () => {
      render(<VoiceFeedback {...defaultProps} confidence={0.85} />)
      
      expect(screen.getByText(/85%/i)).toBeInTheDocument()
    })

    it('formats confidence as percentage', () => {
      render(<VoiceFeedback {...defaultProps} confidence={0.123} />)
      
      expect(screen.getByText(/12\.3%/i)).toBeInTheDocument()
    })

    it('applies high confidence color classes', () => {
      render(<VoiceFeedback {...defaultProps} confidence={0.9} />)
      
      const confidenceElement = screen.getByTestId('confidence-score')
      expect(confidenceElement).toHaveClass('text-green-500')
    })

    it('applies medium confidence color classes', () => {
      render(<VoiceFeedback {...defaultProps} confidence={0.7} />)
      
      const confidenceElement = screen.getByTestId('confidence-score')
      expect(confidenceElement).toHaveClass('text-yellow-500')
    })

    it('applies low confidence color classes', () => {
      render(<VoiceFeedback {...defaultProps} confidence={0.3} />)
      
      const confidenceElement = screen.getByTestId('confidence-score')
      expect(confidenceElement).toHaveClass('text-red-500')
    })
  })

  describe('Duration Display', () => {
    it('shows duration when greater than 0', () => {
      render(<VoiceFeedback {...defaultProps} duration={30} />)
      
      expect(screen.getByText(/30s/i)).toBeInTheDocument()
    })

    it('formats duration correctly', () => {
      render(<VoiceFeedback {...defaultProps} duration={65} />)
      
      expect(screen.getByText(/1m 5s/i)).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('applies small size classes', () => {
      render(<VoiceFeedback {...defaultProps} size="sm" />)
      
      const feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('h-8', 'w-8')
    })

    it('applies medium size classes', () => {
      render(<VoiceFeedback {...defaultProps} size="md" />)
      
      const feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('h-12', 'w-12')
    })

    it('applies large size classes', () => {
      render(<VoiceFeedback {...defaultProps} size="lg" />)
      
      const feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('h-16', 'w-16')
    })
  })

  describe('Combined States', () => {
    it('handles listening with audio level and confidence', () => {
      render(
        <VoiceFeedback 
          {...defaultProps} 
          isListening={true} 
          audioLevel={0.6} 
          confidence={0.8}
        />
      )
      
      expect(screen.getByTestId('listening-indicator')).toBeInTheDocument()
      expect(screen.getByTestId('volume-bars')).toBeInTheDocument()
      expect(screen.getByText(/80%/i)).toBeInTheDocument()
    })

    it('handles disconnected state', () => {
      render(
        <VoiceFeedback 
          {...defaultProps} 
          isConnected={false}
        />
      )
      
      expect(screen.getByTestId('connection-status')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<VoiceFeedback {...defaultProps} isListening={true} />)
      
      const feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveAttribute('aria-live', 'polite')
    })

    it('announces status changes', () => {
      const { rerender } = render(<VoiceFeedback {...defaultProps} isListening={false} />)
      
      rerender(<VoiceFeedback {...defaultProps} isListening={true} />)
      
      const feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveAttribute('aria-live', 'polite')
    })

    it('has proper role attributes', () => {
      render(<VoiceFeedback {...defaultProps} />)
      
      const feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveAttribute('role', 'status')
    })
  })

  describe('Visual Feedback', () => {
    it('applies correct background colors for different states', () => {
      const { rerender } = render(<VoiceFeedback {...defaultProps} isListening={true} />)
      
      let feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('bg-blue-50')
      
      rerender(<VoiceFeedback {...defaultProps} isConnected={false} />)
      
      feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('bg-red-50')
    })

    it('applies border colors correctly', () => {
      const { rerender } = render(<VoiceFeedback {...defaultProps} isListening={true} />)
      
      let feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('border-blue-200')
      
      rerender(<VoiceFeedback {...defaultProps} isConnected={false} />)
      
      feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('border-red-200')
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive classes', () => {
      render(<VoiceFeedback {...defaultProps} />)
      
      const feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('p-4')
      expect(feedbackElement).toHaveClass('rounded-lg')
    })

    it('handles mobile layout', () => {
      render(<VoiceFeedback {...defaultProps} />)
      
      const feedbackElement = screen.getByTestId('voice-feedback')
      expect(feedbackElement).toHaveClass('text-sm')
    })
  })
}) 