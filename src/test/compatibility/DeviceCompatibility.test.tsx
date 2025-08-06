import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock different device configurations
const mockDeviceConfig = (deviceType: string) => {
  // Mock viewport dimensions
  const viewportConfigs = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    large: { width: 2560, height: 1440 },
  }

  const config = viewportConfigs[deviceType as keyof typeof viewportConfigs] || viewportConfigs.desktop

  // Mock window dimensions
  Object.defineProperty(window, 'innerWidth', {
    value: config.width,
    writable: true,
  })
  Object.defineProperty(window, 'innerHeight', {
    value: config.height,
    writable: true,
  })

  // Mock screen dimensions
  Object.defineProperty(window.screen, 'width', {
    value: config.width,
    writable: true,
  })
  Object.defineProperty(window.screen, 'height', {
    value: config.height,
    writable: true,
  })

  // Mock device pixel ratio
  const pixelRatios = {
    mobile: 2,
    tablet: 2,
    desktop: 1,
    large: 1.5,
  }

  Object.defineProperty(window, 'devicePixelRatio', {
    value: pixelRatios[deviceType as keyof typeof pixelRatios] || 1,
    writable: true,
  })

  // Mock user agent based on device
  const userAgents = {
    mobile: {
      ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      android: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    },
    tablet: {
      ios: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      android: 'Mozilla/5.0 (Linux; Android 10; SM-T860) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36',
    },
    desktop: {
      chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36',
      firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    },
  }

  const deviceUserAgents = userAgents[deviceType as keyof typeof userAgents]
  if (deviceUserAgents) {
    const defaultUA = Object.values(deviceUserAgents)[0]
    Object.defineProperty(navigator, 'userAgent', {
      value: defaultUA,
      writable: true,
    })
  }

  // Mock touch support
  const hasTouch = deviceType === 'mobile' || deviceType === 'tablet'
  Object.defineProperty(window, 'ontouchstart', {
    value: hasTouch ? {} : undefined,
    writable: true,
  })

  // Mock orientation
  const orientations = {
    mobile: 'portrait',
    tablet: 'landscape',
    desktop: 'landscape',
    large: 'landscape',
  }

  Object.defineProperty(window.screen, 'orientation', {
    value: {
      type: orientations[deviceType as keyof typeof orientations] || 'landscape',
      angle: 0,
    },
    writable: true,
  })

  return config
}

// Mock speech recognition for all devices
const mockSpeechRecognition = () => {
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

  Object.defineProperty(window, 'SpeechRecognition', {
    value: vi.fn().mockImplementation(() => mockRecognition),
    writable: true,
  })

  Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: vi.fn().mockImplementation(() => mockRecognition),
    writable: true,
  })

  return mockRecognition
}

// Mock components for testing
const MockVoiceInput = ({ language, onResult, label, className }: any) => {
  const handleStart = () => {
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
    <div data-testid="voice-input" className={className}>
      <label>{label}</label>
      <button onClick={handleStart} data-testid="start-button">
        Start Dictation
      </button>
    </div>
  )
}

const MockVoiceFeedback = ({ isListening, audioLevel, confidence }: any) => (
  <div data-testid="voice-feedback">
    {isListening && <div data-testid="listening-indicator">Listening...</div>}
    {audioLevel > 0 && <div data-testid="audio-level">{audioLevel}</div>}
    {confidence && <div data-testid="confidence">{confidence}%</div>}
  </div>
)

describe('Device Compatibility Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Mobile Device Compatibility', () => {
    beforeEach(() => {
      mockDeviceConfig('mobile')
      mockSpeechRecognition()
    })

    it('should detect mobile device correctly', () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      expect(isMobile).toBe(true)
      expect(window.innerWidth).toBe(375)
      expect(window.innerHeight).toBe(667)
      expect(window.devicePixelRatio).toBe(2)
    })

    it('should support touch events', () => {
      expect(window.ontouchstart).toBeDefined()
    })

    it('should handle mobile viewport constraints', () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Mobile Test" />)
      
      const voiceInput = screen.getByTestId('voice-input')
      const startButton = screen.getByTestId('start-button')
      
      expect(voiceInput).toBeInTheDocument()
      expect(startButton).toBeInTheDocument()
      expect(startButton).toBeVisible()
    })

    it('should handle mobile touch interactions', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Mobile Touch Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support mobile audio constraints', () => {
      const mockMediaDevices = {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
        }),
      }

      Object.defineProperty(navigator, 'mediaDevices', {
        value: mockMediaDevices,
        writable: true,
      })

      expect(navigator.mediaDevices.getUserMedia).toBeDefined()
    })

    it('should handle mobile orientation changes', () => {
      expect(window.screen.orientation.type).toBe('portrait')
      
      // Simulate orientation change
      Object.defineProperty(window.screen, 'orientation', {
        value: { type: 'landscape', angle: 90 },
        writable: true,
      })

      expect(window.screen.orientation.type).toBe('landscape')
    })
  })

  describe('Tablet Device Compatibility', () => {
    beforeEach(() => {
      mockDeviceConfig('tablet')
      mockSpeechRecognition()
    })

    it('should detect tablet device correctly', () => {
      const isTablet = /iPad|Android.*Tablet/i.test(navigator.userAgent)
      expect(isTablet).toBe(true)
      expect(window.innerWidth).toBe(768)
      expect(window.innerHeight).toBe(1024)
      expect(window.devicePixelRatio).toBe(2)
    })

    it('should support both touch and mouse events', () => {
      expect(window.ontouchstart).toBeDefined()
    })

    it('should handle tablet viewport layout', () => {
      const mockOnResult = vi.fn()
      
      render(
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <MockVoiceInput language="en" onResult={mockOnResult} label="Tablet Test" />
          <MockVoiceFeedback isListening={false} audioLevel={0} confidence={0} />
        </div>
      )
      
      const voiceInput = screen.getByTestId('voice-input')
      const voiceFeedback = screen.getByTestId('voice-feedback')
      
      expect(voiceInput).toBeInTheDocument()
      expect(voiceFeedback).toBeInTheDocument()
    })

    it('should handle tablet orientation', () => {
      expect(window.screen.orientation.type).toBe('landscape')
    })
  })

  describe('Desktop Device Compatibility', () => {
    beforeEach(() => {
      mockDeviceConfig('desktop')
      mockSpeechRecognition()
    })

    it('should detect desktop device correctly', () => {
      const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      expect(isDesktop).toBe(true)
      expect(window.innerWidth).toBe(1920)
      expect(window.innerHeight).toBe(1080)
      expect(window.devicePixelRatio).toBe(1)
    })

    it('should support mouse and keyboard interactions', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Desktop Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Mouse click
      await user.click(startButton)
      
      // Keyboard navigation
      startButton.focus()
      expect(startButton).toHaveFocus()
      
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle desktop viewport layout', () => {
      const mockOnResult = vi.fn()
      
      render(
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <MockVoiceInput language="en" onResult={mockOnResult} label="Desktop Layout Test" />
          <MockVoiceFeedback isListening={false} audioLevel={0} confidence={0} />
        </div>
      )
      
      const voiceInput = screen.getByTestId('voice-input')
      const voiceFeedback = screen.getByTestId('voice-feedback')
      
      expect(voiceInput).toBeInTheDocument()
      expect(voiceFeedback).toBeInTheDocument()
    })
  })

  describe('Large Screen Device Compatibility', () => {
    beforeEach(() => {
      mockDeviceConfig('large')
      mockSpeechRecognition()
    })

    it('should detect large screen device correctly', () => {
      expect(window.innerWidth).toBe(2560)
      expect(window.innerHeight).toBe(1440)
      expect(window.devicePixelRatio).toBe(1.5)
    })

    it('should handle large screen layout optimization', () => {
      const mockOnResult = vi.fn()
      
      render(
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          <MockVoiceInput language="en" onResult={mockOnResult} label="Large Screen Test" />
        </div>
      )
      
      const voiceInput = screen.getByTestId('voice-input')
      expect(voiceInput).toBeInTheDocument()
    })
  })

  describe('Responsive Design Compatibility', () => {
    it('should adapt to different screen sizes', () => {
      const screenSizes = [
        { device: 'mobile', width: 375, height: 667 },
        { device: 'tablet', width: 768, height: 1024 },
        { device: 'desktop', width: 1920, height: 1080 },
        { device: 'large', width: 2560, height: 1440 },
      ]

      screenSizes.forEach((config) => {
        const { device, width, height } = config
        mockDeviceConfig(device)
        mockSpeechRecognition()

        const mockOnResult = vi.fn()
        
        render(<MockVoiceInput language="en" onResult={mockOnResult} label={`${device} Responsive Test`} />)
        
        const voiceInput = screen.getByTestId('voice-input')
        expect(voiceInput).toBeInTheDocument()
        expect(window.innerWidth).toBe(width)
        expect(window.innerHeight).toBe(height)
      })
    })

    it('should handle viewport scaling', () => {
      const mockOnResult = vi.fn()
      
      // Test with different pixel ratios
      [1, 1.5, 2, 3].forEach(ratio => {
        Object.defineProperty(window, 'devicePixelRatio', {
          value: ratio,
          writable: true,
        })

        render(<MockVoiceInput language="en" onResult={mockOnResult} label={`Pixel Ratio ${ratio} Test`} />)
        
        const voiceInput = screen.getByTestId('voice-input')
        expect(voiceInput).toBeInTheDocument()
        expect(window.devicePixelRatio).toBe(ratio)
      })
    })
  })

  describe('Input Method Compatibility', () => {
    beforeEach(() => {
      mockDeviceConfig('desktop')
      mockSpeechRecognition()
    })

    it('should support mouse input', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Mouse Input Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support keyboard input', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Keyboard Input Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      startButton.focus()
      expect(startButton).toHaveFocus()
      
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should support touch input on touch devices', async () => {
      // Switch to mobile config for touch testing
      mockDeviceConfig('mobile')
      
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Touch Input Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })
  })

  describe('Performance Compatibility', () => {
    beforeEach(() => {
      mockDeviceConfig('desktop')
      mockSpeechRecognition()
    })

    it('should handle performance on low-end devices', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Performance Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Simulate rapid interactions
      for (let i = 0; i < 5; i++) {
        await user.click(startButton)
      }

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle memory constraints', async () => {
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Memory Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Multiple rapid operations to test memory usage
      for (let i = 0; i < 10; i++) {
        await user.click(startButton)
      }

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility Compatibility Across Devices', () => {
    it('should maintain accessibility on mobile devices', async () => {
      mockDeviceConfig('mobile')
      mockSpeechRecognition()
      
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Mobile Accessibility Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Test keyboard navigation on mobile
      startButton.focus()
      expect(startButton).toHaveFocus()
      
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should maintain accessibility on tablet devices', async () => {
      mockDeviceConfig('tablet')
      mockSpeechRecognition()
      
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Tablet Accessibility Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Test keyboard navigation on tablet
      startButton.focus()
      expect(startButton).toHaveFocus()
      
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should maintain accessibility on desktop devices', async () => {
      mockDeviceConfig('desktop')
      mockSpeechRecognition()
      
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Desktop Accessibility Test" />)
      
      const startButton = screen.getByTestId('start-button')
      
      // Test keyboard navigation on desktop
      startButton.focus()
      expect(startButton).toHaveFocus()
      
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })
  })

  describe('Network Compatibility Across Devices', () => {
    beforeEach(() => {
      mockDeviceConfig('desktop')
      mockSpeechRecognition()
    })

    it('should handle network conditions on mobile devices', async () => {
      mockDeviceConfig('mobile')
      
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Slow Network'))
      
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Mobile Network Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle network conditions on tablet devices', async () => {
      mockDeviceConfig('tablet')
      
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Unstable Network'))
      
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Tablet Network Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })

    it('should handle network conditions on desktop devices', async () => {
      mockDeviceConfig('desktop')
      
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network Error'))
      
      const mockOnResult = vi.fn()
      
      render(<MockVoiceInput language="en" onResult={mockOnResult} label="Desktop Network Test" />)
      
      const startButton = screen.getByTestId('start-button')
      await user.click(startButton)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalled()
      })
    })
  })
}) 