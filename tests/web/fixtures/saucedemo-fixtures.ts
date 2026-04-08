import { test as base, expect } from '@playwright/test';
import { SauceDemoLoginPage }    from '../pages/saucedemo/SauceDemoLoginPage';
import { SauceDemoInventoryPage } from '../pages/saucedemo/SauceDemoInventoryPage';
import { SauceDemoCartPage }     from '../pages/saucedemo/SauceDemoCartPage';
import { SauceDemoCheckoutPage } from '../pages/saucedemo/SauceDemoCheckoutPage';

// ─── Credentials ─────────────────────────────────────────────────────────────
// All Swag Labs users share the same password.
// Each user type exposes a different behaviour useful for testing:
//
//  standard_user          → fully functional, the happy path
//  locked_out_user        → blocked at login — tests error state
//  problem_user           → logged in but with broken images / wrong names
//  performance_glitch_user → logged in but artificially slow (>5 s)
export const SAUCE_CREDENTIALS = {
  standard: { username: 'standard_user',           password: 'secret_sauce' },
  locked:   { username: 'locked_out_user',          password: 'secret_sauce' },
  problem:  { username: 'problem_user',             password: 'secret_sauce' },
  glitch:   { username: 'performance_glitch_user',  password: 'secret_sauce' },
} as const;

// ─── Fixture types ───────────────────────────────────────────────────────────
type SauceDemoFixtures = {
  /** Arrives at the login page, ready to interact */
  loginPage: SauceDemoLoginPage;

  /** Already authenticated as standard_user, on the inventory page */
  inventoryPage: SauceDemoInventoryPage;

  /** Already authenticated + navigated to the cart page */
  cartPage: SauceDemoCartPage;

  /** Already authenticated + navigated to checkout step 1 */
  checkoutPage: SauceDemoCheckoutPage;
};

// ─── Extended test ───────────────────────────────────────────────────────────
export const test = base.extend<SauceDemoFixtures>({

  loginPage: async ({ page }, use) => {
    const loginPage = new SauceDemoLoginPage(page);
    await loginPage.navigate();
    await use(loginPage);
  },

  inventoryPage: async ({ page }, use) => {
    // UI login — fastest reliable approach for SauceDemo (no token/cookie trick)
    const loginPage = new SauceDemoLoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      SAUCE_CREDENTIALS.standard.username,
      SAUCE_CREDENTIALS.standard.password
    );

    const inventoryPage = new SauceDemoInventoryPage(page);
    await expect(page.locator('.inventory_list')).toBeVisible();
    await use(inventoryPage);

    await page.context().clearCookies();
  },

  cartPage: async ({ page }, use) => {
    const loginPage = new SauceDemoLoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      SAUCE_CREDENTIALS.standard.username,
      SAUCE_CREDENTIALS.standard.password
    );

    const inventoryPage = new SauceDemoInventoryPage(page);
    await expect(page.locator('.inventory_list')).toBeVisible();
    await inventoryPage.goToCart();

    const cartPage = new SauceDemoCartPage(page);
    await expect(page.locator('.title')).toHaveText('Your Cart');
    await use(cartPage);

    await page.context().clearCookies();
  },

  checkoutPage: async ({ page }, use) => {
    const loginPage = new SauceDemoLoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      SAUCE_CREDENTIALS.standard.username,
      SAUCE_CREDENTIALS.standard.password
    );

    const inventoryPage = new SauceDemoInventoryPage(page);
    await expect(page.locator('.inventory_list')).toBeVisible();
    // Add one item so the cart isn't empty before checkout
    await inventoryPage.addItemToCart('Sauce Labs Backpack');
    await inventoryPage.goToCart();

    const cartPage = new SauceDemoCartPage(page);
    await cartPage.proceedToCheckout();

    const checkoutPage = new SauceDemoCheckoutPage(page);
    await expect(page.locator('[data-test="firstName"]')).toBeVisible();
    await use(checkoutPage);

    await page.context().clearCookies();
  },

});

export { expect };
