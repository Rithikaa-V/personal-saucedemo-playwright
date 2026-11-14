import { test, expect } from '../../src/fixtures';
import { loadCheckoutCustomers } from '../../src/db/TestDataRepo';

// Test data comes from SQL, not from literals in the spec.
const validCustomers = loadCheckoutCustomers('valid');
const invalidCustomers = loadCheckoutCustomers('missing_%');

const ITEMS = ['sauce-labs-backpack', 'sauce-labs-bike-light'];

test.describe('Checkout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  for (const customer of validCustomers) {
    test(`E2E purchase as ${customer.first_name} ${customer.last_name}`, { tag: '@smoke' }, async ({
      inventoryPage, cartPage, checkoutPage,
    }) => {
      let expectedTotal = 0;
      for (const slug of ITEMS) {
        expectedTotal += await inventoryPage.priceOf(slug);
        await inventoryPage.addToCart(slug);
      }
      await inventoryPage.openCart();
      await cartPage.expectItemCount(ITEMS.length);
      await cartPage.checkout();
      await checkoutPage.fillCustomer(customer);

      expect(await checkoutPage.subtotalAmount()).toBeCloseTo(expectedTotal, 2);
      await checkoutPage.finish();
    });
  }

  for (const customer of invalidCustomers) {
    test(`validation: ${customer.scenario}`, { tag: '@regression' }, async ({
      inventoryPage, cartPage, checkoutPage,
    }) => {
      await inventoryPage.addToCart(ITEMS[0]!);
      await inventoryPage.openCart();
      await cartPage.checkout();
      await checkoutPage.fillCustomer(customer);
      await expect(checkoutPage.error).toHaveText(customer.expected_error!);
    });
  }
});
