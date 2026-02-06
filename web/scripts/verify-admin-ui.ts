/**
 * Visual verification script for admin UI improvements
 * Run with: npx tsx scripts/verify-admin-ui.ts
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = 'test-admin@hafaloha.com';
const TEST_PASSWORD = 'HafalohaAdmin!';

async function verifyAdminUI() {
  console.log('🚀 Starting admin UI verification...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  try {
    // 1. Navigate to homepage
    console.log('1. Navigating to homepage...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Homepage loaded');
    
    // 2. Click Log In / Sign In
    console.log('2. Clicking Log In...');
    const signInButton = page.locator('button:has-text("Log In"), button:has-text("Sign In"), a:has-text("Log In"), a:has-text("Sign In")').first();
    await signInButton.click();
    await page.waitForTimeout(2000);
    console.log('   ✅ Login modal/page opened');
    
    // 3. Enter credentials
    console.log('3. Entering credentials...');
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
    await page.fill('input[name="identifier"]', TEST_EMAIL);
    await page.waitForTimeout(300);
    
    // Click Continue (but NOT "Continue with Google")
    const continueButton = page.locator('button:has-text("Continue")').filter({ hasNotText: 'Google' });
    await continueButton.first().click();
    await page.waitForTimeout(2000);
    
    // Wait for password field to be enabled (Clerk enables it after email verification)
    await page.waitForSelector('input[name="password"]:not([disabled])', { timeout: 10000 });
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.waitForTimeout(300);
    
    // Submit login
    await continueButton.first().click();
    console.log('   ✅ Credentials entered');
    
    // 4. Wait for login to complete
    console.log('4. Waiting for login...');
    await page.waitForURL('**/', { timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('   ✅ Login complete');
    
    // 5. Navigate to Admin Dashboard
    console.log('5. Navigating to /admin...');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true });
    console.log('   ✅ Admin Dashboard screenshot saved');
    
    // 6. Navigate to Admin Products
    console.log('6. Navigating to /admin/products...');
    await page.goto(`${BASE_URL}/admin/products`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/admin-products.png', fullPage: true });
    console.log('   ✅ Admin Products screenshot saved');
    
    // 7. Navigate to Admin Orders
    console.log('7. Navigating to /admin/orders...');
    await page.goto(`${BASE_URL}/admin/orders`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/admin-orders.png', fullPage: true });
    console.log('   ✅ Admin Orders screenshot saved');
    
    // 8. Check public pages too
    console.log('8. Checking public homepage...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
    console.log('   ✅ Homepage screenshot saved');
    
    console.log('9. Checking products page...');
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/products-page.png', fullPage: true });
    console.log('   ✅ Products page screenshot saved');
    
    console.log('10. Checking About/Our Story page...');
    await page.goto(`${BASE_URL}/about`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/about-page.png', fullPage: true });
    console.log('   ✅ About page screenshot saved');
    
    console.log('11. Checking Acai Cakes page...');
    await page.goto(`${BASE_URL}/acai-cakes`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/acai-cakes-page.png', fullPage: true });
    console.log('   ✅ Acai Cakes page screenshot saved');
    
    // Test product detail page
    console.log('12. Checking product detail page...');
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // Click on a product
    const productCard = page.locator('a[href^="/products/"]').first();
    if (await productCard.isVisible()) {
      await productCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/product-detail.png', fullPage: true });
      console.log('   ✅ Product detail screenshot saved');
      
      // Add to cart if button exists
      const addToCartBtn = page.locator('button:has-text("Add to Cart")').first();
      if (await addToCartBtn.isVisible() && await addToCartBtn.isEnabled()) {
        await addToCartBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: 'test-results/cart-drawer.png', fullPage: false });
        console.log('   ✅ Cart drawer screenshot saved');
        
        // Go to checkout
        console.log('13. Checking checkout page...');
        const checkoutBtn = page.locator('button:has-text("Checkout"), button:has-text("Secure Checkout")').first();
        if (await checkoutBtn.isVisible()) {
          await checkoutBtn.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'test-results/checkout-page.png', fullPage: true });
          console.log('   ✅ Checkout page screenshot saved');
        }
      } else {
        console.log('   ⚠️ Add to Cart button not available - skipping');
      }
    }
    
    console.log('\n✅ All verification complete! Screenshots saved to test-results/');
    console.log('\nReview the following screenshots:');
    console.log('  - test-results/admin-dashboard.png');
    console.log('  - test-results/admin-products.png');
    console.log('  - test-results/admin-orders.png');
    console.log('  - test-results/homepage.png');
    console.log('  - test-results/products-page.png');
    console.log('  - test-results/about-page.png');
    console.log('  - test-results/acai-cakes-page.png');
    console.log('  - test-results/product-detail.png');
    console.log('  - test-results/cart-drawer.png');
    console.log('  - test-results/checkout-page.png');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    await page.screenshot({ path: 'test-results/error-state.png' });
  } finally {
    await browser.close();
  }
}

verifyAdminUI();
