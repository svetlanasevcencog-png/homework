import { expect } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { DIDAXIS_URL, EMPTY_STORAGE_STATE } from '../../fixtures/auth.constants';
import {
  DASHBOARD_BLOCK_NAMES,
  type DashboardBlockName,
} from '../../pages/components/dashboard-cards';
import { DashboardPage } from '../../pages/dashboard.page';

export async function openDashboard(page: Page): Promise<DashboardPage> {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await expect(dashboard.heading).toBeVisible();
  return dashboard;
}

export async function expectDashboardBlocksVisible(
  dashboard: DashboardPage,
): Promise<void> {
  for (const name of DASHBOARD_BLOCK_NAMES) {
    await expect.soft(dashboard.cards.card(name)).toBeVisible();
    await expect.soft(dashboard.cards.title(name)).toBeVisible();
  }
}

/** Verify an unauthenticated visitor to `/` is redirected to login with no dashboard cards. */
export async function assertGuestRedirectedFromDashboard(
  browser: Browser,
): Promise<void> {
  const guest = await browser.newContext({ storageState: EMPTY_STORAGE_STATE });
  try {
    const page = await guest.newPage();
    await page.goto(`${DIDAXIS_URL}/`);
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByText('Manage academic programs')).toHaveCount(0);
  } finally {
    await guest.close();
  }
}

export type { DashboardBlockName };
