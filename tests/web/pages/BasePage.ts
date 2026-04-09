import { Page, Locator, expect } from '@playwright/test';
import { AntiTimeoutGuard } from '@utils/patterns/anti-timeout-guard';

/**
 * Base Page Object following Clean Code and AAA-ready design
 *
 * RULES:
 * - Single Responsibility: Each page = one class
 * - No business logic in pages
 * - State-based waits only (NO timeouts)
 * - Meaningful method names
 * - Return types for chainability
 */
export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get page URL - override in subclass
   */
  protected abstract getUrl(): string;

  /**
   * Verify page loaded - override in subclass
   */
  protected abstract verifyPageLoaded(): Promise<void>;

  /**
   * Navigate to page - ALWAYS wait for load state
   */
  async navigate(url?: string): Promise<void> {
    const targetUrl = url || this.getUrl();

    await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Wait for network idle - NO hardcoded timeout
    await AntiTimeoutGuard.waitStrategies.networkIdle(this.page);

    // Verify page loaded correctly
    await this.verifyPageLoaded();
  }

  /**
   * Click with proper state verification
   *
   * ANTI-PATTERN: await element.click(); await page.waitForTimeout(1000);
   * CORRECT: Click and verify resulting state
   */
  protected async clickAndWait(
    selector: string
  ): Promise<void> {
    const element = this.page.locator(selector);

    // Ensure clickable before clicking
    await expect(element).toBeVisible({ timeout: 10000 });
    await expect(element).toBeEnabled({ timeout: 10000 });

    // Click
    await element.click();

    // After click, waiter must decide what to wait for
    // This method doesn't assume anything about the result
  }

  /**
   * Click expecting navigation
   */
  protected async clickAndNavigate(
    selector: string,
    expectedUrl?: RegExp | string
  ): Promise<void> {
    const element = this.page.locator(selector);

    await expect(element).toBeVisible({ timeout: 10000 });
    await expect(element).toBeEnabled({ timeout: 10000 });

    await element.click();

    if (expectedUrl) {
      await expect(this.page).toHaveURL(expectedUrl);
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Fill input with verification
   */
  protected async fillInput(
    selector: string,
    value: string,
    shouldVerify: boolean = true
  ): Promise<void> {
    const input = this.page.locator(selector);

    await expect(input).toBeVisible({ timeout: 10000 });
    await expect(input).toBeEditable({ timeout: 10000 });

    // Clear existing value
    await input.clear();

    // Fill with new value
    await input.fill(value);

    if (shouldVerify) {
      await expect(input).toHaveValue(value);
    }
  }

  /**
   * Type text character-by-character (for simulating user input)
   */
  protected async typeText(selector: string, text: string): Promise<void> {
    const input = this.page.locator(selector);

    await expect(input).toBeVisible({ timeout: 10000 });
    await expect(input).toBeEditable({ timeout: 10000 });

    // Type character by character (slower, more human-like)
    await input.pressSequentially(text, { delay: 50 });
  }

  /**
   * Select from dropdown with verification
   */
  protected async selectOption(
    selector: string,
    option: string | { label?: string; value?: string; index?: number }
  ): Promise<void> {
    const select = this.page.locator(selector);

    await expect(select).toBeVisible({ timeout: 10000 });
    await expect(select).toBeEnabled({ timeout: 10000 });

    if (typeof option === 'string') {
      await select.selectOption(option);
    } else {
      await select.selectOption(option);
    }

    // Verify selection
    const selectedValue = await select.inputValue();
    if (!selectedValue) {
      throw new Error('Selection did not result in a value');
    }
  }

  /**
   * Wait for element state - REPLACES waitForTimeout
   */
  protected async waitForElement(
    selector: string,
    state: 'visible' | 'hidden' | 'attached' | 'detached' = 'visible'
  ): Promise<void> {
    const element = this.page.locator(selector);

    switch (state) {
      case 'visible':
        await expect(element).toBeVisible({ timeout: 10000 });
        break;
      case 'hidden':
        await expect(element).toBeHidden({ timeout: 10000 });
        break;
      case 'attached':
        await expect(element).toBeAttached({ timeout: 10000 });
        break;
      case 'detached':
        await expect(element).not.toBeAttached({ timeout: 10000 });
        break;
    }
  }

  /**
   * Wait for API call to complete - BETTER than timeout
   * Uses Playwright's built-in waitForResponse — no hardcoded timer
   */
  protected async waitForAPICall(
    urlPattern: string | RegExp,
    method?: string
  ): Promise<import('@playwright/test').Response> {
    return this.page.waitForResponse((response) => {
      const matchesUrl =
        typeof urlPattern === 'string'
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url());
      const matchesMethod = !method || response.request().method() === method;
      return matchesUrl && matchesMethod && response.ok();
    });
  }

  /**
   * Get text content safely
   */
  protected async getText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible({ timeout: 10000 });

    const text = await element.textContent();
    return text?.trim() || '';
  }

  /**
   * Get all text contents from multiple elements
   */
  protected async getTextList(selector: string): Promise<string[]> {
    const elements = this.page.locator(selector);
    const count = await elements.count();

    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await elements.nth(i).textContent();
      if (text) {
        texts.push(text.trim());
      }
    }

    return texts;
  }

  /**
   * Check if element is visible (without failing)
   */
  protected async isElementVisible(selector: string): Promise<boolean> {
    try {
      await expect(this.page.locator(selector)).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get element locator for direct use in tests
   */
  protected locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Execute JavaScript in page context
   */
  protected async evaluateScript<T>(
    expression: string,
    arg?: Record<string, any>
  ): Promise<T> {
    return this.page.evaluate<T>(expression, arg);
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return this.page.title();
  }
}
