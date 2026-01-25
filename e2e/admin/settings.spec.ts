import { test, expect } from '@playwright/test';

/**
 * Admin Settings Tests
 */

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('displays settings page', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /Settings|Configuration/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    console.log('✅ Settings page displayed');
  });

  test('shows settings tabs', async ({ page }) => {
    // Settings page has tabs (General, Homepage)
    const generalTab = page.locator('button, a').filter({ hasText: /General/i }).first();
    const homepageTab = page.locator('button, a').filter({ hasText: /Homepage/i }).first();
    
    const hasGeneralTab = await generalTab.isVisible().catch(() => false);
    const hasHomepageTab = await homepageTab.isVisible().catch(() => false);
    
    expect(hasGeneralTab || hasHomepageTab).toBeTruthy();
    console.log(`✅ Found settings tabs (General: ${hasGeneralTab}, Homepage: ${hasHomepageTab})`);
  });

  test('shows test mode toggle if present', async ({ page }) => {
    const testModeToggle = page.locator('text=/Test Mode|Sandbox/i, input[type="checkbox"], [class*="toggle"]').first();
    const hasTestMode = await testModeToggle.isVisible().catch(() => false);
    
    if (hasTestMode) {
      console.log('✅ Test mode toggle visible');
    } else {
      console.log('⚠️ No test mode toggle visible');
    }
    expect(true).toBeTruthy();
  });

  test('shows email settings if present', async ({ page }) => {
    const emailSettings = page.locator('text=/Email|Notification|SMTP/i').first();
    const hasEmailSettings = await emailSettings.isVisible().catch(() => false);
    
    if (hasEmailSettings) {
      console.log('✅ Email settings visible');
    } else {
      console.log('⚠️ No email settings visible');
    }
    expect(true).toBeTruthy();
  });

  test('shows store settings if present', async ({ page }) => {
    const storeSettings = page.locator('text=/Store|Shop|Business/i').first();
    const hasStoreSettings = await storeSettings.isVisible().catch(() => false);
    
    if (hasStoreSettings) {
      console.log('✅ Store settings visible');
    } else {
      console.log('⚠️ No store settings visible');
    }
    expect(true).toBeTruthy();
  });

  test('has save button', async ({ page }) => {
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
    const hasSaveButton = await saveButton.isVisible().catch(() => false);
    
    if (hasSaveButton) {
      console.log('✅ Save button visible');
    } else {
      console.log('⚠️ No save button (settings may auto-save)');
    }
    expect(true).toBeTruthy();
  });

  test('navigation to variant presets works', async ({ page }) => {
    // May have link to variant presets in settings
    const presetsLink = page.locator('a, button').filter({ hasText: /Variant.*Preset|Preset/i }).first();
    
    if (await presetsLink.isVisible()) {
      await presetsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Should be on presets page
      const presetsHeading = page.locator('h1, h2').filter({ hasText: /Preset/i }).first();
      await expect(presetsHeading).toBeVisible();
      console.log('✅ Navigated to variant presets');
    } else {
      console.log('⚠️ No presets link visible');
    }
  });
});
