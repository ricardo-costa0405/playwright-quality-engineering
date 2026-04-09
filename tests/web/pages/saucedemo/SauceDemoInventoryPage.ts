import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * Sauce Demo Inventory Page — Page Object Model
 *
 * Covers:
 *  - Product listing (6 items)
 *  - Sorting (A-Z, Z-A, price low→high, price high→low)
 *  - Add / remove items to/from cart
 *  - Cart badge count
 *  - Navigation to cart
 *  - Logout via burger menu
 */
export class SauceDemoInventoryPage extends BasePage {
  private readonly SELECTORS = {
    title:         '[data-test="title"]',
    inventoryList: '[data-test="inventory-container"]',
    inventoryItem: '[data-test="inventory-item"]',
    itemName:      '[data-test="inventory-item-name"]',
    itemPrice:     '[data-test="inventory-item-price"]',
    cartBadge:     '[data-test="shopping-cart-badge"]',
    cartLink:      '[data-test="shopping-cart-link"]',
    sortDropdown:  '[data-test="product-sort-container"]',
    burgerMenu:    '[id="react-burger-menu-btn"]',
    logoutLink:    '[data-test="logout-sidebar-link"]',
    menuClose:     '[id="react-burger-cross-btn"]',
  } as const;

  protected getUrl(): string {
    return '/inventory.html';
  }

  protected async verifyPageLoaded(): Promise<void> {
    await expect(this.page.locator(this.SELECTORS.inventoryList)).toBeVisible();
    await expect(this.page.locator(this.SELECTORS.title)).toHaveText('Products');
  }

  // ─── Inventory queries ───────────────────────────────────────────────────

  async getItemCount(): Promise<number> {
    return this.page.locator(this.SELECTORS.inventoryItem).count();
  }

  async getItemNames(): Promise<string[]> {
    return this.page.locator(this.SELECTORS.itemName).allTextContents();
  }

  async getItemPrices(): Promise<number[]> {
    const texts = await this.page.locator(this.SELECTORS.itemPrice).allTextContents();
    return texts.map(t => parseFloat(t.replace('$', '')));
  }

  // ─── Cart actions ────────────────────────────────────────────────────────

  /**
   * Add an item by name — locates the button inside the item's own container.
   * More robust than computing the data-test attribute from the name string.
   */
  async addItemToCart(itemName: string): Promise<void> {
    const item = this.page.locator(this.SELECTORS.inventoryItem).filter({ hasText: itemName });
    await expect(item).toBeVisible();
    await item.getByRole('button').click();
  }

  /**
   * Remove an item that was already added — button label switches to "Remove".
   */
  async removeItemFromCart(itemName: string): Promise<void> {
    const item = this.page.locator(this.SELECTORS.inventoryItem).filter({ hasText: itemName });
    await expect(item).toBeVisible();
    await item.getByRole('button').click();
  }

  async getCartBadgeCount(): Promise<number> {
    const badge = this.page.locator(this.SELECTORS.cartBadge);
    if (await badge.count() === 0) return 0;
    try {
      await expect(badge).toBeVisible();
      return parseInt((await badge.textContent()) ?? '0', 10);
    } catch {
      return 0;
    }
  }

  // ─── Sorting ─────────────────────────────────────────────────────────────

  async sortBy(option: SortOption): Promise<void> {
    await this.page.locator(this.SELECTORS.sortDropdown).selectOption(option);
    // Wait for DOM to reflect the new order
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  async goToCart(): Promise<void> {
    await this.page.locator(this.SELECTORS.cartLink).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async logout(): Promise<void> {
    await this.page.locator(this.SELECTORS.burgerMenu).click();
    await expect(this.page.locator(this.SELECTORS.logoutLink)).toBeVisible();
    await this.page.locator(this.SELECTORS.logoutLink).click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
