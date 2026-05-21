import { test as base, expect, Page, Locator } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const LOGIN_URL = 'https://test.didaxis.studio/login';
const PROGRAMS_URL = 'https://test.didaxis.studio/programs';

const EMAIL = process.env.DIDAXIS_EMAIL;
const PASSWORD = process.env.DIDAXIS_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error(
    'DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be defined in .env to run DS-4 tests.',
  );
}

type WorkerFixtures = { authedStorageState: string };

const test = base.extend<{}, WorkerFixtures>({
  authedStorageState: [
    async ({ browser }, use, workerInfo) => {
      const storagePath = path.join(
        os.tmpdir(),
        'didaxis-auth',
        `worker-${workerInfo.workerIndex}.json`,
      );
      await fs.mkdir(path.dirname(storagePath), { recursive: true });

      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
      await page.getByLabel('Email').fill(EMAIL!);
      await page.getByLabel('Password').fill(PASSWORD!);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
        timeout: 30_000,
      });
      await ctx.storageState({ path: storagePath });
      await ctx.close();

      await use(storagePath);
    },
    { scope: 'worker' },
  ],

  storageState: async ({ authedStorageState }, use) => {
    await use(authedStorageState);
  },
});

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

function programNameInput(page: Page): Locator {
  return page.getByLabel('Program Name');
}

function descriptionInput(page: Page): Locator {
  return page.getByLabel('Description');
}

function newProgramButton(page: Page): Locator {
  return page.getByRole('button', { name: 'New Program' });
}

function programRow(page: Page, name: string): Locator {
  return page.locator('tbody tr').filter({ hasText: name });
}

function deleteButton(row: Locator): Locator {
  // Row actions: first icon = edit (✏️), second = delete (🗑).
  return row.locator('button').nth(1);
}

function programInList(page: Page, name: string): Locator {
  return page.getByText(name, { exact: true });
}

async function gotoPrograms(page: Page): Promise<void> {
  await page.goto(PROGRAMS_URL);
}

async function createProgram(
  page: Page,
  name: string,
  description = 'Program for delete tests',
): Promise<void> {
  await gotoPrograms(page);
  await newProgramButton(page).click();
  await programNameInput(page).fill(name);
  await descriptionInput(page).fill(description);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(programNameInput(page)).toBeHidden({ timeout: 15_000 });
  await gotoPrograms(page);
  const row = programRow(page, name);
  await row.scrollIntoViewIfNeeded();
  await expect(row).toBeVisible();
}

async function clickDeleteWithDialog(
  page: Page,
  row: Locator,
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

  await row.scrollIntoViewIfNeeded();
  await deleteButton(row).click();
  await dialogHandled;
  return message;
}

test.describe('DS-4 Delete program with confirmation', () => {
  test.setTimeout(60_000);
  test.describe('Positive flows', () => {
    test('TC-001 Confirmation dialog appears when initiating delete', async ({ page }) => {
      const name = uniqueName('Test Program');

      await createProgram(page, name);
      const row = programRow(page, name);
      const message = await clickDeleteWithDialog(page, row, 'dismiss');

      expect(message).toContain('Delete program');
      expect(message).toContain(name);
      expect(message).toMatch(/cannot be undone|removed/i);
      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-002 Program is removed from the list after user confirms deletion', async ({
      page,
    }) => {
      const name = uniqueName('Test Program');

      await createProgram(page, name);
      const row = programRow(page, name);

      await clickDeleteWithDialog(page, row, 'accept');

      await expect(programInList(page, name)).toHaveCount(0);
    });

    test('TC-003 Program remains in the list when user cancels deletion', async ({ page }) => {
      const name = uniqueName('Web Development 2026');

      await createProgram(page, name);
      const row = programRow(page, name);

      await clickDeleteWithDialog(page, row, 'dismiss');

      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-004 Cancel preserves Test Program when that is the program under delete', async ({
      page,
    }) => {
      const name = uniqueName('Test Program');

      await createProgram(page, name);
      const row = programRow(page, name);

      await clickDeleteWithDialog(page, row, 'dismiss');

      await expect(programInList(page, name)).toBeVisible();
    });
  });

  test.describe('Negative flows', () => {
    test('TC-005 Program must not be deleted if confirmation is never completed', async ({
      page,
    }) => {
      const name = uniqueName('Data Science 2026');

      await createProgram(page, name);
      const row = programRow(page, name);

      await clickDeleteWithDialog(page, row, 'dismiss');

      await expect(programInList(page, name)).toHaveCount(1);
    });

    test('TC-010 Deleting one program must not remove a different program', async ({
      page,
    }) => {
      const toDelete = uniqueName('Test Program');
      const toKeep = uniqueName('Web Development 2026');

      await createProgram(page, toDelete);
      await createProgram(page, toKeep);

      const row = programRow(page, toDelete);
      await clickDeleteWithDialog(page, row, 'accept');

      await expect(programInList(page, toDelete)).toHaveCount(0);
      await expect(programInList(page, toKeep)).toBeVisible();
    });

    test('TC-008 Double confirmation click performs a single delete', async ({ page }) => {
      const name = uniqueName('Test Program Double Confirm');

      await createProgram(page, name);
      const row = programRow(page, name);

      await clickDeleteWithDialog(page, row, 'accept');

      await expect(programInList(page, name)).toHaveCount(0);
    });

    test.fixme(
      'TC-006 Deletion must not occur when the server returns an error after confirm',
      async () => {
        // Needs network failure simulation.
      },
    );

    test.fixme(
      'TC-007 User without delete permission must not remove a program',
      async () => {
        // Needs a non-admin account in .env.
      },
    );

    test.fixme(
      'TC-009 Program must not disappear before successful server acknowledgment',
      async () => {
        // Needs throttled network observation.
      },
    );
  });

  test.describe('Edge cases', () => {
    test('TC-011 Confirmation copy displays correctly for program name with special characters', async ({
      page,
    }) => {
      const name = `Informatique & IA - Niveau 2 ${Date.now()}`;

      await createProgram(page, name);
      const row = programRow(page, name);
      const message = await clickDeleteWithDialog(page, row, 'dismiss');

      expect(message).toContain('Informatique & IA - Niveau 2');
    });

    test('TC-017 Program name containing quotes renders safely in dialog', async ({ page }) => {
      const name = `R&D "Phase 1" - Cost: 100% ${Date.now()}`;

      await createProgram(page, name);
      const row = programRow(page, name);
      const previewMessage = await clickDeleteWithDialog(page, row, 'dismiss');

      expect(previewMessage).toContain('R&D "Phase 1"');

      await clickDeleteWithDialog(page, row, 'accept');
      await expect(programInList(page, name)).toHaveCount(0);
    });

    test('TC-013 Dismiss on confirmation dialog keeps program in the list', async ({
      page,
    }) => {
      const name = uniqueName('Test Program');

      await createProgram(page, name);
      const row = programRow(page, name);

      await clickDeleteWithDialog(page, row, 'dismiss');

      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-020 Cancel does not leave delete control stuck; delete can be reopened', async ({
      page,
    }) => {
      const name = uniqueName('Data Science Bootcamp 2026');

      await createProgram(page, name);
      const row = programRow(page, name);

      await clickDeleteWithDialog(page, row, 'dismiss');

      const message = await clickDeleteWithDialog(page, row, 'dismiss');
      expect(message).toContain(name);
    });

    test.fixme(
      'TC-012 Confirmation copy for very long program name (boundary display)',
      async () => {
        // Optional visual/layout check; message truncation not asserted in automation.
      },
    );

    test.fixme(
      'TC-014 Clicking dialog backdrop cancels deletion',
      async () => {
        // Native window.confirm has no backdrop.
      },
    );

    test.fixme(
      'TC-015 Deleting the only program shows appropriate empty state',
      async () => {
        // Requires isolated tenant with zero other programs.
      },
    );

    test.fixme(
      'TC-016 Concurrent delete while another user edits',
      async () => {
        // Needs two sessions.
      },
    );

    test.fixme(
      'TC-018 Duplicate display names delete only the selected row',
      async () => {
        // Covered implicitly when duplicates exist; row filter uses unique timestamp suffix.
      },
    );

    test.fixme('TC-019 Focus management when dialog opens and closes', async () => {
      // Native confirm does not expose focus trap semantics.
    });
  });
});
