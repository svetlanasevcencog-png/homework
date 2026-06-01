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
    'DIDAXIS_API_TOKEN must be defined in .env to run DS-2 tests.',
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

function saveButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Save', exact: true });
}

function cancelButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Cancel', exact: true });
}

function newProgramButton(page: Page): Locator {
  return page.getByRole('button', { name: 'New Program' });
}

function programRow(page: Page, name: string): Locator {
  return page.locator('tbody tr').filter({ hasText: name });
}

function editButton(row: Locator): Locator {
  // Row actions: first icon = edit (✏️), second = delete (🗑).
  return row.locator('button').first();
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
  description = 'Original cohort description',
): Promise<void> {
  await gotoPrograms(page);
  await newProgramButton(page).click();
  await programNameInput(page).fill(name);
  await descriptionInput(page).fill(description);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(programNameInput(page)).toBeHidden({ timeout: 15_000 });
  await expect(programInList(page, name)).toBeVisible();
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

async function openEditForProgram(page: Page, name: string): Promise<void> {
  await gotoPrograms(page);
  const row = programRow(page, name);
  await expect(row).toBeVisible();
  await editButton(row).click();
  await expect(programNameInput(page)).toBeVisible();
}

test.describe('DS-2 Edit existing program details', () => {
  test.describe('Positive flows', () => {
    test('TC-001 Edit form opens with current program values pre-populated', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development');
      const description = 'Full-stack cohort starting January 2026';

      await createProgram(page, request, trackProgram, name, description);
      await openEditForProgram(page, name);

      await expect(programNameInput(page)).toHaveValue(name);
      await expect(descriptionInput(page)).toHaveValue(description);
      await expect(saveButton(page)).toBeVisible();
      await expect(cancelButton(page)).toBeVisible();
    });

    test('TC-002 Updated program name appears in the list after Save and modal closes', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Web Development');
      const updated = `${original} - Updated`;

      await createProgram(page, request, trackProgram, original);
      await openEditForProgram(page, original);
      await programNameInput(page).fill(updated);
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, updated)).toBeVisible();
      await expect(programInList(page, original)).toHaveCount(0);
    });

    test('TC-003 Saving after changing only Description leaves Name unchanged', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development');
      const originalDescription = 'Original cohort description';
      const updatedDescription = 'Updated: emphasis on React and Node.js projects.';

      await createProgram(page, request, trackProgram, name, originalDescription);
      await openEditForProgram(page, name);
      await descriptionInput(page).fill(updatedDescription);
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, name)).toBeVisible();

      await openEditForProgram(page, name);
      await expect(programNameInput(page)).toHaveValue(name);
      await expect(descriptionInput(page)).toHaveValue(updatedDescription);
    });

    test('TC-004 Name and Description can both be updated in one save', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Web Development');
      const updatedName = `${original} - Spring`;
      const updatedDescription = 'Spring track; includes capstone.';

      await createProgram(page, request, trackProgram, original);
      await openEditForProgram(page, original);
      await programNameInput(page).fill(updatedName);
      await descriptionInput(page).fill(updatedDescription);
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, updatedName)).toBeVisible();

      await openEditForProgram(page, updatedName);
      await expect(programNameInput(page)).toHaveValue(updatedName);
      await expect(descriptionInput(page)).toHaveValue(updatedDescription);
    });

    test('TC-005 Clearing Description saves successfully when Description is optional', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Clear Description');

      await createProgram(page, request, trackProgram, name, 'Will be cleared');
      await openEditForProgram(page, name);
      await descriptionInput(page).fill('');
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, name)).toBeVisible();

      await openEditForProgram(page, name);
      await expect(descriptionInput(page)).toHaveValue('');
    });
  });

  test.describe('Negative flows', () => {
    test('TC-007 Required Name must not be saved as empty', async ({ page, request, trackProgram }) => {
      const name = uniqueName('Required Name');

      await createProgram(page, request, trackProgram, name);
      await openEditForProgram(page, name);
      await programNameInput(page).fill('');
      await expect(saveButton(page)).toBeDisabled();

      await page.keyboard.press('Escape');
      await expect(programInList(page, name)).toBeVisible();
    });

    test('TC-011 Cancel discards edits and list keeps the original name', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Web Development');
      const discarded = `${original} - Discarded`;

      await createProgram(page, request, trackProgram, original);
      await openEditForProgram(page, original);
      await programNameInput(page).fill(discarded);
      await cancelButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, original)).toBeVisible();
      await expect(programInList(page, discarded)).toHaveCount(0);

      await openEditForProgram(page, original);
      await expect(programNameInput(page)).toHaveValue(original);
    });

    test.fixme(
      'TC-006 Program list must not show a new name if save fails',
      async () => {
        // Needs API mock (500) for the program update endpoint.
      },
    );

    test.fixme(
      'TC-008 Invalid date range must not be persisted',
      async () => {
        // Edit modal has no Start date / End date fields on test.didaxis.studio.
      },
    );

    test.fixme(
      'TC-009 Unauthorized user must not open edit or save changes',
      async () => {
        // Needs a non-admin account in .env.
      },
    );

    test.fixme(
      'TC-010 Modal must not close when backend rejects the save payload',
      async () => {
        // Needs concurrent-edit or conflict simulation.
      },
    );
  });

  test.describe('Edge cases', () => {
    test('TC-012 255-character Program Name saves and displays correctly', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Max Length');
      const suffix = ` ${Date.now()}`;
      const maxName = 'A'.repeat(255 - suffix.length) + suffix;
      expect(maxName).toHaveLength(255);

      await createProgram(page, request, trackProgram, original);
      await openEditForProgram(page, original);
      await programNameInput(page).fill(maxName);
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, maxName)).toBeVisible();
    });

    test('TC-013 Name one character over maximum keeps Save disabled or blocks submit', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Over Max');
      const tooLong = `${'B'.repeat(256)}${Date.now()}`;

      await createProgram(page, request, trackProgram, name);
      await openEditForProgram(page, name);
      await programNameInput(page).fill(tooLong);

      const save = saveButton(page);
      const disabled = await save.isDisabled();
      if (!disabled) {
        await save.click();
        await expect(programNameInput(page)).toBeVisible();
        await expect(programInList(page, name)).toBeVisible();
        await expect(programInList(page, tooLong)).toHaveCount(0);
      } else {
        await expect(save).toBeDisabled();
      }
    });

    test('TC-014 Long Description (2000 characters) is accepted', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Long Description Edit');
      const longDescription = 'd'.repeat(2000);

      await createProgram(page, request, trackProgram, name);
      await openEditForProgram(page, name);
      await descriptionInput(page).fill(longDescription);
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await openEditForProgram(page, name);
      await expect(descriptionInput(page)).toHaveValue(longDescription);
    });

    test('TC-015 Special characters in Name are stored and displayed verbatim', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Special Chars Base');
      const special = `Web Dev 2026 <Advanced> & "React" — 100% ${Date.now()}`;

      let dialogTriggered = false;
      page.on('dialog', async (d) => {
        dialogTriggered = true;
        await d.dismiss();
      });

      await createProgram(page, request, trackProgram, original);
      await openEditForProgram(page, original);
      await programNameInput(page).fill(special);
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, special)).toBeVisible();
      expect(dialogTriggered).toBe(false);
    });

    test('TC-016 Unicode and emoji in Description persist correctly', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Unicode Desc');
      const unicodeDescription = 'Cohort in Zürich — 日本語 intro — 🚀 launch week.';

      await createProgram(page, request, trackProgram, name);
      await openEditForProgram(page, name);
      await descriptionInput(page).fill(unicodeDescription);
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await openEditForProgram(page, name);
      await expect(descriptionInput(page)).toHaveValue(unicodeDescription);
    });

    // KNOWN BUG – Jira SS-25 (duplicate program names allowed)
    test('TC-017 Renaming to an existing program name is allowed (duplicate names)', async ({
      page,
      request,
      trackProgram,
    }) => {
      // Live app allows duplicate titles on edit (same as create). Documents SS-25 until uniqueness is enforced.
      const nameA = uniqueName('Dup Edit A');
      const nameB = uniqueName('Dup Edit B');

      await createProgram(page, request, trackProgram, nameA, 'A');
      await createProgram(page, request, trackProgram, nameB, 'B');
      await openEditForProgram(page, nameA);
      await programNameInput(page).fill(nameB);
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, nameA)).toHaveCount(0);
      await expect(programInList(page, nameB)).toHaveCount(2);
    });

    test('TC-018 Leading and trailing whitespace in Name is trimmed on save', async ({
      page,
      request,
      trackProgram,
    }) => {
      const trimmed = uniqueName('Trim Edit');
      const padded = `   ${trimmed}   `;

      await createProgram(page, request, trackProgram, trimmed);
      await openEditForProgram(page, trimmed);
      await programNameInput(page).fill(padded);
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, trimmed)).toBeVisible();
    });

    test('TC-019 Whitespace-only Description is rejected or normalized', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Whitespace Desc');
      const originalDescription = 'Has content';

      await createProgram(page, request, trackProgram, name, originalDescription);
      await openEditForProgram(page, name);
      await descriptionInput(page).fill('   \n');
      await saveButton(page).click();

      await expect(programNameInput(page)).toBeHidden();
      await openEditForProgram(page, name);
      const value = await descriptionInput(page).inputValue();
      expect(value.trim()).toBe('');
    });

    test('TC-020 Rapid double-click on Save performs a single update', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Double Save');
      const updated = `${original} - Once`;

      await createProgram(page, request, trackProgram, original);
      await openEditForProgram(page, original);
      await programNameInput(page).fill(updated);
      await saveButton(page).dblclick();

      await expect(programNameInput(page)).toBeHidden();
      await expect(programInList(page, updated)).toHaveCount(1);
      await expect(programInList(page, original)).toHaveCount(0);
    });
  });
});
