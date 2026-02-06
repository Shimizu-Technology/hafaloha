import { test, expect, devices } from '@playwright/test';

/**
 * Mobile Admin Flow Tests
 * 
 * Tests admin functionality on mobile viewport.
 * Critical for admins who manage orders from phones.
 */

// Use iPhone 13 viewport
test.use({
  ...devices['iPhone 13'],
  storageState: 'playwright/.auth/admin.json',
});

test.describe('Mobile Admin - Dashboard & Navigation', () => {
  test('Admin dashboard renders on mobile', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: Mobile admin dashboard
    await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-01-dashboard.png', fullPage: true });

    // Verify key elements are visible
    const dashboard = page.locator('text=/dashboard|orders|products/i').first();
    await expect(dashboard).toBeVisible();

    console.log('Mobile admin dashboard loaded');
  });

  test('Mobile admin navigation works', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for mobile menu button (hamburger)
    const menuButton = page.locator('button:has(svg), button[aria-label*="menu"]').first();
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Screenshot: Mobile menu open
      await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-02-menu-open.png' });

      // Look for nav items
      const navItems = page.locator('a:has-text("Orders"), a:has-text("Products"), a:has-text("Fundraisers")');
      expect(await navItems.count()).toBeGreaterThan(0);

      console.log('Mobile navigation menu works');
    } else {
      // Admin might have sidebar always visible
      console.log('No hamburger menu - admin may have different mobile layout');
      await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-02-layout.png', fullPage: true });
    }
  });

  test('Navigate to different admin sections', async ({ page }) => {
    const sections = [
      { path: '/admin/orders', name: 'orders' },
      { path: '/admin/products', name: 'products' },
      { path: '/admin/fundraisers', name: 'fundraisers' },
      { path: '/admin/acai', name: 'acai' },
    ];

    for (const section of sections) {
      await page.goto(section.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Screenshot each section
      await page.screenshot({ 
        path: `test-results/comprehensive/mobile-admin-03-${section.name}.png`, 
        fullPage: true 
      });

      console.log(`Mobile admin ${section.name} page loaded`);
    }
  });
});

test.describe('Mobile Admin - Order Management', () => {
  test('View orders list on mobile', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: Orders list
    await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-04-orders-list.png', fullPage: true });

    // Check for orders or empty state
    const hasOrders = (await page.content()).includes('HAF-') || 
                      (await page.locator('table, [class*="order"]').count()) > 0;
    
    console.log(`Mobile orders list: ${hasOrders ? 'Has orders' : 'Empty or different layout'}`);
  });

  test('Open order detail on mobile', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to open an order
    const viewButton = page.locator('button:has-text("View"), button:has-text("Details"), tr').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(1000);

      // Screenshot: Order detail modal on mobile
      await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-05-order-detail.png', fullPage: true });

      // Check if modal/detail is readable
      const orderContent = page.locator('[class*="modal"], [class*="dialog"], [class*="detail"]').first();
      if (await orderContent.isVisible()) {
        console.log('Order detail modal opens correctly on mobile');
      }
    } else {
      console.log('No orders to view on mobile');
    }
  });

  test('Change order status on mobile', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open first order
    const viewButton = page.locator('button:has-text("View"), button:has-text("Details")').first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(1000);

      // Look for status change buttons
      const statusButtons = page.locator('button:has-text("Process"), button:has-text("Ship"), button:has-text("Ready"), button:has-text("Confirm")');
      const buttonCount = await statusButtons.count();
      
      console.log(`Found ${buttonCount} status action buttons on mobile`);
      
      // Screenshot: Status buttons visible
      await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-06-status-buttons.png' });

      // Verify buttons are tappable (minimum 44px height)
      if (buttonCount > 0) {
        const firstButton = statusButtons.first();
        const box = await firstButton.boundingBox();
        if (box) {
          console.log(`Button size: ${box.width}x${box.height}px`);
          if (box.height < 44) {
            console.warn('Warning: Button may be too small for comfortable mobile tapping');
          }
        }
      }
    }
  });
});

test.describe('Mobile Admin - Product Management', () => {
  test('View products list on mobile', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: Products list
    await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-07-products.png', fullPage: true });

    // Check table scrolls horizontally or has responsive layout
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      const tableBox = await table.boundingBox();
      const viewport = page.viewportSize();
      
      if (tableBox && viewport) {
        console.log(`Table width: ${tableBox.width}px, Viewport: ${viewport.width}px`);
        if (tableBox.width > viewport.width) {
          console.log('Table requires horizontal scroll on mobile');
        }
      }
    }
  });

  test('Quick actions work on mobile', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find actions menu button
    const actionsButton = page.locator('button:has(svg)').filter({ has: page.locator('svg') }).first();
    
    if (await actionsButton.isVisible()) {
      await actionsButton.click();
      await page.waitForTimeout(500);

      // Screenshot: Actions menu on mobile
      await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-08-actions-menu.png' });

      // Check if menu items are visible
      const menuItems = page.locator('button:has-text("Duplicate"), button:has-text("Publish"), button:has-text("Archive")');
      console.log(`Actions menu items visible: ${await menuItems.count()}`);
    }
  });
});

test.describe('Mobile Admin - Fundraiser Management', () => {
  test('View fundraisers on mobile', async ({ page }) => {
    await page.goto('/admin/fundraisers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: Fundraisers list
    await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-09-fundraisers.png', fullPage: true });
  });

  test('Fundraiser detail tabs work on mobile', async ({ page }) => {
    await page.goto('/admin/fundraisers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click on first fundraiser
    const manageLink = page.locator('a:has-text("Manage")').first();
    
    if (await manageLink.isVisible()) {
      await manageLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Screenshot: Fundraiser detail
      await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-10-fundraiser-detail.png', fullPage: true });

      // Test tabs if they exist
      const tabs = page.locator('button:has-text("Participants"), button:has-text("Products"), button:has-text("Orders")');
      
      for (let i = 0; i < await tabs.count(); i++) {
        const tab = tabs.nth(i);
        const tabText = await tab.textContent();
        await tab.click();
        await page.waitForTimeout(500);
        
        // Screenshot each tab
        await page.screenshot({ 
          path: `test-results/comprehensive/mobile-admin-11-tab-${tabText?.toLowerCase().replace(/\s+/g, '-')}.png`, 
          fullPage: true 
        });
      }
    }
  });
});

test.describe('Mobile Admin - Touch Interactions', () => {
  test('Forms are usable on mobile', async ({ page }) => {
    // Go to a page with a form
    await page.goto('/admin/fundraisers/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Screenshot: Form on mobile
    await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-12-form.png', fullPage: true });

    // Check input field sizes
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = inputs.nth(i);
      const box = await input.boundingBox();
      if (box) {
        console.log(`Input ${i + 1} size: ${box.width}x${box.height}px`);
        if (box.height < 44) {
          console.warn(`Input ${i + 1} may be too small for mobile`);
        }
      }
    }
  });

  test('Buttons have adequate tap targets', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check all buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    let smallButtons = 0;
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          smallButtons++;
        }
      }
    }

    console.log(`Checked ${Math.min(buttonCount, 10)} buttons, ${smallButtons} may be too small for mobile`);
    
    // Screenshot: Buttons on mobile
    await page.screenshot({ path: 'test-results/comprehensive/mobile-admin-13-buttons.png' });
  });
});
