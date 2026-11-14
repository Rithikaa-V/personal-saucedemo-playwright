import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface CustomerInfo {
  first_name: string;
  last_name: string;
  postal_code: string;
}

export class CheckoutPage extends BasePage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly error: Locator;
  readonly subtotal: Locator;
  readonly completeHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.finishButton = page.getByTestId('finish');
    this.error = page.getByTestId('error');
    this.subtotal = page.getByTestId('subtotal-label');
    this.completeHeader = page.getByTestId('complete-header');
  }

  async fillCustomer(c: CustomerInfo): Promise<void> {
    await this.firstName.fill(c.first_name);
    await this.lastName.fill(c.last_name);
    await this.postalCode.fill(c.postal_code);
    await this.continueButton.click();
  }

  /** Parses "Item total: $39.98" -> 39.98 */
  async subtotalAmount(): Promise<number> {
    const text = await this.subtotal.innerText();
    const match = /\$(\d+(?:\.\d{2})?)/.exec(text);
    if (!match?.[1]) throw new Error(`Cannot parse subtotal from "${text}"`);
    return Number(match[1]);
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }
}
