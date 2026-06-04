import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { DIDAXIS_LOGIN_URL } from '../fixtures/auth.constants';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';
import { ProgramsPage } from '../pages/programs.page';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const EMAIL = process.env.DIDAXIS_EMAIL;
const PASSWORD = process.env.DIDAXIS_PASSWORD;

test.describe('Login page', () => {
  test('displays sign-in form', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(page).toHaveURL(DIDAXIS_LOGIN_URL);
    await expect(login.emailInput).toBeVisible();
    await expect(login.emailInput).toBeEnabled();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.passwordInput).toBeEnabled();
    await expect(login.signInButton).toBeVisible();
    await expect(login.signInButton).toBeEnabled();
  });

  test('redirects unauthenticated user from programs to login', async ({
    page,
  }) => {
    const programs = new ProgramsPage(page);
    await programs.goto();

    await expect(page).toHaveURL(/\/login/);

    const login = new LoginPage(page);
    await expect(login.signInButton).toBeVisible();
  });

  test('signs in with valid admin credentials', async ({ page }) => {
    test.skip(
      !EMAIL || !PASSWORD,
      'DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be defined in .env',
    );

    const login = new LoginPage(page);
    await login.login(EMAIL!, PASSWORD!);

    const dashboard = new DashboardPage(page);
    await expect(dashboard.heading).toBeVisible();
  });
});
