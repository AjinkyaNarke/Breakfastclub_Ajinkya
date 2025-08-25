import { test, expect } from '@playwright/test';

test.describe('Ingredient Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel and login
    await page.goto('/admin');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation to admin dashboard
    await page.waitForURL('/admin/dashboard');
    
    // Navigate to ingredient management
    await page.click('[data-testid="nav-ingredients"]');
    await page.waitForURL('/admin/ingredients');
  });

  test('complete ingredient creation workflow', async ({ page }) => {
    // Click add ingredient button
    await page.click('[data-testid="add-ingredient-button"]');
    
    // Wait for dialog to open
    await page.waitForSelector('[data-testid="ingredient-dialog"]');
    
    // Fill basic information
    await page.fill('[data-testid="ingredient-name-input"]', 'Test Tomato');
    await page.fill('[data-testid="ingredient-description-input"]', 'Fresh organic tomatoes');
    await page.selectOption('[data-testid="ingredient-category-select"]', 'vegetables');
    await page.fill('[data-testid="ingredient-unit-input"]', 'piece');
    await page.fill('[data-testid="ingredient-cost-input"]', '0.50');
    
    // Navigate to translations step
    await page.click('[data-testid="next-step-button"]');
    
    // Verify German translation is auto-generated
    await page.waitForSelector('[data-testid="ingredient-name-de-input"]');
    const germanName = await page.inputValue('[data-testid="ingredient-name-de-input"]');
    expect(germanName).toBeTruthy();
    
    // Navigate to properties step
    await page.click('[data-testid="next-step-button"]');
    
    // Select properties
    await page.check('[data-testid="allergen-gluten"]');
    await page.check('[data-testid="dietary-vegetarian"]');
    await page.check('[data-testid="seasonal-summer"]');
    
    // Save ingredient
    await page.click('[data-testid="save-ingredient-button"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify ingredient appears in list
    await page.waitForSelector('text=Test Tomato');
    expect(await page.isVisible('text=Test Tomato')).toBeTruthy();
  });

  test('ingredient editing workflow', async ({ page }) => {
    // Create a test ingredient first
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-name-input"]', 'Test Ingredient');
    await page.fill('[data-testid="ingredient-description-input"]', 'Test description');
    await page.selectOption('[data-testid="ingredient-category-select"]', 'vegetables');
    await page.click('[data-testid="next-step-button"]');
    await page.click('[data-testid="next-step-button"]');
    await page.click('[data-testid="save-ingredient-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Edit the ingredient
    await page.click('[data-testid="edit-ingredient-button"]');
    await page.waitForSelector('[data-testid="ingredient-dialog"]');
    
    // Modify the name
    await page.fill('[data-testid="ingredient-name-input"]', 'Updated Test Ingredient');
    
    // Save changes
    await page.click('[data-testid="save-ingredient-button"]');
    
    // Verify update
    await page.waitForSelector('[data-testid="success-message"]');
    await page.waitForSelector('text=Updated Test Ingredient');
    expect(await page.isVisible('text=Updated Test Ingredient')).toBeTruthy();
  });

  test('ingredient deletion workflow', async ({ page }) => {
    // Create a test ingredient first
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-name-input"]', 'Delete Test Ingredient');
    await page.fill('[data-testid="ingredient-description-input"]', 'Test description');
    await page.selectOption('[data-testid="ingredient-category-select"]', 'vegetables');
    await page.click('[data-testid="next-step-button"]');
    await page.click('[data-testid="next-step-button"]');
    await page.click('[data-testid="save-ingredient-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Delete the ingredient
    await page.click('[data-testid="delete-ingredient-button"]');
    
    // Confirm deletion
    await page.waitForSelector('[data-testid="confirm-dialog"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verify deletion
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.isVisible('text=Delete Test Ingredient')).toBeFalsy();
  });

  test('bulk voice creation workflow', async ({ page }) => {
    // Navigate to voice input section
    await page.click('[data-testid="voice-input-tab"]');
    
    // Start voice recording
    await page.click('[data-testid="start-recording-button"]');
    
    // Simulate voice input (in real test, this would be actual audio)
    // For now, we'll simulate the transcription result
    await page.evaluate(() => {
      // Simulate Deepgram transcription result
      const event = new CustomEvent('deepgram-transcription', {
        detail: {
          transcript: 'Tomate, Zwiebel, Hähnchen, Milch',
          confidence: 0.95,
          language: 'de'
        }
      });
      window.dispatchEvent(event);
    });
    
    // Wait for transcription processing
    await page.waitForSelector('[data-testid="transcription-result"]');
    
    // Verify ingredients are parsed
    await page.waitForSelector('text=Tomate');
    await page.waitForSelector('text=Zwiebel');
    await page.waitForSelector('text=Hähnchen');
    await page.waitForSelector('text=Milch');
    
    // Review and confirm ingredients
    await page.click('[data-testid="confirm-ingredients-button"]');
    
    // Wait for bulk creation
    await page.waitForSelector('[data-testid="bulk-creation-progress"]');
    
    // Verify all ingredients are created
    await page.waitForSelector('[data-testid="bulk-creation-complete"]');
    expect(await page.isVisible('text=Tomate')).toBeTruthy();
    expect(await page.isVisible('text=Zwiebel')).toBeTruthy();
    expect(await page.isVisible('text=Hähnchen')).toBeTruthy();
    expect(await page.isVisible('text=Milch')).toBeTruthy();
  });

  test('image generation workflow', async ({ page }) => {
    // Create ingredient with image generation
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-name-input"]', 'Beautiful Tomato');
    await page.fill('[data-testid="ingredient-description-input"]', 'A beautiful red tomato');
    await page.selectOption('[data-testid="ingredient-category-select"]', 'vegetables');
    
    // Navigate to image generation step
    await page.click('[data-testid="next-step-button"]');
    await page.click('[data-testid="next-step-button"]');
    
    // Generate image
    await page.click('[data-testid="generate-image-button"]');
    
    // Wait for image generation
    await page.waitForSelector('[data-testid="image-generation-progress"]');
    
    // Wait for image to be generated
    await page.waitForSelector('[data-testid="generated-image"]', { timeout: 30000 });
    
    // Verify image is displayed
    const imageElement = await page.locator('[data-testid="generated-image"]');
    expect(await imageElement.isVisible()).toBeTruthy();
    
    // Save ingredient with image
    await page.click('[data-testid="save-ingredient-button"]');
    
    // Verify ingredient is saved with image
    await page.waitForSelector('[data-testid="success-message"]');
    await page.waitForSelector('text=Beautiful Tomato');
    
    // Verify image is displayed in list
    const listImage = await page.locator('[data-testid="ingredient-image"]').first();
    expect(await listImage.isVisible()).toBeTruthy();
  });

  test('responsive behavior', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile layout
    await page.waitForSelector('[data-testid="mobile-menu-button"]');
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await page.waitForSelector('[data-testid="mobile-menu"]');
    
    // Navigate to ingredients
    await page.click('[data-testid="mobile-ingredients-link"]');
    await page.waitForURL('/admin/ingredients');
    
    // Test ingredient creation on mobile
    await page.click('[data-testid="add-ingredient-button"]');
    await page.waitForSelector('[data-testid="ingredient-dialog"]');
    
    // Verify mobile-friendly form layout
    expect(await page.isVisible('[data-testid="mobile-form-layout"]')).toBeTruthy();
    
    // Fill form on mobile
    await page.fill('[data-testid="ingredient-name-input"]', 'Mobile Test Ingredient');
    await page.fill('[data-testid="ingredient-description-input"]', 'Mobile test description');
    
    // Test mobile navigation between steps
    await page.click('[data-testid="next-step-button"]');
    await page.waitForSelector('[data-testid="translations-step"]');
    
    await page.click('[data-testid="next-step-button"]');
    await page.waitForSelector('[data-testid="properties-step"]');
    
    // Save on mobile
    await page.click('[data-testid="save-ingredient-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Verify tablet layout
    await page.waitForSelector('[data-testid="tablet-layout"]');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Verify desktop layout
    await page.waitForSelector('[data-testid="desktop-layout"]');
  });

  test('search and filtering functionality', async ({ page }) => {
    // Create multiple test ingredients
    const ingredients = ['Apple', 'Banana', 'Carrot', 'Dragon Fruit'];
    
    for (const ingredient of ingredients) {
      await page.click('[data-testid="add-ingredient-button"]');
      await page.fill('[data-testid="ingredient-name-input"]', ingredient);
      await page.fill('[data-testid="ingredient-description-input"]', `Description for ${ingredient}`);
      await page.selectOption('[data-testid="ingredient-category-select"]', 'vegetables');
      await page.click('[data-testid="next-step-button"]');
      await page.click('[data-testid="next-step-button"]');
      await page.click('[data-testid="save-ingredient-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'Apple');
    await page.waitForSelector('text=Apple');
    expect(await page.isVisible('text=Apple')).toBeTruthy();
    expect(await page.isVisible('text=Banana')).toBeFalsy();
    
    // Clear search
    await page.clear('[data-testid="search-input"]');
    await page.waitForSelector('text=Banana');
    
    // Test category filtering
    await page.selectOption('[data-testid="category-filter"]', 'vegetables');
    await page.waitForSelector('text=Apple');
    await page.waitForSelector('text=Banana');
    
    // Test dietary filter
    await page.check('[data-testid="filter-vegetarian"]');
    await page.waitForSelector('[data-testid="filtered-results"]');
    
    // Test allergen filter
    await page.check('[data-testid="filter-gluten-free"]');
    await page.waitForSelector('[data-testid="filtered-results"]');
  });

  test('error handling and validation', async ({ page }) => {
    // Test required field validation
    await page.click('[data-testid="add-ingredient-button"]');
    await page.click('[data-testid="save-ingredient-button"]');
    
    // Verify validation errors
    await page.waitForSelector('[data-testid="validation-error"]');
    expect(await page.isVisible('text=Name is required')).toBeTruthy();
    
    // Test invalid cost input
    await page.fill('[data-testid="ingredient-name-input"]', 'Test Ingredient');
    await page.fill('[data-testid="ingredient-cost-input"]', 'invalid-cost');
    await page.click('[data-testid="save-ingredient-button"]');
    
    await page.waitForSelector('[data-testid="validation-error"]');
    expect(await page.isVisible('text=Cost must be a valid number')).toBeTruthy();
    
    // Test network error handling
    await page.route('**/api/ingredients', route => {
      route.abort('failed');
    });
    
    await page.fill('[data-testid="ingredient-cost-input"]', '1.50');
    await page.click('[data-testid="save-ingredient-button"]');
    
    await page.waitForSelector('[data-testid="error-message"]');
    expect(await page.isVisible('text=Failed to save ingredient')).toBeTruthy();
    
    // Restore network
    await page.unroute('**/api/ingredients');
  });

  test('accessibility compliance', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Should open add ingredient dialog
    
    await page.waitForSelector('[data-testid="ingredient-dialog"]');
    
    // Test form navigation with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard Test Ingredient');
    
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard test description');
    
    // Test screen reader compatibility
    const nameLabel = await page.locator('[data-testid="ingredient-name-input"]');
    expect(await nameLabel.getAttribute('aria-label')).toBeTruthy();
    
    // Test focus indicators
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.isVisible()).toBeTruthy();
    
    // Test color contrast (basic check)
    const textElement = await page.locator('[data-testid="ingredient-name-input"]');
    const color = await textElement.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.color;
    });
    expect(color).toBeTruthy();
  });
}); 