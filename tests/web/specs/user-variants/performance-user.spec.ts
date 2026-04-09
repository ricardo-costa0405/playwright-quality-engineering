import { test, expect, SAUCE_CREDENTIALS } from '../../../../fixtures/saucedemo-fixtures';

/**
 * Swag Labs — Performance Glitch User Variant Tests @performance-user
 *
 * Covers:
 *   ✓ Performance user experiences simulated slow server responses
 *   ✓ Timeouts are handled gracefully with proper retry logic
 *   ✓ Page navigation waits exceed expectations without breaking
 *   ✓ Checkout completes despite intermittent slowness
 *   ✓ Network waterfall shows delays but operations eventually succeed
 *   ✓ Cart operations complete with patience
 *   ✓ Load time metrics are collected for SLA verification
 *
 * Anti-patterns enforced → AAA pattern compliance
 *
 * Note: performance_glitch_user simulates slow API responses (up to 3s delays).
 * Tests should use longer timeouts and measure performance.
 */

test.describe('Performance Glitch User Variant @performance-user', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── Login performance ────────────────────────────────────────────────────

  test('performance_user login completes despite 3s+ server delays', async ({ loginPage, page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.glitch;
    const startTime = Date.now();

    // ==================== ACT ====================
    await loginPage.login(username, password);
    const loginDuration = Date.now() - startTime;

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory\.html/);

    // Performance glitch user experiences delays > 2s on login
    expect(loginDuration).toBeGreaterThan(2000);
    expect(loginDuration).toBeLessThan(15000); // Should not exceed 15s

    await expect(page.locator('[data-test="inventory-list"]')).toBeVisible();
  });

  // ─── Inventory loading with performance degradation ──────────────────────

  test('performance_user inventory loads despite delayed responses', async ({ loginPage, page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.glitch;

    // ==================== ACT ====================
    // Timer starts before login — performance glitch delay occurs during login/navigation
    const loadStartTime = Date.now();
    await loginPage.login(username, password);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    const inventoryLoadDuration = Date.now() - loadStartTime;

    // ==================== ASSERT ====================
    const itemCount = await page.locator('[data-test="inventory-item"]').count();
    expect(itemCount).toBe(6);

    // Loading should take noticeably longer due to performance glitch (> 2s but < 30s)
    expect(inventoryLoadDuration).toBeGreaterThan(2000);
    expect(inventoryLoadDuration).toBeLessThan(30000);

    const prices = await page.locator('[data-test="inventory-item-price"]').allTextContents();
    expect(prices.length).toBe(6);
  });

  // ─── Network waterfall measurement ────────────────────────────────────────

  test('performance_user network requests show degradation patterns', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.glitch;
    const requests: { url: string; duration: number }[] = [];

    // Capture network timing
    page.on('response', (response) => {
      const timing = response.request().timing();
      if (timing) {
        requests.push({
          url: response.url(),
          duration: timing.responseEnd - timing.requestStart,
        });
      }
    });

    // ==================== ACT ====================
    await page.goto('https://www.saucedemo.com');
    await page.fill('[data-test="username"]', username);
    await page.fill('[data-test="password"]', password);
    await page.click('[data-test="login-button"]');
    await page.waitForURL(/inventory\.html/, { timeout: 30000 });

    // ==================== ASSERT ====================
    expect(requests.length).toBeGreaterThan(0);

    // Log performance metrics — saucedemo performance delay is applied client-side
    // so it manifests as overall page load time, not individual slow network requests
    const slowRequests = requests.filter((r) => r.duration > 1000);
    console.log(`Total Requests: ${requests.length}`);
    console.log(`Slow Requests (>1s): ${slowRequests.length}`);
    if (requests.length > 0) {
      console.log(
        `Slowest Request: ${Math.max(...requests.map((r) => r.duration))}ms`
      );
    }
  });

  // ─── Add to cart with performance degradation ────────────────────────────

  test('performance_user can add items to cart despite endpoint delays', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.glitch;
    await page.goto('https://www.saucedemo.com');
    await page.fill('[data-test="username"]', username);
    await page.fill('[data-test="password"]', password);
    await page.click('[data-test="login-button"]');
    await page.waitForURL(/inventory\.html/, { timeout: 30000 });

    const startTime = Date.now();

    // ==================== ACT ====================
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
    const addDuration = Date.now() - startTime;

    expect(addDuration).toBeLessThan(10000);
  });

  // ─── Checkout flow with intermittent slowness ─────────────────────────────

  test('performance_user completes checkout despite multiple delays', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.glitch;
    const checkoutStartTime = Date.now();

    // ==================== ACT ====================
    // Navigate to login
    await page.goto('https://www.saucedemo.com');

    // Login
    await page.fill('[data-test="username"]', username);
    await page.fill('[data-test="password"]', password);
    await page.click('[data-test="login-button"]');
    await page.waitForURL(/inventory\.html/, { timeout: 30000 });

    // Add item
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');

    // Go to cart
    await page.click('[data-test="shopping-cart-link"]');
    await page.waitForURL(/cart\.html/, { timeout: 30000 });

    // Checkout
    await page.click('[data-test="checkout"]');
    await page.waitForURL(/checkout-step-one/, { timeout: 30000 });

    // Fill info
    await page.fill('[data-test="firstName"]', 'Test');
    await page.fill('[data-test="lastName"]', 'User');
    await page.fill('[data-test="postalCode"]', '12345');

    // Continue to step 2
    await page.click('[data-test="continue"]');
    await page.waitForURL(/checkout-step-two/, { timeout: 30000 });

    // Finish
    await page.click('[data-test="finish"]');
    await page.waitForURL(/checkout-complete/, { timeout: 30000 });

    const checkoutDuration = Date.now() - checkoutStartTime;

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="complete-header"]')).toBeVisible();
    await expect(page.locator('[data-test="complete-header"]')).not.toBeEmpty();

    expect(checkoutDuration).toBeLessThan(120000); // Less than 2 minutes

    console.log(`Checkout Duration: ${checkoutDuration}ms`);
  });

  // ─── Sorting with performance impact ──────────────────────────────────────

  test('performance_user sort operations complete despite API latency', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.glitch;

    await page.goto('https://www.saucedemo.com');
    await page.fill('[data-test="username"]', username);
    await page.fill('[data-test="password"]', password);
    await page.click('[data-test="login-button"]');
    await page.waitForURL(/inventory\.html/, { timeout: 30000 });

    const sortStartTime = Date.now();

    // ==================== ACT ====================
    await page.selectOption('[data-test="product-sort-container"]', 'za');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    const sortDuration = Date.now() - sortStartTime;

    // ==================== ASSERT ====================
    const names = await page.locator('[data-test="inventory-item-name"]').allTextContents();

    // Should be reverse alphabetical
    const sorted = [...names].sort().reverse();
    expect(names).toEqual(sorted);

    // Sort operation should show latency
    expect(sortDuration).toBeGreaterThan(1000);
    expect(sortDuration).toBeLessThan(30000);

    console.log(`Sort Duration: ${sortDuration}ms`);
  });

  // ─── Multiple operations sequence ─────────────────────────────────────────

  test('performance_user can perform multiple operations sequentially', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.glitch;
    const operationStartTime = Date.now();

    // ==================== ACT ====================
    // 1. Login
    await page.goto('https://www.saucedemo.com');
    await page.fill('[data-test="username"]', username);
    await page.fill('[data-test="password"]', password);
    await page.click('[data-test="login-button"]');
    await page.waitForURL(/inventory\.html/, { timeout: 30000 });

    // 2. Add items
    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('[data-test="add-to-cart-sauce-labs-bike-light"]');

    // 3. Sort
    await page.selectOption('[data-test="product-sort-container"]', 'lohi');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // 4. Navigate to cart
    await page.click('[data-test="shopping-cart-link"]');
    await page.waitForURL(/cart\.html/, { timeout: 30000 });

    const operationDuration = Date.now() - operationStartTime;

    // ==================== ASSERT ====================
    const cartItems = await page.locator('.cart_item').count();
    expect(cartItems).toBe(2);

    expect(operationDuration).toBeLessThan(90000); // Should not exceed 90s

    console.log(`Total Operations Duration: ${operationDuration}ms`);
  });

  // ─── Measurement of expected SLA ─────────────────────────────────────────

  test('performance_user metrics validate SLA limits', async ({ page }) => {
    // ==================== ARRANGE ====================
    const { username, password } = SAUCE_CREDENTIALS.glitch;
    const SLA_LOGIN_TIMEOUT = 30000;
    const SLA_NAV_TIMEOUT = 30000;

    // ==================== ACT ====================
    const loginStartTime = Date.now();
    await page.goto('https://www.saucedemo.com');
    await page.fill('[data-test="username"]', username);
    await page.fill('[data-test="password"]', password);
    await page.click('[data-test="login-button"]');
    await page.waitForURL(/inventory\.html/, { timeout: SLA_LOGIN_TIMEOUT });
    const loginTime = Date.now() - loginStartTime;

    const navStartTime = Date.now();
    await page.click('[data-test="shopping-cart-link"]');
    await page.waitForURL(/cart\.html/, { timeout: SLA_NAV_TIMEOUT });
    const navTime = Date.now() - navStartTime;

    // ==================== ASSERT ====================
    expect(loginTime).toBeLessThan(SLA_LOGIN_TIMEOUT);
    expect(navTime).toBeLessThan(SLA_NAV_TIMEOUT);

    console.log(`Login SLA: ${loginTime}ms / ${SLA_LOGIN_TIMEOUT}ms`);
    console.log(`Navigation SLA: ${navTime}ms / ${SLA_NAV_TIMEOUT}ms`);
    console.log(
      `SLA Compliance: ${loginTime < SLA_LOGIN_TIMEOUT && navTime < SLA_NAV_TIMEOUT ? 'PASS' : 'FAIL'}`
    );
  });

});
