import { test as base, expect } from '../fixtures/cleanup.fixture';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const DIDAXIS_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const LOGIN_URL = `${DIDAXIS_URL}/login`;
const PROGRAMS_URL = `${DIDAXIS_URL}/programs`;

const EMAIL = process.env.DIDAXIS_EMAIL;
const PASSWORD = process.env.DIDAXIS_PASSWORD;
const API_TOKEN = process.env.DIDAXIS_API_TOKEN;

if (!EMAIL || !PASSWORD || !API_TOKEN) {
  throw new Error(
    'DIDAXIS_EMAIL, DIDAXIS_PASSWORD, and DIDAXIS_API_TOKEN must be defined in .env to run DS-5 tests.',
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

function programDataCell(row: Locator): Locator {
  // Live UI: first column shows program name and description together.
  return row.locator('td').first();
}

function programInList(page: Page, name: string): Locator {
  return page.getByText(name, { exact: true });
}

async function gotoPrograms(page: Page): Promise<void> {
  await page.goto(PROGRAMS_URL);
}

async function createProgram(
  page: Page,
  request: APIRequestContext,
  trackProgram: (id: string) => void,
  name: string,
  description: string,
): Promise<void> {
  await gotoPrograms(page);
  await newProgramButton(page).click();
  await programNameInput(page).fill(name);
  await descriptionInput(page).fill(description);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(programNameInput(page)).toBeHidden({ timeout: 15_000 });
  await trackProgramByName(request, trackProgram, name);
}

async function trackProgramByName(
  request: APIRequestContext,
  trackProgram: (id: string) => void,
  name: string,
): Promise<void> {
  const response = await request.get(`${DIDAXIS_URL}/api/programs`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { data?: Array<{ id: string; name: string }> };
  const created = body.data?.find((program) => program.name === name);
  expect(created, `Expected "${name}" in API program list.`).toBeTruthy();
  trackProgram(created!.id);
}

test.describe('DS-5 Program list filtering and display', () => {
  test.describe('Positive flows', () => {
    test('TC-001 Each program row shows Program name and Description', async ({
      page,
      request,
      trackProgram,
    }) => {
      const web = uniqueName('Web Development 2026');
      const data = uniqueName('Data Science 2026');
      const info = uniqueName('Informatique & IA - Niveau 2');

      const programs = [
        { name: web, description: 'Full-stack cohort starting January 2026' },
        { name: data, description: 'Python, ML, and data engineering track' },
        { name: info, description: 'Cycle secondaire — sciences et numérique' },
      ];

      for (const p of programs) {
        await createProgram(page, request, trackProgram, p.name, p.description);
      }

      await gotoPrograms(page);
      await expect(page.locator('thead')).toContainText('Program');

      for (const p of programs) {
        const row = programRow(page, p.name);
        await expect(row).toBeVisible();
        await expect(programDataCell(row)).toContainText(p.name);
        await expect(programDataCell(row)).toContainText(p.description);
      }
    });

    test('TC-003 List remains correct after refresh when programs exist', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Refresh Persist 2026');
      const description = 'Should survive browser refresh';

      await createProgram(page, request, trackProgram, name, description);
      await gotoPrograms(page);
      await expect(programDataCell(programRow(page, name))).toContainText(description);

      await page.reload();

      const row = programRow(page, name);
      await expect(row).toBeVisible();
      await expect(programDataCell(row)).toContainText(name);
      await expect(programDataCell(row)).toContainText(description);
    });

    test('TC-004 Single program displays name and description without empty-state copy', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Test Program');
      const description = 'Smoke test program for list UI';

      await createProgram(page, request, trackProgram, name, description);
      await gotoPrograms(page);

      const row = programRow(page, name);
      await expect(row).toBeVisible();
      await expect(programDataCell(row)).toContainText(name);
      await expect(programDataCell(row)).toContainText(description);
      await expect(
        page.getByText(/no programs have been created|create your first program/i),
      ).toHaveCount(0);
    });
  });

  test.describe('Negative flows', () => {
    test('TC-006 Empty state must not appear when programs exist', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026');

      await createProgram(page, request, trackProgram, name, 'Existing program row');
      await gotoPrograms(page);

      await expect(programRow(page, name)).toBeVisible();
      await expect(
        page.getByText(/no programs have been created|create your first program/i),
      ).toHaveCount(0);
      await expect(newProgramButton(page)).toBeVisible();
    });

    test('TC-008 List must not swap name and description in the row', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('DS-2026');
      const description =
        'This is intentionally longer text for column alignment testing in the programs list.';

      await createProgram(page, request, trackProgram, name, description);
      await gotoPrograms(page);

      const row = programRow(page, name);
      const cellText = await programDataCell(row).innerText();

      expect(cellText.indexOf(name)).toBeLessThan(cellText.indexOf(description));
      await expect(programDataCell(row)).toContainText(name);
      await expect(programDataCell(row)).toContainText(description);
    });

    test.fixme(
      'TC-002 Empty state message and first-program prompt when no programs exist',
      async () => {
        // Requires tenant with zero programs; shared test env always has data.
      },
    );

    test.fixme(
      'TC-005 Program list must not expose programs the user cannot see',
      async () => {
        // Needs restricted-role account.
      },
    );

    test.fixme(
      'TC-007 API failure must not show false empty state',
      async () => {
        // Needs network failure simulation.
      },
    );

    test.fixme(
      'TC-009 Unauthorized user must not see program list content',
      async () => {
        // Needs unauthenticated or forbidden session.
      },
    );
  });

  test.describe('Edge cases', () => {
    test('TC-010 Very long Description displays without breaking the row', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026');
      const description = 'd'.repeat(500);

      await createProgram(page, request, trackProgram, name, description);
      await gotoPrograms(page);

      const row = programRow(page, name);
      await expect(row).toBeVisible();
      await expect(programDataCell(row)).toContainText(description.slice(0, 80));
    });

    test('TC-011 Very long Program name displays in the list row', async ({
      page,
      request,
      trackProgram,
    }) => {
      const suffix = ` ${Date.now()}`;
      const name = 'P'.repeat(255 - suffix.length) + suffix;
      const description = 'Boundary name length row';

      await createProgram(page, request, trackProgram, name, description);
      await gotoPrograms(page);

      await expect(programInList(page, name)).toBeVisible();
      await expect(programDataCell(programRow(page, name))).toContainText(description);
    });

    test('TC-012 Special characters and HTML-like text render safely in list', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = `R&D "Phase 1" - Cost: 100% ${Date.now()}`;
      const description = 'Learn <HTML> & "quotes" — 50% practice.';
      let dialogTriggered = false;
      page.on('dialog', async (d) => {
        dialogTriggered = true;
        await d.dismiss();
      });

      await createProgram(page, request, trackProgram, name, description);
      await gotoPrograms(page);

      const row = programRow(page, name);
      await expect(programDataCell(row)).toContainText('R&D "Phase 1"');
      await expect(programDataCell(row)).toContainText('<HTML>');
      expect(dialogTriggered).toBe(false);
    });

    test('TC-013 Unicode and accented text display correctly', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = `École d'été — Zürich ${Date.now()}`;
      const description = '日本語サマー — cohort mixte.';

      await createProgram(page, request, trackProgram, name, description);
      await gotoPrograms(page);

      const row = programRow(page, name);
      await expect(programDataCell(row)).toContainText('École');
      await expect(programDataCell(row)).toContainText('日本語');
    });

    test('TC-014 Empty Description shows name with blank or minimal description area', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Minimal Program 2026');

      await createProgram(page, request, trackProgram, name, '');
      await gotoPrograms(page);

      const row = programRow(page, name);
      await expect(programDataCell(row)).toContainText(name);
      const cellText = (await programDataCell(row).innerText()).replace(name, '').trim();
      expect(cellText.length).toBeLessThanOrEqual(2);
    });

    test('TC-015 Duplicate program names show two distinguishable rows (SS-25)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Test Program');

      await createProgram(page, request, trackProgram, name, 'Cohort A');
      await createProgram(page, request, trackProgram, name, 'Cohort B');
      await gotoPrograms(page);

      await expect(programInList(page, name)).toHaveCount(2);
      await expect(programRow(page, name).filter({ hasText: 'Cohort A' })).toHaveCount(1);
      await expect(programRow(page, name).filter({ hasText: 'Cohort B' })).toHaveCount(1);
    });

    test('TC-020 List shows correct paired name and description for two programs', async ({
      page,
      request,
      trackProgram,
    }) => {
      const sharedDescription = 'Shared boilerplate text.';
      const alpha = uniqueName('Alpha Track');
      const beta = uniqueName('Beta Track');

      await createProgram(page, request, trackProgram, alpha, sharedDescription);
      await createProgram(page, request, trackProgram, beta, sharedDescription);
      await gotoPrograms(page);

      await expect(programDataCell(programRow(page, alpha))).toContainText(alpha);
      await expect(programDataCell(programRow(page, beta))).toContainText(beta);
      await expect(programDataCell(programRow(page, alpha))).toContainText(
        sharedDescription,
      );
      await expect(programDataCell(programRow(page, beta))).toContainText(sharedDescription);
    });

    test.fixme(
      'TC-016 Pagination or load more with 100+ programs',
      async () => {
        // Needs bulk seed data.
      },
    );

    test.fixme(
      'TC-017 Search or filter by name narrows list',
      async () => {
        // Programs page has no search/filter control on test.didaxis.studio.
      },
    );

    test.fixme(
      'TC-018 Filter with no matches shows zero-result copy',
      async () => {
        // No search/filter UI on live app.
      },
    );

    test.fixme(
      'TC-019 Empty state CTA keyboard and screen-reader accessibility',
      async () => {
        // Requires zero-program tenant.
      },
    );
  });
});
