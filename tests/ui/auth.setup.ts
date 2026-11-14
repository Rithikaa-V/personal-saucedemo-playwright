import { test as setup } from '@playwright/test';
import { AUTH_FILE } from '../../src/config/paths';
import { InventoryPage } from '../../src/pages/InventoryPage';
import { LoginPage } from '../../src/pages/LoginPage';
import { PASSWORD } from '../../src/data/users';

/** Log in once, reuse the session everywhere (saves ~2s per test). */
setup('authenticate standard_user', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('standard_user', PASSWORD);
  await new InventoryPage(page).title.waitFor();
  await page.context().storageState({ path: AUTH_FILE });
});
