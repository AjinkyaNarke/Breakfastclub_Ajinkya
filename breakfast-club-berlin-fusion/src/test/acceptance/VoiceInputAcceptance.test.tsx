import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VoiceInput } from '../../components/VoiceInput'
import { VoiceStatusComponent } from '../../components/VoiceStatus'
import { VoiceFeedback } from '../../components/VoiceFeedback'

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

describe('Voice Input User Acceptance Tests', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Scenario 1: Chef Adding New Menu Item', () => {
    it('should allow chef to dictate a complete menu item description', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Menu Item Description" />)
      
      // Chef starts dictation
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate chef dictating menu item
      const mockEvent = {
        results: [[{
          transcript: 'Grilled salmon with roasted vegetables and lemon butter sauce',
          confidence: 0.92
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/grilled salmon with roasted vegetables/i)).toBeInTheDocument()
        expect(mockOnResult).toHaveBeenCalledWith('Grilled salmon with roasted vegetables and lemon butter sauce')
      })
    })

    it('should handle German menu item dictation', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="de" onResult={mockOnResult} label="Menüpunkt Beschreibung" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate German dictation
      const mockEvent = {
        results: [[{
          transcript: 'Gegrillter Lachs mit geröstetem Gemüse und Zitronen-Butter-Sauce',
          confidence: 0.88
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/gegrillter lachs/i)).toBeInTheDocument()
        expect(mockOnResult).toHaveBeenCalledWith('Gegrillter Lachs mit geröstetem Gemüse und Zitronen-Butter-Sauce')
      })
    })
  })

  describe('Scenario 2: Kitchen Staff in Noisy Environment', () => {
    it('should handle low confidence speech and provide feedback', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Ingredient List" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate noisy environment with low confidence
      const mockEvent = {
        results: [[{
          transcript: 'Fresh basil, tomatoes, mozzarella',
          confidence: 0.45
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/confidence: 45\.0%/i)).toBeInTheDocument()
        expect(mockOnResult).toHaveBeenCalledWith('Fresh basil, tomatoes, mozzarella')
      })
    })

    it('should retry automatically on no-speech error', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Cooking Instructions" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate no speech detected
      mockSpeechRecognition.onerror({ error: 'no-speech' })

      await waitFor(() => {
        expect(screen.getByText(/no speech detected/i)).toBeInTheDocument()
      })

      // Should automatically retry after 1 second
      await waitFor(() => {
        expect(mockSpeechRecognition.start).toHaveBeenCalledTimes(2)
      }, { timeout: 2000 })
    })
  })

  describe('Scenario 3: Server Taking Customer Orders', () => {
    it('should handle quick order dictation with multiple items', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Customer Order" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate server taking order
      const mockEvent = {
        results: [[{
          transcript: 'Two eggs benedict, one avocado toast, three coffees',
          confidence: 0.95
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/two eggs benedict/i)).toBeInTheDocument()
        expect(mockOnResult).toHaveBeenCalledWith('Two eggs benedict, one avocado toast, three coffees')
      })
    })

    it('should handle order modifications', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Order Modification" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate order modification
      const mockEvent = {
        results: [[{
          transcript: 'Change the eggs benedict to scrambled, add extra bacon',
          confidence: 0.87
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/change the eggs benedict/i)).toBeInTheDocument()
        expect(mockOnResult).toHaveBeenCalledWith('Change the eggs benedict to scrambled, add extra bacon')
      })
    })
  })

  describe('Scenario 4: Manager Creating Special Menu Items', () => {
    it('should handle complex ingredient lists', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Special Ingredients" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate complex ingredient list
      const mockEvent = {
        results: [[{
          transcript: 'Organic free-range eggs, artisanal sourdough bread, locally sourced avocado, microgreens, truffle oil, sea salt, cracked black pepper',
          confidence: 0.89
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/organic free-range eggs/i)).toBeInTheDocument()
        expect(mockOnResult).toHaveBeenCalledWith('Organic free-range eggs, artisanal sourdough bread, locally sourced avocado, microgreens, truffle oil, sea salt, cracked black pepper')
      })
    })

    it('should handle dietary restrictions and allergens', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Dietary Information" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate dietary information
      const mockEvent = {
        results: [[{
          transcript: 'Gluten-free, dairy-free, contains nuts, suitable for vegetarians',
          confidence: 0.91
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/gluten-free/i)).toBeInTheDocument()
        expect(mockOnResult).toHaveBeenCalledWith('Gluten-free, dairy-free, contains nuts, suitable for vegetarians')
      })
    })
  })

  describe('Scenario 5: Error Recovery and Edge Cases', () => {
    it('should handle microphone permission denial gracefully', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Test Input" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate permission denied
      mockSpeechRecognition.onerror({ error: 'not-allowed' })

      await waitFor(() => {
        expect(screen.getByText(/microphone access denied/i)).toBeInTheDocument()
      })
    })

    it('should handle network connectivity issues', async () => {
      const mockOnResult = vi.fn()
      
      // Mock DeepSeek API failure
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network Error'))
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Test Input" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      const mockEvent = {
        results: [[{
          transcript: 'Test transcript',
          confidence: 0.8
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      // Should fall back to raw transcript when API fails
      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith('Test transcript')
      })
    })

    it('should handle very long transcriptions', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Long Description" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate very long transcription
      const longTranscript = 'A'.repeat(500)
      const mockEvent = {
        results: [[{
          transcript: longTranscript,
          confidence: 0.85
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(mockOnResult).toHaveBeenCalledWith(longTranscript)
      })
    })
  })

  describe('Scenario 6: Multi-language Support', () => {
    it('should switch between German and English seamlessly', async () => {
      const mockOnResult = vi.fn()
      
      // Test German
      const { rerender } = render(<VoiceInput language="de" onResult={mockOnResult} label="Deutsche Eingabe" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      expect(mockSpeechRecognition.lang).toBe('de-DE')

      // Switch to English
      rerender(<VoiceInput language="en" onResult={mockOnResult} label="English Input" />)
      
      await user.click(startButton)

      expect(mockSpeechRecognition.lang).toBe('en-US')
    })

    it('should handle mixed language content', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Mixed Language" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate mixed language content
      const mockEvent = {
        results: [[{
          transcript: 'Wiener Schnitzel with pommes frites and German potato salad',
          confidence: 0.88
        }]]
      }
      mockSpeechRecognition.onresult(mockEvent)

      await waitFor(() => {
        expect(screen.getByText(/wiener schnitzel/i)).toBeInTheDocument()
        expect(mockOnResult).toHaveBeenCalledWith('Wiener Schnitzel with pommes frites and German potato salad')
      })
    })
  })

  describe('Scenario 7: Accessibility and Usability', () => {
    it('should be fully keyboard accessible', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Accessible Input" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      
      // Test keyboard navigation
      startButton.focus()
      expect(startButton).toHaveFocus()
      
      // Test Enter key
      await user.keyboard('{Enter}')
      expect(mockSpeechRecognition.start).toHaveBeenCalled()
    })

    it('should provide clear visual feedback for all states', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Visual Feedback" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      
      // Initial state
      expect(startButton).toHaveAttribute('aria-pressed', 'false')
      
      // Click to start
      await user.click(startButton)
      
      // Should show processing state
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
    })

    it('should announce status changes to screen readers', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Screen Reader Support" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Should have proper ARIA attributes
      expect(startButton).toHaveAttribute('aria-label', 'Start dictation')
      
      // Should announce processing
      expect(screen.getByRole('status')).toHaveTextContent('Processing...')
    })
  })

  describe('Scenario 8: Performance and Reliability', () => {
    it('should handle rapid start/stop cycles', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="Rapid Cycling" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      
      // Rapid start/stop
      await user.click(startButton)
      await user.click(startButton)
      await user.click(startButton)
      await user.click(startButton)

      // Should handle gracefully without errors
      expect(mockSpeechRecognition.start).toHaveBeenCalled()
      expect(mockSpeechRecognition.abort).toHaveBeenCalled()
    })

    it('should maintain state consistency during errors', async () => {
      const mockOnResult = vi.fn()
      
      render(<VoiceInput language="en" onResult={mockOnResult} label="State Consistency" />)
      
      const startButton = screen.getByRole('button', { name: /start dictation/i })
      await user.click(startButton)

      // Simulate error
      mockSpeechRecognition.onerror({ error: 'audio-capture' })

      await waitFor(() => {
        expect(screen.getByText(/no microphone found/i)).toBeInTheDocument()
      })

      // Should return to ready state
      expect(startButton).toHaveAttribute('aria-pressed', 'false')
    })
  })
}) 