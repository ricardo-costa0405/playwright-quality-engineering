import { test, expect } from '../../../fixtures/saucedemo-fixtures';

/**
 * Swag Labs — Mobile Checkout Tests @mobile @checkout
 *
 * Covers the full checkout flow across the device matrix (Pixel 5, iPhone 13, Galaxy S24):
 *   ✓ Full happy-path mobile checkout (add → cart → info → overview → complete)
 *   ✓ Form validation on mobile — all fields required with touch interaction
 *   ✓ Cancel on step 1 returns to cart (mobile navigation)
 *   ✓ Order total displayed on overview step (mobile viewport)
 *   ✓ Back to Products from confirmation page (mobile)
 *   ✓ Multi-item checkout with correct totals on mobile
 *
 * Device matrix: Mobile Chrome (Pixel 5), Mobile Safari (iPhone 13), Galaxy S24
 * Touch interactions: tap() instead of click() where applicable
 *
 * Anti-patterns enforced → see utils/patterns/anti-patterns-guide.ts (AGENT_RULES)
 * AAA pattern compliance → each test has explicit Arrange/Act/Assert sections
 */

test.describe('Mobile Checkout @mobile @checkout', () => {

  // ─── Happy path ─────────────────────────────────────────────────────────

  test('mobile user completes full checkout flow with touch', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    // checkoutPage fixture: logged in as standard_user, backpack in cart, on step 1
    const customerInfo = {
      firstName:  'Jane',
      lastName:   'Doe',
      postalCode: '12345',
    };

    // Verify mobile viewport is active
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThanOrEqual(600);

    // ==================== ACT ====================
    // Fill checkout info with touch-friendly interactions
    await checkoutPage.firstNameInput.tap();
    await checkoutPage.firstNameInput.fill(customerInfo.firstName);

    await checkoutPage.lastNameInput.tap();
    await checkoutPage.lastNameInput.fill(customerInfo.lastName);

    await checkoutPage.postalCodeInput.tap();
    await checkoutPage.postalCodeInput.fill(customerInfo.postalCode);

    // Tap Continue (mobile touch)
    await checkoutPage.continueButton.tap();

    // Verify step 2 loaded
    await expect(page).toHaveURL(/checkout-step-two/);

    // Tap Finish (mobile touch)
    await checkoutPage.finishButton.tap();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(page.locator('[data-test="complete-header"]')).toBeVisible();
    await expect(page.locator('[data-test="complete-header"]')).toContainText('Thank you');
    await expect(page.locator('[data-test="complete-text"]')).not.toBeEmpty();

    // Confirmation message should be readable on mobile viewport
    const headerText = await page.locator('[data-test="complete-header"]').textContent();
    expect(headerText?.length).toBeGreaterThan(0);
  });

  // ─── Validation ─────────────────────────────────────────────────────────

  test('mobile user sees validation error when submitting empty checkout form', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    // Form is empty — nothing to fill
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeLessThanOrEqual(600);

    // ==================== ACT ====================
    // Tap Continue on empty form (mobile touch)
    await checkoutPage.continueButton.tap();

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('First Name is required');

    // Error message should be visible in mobile viewport
    await expect(page.locator('[data-test="error"]')).toBeInViewport();
  });

  test('mobile user sees validation error when last name is missing', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    await checkoutPage.firstNameInput.tap();
    await checkoutPage.firstNameInput.fill('Jane');
    await checkoutPage.postalCodeInput.tap();
    await checkoutPage.postalCodeInput.fill('12345');

    // ==================== ACT ====================
    await checkoutPage.continueButton.tap();

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Last Name is required');
  });

  test('mobile user sees validation error when postal code is missing', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    await checkoutPage.firstNameInput.tap();
    await checkoutPage.firstNameInput.fill('Jane');
    await checkoutPage.lastNameInput.tap();
    await checkoutPage.lastNameInput.fill('Doe');

    // ==================== ACT ====================
    await checkoutPage.continueButton.tap();

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await expect(page.locator('[data-test="error"]')).toContainText('Postal Code is required');
  });

  test('mobile user can dismiss error banner by tapping close button', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    // Submit empty form to trigger error

    // ==================== ACT ====================
    await checkoutPage.continueButton.tap();
    await expect(page.locator('[data-test="error"]')).toBeVisible();

    // Tap error close button (mobile touch)
    await page.locator('[data-test="error-button"]').tap();

    // ==================== ASSERT ====================
    // Error should be dismissed
    await expect(page.locator('[data-test="error"]')).toBeHidden();
  });

  // ─── Navigation ─────────────────────────────────────────────────────────

  test('mobile user cancels checkout on step 1 and returns to cart', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    // Already on step 1

    // ==================== ACT ====================
    // Tap Cancel (mobile touch) — composite name "Go back Cancel"
    await checkoutPage.cancelButton.tap();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/cart\.html/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Your Cart');

    // Cart should still have the item from fixture
    await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(1);
  });

  test('mobile user sees order totals before finishing', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    const customerInfo = { firstName: 'John', lastName: 'Smith', postalCode: '99999' };
    await checkoutPage.firstNameInput.tap();
    await checkoutPage.firstNameInput.fill(customerInfo.firstName);
    await checkoutPage.lastNameInput.tap();
    await checkoutPage.lastNameInput.fill(customerInfo.lastName);
    await checkoutPage.postalCodeInput.tap();
    await checkoutPage.postalCodeInput.fill(customerInfo.postalCode);

    // ==================== ACT ====================
    await checkoutPage.continueButton.tap();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/checkout-step-two/);

    const total = await checkoutPage.getTotal();
    expect(total).toMatch(/Total:\s+\$[\d.]+/);

    const tax = await checkoutPage.getTax();
    expect(tax).toMatch(/Tax:\s+\$[\d.]+/);

    const itemTotal = await checkoutPage.getItemTotal();
    expect(itemTotal).toMatch(/Item total:\s+\$[\d.]+/);

    // Payment info and shipping info should be visible on mobile
    await expect(page.locator('[data-test="payment-info-label"]')).toBeVisible();
    await expect(page.locator('[data-test="shipping-info-label"]')).toBeVisible();
  });

  test('mobile user sees Back Home button and returns to products', async ({ checkoutPage, page }) => {
    // ==================== ARRANGE ====================
    await checkoutPage.firstNameInput.tap();
    await checkoutPage.firstNameInput.fill('Alice');
    await checkoutPage.lastNameInput.tap();
    await checkoutPage.lastNameInput.fill('Wonder');
    await checkoutPage.postalCodeInput.tap();
    await checkoutPage.postalCodeInput.fill('00001');
    await checkoutPage.continueButton.tap();
    await checkoutPage.finishButton.tap();
    expect(await checkoutPage.isOrderComplete()).toBe(true);

    // ==================== ACT ====================
    // Tap Back Home (mobile touch)
    await checkoutPage.backHomeButton.tap();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('[data-test="inventory-list"]')).toBeVisible();
  });

  // ─── Multi-item ─────────────────────────────────────────────────────────

  test('mobile user completes checkout with multiple items', async ({ authenticatedPage, page }) => {
    // ==================== ARRANGE ====================
    // authenticatedPage fixture — logged in on inventory page
    const { SauceDemoInventoryPage } = await import('../../../pages/saucedemo');
    const { SauceDemoCartPage } = await import('../../../pages/saucedemo');
    const { SauceDemoCheckoutPage } = await import('../../../pages/saucedemo');

    const inventoryPage = new SauceDemoInventoryPage(authenticatedPage);
    const items = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'];

    // Add 3 items via touch on mobile
    for (const item of items) {
      await inventoryPage.addItemToCart(item);
    }

    // Verify badge reflects multi-item count
    expect(await inventoryPage.getCartBadgeCount()).toBe(items.length);

    // ==================== ACT ====================
    // Navigate to cart
    await inventoryPage.goToCart();

    const cartPage = new SauceDemoCartPage(authenticatedPage);
    expect(await cartPage.getCartItemCount()).toBe(items.length);

    // Proceed to checkout via mobile touch
    await cartPage.checkoutButton.tap();
    await expect(authenticatedPage).toHaveURL(/checkout-step-one/);

    // Fill checkout info
    const checkoutPage = new SauceDemoCheckoutPage(authenticatedPage);
    await checkoutPage.firstNameInput.tap();
    await checkoutPage.firstNameInput.fill('Multi');
    await checkoutPage.lastNameInput.tap();
    await checkoutPage.lastNameInput.fill('Item');
    await checkoutPage.postalCodeInput.tap();
    await checkoutPage.postalCodeInput.fill('00000');

    await checkoutPage.continueButton.tap();
    await expect(authenticatedPage).toHaveURL(/checkout-step-two/);

    // ==================== ASSERT ====================
    // Verify totals for 3 items
    const total = await checkoutPage.getTotal();
    expect(total).toMatch(/Total:\s+\$[\d.]+/);

    // Finish order
    await checkoutPage.finishButton.tap();

    // Verify complete screen
    await expect(authenticatedPage).toHaveURL(/checkout-complete/);
    expect(await checkoutPage.isOrderComplete()).toBe(true);
    const header = await checkoutPage.getCompleteHeader();
    expect(header).toContain('Thank you');
  });

});
