import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the application
  await page.goto('http://localhost:5173');

  // Wait for the application to load
  await page.waitForLoadState('networkidle');

  // Create test data if needed
  // This could include creating test ingredients, categories, etc.
  
  // Example: Create test ingredient if it doesn't exist
  try {
    await page.goto('http://localhost:5173/admin/ingredients');
    await page.waitForSelector('[data-testid="ingredients-page"]', { timeout: 10000 });
    
    // Check if test ingredient exists
    const testIngredientExists = await page.locator('text=E2E Test Flour').count() > 0;
    
    if (!testIngredientExists) {
      // Create test ingredient
      await page.click('[data-testid="add-ingredient-button"]');
      await page.fill('[data-testid="ingredient-name-input"]', 'E2E Test Flour');
      await page.fill('[data-testid="ingredient-name-de-input"]', 'E2E Test Mehl');
      await page.fill('[data-testid="ingredient-name-en-input"]', 'E2E Test Flour');
      await page.fill('[data-testid="ingredient-description-input"]', 'E2E test flour for automated testing');
      await page.fill('[data-testid="ingredient-cost-input"]', '2.50');
      await page.selectOption('[data-testid="ingredient-unit-select"]', 'kg');
      await page.selectOption('[data-testid="ingredient-category-select"]', '1'); // Assuming category ID 1 exists
      await page.click('[data-testid="save-ingredient-button"]');
      
      // Wait for ingredient to be created
      await page.waitForSelector('text=E2E Test Flour', { timeout: 10000 });
    }
  } catch (error) {
    console.log('Could not create test ingredient:', error);
  }

  await browser.close();
}

export default globalSetup; 