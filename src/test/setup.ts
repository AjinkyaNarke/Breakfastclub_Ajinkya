import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web Audio API
Object.defineProperty(window, 'AudioContext', {
  value: vi.fn().mockImplementation(() => ({
    createMediaStreamSource: vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createAnalyser: vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      getByteFrequencyData: vi.fn(),
    }),
  })),
})

// Mock MediaDevices API
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    }),
  },
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

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock SpeechRecognition API
class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'
  maxAlternatives = 1
  serviceURI = ''
  grammars = null
  
  // Event handlers
  onaudiostart = null
  onaudioend = null
  onend = null
  onerror = null
  onnomatch = null
  onresult = null
  onsoundstart = null
  onsoundend = null
  onspeechstart = null
  onspeechend = null
  onstart = null

  constructor() {
    this.start = vi.fn().mockImplementation(() => {
      // Simulate successful recognition
      setTimeout(() => {
        if (this.onstart) this.onstart()
        
        // Simulate result after a short delay
        setTimeout(() => {
          if (this.onresult) {
            const mockEvent = {
              results: [{
                0: {
                  transcript: 'test transcript',
                  confidence: 0.95
                }
              }]
            }
            this.onresult(mockEvent)
          }
          if (this.onend) this.onend()
        }, 10)
      }, 5)
    })
    
    this.stop = vi.fn().mockImplementation(() => {
      if (this.onend) this.onend()
    })
    
    this.abort = vi.fn()
    this.addEventListener = vi.fn()
    this.removeEventListener = vi.fn()
  }
}

// Set up global mocks
global.SpeechRecognition = MockSpeechRecognition
global.webkitSpeechRecognition = MockSpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  value: MockSpeechRecognition,
  writable: true,
  configurable: true
})
Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: MockSpeechRecognition,
  writable: true,
  configurable: true
}) 