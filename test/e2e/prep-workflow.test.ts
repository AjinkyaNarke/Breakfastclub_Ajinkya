import { test, expect } from '@playwright/test';

// Test data
const testPrep = {
  name: 'E2E Test Dough',
  nameDe: 'E2E Test Teig',
  nameEn: 'E2E Test Dough',
  description: 'E2E test dough prep for automated testing',
  descriptionDe: 'E2E Test Teig Prep für automatisierte Tests',
  descriptionEn: 'E2E test dough prep for automated testing',
  batchYield: '2kg',
  notes: 'E2E test prep notes',
  instructions: 'Mix flour and water for E2E testing',
  instructionsDe: 'Mehl und Wasser für E2E Tests mischen',
  instructionsEn: 'Mix flour and water for E2E testing'
};

const testIngredient = {
  name: 'E2E Test Flour',
  nameDe: 'E2E Test Mehl',
  nameEn: 'E2E Test Flour',
  description: 'E2E test flour for automated testing',
  descriptionDe: 'E2E Test Mehl für automatisierte Tests',
  descriptionEn: 'E2E test flour for automated testing',
  costPerUnit: 2.50,
  unit: 'kg'
};

test.describe('Prep Management E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the prep management page
    await page.goto('/admin/preps');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="prep-management-page"]', { timeout: 10000 });
  });

  test.describe('Prep Creation Workflow', () => {
    test('should create a new prep with ingredients and calculate costs', async ({ page }) => {
      // Step 1: Click add prep button
      await page.click('[data-testid="add-prep-button"]');
      await expect(page.locator('[data-testid="prep-dialog"]')).toBeVisible();

      // Step 2: Fill in basic prep information
      await page.fill('[data-testid="prep-name-input"]', testPrep.name);
      await page.fill('[data-testid="prep-name-de-input"]', testPrep.nameDe);
      await page.fill('[data-testid="prep-name-en-input"]', testPrep.nameEn);
      await page.fill('[data-testid="prep-description-input"]', testPrep.description);
      await page.fill('[data-testid="prep-description-de-input"]', testPrep.descriptionDe);
      await page.fill('[data-testid="prep-description-en-input"]', testPrep.descriptionEn);
      await page.fill('[data-testid="prep-batch-yield-input"]', testPrep.batchYield);
      await page.fill('[data-testid="prep-notes-input"]', testPrep.notes);
      await page.fill('[data-testid="prep-instructions-input"]', testPrep.instructions);
      await page.fill('[data-testid="prep-instructions-de-input"]', testPrep.instructionsDe);
      await page.fill('[data-testid="prep-instructions-en-input"]', testPrep.instructionsEn);

      // Step 3: Add ingredients
      await page.click('[data-testid="add-ingredient-button"]');
      await expect(page.locator('[data-testid="ingredient-selector-dialog"]')).toBeVisible();

      // Search for ingredient
      await page.fill('[data-testid="ingredient-search-input"]', testIngredient.name);
      await page.waitForTimeout(500); // Wait for search results

      // Select ingredient
      await page.click(`[data-testid="ingredient-item-${testIngredient.name}"]`);
      
      // Set quantity
      await page.fill('[data-testid="ingredient-quantity-input"]', '1.5');
      await page.selectOption('[data-testid="ingredient-unit-select"]', 'kg');
      await page.fill('[data-testid="ingredient-notes-input"]', 'Main flour component');

      // Confirm ingredient selection
      await page.click('[data-testid="confirm-ingredient-selection"]');
      await expect(page.locator('[data-testid="ingredient-selector-dialog"]')).not.toBeVisible();

      // Step 4: Verify ingredient is added and cost is calculated
      await expect(page.locator(`text=${testIngredient.name}`)).toBeVisible();
      await expect(page.locator('text=1.5 kg')).toBeVisible();
      await expect(page.locator('text=€3.75')).toBeVisible(); // 1.5 * 2.50

      // Step 5: Save the prep
      await page.click('[data-testid="save-prep-button"]');
      await expect(page.locator('[data-testid="prep-dialog"]')).not.toBeVisible();

      // Step 6: Verify prep appears in the list
      await expect(page.locator(`text=${testPrep.name}`)).toBeVisible();
      await expect(page.locator('text=2kg')).toBeVisible();
      await expect(page.locator('text=€3.75')).toBeVisible();
      await expect(page.locator('text=€1.88/unit')).toBeVisible(); // 3.75 / 2
    });

    test('should validate required fields during prep creation', async ({ page }) => {
      // Step 1: Open prep dialog
      await page.click('[data-testid="add-prep-button"]');
      await expect(page.locator('[data-testid="prep-dialog"]')).toBeVisible();

      // Step 2: Try to save without required fields
      await page.click('[data-testid="save-prep-button"]');

      // Step 3: Verify validation errors
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Batch yield is required')).toBeVisible();

      // Step 4: Fill required fields
      await page.fill('[data-testid="prep-name-input"]', testPrep.name);
      await page.fill('[data-testid="prep-batch-yield-input"]', testPrep.batchYield);

      // Step 5: Verify validation errors are gone
      await expect(page.locator('text=Name is required')).not.toBeVisible();
      await expect(page.locator('text=Batch yield is required')).not.toBeVisible();
    });

    test('should validate batch yield format', async ({ page }) => {
      // Step 1: Open prep dialog
      await page.click('[data-testid="add-prep-button"]');
      await expect(page.locator('[data-testid="prep-dialog"]')).toBeVisible();

      // Step 2: Fill name and invalid batch yield
      await page.fill('[data-testid="prep-name-input"]', testPrep.name);
      await page.fill('[data-testid="prep-batch-yield-input"]', 'invalid format');

      // Step 3: Try to save
      await page.click('[data-testid="save-prep-button"]');

      // Step 4: Verify validation error
      await expect(page.locator('text=Invalid batch yield format')).toBeVisible();

      // Step 5: Fix batch yield format
      await page.fill('[data-testid="prep-batch-yield-input"]', '500ml');

      // Step 6: Verify validation error is gone
      await expect(page.locator('text=Invalid batch yield format')).not.toBeVisible();
    });
  });

  test.describe('Prep Editing Workflow', () => {
    test('should edit an existing prep', async ({ page }) => {
      // Step 1: Find and click edit button for the test prep
      const prepRow = page.locator(`[data-testid="prep-row-${testPrep.name}"]`);
      await prepRow.locator('[data-testid="edit-prep-button"]').click();
      await expect(page.locator('[data-testid="prep-dialog"]')).toBeVisible();

      // Step 2: Verify form is pre-filled
      await expect(page.locator('[data-testid="prep-name-input"]')).toHaveValue(testPrep.name);
      await expect(page.locator('[data-testid="prep-batch-yield-input"]')).toHaveValue(testPrep.batchYield);

      // Step 3: Modify the prep
      const updatedName = 'Updated E2E Test Dough';
      await page.fill('[data-testid="prep-name-input"]', updatedName);
      await page.fill('[data-testid="prep-notes-input"]', 'Updated notes for E2E testing');

      // Step 4: Save changes
      await page.click('[data-testid="save-prep-button"]');
      await expect(page.locator('[data-testid="prep-dialog"]')).not.toBeVisible();

      // Step 5: Verify changes are reflected
      await expect(page.locator(`text=${updatedName}`)).toBeVisible();
      await expect(page.locator('text=Updated notes for E2E testing')).toBeVisible();
    });

    test('should add ingredients to existing prep', async ({ page }) => {
      // Step 1: Open edit dialog for existing prep
      const prepRow = page.locator(`[data-testid="prep-row-${testPrep.name}"]`);
      await prepRow.locator('[data-testid="edit-prep-button"]').click();

      // Step 2: Add another ingredient
      await page.click('[data-testid="add-ingredient-button"]');
      await expect(page.locator('[data-testid="ingredient-selector-dialog"]')).toBeVisible();

      // Step 3: Search and select another ingredient
      await page.fill('[data-testid="ingredient-search-input"]', 'Oil');
      await page.waitForTimeout(500);
      await page.click('[data-testid="ingredient-item-Oil"]');
      
      // Step 4: Set quantity for new ingredient
      await page.fill('[data-testid="ingredient-quantity-input"]', '0.2');
      await page.selectOption('[data-testid="ingredient-unit-select"]', 'l');
      await page.fill('[data-testid="ingredient-notes-input"]', 'Oil for consistency');

      // Step 5: Confirm selection
      await page.click('[data-testid="confirm-ingredient-selection"]');

      // Step 6: Verify both ingredients are present
      await expect(page.locator(`text=${testIngredient.name}`)).toBeVisible();
      await expect(page.locator('text=Oil')).toBeVisible();
      await expect(page.locator('text=1.5 kg')).toBeVisible();
      await expect(page.locator('text=0.2 l')).toBeVisible();

      // Step 7: Verify updated cost calculation
      await expect(page.locator('text=€4.75')).toBeVisible(); // 3.75 + (0.2 * 5.00)

      // Step 8: Save changes
      await page.click('[data-testid="save-prep-button"]');
    });
  });

  test.describe('Prep Deletion Workflow', () => {
    test('should delete a prep with confirmation', async ({ page }) => {
      // Step 1: Find and click delete button
      const prepRow = page.locator(`[data-testid="prep-row-${testPrep.name}"]`);
      await prepRow.locator('[data-testid="delete-prep-button"]').click();

      // Step 2: Verify confirmation dialog appears
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
      await expect(page.locator('text=Delete Prep')).toBeVisible();
      await expect(page.locator('text=Are you sure you want to delete this prep?')).toBeVisible();

      // Step 3: Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');

      // Step 4: Verify dialog closes and prep is removed
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible();
      await expect(page.locator(`text=${testPrep.name}`)).not.toBeVisible();
    });

    test('should cancel prep deletion', async ({ page }) => {
      // Step 1: Find and click delete button
      const prepRow = page.locator(`[data-testid="prep-row-${testPrep.name}"]`);
      await prepRow.locator('[data-testid="delete-prep-button"]').click();

      // Step 2: Verify confirmation dialog appears
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();

      // Step 3: Cancel deletion
      await page.click('[data-testid="cancel-delete-button"]');

      // Step 4: Verify dialog closes and prep remains
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible();
      await expect(page.locator(`text=${testPrep.name}`)).toBeVisible();
    });
  });

  test.describe('Search and Filtering', () => {
    test('should search for preps by name', async ({ page }) => {
      // Step 1: Use search input
      await page.fill('[data-testid="prep-search-input"]', 'E2E');

      // Step 2: Wait for search results
      await page.waitForTimeout(500);

      // Step 3: Verify only matching preps are shown
      await expect(page.locator(`text=${testPrep.name}`)).toBeVisible();
      
      // Step 4: Search for non-existent prep
      await page.fill('[data-testid="prep-search-input"]', 'NonExistentPrep');
      await page.waitForTimeout(500);

      // Step 5: Verify no results message
      await expect(page.locator('text=No preps found')).toBeVisible();
    });

    test('should filter preps by active status', async ({ page }) => {
      // Step 1: Toggle active filter
      await page.click('[data-testid="active-filter-toggle"]');

      // Step 2: Verify only active preps are shown
      const prepRows = page.locator('[data-testid="prep-row"]');
      await expect(prepRows).toHaveCount(1); // Only the test prep should be active

      // Step 3: Toggle to show inactive preps
      await page.click('[data-testid="inactive-filter-toggle"]');

      // Step 4: Verify inactive preps are shown
      await expect(page.locator('text=Test Sauce')).toBeVisible(); // Assuming this is inactive
    });
  });

  test.describe('Cost Breakdown Workflow', () => {
    test('should view cost breakdown for a prep', async ({ page }) => {
      // Step 1: Click cost breakdown button
      const prepRow = page.locator(`[data-testid="prep-row-${testPrep.name}"]`);
      await prepRow.locator('[data-testid="cost-breakdown-button"]').click();

      // Step 2: Verify cost breakdown dialog appears
      await expect(page.locator('[data-testid="cost-breakdown-dialog"]')).toBeVisible();
      await expect(page.locator('text=Cost Breakdown')).toBeVisible();
      await expect(page.locator(`text=${testPrep.name}`)).toBeVisible();

      // Step 3: Verify cost information
      await expect(page.locator('text=Total Cost: €4.75')).toBeVisible();
      await expect(page.locator('text=Cost per Unit: €2.38')).toBeVisible();

      // Step 4: Verify ingredient breakdown
      await expect(page.locator(`text=${testIngredient.name}`)).toBeVisible();
      await expect(page.locator('text=1.5 kg')).toBeVisible();
      await expect(page.locator('text=€3.75')).toBeVisible();
      await expect(page.locator('text=78.95%')).toBeVisible();

      // Step 5: Close dialog
      await page.click('[data-testid="close-cost-breakdown"]');
      await expect(page.locator('[data-testid="cost-breakdown-dialog"]')).not.toBeVisible();
    });
  });

  test.describe('Analytics Workflow', () => {
    test('should navigate to analytics and view prep usage data', async ({ page }) => {
      // Step 1: Navigate to analytics page
      await page.click('[data-testid="prep-analytics-nav-link"]');
      await page.waitForURL('**/admin/prep-analytics');
      await expect(page.locator('[data-testid="prep-analytics-page"]')).toBeVisible();

      // Step 2: Verify analytics dashboard loads
      await expect(page.locator('text=Prep Usage Analytics')).toBeVisible();
      await expect(page.locator('text=Track prep usage and optimize costs')).toBeVisible();

      // Step 3: Check overview tab content
      await expect(page.locator('text=Overview')).toBeVisible();
      await expect(page.locator('text=Popular Preps')).toBeVisible();
      await expect(page.locator('text=Efficient Preps')).toBeVisible();

      // Step 4: Switch to popular tab
      await page.click('[data-testid="popular-tab"]');
      await expect(page.locator('text=Most Popular Preps')).toBeVisible();

      // Step 5: Verify charts are rendered
      await expect(page.locator('[data-testid="popularity-chart"]')).toBeVisible();

      // Step 6: Switch to efficient tab
      await page.click('[data-testid="efficient-tab"]');
      await expect(page.locator('text=Most Cost Efficient Preps')).toBeVisible();

      // Step 7: Switch to recommendations tab
      await page.click('[data-testid="recommendations-tab"]');
      await expect(page.locator('text=Optimization Recommendations')).toBeVisible();
    });

    test('should refresh analytics data', async ({ page }) => {
      // Step 1: Navigate to analytics page
      await page.click('[data-testid="prep-analytics-nav-link"]');
      await page.waitForURL('**/admin/prep-analytics');

      // Step 2: Click refresh button
      await page.click('[data-testid="refresh-analytics-button"]');

      // Step 3: Verify loading state
      await expect(page.locator('[data-testid="analytics-loading"]')).toBeVisible();

      // Step 4: Wait for refresh to complete
      await expect(page.locator('[data-testid="analytics-loading"]')).not.toBeVisible();
    });
  });

  test.describe('Pagination Workflow', () => {
    test('should navigate through pages when multiple preps exist', async ({ page }) => {
      // Step 1: Create multiple preps (if not already present)
      for (let i = 1; i <= 3; i++) {
        await page.click('[data-testid="add-prep-button"]');
        await page.fill('[data-testid="prep-name-input"]', `Pagination Test Prep ${i}`);
        await page.fill('[data-testid="prep-batch-yield-input"]', '1kg');
        await page.click('[data-testid="save-prep-button"]');
      }

      // Step 2: Verify pagination controls appear
      await expect(page.locator('[data-testid="pagination-controls"]')).toBeVisible();

      // Step 3: Navigate to next page
      await page.click('[data-testid="next-page-button"]');

      // Step 4: Verify page changes
      await expect(page.locator('text=Page 2 of')).toBeVisible();

      // Step 5: Navigate to previous page
      await page.click('[data-testid="previous-page-button"]');

      // Step 6: Verify back to first page
      await expect(page.locator('text=Page 1 of')).toBeVisible();
    });
  });

  test.describe('Multilingual Support', () => {
    test('should switch between German and English languages', async ({ page }) => {
      // Step 1: Switch to German
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="german-language-option"]');

      // Step 2: Verify German text
      await expect(page.locator('text=Prep-Verwaltung')).toBeVisible();
      await expect(page.locator('text=Zwischenprodukte für Kostenverfolgung verwalten')).toBeVisible();

      // Step 3: Switch to English
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="english-language-option"]');

      // Step 4: Verify English text
      await expect(page.locator('text=Prep Management')).toBeVisible();
      await expect(page.locator('text=Manage intermediate preps for cost tracking')).toBeVisible();
    });

    test('should display multilingual prep names correctly', async ({ page }) => {
      // Step 1: Create prep with multilingual names
      await page.click('[data-testid="add-prep-button"]');
      await page.fill('[data-testid="prep-name-input"]', 'Multilingual Test');
      await page.fill('[data-testid="prep-name-de-input"]', 'Mehrsprachiger Test');
      await page.fill('[data-testid="prep-name-en-input"]', 'Multilingual Test');
      await page.fill('[data-testid="prep-batch-yield-input"]', '1kg');
      await page.click('[data-testid="save-prep-button"]');

      // Step 2: Switch to German and verify German name
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="german-language-option"]');
      await expect(page.locator('text=Mehrsprachiger Test')).toBeVisible();

      // Step 3: Switch to English and verify English name
      await page.click('[data-testid="language-switcher"]');
      await page.click('[data-testid="english-language-option"]');
      await expect(page.locator('text=Multilingual Test')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Step 1: Simulate network error by going offline
      await page.context().setOffline(true);

      // Step 2: Try to create a prep
      await page.click('[data-testid="add-prep-button"]');
      await page.fill('[data-testid="prep-name-input"]', 'Network Error Test');
      await page.fill('[data-testid="prep-batch-yield-input"]', '1kg');
      await page.click('[data-testid="save-prep-button"]');

      // Step 3: Verify error message
      await expect(page.locator('text=Network error')).toBeVisible();
      await expect(page.locator('text=Please check your connection')).toBeVisible();

      // Step 4: Go back online
      await page.context().setOffline(false);

      // Step 5: Retry the operation
      await page.click('[data-testid="retry-button"]');
      await expect(page.locator('text=Network error')).not.toBeVisible();
    });

    test('should handle validation errors during form submission', async ({ page }) => {
      // Step 1: Open prep dialog
      await page.click('[data-testid="add-prep-button"]');

      // Step 2: Try to save without required fields
      await page.click('[data-testid="save-prep-button"]');

      // Step 3: Verify validation errors are displayed
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Batch yield is required')).toBeVisible();

      // Step 4: Fill required fields
      await page.fill('[data-testid="prep-name-input"]', 'Validation Test');
      await page.fill('[data-testid="prep-batch-yield-input"]', '1kg');

      // Step 5: Verify validation errors are cleared
      await expect(page.locator('text=Name is required')).not.toBeVisible();
      await expect(page.locator('text=Batch yield is required')).not.toBeVisible();
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      // Step 1: Create many preps to test performance
      for (let i = 1; i <= 20; i++) {
        await page.click('[data-testid="add-prep-button"]');
        await page.fill('[data-testid="prep-name-input"]', `Performance Test Prep ${i}`);
        await page.fill('[data-testid="prep-batch-yield-input"]', '1kg');
        await page.click('[data-testid="save-prep-button"]');
      }

      // Step 2: Verify page loads without significant delay
      await expect(page.locator('[data-testid="prep-management-page"]')).toBeVisible();

      // Step 3: Test search performance
      await page.fill('[data-testid="prep-search-input"]', 'Performance');
      await page.waitForTimeout(1000); // Should complete within 1 second

      // Step 4: Verify search results
      await expect(page.locator('text=Performance Test Prep 1')).toBeVisible();
    });

    test('should be responsive on mobile devices', async ({ page }) => {
      // Step 1: Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Step 2: Verify mobile layout
      await expect(page.locator('[data-testid="prep-management-page"]')).toBeVisible();

      // Step 3: Test mobile navigation
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // Step 4: Test mobile prep creation
      await page.click('[data-testid="add-prep-button"]');
      await expect(page.locator('[data-testid="prep-dialog"]')).toBeVisible();

      // Step 5: Verify mobile form layout
      await expect(page.locator('[data-testid="prep-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="prep-batch-yield-input"]')).toBeVisible();
    });
  });
}); 