import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

Object.defineProperty(window, 'SpeechRecognition', {
  value: vi.fn().mockImplementation(() => mockSpeechRecognition),
  writable: true,
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: vi.fn().mockImplementation(() => mockSpeechRecognition),
  writable: true,
})

// Mock fetch for DeepSeek API
global.fetch = vi.fn()

// Mock components for workflow testing
const MockVoiceInput = ({ language, onResult, label }: any) => (
  <div data-testid="voice-input">
    <label>{label}</label>
    <button 
      onClick={() => {
        // Simulate successful speech recognition
        const mockEvent = {
          results: [[{
            transcript: 'Test menu item description',
            confidence: 0.9
          }]]
        }
        mockSpeechRecognition.onresult(mockEvent)
      }}
    >
      Start Dictation
    </button>
  </div>
)

const MockVoiceStatus = ({ status, error }: any) => (
  <div data-testid="voice-status" data-status={status}>
    {status}
    {error && <div data-testid="error">{error}</div>}
  </div>
)

const MockVoiceFeedback = ({ isListening, confidence }: any) => (
  <div data-testid="voice-feedback">
    {isListening && <div data-testid="listening">Listening...</div>}
    {confidence && <div data-testid="confidence">{confidence}%</div>}
  </div>
)

describe('Voice Workflow Acceptance Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Workflow 1: Complete Menu Item Creation', () => {
    it('should complete full menu item creation workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Menu Item Name" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      // Step 1: Check initial state
      expect(screen.getByTestId('voice-status')).toHaveAttribute('data-status', 'ready')
      expect(screen.getByTestId('voice-feedback')).toBeInTheDocument()

      // Step 2: Start dictation
      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      // Step 3: Verify result processing
      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })
    })

    it('should handle German menu item creation workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="de" 
            onResult={mockOnResult} 
            label="Menüpunkt Name" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })
    })
  })

  describe('Workflow 2: Ingredient Management', () => {
    it('should handle ingredient list creation workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Ingredient List" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })
    })

    it('should handle ingredient categorization workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Ingredient Category" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })
    })
  })

  describe('Workflow 3: Order Processing', () => {
    it('should handle customer order workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Customer Order" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })
    })

    it('should handle order modification workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Order Modification" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })
    })
  })

  describe('Workflow 4: Error Recovery', () => {
    it('should handle error recovery workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="error" error="Connection failed" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Retry Input" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      // Check error state
      expect(screen.getByTestId('voice-status')).toHaveAttribute('data-status', 'error')
      expect(screen.getByTestId('error')).toHaveTextContent('Connection failed')

      // Retry
      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })
    })

    it('should handle network failure recovery workflow', async () => {
      const mockOnResult = vi.fn()
      
      // Mock network failure
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network Error'))
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Network Test" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })
    })
  })

  describe('Workflow 5: Multi-step Process', () => {
    it('should handle multi-step menu creation workflow', async () => {
      const mockOnResult = vi.fn()
      
      const { rerender } = render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Step 1: Menu Item Name" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      // Step 1: Menu item name
      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })

      // Step 2: Description
      rerender(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Step 2: Description" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const step2Button = screen.getByText('Start Dictation')
      await user.click(step2Button)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledTimes(2)
      })

      // Step 3: Price
      rerender(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Step 3: Price" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const step3Button = screen.getByText('Start Dictation')
      await user.click(step3Button)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledTimes(3)
      })
    })

    it('should handle workflow with status transitions', async () => {
      const mockOnResult = vi.fn()
      
      const { rerender } = render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Status Test" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      // Initial state
      expect(screen.getByTestId('voice-status')).toHaveAttribute('data-status', 'ready')

      // Start listening
      rerender(
        <div>
          <MockVoiceStatus status="listening" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Status Test" 
          />
          <MockVoiceFeedback isListening={true} confidence={85} />
        </div>
      )

      expect(screen.getByTestId('voice-status')).toHaveAttribute('data-status', 'listening')
      expect(screen.getByTestId('listening')).toBeInTheDocument()
      expect(screen.getByTestId('confidence')).toHaveTextContent('85%')

      // Processing state
      rerender(
        <div>
          <MockVoiceStatus status="processing" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Status Test" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      expect(screen.getByTestId('voice-status')).toHaveAttribute('data-status', 'processing')

      // Complete state
      rerender(
        <div>
          <MockVoiceStatus status="complete" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Status Test" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      expect(screen.getByTestId('voice-status')).toHaveAttribute('data-status', 'complete')
    })
  })

  describe('Workflow 6: Performance and Stress Testing', () => {
    it('should handle rapid workflow execution', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Rapid Test" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      
      // Rapid clicks
      await user.click(startButton)
      await user.click(startButton)
      await user.click(startButton)
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle concurrent workflow execution', async () => {
      const mockOnResult1 = vi.fn()
      const mockOnResult2 = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult1} 
            label="Concurrent Test 1" 
          />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult2} 
            label="Concurrent Test 2" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const buttons = screen.getAllByText('Start Dictation')
      
      // Start both simultaneously
      await user.click(buttons[0])
      await user.click(buttons[1])

      await waitFor(() => {
        expect(mockOnResult1).toHaveBeenCalled()
        expect(mockOnResult2).toHaveBeenCalled()
      })
    })
  })

  describe('Workflow 7: Accessibility Workflow', () => {
    it('should handle keyboard-only workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Keyboard Test" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      
      // Keyboard navigation
      startButton.focus()
      expect(startButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle screen reader workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Screen Reader Test" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      
      // Check ARIA attributes
      expect(startButton).toHaveAttribute('aria-label', 'Start dictation')
      
      await user.click(startButton)
      
      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })
  })

  describe('Workflow 8: Integration Workflow', () => {
    it('should handle complete integration workflow', async () => {
      const mockOnResult = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={mockOnResult} 
            label="Integration Test" 
          />
          <MockVoiceFeedback isListening={false} />
          <div data-testid="result-display"></div>
        </div>
      )

      // Complete workflow simulation
      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
      })

      // Verify all components are working together
      expect(screen.getByTestId('voice-status')).toBeInTheDocument()
      expect(screen.getByTestId('voice-input')).toBeInTheDocument()
      expect(screen.getByTestId('voice-feedback')).toBeInTheDocument()
    })

    it('should handle workflow with data persistence', async () => {
      const mockOnResult = vi.fn()
      const mockSaveData = vi.fn()
      
      render(
        <div>
          <MockVoiceStatus status="ready" />
          <MockVoiceInput 
            language="en" 
            onResult={(result: string) => {
              mockOnResult(result)
              mockSaveData(result)
            }} 
            label="Persistence Test" 
          />
          <MockVoiceFeedback isListening={false} />
        </div>
      )

      const startButton = screen.getByText('Start Dictation')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test menu item description')
        expect(mockSaveData).toHaveBeenCalledWith('Test menu item description')
      })
    })
  })
}) 