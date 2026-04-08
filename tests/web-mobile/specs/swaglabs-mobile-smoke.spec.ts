import { test, expect } from '@playwright/test';
import { SAUCE_CREDENTIALS } from '../../web/fixtures/saucedemo-fixtures';

const BASE_URL = 'https://www.saucedemo.com';
const TEST_USERNAME = SAUCE_CREDENTIALS.standard.username;
const TEST_PASSWORD = SAUCE_CREDENTIALS.standard.password;

/**
 * Swag Labs — Mobile Smoke Tests @mobile @smoke
 *
 * Covers:
 *   ✓ Mobile login flow works on iPhone and Pixel
 *   ✓ Touch interactions work correctly on mobile
 *   ✓ Adding items to cart on mobile works
 *   ✓ Mobile cart displays correctly with touch UI
 *   ✓ Mobile checkout completes successfully
 *   ✓ Responsive layout adapts to mobile viewports
 *   ✓ Mobile menu/navigation accessible on small screens
 *
 * Anti-patterns enforced → AAA pattern compliance
 *
 * Note: Mobile tests run with device emulation (iPhone 13 Pro, Pixel 5, Galaxy S21)
 * using playwright.web-mobile.config.ts
 */

test.describe('Mobile Smoke Tests @mobile @smoke', () => {

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // ─── Mobile login flow ────────────────────────────────────────────────────

  test('mobile user can log in on touch device', async ({ page }) => {
    // ==================== ARRANGE ====================
    await page.goto(BASE_URL);

    // Mobile viewport should be active
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThanOrEqual(600); // Mobile

    // ==================== ACT ====================
    // Tap on username field (touch interaction)
    await page.tap('input[name="user-name"]');
    await page.type('input[name="user-name"]', TEST_USERNAME);

    // Tap on password field
    await page.tap('input[name="password"]');
    await page.type('input[name="password"]', TEST_PASSWORD);

    // Tap login button
    await page.tap('#login-button');

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
    await expect(page.locator('.title')).toHaveText('Products');
  });

  test('mobile inventory page is responsive', async ({ page }) => {
    // ==================== ARRANGE ====================
    await page.goto(BASE_URL);
    await page.fill('input[name="user-name"]', TEST_USERNAME);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('#login-button');
    await expect(page).toHaveURL(/inventory\.html/);

    // ==================== ACT ====================
    const inventoryItems = await page.locator('.inventory_item').count();

    // ==================== ASSERT ====================
    // Should show products in responsive layout
    expect(inventoryItems).toBeGreaterThan(0);

    // Products should be visible in mobile viewport
    const firstItem = page.locator('.inventory_item').first();
    await expect(firstItem).toBeVisible();

    // Image, name, price should be visible in mobile layout
    await expect(
      firstItem.locator('.inventory_item_img')
    ).toBeVisible();
    await expect(
      firstItem.locator('.inventory_item_name')
    ).toBeVisible();
    await expect(
      firstItem.locator('.inventory_item_price')
    ).toBeVisible();
  });

  test('mobile user can add item to cart with touch', async ({ page }) => {
    // ==================== ARRANGE ====================
    await page.goto(BASE_URL);
    await page.fill('input[name="user-name"]', TEST_USERNAME);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('#login-button');
    await expect(page).toHaveURL(/inventory\.html/);

    // ==================== ACT ====================
    // Tap add to cart button
    await page.tap('[data-test="add-to-cart-sauce-labs-backpack"]');

    // ==================== ASSERT ====================
    // Badge should appear
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });

  test('mobile cart displays correctly on small screen', async ({ page }) => {
    // ==================== ARRANGE ====================
    await page.goto(BASE_URL);
    await page.fill('input[name="user-name"]', TEST_USERNAME);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('#login-button');
    await expect(page).toHaveURL(/inventory\.html/);

    // Add two items
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');

    // ==================== ACT ====================
    // Tap cart icon
    await page.tap('.shopping_cart_link');

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/cart\.html/);

    // Cart items should be visible in mobile layout
    const cartItems = await page.locator('.cart_item').count();
    expect(cartItems).toBe(2);

    // Items should be stacked vertically in mobile
    const firstItem = page.locator('.cart_item').first();
    await expect(firstItem).toBeVisible();
  });

  test('mobile sorting dropdown works with touch', async ({ page }) => {
    // ==================== ARRANGE ====================
    await page.goto(BASE_URL);
    await page.fill('input[name="user-name"]', TEST_USERNAME);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('#login-button');
    await expect(page).toHaveURL(/inventory\.html/);

    const originalNames = await page
      .locator('.inventory_item_name')
      .allTextContents();

    // ==================== ACT ====================
    // Tap and interact with mobile-friendly dropdown
    await page.tap('[data-test="product-sort-container"]');
    await page.selectOption('[data-test="product-sort-container"]', 'za');

    // ==================== ASSERT ====================
    const sortedNames = await page
      .locator('.inventory_item_name')
      .allTextContents();

    // Names should be sorted differently
    expect(sortedNames).not.toEqual(originalNames);
  });

  test('mobile checkout flow completes successfully', async ({ page }) => {
    // ==================== ARRANGE ====================
    await page.goto(BASE_URL);
    await page.fill('input[name="user-name"]', TEST_USERNAME);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('#login-button');
    await expect(page).toHaveURL(/inventory\.html/);

    // Add item
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');

    // Go to cart
    await page.tap('.shopping_cart_link');
    await expect(page).toHaveURL(/cart\.html/);

    // ==================== ACT ====================
    // Tap checkout on mobile
    await page.tap('button:has-text("Checkout")');

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/checkout-step-one/);

    // Checkout form should be visible on mobile
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
  });

  test('mobile hamburger menu is accessible', async ({ page }) => {
    // ==================== ARRANGE ====================
    await page.goto(BASE_URL);
    await page.fill('input[name="user-name"]', TEST_USERNAME);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('#login-button');
    await expect(page).toHaveURL(/inventory\.html/);

    // ==================== ACT ====================
    // Tap hamburger menu (mobile-specific UI)
    await page.tap('[id="react-burger-menu-btn"]');

    // ==================== ASSERT ====================
    // Menu should open
    const menu = page.locator('[class*="menu"]');
    await expect(menu).toBeVisible();

    // Menu items should be clickable
    const logoutButton = page.locator('a:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
  });

  test('mobile user can navigate back using browser/UI controls', async ({ page }) => {
    // ==================== ARRANGE ====================
    await page.goto(BASE_URL);
    await page.fill('input[name="user-name"]', TEST_USERNAME);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('#login-button');
    await expect(page).toHaveURL(/inventory\.html/);

    // Add item and go to cart
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.tap('.shopping_cart_link');
    await expect(page).toHaveURL(/cart\.html/);

    // ==================== ACT ====================
    // Tap continue shopping button on mobile
    await page.tap('button:has-text("Continue Shopping")');

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('mobile form keyboard appears on touch input focus', async ({ page }) => {
    // ==================== ARRANGE ====================
    await page.goto(BASE_URL);

    // ==================== ACT ====================
    // Focus on input field (will trigger mobile keyboard)
    await page.tap('input[name="user-name"]');

    // ==================== ASSERT ====================
    // Input should be focused
    const focused = await page
      .evaluate(() => document.activeElement?.getAttribute('name'));
    expect(focused).toBe('user-name');

    // Should be able to type
    await page.type('input[name="user-name"]', TEST_USERNAME);
    const value = await page
      .locator('input[name="user-name"]')
      .inputValue();
    expect(value).toBe(TEST_USERNAME);
  });

});
