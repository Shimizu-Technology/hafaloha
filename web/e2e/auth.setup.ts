import { test as setup, expect } from '@playwright/test';

const ADMIN_AUTH_FILE = 'playwright/.auth/admin.json';

/**
 * Clerk Authentication Setup for Hafaloha
 * 
 * Prerequisites:
 * 1. Create a test user in Clerk Dashboard
 * 2. Enable "Bypass Client Trust" for the test user (Settings tab in user profile)
 * 3. Sign in once manually to create the user in the database
 * 4. Make the user an admin via Rails console or Admin UI
 * 5. Add credentials to .env:
 *    TEST_USER_EMAIL=test-admin@hafaloha.com
 *    TEST_USER_PASSWORD=your-secure-password
 */
setup('authenticate as admin', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  
  if (!email || !password) {
    console.log('⚠️ No test credentials found in .env');
    console.log('   Add TEST_USER_EMAIL and TEST_USER_PASSWORD to .env');
    console.log('   Skipping auth setup - admin tests will fail');
    
    // Save empty state so tests can still run (they'll fail at auth checks)
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
    return;
  }

  console.log(`🔐 Authenticating as ${email}...`);

  try {
    // Navigate to homepage first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for a sign-in button/link
    // Hafaloha may have different entry points - adjust as needed
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In"), button:has-text("Login"), a:has-text("Login")').first();
    
    if (await signInButton.isVisible()) {
      await signInButton.click();
    } else {
      // If no sign in button visible, user might already be signed in or we need to navigate
      // Try going to admin directly - Clerk will redirect to sign in
      await page.goto('/admin');
    }
    
    // Wait for Clerk sign-in form
    await page.waitForSelector('input[name="identifier"]', { timeout: 15000 });
    
    // Fill email
    await page.fill('input[name="identifier"]', email);
    await page.waitForTimeout(300); // Small delay for Clerk processing
    
    // Click Continue (but NOT "Continue with Google" or other OAuth)
    const continueButton = page.locator('button:has-text("Continue")').filter({ hasNotText: 'Google' });
    await continueButton.first().click();
    
    // Wait for password field to be enabled
    await page.waitForSelector('input[name="password"]:not([disabled])', { timeout: 10000 });
    await page.fill('input[name="password"]', password);
    await page.waitForTimeout(300);
    
    // Submit login
    const submitButton = page.locator('button:has-text("Continue")').filter({ hasNotText: 'Google' });
    await submitButton.first().click();
    
    // Wait for login to complete
    // Look for signs we're logged in - could be UserButton, admin link, etc.
    await page.waitForSelector('[class*="cl-userButton"], a:has-text("Admin"), a:has-text("Dashboard")', { timeout: 15000 });
    
    // Navigate to admin dashboard to verify access
    await page.goto('/admin');
    await page.waitForURL('**/admin**', { timeout: 10000 });
    
    // Verify we're on admin page
    await expect(page.locator('h1, h2').filter({ hasText: /Dashboard|Admin|Orders|Products/ }).first()).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Authentication successful!');
    
    // Save auth state
    await page.context().storageState({ path: ADMIN_AUTH_FILE });
    
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'playwright-report/auth-failure.png' });
    
    // DON'T overwrite existing auth state - we might have a valid session from before
    // Only save if the file doesn't exist at all
    const fs = await import('fs');
    if (!fs.existsSync(ADMIN_AUTH_FILE)) {
      await page.context().storageState({ path: ADMIN_AUTH_FILE });
    }
    
    throw error;
  }
});
