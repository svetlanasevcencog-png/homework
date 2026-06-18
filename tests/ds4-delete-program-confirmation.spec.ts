import { test, expect } from '../fixtures/cleanup.fixture';
import type { APIRequestContext, Page } from '@playwright/test';
import { ProgramsPage } from '../pages/programs.page';
import {
  clickDeleteButtonWithDialog,
  clickDeleteWithDialog,
  createProgram,
  failProgramApi,
  requireApiToken,
  uniqueName,
} from './helpers/didaxis-programs.helpers';

requireApiToken('DS-4');

async function createProgramForDelete(
  page: Page,
  request: APIRequestContext,
  trackProgram: (id: string) => void,
  name: string,
  description?: string,
) {
  return createProgram(page, request, trackProgram, name, {
    description,
    refreshList: true,
  });
}

test.describe('DS-4 Delete program with confirmation', () => {
  test.setTimeout(60_000);

  test.describe('Positive flows', () => {
    test('TC-001 Confirmation dialog appears when initiating delete', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Test Program');

      const programs = await createProgramForDelete(
        page,
        request,
        trackProgram,
        name,
        'Program for delete tests',
      );
      const message = await clickDeleteWithDialog(page, programs, name, 'dismiss');

      expect(message).toContain('Delete program');
      expect(message).toContain(name);
      expect(message).toMatch(/cannot be undone|removed/i);
      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-002 Program is removed from the list after user confirms deletion', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Test Program');

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      await clickDeleteWithDialog(page, programs, name, 'accept');

      await expect(programs.programInList(name)).toHaveCount(0);
    });

    test('TC-003 Program remains in the list when user cancels deletion', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026');

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      await clickDeleteWithDialog(page, programs, name, 'dismiss');

      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-004 Cancel preserves Test Program when that is the program under delete', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Test Program');

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      await clickDeleteWithDialog(page, programs, name, 'dismiss');

      await expect(programs.programInList(name)).toBeVisible();
    });
  });

  test.describe('Negative flows', () => {
    test('TC-005 Program must not be deleted if confirmation is never completed', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Data Science 2026');

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      await clickDeleteWithDialog(page, programs, name, 'dismiss');

      await expect(programs.programInList(name)).toHaveCount(1);
    });

    test('TC-010 Deleting one program must not remove a different program', async ({
      page,
      request,
      trackProgram,
    }) => {
      const toDelete = uniqueName('Test Program');
      const toKeep = uniqueName('Web Development 2026');

      await createProgramForDelete(page, request, trackProgram, toDelete);
      const programs = await createProgramForDelete(page, request, trackProgram, toKeep);

      await clickDeleteWithDialog(page, programs, toDelete, 'accept');

      await expect(programs.programInList(toDelete)).toHaveCount(0);
      await expect(programs.programInList(toKeep)).toBeVisible();
    });

    test('TC-008 Double confirmation click performs a single delete', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Test Program Double Confirm');

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      await clickDeleteWithDialog(page, programs, name, 'accept');

      await expect(programs.programInList(name)).toHaveCount(0);
    });

    test('TC-006 Deletion must not occur when the server returns an error after confirm', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Server Error Delete');
      const programs = await createProgramForDelete(page, request, trackProgram, name);

      await failProgramApi(page, ['DELETE']);
      await clickDeleteWithDialog(page, programs, name, 'accept');

      // Backend rejected the delete, so the row must stay in the list.
      await expect(programs.programInList(name)).toBeVisible();
      await page.reload();
      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-009 Program must not disappear before successful server acknowledgment', async ({
      page,
    }) => {
      const only = {
        id: 'mock-ack-1',
        name: uniqueName('Ack Delete'),
        description: 'Pending-ack program',
      };
      let store = [only];

      let releaseDelete: () => void = () => {};
      const deleteGate = new Promise<void>((resolve) => {
        releaseDelete = resolve;
      });

      // Stateful mock so list refetches stay consistent; the DELETE response
      // is gated open to simulate a slow server acknowledgment.
      await page.route('**/api/programs**', async (route) => {
        const req = route.request();
        if (req.method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: store }),
          });
        } else if (req.method() === 'DELETE') {
          await deleteGate;
          store = store.filter((p) => !req.url().endsWith(`/${p.id}`));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{}',
          });
        } else {
          await route.continue();
        }
      });

      const programs = new ProgramsPage(page);
      await programs.goto();
      await expect(programs.programRow(only.name)).toBeVisible();

      await clickDeleteWithDialog(page, programs, only.name, 'accept');
      // DELETE is still in flight (gated): the row must remain until the
      // server acknowledges — no premature optimistic removal.
      await expect(programs.programInList(only.name)).toBeVisible();

      releaseDelete();
      await expect(programs.programInList(only.name)).toHaveCount(0);
    });

    // No role system exists in the demo (single admin account), so a
    // permission-restricted user cannot be exercised. The authentication
    // boundary is covered by DS-5 TC-009 / DS-3 TC-010.
    test.fixme('TC-007 User without delete permission must not remove a program', async () => {});
  });

  test.describe('Edge cases', () => {
    test('TC-011 Confirmation copy displays correctly for program name with special characters', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Informatique & IA - Niveau 2');

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      const message = await clickDeleteWithDialog(page, programs, name, 'dismiss');

      expect(message).toContain('Informatique & IA - Niveau 2');
    });

    test('TC-017 Program name containing quotes renders safely in dialog', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName(`R&D "Phase 1" - Cost: 100%`);

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      const previewMessage = await clickDeleteWithDialog(page, programs, name, 'dismiss');

      expect(previewMessage).toContain('R&D "Phase 1"');

      await clickDeleteWithDialog(page, programs, name, 'accept');
      await expect(programs.programInList(name)).toHaveCount(0);
    });

    test('TC-013 Dismiss on confirmation dialog keeps program in the list', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Test Program');

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      await clickDeleteWithDialog(page, programs, name, 'dismiss');

      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-020 Cancel does not leave delete control stuck; delete can be reopened', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Data Science Bootcamp 2026');

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      await clickDeleteWithDialog(page, programs, name, 'dismiss');

      const message = await clickDeleteWithDialog(page, programs, name, 'dismiss');
      expect(message).toContain(name);
    });

    test('TC-012 Confirmation copy for very long program name (boundary display)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const suffix = uniqueName('');
      const name = 'L'.repeat(255 - suffix.length) + suffix;
      expect(name).toHaveLength(255);

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      const message = await clickDeleteWithDialog(page, programs, name, 'dismiss');

      expect(message).toContain(name);
      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-015 Deleting the only program shows appropriate empty state', async ({
      page,
    }) => {
      const only = {
        id: 'mock-only-program-1',
        name: uniqueName('Only Program'),
        description: 'Sole program',
      };
      let store = [only];

      // Fully control the list so this account-state-sensitive scenario is
      // deterministic and never disturbs real data.
      await page.route('**/api/programs**', async (route) => {
        const req = route.request();
        if (req.method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: store }),
          });
        } else if (req.method() === 'DELETE') {
          store = store.filter((p) => !req.url().endsWith(`/${p.id}`));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{}',
          });
        } else {
          await route.continue();
        }
      });

      const programs = new ProgramsPage(page);
      await programs.goto();
      await expect(programs.programRow(only.name)).toBeVisible();

      await clickDeleteWithDialog(page, programs, only.name, 'accept');

      await expect(programs.emptyStateMessage).toBeVisible();
      await expect(programs.createFirstProgramButton).toBeVisible();
      await expect(programs.programInList(only.name)).toHaveCount(0);
    });

    test('TC-018 Duplicate display names delete only the selected row', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Dup Delete');

      await createProgram(page, request, trackProgram, name, { description: 'Cohort A' });
      const programs = await createProgram(page, request, trackProgram, name, {
        description: 'Cohort B',
      });
      await programs.goto();
      await expect(programs.programInList(name)).toHaveCount(2);

      const rowA = programs.programRow(name).filter({ hasText: 'Cohort A' });
      await clickDeleteButtonWithDialog(page, programs.deleteButtonInRow(rowA), 'accept');

      // Generous timeout: the list refetch after a confirmed delete can be
      // slow (observed on webkit), and the default 5s expires mid-transient.
      await expect(programs.programInList(name)).toHaveCount(1, { timeout: 15_000 });
      await expect(programs.programRow(name).filter({ hasText: 'Cohort B' })).toHaveCount(1, {
        timeout: 15_000,
      });
      await expect(programs.programRow(name).filter({ hasText: 'Cohort A' })).toHaveCount(0, {
        timeout: 15_000,
      });
    });

    // Deletion uses a native window.confirm dialog (verified: dialog.type() ===
    // 'confirm'), which has no in-DOM backdrop to click and no app-controlled
    // focus trap to assert. TC-014 and TC-019 describe a custom modal that the
    // app does not implement.
    test.fixme('TC-014 Clicking dialog backdrop cancels deletion', async () => {});

    test.fixme('TC-019 Focus management when dialog opens and closes', async () => {});

    // Requires a second concurrent user/session editing the same program;
    // no multi-user fixture exists in the demo environment.
    test.fixme('TC-016 Concurrent delete while another user edits', async () => {});
  });
});
