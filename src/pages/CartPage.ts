import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly items: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async expectItemCount(n: number): Promise<void> {
    await expect(this.items).toHaveCount(n);
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
