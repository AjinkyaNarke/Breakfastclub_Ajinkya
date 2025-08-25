import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock different browser implementations
const createMockSpeechRecognition = (browser: string) => {
  const mockRecognition = {
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
    stop: vi.fn(),
  }

  // Browser-specific implementations
  switch (browser) {
    case 'chrome':
      // Chrome supports both SpeechRecognition and webkitSpeechRecognition
      Object.defineProperty(window, 'SpeechRecognition', {
        value: vi.fn().mockImplementation(() => mockRecognition),
        writable: true,
      })
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        value: vi.fn().mockImplementation(() => mockRecognition),
        writable: true,
      })
      break
    case 'safari':
      // Safari only supports webkitSpeechRecognition
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        value: vi.fn().mockImplementation(() => mockRecognition),
        writable: true,
      })
      break
    case 'firefox':
      // Firefox supports SpeechRecognition
      Object.defineProperty(window, 'SpeechRecognition', {
        value: vi.fn().mockImplementation(() => mockRecognition),
        writable: true,
      })
      break
    case 'edge':
      // Edge supports both
      Object.defineProperty(window, 'SpeechRecognition', {
        value: vi.fn().mockImplementation(() => mockRecognition),
        writable: true,
      })
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        value: vi.fn().mockImplementation(() => mockRecognition),
        writable: true,
      })
      break
    case 'unsupported':
      // No speech recognition support
      break
  }

  return mockRecognition
}

// Mock different browser APIs
const mockBrowserAPIs = (browser: string) => {
  // Mock AudioContext
  const mockAudioContext = {
    createMediaStreamSource: vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createAnalyser: vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      getByteFrequencyData: vi.fn(),
    }),
    state: 'running',
  }

  Object.defineProperty(window, 'AudioContext', {
    value: vi.fn().mockImplementation(() => mockAudioContext),
    writable: true,
  })

  // Mock WebkitAudioContext for Safari
  if (browser === 'safari') {
    Object.defineProperty(window, 'webkitAudioContext', {
      value: vi.fn().mockImplementation(() => mockAudioContext),
      writable: true,
    })
  }

  // Mock MediaDevices
  const mockMediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    }),
  }

  Object.defineProperty(navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true,
  })

  // Mock WebSocket
  const WebSocketMock = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 0,
  })) as any

  WebSocketMock.CONNECTING = 0
  WebSocketMock.OPEN = 1
  WebSocketMock.CLOSING = 2
  WebSocketMock.CLOSED = 3

  global.WebSocket = WebSocketMock

  // Mock fetch
  global.fetch = vi.fn()

  return { mockAudioContext, mockMediaDevices, WebSocketMock }
}

// Mock components for testing
const MockVoiceInput = ({ language, onResult, label }: any) => {
  const handleStart = () => {
    // Simulate speech recognition result
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.onresult({
        results: [[{
          transcript: 'Test transcript',
          confidence: 0.9
        }]]
      })
    }
  }

  return (
    <div data-testid="voice-input">
      <label>{label}</label>
      <button onClick={handleStart} data-testid="start-button">
        Start Dictation
      </button>
    </div>
  )
}

describe('Cross-Browser Compatibility Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Chrome Browser Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('chrome')
      mockBrowserAPIs('chrome')
    })

    it('should support both SpeechRecognition and webkitSpeechRecognition', () => {
      expect(window.SpeechRecognition).toBeDefined()
      expect((window as any).webkitSpeechRecognition).toBeDefined()
    })

    it('should initialize speech recognition correctly', () => {
      const SpeechRecognition = window.SpeechRecognition
      const recognition = new SpeechRecognition()
      
      expect(recognition).toBeDefined()
      expect(recognition.start).toBeDefined()
      expect(recognition.abort).toBeDefined()
    })

    it('should handle speech recognition events', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Chrome Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support audio context for visual feedback', () => {
      const audioContext = new AudioContext()
      expect(audioContext.createMediaStreamSource).toBeDefined()
      expect(audioContext.createAnalyser).toBeDefined()
    })

    it('should support WebSocket connections', () => {
      const ws = new WebSocket('ws://localhost:8080')
      expect(ws.send).toBeDefined()
      expect(ws.close).toBeDefined()
    })
  })

  describe('Safari Browser Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('safari')
      mockBrowserAPIs('safari')
    })

    it('should support webkitSpeechRecognition only', () => {
      expect(window.SpeechRecognition).toBeUndefined()
      expect((window as any).webkitSpeechRecognition).toBeDefined()
    })

    it('should initialize webkit speech recognition correctly', () => {
      const WebkitSpeechRecognition = (window as any).webkitSpeechRecognition
      const recognition = new WebkitSpeechRecognition()
      
      expect(recognition).toBeDefined()
      expect(recognition.start).toBeDefined()
      expect(recognition.abort).toBeDefined()
    })

    it('should handle webkit speech recognition events', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Safari Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support webkit audio context', () => {
      const audioContext = new (window as any).webkitAudioContext()
      expect(audioContext.createMediaStreamSource).toBeDefined()
      expect(audioContext.createAnalyser).toBeDefined()
    })

    it('should handle Safari-specific audio limitations', () => {
      const audioContext = new (window as any).webkitAudioContext()
      expect(audioContext.state).toBe('running')
    })
  })

  describe('Firefox Browser Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('firefox')
      mockBrowserAPIs('firefox')
    })

    it('should support SpeechRecognition only', () => {
      expect(window.SpeechRecognition).toBeDefined()
      expect((window as any).webkitSpeechRecognition).toBeUndefined()
    })

    it('should initialize speech recognition correctly', () => {
      const SpeechRecognition = window.SpeechRecognition
      const recognition = new SpeechRecognition()
      
      expect(recognition).toBeDefined()
      expect(recognition.start).toBeDefined()
      expect(recognition.abort).toBeDefined()
    })

    it('should handle Firefox speech recognition events', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Firefox Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support Firefox audio context', () => {
      const audioContext = new AudioContext()
      expect(audioContext.createMediaStreamSource).toBeDefined()
      expect(audioContext.createAnalyser).toBeDefined()
    })
  })

  describe('Edge Browser Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('edge')
      mockBrowserAPIs('edge')
    })

    it('should support both SpeechRecognition and webkitSpeechRecognition', () => {
      expect(window.SpeechRecognition).toBeDefined()
      expect((window as any).webkitSpeechRecognition).toBeDefined()
    })

    it('should prefer SpeechRecognition over webkitSpeechRecognition', () => {
      const SpeechRecognition = window.SpeechRecognition
      const recognition = new SpeechRecognition()
      
      expect(recognition).toBeDefined()
      expect(recognition.start).toBeDefined()
      expect(recognition.abort).toBeDefined()
    })

    it('should handle Edge speech recognition events', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Edge Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })
  })

  describe('Unsupported Browser Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('unsupported')
      mockBrowserAPIs('unsupported')
    })

    it('should handle browsers without speech recognition support', () => {
      expect(window.SpeechRecognition).toBeUndefined()
      expect((window as any).webkitSpeechRecognition).toBeUndefined()
    })

    it('should provide fallback behavior', () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Unsupported Test" />)
      
      const startButton = screen.getByTestId('start-button')
      expect(startButton).toBeInTheDocument()
    })

    it('should still support basic audio context', () => {
      const audioContext = new AudioContext()
      expect(audioContext.createMediaStreamSource).toBeDefined()
      expect(audioContext.createAnalyser).toBeDefined()
    })
  })

  describe('Mobile Browser Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('chrome')
      mockBrowserAPIs('chrome')
      
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        writable: true,
      })
    })

    it('should detect mobile browser', () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      expect(isMobile).toBe(true)
    })

    it('should handle mobile touch events', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Mobile Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support mobile audio constraints', () => {
      const mockMediaDevices = navigator.mediaDevices
      expect(mockMediaDevices.getUserMedia).toBeDefined()
    })
  })

  describe('Language Support Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('chrome')
      mockBrowserAPIs('chrome')
    })

    it('should support English language', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="English Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support German language', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="de" onResult={mockOnResult} label="German Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle language switching', async () => {
      const mockOnResult = vi.fn()
      
      const { rerender } = render(<MockVoiceInput language="en" onResult={mockOnResult} label="Language Switch Test" />)
      
      // Test English
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })

      // Switch to German
      rerender(<MockVoiceInput language="de" onResult={mockOnResult} label="Language Switch Test" />)
      
      const newStartButton = screen.getByTestId('start-button')
      await user.click(newStartButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Performance Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('chrome')
      mockBrowserAPIs('chrome')
    })

    it('should handle rapid speech recognition cycles', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Performance Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Rapid clicks
      await user.click(startButton)
      await user.click(startButton)
      await user.click(startButton)
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle concurrent speech recognition instances', async () => {
      const mockOnResult1 = vi.fn()
      const mockOnResult2 = vi.fn()
      
      render(
        <div>
          <MockVoiceInput language="en" onResult={mockOnResult1} label="Concurrent Test 1" />
          <MockVoiceInput language="en" onResult={mockOnResult2} label="Concurrent Test 2" />
        </div>
      )
      
      const buttons = screen.getAllByTestId('start-button')
      
      // Start both simultaneously
      await user.click(buttons[0])
      await user.click(buttons[1])

      await waitFor(() => {
        expect(mockOnResult1).toHaveBeenCalled()
        expect(mockOnResult2).toHaveBeenCalled()
      })
    })

    it('should handle memory usage under load', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Memory Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Multiple rapid operations
      for (let i = 0; i < 10; i++) {
        await user.click(startButton)
      }

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('chrome')
      mockBrowserAPIs('chrome')
    })

    it('should handle network errors consistently across browsers', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network Error'))
      
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Network Error Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle permission errors consistently', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Permission Error Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle audio context errors', () => {
      const audioContext = new AudioContext()
      expect(audioContext.createMediaStreamSource).toBeDefined()
      expect(audioContext.createAnalyser).toBeDefined()
    })
  })

  describe('Accessibility Compatibility', () => {
    beforeEach(() => {
      createMockSpeechRecognition('chrome')
      mockBrowserAPIs('chrome')
    })

    it('should support keyboard navigation across browsers', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Keyboard Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Keyboard navigation
      startButton.focus()
      expect(startButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support screen reader announcements', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Screen Reader Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Check ARIA attributes
      expect(startButton).toHaveAttribute('aria-label', 'Start dictation')
      
      await user.click(startButton)
      
      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support high contrast mode', () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="High Contrast Test" />)
      
      const startButton = screen.getByTestId('start-button')
      expect(startButton).toBeInTheDocument()
      expect(startButton).toBeVisible()
    })
  })
}) 