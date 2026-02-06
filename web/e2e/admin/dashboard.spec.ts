import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('displays dashboard page', async ({ page }) => {
    // Should have dashboard heading
    await expect(page.locator('h1, h2').filter({ hasText: /Dashboard/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows navigation sidebar', async ({ page }) => {
    // Should have sidebar with navigation links
    const sidebar = page.locator('nav, aside').first();
    await expect(sidebar).toBeVisible();
    
    // Should have key nav items
    await expect(page.locator('a:has-text("Orders"), button:has-text("Orders")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Products"), button:has-text("Products")').first()).toBeVisible();
  });

  test('can navigate to orders page', async ({ page }) => {
    // Click Orders link
    await page.click('a:has-text("Orders")');
    
    // Should be on orders page
    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.locator('h1, h2').filter({ hasText: /Orders/i }).first()).toBeVisible();
  });

  test('can navigate to products page', async ({ page }) => {
    // Click Products link
    await page.click('a:has-text("Products")');
    
    // Should be on products page
    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.locator('h1, h2').filter({ hasText: /Products/i }).first()).toBeVisible();
  });

  test('can navigate to fundraisers page', async ({ page }) => {
    // Click Fundraisers link
    await page.click('a:has-text("Fundraisers")');
    
    // Should be on fundraisers page
    await expect(page).toHaveURL(/\/admin\/fundraisers/);
    await expect(page.locator('h1, h2').filter({ hasText: /Fundraisers/i }).first()).toBeVisible();
  });

  test('can navigate to Acai Cakes page', async ({ page }) => {
    // Click Acai Cakes link in sidebar (not the main nav link to /acai-cakes)
    // The sidebar link should have "Acai Cakes" or be in the admin aside/nav
    const sidebarAcaiLink = page.locator('aside a:has-text("Acai"), [class*="sidebar"] a:has-text("Acai")').first();
    await sidebarAcaiLink.click();
    
    // Should be on admin acai page
    await expect(page).toHaveURL(/\/admin\/acai/);
  });

  test('can navigate to Users page', async ({ page }) => {
    // Click Users link
    await page.click('a:has-text("Users")');
    
    // Should be on users page
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator('h1, h2').filter({ hasText: /Users/i }).first()).toBeVisible();
  });
});
