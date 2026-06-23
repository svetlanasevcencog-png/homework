import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import {
  AUTH_STORAGE_PATH,
  EMPTY_STORAGE_STATE,
} from './fixtures/auth.constants';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const didaxisSpecPattern = /ds\d+-.*\.spec\.ts/;
const loginPageSpecPattern = /login-page\.spec\.ts/;
const demoSpecIgnore = [
  /.*\.setup\.ts/,
  didaxisSpecPattern,
  loginPageSpecPattern,
];

/**
 * See https://playwright.dev/docs/test-configuration.
 * Auth: https://playwright.dev/docs/auth
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  // The shared test backend renders slowly under parallel load; the 5s
  // default expect timeout has produced false-negative flakes.
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    // Setup project: sign in once and write storageState to disk.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Unauthenticated specs (demo / examples).
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: demoSpecIgnore,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: demoSpecIgnore,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: demoSpecIgnore,
    },

    // Guest / unauthenticated Didaxis specs (no setup dependency).
    {
      name: 'chromium-guest',
      use: {
        ...devices['Desktop Chrome'],
        storageState: EMPTY_STORAGE_STATE,
      },
      testMatch: loginPageSpecPattern,
    },

    // Didaxis specs: depend on setup, then reuse persisted session.
    {
      name: 'chromium-didaxis',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STORAGE_PATH,
      },
      testMatch: didaxisSpecPattern,
      dependencies: ['setup'],
    },
    {
      name: 'firefox-didaxis',
      use: {
        ...devices['Desktop Firefox'],
        storageState: AUTH_STORAGE_PATH,
      },
      testMatch: didaxisSpecPattern,
      dependencies: ['setup'],
    },
    {
      name: 'webkit-didaxis',
      use: {
        ...devices['Desktop Safari'],
        storageState: AUTH_STORAGE_PATH,
      },
      testMatch: didaxisSpecPattern,
      dependencies: ['setup'],
    },
  ],
});
