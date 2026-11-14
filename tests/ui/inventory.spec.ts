import { test, expect } from '../../src/fixtures';
import type { SortOption } from '../../src/pages/InventoryPage';

test.describe('Inventory', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  // Property-based: we don't hard-code order, we assert the invariant.
  const sorts: { option: SortOption; kind: 'names' | 'prices'; asc: boolean }[] = [
    { option: 'az', kind: 'names', asc: true },
    { option: 'za', kind: 'names', asc: false },
    { option: 'lohi', kind: 'prices', asc: true },
    { option: 'hilo', kind: 'prices', asc: false },
  ];

  for (const s of sorts) {
    test(`sort by ${s.option}`, { tag: '@regression' }, async ({ inventoryPage }) => {
      await inventoryPage.sortBy(s.option);
      const actual = s.kind === 'names' ? await inventoryPage.names() : await inventoryPage.prices();
      const expected = [...actual].sort((a, b) =>
        typeof a === 'string' ? a.localeCompare(b as string) : (a as number) - (b as number),
      );
      if (!s.asc) expected.reverse();
      expect(actual).toEqual(expected);
    });
  }

  test('cart badge tracks add/remove', { tag: '@smoke' }, async ({ inventoryPage }) => {
    await inventoryPage.addToCart('sauce-labs-backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');
    await inventoryPage.addToCart('sauce-labs-bike-light');
    await expect(inventoryPage.cartBadge).toHaveText('2');
    await inventoryPage.removeFromCart('sauce-labs-backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');
    await inventoryPage.removeFromCart('sauce-labs-bike-light');
    await expect(inventoryPage.cartBadge).toBeHidden();
  });
});
