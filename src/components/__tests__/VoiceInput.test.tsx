import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VoiceInput } from '../VoiceInput'

// Mock the Web Speech API
const mockSpeechRecognition = {
  lang: '',
  continuous: false,
  interimResults: false,
  maxAlternatives: 1,
  onstart: vi.fn(),
  onresult: vi.fn(),
  onerror: vi.fn(),
  onend: vi.fn(),
  start: vi.fn(),
  abort: vi.fn(),
}

const mockWebkitSpeechRecognition = { ...mockSpeechRecognition }

// Mock window.SpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  value: vi.fn().mockImplementation(() => mockSpeechRecognition),
  writable: true,
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: vi.fn().mockImplementation(() => mockWebkitSpeechRecognition),
  writable: true,
})

// Mock fetch for DeepSeek API
global.fetch = vi.fn()

describe('VoiceInput', () => {
  const mockOnResult = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnResult.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      expect(screen.getByRole('button', { name: /start dictation/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/start dictation/i)).toBeInTheDocument()
    })

    it('renders with custom label', () => {
      render(<VoiceInput language="en" onResult={mockOnResult} label="Custom Label" />)
      
      expect(screen.getByText('Custom Label')).toBeInTheDocument()
      expect(screen.getByLabelText(/start dictation/i)).toBeInTheDocument()
    })

    it('shows correct button text and icon when not listening', () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      expect(button).toHaveTextContent('Start Dictation')
      expect(button).not.toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Speech Recognition Support', () => {
    it('shows error when speech recognition is not supported', async () => {
      // Mock no speech recognition support
      Object.defineProperty(window, 'SpeechRecognition', { value: undefined })
      Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined })

      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      expect(screen.getByText(/speech recognition is not supported/i)).toBeInTheDocument()
    })

    it('uses webkitSpeechRecognition when SpeechRecognition is not available', async () => {
      Object.defineProperty(window, 'SpeechRecognition', { value: undefined })
      
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      expect(window.webkitSpeechRecognition).toHaveBeenCalled()
    })
  })

  describe('Language Configuration', () => {
    it('sets German language correctly', async () => {
      render(<VoiceInput language="de" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      expect(mockSpeechRecognition.lang).toBe('de-DE')
    })

    it('sets English language correctly', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      expect(mockSpeechRecognition.lang).toBe('en-US')
    })
  })

  describe('Recording States', () => {
    it('changes to listening state when start button is clicked', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      // Simulate onstart event
      mockSpeechRecognition.onstart()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /stop listening/i })).toBeInTheDocument()
        expect(screen.getByText('Stop Listening')).toBeInTheDocument()
      })
    })

    it('shows loading state during processing', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('returns to idle state when stop button is clicked', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      // Simulate onstart event
      mockSpeechRecognition.onstart()

      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop listening/i })
        user.click(stopButton)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start dictation/i })).toBeInTheDocument()
      })
    })
  })

  describe('Speech Recognition Results', () => {
    it('processes successful speech recognition result', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      // Simulate successful result
      const mockEvent = {
        results: [[{
          transcript: 'Hello world',
          confidence: 0.85
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/transcribed: hello world/i)).toBeInTheDocument()
        expect(screen.getByText(/confidence: 85\.0%/i)).toBeInTheDocument()
      })
    })

    it('calls onResult callback with transcribed text', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      const mockEvent = {
        results: [[{
          transcript: 'Test transcript',
          confidence: 0.9
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test transcript')
      })
    })
  })

  describe('DeepSeek Integration', () => {
    it('processes text through DeepSeek when API key is available', async () => {
      // Mock environment variable
      vi.stubEnv('VITE_DEEPSEEK_API_KEY', 'test-key')
      
      // Mock successful DeepSeek response
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Processed text' } }]
        })
      } as Response)

      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      const mockEvent = {
        results: [[{
          transcript: 'Raw transcript',
          confidence: 0.8
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.deepseek.com/v1/chat/completions',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-key'
            })
          })
        )
      })

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Processed text')
      })
    })

    it('falls back to raw transcript when DeepSeek fails', async () => {
      vi.stubEnv('VITE_DEEPSEEK_API_KEY', 'test-key')
      
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      const mockEvent = {
        results: [[{
          transcript: 'Raw transcript',
          confidence: 0.8
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Raw transcript')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles microphone permission denied error', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      mockSpeechRecognition.onerror({ error: 'not-allowed' })

      await waitFor(() => {
        expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument()
      })
    })

    it('handles no speech detected error', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      mockSpeechRecognition.onerror({ error: 'no-speech' })

      await waitFor(() => {
        expect(screen.getByText(/no speech detected/i)).toBeInTheDocument()
      })
    })

    it('handles audio capture error', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      mockSpeechRecognition.onerror({ error: 'audio-capture' })

      await waitFor(() => {
        expect(screen.getByText(/no microphone found/i)).toBeInTheDocument()
      })
    })

    it('handles unknown error', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      mockSpeechRecognition.onerror({ error: 'unknown-error' })

      await waitFor(() => {
        expect(screen.getByText(/speech recognition error: unknown-error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(button).toHaveAttribute('aria-label', 'Start dictation')
    })

    it('updates ARIA attributes when listening', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      mockSpeechRecognition.onstart()

      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop listening/i })
        expect(stopButton).toHaveAttribute('aria-pressed', 'true')
        expect(stopButton).toHaveAttribute('aria-label', 'Stop dictation')
      })
    })

    it('has proper status announcements', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      expect(screen.getByRole('status')).toHaveTextContent('Processing...')
    })

    it('has proper alert announcements for errors', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      mockSpeechRecognition.onerror({ error: 'not-allowed' })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/microphone access denied/i)
      })
    })
  })

  describe('Button States', () => {
    it('disables button during loading', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      expect(button).toBeDisabled()
    })

    it('changes button variant when listening', async () => {
      render(<VoiceInput language="en" onResult={mockOnResult} />)
      
      const button = screen.getByRole('button', { name: /start dictation/i })
      await user.click(button)

      mockSpeechRecognition.onstart()

      await waitFor(() => {
        const stopButton = screen.getByRole('button', { name: /stop listening/i })
        expect(stopButton).toHaveClass('destructive')
      })
    })
  })
}) 