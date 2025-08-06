import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VoiceStatusComponent } from '../VoiceStatus'

// Mock the useVoiceStatus hook
vi.mock('../../hooks/useVoiceStatus', () => ({
  useVoiceStatus: vi.fn(),
}))

describe('VoiceStatusComponent', () => {
  const mockOnRetry = vi.fn()
  const mockOnClearError = vi.fn()
  const mockOnForceOffline = vi.fn()
  const mockOnGoOnline = vi.fn()
  const mockOnProcessOfflineQueue = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    status: 'ready' as const,
    error: null,
    retryCount: 0,
    connectionAttempts: 0,
    isRetrying: false,
    canRetry: true,
    canConnect: true,
    isOffline: false,
    isTimeout: false,
    onRetry: mockOnRetry,
    onClearError: mockOnClearError,
    onForceOffline: mockOnForceOffline,
    onGoOnline: mockOnGoOnline,
    onProcessOfflineQueue: mockOnProcessOfflineQueue,
    offlineQueueLength: 0,
  }

  describe('Rendering', () => {
    it('renders with ready status', () => {
      render(<VoiceStatusComponent {...defaultProps} />)
      
      expect(screen.getByText(/ready/i)).toBeInTheDocument()
      expect(screen.getByText(/microphone is ready/i)).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      render(<VoiceStatusComponent {...defaultProps} className="custom-class" />)
      
      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveClass('custom-class')
    })
  })

  describe('Status States', () => {
    it('displays connecting status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="connecting" />)
      
      expect(screen.getByText(/connecting/i)).toBeInTheDocument()
      expect(screen.getByText(/establishing connection/i)).toBeInTheDocument()
    })

    it('displays connected status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="connected" />)
      
      expect(screen.getByText(/connected/i)).toBeInTheDocument()
      expect(screen.getByText(/ready to listen/i)).toBeInTheDocument()
    })

    it('displays listening status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="listening" />)
      
      expect(screen.getByText(/listening/i)).toBeInTheDocument()
      expect(screen.getByText(/speak now/i)).toBeInTheDocument()
    })

    it('displays processing status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="processing" />)
      
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
      expect(screen.getByText(/processing audio/i)).toBeInTheDocument()
    })

    it('displays parsing status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="parsing" />)
      
      expect(screen.getByText(/parsing/i)).toBeInTheDocument()
      expect(screen.getByText(/analyzing speech/i)).toBeInTheDocument()
    })

    it('displays complete status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="complete" />)
      
      expect(screen.getByText(/complete/i)).toBeInTheDocument()
      expect(screen.getByText(/transcription complete/i)).toBeInTheDocument()
    })

    it('displays error status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="error" />)
      
      expect(screen.getByText(/error/i)).toBeInTheDocument()
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
    })

    it('displays timeout status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="timeout" />)
      
      expect(screen.getByText(/timeout/i)).toBeInTheDocument()
      expect(screen.getByText(/request timed out/i)).toBeInTheDocument()
    })

    it('displays disconnected status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="disconnected" />)
      
      expect(screen.getByText(/disconnected/i)).toBeInTheDocument()
      expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
    })

    it('displays offline status', () => {
      render(<VoiceStatusComponent {...defaultProps} status="offline" />)
      
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
      expect(screen.getByText(/working offline/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when error is present', () => {
      const error = {
        type: 'connection' as const,
        message: 'Connection failed',
        code: 'CONNECTION_ERROR',
        details: 'Unable to connect to server',
      }
      
      render(<VoiceStatusComponent {...defaultProps} status="error" error={error} />)
      
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument()
      expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument()
    })

    it('displays retry count when greater than 0', () => {
      render(<VoiceStatusComponent {...defaultProps} retryCount={3} />)
      
      expect(screen.getByText(/retry 3/i)).toBeInTheDocument()
    })

    it('shows retry button when canRetry is true', () => {
      render(<VoiceStatusComponent {...defaultProps} canRetry={true} />)
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('hides retry button when canRetry is false', () => {
      render(<VoiceStatusComponent {...defaultProps} canRetry={false} />)
      
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      render(<VoiceStatusComponent {...defaultProps} canRetry={true} />)
      
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1)
    })

    it('calls onClearError when clear error button is clicked', async () => {
      const error = {
        type: 'connection' as const,
        message: 'Connection failed',
        code: 'CONNECTION_ERROR',
        details: 'Unable to connect to server',
      }
      
      render(<VoiceStatusComponent {...defaultProps} status="error" error={error} />)
      
      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)
      
      expect(mockOnClearError).toHaveBeenCalledTimes(1)
    })
  })

  describe('Connection Progress', () => {
    it('shows connection progress when connecting', () => {
      render(<VoiceStatusComponent {...defaultProps} status="connecting" connectionAttempts={2} />)
      
      expect(screen.getByText(/attempt 2/i)).toBeInTheDocument()
    })

    it('shows progress bar when connecting', () => {
      render(<VoiceStatusComponent {...defaultProps} status="connecting" />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Offline Mode', () => {
    it('shows offline queue length when greater than 0', () => {
      render(<VoiceStatusComponent {...defaultProps} status="offline" offlineQueueLength={5} />)
      
      expect(screen.getByText(/5 items/i)).toBeInTheDocument()
    })

    it('shows process queue button when queue has items', () => {
      render(<VoiceStatusComponent {...defaultProps} status="offline" offlineQueueLength={3} />)
      
      expect(screen.getByRole('button', { name: /process queue/i })).toBeInTheDocument()
    })

    it('calls onProcessOfflineQueue when process queue button is clicked', async () => {
      render(<VoiceStatusComponent {...defaultProps} status="offline" offlineQueueLength={2} />)
      
      const processButton = screen.getByRole('button', { name: /process queue/i })
      await user.click(processButton)
      
      expect(mockOnProcessOfflineQueue).toHaveBeenCalledTimes(1)
    })

    it('shows go online button when offline', () => {
      render(<VoiceStatusComponent {...defaultProps} status="offline" canConnect={true} />)
      
      expect(screen.getByRole('button', { name: /go online/i })).toBeInTheDocument()
    })

    it('calls onGoOnline when go online button is clicked', async () => {
      render(<VoiceStatusComponent {...defaultProps} status="offline" canConnect={true} />)
      
      const onlineButton = screen.getByRole('button', { name: /go online/i })
      await user.click(onlineButton)
      
      expect(mockOnGoOnline).toHaveBeenCalledTimes(1)
    })

    it('shows force offline button when online', () => {
      render(<VoiceStatusComponent {...defaultProps} status="connected" />)
      
      expect(screen.getByRole('button', { name: /force offline/i })).toBeInTheDocument()
    })

    it('calls onForceOffline when force offline button is clicked', async () => {
      render(<VoiceStatusComponent {...defaultProps} status="connected" />)
      
      const offlineButton = screen.getByRole('button', { name: /force offline/i })
      await user.click(offlineButton)
      
      expect(mockOnForceOffline).toHaveBeenCalledTimes(1)
    })
  })

  describe('Timeout Handling', () => {
    it('shows timeout message when isTimeout is true', () => {
      render(<VoiceStatusComponent {...defaultProps} isTimeout={true} />)
      
      expect(screen.getByText(/timeout detected/i)).toBeInTheDocument()
    })

    it('shows retry button for timeout errors', () => {
      render(<VoiceStatusComponent {...defaultProps} isTimeout={true} canRetry={true} />)
      
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Retry States', () => {
    it('shows retrying state when isRetrying is true', () => {
      render(<VoiceStatusComponent {...defaultProps} isRetrying={true} />)
      
      expect(screen.getByText(/retrying/i)).toBeInTheDocument()
    })

    it('disables retry button when retrying', () => {
      render(<VoiceStatusComponent {...defaultProps} isRetrying={true} canRetry={true} />)
      
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<VoiceStatusComponent {...defaultProps} />)
      
      const statusElement = screen.getByRole('status')
      expect(statusElement).toBeInTheDocument()
    })

    it('has proper button labels', () => {
      render(<VoiceStatusComponent {...defaultProps} canRetry={true} />)
      
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toHaveAccessibleName(/retry/i)
    })

    it('announces status changes', () => {
      const { rerender } = render(<VoiceStatusComponent {...defaultProps} status="ready" />)
      
      expect(screen.getByText(/ready/i)).toBeInTheDocument()
      
      rerender(<VoiceStatusComponent {...defaultProps} status="listening" />)
      
      expect(screen.getByText(/listening/i)).toBeInTheDocument()
    })
  })

  describe('Status Colors', () => {
    it('applies correct color classes for different statuses', () => {
      const { rerender } = render(<VoiceStatusComponent {...defaultProps} status="ready" />)
      
      let statusElement = screen.getByRole('status')
      expect(statusElement).toHaveClass('bg-green-100')
      
      rerender(<VoiceStatusComponent {...defaultProps} status="error" />)
      
      statusElement = screen.getByRole('status')
      expect(statusElement).toHaveClass('bg-red-100')
      
      rerender(<VoiceStatusComponent {...defaultProps} status="connecting" />)
      
      statusElement = screen.getByRole('status')
      expect(statusElement).toHaveClass('bg-blue-100')
    })
  })

  describe('Icon Display', () => {
    it('shows correct icons for different statuses', () => {
      const { rerender } = render(<VoiceStatusComponent {...defaultProps} status="ready" />)
      
      // Should show Mic icon for ready status
      expect(screen.getByTestId('status-icon')).toBeInTheDocument()
      
      rerender(<VoiceStatusComponent {...defaultProps} status="error" />)
      
      // Should show XCircle icon for error status
      expect(screen.getByTestId('status-icon')).toBeInTheDocument()
    })
  })
}) 