import { test, expect } from '@playwright/test';

test.describe('Admin Fundraisers Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/fundraisers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('displays fundraisers page', async ({ page }) => {
    // Should have fundraisers heading
    await expect(page.locator('h1, h2').filter({ hasText: /Fundraisers/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows fundraisers list or empty state', async ({ page }) => {
    // Should have fundraisers table/cards or create prompt
    const fundraiserCards = page.locator('[class*="rounded-lg"][class*="shadow"]');
    const tableRows = page.locator('table tbody tr');
    const emptyState = page.locator('text=/no fundraisers/i, text=/Create your first/i, text=/Get started/i');
    
    const hasCards = (await fundraiserCards.count()) > 0;
    const hasRows = (await tableRows.count()) > 0;
    const hasEmpty = await emptyState.first().isVisible();
    
    expect(hasCards || hasRows || hasEmpty).toBeTruthy();
  });

  test('New Fundraiser button exists', async ({ page }) => {
    // Should have New Fundraiser button
    const newButton = page.locator('a:has-text("New Fundraiser"), button:has-text("New Fundraiser")').first();
    await expect(newButton).toBeVisible();
  });

  test('New Fundraiser button navigates to form', async ({ page }) => {
    // Click New Fundraiser button
    const newButton = page.locator('a:has-text("New Fundraiser"), button:has-text("New Fundraiser")').first();
    await newButton.click();
    
    // Should navigate to form
    await expect(page).toHaveURL(/\/admin\/fundraisers\/new/);
  });

  test('Manage button navigates to detail page', async ({ page }) => {
    // Look for Manage button/link on a fundraiser
    const manageLink = page.locator('a:has-text("Manage")').first();
    
    const count = await manageLink.count();
    if (count === 0) {
      // No fundraisers to manage
      test.skip();
      return;
    }
    
    await manageLink.click();
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/admin\/fundraisers\/\d+/);
  });
});

test.describe('Admin Fundraiser Detail Page', () => {
  test('displays tabs when fundraiser exists', async ({ page }) => {
    // Navigate to fundraisers list first
    await page.goto('/admin/fundraisers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for a Manage link
    const manageLink = page.locator('a:has-text("Manage")').first();
    
    if (!(await manageLink.isVisible())) {
      // No fundraisers exist
      test.skip();
      return;
    }
    
    await manageLink.click();
    await page.waitForLoadState('networkidle');
    
    // Should have tabs - Overview, Participants, Products
    const overviewTab = page.locator('button:has-text("Overview")').first();
    const participantsTab = page.locator('button:has-text("Participants")').first();
    const productsTab = page.locator('button:has-text("Products")').first();
    
    await expect(overviewTab).toBeVisible({ timeout: 5000 });
    await expect(participantsTab).toBeVisible();
    await expect(productsTab).toBeVisible();
  });

  test('can switch to Participants tab', async ({ page }) => {
    await page.goto('/admin/fundraisers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const manageLink = page.locator('a:has-text("Manage")').first();
    
    if (!(await manageLink.isVisible())) {
      test.skip();
      return;
    }
    
    await manageLink.click();
    await page.waitForLoadState('networkidle');
    
    // Click Participants tab
    const participantsTab = page.locator('button:has-text("Participants")').first();
    await participantsTab.click();
    await page.waitForTimeout(500);
    
    // Should show Add Participant button or empty state
    const addButton = page.locator('button:has-text("Add Participant")');
    const emptyState = page.locator('text=/no participants/i');
    
    const hasButton = await addButton.isVisible();
    const hasEmpty = await emptyState.first().isVisible();
    
    expect(hasButton || hasEmpty).toBeTruthy();
  });

  test('can switch to Products tab', async ({ page }) => {
    await page.goto('/admin/fundraisers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const manageLink = page.locator('a:has-text("Manage")').first();
    
    if (!(await manageLink.isVisible())) {
      test.skip();
      return;
    }
    
    await manageLink.click();
    await page.waitForLoadState('networkidle');
    
    // Click Products tab
    const productsTab = page.locator('button:has-text("Products")').first();
    await productsTab.click();
    await page.waitForTimeout(500);
    
    // Should show Add Product button or empty state
    const addButton = page.locator('button:has-text("Add Product")');
    const emptyState = page.locator('text=/no products/i');
    
    const hasButton = await addButton.isVisible();
    const hasEmpty = await emptyState.first().isVisible();
    
    expect(hasButton || hasEmpty).toBeTruthy();
  });
});

test.describe('Admin Fundraiser Form', () => {
  test('new fundraiser form has required fields', async ({ page }) => {
    await page.goto('/admin/fundraisers/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should have heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Should have text inputs for filling out form
    const inputs = page.locator('input[type="text"]');
    expect(await inputs.count()).toBeGreaterThan(0);
    
    // Should have save button
    await expect(page.locator('button:has-text("Save"), button:has-text("Create")').first()).toBeVisible();
  });

  test('can fill out fundraiser form', async ({ page }) => {
    await page.goto('/admin/fundraisers/new');
    await page.waitForLoadState('networkidle');
    
    // Find the name input (first text input after "Name" label)
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Test Fundraiser E2E');
    
    // Form should be fillable without errors
    await expect(nameInput).toHaveValue('Test Fundraiser E2E');
  });
});
