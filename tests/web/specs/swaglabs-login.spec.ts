import { test, expect, SAUCE_CREDENTIALS } from '../../../fixtures/saucedemo-fixtures';

/**
 * Swag Labs — Login Feature Tests @smoke @login
 *
 * Covers:
 *   ✓ Happy path — standard_user logs in and lands on inventory
 *   ✓ Error state — locked_out_user sees the right message
 *   ✓ Validation — empty form cannot be submitted
 *   ✓ Logout — session is cleared after logout
 *
 * Anti-patterns enforced → see utils/patterns/anti-patterns-guide.ts (AGENT_RULES)
 */

test.describe('Login Feature @smoke @login', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── Happy path ─────────────────────────────────────────────────────────

  test('standard_user logs in and lands on inventory page', async ({ loginPage, page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.standard;

    // ==================== ACT ====================
    await loginPage.login(username, password);

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page).toHaveTitle('Swag Labs');
    await expect(page.locator('[data-test="inventory-list"]')).toBeVisible();
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  // ─── Error states ────────────────────────────────────────────────────────

  test('locked_out_user sees a descriptive error message', async ({ loginPage, page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.locked;

    // ==================== ACT ====================
    await loginPage.login(username, password);

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('locked out');
  });

  test('wrong password shows invalid credentials error', async ({ loginPage, page }) => {
    // ==================== ARRANGE ====================
    const username = SAUCE_CREDENTIALS.standard.username;
    const wrongPassword = 'totally_wrong';

    // ==================== ACT ====================
    await loginPage.login(username, wrongPassword);

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
  });

  test('submitting empty form shows validation error', async ({ loginPage: _loginPage, page }) => {
    // ==================== ARRANGE ====================
    // Form is already empty on navigate — nothing extra to arrange

    // ==================== ACT ====================
    await page.locator('[data-test="login-button"]').click();

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
    // Still on login page
    await expect(page).toHaveURL(/saucedemo\.com\/?$/);
  });

  // ─── Session management ───────────────────────────────────────────────────

  test('user can logout and session is cleared', async ({ inventoryPage, page }) => {
    // ==================== ARRANGE ====================
    // inventoryPage fixture provides an already-authenticated session

    // ==================== ACT ====================
    await inventoryPage.logout();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/saucedemo\.com\/?$/);
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();

    // Verify session is truly gone — navigating to inventory redirects back
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(/saucedemo\.com\/?$/);
  });

});
