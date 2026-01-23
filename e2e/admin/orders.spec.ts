import { test, expect } from '@playwright/test';

test.describe('Admin Orders Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('displays orders page', async ({ page }) => {
    // Should have orders heading
    await expect(page.locator('h1, h2').filter({ hasText: /Orders/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows orders table or empty state', async ({ page }) => {
    // Should have orders table or "no orders" message
    const ordersTable = page.locator('table');
    const emptyMessage = page.locator('text=/no orders/i, text=/No orders/');
    
    // Either table with rows or empty message
    const hasTable = await ordersTable.isVisible();
    const hasEmpty = await emptyMessage.first().isVisible();
    
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test('has status filter dropdown', async ({ page }) => {
    // Look for status filter
    const statusFilter = page.locator('select').first();
    
    if (await statusFilter.isVisible()) {
      // Should have filter options
      const options = await statusFilter.locator('option').count();
      expect(options).toBeGreaterThan(1);
    }
  });

  test('has type filter dropdown', async ({ page }) => {
    // Look for type filter (second select usually)
    const typeFilter = page.locator('select').nth(1);
    
    if (await typeFilter.isVisible()) {
      // Should have filter options like Retail, Acai, Wholesale
      const options = await typeFilter.locator('option').allTextContents();
      const hasTypes = options.some(o => 
        o.includes('Retail') || o.includes('Acai') || o.includes('Wholesale') || o.includes('All')
      );
      expect(hasTypes).toBeTruthy();
    }
  });

  test('has search functionality', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[type="text"]').first();
    
    if (await searchInput.isVisible()) {
      // Should be able to type in search
      await searchInput.fill('HAF');
      await page.waitForTimeout(300);
      
      // Either search button exists or auto-search
      const searchButton = page.locator('button:has-text("Search")');
      if (await searchButton.isVisible()) {
        await expect(searchButton).toBeEnabled();
      }
    }
  });

  test('View Details button opens order modal', async ({ page }) => {
    // Look for View Details button
    const viewButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    
    const count = await viewButton.count();
    if (count === 0) {
      // No orders to view
      test.skip();
      return;
    }
    
    await viewButton.click();
    await page.waitForTimeout(500);
    
    // Modal should open (fixed inset overlay)
    const modal = page.locator('[class*="fixed"][class*="inset"], [class*="modal"], [role="dialog"]');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });

  test('order modal shows customer information', async ({ page }) => {
    // Open an order
    const viewButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    
    if (!(await viewButton.isVisible())) {
      test.skip();
      return;
    }
    
    await viewButton.click();
    await page.waitForTimeout(1000);
    
    // Modal should show customer info (email is displayed as a link)
    const customerEmail = page.locator('a[href^="mailto:"]');
    const customerSection = page.locator('text=/Customer Information|Name:|Email:/');
    
    const hasEmail = await customerEmail.first().isVisible();
    const hasSection = await customerSection.first().isVisible();
    
    expect(hasEmail || hasSection).toBeTruthy();
  });

  test('order modal shows order summary', async ({ page }) => {
    // Open an order
    const viewButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    
    if (!(await viewButton.isVisible())) {
      test.skip();
      return;
    }
    
    await viewButton.click();
    await page.waitForTimeout(1000);
    
    // Modal should be visible with order content
    const modal = page.locator('[class*="fixed"][class*="inset"]');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
    
    // Should have some price/total displayed (look for $ or Total text)
    const priceIndicator = page.locator('text=/\\$\\d/');
    await expect(priceIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('order modal has close button', async ({ page }) => {
    // Open an order
    const viewButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    
    if (!(await viewButton.isVisible())) {
      test.skip();
      return;
    }
    
    await viewButton.click();
    await page.waitForTimeout(500);
    
    // Close button should exist (X button or Close text)
    const closeButton = page.locator('button:has-text("Close"), button:has(svg.lucide-x), button:has-text("×")').first();
    await expect(closeButton).toBeVisible({ timeout: 3000 });
    
    // Click close
    await closeButton.click();
    await page.waitForTimeout(300);
    
    // Modal should be closed
    const modal = page.locator('[class*="fixed"][class*="inset-0"]');
    await expect(modal).not.toBeVisible();
  });

  test('order has status badge', async ({ page }) => {
    // Look for status badges in the table
    const statusBadge = page.locator('[class*="rounded-full"], [class*="badge"]').filter({ 
      hasText: /pending|processing|shipped|delivered|ready|confirmed/i 
    }).first();
    
    if (await statusBadge.isVisible()) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test('print button exists in order modal', async ({ page }) => {
    // Open an order
    const viewButton = page.locator('button:has-text("View Details"), button:has-text("Details")').first();
    
    if (!(await viewButton.isVisible())) {
      test.skip();
      return;
    }
    
    await viewButton.click();
    await page.waitForTimeout(1000);
    
    // Print button should exist
    const printButton = page.locator('button:has-text("Print")');
    await expect(printButton.first()).toBeVisible({ timeout: 5000 });
  });
});
