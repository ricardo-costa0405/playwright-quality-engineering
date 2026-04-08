import { test, expect } from '../fixtures/saucedemo-fixtures';

/**
 * Swag Labs — Product Details Feature Tests @product-details
 *
 * Covers:
 *   ✓ Clicking product image navigates to product detail page
 *   ✓ Clicking product name navigates to product detail page
 *   ✓ Product detail page displays all required information
 *   ✓ Product images load successfully on detail page
 *   ✓ Add to cart from detail page works correctly
 *   ✓ Back to inventory from detail page works correctly
 *   ✓ Remove from cart on detail page works correctly
 *   ✓ Product description is displayed and readable
 *
 * Anti-patterns enforced → AAA pattern compliance
 *
 * Note: Product detail page shows individual product information
 * with additional features like full description and image gallery.
 */

test.describe('Product Details Feature @product-details', () => {

  // ─── Navigation to product details ───────────────────────────────────────

  test('clicking product image navigates to product details', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    const productImage = page.locator('.inventory_item_img img').first();
    await expect(productImage).toBeVisible();

    // ==================== ACT ====================
    await productImage.click();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory-item/);
    await expect(page.locator('[data-test="inventory-item"]')).toBeVisible();
    await expect(page.locator('.inventory_details_desc_container')).toBeVisible();
  });

  test('clicking product name navigates to product details', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    const productName = page.locator('[data-test="inventory-item-name"]').first();
    await expect(productName).toBeVisible();

    // ==================== ACT ====================
    await productName.click();

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory-item/);
    await expect(page.locator('[data-test="inventory-item"]')).toBeVisible();
  });

  test('product detail page displays product name and price', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    const productName = await page
      .locator('[data-test="inventory-item-name"]')
      .first()
      .textContent();

    // ==================== ACT ====================
    await page.locator('[data-test="inventory-item-name"]').first().click();

    // ==================== ASSERT ====================
    const detailName = await page.locator('[data-test="inventory-item-name"]').textContent();
    expect(detailName).toBe(productName);

    const detailPrice = await page.locator('[data-test="inventory-item-price"]').textContent();
    expect(detailPrice).toMatch(/\$[\d.]+/);
  });

  test('product detail image loads successfully', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    await page.locator('[data-test="inventory-item-name"]').first().click();
    await expect(page).toHaveURL(/inventory-item/);

    // ==================== ACT ====================
    // .inventory_details_img IS the <img> element — do not chain >> img into it
    const detailImage = page.locator('.inventory_details_img');

    // ==================== ASSERT ====================
    await expect(detailImage).toBeVisible();
    await expect(detailImage).toHaveCount(1);

    const src = await detailImage.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).not.toBe('');
  });

  test('product detail displays full description', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    await page.locator('[data-test="inventory-item-name"]').first().click();
    await expect(page).toHaveURL(/inventory-item/);

    // ==================== ACT ====================
    const description = await page.locator('[data-test="inventory-item-desc"]').textContent();

    // ==================== ASSERT ====================
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(10);
    await expect(page.locator('[data-test="inventory-item-desc"]')).toBeVisible();
  });

  // ─── Add to cart from product details ─────────────────────────────────────

  test('add to cart button on detail page adds item correctly', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    await page.locator('[data-test="inventory-item-name"]').first().click();
    await expect(page).toHaveURL(/inventory-item/);

    // ==================== ACT ====================
    await page.click('[data-test="add-to-cart"]');

    // ==================== ASSERT ====================
    // Button should change to "Remove"
    await expect(page.locator('[data-test="remove"]')).toBeVisible();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  });

  test('remove from cart button on detail page removes item correctly', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    await page.locator('[data-test="inventory-item-name"]').first().click();
    await expect(page).toHaveURL(/inventory-item/);

    await page.click('[data-test="add-to-cart"]');
    await expect(page.locator('[data-test="remove"]')).toBeVisible();

    // ==================== ACT ====================
    await page.click('[data-test="remove"]');

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="add-to-cart"]')).toBeVisible();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toBeHidden();
  });

  // ─── Navigation from product details ──────────────────────────────────────

  test('back button returns to inventory from product details', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    await page.locator('[data-test="inventory-item-name"]').first().click();
    await expect(page).toHaveURL(/inventory-item/);

    // ==================== ACT ====================
    await page.click('[data-test="back-to-products"]');

    // ==================== ASSERT ====================
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.locator('[data-test="inventory-list"]')).toBeVisible();
  });

  // ─── Multiple product details navigation ───────────────────────────────────

  test('can navigate between different product details', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    const firstProductName = await page.locator('[data-test="inventory-item-name"]').nth(0).textContent();

    // ==================== ACT ====================
    await page.locator('[data-test="inventory-item-name"]').nth(0).click();
    await expect(page).toHaveURL(/inventory-item/);

    await page.click('[data-test="back-to-products"]');
    await expect(page).toHaveURL(/inventory\.html/);

    const secondProductName = await page.locator('[data-test="inventory-item-name"]').nth(1).textContent();

    await page.locator('[data-test="inventory-item-name"]').nth(1).click();
    await expect(page).toHaveURL(/inventory-item/);

    const detailName = await page.locator('[data-test="inventory-item-name"]').textContent();

    // ==================== ASSERT ====================
    expect(detailName).toBe(secondProductName);
    expect(detailName).not.toBe(firstProductName);
  });

  test('cart state persists when navigating between product details', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    await page.locator('[data-test="inventory-item-name"]').nth(0).click();
    await page.click('[data-test="add-to-cart"]');
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    // ==================== ACT ====================
    await page.click('[data-test="back-to-products"]');
    await page.locator('[data-test="inventory-item-name"]').nth(1).click();

    // ==================== ASSERT ====================
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await page.click('[data-test="add-to-cart"]');
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');
  });

  test('product detail page shows correct add/remove button state based on cart', async ({
    inventoryPage: _inventoryPage,
    page,
  }) => {
    // ==================== ARRANGE ====================
    await page.locator('[data-test="inventory-item-name"]').first().click();

    // ==================== ACT ====================
    let button = page.locator('[data-test="add-to-cart"]');

    // ==================== ASSERT ====================
    await expect(button).toBeVisible();

    await button.click();
    button = page.locator('[data-test="remove"]');
    await expect(button).toBeVisible();

    await button.click();
    button = page.locator('[data-test="add-to-cart"]');
    await expect(button).toBeVisible();
  });

});
