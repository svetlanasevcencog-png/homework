import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import type { APIRequestContext, Browser, Locator, Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { DIDAXIS_URL, EMPTY_STORAGE_STATE } from '../../fixtures/auth.constants';
import { ProgramsPage } from '../../pages/programs.page';

dotenv.config({ path: path.resolve(__dirname, '../..', '.env'), override: true });

const API_TOKEN = process.env.DIDAXIS_API_TOKEN;

export type CreateProgramOptions = {
  description?: string;
  refreshList?: boolean;
};

export function requireApiToken(suiteLabel: string): void {
  if (!API_TOKEN) {
    throw new Error(
      `DIDAXIS_API_TOKEN must be defined in .env to run ${suiteLabel} tests.`,
    );
  }
}

/** Timestamp plus random segment: collision-proof across parallel
 * workers/projects sharing one backend (Date.now() alone is not). */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export async function trackProgramByName(
  request: APIRequestContext,
  trackProgram: (id: string) => void,
  name: string,
): Promise<void> {
  const response = await request.get(`${DIDAXIS_URL}/api/programs`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as {
    data?: Array<{ id: string; name: string }>;
  };
  const created = body.data?.find((program) => program.name === name);
  expect(created, `Expected "${name}" in API program list.`).toBeTruthy();
  trackProgram(created!.id);
}

export async function openProgramsList(page: Page): Promise<ProgramsPage> {
  const programs = new ProgramsPage(page);
  await programs.goto();
  return programs;
}

export async function openNewProgramForm(page: Page): Promise<ProgramsPage> {
  const programs = await openProgramsList(page);
  await programs.openNewProgram();
  await expect(programs.newProgramModal.programNameInput).toBeVisible();
  return programs;
}

/** Submit an open New Program modal, wait for close, and register cleanup via API. */
export async function submitNewProgram(
  programs: ProgramsPage,
  request: APIRequestContext,
  trackProgram: (id: string) => void,
  name: string,
): Promise<void> {
  const modal = programs.newProgramModal;
  await modal.submit();
  await expect(modal.programNameInput).toBeHidden({ timeout: 15_000 });
  await trackProgramByName(request, trackProgram, name);
}

export async function createProgram(
  page: Page,
  request: APIRequestContext,
  trackProgram: (id: string) => void,
  name: string,
  options?: CreateProgramOptions,
): Promise<ProgramsPage> {
  const programs = new ProgramsPage(page);
  const modal = programs.newProgramModal;
  const description =
    options?.description === undefined
      ? 'Original cohort description'
      : options.description;

  await programs.goto();
  await programs.openNewProgram();
  await modal.fillProgramName(name);
  await modal.fillDescription(description);
  await modal.submit();

  await expect(modal.programNameInput).toBeHidden({ timeout: 15_000 });

  if (options?.refreshList) {
    await programs.goto();
    const row = programs.programRow(name);
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible();
  } else {
    // Use .first(): duplicate names are allowed (SS-25), so this locator
    // can match multiple rows after a second create with the same name.
    await expect(programs.programInList(name).first()).toBeVisible();
  }

  await trackProgramByName(request, trackProgram, name);
  return programs;
}

export async function openEditForProgram(
  page: Page,
  name: string,
): Promise<ProgramsPage> {
  const programs = await openProgramsList(page);
  await expect(programs.programRow(name)).toBeVisible();
  await programs.openEditFor(name);
  await expect(programs.editProgramModal.programNameInput).toBeVisible();
  return programs;
}

/** Click a specific delete button, handle the native confirm dialog, and
 * return the dialog message. Use when the delete control is row-scoped. */
export async function clickDeleteButtonWithDialog(
  page: Page,
  deleteButton: Locator,
  action: 'accept' | 'dismiss',
): Promise<string> {
  let message = '';
  const dialogHandled = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Delete confirmation dialog did not appear')),
      15_000,
    );
    page.once('dialog', async (dialog) => {
      clearTimeout(timeout);
      message = dialog.message();
      expect(dialog.type()).toBe('confirm');
      if (action === 'accept') {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
      resolve();
    });
  });

  await deleteButton.scrollIntoViewIfNeeded();
  await deleteButton.click();
  await dialogHandled;
  return message;
}

export async function clickDeleteWithDialog(
  page: Page,
  programs: ProgramsPage,
  programName: string,
  action: 'accept' | 'dismiss',
): Promise<string> {
  const row = programs.programRow(programName);
  await row.scrollIntoViewIfNeeded();
  return clickDeleteButtonWithDialog(page, programs.deleteButtonFor(programName), action);
}

/** Intercept the program list endpoint and return an empty collection so the
 * empty-state UI can be exercised without mutating real account data. */
export async function mockEmptyProgramList(page: Page): Promise<void> {
  await page.route('**/api/programs**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    } else {
      await route.continue();
    }
  });
}

/** Force the program API to reject the given HTTP methods, to verify the
 * client stays consistent when the backend errors. */
export async function failProgramApi(
  page: Page,
  methods: string[],
  status = 500,
): Promise<void> {
  await page.route('**/api/programs**', async (route) => {
    if (methods.includes(route.request().method())) {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated server error' }),
      });
    } else {
      await route.continue();
    }
  });
}

/** Verify the authentication boundary: an unauthenticated visitor to a
 * protected route is redirected to /login and sees no program content.
 *
 * The demo app exposes a single admin role, so true role-based authorization
 * cannot be exercised; this asserts the testable security guarantee. */
export async function assertGuestRedirectedToLogin(
  browser: Browser,
  routePath: string,
): Promise<void> {
  const guest = await browser.newContext({ storageState: EMPTY_STORAGE_STATE });
  try {
    const page = await guest.newPage();
    await page.goto(`${DIDAXIS_URL}${routePath}`);
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '+ New Program' })).toHaveCount(0);
  } finally {
    await guest.close();
  }
}
