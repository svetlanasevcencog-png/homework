import { test, expect } from '../fixtures/cleanup.fixture';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { DIDAXIS_URL } from '../fixtures/auth.constants';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const PROGRAMS_URL = `${DIDAXIS_URL}/programs`;

const API_TOKEN = process.env.DIDAXIS_API_TOKEN;

if (!API_TOKEN) {
  throw new Error(
    'DIDAXIS_API_TOKEN must be defined in .env to run DS-3 tests.',
  );
}

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

function programNameInput(page: Page): Locator {
  return page.getByLabel('Program Name');
}

function descriptionInput(page: Page): Locator {
  return page.getByLabel('Description');
}

function createButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Create', exact: true });
}

function newProgramButton(page: Page): Locator {
  return page.getByRole('button', { name: 'New Program' });
}

function programInList(page: Page, name: string): Locator {
  return page.getByText(name, { exact: true });
}

async function openProgramForm(page: Page): Promise<void> {
  await page.goto(PROGRAMS_URL);
  await newProgramButton(page).click();
  await expect(programNameInput(page)).toBeVisible();
}

async function submitCreate(
  page: Page,
  request: APIRequestContext,
  trackProgram: (id: string) => void,
  name: string,
): Promise<void> {
  await createButton(page).click();
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

test.describe('DS-3 Program name validation and duplicate prevention', () => {
  test.describe('Positive flows', () => {
    test('TC-001 Program with special characters in name is created successfully', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = `Informatique & IA - Niveau 2 ${Date.now()}`;

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await descriptionInput(page).fill('Cycle secondaire — orientation sciences');
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-002 Valid unique name with letters, numbers, and spaces is accepted', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Data Science Bootcamp 2026');

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await descriptionInput(page).fill('Python, ML, and data engineering track');
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-003 Name at maximum allowed length (255) is accepted when unique', async ({
      page,
      request,
      trackProgram,
    }) => {
      const suffix = ` ${Date.now()}`;
      const name = 'A'.repeat(255 - suffix.length) + suffix;
      expect(name).toHaveLength(255);

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toBeVisible();
    });
  });

  test.describe('Negative flows', () => {
    test('TC-004 Whitespace-only program name is not submitted', async ({ page }) => {
      await openProgramForm(page);
      await programNameInput(page).fill('   ');
      await descriptionInput(page).fill('Valid description');

      await expect(createButton(page)).toBeDisabled();
    });

    test('TC-006 Empty program name must not create a program', async ({ page }) => {
      await openProgramForm(page);
      await descriptionInput(page).fill('Description without a name');

      await expect(programNameInput(page)).toHaveValue('');
      await expect(createButton(page)).toBeDisabled();
    });

    // KNOWN BUG – Jira SS-25 (duplicate program names allowed on create)
    test('TC-005 Duplicate name is allowed (no blocking error)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026');

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await submitCreate(page, request, trackProgram, name);

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await descriptionInput(page).fill('Second cohort');
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toHaveCount(2);
    });

    test('TC-009 Padded duplicate name is allowed after trim (SS-25)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026 Padded');
      const padded = `  ${name}  `;

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await submitCreate(page, request, trackProgram, name);

      await openProgramForm(page);
      await programNameInput(page).fill(padded);
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toHaveCount(2);
    });

    test('TC-008 Case-variant duplicate is allowed (case-sensitive uniqueness)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const baseName = uniqueName('Web Development 2026');
      const variant = baseName.replace('Web', 'web');

      await openProgramForm(page);
      await programNameInput(page).fill(baseName);
      await submitCreate(page, request, trackProgram, baseName);

      await openProgramForm(page);
      await programNameInput(page).fill(variant);
      await submitCreate(page, request, trackProgram, variant);

      await expect(programInList(page, baseName)).toBeVisible();
      await expect(programInList(page, variant)).toBeVisible();
    });

    test.fixme(
      'TC-007 Server rejects duplicate when client validation is bypassed',
      async () => {
        // Needs direct API call without UI.
      },
    );

    test.fixme(
      'TC-010 Unauthorized user must not create a program',
      async () => {
        // Needs a non-admin account in .env.
      },
    );
  });

  test.describe('Edge cases', () => {
    test('TC-011 Name one character over maximum is rejected or blocked', async ({
      page,
    }) => {
      const tooLong = `${'B'.repeat(256)}${Date.now()}`;

      await openProgramForm(page);
      await programNameInput(page).fill(tooLong);

      const create = createButton(page);
      const disabled = await create.isDisabled();
      if (!disabled) {
        await create.click();
        await expect(programNameInput(page)).toBeVisible();
        await expect(programInList(page, tooLong)).toHaveCount(0);
      } else {
        await expect(create).toBeDisabled();
      }
    });

    test('TC-012 Unicode and accented characters in name are accepted when unique', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = `École d'été — Zürich 2026 ${Date.now()}`;

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-013 Emoji in program name is accepted', async ({ page, request, trackProgram }) => {
      const name = `Web Dev 2026 🚀 ${Date.now()}`;

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-014 HTML-like strings in name are stored as text, not executed', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = `<script>alert(1)</script> Program ${Date.now()}`;
      let dialogTriggered = false;
      page.on('dialog', async (d) => {
        dialogTriggered = true;
        await d.dismiss();
      });

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toBeVisible();
      expect(dialogTriggered).toBe(false);
    });

    test('TC-015 Duplicate check after trim allows duplicate (SS-25)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026 Trim Dup');
      const padded = `   ${name}   `;

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await submitCreate(page, request, trackProgram, name);

      await openProgramForm(page);
      await programNameInput(page).fill(padded);
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toHaveCount(2);
    });

    test('TC-016 Tab and newline in name are trimmed to a valid unique name', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Valid Name 2026');
      const messy = `\t\n  ${name}`;

      await openProgramForm(page);
      await programNameInput(page).fill(messy);
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-017 Single visible character name is accepted with unique suffix', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = `A${Date.now()}`;

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-019 Special-character acceptance beyond AC example', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = `R&D "Phase 1" - Cost: 100% ${Date.now()}`;

      await openProgramForm(page);
      await programNameInput(page).fill(name);
      await descriptionInput(page).fill(`O'Brien & "Co."`);
      await submitCreate(page, request, trackProgram, name);

      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-020 Dismissing the form retains field values for a corrected retry', async ({
      page,
      request,
      trackProgram,
    }) => {
      const duplicate = uniqueName('Web Development 2026');
      const unique = `${duplicate} - New`;
      const description = 'Should remain after cancel';

      await openProgramForm(page);
      await programNameInput(page).fill(duplicate);
      await descriptionInput(page).fill(description);
      await page.keyboard.press('Escape');
      await expect(programNameInput(page)).toBeHidden();

      await newProgramButton(page).click();
      await programNameInput(page).fill(unique);
      await expect(descriptionInput(page)).toHaveValue(description);
      await submitCreate(page, request, trackProgram, unique);

      await expect(programInList(page, unique)).toBeVisible();
    });

    test.fixme(
      'TC-018 Rapid double-click on Create does not create two programs',
      async () => {
        // KNOWN BUG – Jira SS-26 (Create double-click submits twice).
      },
    );
  });
});
