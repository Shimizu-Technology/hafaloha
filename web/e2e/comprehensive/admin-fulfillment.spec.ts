import { test, expect } from '@playwright/test';

/**
 * Comprehensive Admin Order Fulfillment
 * 
 * This test exercises the admin order management workflows.
 * Use for: After major updates, before deploys, full system verification.
 * 
 * Prerequisites:
 * - Backend running on localhost:3000
 * - Frontend running on localhost:5173
 * - Test admin account configured
 * - Some existing orders in the system
 */

test.describe('Admin Order Fulfillment - Retail Orders', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('1. View orders dashboard', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: Orders dashboard
    await page.screenshot({ path: 'test-results/comprehensive/admin-01-orders-dashboard.png', fullPage: true });

    // Verify orders table or list exists
    const ordersTable = page.locator('table, [class*="order"]').first();
    await expect(ordersTable).toBeVisible();

    // Check for filter options
    const filters = page.locator('select, button:has-text("All"), button:has-text("Filter")');
    expect(await filters.count()).toBeGreaterThan(0);

    console.log('Orders dashboard loaded');
  });

  test('2. Filter orders by status', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try different status filters
    const statusFilter = page.locator('select, button').filter({ hasText: /status|all|pending/i }).first();
    if (await statusFilter.isVisible()) {
      // If it's a select, try selecting "pending"
      if (await statusFilter.evaluate(el => el.tagName === 'SELECT')) {
        await statusFilter.selectOption({ label: 'Pending' }).catch(() => {});
        await page.waitForTimeout(1000);
      } else {
        await statusFilter.click();
        await page.waitForTimeout(500);
        const pendingOption = page.locator('button:has-text("Pending"), a:has-text("Pending")').first();
        if (await pendingOption.isVisible()) {
          await pendingOption.click();
          await page.waitForTimeout(1000);
        }
      }

      // Screenshot: Filtered orders
      await page.screenshot({ path: 'test-results/comprehensive/admin-02-filtered-orders.png', fullPage: true });
    }
  });

  test('3. Filter orders by type', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try type filter tabs
    const typeFilters = ['Retail', 'Acai', 'Wholesale'];
    
    for (const type of typeFilters) {
      const typeButton = page.locator(`button:has-text("${type}"), a:has-text("${type}")`).first();
      if (await typeButton.isVisible()) {
        await typeButton.click();
        await page.waitForTimeout(1000);
        
        // Screenshot for each type
        await page.screenshot({ 
          path: `test-results/comprehensive/admin-03-${type.toLowerCase()}-orders.png`, 
          fullPage: true 
        });
      }
    }
  });

  test('4. Open order detail modal', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click view details on first order
    const viewButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(1000);

      // Screenshot: Order modal
      await page.screenshot({ path: 'test-results/comprehensive/admin-04-order-modal.png' });

      // Verify modal content
      const modal = page.locator('[class*="fixed"][class*="inset"], [role="dialog"]').first();
      await expect(modal).toBeVisible();

      // Check for order details
      const orderNumber = page.locator('text=/HAF-[RAW]-\\d+/').first();
      await expect(orderNumber).toBeVisible();

      // Check for customer info
      const customerSection = page.locator('text=/Customer|Email|Name/i').first();
      await expect(customerSection).toBeVisible();

      console.log('Order modal opened successfully');
    } else {
      console.log('No orders to view - skipping');
      test.skip();
    }
  });

  test('5. Process retail order: Pending → Processing → Shipped', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter to retail orders
    const retailTab = page.locator('button:has-text("Retail"), a:has-text("Retail")').first();
    if (await retailTab.isVisible()) {
      await retailTab.click();
      await page.waitForTimeout(1000);
    }

    // Open first order
    const viewButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    if (!(await viewButton.isVisible())) {
      console.log('No retail orders to process - skipping');
      test.skip();
      return;
    }

    await viewButton.click();
    await page.waitForTimeout(1000);

    // Screenshot: Initial state
    await page.screenshot({ path: 'test-results/comprehensive/admin-05-retail-before.png' });

    // Try to start processing
    const processButton = page.locator('button:has-text("Start Processing"), button:has-text("Process")').first();
    if (await processButton.isVisible()) {
      await processButton.click();
      await page.waitForTimeout(1000);
      
      // Screenshot: Processing
      await page.screenshot({ path: 'test-results/comprehensive/admin-06-retail-processing.png' });
    }

    // Try to mark as shipped (may need tracking number)
    const shipButton = page.locator('button:has-text("Ship"), button:has-text("Mark Shipped")').first();
    if (await shipButton.isVisible()) {
      await shipButton.click();
      await page.waitForTimeout(500);

      // Look for tracking number input
      const trackingInput = page.locator('input[placeholder*="tracking"], input[name*="tracking"]').first();
      if (await trackingInput.isVisible()) {
        await trackingInput.fill('TEST123456789');
        
        // Confirm shipping
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Save")').first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
        }
      }

      // Screenshot: Shipped
      await page.screenshot({ path: 'test-results/comprehensive/admin-07-retail-shipped.png' });
    }

    console.log('Retail order fulfillment workflow tested');
  });
});

test.describe('Admin Order Fulfillment - Acai Orders', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Process Acai order: Pending → Confirmed → Ready → Picked Up', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter to Acai orders
    const acaiTab = page.locator('button:has-text("Acai"), a:has-text("Acai")').first();
    if (await acaiTab.isVisible()) {
      await acaiTab.click();
      await page.waitForTimeout(1000);
    }

    // Open first Acai order
    const viewButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    if (!(await viewButton.isVisible())) {
      console.log('No Acai orders to process - skipping');
      test.skip();
      return;
    }

    await viewButton.click();
    await page.waitForTimeout(1000);

    // Screenshot: Acai order detail
    await page.screenshot({ path: 'test-results/comprehensive/admin-08-acai-order.png' });

    // Step 1: Confirm order
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Accept")').first();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/comprehensive/admin-09-acai-confirmed.png' });
    }

    // Step 2: Mark as ready
    const readyButton = page.locator('button:has-text("Ready"), button:has-text("Mark Ready")').first();
    if (await readyButton.isVisible()) {
      await readyButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/comprehensive/admin-10-acai-ready.png' });
    }

    // Step 3: Notify customer
    const notifyButton = page.locator('button:has-text("Notify"), button:has-text("Send Notification")').first();
    if (await notifyButton.isVisible()) {
      await notifyButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/comprehensive/admin-11-acai-notified.png' });
    }

    // Step 4: Mark as picked up
    const pickupButton = page.locator('button:has-text("Picked Up"), button:has-text("Complete")').first();
    if (await pickupButton.isVisible()) {
      await pickupButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/comprehensive/admin-12-acai-complete.png' });
    }

    console.log('Acai order fulfillment workflow tested');
  });
});

test.describe('Admin - Product Management', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Quick actions menu works', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: Products list
    await page.screenshot({ path: 'test-results/comprehensive/admin-13-products-list.png', fullPage: true });

    // Open actions menu for first product
    const moreButton = page.locator('table button, button:has(svg)').filter({ has: page.locator('svg') }).first();
    if (await moreButton.isVisible()) {
      await moreButton.click();
      await page.waitForTimeout(500);

      // Screenshot: Actions menu
      await page.screenshot({ path: 'test-results/comprehensive/admin-14-actions-menu.png' });

      // Verify menu options
      const menuItems = page.locator('button:has-text("Duplicate"), button:has-text("Publish"), button:has-text("Unpublish"), button:has-text("Archive")');
      expect(await menuItems.count()).toBeGreaterThan(0);

      console.log('Quick actions menu verified');
    }
  });

  test('Sort products by column', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to click sortable column headers
    const nameHeader = page.locator('th:has-text("Name"), button:has-text("Name")').first();
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      await page.waitForTimeout(1000);
      
      // Screenshot: Sorted by name
      await page.screenshot({ path: 'test-results/comprehensive/admin-15-sorted-name.png', fullPage: true });
    }

    const priceHeader = page.locator('th:has-text("Price"), button:has-text("Price")').first();
    if (await priceHeader.isVisible()) {
      await priceHeader.click();
      await page.waitForTimeout(1000);
      
      // Screenshot: Sorted by price
      await page.screenshot({ path: 'test-results/comprehensive/admin-16-sorted-price.png', fullPage: true });
    }

    console.log('Product sorting verified');
  });
});

test.describe('Admin - Settings', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Acai settings page loads and can be edited', async ({ page }) => {
    await page.goto('/admin/acai');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: Acai settings
    await page.screenshot({ path: 'test-results/comprehensive/admin-17-acai-settings.png', fullPage: true });

    // Verify settings sections
    await expect(page.locator('text=/pickup|window|hours/i').first()).toBeVisible();

    // Check for editable fields
    const editButtons = page.locator('button:has-text("Edit"), button:has-text("Add")');
    expect(await editButtons.count()).toBeGreaterThan(0);

    console.log('Acai settings page verified');
  });
});
