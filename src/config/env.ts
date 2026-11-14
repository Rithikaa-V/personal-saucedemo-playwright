import 'dotenv/config';

/** Single source of truth for configuration. Nothing else reads process.env. */
export const env = {
  uiBaseUrl: process.env.UI_BASE_URL ?? 'https://www.saucedemo.com',
  uiPassword: process.env.UI_PASSWORD ?? 'secret_sauce',
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://restful-booker.herokuapp.com',
  apiUser: process.env.API_USER ?? 'admin',
  apiPassword: process.env.API_PASSWORD ?? 'password123',
  dbPath: process.env.DB_PATH ?? ':memory:',
  isCI: !!process.env.CI,
} as const;
