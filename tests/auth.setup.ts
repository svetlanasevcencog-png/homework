import { test as setup } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { AUTH_STORAGE_PATH } from '../fixtures/auth.constants';
import { LoginPage } from '../pages/login.page';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const EMAIL = process.env.DIDAXIS_EMAIL;
const PASSWORD = process.env.DIDAXIS_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error(
    'DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be defined in .env for auth setup.',
  );
}

setup('authenticate as admin', async ({ page }) => {
  const login = new LoginPage(page);
  await login.login(EMAIL, PASSWORD);

  fs.mkdirSync(path.dirname(AUTH_STORAGE_PATH), { recursive: true });
  await page.context().storageState({ path: AUTH_STORAGE_PATH });
});
