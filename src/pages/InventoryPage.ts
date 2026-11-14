import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage extends BasePage {
  readonly title: Locator;
  readonly items: Locator;
  readonly sortSelect: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.sortSelect = page.getByTestId('product-sort-container');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async goto(): Promise<void> {
    await this.open('/inventory.html');
    await expect(this.title).toHaveText('Products');
  }

  async addToCart(slug: string): Promise<void> {
    await this.page.getByTestId(`add-to-cart-${slug}`).click();
  }

  async removeFromCart(slug: string): Promise<void> {
    await this.page.getByTestId(`remove-${slug}`).click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async names(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allTextContents();
  }

  async prices(): Promise<number[]> {
    const raw = await this.page.getByTestId('inventory-item-price').allTextContents();
    return raw.map((t) => Number(t.replace('$', '')));
  }

  async priceOf(slug: string): Promise<number> {
    const text = await this.page
      .getByTestId('inventory-item')
      .filter({ has: this.page.getByTestId(`add-to-cart-${slug}`).or(this.page.getByTestId(`remove-${slug}`)) })
      .getByTestId('inventory-item-price')
      .innerText();
    return Number(text.replace('$', ''));
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
