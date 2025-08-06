import { test, expect } from '@playwright/test';

test.describe('Voice Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel and login
    await page.goto('/admin');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation to admin dashboard
    await page.waitForURL('/admin/dashboard');
    
    // Navigate to voice input section
    await page.click('[data-testid="nav-voice-input"]');
    await page.waitForURL('/admin/voice-input');
  });

  test('complete voice input workflow', async ({ page }) => {
    // Start voice recording
    await page.click('[data-testid="start-recording-button"]');
    
    // Wait for recording to start
    await page.waitForSelector('[data-testid="recording-indicator"]');
    
    // Simulate voice input (in real test, this would be actual audio)
    await page.evaluate(() => {
      // Simulate Deepgram transcription result
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Tomate, 1 Stück, 0.50 Euro',
          confidence: 0.95,
          language: 'de'
        }
      });
      window.dispatchEvent(event);
    });
    
    // Wait for transcription processing
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Verify transcription is displayed
    const transcriptText = await page.textContent('[data-testid="transcription-text"]');
    expect(transcriptText).toContain('Tomate');
    
    // Verify confidence score
    const confidenceScore = await page.textContent('[data-testid="confidence-score"]');
    expect(confidenceScore).toContain('95%');
    
    // Verify language detection
    const detectedLanguage = await page.textContent('[data-testid="detected-language"]');
    expect(detectedLanguage).toContain('German');
    
    // Stop recording
    await page.click('[data-testid="stop-recording-button"]');
    
    // Wait for processing to complete
    await page.waitForSelector('[data-testid="processing-complete"]');
  });

  test('transcription accuracy', async ({ page }) => {
    // Test German transcription
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Bio-Hähnchenbrust, 500 Gramm, 8.50 Euro, glutenfrei',
          confidence: 0.92,
          language: 'de'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Verify complex German text is transcribed correctly
    const transcriptText = await page.textContent('[data-testid="transcription-text"]');
    expect(transcriptText).toContain('Bio-Hähnchenbrust');
    expect(transcriptText).toContain('500 Gramm');
    expect(transcriptText).toContain('8.50 Euro');
    expect(transcriptText).toContain('glutenfrei');
    
    // Test English transcription
    await page.click('[data-testid="language-toggle"]'); // Switch to English
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Organic chicken breast, 500 grams, 8.50 euros, gluten free',
          confidence: 0.94,
          language: 'en'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Verify English text is transcribed correctly
    const englishTranscript = await page.textContent('[data-testid="transcription-text"]');
    expect(englishTranscript).toContain('Organic chicken breast');
    expect(englishTranscript).toContain('500 grams');
    expect(englishTranscript).toContain('8.50 euros');
    expect(englishTranscript).toContain('gluten free');
  });

  test('ingredient extraction accuracy', async ({ page }) => {
    // Test single ingredient extraction
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Tomate, 1 Stück, 0.50 Euro',
          confidence: 0.95,
          language: 'de'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Verify ingredient extraction
    await page.waitForSelector('[data-testid="extracted-ingredient"]');
    const ingredientName = await page.textContent('[data-testid="ingredient-name"]');
    const ingredientQuantity = await page.textContent('[data-testid="ingredient-quantity"]');
    const ingredientPrice = await page.textContent('[data-testid="ingredient-price"]');
    
    expect(ingredientName).toBe('Tomate');
    expect(ingredientQuantity).toBe('1 Stück');
    expect(ingredientPrice).toBe('0.50 Euro');
    
    // Test multiple ingredient extraction
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Tomate, Zwiebel, Hähnchen, Milch',
          confidence: 0.90,
          language: 'de'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Verify multiple ingredients are extracted
    const extractedIngredients = await page.locator('[data-testid="extracted-ingredient"]');
    expect(await extractedIngredients.count()).toBe(4);
    
    // Verify each ingredient
    expect(await page.textContent('[data-testid="ingredient-0"]')).toBe('Tomate');
    expect(await page.textContent('[data-testid="ingredient-1"]')).toBe('Zwiebel');
    expect(await page.textContent('[data-testid="ingredient-2"]')).toBe('Hähnchen');
    expect(await page.textContent('[data-testid="ingredient-3"]')).toBe('Milch');
  });

  test('bulk creation workflow', async ({ page }) => {
    // Start bulk voice creation
    await page.click('[data-testid="bulk-creation-tab"]');
    await page.click('[data-testid="start-recording-button"]');
    
    // Simulate bulk ingredient list
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Tomate, Zwiebel, Hähnchen, Milch, Brot, Käse',
          confidence: 0.88,
          language: 'de'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Review extracted ingredients
    await page.waitForSelector('[data-testid="bulk-ingredients-list"]');
    const ingredients = await page.locator('[data-testid="extracted-ingredient"]');
    expect(await ingredients.count()).toBe(6);
    
    // Edit individual ingredients
    await page.click('[data-testid="edit-ingredient-0"]');
    await page.fill('[data-testid="edit-name-input"]', 'Rote Tomate');
    await page.click('[data-testid="save-edit-button"]');
    
    // Remove an ingredient
    await page.click('[data-testid="remove-ingredient-2"]'); // Remove Hähnchen
    
    // Verify ingredient count is updated
    const updatedIngredients = await page.locator('[data-testid="extracted-ingredient"]');
    expect(await updatedIngredients.count()).toBe(5);
    
    // Confirm and create ingredients
    await page.click('[data-testid="confirm-ingredients-button"]');
    
    // Wait for bulk creation process
    await page.waitForSelector('[data-testid="bulk-creation-progress"]');
    
    // Wait for completion
    await page.waitForSelector('[data-testid="bulk-creation-complete"]');
    
    // Verify success message
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.isVisible('text=5 ingredients created successfully')).toBeTruthy();
  });

  test('error recovery workflow', async ({ page }) => {
    // Test microphone permission denied
    await page.route('**/api/microphone-permission', route => {
      route.fulfill({ status: 403, body: 'Permission denied' });
    });
    
    await page.click('[data-testid="start-recording-button"]');
    
    await page.waitForSelector('[data-testid="error-message"]');
    expect(await page.isVisible('text=Microphone access denied')).toBeTruthy();
    
    // Test network connection failure
    await page.route('**/api/voice-transcription', route => {
      route.abort('failed');
    });
    
    await page.click('[data-testid="start-recording-button"]');
    
    await page.waitForSelector('[data-testid="error-message"]');
    expect(await page.isVisible('text=Connection failed')).toBeTruthy();
    
    // Test low confidence transcription
    await page.unroute('**/api/voice-transcription');
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Unclear ingredient name',
          confidence: 0.45,
          language: 'de'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="low-confidence-warning"]');
    expect(await page.isVisible('text=Low confidence transcription')).toBeTruthy();
    
    // Test manual correction
    await page.click('[data-testid="manual-correction-button"]');
    await page.fill('[data-testid="manual-transcript-input"]', 'Tomate, 1 Stück, 0.50 Euro');
    await page.click('[data-testid="apply-correction-button"]');
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    const correctedText = await page.textContent('[data-testid="transcription-text"]');
    expect(correctedText).toContain('Tomate');
  });

  test('mobile compatibility', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile layout
    await page.waitForSelector('[data-testid="mobile-voice-interface"]');
    
    // Test touch interactions
    await page.touchscreen.tap('[data-testid="start-recording-button"]');
    await page.waitForSelector('[data-testid="recording-indicator"]');
    
    // Simulate voice input on mobile
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Mobile Test Ingredient',
          confidence: 0.90,
          language: 'en'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Test mobile-specific controls
    await page.touchscreen.tap('[data-testid="mobile-stop-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]');
    
    // Test mobile gesture support
    await page.touchscreen.swipe('[data-testid="voice-history"]', 0, -100);
    await page.waitForSelector('[data-testid="voice-history-item"]');
    
    // Test mobile keyboard input
    await page.touchscreen.tap('[data-testid="manual-input-button"]');
    await page.fill('[data-testid="mobile-manual-input"]', 'Manual mobile input');
    await page.touchscreen.tap('[data-testid="mobile-submit-button"]');
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    const manualText = await page.textContent('[data-testid="transcription-text"]');
    expect(manualText).toContain('Manual mobile input');
  });

  test('voice input with different accents', async ({ page }) => {
    // Test German accent
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Tomatä, ein Stück, fünfzig Cent',
          confidence: 0.85,
          language: 'de',
          accent: 'bavarian'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Verify accent handling
    const transcriptText = await page.textContent('[data-testid="transcription-text"]');
    expect(transcriptText).toContain('Tomatä');
    
    // Test English accent
    await page.click('[data-testid="language-toggle"]');
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Tomayto, one piece, fifty cents',
          confidence: 0.87,
          language: 'en',
          accent: 'british'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    const englishTranscript = await page.textContent('[data-testid="transcription-text"]');
    expect(englishTranscript).toContain('Tomayto');
  });

  test('voice input with background noise', async ({ page }) => {
    // Test noisy environment
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Tomate... [background noise] ... 1 Stück... [noise] ... 0.50 Euro',
          confidence: 0.75,
          language: 'de',
          noiseLevel: 'high'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Verify noise handling
    await page.waitForSelector('[data-testid="noise-warning"]');
    expect(await page.isVisible('text=Background noise detected')).toBeTruthy();
    
    // Verify partial transcription is still processed
    const transcriptText = await page.textContent('[data-testid="transcription-text"]');
    expect(transcriptText).toContain('Tomate');
    expect(transcriptText).toContain('1 Stück');
    expect(transcriptText).toContain('0.50 Euro');
  });

  test('voice input history and playback', async ({ page }) => {
    // Create multiple voice inputs
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="start-recording-button"]');
      
      await page.evaluate((index) => {
        const event = new CustomEvent('deepgram-transcription', {
          detail: {
            transcript: `Test Ingredient ${index + 1}`,
            confidence: 0.90,
            language: 'en',
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(event);
      }, i);
      
      await page.waitForSelector('[data-testid="transcription-result"]');
      await page.click('[data-testid="stop-recording-button"]');
    }
    
    // Access voice history
    await page.click('[data-testid="voice-history-button"]');
    await page.waitForSelector('[data-testid="voice-history-panel"]');
    
    // Verify history items
    const historyItems = await page.locator('[data-testid="voice-history-item"]');
    expect(await historyItems.count()).toBe(3);
    
    // Test playback functionality
    await page.click('[data-testid="play-history-item-0"]');
    await page.waitForSelector('[data-testid="playback-active"]');
    
    // Test history search
    await page.fill('[data-testid="history-search-input"]', 'Test Ingredient 1');
    await page.waitForSelector('[data-testid="filtered-history-item"]');
    expect(await page.locator('[data-testid="filtered-history-item"]').count()).toBe(1);
    
    // Test history deletion
    await page.click('[data-testid="delete-history-item-0"]');
    await page.waitForSelector('[data-testid="confirm-delete-history"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verify item is deleted
    const updatedHistoryItems = await page.locator('[data-testid="voice-history-item"]');
    expect(await updatedHistoryItems.count()).toBe(2);
  });

  test('voice input settings and preferences', async ({ page }) => {
    // Access voice settings
    await page.click('[data-testid="voice-settings-button"]');
    await page.waitForSelector('[data-testid="voice-settings-panel"]');
    
    // Test language preference
    await page.selectOption('[data-testid="preferred-language-select"]', 'de');
    await page.click('[data-testid="save-settings-button"]');
    await page.waitForSelector('[data-testid="settings-saved"]');
    
    // Test confidence threshold
    await page.fill('[data-testid="confidence-threshold-input"]', '0.80');
    await page.click('[data-testid="save-settings-button"]');
    
    // Test auto-translation toggle
    await page.check('[data-testid="auto-translate-checkbox"]');
    await page.click('[data-testid="save-settings-button"]');
    
    // Test voice input sensitivity
    await page.selectOption('[data-testid="sensitivity-select"]', 'high');
    await page.click('[data-testid="save-settings-button"]');
    
    // Verify settings are applied
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Test with new settings',
          confidence: 0.75,
          language: 'de'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Verify German language is used
    const detectedLanguage = await page.textContent('[data-testid="detected-language"]');
    expect(detectedLanguage).toContain('German');
  });

  test('accessibility compliance for voice input', async ({ page }) => {
    // Test keyboard navigation for voice input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Should start recording
    
    await page.waitForSelector('[data-testid="recording-indicator"]');
    
    // Test screen reader announcements
    const recordingAnnouncement = await page.locator('[data-testid="recording-announcement"]');
    expect(await recordingAnnouncement.getAttribute('aria-live')).toBe('polite');
    
    // Test focus management
    await page.keyboard.press('Escape'); // Should stop recording
    await page.waitForSelector('[data-testid="recording-stopped"]');
    
    // Test ARIA labels
    const recordButton = await page.locator('[data-testid="start-recording-button"]');
    expect(await recordButton.getAttribute('aria-label')).toBeTruthy();
    
    // Test voice input status announcements
    const statusAnnouncement = await page.locator('[data-testid="voice-status"]');
    expect(await statusAnnouncement.getAttribute('aria-live')).toBe('assertive');
    
    // Test error message accessibility
    await page.click('[data-testid="start-recording-button"]');
    
    await page.evaluate(() => {
      const event = new CustomEvent('voice-error', {
        detail: {
          error: 'Microphone not available',
          severity: 'error'
        }
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForSelector('[data-testid="error-message"]');
    const errorMessage = await page.locator('[data-testid="error-message"]');
    expect(await errorMessage.getAttribute('role')).toBe('alert');
  });
}); 