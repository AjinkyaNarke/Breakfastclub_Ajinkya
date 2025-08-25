import { test, expect } from '@playwright/test';

test.describe('Menu Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel and login
    await page.goto('/admin');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation to admin dashboard
    await page.waitForURL('/admin/dashboard');
    
    // Navigate to menu management
    await page.click('[data-testid="nav-menu"]');
    await page.waitForURL('/admin/menu');
  });

  test('complete menu item creation workflow', async ({ page }) => {
    // Click add menu item button
    await page.click('[data-testid="add-menu-item-button"]');
    
    // Wait for dialog to open
    await page.waitForSelector('[data-testid="menu-item-dialog"]');
    
    // Fill basic information
    await page.fill('[data-testid="menu-item-name-input"]', 'Test Burger');
    await page.fill('[data-testid="menu-item-description-input"]', 'Delicious burger with fresh ingredients');
    await page.selectOption('[data-testid="menu-category-select"]', 'main-dishes');
    
    // Set pricing
    await page.fill('[data-testid="regular-price-input"]', '12.50');
    await page.fill('[data-testid="student-price-input"]', '10.00');
    
    // Save menu item
    await page.click('[data-testid="save-menu-item-button"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify menu item appears in list
    await page.waitForSelector('text=Test Burger');
    expect(await page.isVisible('text=Test Burger')).toBeTruthy();
  });

  test('ingredient/prep selection workflow', async ({ page }) => {
    // Create a test menu item first
    await page.click('[data-testid="add-menu-item-button"]');
    await page.fill('[data-testid="menu-item-name-input"]', 'Test Menu Item');
    await page.fill('[data-testid="menu-item-description-input"]', 'Test description');
    await page.selectOption('[data-testid="menu-category-select"]', 'main-dishes');
    await page.fill('[data-testid="regular-price-input"]', '10.00');
    await page.click('[data-testid="save-menu-item-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Edit the menu item to add components
    await page.click('[data-testid="edit-menu-item-button"]');
    await page.waitForSelector('[data-testid="menu-item-dialog"]');
    
    // Add ingredients
    await page.click('[data-testid="add-ingredient-button"]');
    await page.waitForSelector('[data-testid="ingredient-selector"]');
    
    // Select ingredients
    await page.click('[data-testid="ingredient-tomato"]');
    await page.fill('[data-testid="quantity-input"]', '50');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-menu-item"]');
    
    await page.click('[data-testid="ingredient-lettuce"]');
    await page.fill('[data-testid="quantity-input"]', '30');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-menu-item"]');
    
    // Add preps
    await page.click('[data-testid="add-prep-button"]');
    await page.waitForSelector('[data-testid="prep-selector"]');
    
    // Select preps
    await page.click('[data-testid="prep-sauce"]');
    await page.fill('[data-testid="quantity-input"]', '20');
    await page.selectOption('[data-testid="unit-select"]', 'ml');
    await page.click('[data-testid="add-prep-to-menu-item"]');
    
    // Verify components are added
    await page.waitForSelector('text=Tomato');
    await page.waitForSelector('text=Lettuce');
    await page.waitForSelector('text=Sauce');
    
    // Save menu item with components
    await page.click('[data-testid="save-menu-item-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify menu item has components
    await page.waitForSelector('text=Test Menu Item');
    await page.click('[data-testid="view-menu-item-details"]');
    await page.waitForSelector('text=Tomato');
    await page.waitForSelector('text=Lettuce');
    await page.waitForSelector('text=Sauce');
  });

  test('pricing management workflow', async ({ page }) => {
    // Create a test menu item
    await page.click('[data-testid="add-menu-item-button"]');
    await page.fill('[data-testid="menu-item-name-input"]', 'Pricing Test Item');
    await page.fill('[data-testid="menu-item-description-input"]', 'Test description');
    await page.selectOption('[data-testid="menu-category-select"]', 'main-dishes');
    
    // Set initial pricing
    await page.fill('[data-testid="regular-price-input"]', '15.00');
    await page.fill('[data-testid="student-price-input"]', '12.00');
    
    // Add components to calculate cost
    await page.click('[data-testid="add-ingredient-button"]');
    await page.click('[data-testid="ingredient-tomato"]');
    await page.fill('[data-testid="quantity-input"]', '100');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-menu-item"]');
    
    // Verify cost calculation
    await page.waitForSelector('[data-testid="total-cost"]');
    const totalCost = await page.textContent('[data-testid="total-cost"]');
    expect(totalCost).toMatch(/\d+\.\d{2}/); // Should show a cost value
    
    // Verify profit margin calculation
    await page.waitForSelector('[data-testid="profit-margin"]');
    const profitMargin = await page.textContent('[data-testid="profit-margin"]');
    expect(profitMargin).toMatch(/\d+\.\d{1,2}%/); // Should show a percentage
    
    // Test price validation
    await page.fill('[data-testid="regular-price-input"]', '5.00'); // Lower than cost
    await page.waitForSelector('[data-testid="price-warning"]');
    expect(await page.isVisible('text=Price is below cost')).toBeTruthy();
    
    // Set valid price
    await page.fill('[data-testid="regular-price-input"]', '20.00');
    await page.waitForSelector('[data-testid="price-ok"]');
    
    // Save menu item
    await page.click('[data-testid="save-menu-item-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
  });

  test('category assignment workflow', async ({ page }) => {
    // Create a test menu item
    await page.click('[data-testid="add-menu-item-button"]');
    await page.fill('[data-testid="menu-item-name-input"]', 'Category Test Item');
    await page.fill('[data-testid="menu-item-description-input"]', 'Test description');
    await page.fill('[data-testid="regular-price-input"]', '10.00');
    
    // Test category assignment
    await page.selectOption('[data-testid="menu-category-select"]', 'appetizers');
    await page.waitForSelector('[data-testid="category-appetizers"]');
    
    // Change category
    await page.selectOption('[data-testid="menu-category-select"]', 'desserts');
    await page.waitForSelector('[data-testid="category-desserts"]');
    
    // Test display order
    await page.fill('[data-testid="display-order-input"]', '5');
    
    // Test featured item setting
    await page.check('[data-testid="featured-item-checkbox"]');
    
    // Test availability toggle
    await page.check('[data-testid="available-checkbox"]');
    
    // Save menu item
    await page.click('[data-testid="save-menu-item-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify category assignment
    await page.waitForSelector('text=Category Test Item');
    await page.waitForSelector('[data-testid="category-desserts"]');
    await page.waitForSelector('[data-testid="featured-badge"]');
  });

  test('image generation workflow', async ({ page }) => {
    // Create menu item with image generation
    await page.click('[data-testid="add-menu-item-button"]');
    await page.fill('[data-testid="menu-item-name-input"]', 'Beautiful Burger');
    await page.fill('[data-testid="menu-item-description-input"]', 'A beautiful and delicious burger');
    await page.selectOption('[data-testid="menu-category-select"]', 'main-dishes');
    await page.fill('[data-testid="regular-price-input"]', '15.00');
    
    // Generate image
    await page.click('[data-testid="generate-image-button"]');
    
    // Wait for image generation
    await page.waitForSelector('[data-testid="image-generation-progress"]');
    
    // Wait for image to be generated
    await page.waitForSelector('[data-testid="generated-image"]', { timeout: 30000 });
    
    // Verify image is displayed
    const imageElement = await page.locator('[data-testid="generated-image"]');
    expect(await imageElement.isVisible()).toBeTruthy();
    
    // Save menu item with image
    await page.click('[data-testid="save-menu-item-button"]');
    
    // Verify menu item is saved with image
    await page.waitForSelector('[data-testid="success-message"]');
    await page.waitForSelector('text=Beautiful Burger');
    
    // Verify image is displayed in list
    const listImage = await page.locator('[data-testid="menu-item-image"]').first();
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
    
    // Navigate to menu
    await page.click('[data-testid="mobile-menu-link"]');
    await page.waitForURL('/admin/menu');
    
    // Test menu item creation on mobile
    await page.click('[data-testid="add-menu-item-button"]');
    await page.waitForSelector('[data-testid="menu-item-dialog"]');
    
    // Verify mobile-friendly form layout
    expect(await page.isVisible('[data-testid="mobile-form-layout"]')).toBeTruthy();
    
    // Fill form on mobile
    await page.fill('[data-testid="menu-item-name-input"]', 'Mobile Test Item');
    await page.fill('[data-testid="menu-item-description-input"]', 'Mobile test description');
    await page.selectOption('[data-testid="menu-category-select"]', 'main-dishes');
    await page.fill('[data-testid="regular-price-input"]', '10.00');
    
    // Test component selection on mobile
    await page.click('[data-testid="add-ingredient-button"]');
    await page.waitForSelector('[data-testid="mobile-ingredient-selector"]');
    
    // Select ingredient on mobile
    await page.click('[data-testid="ingredient-tomato"]');
    await page.fill('[data-testid="quantity-input"]', '50');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-menu-item"]');
    
    // Save on mobile
    await page.click('[data-testid="save-menu-item-button"]');
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

  test('menu item editing workflow', async ({ page }) => {
    // Create a test menu item first
    await page.click('[data-testid="add-menu-item-button"]');
    await page.fill('[data-testid="menu-item-name-input"]', 'Edit Test Item');
    await page.fill('[data-testid="menu-item-description-input"]', 'Test description');
    await page.selectOption('[data-testid="menu-category-select"]', 'main-dishes');
    await page.fill('[data-testid="regular-price-input"]', '10.00');
    await page.click('[data-testid="save-menu-item-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Edit the menu item
    await page.click('[data-testid="edit-menu-item-button"]');
    await page.waitForSelector('[data-testid="menu-item-dialog"]');
    
    // Modify the name
    await page.fill('[data-testid="menu-item-name-input"]', 'Updated Edit Test Item');
    
    // Add a component
    await page.click('[data-testid="add-ingredient-button"]');
    await page.click('[data-testid="ingredient-tomato"]');
    await page.fill('[data-testid="quantity-input"]', '50');
    await page.selectOption('[data-testid="unit-select"]', 'grams');
    await page.click('[data-testid="add-ingredient-to-menu-item"]');
    
    // Save changes
    await page.click('[data-testid="save-menu-item-button"]');
    
    // Verify update
    await page.waitForSelector('[data-testid="success-message"]');
    await page.waitForSelector('text=Updated Edit Test Item');
    expect(await page.isVisible('text=Updated Edit Test Item')).toBeTruthy();
  });

  test('menu item deletion workflow', async ({ page }) => {
    // Create a test menu item first
    await page.click('[data-testid="add-menu-item-button"]');
    await page.fill('[data-testid="menu-item-name-input"]', 'Delete Test Item');
    await page.fill('[data-testid="menu-item-description-input"]', 'Test description');
    await page.selectOption('[data-testid="menu-category-select"]', 'main-dishes');
    await page.fill('[data-testid="regular-price-input"]', '10.00');
    await page.click('[data-testid="save-menu-item-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Delete the menu item
    await page.click('[data-testid="delete-menu-item-button"]');
    
    // Confirm deletion
    await page.waitForSelector('[data-testid="confirm-dialog"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verify deletion
    await page.waitForSelector('[data-testid="success-message"]');
    expect(await page.isVisible('text=Delete Test Item')).toBeFalsy();
  });

  test('search and filtering functionality', async ({ page }) => {
    // Create multiple test menu items
    const menuItems = ['Burger', 'Pizza', 'Salad', 'Pasta'];
    
    for (const item of menuItems) {
      await page.click('[data-testid="add-menu-item-button"]');
      await page.fill('[data-testid="menu-item-name-input"]', `Test ${item}`);
      await page.fill('[data-testid="menu-item-description-input"]', `Description for ${item}`);
      await page.selectOption('[data-testid="menu-category-select"]', 'main-dishes');
      await page.fill('[data-testid="regular-price-input"]', '10.00');
      await page.click('[data-testid="save-menu-item-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'Burger');
    await page.waitForSelector('text=Test Burger');
    expect(await page.isVisible('text=Test Burger')).toBeTruthy();
    expect(await page.isVisible('text=Test Pizza')).toBeFalsy();
    
    // Clear search
    await page.clear('[data-testid="search-input"]');
    await page.waitForSelector('text=Test Pizza');
    
    // Test category filtering
    await page.selectOption('[data-testid="category-filter"]', 'main-dishes');
    await page.waitForSelector('text=Test Burger');
    await page.waitForSelector('text=Test Pizza');
    
    // Test price range filtering
    await page.fill('[data-testid="min-price-filter"]', '5');
    await page.fill('[data-testid="max-price-filter"]', '15');
    await page.click('[data-testid="apply-price-filter"]');
    await page.waitForSelector('[data-testid="filtered-results"]');
    
    // Test featured items filter
    await page.check('[data-testid="filter-featured"]');
    await page.waitForSelector('[data-testid="filtered-results"]');
  });

  test('error handling and validation', async ({ page }) => {
    // Test required field validation
    await page.click('[data-testid="add-menu-item-button"]');
    await page.click('[data-testid="save-menu-item-button"]');
    
    // Verify validation errors
    await page.waitForSelector('[data-testid="validation-error"]');
    expect(await page.isVisible('text=Name is required')).toBeTruthy();
    
    // Test invalid price input
    await page.fill('[data-testid="menu-item-name-input"]', 'Test Item');
    await page.fill('[data-testid="regular-price-input"]', 'invalid-price');
    await page.click('[data-testid="save-menu-item-button"]');
    
    await page.waitForSelector('[data-testid="validation-error"]');
    expect(await page.isVisible('text=Price must be a valid number')).toBeTruthy();
    
    // Test negative price
    await page.fill('[data-testid="regular-price-input"]', '-5');
    await page.click('[data-testid="save-menu-item-button"]');
    
    await page.waitForSelector('[data-testid="validation-error"]');
    expect(await page.isVisible('text=Price must be positive')).toBeTruthy();
    
    // Test network error handling
    await page.route('**/api/menu-items', route => {
      route.abort('failed');
    });
    
    await page.fill('[data-testid="regular-price-input"]', '10.00');
    await page.click('[data-testid="save-menu-item-button"]');
    
    await page.waitForSelector('[data-testid="error-message"]');
    expect(await page.isVisible('text=Failed to save menu item')).toBeTruthy();
    
    // Restore network
    await page.unroute('**/api/menu-items');
  });

  test('accessibility compliance', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Should open add menu item dialog
    
    await page.waitForSelector('[data-testid="menu-item-dialog"]');
    
    // Test form navigation with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard Test Item');
    
    await page.keyboard.press('Tab');
    await page.keyboard.type('Keyboard test description');
    
    // Test screen reader compatibility
    const nameLabel = await page.locator('[data-testid="menu-item-name-input"]');
    expect(await nameLabel.getAttribute('aria-label')).toBeTruthy();
    
    // Test focus indicators
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.isVisible()).toBeTruthy();
    
    // Test ARIA labels for component selection
    const componentSelector = await page.locator('[data-testid="component-selector"]');
    expect(await componentSelector.getAttribute('aria-label')).toBeTruthy();
  });
}); 