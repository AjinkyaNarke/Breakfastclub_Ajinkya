# Voice Input System - Developer Quick Reference

This quick reference guide provides essential information for developers working with the voice input system.

## Table of Contents

1. [Component Overview](#component-overview)
2. [API Reference](#api-reference)
3. [Hooks Reference](#hooks-reference)
4. [Testing Quick Start](#testing-quick-start)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)
7. [Performance Tips](#performance-tips)

## Component Overview

### Core Components

```typescript
// Main voice input component
import { VoiceInput } from '@/components/VoiceInput'

// Status display component
import { VoiceStatusComponent } from '@/components/VoiceStatus'

// Visual feedback component
import { VoiceFeedback } from '@/components/VoiceFeedback'

// Parser component
import { VoiceParser } from '@/components/VoiceParser'
```

### Basic Usage

```typescript
import { VoiceInput } from '@/components/VoiceInput'

function MyComponent() {
  const handleResult = (transcript: string) => {
    console.log('Voice input:', transcript)
  }

  return (
    <VoiceInput
      language="en"
      onResult={handleResult}
      label="Enter text"
    />
  )
}
```

## API Reference

### VoiceInput Props

```typescript
interface VoiceInputProps {
  language: 'en' | 'de'                    // Language for speech recognition
  onResult: (transcript: string) => void   // Callback for transcription result
  label?: string                          // Label for the input field
  placeholder?: string                    // Placeholder text
  disabled?: boolean                      // Disable voice input
  className?: string                      // CSS classes
  autoStart?: boolean                     // Start recording automatically
  timeout?: number                        // Recording timeout in seconds
  confidence?: number                     // Minimum confidence threshold
}
```

### VoiceStatus Props

```typescript
interface VoiceStatusProps {
  status: 'ready' | 'listening' | 'processing' | 'error' | 'complete'
  error?: string                          // Error message
  retry?: () => void                      // Retry function
  onReset?: () => void                    // Reset function
  className?: string                      // CSS classes
}
```

### VoiceFeedback Props

```typescript
interface VoiceFeedbackProps {
  isListening: boolean                    // Whether currently listening
  isConnected: boolean                    // Connection status
  audioLevel: number                      // Audio level (0-100)
  confidence: number                      // Confidence score (0-1)
  duration: number                        // Recording duration
  className?: string                      // CSS classes
  size?: 'sm' | 'md' | 'lg'              // Component size
}
```

## Hooks Reference

### useDeepgram Hook

```typescript
import { useDeepgram } from '@/hooks/useDeepgram'

function MyComponent() {
  const {
    isConnected,
    isListening,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    sendAudio,
    updateConfig
  } = useDeepgram({
    apiKey: 'your-api-key',
    language: 'en',
    model: 'nova-2'
  })

  return (
    <div>
      <button onClick={startListening}>Start</button>
      <button onClick={stopListening}>Stop</button>
      <p>Transcript: {transcript}</p>
      <p>Confidence: {confidence}</p>
    </div>
  )
}
```

### useVoiceStatus Hook

```typescript
import { useVoiceStatus } from '@/hooks/useVoiceStatus'

function MyComponent() {
  const {
    status,
    error,
    retry,
    reset,
    updateStatus
  } = useVoiceStatus()

  return (
    <div>
      <p>Status: {status}</p>
      {error && <p>Error: {error}</p>}
      <button onClick={retry}>Retry</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

### useSpeechParsing Hook

```typescript
import { useSpeechParsing } from '@/hooks/useSpeechParsing'

function MyComponent() {
  const {
    parsedData,
    isParsing,
    error,
    parseTranscript
  } = useSpeechParsing()

  const handleTranscript = async (transcript: string) => {
    const result = await parseTranscript(transcript)
    console.log('Parsed data:', result)
  }

  return (
    <div>
      <VoiceInput onResult={handleTranscript} />
      {isParsing && <p>Parsing...</p>}
      {parsedData && <pre>{JSON.stringify(parsedData, null, 2)}</pre>}
    </div>
  )
}
```

## Testing Quick Start

### Basic Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { VoiceInput } from '@/components/VoiceInput'

describe('VoiceInput', () => {
  it('should render correctly', () => {
    const mockOnResult = vi.fn()
    
    render(<VoiceInput language="en" onResult={mockOnResult} />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle voice input', async () => {
    const mockOnResult = vi.fn()
    
    render(<VoiceInput language="en" onResult={mockOnResult} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Simulate speech recognition result
    // ... test implementation
  })
})
```

### Hook Test

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useDeepgram } from '@/hooks/useDeepgram'

describe('useDeepgram', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useDeepgram())
    
    expect(result.current.isConnected).toBe(false)
    expect(result.current.isListening).toBe(false)
  })

  it('should start listening', async () => {
    const { result } = renderHook(() => useDeepgram())
    
    await act(async () => {
      await result.current.startListening()
    })
    
    expect(result.current.isListening).toBe(true)
  })
})
```

### Mock Setup

```typescript
// Mock speech recognition
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
```

## Common Patterns

### Integration with Forms

```typescript
import { useState } from 'react'
import { VoiceInput } from '@/components/VoiceInput'

function MenuItemForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: '',
    price: ''
  })

  const handleVoiceInput = (field: keyof typeof formData) => (transcript: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: transcript
    }))
  }

  return (
    <form>
      <div>
        <label>Name:</label>
        <VoiceInput
          language="en"
          onResult={handleVoiceInput('name')}
          placeholder="Speak the item name"
        />
        <input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>
      
      <div>
        <label>Description:</label>
        <VoiceInput
          language="en"
          onResult={handleVoiceInput('description')}
          placeholder="Describe the item"
        />
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
    </form>
  )
}
```

### Error Handling

```typescript
import { useState } from 'react'
import { VoiceInput } from '@/components/VoiceInput'
import { VoiceStatusComponent } from '@/components/VoiceStatus'

function VoiceInputWithError() {
  const [status, setStatus] = useState<'ready' | 'error'>('ready')
  const [error, setError] = useState<string>('')

  const handleResult = (transcript: string) => {
    try {
      // Process transcript
      console.log('Transcript:', transcript)
      setStatus('ready')
      setError('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleError = (errorMessage: string) => {
    setStatus('error')
    setError(errorMessage)
  }

  return (
    <div>
      <VoiceInput
        language="en"
        onResult={handleResult}
        onError={handleError}
      />
      <VoiceStatusComponent
        status={status}
        error={error}
        retry={() => setStatus('ready')}
      />
    </div>
  )
}
```

### Multi-language Support

```typescript
import { useState } from 'react'
import { VoiceInput } from '@/components/VoiceInput'

function MultiLanguageVoiceInput() {
  const [language, setLanguage] = useState<'en' | 'de'>('en')

  const handleLanguageChange = (newLanguage: 'en' | 'de') => {
    setLanguage(newLanguage)
  }

  return (
    <div>
      <div>
        <button
          onClick={() => handleLanguageChange('en')}
          className={language === 'en' ? 'active' : ''}
        >
          English
        </button>
        <button
          onClick={() => handleLanguageChange('de')}
          className={language === 'de' ? 'active' : ''}
        >
          Deutsch
        </button>
      </div>
      
      <VoiceInput
        language={language}
        onResult={(transcript) => console.log(transcript)}
        placeholder={language === 'en' ? 'Speak in English' : 'Sprechen Sie auf Deutsch'}
      />
    </div>
  )
}
```

### Performance Optimization

```typescript
import { useCallback, useMemo } from 'react'
import { VoiceInput } from '@/components/VoiceInput'

function OptimizedVoiceInput() {
  // Memoize callback to prevent unnecessary re-renders
  const handleResult = useCallback((transcript: string) => {
    console.log('Transcript:', transcript)
  }, [])

  // Memoize configuration object
  const config = useMemo(() => ({
    language: 'en' as const,
    timeout: 30000,
    confidence: 0.8
  }), [])

  return (
    <VoiceInput
      {...config}
      onResult={handleResult}
    />
  )
}
```

## Troubleshooting

### Common Issues

#### 1. Speech Recognition Not Working

**Problem:** `SpeechRecognition is not defined`
```typescript
// Solution: Check browser support
if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
  console.error('Speech recognition not supported')
  return
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
```

#### 2. Microphone Permission Denied

**Problem:** User denied microphone access
```typescript
// Solution: Handle permission errors
const handleError = (error: SpeechRecognitionErrorEvent) => {
  if (error.error === 'not-allowed') {
    alert('Please allow microphone access to use voice input')
  }
}
```

#### 3. Network Issues

**Problem:** Deepgram API calls failing
```typescript
// Solution: Add retry logic
const sendAudioWithRetry = async (audioData: ArrayBuffer, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await sendAudio(audioData)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

#### 4. Memory Leaks

**Problem:** Event listeners not cleaned up
```typescript
// Solution: Proper cleanup in useEffect
useEffect(() => {
  const recognition = new SpeechRecognition()
  
  recognition.onresult = handleResult
  recognition.onerror = handleError
  
  return () => {
    recognition.abort()
    recognition.onresult = null
    recognition.onerror = null
  }
}, [])
```

### Debug Mode

```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development'

const log = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[VoiceInput] ${message}`, data)
  }
}

// Use in components
log('Starting voice input')
log('Received transcript', transcript)
log('Error occurred', error)
```

## Performance Tips

### 1. Debounce Voice Input

```typescript
import { useCallback } from 'react'
import { debounce } from 'lodash'

function DebouncedVoiceInput() {
  const debouncedResult = useCallback(
    debounce((transcript: string) => {
      console.log('Processed transcript:', transcript)
    }, 300),
    []
  )

  return (
    <VoiceInput
      language="en"
      onResult={debouncedResult}
    />
  )
}
```

### 2. Lazy Load Components

```typescript
import { lazy, Suspense } from 'react'

const VoiceInput = lazy(() => import('@/components/VoiceInput'))

function LazyVoiceInput() {
  return (
    <Suspense fallback={<div>Loading voice input...</div>}>
      <VoiceInput language="en" onResult={console.log} />
    </Suspense>
  )
}
```

### 3. Optimize Audio Processing

```typescript
// Use Web Workers for audio processing
const audioWorker = new Worker('/audio-processor.js')

audioWorker.postMessage({
  type: 'process',
  audioData: audioBuffer
})

audioWorker.onmessage = (event) => {
  if (event.data.type === 'processed') {
    // Handle processed audio
  }
}
```

### 4. Cache Recognition Results

```typescript
import { useMemo } from 'react'

function CachedVoiceInput() {
  const cachedResults = useMemo(() => new Map<string, string>(), [])

  const handleResult = (transcript: string) => {
    const hash = btoa(transcript) // Simple hash
    if (cachedResults.has(hash)) {
      console.log('Using cached result')
      return cachedResults.get(hash)
    }
    
    // Process new transcript
    const processed = processTranscript(transcript)
    cachedResults.set(hash, processed)
    return processed
  }

  return (
    <VoiceInput
      language="en"
      onResult={handleResult}
    />
  )
}
```

### 5. Monitor Performance

```typescript
// Performance monitoring
const measurePerformance = (operation: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  
  console.log(`${operation} took ${end - start}ms`)
}

// Use in components
measurePerformance('voice input processing', () => {
  processTranscript(transcript)
})
```

---

This quick reference provides essential information for developers working with the voice input system. For more detailed information, refer to the full documentation and API reference. 