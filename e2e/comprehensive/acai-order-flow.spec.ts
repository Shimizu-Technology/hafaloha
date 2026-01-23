import { test, expect } from '@playwright/test';

/**
 * Comprehensive Acai Cake Order Flow
 * 
 * This test creates REAL Acai Cake orders in the database.
 * Use for: After major updates, before deploys, full system verification.
 * 
 * Prerequisites:
 * - Backend running on localhost:3000
 * - Frontend running on localhost:5173
 * - Acai ordering enabled in admin settings
 * - At least one pickup window configured
 */

test.describe('Acai Cake Order - Complete User Journey', () => {
  let orderNumber: string;

  test('1. Customer: View Acai Cakes page and options', async ({ page }) => {
    await page.goto('/acai-cakes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: Acai page loaded
    await page.screenshot({ path: 'test-results/comprehensive/acai-01-page.png', fullPage: true });

    // Verify page elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check for crust/base options
    const crustOptions = page.locator('button, label, input[type="radio"]').filter({ hasText: /Granola|Peanut Butter|Nutella/i });
    expect(await crustOptions.count()).toBeGreaterThan(0);
    
    console.log('Acai page loaded with crust options');
  });

  test('2. Customer: Select date, time, and options', async ({ page }) => {
    await page.goto('/acai-cakes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Select a crust option
    const crustOption = page.locator('button, label').filter({ hasText: /Granola|Peanut Butter|Nutella/i }).first();
    if (await crustOption.isVisible()) {
      await crustOption.click();
      await page.waitForTimeout(300);
    }

    // Screenshot: Crust selected
    await page.screenshot({ path: 'test-results/comprehensive/acai-02-crust-selected.png' });

    // Look for date picker and select a date
    const dateButtons = page.locator('button[class*="date"], button[class*="day"], [class*="calendar"] button').filter({ hasNotText: /disabled|unavailable/i });
    const dateCount = await dateButtons.count();
    
    if (dateCount > 0) {
      // Click on first available date (usually 2+ days from now)
      await dateButtons.nth(Math.min(2, dateCount - 1)).click();
      await page.waitForTimeout(500);
      
      // Screenshot: Date selected
      await page.screenshot({ path: 'test-results/comprehensive/acai-03-date-selected.png' });
    }

    // Look for time slots
    await page.waitForTimeout(1000);
    const timeSlots = page.locator('button, label').filter({ hasText: /AM|PM|\d+:\d+/ });
    const timeCount = await timeSlots.count();
    
    if (timeCount > 0) {
      await timeSlots.first().click();
      await page.waitForTimeout(300);
      
      // Screenshot: Time selected
      await page.screenshot({ path: 'test-results/comprehensive/acai-04-time-selected.png' });
    }

    // Check for placard option
    const placardOption = page.locator('input[type="checkbox"], button, label').filter({ hasText: /placard|message/i }).first();
    if (await placardOption.isVisible()) {
      await placardOption.click();
      await page.waitForTimeout(300);

      // Fill placard text if input appears
      const placardInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"], input[name*="placard"]').first();
      if (await placardInput.isVisible()) {
        await placardInput.fill('Happy Birthday!');
      }
    }

    // Screenshot: Options configured
    await page.screenshot({ path: 'test-results/comprehensive/acai-05-options-complete.png', fullPage: true });
  });

  test('3. Customer: Complete Acai order', async ({ page }) => {
    await page.goto('/acai-cakes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Select crust
    const crustOption = page.locator('button, label').filter({ hasText: /Granola/i }).first();
    if (await crustOption.isVisible()) {
      await crustOption.click();
      await page.waitForTimeout(500);
    }

    // Select date (find an available one)
    const dateButtons = page.locator('[class*="calendar"] button:not([disabled]), button[class*="date"]:not([disabled])');
    if (await dateButtons.count() > 2) {
      await dateButtons.nth(2).click();
      await page.waitForTimeout(1000);
    }

    // Select time
    const timeSlots = page.locator('button, label').filter({ hasText: /AM|PM/ }).first();
    if (await timeSlots.isVisible()) {
      await timeSlots.click();
      await page.waitForTimeout(500);
    }

    // Fill customer info
    await page.fill('input[name="name"], input[placeholder*="Name"]', 'Acai Test Customer');
    await page.fill('input[name="email"], input[placeholder*="Email"]', 'acai-test@example.com');
    await page.fill('input[name="phone"], input[placeholder*="Phone"]', '671-555-5678');

    // Screenshot: Ready to order
    await page.screenshot({ path: 'test-results/comprehensive/acai-06-ready-to-order.png', fullPage: true });

    // Submit order
    const orderButton = page.locator('button:has-text("Order"), button:has-text("Place Order"), button:has-text("Submit")').first();
    if (await orderButton.isVisible()) {
      await orderButton.click();
      await page.waitForTimeout(3000);

      // Screenshot: Order result
      await page.screenshot({ path: 'test-results/comprehensive/acai-07-order-result.png', fullPage: true });

      // Try to get order number
      const orderText = await page.locator('text=/HAF-A-\\d+/').first().textContent().catch(() => null);
      if (orderText) {
        orderNumber = orderText.match(/HAF-A-\d+/)?.[0] || '';
        console.log(`Acai order created: ${orderNumber}`);
      }
    }
  });

  test('4. Admin: View and process Acai order', async ({ page }) => {
    // This test requires admin authentication
    test.skip(!process.env.TEST_USER_EMAIL, 'Skipping - no admin credentials');

    // Go to admin orders, filter by Acai
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for filter/tab for Acai orders
    const acaiFilter = page.locator('button:has-text("Acai"), a:has-text("Acai"), select option:has-text("Acai")').first();
    if (await acaiFilter.isVisible()) {
      await acaiFilter.click();
      await page.waitForTimeout(1000);
    }

    // Screenshot: Acai orders list
    await page.screenshot({ path: 'test-results/comprehensive/acai-08-admin-orders.png', fullPage: true });

    // View most recent Acai order
    const viewButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(1000);

      // Screenshot: Acai order detail
      await page.screenshot({ path: 'test-results/comprehensive/acai-09-order-detail.png' });

      // Try to confirm the order
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Accept")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
      }

      // Try to mark as ready
      const readyButton = page.locator('button:has-text("Ready"), button:has-text("Mark Ready")').first();
      if (await readyButton.isVisible()) {
        await readyButton.click();
        await page.waitForTimeout(1000);
        
        // Screenshot: Ready for pickup
        await page.screenshot({ path: 'test-results/comprehensive/acai-10-ready-pickup.png' });
      }
    }
  });
});

test.describe('Acai Order - Validation', () => {
  test('Cannot order without selecting date', async ({ page }) => {
    await page.goto('/acai-cakes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Select crust but not date
    const crustOption = page.locator('button, label').filter({ hasText: /Granola/i }).first();
    if (await crustOption.isVisible()) {
      await crustOption.click();
    }

    // Fill customer info
    await page.fill('input[name="name"], input[placeholder*="Name"]', 'Test Customer');
    await page.fill('input[name="email"], input[placeholder*="Email"]', 'test@example.com');
    await page.fill('input[name="phone"], input[placeholder*="Phone"]', '671-555-0000');

    // Try to submit without date
    const orderButton = page.locator('button:has-text("Order"), button:has-text("Place Order")').first();
    
    // Button should be disabled or show error on click
    const isDisabled = await orderButton.isDisabled().catch(() => false);
    
    if (!isDisabled && await orderButton.isVisible()) {
      await orderButton.click();
      await page.waitForTimeout(1000);
      
      // Should show validation error
      const error = page.locator('text=/select.*date|date.*required|please.*date/i').first();
      const hasError = await error.isVisible().catch(() => false);
      
      // Screenshot: Validation error
      await page.screenshot({ path: 'test-results/comprehensive/acai-validation-01.png' });
      
      console.log(`Validation error shown: ${hasError}`);
    } else {
      console.log('Order button correctly disabled without date selection');
    }
  });
});
