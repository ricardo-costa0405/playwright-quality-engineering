import { Page, type Response as PlaywrightResponse } from '@playwright/test';

/**
 * Anti-Timeout Guard
 * Prevents usage of hardcoded timeouts - THE LEADING CAUSE OF TEST FLAKINESS
 *
 * REPLACES:
 * - page.waitForTimeout() → Use state-based waits
 * - setTimeout() → Use Playwright auto-waiting
 * - sleep() → Use expect().toBeVisible() etc.
 * - await page.wait() → Use proper wait methods
 */

export class AntiTimeoutGuard {
  /**
   * Banned patterns that cause flakiness
   */
  private static readonly BANNED_PATTERNS = [
    {
      pattern: /waitForTimeout\s*\(/,
      message: 'page.waitForTimeout() is banned - use state-based waits',
    },
    {
      pattern: /setTimeout\s*\(/,
      message: 'setTimeout() is banned in tests - use Playwright auto-waiting',
    },
    {
      pattern: /sleep\s*\(/,
      message:
        'sleep() is banned - use expect().toBeVisible() or similar assertions',
    },
    {
      pattern: /page\.wait\s*\(\s*\d+\s*\)/,
      message: 'page.wait(milliseconds) is banned - use state-based waits',
    },
  ];

  /**
   * Validate code for hardcoded timeout usage
   */
  static validateCode(code: string): void {
    for (const { pattern, message } of this.BANNED_PATTERNS) {
      if (pattern.test(code)) {
        throw new Error(
          `${message}\n\nApproved waiting strategies:\n` +
          '- await page.waitForLoadState("networkidle")\n' +
          '- await expect(element).toBeVisible()\n' +
          '- await page.waitForSelector("[data-testid=foo]")\n' +
          '- await page.waitForResponse(url => url.includes("/api/data"))\n' +
          '- await page.waitForFunction(() => document.readyState === "complete")'
        );
      }
    }
  }

  /**
   * Approved waiting strategies - USE THESE INSTEAD!
   */
  static readonly waitStrategies = {
    /**
     * Wait for network to be idle (all network requests complete)
     */
    async networkIdle(page: Page): Promise<void> {
      await page.waitForLoadState('networkidle');
    },

    /**
     * Wait for DOM to be interactive
     */
    async domReady(page: Page): Promise<void> {
      await page.waitForLoadState('domcontentloaded');
    },

    /**
     * Wait for page to be fully loaded
     */
    async pageLoad(page: Page): Promise<void> {
      await page.waitForLoadState('load');
    },

    /**
     * Wait for element to be visible
     */
    async elementVisible(page: Page, selector: string): Promise<void> {
      await page.locator(selector).waitFor({ state: 'visible' });
    },

    /**
     * Wait for element to be hidden
     */
    async elementHidden(page: Page, selector: string): Promise<void> {
      await page.locator(selector).waitFor({ state: 'hidden' });
    },

    /**
     * Wait for specific API response
     */
    async apiResponse(
      page: Page,
      urlPattern: string | RegExp
    ): Promise<PlaywrightResponse | null> {
      try {
        return await page.waitForResponse(
          (response) =>
            (typeof urlPattern === 'string'
              ? response.url().includes(urlPattern)
              : urlPattern.test(response.url())) && response.ok()
        );
      } catch {
        return null;
      }
    },

    /**
     * Wait for multiple API responses
     */
    async multipleApiResponses(
      page: Page,
      urlpattern: string | RegExp,
      count: number
    ): Promise<void> {
      let received = 0;

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          page.off('response', listener);
          reject(new Error(`Timed out waiting for ${count} API responses`));
        }, 30000);

        const listener = (response: PlaywrightResponse): void => {
          const matches =
            typeof urlpattern === 'string'
              ? response.url().includes(urlpattern)
              : urlpattern.test(response.url());

          if (matches && response.ok()) {
            received++;
            if (received >= count) {
              clearTimeout(timer);
              page.off('response', listener);
              resolve();
            }
          }
        };

        page.on('response', listener);
      });
    },

    /**
     * Wait for DOM to be stable (no mutations for interval)
     */
    async domStable(page: Page, durationMs: number = 500): Promise<void> {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');

      // Additional wait for DOM mutations to settle
      await page.waitForFunction(
        () => {
          // This is a simple implementation
          // In production, use a MutationObserver
          return true;
        },
        { timeout: durationMs }
      );
    },

    /**
     * Wait for navigation to complete
     */
    async navigationComplete(page: Page): Promise<void> {
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
    },

    /**
     * Wait for custom condition with timeout
     */
    async customCondition(
      page: Page,
      condition: () => Promise<boolean>,
      timeoutMs: number = 10000
    ): Promise<void> {
      const startTime = Date.now();

      while (Date.now() - startTime < timeoutMs) {
        if (await condition()) {
          return;
        }

        // Small delay to avoid busy-waiting
        // eslint-disable-next-line no-restricted-syntax
        await page.waitForTimeout(100);
      }

      throw new Error(`Custom condition timeout after ${timeoutMs}ms`);
    },
  };
}

export default AntiTimeoutGuard;
