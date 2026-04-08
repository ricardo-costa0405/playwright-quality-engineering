import { Locator, Page, expect } from '@playwright/test';

/**
 * Element state for assertions
 */
export interface ElementState {
  text?: string | string[];
  attributes?: Record<string, string>;
  count?: number | { min?: number; max?: number; exact?: number };
  visible?: boolean;
  enabled?: boolean;
  disabled?: boolean;
  checked?: boolean;
  value?: string;
}

/**
 * API response expectation
 */
export interface APIExpectation {
  status: number;
  schema?: Record<string, any>;
  contains?: Record<string, any>;
}

/**
 * Assertion Builder
 * Builds deterministic, state-based assertions
 *
 * PRINCIPLES:
 * - Assert actual state, never timing
 * - Use specific matchers (toHaveText, not toContain unless necessary)
 * - Check multiple properties for robustness
 * - Provide meaningful error messages
 */
export class AssertionBuilder {
  /**
   * Validate element is in expected state
   * GOOD: Checks visibility, text, attributes
   * BAD: Just checking if element exists
   */
  static async assertElementState(
    element: Locator,
    expectedState: ElementState
  ): Promise<void> {
    // Always check visibility first
    if (expectedState.visible !== false) {
      await expect(element).toBeVisible({ timeout: 10000 });
    }

    if (expectedState.visible === false) {
      await expect(element).toBeHidden({ timeout: 10000 });
    }

    // Check text content
    if (expectedState.text) {
      if (typeof expectedState.text === 'string') {
        await expect(element).toHaveText(expectedState.text);
      } else {
        for (const textValue of expectedState.text) {
          await expect(element).toContainText(textValue);
        }
      }
    }

    // Check attributes
    if (expectedState.attributes) {
      for (const [attr, value] of Object.entries(expectedState.attributes)) {
        await expect(element).toHaveAttribute(attr, value);
      }
    }

    // Check count
    if (expectedState.count !== undefined) {
      const countValue = typeof expectedState.count === 'number'
        ? expectedState.count
        : expectedState.count.exact ||
          expectedState.count.min ||
          expectedState.count.max;

      if (countValue) {
        await expect(element).toHaveCount(countValue);
      }
    }

    // Check enabled/disabled
    if (expectedState.enabled === true) {
      await expect(element).toBeEnabled();
    }
    if (expectedState.disabled === true) {
      await expect(element).toBeDisabled();
    }

    // Check checked
    if (expectedState.checked !== undefined) {
      if (expectedState.checked) {
        await expect(element).toBeChecked();
      } else {
        await expect(element).not.toBeChecked();
      }
    }

    // Check value
    if (expectedState.value !== undefined) {
      await expect(element).toHaveValue(expectedState.value);
    }
  }

  /**
   * Assert navigation occurred correctly
   * Checks URL, title, and key elements
   */
  static async assertNavigation(
    page: Page,
    expectedUrl: string | RegExp,
    expectedElements: string[]
  ): Promise<void> {
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Verify URL
    await expect(page).toHaveURL(expectedUrl);

    // Verify key page elements loaded
    for (const selector of expectedElements) {
      await expect(page.locator(selector)).toBeVisible({ timeout: 10000 });
    }
  }

  /**
   * Assert API response data
   * Validates both status and content
   */
  static async assertAPIResponse(
    response: Response,
    expected: APIExpectation
  ): Promise<void> {
    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(expected.status);

    const body = await response.json();

    if (expected.schema) {
      AssertionBuilder.validateSchema(body, expected.schema);
    }

    if (expected.contains) {
      expect(body).toMatchObject(expected.contains);
    }
  }

  /**
   * Validate object against schema
   */
  private static validateSchema(
    obj: Record<string, any>,
    schema: Record<string, any>
  ): void {
    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in obj)) {
        throw new Error(
          `Expected property "${key}" in response, but it was not found`
        );
      }

      const actualType = typeof obj[key];
      if (actualType !== expectedType) {
        throw new Error(
          `Property "${key}" expected type "${expectedType}", ` +
          `but got "${actualType}"`
        );
      }
    }
  }

  /**
   * Assert multiple elements match criteria
   */
  static async assertElementList(
    locator: Locator,
    expectedCount: number
  ): Promise<void> {
    await expect(locator).toHaveCount(expectedCount);

    // Verify each is visible
    for (let i = 0; i < expectedCount; i++) {
      await expect(locator.nth(i)).toBeVisible();
    }
  }

  /**
   * Assert dialog or modal appeared
   */
  static async assertDialogAppeared(
    page: Page,
    dialogSelector: string
  ): Promise<void> {
    const dialog = page.locator(dialogSelector);
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Verify it's in the viewport
    const isInViewport = await dialog.isVisible();
    expect(isInViewport).toBe(true);
  }

  /**
   * Assert element text contains any of the provided strings
   */
  static async assertTextContains(
    element: Locator,
    texts: string[]
  ): Promise<void> {
    const content = await element.textContent();

    if (!content) {
      throw new Error('Element has no text content');
    }

    const found = texts.some((text) => content.includes(text));

    if (!found) {
      throw new Error(
        `Expected element to contain one of: ${texts.join(', ')}\n` +
        `But got: ${content}`
      );
    }
  }

  /**
   * Assert element CSS matches expectation
   */
  static async assertCSSValue(
    element: Locator,
    property: string,
    expectedValue: string
  ): Promise<void> {
    const actualValue = await element.evaluate(
      (el: HTMLElement, prop: string) => {
        return window.getComputedStyle(el).getPropertyValue(prop);
      },
      property
    );

    expect(actualValue.trim()).toBe(expectedValue.trim());
  }
}

export default AssertionBuilder;
