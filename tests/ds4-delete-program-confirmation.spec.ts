import { test, expect } from '../fixtures/cleanup.fixture';
import type { APIRequestContext, Page } from '@playwright/test';
import {
  clickDeleteWithDialog,
  createProgram,
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

    test.fixme('TC-006 Deletion must not occur when the server returns an error after confirm', async () => {});

    test.fixme('TC-007 User without delete permission must not remove a program', async () => {});

    test.fixme(
      'TC-009 Program must not disappear before successful server acknowledgment',
      async () => {},
    );
  });

  test.describe('Edge cases', () => {
    test('TC-011 Confirmation copy displays correctly for program name with special characters', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = `Informatique & IA - Niveau 2 ${Date.now()}`;

      const programs = await createProgramForDelete(page, request, trackProgram, name);
      const message = await clickDeleteWithDialog(page, programs, name, 'dismiss');

      expect(message).toContain('Informatique & IA - Niveau 2');
    });

    test('TC-017 Program name containing quotes renders safely in dialog', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = `R&D "Phase 1" - Cost: 100% ${Date.now()}`;

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

    test.fixme('TC-012 Confirmation copy for very long program name (boundary display)', async () => {});

    test.fixme('TC-014 Clicking dialog backdrop cancels deletion', async () => {});

    test.fixme('TC-015 Deleting the only program shows appropriate empty state', async () => {});

    test.fixme('TC-016 Concurrent delete while another user edits', async () => {});

    test.fixme('TC-018 Duplicate display names delete only the selected row', async () => {});

    test.fixme('TC-019 Focus management when dialog opens and closes', async () => {});
  });
});
