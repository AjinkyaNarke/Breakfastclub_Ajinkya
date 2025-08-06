import { test, expect } from '@playwright/test';

test.describe('Prep Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel and login
    await page.goto('/admin');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation to admin dashboard
    await page.waitForURL('/admin/dashboard');
    
    // Navigate to prep management
    await page.click('[data-testid="nav-preps"]');
    await page.waitForURL('/admin/preps');
  });

  test('complete prep creation workflow', async ({ page }) => {
    // Click add prep button
    await page.click('[data-testid="add-prep-button"]');
    
    // Wait for dialog to open
    await page.waitForSelector('[data-testid="prep-dialog"]');
    
    // Fill basic information
    await page.fill('[data-testid="prep-name-input"]', 'Test Sauce');
    await page.fill('[data-testid="prep-description-input"]', 'A delicious tomato sauce made with fresh ingredients');
    await page.fill('[data-testid="batch-yield-input"]', '2');
    await page.selectOption('[data-testid="batch-yield-unit-select"]', 'liters');
    
    // Save prep
    await page.click('[data-testid="save-prep-button"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify prep appears in list
    await page.waitForSelector('text=Test Sauce');
    expect(await page.isVisible('text=Test Sauce')).toBeTruthy();
  });

  test('ingredient selection workflow', async ({ page }) => {
    // Create a test prep first
    await page.click('[data-testid="add-prep-button"]');
    await page.fill('[data-testid="prep-name-input"]', 'Test Prep');
    await page.fill('[data-testid="prep-description-input"]', 'Test description');
    await page.fill('[data-testid="batch-yield-input"]', '1');
    await page.selectOption('[data-testid="batch-yield-unit-select"]', 'kg');
    await page.click('[data-testid="save-prep-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Edit the prep to add ingredients
    await page.click('[data-testid="edit-prep-button"]');
    await page.waitForSelector('[data-testid="prep-dialog"]');
    
    // Add ingredients
    await page.click('[data-testid="add-ingredient-button"]');
    await page.waitForSelector('[data-testid="ingredient-selector"]');
    
    // Select ingredients
    await page.click('[data-testid="ingredient-tomato"]');
    await page.fill('[data-testid="quantity-input"]', '500');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-prep"]');
    
    await page.click('[data-testid="ingredient-onion"]');
    await page.fill('[data-testid="quantity-input"]', '100');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-prep"]');
    
    // Verify ingredients are added
    await page.waitForSelector('text=Tomato');
    await page.waitForSelector('text=Onion');
    
    // Save prep with ingredients
    await page.click('[data-testid="save-prep-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify prep has ingredients
    await page.waitForSelector('text=Test Prep');
    await page.click('[data-testid="view-prep-details"]');
    await page.waitForSelector('text=Tomato');
    await page.waitForSelector('text=Onion');
  });

  test('cost calculation workflow', async ({ page }) => {
    // Create a test prep with ingredients
    await page.click('[data-testid="add-prep-button"]');
    await page.fill('[data-testid="prep-name-input"]', 'Cost Test Prep');
    await page.fill('[data-testid="prep-description-input"]', 'Test description');
    await page.fill('[data-testid="batch-yield-input"]', '1');
    await page.selectOption('[data-testid="batch-yield-unit-select"]', 'kg');
    
    // Add ingredients with known costs
    await page.click('[data-testid="add-ingredient-button"]');
    await page.click('[data-testid="ingredient-tomato"]');
    await page.fill('[data-testid="quantity-input"]', '500');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-prep"]');
    
    await page.click('[data-testid="ingredient-onion"]');
    await page.fill('[data-testid="quantity-input"]', '100');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-prep"]');
    
    // Verify cost calculation
    await page.waitForSelector('[data-testid="total-cost"]');
    const totalCost = await page.textContent('[data-testid="total-cost"]');
    expect(totalCost).toMatch(/\d+\.\d{2}/); // Should show a cost value
    
    // Verify cost per unit
    await page.waitForSelector('[data-testid="cost-per-unit"]');
    const costPerUnit = await page.textContent('[data-testid="cost-per-unit"]');
    expect(costPerUnit).toMatch(/\d+\.\d{2}/); // Should show a cost per unit value
    
    // Save prep
    await page.click('[data-testid="save-prep-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
  });

  test('AI suggestion workflow', async ({ page }) => {
    // Create a test prep
    await page.click('[data-testid="add-prep-button"]');
    await page.fill('[data-testid="prep-name-input"]', 'AI Test Prep');
    await page.fill('[data-testid="prep-description-input"]', 'A delicious tomato sauce with herbs and spices');
    await page.fill('[data-testid="batch-yield-input"]', '2');
    await page.selectOption('[data-testid="batch-yield-unit-select"]', 'liters');
    
    // Trigger AI suggestion
    await page.click('[data-testid="ai-suggestion-button"]');
    
    // Wait for AI analysis
    await page.waitForSelector('[data-testid="ai-analysis-progress"]');
    
    // Wait for suggestions
    await page.waitForSelector('[data-testid="ai-suggestions"]');
    
    // Verify suggestions are displayed
    const suggestions = await page.locator('[data-testid="suggested-ingredient"]');
    expect(await suggestions.count()).toBeGreaterThan(0);
    
    // Accept some suggestions
    await page.click('[data-testid="accept-suggestion-tomato"]');
    await page.click('[data-testid="accept-suggestion-onion"]');
    await page.click('[data-testid="accept-suggestion-garlic"]');
    
    // Verify accepted ingredients are added
    await page.waitForSelector('text=Tomato');
    await page.waitForSelector('text=Onion');
    await page.waitForSelector('text=Garlic');
    
    // Reject some suggestions
    await page.click('[data-testid="reject-suggestion-cilantro"]');
    
    // Verify rejected ingredient is not added
    expect(await page.isVisible('text=Cilantro')).toBeFalsy();
    
    // Save prep with AI suggestions
    await page.click('[data-testid="save-prep-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
  });

  test('batch yield management', async ({ page }) => {
    // Create a test prep
    await page.click('[data-testid="add-prep-button"]');
    await page.fill('[data-testid="prep-name-input"]', 'Batch Test Prep');
    await page.fill('[data-testid="prep-description-input"]', 'Test description');
    await page.fill('[data-testid="batch-yield-input"]', '1');
    await page.selectOption('[data-testid="batch-yield-unit-select"]', 'kg');
    
    // Add ingredients
    await page.click('[data-testid="add-ingredient-button"]');
    await page.click('[data-testid="ingredient-tomato"]');
    await page.fill('[data-testid="quantity-input"]', '500');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-prep"]');
    
    // Change batch yield
    await page.fill('[data-testid="batch-yield-input"]', '2');
    
    // Verify quantities are adjusted proportionally
    const adjustedQuantity = await page.inputValue('[data-testid="quantity-input"]');
    expect(adjustedQuantity).toBe('1000'); // Should double from 500 to 1000
    
    // Change batch yield unit
    await page.selectOption('[data-testid="batch-yield-unit-select"]', 'liters');
    
    // Verify unit conversion is handled
    await page.waitForSelector('[data-testid="unit-conversion-notice"]');
    
    // Save prep
    await page.click('[data-testid="save-prep-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
  });

  test('responsive behavior', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify mobile layout
    await page.waitForSelector('[data-testid="mobile-menu-button"]');
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await page.waitForSelector('[data-testid="mobile-menu"]');
    
    // Navigate to preps
    await page.click('[data-testid="mobile-preps-link"]');
    await page.waitForURL('/admin/preps');
    
    // Test prep creation on mobile
    await page.click('[data-testid="add-prep-button"]');
    await page.waitForSelector('[data-testid="prep-dialog"]');
    
    // Verify mobile-friendly form layout
    expect(await page.isVisible('[data-testid="mobile-form-layout"]')).toBeTruthy();
    
    // Fill form on mobile
    await page.fill('[data-testid="prep-name-input"]', 'Mobile Test Prep');
    await page.fill('[data-testid="prep-description-input"]', 'Mobile test description');
    await page.fill('[data-testid="batch-yield-input"]', '1');
    await page.selectOption('[data-testid="batch-yield-unit-select"]', 'kg');
    
    // Test ingredient selection on mobile
    await page.click('[data-testid="add-ingredient-button"]');
    await page.waitForSelector('[data-testid="mobile-ingredient-selector"]');
    
    // Select ingredient on mobile
    await page.click('[data-testid="ingredient-tomato"]');
    await page.fill('[data-testid="quantity-input"]', '500');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-prep"]');
    
    // Save on mobile
    await page.click('[data-testid="save-prep-button"]');
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

  test('prep editing workflow', async ({ page }) => {
    // Create a test prep first
    await page.click('[data-testid="add-prep-button"]');
    await page.fill('[data-testid="prep-name-input"]', 'Edit Test Prep');
    await page.fill('[data-testid="prep-description-input"]', 'Test description');
    await page.fill('[data-testid="batch-yield-input"]', '1');
    await page.selectOption('[data-testid="batch-yield-unit-select"]', 'kg');
    await page.click('[data-testid="save-prep-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Edit the prep
    await page.click('[data-testid="edit-prep-button"]');
    await page.waitForSelector('[data-testid="prep-dialog"]');
    
    // Modify the name
    await page.fill('[data-testid="prep-name-input"]', 'Updated Edit Test Prep');
    
    // Add an ingredient
    await page.click('[data-testid="add-ingredient-button"]');
    await page.click('[data-testid="ingredient-tomato"]');
    await page.fill('[data-testid="quantity-input"]', '500');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-prep"]');
    
    // Save changes
    await page.click('[data-testid="save-prep-button"]');
    
    // Verify update
    await page.waitForSelector('[data-testid="success-message"]');
    await page.waitForSelector('text=Updated Edit Test Prep');
    expect(await page.isVisible('text=Updated Edit Test Prep')).toBeTruthy();
  });

  test('prep deletion workflow', async ({ page }) => {
    // Create a test prep first
    await page.click('[data-testid="add-prep-button"]');
    await page.fill('[data-testid="prep-name-input"]', 'Delete Test Prep');
    await page.fill('[data-testid="prep-description-input"]', 'Test description');
    await page.fill('[data-testid="batch-yield-input"]', '1');
    await page.selectOption('[data-testid="batch-yield-unit-select"]', 'kg');
    await page.click('[data-testid="save-prep-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Delete the prep
    await page.click('[data-testid="delete-prep-button"]');
    
    // Confirm deletion
    await page.waitForSelector('[data-testid="confirm-dialog"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verify deletion
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.isVisible('text=Delete Test Prep')).toBeFalsy();
  });

  test('search and filtering functionality', async ({ page }) => {
    // Create multiple test preps
    const preps = ['Sauce', 'Marinade', 'Dressing', 'Garnish'];
    
    for (const prep of preps) {
      await page.click('[data-testid="add-prep-button"]');
      await page.fill('[data-testid="prep-name-input"]', `Test ${prep}`);
      await page.fill('[data-testid="prep-description-input"]', `Description for ${prep}`);
      await page.fill('[data-testid="batch-yield-input"]', '1');
      await page.selectOption('[data-testid="batch-yield-unit-select"]', 'kg');
      await page.click('[data-testid="save-prep-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'Sauce');
    await page.waitForSelector('text=Test Sauce');
    expect(await page.isVisible('text=Test Sauce')).toBeTruthy();
    expect(await page.isVisible('text=Test Marinade')).toBeFalsy();
    
    // Clear search
    await page.clear('[data-testid="search-input"]');
    await page.waitForSelector('text=Test Marinade');
    
    // Test yield unit filtering
    await page.selectOption('[data-testid="yield-unit-filter"]', 'kg');
    await page.waitForSelector('text=Test Sauce');
    await page.waitForSelector('text=Test Marinade');
    
    // Test cost range filtering
    await page.fill('[data-testid="min-cost-filter"]', '0');
    await page.fill('[data-testid="max-cost-filter"]', '10');
    await page.click('[data-testid="apply-cost-filter"]');
    await page.waitForSelector('[data-testid="filtered-results"]');
  });

  test('error handling and validation', async ({ page }) => {
    // Test required field validation
    await page.click('[data-testid="add-prep-button"]');
    await page.click('[data-testid="save-prep-button"]');
    
    // Verify validation errors
    await page.waitForSelector('[data-testid="validation-error"]');
    expect(await page.isVisible('text=Name is required')).toBeTruthy();
    
    // Test invalid batch yield input
    await page.fill('[data-testid="prep-name-input"]', 'Test Prep');
    await page.fill('[data-testid="batch-yield-input"]', 'invalid-yield');
    await page.click('[data-testid="save-prep-button"]');
    
    await page.waitForSelector('[data-testid="validation-error"]');
    expect(await page.isVisible('text=Batch yield must be a valid number')).toBeTruthy();
    
    // Test negative batch yield
    await page.fill('[data-testid="batch-yield-input"]', '-1');
    await page.click('[data-testid="save-prep-button"]');
    
    await page.waitForSelector('[data-testid="validation-error"]');
    expect(await page.isVisible('text=Batch yield must be positive')).toBeTruthy();
    
    // Test network error handling
    await page.route('**/api/preps', route => {
      route.abort('failed');
    });
    
    await page.fill('[data-testid="batch-yield-input"]', '1');
    await page.click('[data-testid="save-prep-button"]');
    
    await page.waitForSelector('[data-testid="error-message"]');
    expect(await page.isVisible('text=Failed to save prep')).toBeTruthy();
    
    // Restore network
    await page.unroute('**/api/preps');
  });

  test('accessibility compliance', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Should open add prep dialog
    
    await page.waitForSelector('[data-testid="prep-dialog"]');
    
    // Test form navigation with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard Test Prep');
    
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard test description');
    
    // Test screen reader compatibility
    const nameLabel = await page.locator('[data-testid="prep-name-input"]');
    expect(await nameLabel.getAttribute('aria-label')).toBeTruthy();
    
    // Test focus indicators
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.isVisible()).toBeTruthy();
    
    // Test ARIA labels for ingredient selection
    const ingredientSelector = await page.locator('[data-testid="ingredient-selector"]');
    expect(await ingredientSelector.getAttribute('aria-label')).toBeTruthy();
  });
}); 