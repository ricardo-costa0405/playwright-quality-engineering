import { test as base, expect } from '@playwright/test';

/**
 * Custom Fixtures for Web Tests
 * Provides: authenticated contexts, test data, utilities
 */

type CustomFixtures = {
  authenticatedPage: typeof base;
};

/**
 * Extend base test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  /**
   * Authenticated page fixture
   * Provides logged-in session for tests
   */
  authenticatedPage: async ({ page, context }, use) => {
    // Setup: Add authentication token/cookies if needed
    const authToken = process.env.TEST_AUTH_TOKEN || 'mock-token-for-testing';

    if (authToken && authToken !== 'mock-token-for-testing') {
      await context.addCookies([
        {
          name: 'auth_token',
          value: authToken,
          domain: new URL(process.env.BASE_URL || 'https://example.com').hostname,
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
        },
      ]);
    }

    // Verify authentication if needed
    // await page.goto('/dashboard');
    // await page.waitForLoadState('networkidle');

    await use(page);

    // Teardown: Clear auth
    await context.clearCookies();
  },
});

// Re-export expect
export { expect };
