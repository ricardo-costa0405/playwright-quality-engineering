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
 *   ✓ Error user can add items to cart (badge increments, button toggles)
 *   ✓ Error user cart reflects added items
 *   ✓ Error user can navigate between pages with cart state intact
 *   ✓ Error user checkout flow shows error banner despite items in cart
 *   ✓ Error user logout works correctly
 *
 * Anti-patterns enforced → AAA pattern compliance
 *
 * Note: error_user now behaves like standard_user for add-to-cart — items
 * are added successfully, badge increments, button toggles to "Remove",
 * and the cart persists across navigation. The "error" user's glitch is
 * limited to error-state scenarios (checkout, validation) only.
 *
 * ⚠ False-positive guard: these tests do NOT use the inventoryPage,
 * cartPage, or checkoutPage fixtures because those fixtures always log in
 * as standard_user.  Each test calls loginAsErrorUser() to ensure the
 * error_user's glitchy session is actually being exercised.
 */

const inventoryList = '[data-test="inventory-list"]';
const inventoryItem = '[data-test="inventory-item"]';
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
  const sessionCookie = cookies.find((c) => c.name === 'session-username');
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

  test('error_user cart persists with 2 items across navigation', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { inventoryPage } = await loginAsErrorUser(page);
    const cartPage = new SauceDemoCartPage(page);

    // Add items successfully — error_user's glitch is limited to checkout
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.addItemToCart('Sauce Labs Bike Light');

    // ==================== ACT ====================
    // Navigate away and back
    await page.goto('https://www.saucedemo.com');
    await page.goto('/inventory.html');

    // ==================== ASSERT ====================
    // Cart badge persists with 2 across navigation
    const badgeAfterNav = await inventoryPage.getCartBadgeCount();
    expect(badgeAfterNav).toBe(2);

    // Cart contains both items
    await inventoryPage.goToCart();
    const cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(2);
  });

  // ─── Checkout — blocked ───────────────────────────────────────────────────

  test('error_user cart shows 1 item for checkout flow with glitch', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { inventoryPage } = await loginAsErrorUser(page);
    const cartPage = new SauceDemoCartPage(page);

    // Add item successfully — error_user can add to cart
    await inventoryPage.addItemToCart('Sauce Labs Backpack');

    // ==================== ACT ====================
    // Navigate to cart
    await inventoryPage.goToCart();

    // ==================== ASSERT ====================
    // Cart has 1 item — error_user's glitch is NOT at add-to-cart
    const cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(1);

    // The cart shows the inventory item
    await expect(page.locator(inventoryItem)).toHaveCount(1);

    // The error_user glitch manifests at checkout — clicking Checkout
    // produces an error banner rather than proceeding to the form page
    const checkoutButton = page.getByRole('button', { name: 'Checkout' });
    await checkoutButton.click();
    await expect(page.locator(errorBanner)).toBeVisible();
    // Verify error banner has content (not just an empty element)
    await expect(page.locator(errorBanner)).not.toBeEmpty();
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
