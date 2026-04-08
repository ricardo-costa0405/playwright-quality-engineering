/**
 * Anti-Patterns Guide — Swag Labs / Playwright Test Suite
 *
 * This file is a living reference for agents and developers.
 * It documents the WRONG way and the RIGHT way for each category.
 * Agents (HealingAgent, AnalysisAgent) use this as a rule set when
 * generating or repairing tests.
 *
 * ─── Categories ──────────────────────────────────────────────────────────────
 *  1. Waits & Timing
 *  2. Selectors
 *  3. Assertions
 *  4. Test Structure (AAA)
 *  5. State & Isolation
 *  6. Fixtures
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ANTI_PATTERNS = {

  // ── 1. Waits & Timing ───────────────────────────────────────────────────

  hardcodedWaits: {
    description: 'Using fixed-time waits makes tests slow and fragile — they either wait too long or fail on slow machines.',
    wrong: [
      `await page.waitForTimeout(2000);`,
      `setTimeout(() => { /* assertion */ }, 1000);`,
      `await new Promise(r => setTimeout(r, 500));`,
    ],
    correct: [
      `await expect(page.locator('.inventory_list')).toBeVisible();`,
      `await page.waitForLoadState('networkidle');`,
      `await page.waitForLoadState('domcontentloaded');`,
      `await page.waitForResponse(res => res.url().includes('/api/'));`,
    ],
  },

  tightAssertionTimeout: {
    description: 'Passing a very short timeout to expect() causes flakiness on slow renders.',
    wrong: [
      `await expect(locator).toBeVisible({ timeout: 100 });`,
      `await expect(locator).toHaveCount(3, { timeout: 500 });`,
    ],
    correct: [
      `await expect(locator).toBeVisible(); // uses global expect timeout`,
      `await expect(locator).toHaveCount(3);`,
    ],
  },

  // ── 2. Selectors ─────────────────────────────────────────────────────────

  brittleSelectors: {
    description: 'CSS path or nth-child selectors break when the DOM structure changes.',
    wrong: [
      `page.locator('div.inventory_container > ul > li:nth-child(1) > div > button')`,
      `page.locator('//div[@class="inventory_item"][1]//button')`,  // XPath
      `page.locator('.btn_primary:first-child')`,
    ],
    correct: [
      `page.locator('[data-test="add-to-cart-sauce-labs-backpack"]')`,
      `page.locator('#login-button')`,
      // Or the POM approach — filter by item name, then find the button inside:
      `page.locator('.inventory_item').filter({ hasText: 'Sauce Labs Backpack' }).locator('button')`,
    ],
  },

  staleElementAccess: {
    description: 'Saving a locator result and using it after a page mutation leads to stale references.',
    wrong: [
      `const items = await page.$$('.inventory_item'); // $$() returns ElementHandles`,
      `const text  = await items[0].textContent();     // may be stale after re-render`,
    ],
    correct: [
      `// Always re-query via locators — they are lazy and retry automatically`,
      `await page.locator('.inventory_item').first().textContent();`,
    ],
  },

  // ── 3. Assertions ────────────────────────────────────────────────────────

  nonRetryableAssertions: {
    description: 'Awaiting a value then asserting it synchronously bypasses Playwright auto-retry.',
    wrong: [
      `const title = await page.title();`,
      `expect(title).toBe('Swag Labs'); // no retry — fails on slow loads`,
    ],
    correct: [
      `await expect(page).toHaveTitle('Swag Labs'); // retries until timeout`,
    ],
  },

  obscureFailureMessages: {
    description: 'Boolean assertions hide the actual vs expected diff when they fail.',
    wrong: [
      `const names = await inventoryPage.getItemNames();`,
      `expect(names[0] < names[1]).toBeTruthy(); // fails with "expected false to be truthy"`,
    ],
    correct: [
      `const names = await inventoryPage.getItemNames();`,
      `expect(names).toEqual([...names].sort()); // diff shows full arrays`,
    ],
  },

  // ── 4. Test Structure (AAA) ──────────────────────────────────────────────

  multipleActsPerTest: {
    description: 'Testing multiple actions in one test makes failures hard to diagnose.',
    wrong: `
      test('all login flows', async ({ page }) => {
        await loginPage.login('standard_user', 'secret_sauce');
        await expect(page).toHaveURL(/inventory/);

        await loginPage.login('locked_out_user', 'secret_sauce'); // second act!
        await expect(loginPage.hasError()).toBe(true);
      });
    `,
    correct: `
      test('standard_user logs in', async ({ loginPage }) => { /* one action */ });
      test('locked_out_user sees error', async ({ loginPage }) => { /* one action */ });
    `,
  },

  arrangeInAssert: {
    description: 'Setting up state inside the Assert phase makes tests unreadable and unrepeatable.',
    wrong: `
      // ===== ASSERT =====
      await inventoryPage.addItemToCart('Sauce Labs Backpack'); // this is Arrange!
      expect(await inventoryPage.getCartBadgeCount()).toBe(1);
    `,
    correct: `
      // ===== ARRANGE =====
      await inventoryPage.addItemToCart('Sauce Labs Backpack');
      // ===== ACT =====
      const count = await inventoryPage.getCartBadgeCount();
      // ===== ASSERT =====
      expect(count).toBe(1);
    `,
  },

  // ── 5. State & Isolation ─────────────────────────────────────────────────

  testChainingState: {
    description: 'Tests that depend on state left by previous tests cause cascading failures.',
    wrong: `
      test('add item', async ({ page }) => { /* adds item to cart */ });
      test('cart has item', async ({ page }) => {
        // assumes 'add item' ran first — breaks in isolation or parallel
      });
    `,
    correct: `
      // Each test sets up its own state via fixtures:
      test('cart has item', async ({ inventoryPage, page }) => {
        await inventoryPage.addItemToCart('Sauce Labs Backpack');
        await inventoryPage.goToCart();
        // ...
      });
    `,
  },

  sharedMutableState: {
    description: 'Using module-level variables to share state between tests causes race conditions in parallel runs.',
    wrong: `
      let cartCount = 0; // module-level — shared between parallel workers!
      test('add item', async () => { cartCount++; });
      test('verify count', async () => { expect(cartCount).toBe(1); });
    `,
    correct: `
      // Use fixtures. Each test gets its own browser context.
      test('verify count', async ({ inventoryPage }) => {
        await inventoryPage.addItemToCart('Sauce Labs Backpack');
        expect(await inventoryPage.getCartBadgeCount()).toBe(1);
      });
    `,
  },

  // ── 6. Fixtures ──────────────────────────────────────────────────────────

  navigatingInTest: {
    description: 'Navigating to URLs directly in tests bypasses the fixture login state.',
    wrong: `
      test('cart page', async ({ page }) => {
        await page.goto('/cart.html'); // no session! redirects to login
      });
    `,
    correct: `
      test('cart page', async ({ cartPage }) => {
        // cartPage fixture handles login + navigation
      });
    `,
  },

} as const;

/**
 * Agent-consumable rule list — used by HealingAgent and AnalysisAgent
 * to flag anti-patterns in generated or failing tests.
 */
export const AGENT_RULES: string[] = [
  'No waitForTimeout, setTimeout, or sleep in tests',
  'No XPath selectors — use data-test, id, or semantic HTML',
  'No nth-child or CSS-path selectors',
  'Each test has exactly ONE action in the Act phase',
  'All assertions use await expect() — never sync expect(await)',
  'Tests must not depend on state from other tests',
  'Module-level mutable state is forbidden',
  'Fixtures manage all setup and teardown — not test bodies',
];
