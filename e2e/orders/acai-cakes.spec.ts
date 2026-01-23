import { test, expect } from '@playwright/test';

test.describe('Acai Cakes Ordering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/acai-cakes');
    await page.waitForLoadState('networkidle');
  });

  test('displays acai cakes page', async ({ page }) => {
    // Should have page heading
    await expect(page.locator('h1, h2').filter({ hasText: /Acai/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows base selection options', async ({ page }) => {
    // Should have base/size options
    const baseOptions = page.locator('button, label, [role="radio"]').filter({ hasText: /Classic|Peanut|Small|Medium|Large/ });
    await expect(baseOptions.first()).toBeVisible({ timeout: 10000 });
  });

  test('can select a base option', async ({ page }) => {
    // Click on a base option
    const baseButton = page.locator('button, label, [role="radio"]').filter({ hasText: /Classic|Peanut/ }).first();
    
    if (await baseButton.isVisible()) {
      await baseButton.click();
      await page.waitForTimeout(500);
      
      // Should be selected (has active state)
      await expect(baseButton).toHaveClass(/active|selected|checked/);
    }
  });

  test('shows date picker for pickup', async ({ page }) => {
    // Should have date selection
    const datePicker = page.locator('input[type="date"], [class*="calendar"], [class*="date"]');
    await expect(datePicker.first()).toBeVisible({ timeout: 10000 });
  });

  test('shows available time slots', async ({ page }) => {
    // Select a date first (if date picker is present)
    const datePicker = page.locator('input[type="date"]').first();
    
    if (await datePicker.isVisible()) {
      // Select tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2); // Day after tomorrow for 24hr rule
      await datePicker.fill(tomorrow.toISOString().split('T')[0]);
      await page.waitForTimeout(500);
    }
    
    // Should show time slots
    const timeSlots = page.locator('button, [role="radio"]').filter({ hasText: /AM|PM|:\d{2}/ });
    await expect(timeSlots.first()).toBeVisible({ timeout: 10000 });
  });

  test('can select a time slot', async ({ page }) => {
    // Select a date first
    const datePicker = page.locator('input[type="date"]').first();
    
    if (await datePicker.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      await datePicker.fill(tomorrow.toISOString().split('T')[0]);
      await page.waitForTimeout(500);
    }
    
    // Click a time slot
    const timeSlot = page.locator('button, [role="radio"]').filter({ hasText: /AM|PM/ }).first();
    
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
      await page.waitForTimeout(500);
    }
  });

  test('shows placard options', async ({ page }) => {
    // Should have placard/message options
    const placardSection = page.locator('text=Placard, text=Message, text=Custom');
    await expect(placardSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('can enter placard message', async ({ page }) => {
    // Look for placard text input
    const placardInput = page.locator('input[name*="placard"], input[name*="message"], textarea').first();
    
    if (await placardInput.isVisible()) {
      await placardInput.fill('Happy Birthday!');
      await page.waitForTimeout(300);
      
      // Should have the text
      await expect(placardInput).toHaveValue('Happy Birthday!');
    }
  });

  test('shows order summary with price', async ({ page }) => {
    // Select a base
    const baseButton = page.locator('button, label').filter({ hasText: /Classic|Peanut/ }).first();
    if (await baseButton.isVisible()) {
      await baseButton.click();
      await page.waitForTimeout(500);
    }
    
    // Should show price
    await expect(page.locator('text=/$/')).toBeVisible();
  });

  test('requires customer information', async ({ page }) => {
    // Should have customer info fields
    await expect(page.locator('input[name*="name"], input[placeholder*="Name"]').first()).toBeVisible();
    await expect(page.locator('input[name*="email"], input[type="email"]').first()).toBeVisible();
  });

  test('24-hour advance notice is enforced', async ({ page }) => {
    // Try to select today's date (should not be available)
    const datePicker = page.locator('input[type="date"]').first();
    
    if (await datePicker.isVisible()) {
      const today = new Date();
      await datePicker.fill(today.toISOString().split('T')[0]);
      await page.waitForTimeout(500);
      
      // Should show warning or no available slots
      const warning = page.locator('text=24 hour, text=advance, text=not available');
      const noSlots = page.locator('text=No available, text=no slots');
      
      await expect(warning.or(noSlots).first()).toBeVisible();
    }
  });

  test('shows add to cart or order button', async ({ page }) => {
    // Should have order/add to cart button
    const orderButton = page.locator('button:has-text("Add to Cart"), button:has-text("Order"), button:has-text("Continue")').first();
    await expect(orderButton).toBeVisible();
  });

  test('can complete acai order form', async ({ page }) => {
    // Select base
    const baseButton = page.locator('button, label').filter({ hasText: /Classic/ }).first();
    if (await baseButton.isVisible()) {
      await baseButton.click();
      await page.waitForTimeout(300);
    }
    
    // Select date (day after tomorrow)
    const datePicker = page.locator('input[type="date"]').first();
    if (await datePicker.isVisible()) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      await datePicker.fill(futureDate.toISOString().split('T')[0]);
      await page.waitForTimeout(500);
    }
    
    // Select time slot
    const timeSlot = page.locator('button, [role="radio"]').filter({ hasText: /AM|PM/ }).first();
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
      await page.waitForTimeout(300);
    }
    
    // Fill customer info
    await page.fill('input[name*="name"], input[placeholder*="Name"]', 'Test Customer');
    await page.fill('input[name*="email"], input[type="email"]', 'test@example.com');
    
    // Fill phone if present
    const phoneInput = page.locator('input[name*="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('671-555-1234');
    }
    
    // Form should be ready (add to cart button enabled)
    const orderButton = page.locator('button:has-text("Add to Cart"), button:has-text("Order")').first();
    
    // Button should exist (may be disabled if payment not set up in test mode)
    await expect(orderButton).toBeVisible();
  });
});
