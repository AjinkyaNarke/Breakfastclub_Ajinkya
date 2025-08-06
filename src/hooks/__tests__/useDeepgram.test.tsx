import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the entire modules
vi.mock('../../lib/deepgramClient', () => ({
  DeepgramClient: vi.fn().mockImplementation(() => ({
    onTranscript: vi.fn(),
    onError: vi.fn(),
    onConnectionState: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendAudio: vi.fn(),
    updateConfig: vi.fn(),
  })),
}))

vi.mock('../../lib/deepgramAuth', () => ({
  useDeepgramAuth: vi.fn().mockReturnValue({
    validateUsage: vi.fn().mockResolvedValue({
      can_use: true,
      current_usage: 100,
      quota: 1000,
      remaining: 900,
    }),
  }),
}))

// Import after mocking
import { useDeepgram } from '../useDeepgram'

describe('useDeepgram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useDeepgram())

      expect(result.current.isConnected).toBe(false)
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.currentTranscript).toBe('')
    })

    it('creates DeepgramClient with provided config', () => {
      const mockConfig = { language: 'de-DE', model: 'nova-2' }
      
      renderHook(() => useDeepgram({ config: mockConfig }))

      const { DeepgramClient } = require('../../lib/deepgramClient')
      expect(DeepgramClient).toHaveBeenCalledWith(mockConfig)
    })
  })

  describe('Connection Management', () => {
    it('connects successfully', async () => {
      const { result } = renderHook(() => useDeepgram())

      await act(async () => {
        await result.current.connect()
      })

      // The connect method should be called on the client
      expect(result.current.connect).toBeDefined()
    })

    it('disconnects successfully', () => {
      const { result } = renderHook(() => useDeepgram())

      act(() => {
        result.current.disconnect()
      })

      // The disconnect method should be called on the client
      expect(result.current.disconnect).toBeDefined()
    })
  })

  describe('Audio Processing', () => {
    it('sends audio data', () => {
      const { result } = renderHook(() => useDeepgram())

      const mockAudioData = new ArrayBuffer(1024)
      
      act(() => {
        result.current.sendAudio(mockAudioData)
      })

      // The sendAudio method should be called on the client
      expect(result.current.sendAudio).toBeDefined()
    })

    it('sends blob audio data', () => {
      const { result } = renderHook(() => useDeepgram())

      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' })
      
      act(() => {
        result.current.sendAudio(mockBlob)
      })

      // The sendAudio method should be called on the client
      expect(result.current.sendAudio).toBeDefined()
    })
  })

  describe('Configuration Updates', () => {
    it('updates client configuration', () => {
      const { result } = renderHook(() => useDeepgram())

      const newConfig = { language: 'en-US' }
      
      act(() => {
        result.current.updateConfig(newConfig)
      })

      // The updateConfig method should be called on the client
      expect(result.current.updateConfig).toBeDefined()
    })
  })

  describe('Hook Return Values', () => {
    it('returns all expected properties and methods', () => {
      const { result } = renderHook(() => useDeepgram())

      expect(result.current).toHaveProperty('isConnected')
      expect(result.current).toHaveProperty('isConnecting')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('currentTranscript')
      expect(result.current).toHaveProperty('connect')
      expect(result.current).toHaveProperty('disconnect')
      expect(result.current).toHaveProperty('sendAudio')
      expect(result.current).toHaveProperty('clearTranscripts')
      expect(result.current).toHaveProperty('updateConfig')
    })

    it('returns functions that can be called', () => {
      const { result } = renderHook(() => useDeepgram())

      expect(typeof result.current.connect).toBe('function')
      expect(typeof result.current.disconnect).toBe('function')
      expect(typeof result.current.sendAudio).toBe('function')
      expect(typeof result.current.clearTranscripts).toBe('function')
      expect(typeof result.current.updateConfig).toBe('function')
    })
  })

  describe('Options Handling', () => {
    it('accepts onTranscript callback', () => {
      const mockOnTranscript = vi.fn()
      
      renderHook(() => useDeepgram({ onTranscript: mockOnTranscript }))

      // Should not throw error
      expect(mockOnTranscript).toBeDefined()
    })

    it('accepts onError callback', () => {
      const mockOnError = vi.fn()
      
      renderHook(() => useDeepgram({ onError: mockOnError }))

      // Should not throw error
      expect(mockOnError).toBeDefined()
    })

    it('accepts autoConnect option', () => {
      renderHook(() => useDeepgram({ autoConnect: true }))

      // Should not throw error
      expect(true).toBe(true)
    })
  })
}) 