import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
import { AUTH_FILE } from './src/config/paths';

/**
 * Three kinds of projects:
 *  - setup        : logs in once, saves storageState (fast, reusable auth)
 *  - ui-*         : browser tests, depend on setup, start already logged in
 *  - api          : pure HTTP tests, no browser, no setup dependency
 *
 * Reporters: CI emits "blob" so shards can be merged into ONE html report.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: env.isCI
    ? [['blob'], ['github'], ['list']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.uiBaseUrl,
    testIdAttribute: 'data-test', // SauceDemo's convention
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'ui-chromium',
      testMatch: /ui\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
    },
    ...(process.env.CROSS_BROWSER
      ? [
          {
            name: 'ui-firefox',
            testMatch: /ui\/.*\.spec\.ts/,
            dependencies: ['setup'],
            use: { ...devices['Desktop Firefox'], storageState: AUTH_FILE },
          },
          {
            name: 'ui-webkit',
            testMatch: /ui\/.*\.spec\.ts/,
            dependencies: ['setup'],
            use: { ...devices['Desktop Safari'], storageState: AUTH_FILE },
          },
        ]
      : []),
    { name: 'api', testMatch: /api\/.*\.spec\.ts/ },
  ],
});
