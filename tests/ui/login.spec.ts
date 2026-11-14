import { test, expect } from '../../src/fixtures';
import { ERRORS, PASSWORD } from '../../src/data/users';

// Login tests must start unauthenticated.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  const validUsers = ['standard_user', 'problem_user', 'performance_glitch_user'];

  for (const user of validUsers) {
    test(`valid login: ${user}`, { tag: user === 'standard_user' ? '@smoke' : '@regression' }, async ({ loginPage, inventoryPage, page }) => {
      test.slow(user === 'performance_glitch_user'); // intentionally slow account
      await loginPage.goto();
      await loginPage.login(user, PASSWORD);
      await expect(page).toHaveURL(/inventory\.html/);
      await expect(inventoryPage.items).toHaveCount(6);
    });
  }

  const negative = [
    { name: 'locked out user', user: 'locked_out_user', pass: PASSWORD, error: ERRORS.locked },
    { name: 'wrong password', user: 'standard_user', pass: 'nope', error: ERRORS.mismatch },
    { name: 'unknown user', user: 'ghost', pass: PASSWORD, error: ERRORS.mismatch },
    { name: 'empty username', user: '', pass: PASSWORD, error: ERRORS.noUser },
    { name: 'empty password', user: 'standard_user', pass: '', error: ERRORS.noPassword },
  ];

  for (const c of negative) {
    test(`rejects: ${c.name}`, { tag: '@regression' }, async ({ loginPage, page }) => {
      await loginPage.goto();
      await loginPage.login(c.user, c.pass);
      await loginPage.expectError(c.error);
      await expect(page).not.toHaveURL(/inventory/);
    });
  }

  test('protected page redirects when not logged in', { tag: '@regression' }, async ({ page, loginPage }) => {
    await page.goto('/inventory.html');
    await expect(loginPage.error).toContainText("You can only access '/inventory.html' when you are logged in");
  });
});
