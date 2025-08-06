import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the application
  await page.goto('http://localhost:5173');

  // Wait for the application to load
  await page.waitForLoadState('networkidle');

  // Clean up test data
  try {
    // Clean up test preps
    await page.goto('http://localhost:5173/admin/preps');
    await page.waitForSelector('[data-testid="prep-management-page"]', { timeout: 10000 });
    
    // Delete test preps that start with "E2E Test"
    const testPrepRows = page.locator('[data-testid="prep-row"]').filter({ hasText: 'E2E Test' });
    const count = await testPrepRows.count();
    
    for (let i = 0; i < count; i++) {
      const row = testPrepRows.nth(i);
      await row.locator('[data-testid="delete-prep-button"]').click();
      await page.locator('[data-testid="confirm-delete-button"]').click();
      await page.waitForTimeout(1000); // Wait for deletion to complete
    }
    
    // Clean up test ingredients
    await page.goto('http://localhost:5173/admin/ingredients');
    await page.waitForSelector('[data-testid="ingredients-page"]', { timeout: 10000 });
    
    // Delete test ingredients that start with "E2E Test"
    const testIngredientRows = page.locator('[data-testid="ingredient-row"]').filter({ hasText: 'E2E Test' });
    const ingredientCount = await testIngredientRows.count();
    
    for (let i = 0; i < ingredientCount; i++) {
      const row = testIngredientRows.nth(i);
      await row.locator('[data-testid="delete-ingredient-button"]').click();
      await page.locator('[data-testid="confirm-delete-button"]').click();
      await page.waitForTimeout(1000); // Wait for deletion to complete
    }
    
  } catch (error) {
    console.log('Could not clean up test data:', error);
  }

  await browser.close();
}

export default globalTeardown; 