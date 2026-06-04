import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { DIDAXIS_URL } from '../../fixtures/auth.constants';
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

export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
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

export async function clickDeleteWithDialog(
  page: Page,
  programs: ProgramsPage,
  programName: string,
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

  const row = programs.programRow(programName);
  await row.scrollIntoViewIfNeeded();
  await programs.openDeleteFor(programName);
  await dialogHandled;
  return message;
}
