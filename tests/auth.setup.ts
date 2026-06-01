import { test as setup } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {
  AUTH_STORAGE_PATH,
  DIDAXIS_LOGIN_URL,
} from '../fixtures/auth.constants';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const EMAIL = process.env.DIDAXIS_EMAIL;
const PASSWORD = process.env.DIDAXIS_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error(
    'DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be defined in .env for auth setup.',
  );
}

setup('authenticate as admin', async ({ page }) => {
  await page.goto(DIDAXIS_LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
    timeout: 30_000,
  });

  fs.mkdirSync(path.dirname(AUTH_STORAGE_PATH), { recursive: true });
  await page.context().storageState({ path: AUTH_STORAGE_PATH });
});
