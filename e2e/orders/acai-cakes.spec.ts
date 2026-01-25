import { test, expect } from '@playwright/test';

test.describe('Acai Cakes Ordering - Wizard Form', () => {
  let acaiEnabled = false;

  test.beforeEach(async ({ page }) => {
    await page.goto('/acai-cakes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if Acai ordering is enabled (not showing "Coming Soon")
    const comingSoon = page.locator('text=/Coming Soon/i').first();
    acaiEnabled = !(await comingSoon.isVisible().catch(() => false));
  });

  test('displays acai cakes page with product info', async ({ page }) => {
    // Should have page heading with Acai/Açaí
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    const headingText = await heading.textContent();
    expect(headingText).toMatch(/A[cç]a[ií]|Coming Soon|Cake/i);
    console.log(`✅ Acai page shows: ${headingText?.substring(0, 30)}...`);
    
    // Should show price
    const price = page.locator('text=/\\$\\d+\\.\\d+/').first();
    await expect(price).toBeVisible();
    console.log('✅ Price is visible');
  });

  test('shows progress bar', async ({ page }) => {
    if (!acaiEnabled) {
      console.log('⚠️ Acai ordering not enabled - skipping');
      test.skip();
      return;
    }
    
    // Should have a progress bar
    const progressBar = page.locator('[class*="sticky"]').filter({ hasText: /\d+\/\d+/ });
    await expect(progressBar).toBeVisible({ timeout: 10000 });
    console.log('✅ Progress bar visible');
  });

  test('Step 1: Date selection is active by default', async ({ page }) => {
    if (!acaiEnabled) {
      test.skip();
      return;
    }
    
    // First step should be expanded and show date buttons
    const dateButtons = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ });
    await expect(dateButtons.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Date selection buttons visible');
  });

  test('Step 1 → Step 2: Selecting date advances to time selection', async ({ page }) => {
    if (!acaiEnabled) {
      test.skip();
      return;
    }
    
    // Click on first available date
    const dateButton = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    await dateButton.click();
    await page.waitForTimeout(500);
    
    // Time selection step should now be expanded
    const timeButtons = page.locator('button').filter({ hasText: /AM|PM/ });
    await expect(timeButtons.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Auto-advanced to time selection');
  });

  test('Step 2 → Step 3: Selecting time advances to crust selection', async ({ page }) => {
    if (!acaiEnabled) {
      test.skip();
      return;
    }
    
    // Select date
    const dateButton = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    await dateButton.click();
    await page.waitForTimeout(500);
    
    // Select time
    const timeButton = page.locator('button').filter({ hasText: /AM|PM/ }).first();
    await timeButton.click();
    await page.waitForTimeout(500);
    
    // Crust selection should now be visible
    const crustButtons = page.locator('button').filter({ hasText: /Peanut Butter|Nutella|Honey/i });
    await expect(crustButtons.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Auto-advanced to crust selection');
  });

  test('Completed steps show green checkmark and summary', async ({ page }) => {
    if (!acaiEnabled) {
      test.skip();
      return;
    }
    
    // Select date
    const dateButton = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    await dateButton.click();
    await page.waitForTimeout(500);
    
    // The date step header should now show a checkmark (via SVG in the number badge)
    const checkmark = page.locator('svg path[d*="M5 13l4 4L19 7"]').first();
    await expect(checkmark).toBeVisible({ timeout: 5000 });
    console.log('✅ Completed step shows green checkmark');
  });

  test('Can click on completed step to edit it', async ({ page }) => {
    if (!acaiEnabled) {
      test.skip();
      return;
    }
    
    // Select date
    const dateButton = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    await dateButton.click();
    await page.waitForTimeout(500);
    
    // Select time
    const timeButton = page.locator('button').filter({ hasText: /AM|PM/ }).first();
    await timeButton.click();
    await page.waitForTimeout(500);
    
    // Click on step 1 header to go back
    const step1Header = page.locator('button').filter({ hasText: 'Pickup Date' }).first();
    await step1Header.click();
    await page.waitForTimeout(300);
    
    // Date buttons should be visible again
    const dateButtons = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ });
    await expect(dateButtons.first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Can navigate back to edit completed step');
  });

  test('Order summary shows selected options', async ({ page }) => {
    if (!acaiEnabled) {
      test.skip();
      return;
    }
    
    // Select date
    const dateButton = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    await dateButton.click();
    await page.waitForTimeout(500);
    
    // Select time
    const timeButton = page.locator('button').filter({ hasText: /AM|PM/ }).first();
    await timeButton.click();
    await page.waitForTimeout(500);
    
    // Order summary should show location and date info
    const orderSummary = page.locator('text=Order Summary');
    await expect(orderSummary).toBeVisible();
    
    // Should show pickup location
    const pickupLocation = page.locator('text=/Marine Corps|Hagåtña/i').first();
    await expect(pickupLocation).toBeVisible();
    console.log('✅ Order summary shows pickup details');
  });

  test('Submit button is disabled until form is complete', async ({ page }) => {
    if (!acaiEnabled) {
      test.skip();
      return;
    }
    
    // Initially, submit button should be disabled
    const submitButton = page.locator('button:has-text("Place Order")');
    await expect(submitButton).toBeDisabled();
    console.log('✅ Submit button disabled when form incomplete');
  });

  test('Full flow: Complete order form', async ({ page }) => {
    if (!acaiEnabled) {
      test.skip();
      return;
    }
    
    // Step 1: Select date
    const dateButton = page.locator('button').filter({ hasText: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ }).first();
    await dateButton.click();
    await page.waitForTimeout(500);
    
    // Step 2: Select time
    const timeButton = page.locator('button').filter({ hasText: /AM|PM/ }).first();
    await timeButton.click();
    await page.waitForTimeout(500);
    
    // Step 3: Select crust (should auto-select first, but click to confirm)
    const crustButton = page.locator('button').filter({ hasText: /Peanut Butter/i }).first();
    await crustButton.click();
    await page.waitForTimeout(500);
    
    // Step 4: Quantity - scroll down and click Continue
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    
    let continueButton = page.locator('button:has-text("Continue")').first();
    if (await continueButton.isVisible()) {
      await continueButton.scrollIntoViewIfNeeded();
      await continueButton.click({ force: true });
      await page.waitForTimeout(500);
    }
    
    // Step 5: Placard (skip if present) - use force click if needed
    continueButton = page.locator('button:has-text("Continue")').first();
    if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueButton.scrollIntoViewIfNeeded();
      await continueButton.click({ force: true });
      await page.waitForTimeout(500);
    }
    
    // Step 6: Scroll to contact section and fill info
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    
    // Click on contact step header to ensure it's open
    const contactStepHeader = page.locator('button').filter({ hasText: 'Contact Info' }).first();
    if (await contactStepHeader.isVisible()) {
      await contactStepHeader.click({ force: true });
      await page.waitForTimeout(300);
    }
    
    await page.fill('input[placeholder*="John Doe"], input[placeholder*="Name"]', 'E2E Test Customer');
    await page.fill('input[type="email"]', 'e2e-test@example.com');
    await page.fill('input[type="tel"]', '671-555-1234');
    
    // Submit button should now be enabled
    const submitButton = page.locator('button:has-text("Place Order")');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    console.log('✅ Full form completed - submit button enabled');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/acai-wizard-complete.png', fullPage: true });
  });

  test('Coming soon page shows phone contact', async ({ page }) => {
    if (acaiEnabled) {
      console.log('⚠️ Acai enabled - skipping coming soon test');
      test.skip();
      return;
    }
    
    // Should show phone number for ordering
    const phoneLink = page.locator('a[href^="tel:"]');
    await expect(phoneLink).toBeVisible();
    console.log('✅ Coming soon page shows phone contact');
  });
});
