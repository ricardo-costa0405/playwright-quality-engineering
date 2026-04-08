import { test, expect } from '../fixtures/saucedemo-fixtures';

/**
 * Swag Labs — Checkout Feature Tests @checkout
 *
 * Covers:
 *   ✓ Full happy-path checkout (login → add → cart → info → overview → complete)
 *   ✓ Form validation — all fields required
 *   ✓ Cancel on step 1 returns to cart
 *   ✓ Order total displayed on overview step
 *   ✓ Back to Products from confirmation page
 *
 * Anti-patterns enforced → see utils/patterns/anti-patterns-guide.ts (AGENT_RULES)
 */

test.describe('Checkout Feature @checkout', () => {

  // ─── Happy path ─────────────────────────────────────────────────────────

  test('completes full checkout flow successfully', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    // checkoutPage fixture: logged in, backpack in cart, on step 1
    const customerInfo = {
      firstName:  'Jane',
      lastName:   'Doe',
      postalCode: '12345',
    };

    // ==================== ACT ====================
    await checkoutPage.fillInfo(customerInfo);
    await checkoutPage.continueToOverview();

    // Verify step 2 loaded
    await expect(page).toHaveURL(/checkout-step-two/);
    await checkoutPage.finishOrder();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(page.locator('[data-test="complete-header"]')).toBeVisible();
    await expect(page.locator('[data-test="complete-header"]')).toContainText('Thank you');
    await expect(page.locator('[data-test="complete-text"]')).not.toBeEmpty();
  });

  // ─── Validation ──────────────────────────────────────────────────────────

  test('submitting empty info form shows validation error', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    // Form is empty — nothing to arrange

    // ==================== ACT ====================
    await checkoutPage.continueToOverview();

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('First Name is required');
  });

  test('missing last name shows validation error', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    await checkoutPage.fillInfo({ firstName: 'Jane', lastName: '', postalCode: '12345' });

    // ==================== ACT ====================
    await checkoutPage.continueToOverview();

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Last Name is required');
  });

  test('missing postal code shows validation error', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    await checkoutPage.fillInfo({ firstName: 'Jane', lastName: 'Doe', postalCode: '' });

    // ==================== ACT ====================
    await checkoutPage.continueToOverview();

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Postal Code is required');
  });

  // ─── Navigation ──────────────────────────────────────────────────────────

  test('cancel on step 1 returns to cart', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    // On step 1

    // ==================== ACT ====================
    await checkoutPage.cancelCheckout();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/cart\.html/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Your Cart');
  });

  test('order overview displays total before finishing', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    const customerInfo = { firstName: 'John', lastName: 'Smith', postalCode: '99999' };
    await checkoutPage.fillInfo(customerInfo);

    // ==================== ACT ====================
    await checkoutPage.continueToOverview();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/checkout-step-two/);

    const total = await checkoutPage.getTotal();
    // Total should be a dollar amount — e.g. "Total: $32.39"
    expect(total).toMatch(/Total:\s+\$[\d.]+/);

    const tax = await checkoutPage.getTax();
    expect(tax).toMatch(/Tax:\s+\$[\d.]+/);
  });

  test('Back to Products from confirmation returns to inventory', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    await checkoutPage.fillInfo({ firstName: 'Alice', lastName: 'Wonder', postalCode: '00001' });
    await checkoutPage.continueToOverview();
    await checkoutPage.finishOrder();
    expect(await checkoutPage.isOrderComplete()).toBe(true);

    // ==================== ACT ====================
    await checkoutPage.backToProducts();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('[data-test="inventory-list"]')).toBeVisible();
  });

});
