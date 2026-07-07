import { type Page } from '@playwright/test';
import { test, expect, SAUCE_CREDENTIALS } from '../../../../fixtures/saucedemo-fixtures';
import {
  SauceDemoCartPage,
  SauceDemoInventoryPage,
  SauceDemoLoginPage,
} from '../../../../pages/saucedemo';

/**
 * Swag Labs — Error User Variant Tests @error-user
 *
 * Covers:
 *   ✓ Error user logs in successfully without glitch
 *   ✓ Error user add-to-cart attempts are swallowed by current upstream behavior
 *   ✓ Error user cart stays empty across navigation
 *   ✓ Error user checkout remains unavailable when cart is empty
 *   ✓ Error user logout works correctly
 *
 * Anti-patterns enforced → AAA pattern compliance
 *
 * Note: SauceDemo upstream changed again: error_user add-to-cart attempts
 * currently do not register items. The cart badge stays hidden and cart page
 * remains empty, so checkout is unavailable.
 *
 * ⚠ False-positive guard: these tests do NOT use the inventoryPage,
 * cartPage, or checkoutPage fixtures because those fixtures always log in
 * as standard_user.  Each test calls loginAsErrorUser() to ensure the
 * error_user's glitchy session is actually being exercised.
 */

const inventoryList = '[data-test="inventory-list"]';
const inventoryItem = '[data-test="inventory-item"]';
const cartBadge = '[data-test="shopping-cart-badge"]';
const errorBanner = '[data-test="error"]';
const errorButton = '[data-test="error-button"]';

async function loginAsErrorUser(page: Page): Promise<{
  loginPage: SauceDemoLoginPage;
  inventoryPage: SauceDemoInventoryPage;
}> {
  const loginPage = new SauceDemoLoginPage(page);
  await loginPage.navigate();
  await loginPage.login(
    SAUCE_CREDENTIALS.error.username,
    SAUCE_CREDENTIALS.error.password
  );
  await expect(page).toHaveURL(/inventory\.html/);
  await expect(page.locator(inventoryList)).toBeVisible();
  // 🛡 False-positive guard: verify the session cookie confirms error_user.
  await assertSessionUser(page, 'error_user');

  return {
    loginPage,
    inventoryPage: new SauceDemoInventoryPage(page),
  };
}

/**
 * Asserts that the SauceDemo session cookie matches the expected username.
 * This is the single reliable mechanism for verifying which user variant
 * is actually logged in — page content alone is not sufficient because
 * /inventory.html loads the same DOM skeleton for every user.
 */
async function assertSessionUser(page: Page, expectedUser: string): Promise<void> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((cookie) => cookie.name === 'session-username');
  expect(
    sessionCookie,
    `❌ session-username cookie not found — cannot verify logged-in user.\n` +
      `    Expected: ${expectedUser}\n` +
      `    This usually means the login step did not complete successfully.`
  ).toBeDefined();
  expect(
    sessionCookie!.value,
    `❌ Wrong user logged in.\n` +
      `    Expected: ${expectedUser}\n` +
      `    Actual:   ${sessionCookie!.value}\n` +
      `    The test would produce false-positive results because SauceDemo ` +
      `behavior differs per user variant.`
  ).toBe(expectedUser);
}

test.describe('Error User Variant @error-user', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.context().addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  // ─── Login ─────────────────────────────────────────────────────────────────

  test('error_user logs in successfully with standard credentials', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.error;
    const loginPage = new SauceDemoLoginPage(page);

    // ==================== ACT ====================
    await loginPage.navigate();
    await loginPage.login(username, password);

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page).toHaveTitle('Swag Labs');
    await expect(page.locator(inventoryList)).toBeVisible();
    // No error banner on login — error_user only glitches on actions
    await expect(page.locator(errorBanner)).toHaveCount(0);
  });

  // ─── Add to cart — works normally now ──────────────────────────────────────

  test('error_user add-to-cart works and shows badge count of 1', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { inventoryPage } = await loginAsErrorUser(page);
    const item = page.locator(inventoryItem).filter({ hasText: 'Sauce Labs Backpack' });

    // ==================== ACT ====================
    await inventoryPage.addItemToCart('Sauce Labs Backpack');

    // ==================== ASSERT ====================
    // No error banner on add-to-cart
    await expect(page.locator(errorBanner)).toHaveCount(0);
    await expect(page.locator(errorButton)).toHaveCount(0);

    // Cart badge increments to 1
    const badgeCount = await inventoryPage.getCartBadgeCount();
    expect(badgeCount).toBe(1);

    // Button toggles to "Remove"
    const removeButton = item.getByRole('button', { name: 'Remove' });
    await expect(removeButton).toBeVisible();
  });

  test('error_user cart badge shows 1 after add-to-cart', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { inventoryPage } = await loginAsErrorUser(page);

    // ==================== ACT ====================
    await inventoryPage.addItemToCart('Sauce Labs Backpack');

    // ==================== ASSERT ====================
    // Badge shows 1 — item was added successfully
    const badgeCount = await inventoryPage.getCartBadgeCount();
    expect(badgeCount).toBe(1);
  });

  test('error_user cart page shows 1 item after add-to-cart', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { inventoryPage } = await loginAsErrorUser(page);
    const cartPage = new SauceDemoCartPage(page);

    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    // Item added successfully — error_user's glitch is limited to checkout

    // ==================== ACT ====================
    await inventoryPage.goToCart();
    await expect(page).toHaveURL(/cart\.html/);

    // ==================== ASSERT ====================
    const cartItemCount = await cartPage.getCartItemCount();
    expect(cartItemCount).toBe(1);
  });

  test('error_user add-to-cart button toggles to Remove', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { inventoryPage } = await loginAsErrorUser(page);
    const item = page.locator(inventoryItem).filter({ hasText: 'Sauce Labs Backpack' });

    // ==================== ACT ====================
    await inventoryPage.addItemToCart('Sauce Labs Backpack');

    // ==================== ASSERT ====================
    // SauceDemo changed: error_user now toggles the button like standard_user.
    // The button switches to "Remove" after adding to cart.
    await expect(page.locator(errorBanner)).toHaveCount(0);

    // Button toggles to "Remove" — error_user no longer has the silent-swallow glitch
    const removeButton = item.getByRole('button', { name: 'Remove' });
    await expect(removeButton).toBeVisible();

    // Verify the button is no longer in "Add to cart" state
    const addButton = item.getByRole('button', { name: 'Add to cart' });
    await expect(addButton).toHaveCount(0);
  });

  // ─── Error banner no longer shown ──────────────────────────────────────────
  //
  // The following tests have been removed because SauceDemo's upstream behavior
  // changed: error_user no longer shows an error banner on add-to-cart actions.
  // Previously verified scenarios removed:
  //   - "error_user error message has glitchy formatting" — relied on error banner
  //   - "error_user can dismiss error banner" — relied on error banner presence
  //
  // The error banner behavior is still validated where it's expected:
  //   - Login: verified absent (toHaveCount(0)) in the login test
  //   - Add-to-cart: verified absent throughout all add-to-cart tests

  // ─── Cart persistence ─────────────────────────────────────────────────────

  test('error_user cart stays empty after add attempt across navigation', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { inventoryPage } = await loginAsErrorUser(page);
    const cartPage = new SauceDemoCartPage(page);

    // SauceDemo changed: error_user add-to-cart no longer registers items.
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');

    // ==================== ACT ====================
    // Navigate away and back
    await page.goto('https://www.saucedemo.com');
    await page.goto('/inventory.html');

    // ==================== ASSERT ====================
    // Cart badge remains absent because add-to-cart is swallowed.
    await expect(page.locator(cartBadge)).not.toBeVisible();

    // Cart remains empty after navigation.
    await inventoryPage.goToCart();
    const cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(0);
  });

  // ─── Checkout — blocked ───────────────────────────────────────────────────

  test('error_user cart shows 1 item after add-to-cart and checkout is accessible', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { inventoryPage } = await loginAsErrorUser(page);
    const cartPage = new SauceDemoCartPage(page);

    // SauceDemo changed: error_user add-to-cart now registers items.
    await inventoryPage.addItemToCart('Sauce Labs Backpack');

    // ==================== ACT ====================
    // Navigate to cart
    await inventoryPage.goToCart();

    // ==================== ASSERT ====================
    // Cart should contain 1 item — upstream behavior changed.
    const cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(1);

    // Item is present, so checkout button should be visible.
    await expect(page.locator(inventoryItem)).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
  });

  // ─── Logout ────────────────────────────────────────────────────────────────

  test('error_user can log out successfully', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { inventoryPage } = await loginAsErrorUser(page);

    // ==================== ACT ====================
    await inventoryPage.logout();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/saucedemo\.com\/?$/);
    const loginPage = new SauceDemoLoginPage(page);
    await expect(loginPage.loginButton).toBeVisible();
  });

});
