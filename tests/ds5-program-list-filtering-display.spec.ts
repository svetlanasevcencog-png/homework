import { test, expect } from '../fixtures/cleanup.fixture';
import {
  assertGuestRedirectedToLogin,
  createProgram,
  failProgramApi,
  mockEmptyProgramList,
  openProgramsList,
  requireApiToken,
  uniqueName,
} from './helpers/didaxis-programs.helpers';

requireApiToken('DS-5');

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
        await createProgram(page, request, trackProgram, p.name, {
          description: p.description,
        });
      }

      const list = await openProgramsList(page);
      await expect(list.programColumnHeader).toBeVisible();

      for (const p of programs) {
        const row = list.programRow(p.name);
        await expect(row).toBeVisible();
        await expect(list.programDataCell(row)).toContainText(p.name);
        await expect(list.programDataCell(row)).toContainText(p.description);
      }
    });

    test('TC-003 List remains correct after refresh when programs exist', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Refresh Persist 2026');
      const description = 'Should survive browser refresh';

      await createProgram(page, request, trackProgram, name, { description });
      const list = await openProgramsList(page);
      await expect(list.programDataCell(list.programRow(name))).toContainText(description);

      await page.reload();

      const refreshed = await openProgramsList(page);
      const row = refreshed.programRow(name);
      await expect(row).toBeVisible();
      await expect(refreshed.programDataCell(row)).toContainText(name);
      await expect(refreshed.programDataCell(row)).toContainText(description);
    });

    test('TC-004 Single program displays name and description without empty-state copy', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Test Program');
      const description = 'Smoke test program for list UI';

      await createProgram(page, request, trackProgram, name, { description });
      const list = await openProgramsList(page);

      const row = list.programRow(name);
      await expect(row).toBeVisible();
      await expect(list.programDataCell(row)).toContainText(name);
      await expect(list.programDataCell(row)).toContainText(description);
      await expect(list.emptyStateMessage).toHaveCount(0);
    });
  });

  test.describe('Negative flows', () => {
    test('TC-006 Empty state must not appear when programs exist', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026');

      await createProgram(page, request, trackProgram, name, {
        description: 'Existing program row',
      });
      const list = await openProgramsList(page);

      await expect(list.programRow(name)).toBeVisible();
      await expect(list.emptyStateMessage).toHaveCount(0);
      await expect(list.newProgramButton).toBeVisible();
    });

    test('TC-008 List must not swap name and description in the row', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('DS-2026');
      const description =
        'This is intentionally longer text for column alignment testing in the programs list.';

      await createProgram(page, request, trackProgram, name, { description });
      const list = await openProgramsList(page);

      const row = list.programRow(name);
      const cellText = await list.programDataCell(row).innerText();

      expect(cellText.indexOf(name)).toBeLessThan(cellText.indexOf(description));
      await expect(list.programDataCell(row)).toContainText(name);
      await expect(list.programDataCell(row)).toContainText(description);
    });

    test('TC-002 Empty state message and first-program prompt when no programs exist', async ({
      page,
    }) => {
      await mockEmptyProgramList(page);
      const list = await openProgramsList(page);

      await expect(list.emptyStateMessage).toBeVisible();
      await expect(list.createFirstProgramButton).toBeVisible();
      await expect(list.programColumnHeader).toHaveCount(0);
    });

    test('TC-007 API failure shows a false empty state (known defect DS-35)', async ({
      page,
    }) => {
      // DESIRED: a failed GET /api/programs should surface an error, not the
      // empty-list prompt. ACTUAL (defect DS-35, dup DS-72): the app renders
      // the same "Create your first program" empty state as a genuinely empty
      // list, masking the failure. We assert the current behavior (mirroring
      // the SS-25 convention) so the suite stays green and the defect is
      // pinned; update this test to expect an error state once DS-35 is fixed.
      await failProgramApi(page, ['GET']);
      const list = await openProgramsList(page);

      await expect(list.emptyStateMessage).toBeVisible();
    });

    test('TC-009 Unauthorized user must not see program list content', async ({
      browser,
    }) => {
      await assertGuestRedirectedToLogin(browser, '/programs');
    });

    // Single-tenant demo with one admin role: there is no second principal
    // whose programs could be (in)visible, so cross-account isolation cannot
    // be exercised here.
    test.fixme('TC-005 Program list must not expose programs the user cannot see', async () => {});
  });

  test.describe('Edge cases', () => {
    test('TC-010 Very long Description displays without breaking the row', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026');
      const description = 'd'.repeat(500);

      await createProgram(page, request, trackProgram, name, { description });
      const list = await openProgramsList(page);

      const row = list.programRow(name);
      await expect(row).toBeVisible();
      await expect(list.programDataCell(row)).toContainText(description.slice(0, 80));
    });

    test('TC-011 Very long Program name displays in the list row', async ({
      page,
      request,
      trackProgram,
    }) => {
      // uniqueName('') yields a collision-proof " <timestamp>-<random>" suffix.
      const suffix = uniqueName('');
      const name = 'P'.repeat(255 - suffix.length) + suffix;
      const description = 'Boundary name length row';

      await createProgram(page, request, trackProgram, name, { description });
      const list = await openProgramsList(page);

      await expect(list.programInList(name)).toBeVisible();
      await expect(list.programDataCell(list.programRow(name))).toContainText(description);
    });

    test('TC-012 Special characters and HTML-like text render safely in list', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName(`R&D "Phase 1" - Cost: 100%`);
      const description = 'Learn <HTML> & "quotes" — 50% practice.';
      let dialogTriggered = false;
      page.on('dialog', async (d) => {
        dialogTriggered = true;
        await d.dismiss();
      });

      await createProgram(page, request, trackProgram, name, { description });
      const list = await openProgramsList(page);

      const row = list.programRow(name);
      await expect(list.programDataCell(row)).toContainText('R&D "Phase 1"');
      await expect(list.programDataCell(row)).toContainText('<HTML>');
      expect(dialogTriggered).toBe(false);
    });

    test('TC-013 Unicode and accented text display correctly', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName(`École d'été — Zürich`);
      const description = '日本語サマー — cohort mixte.';

      await createProgram(page, request, trackProgram, name, { description });
      const list = await openProgramsList(page);

      const row = list.programRow(name);
      await expect(list.programDataCell(row)).toContainText('École');
      await expect(list.programDataCell(row)).toContainText('日本語');
    });

    test('TC-014 Empty Description shows name with blank or minimal description area', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Minimal Program 2026');

      await createProgram(page, request, trackProgram, name, { description: '' });
      const list = await openProgramsList(page);

      const row = list.programRow(name);
      await expect(list.programDataCell(row)).toContainText(name);
      const cellText = (await list.programDataCell(row).innerText()).replace(name, '').trim();
      expect(cellText.length).toBeLessThanOrEqual(2);
    });

    test('TC-015 Duplicate program names show two distinguishable rows (SS-25)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Test Program');

      await createProgram(page, request, trackProgram, name, { description: 'Cohort A' });
      await createProgram(page, request, trackProgram, name, { description: 'Cohort B' });
      const list = await openProgramsList(page);

      await expect(list.programInList(name)).toHaveCount(2);
      await expect(list.programRow(name).filter({ hasText: 'Cohort A' })).toHaveCount(1);
      await expect(list.programRow(name).filter({ hasText: 'Cohort B' })).toHaveCount(1);
    });

    test('TC-020 List shows correct paired name and description for two programs', async ({
      page,
      request,
      trackProgram,
    }) => {
      const sharedDescription = 'Shared boilerplate text.';
      const alpha = uniqueName('Alpha Track');
      const beta = uniqueName('Beta Track');

      await createProgram(page, request, trackProgram, alpha, {
        description: sharedDescription,
      });
      await createProgram(page, request, trackProgram, beta, {
        description: sharedDescription,
      });
      const list = await openProgramsList(page);

      await expect(list.programDataCell(list.programRow(alpha))).toContainText(alpha);
      await expect(list.programDataCell(list.programRow(beta))).toContainText(beta);
      await expect(list.programDataCell(list.programRow(alpha))).toContainText(
        sharedDescription,
      );
      await expect(list.programDataCell(list.programRow(beta))).toContainText(
        sharedDescription,
      );
    });

    test('TC-019 Empty state CTA keyboard and screen-reader accessibility', async ({
      page,
    }) => {
      await mockEmptyProgramList(page);
      const list = await openProgramsList(page);

      // Exposed to assistive tech via an accessible button name.
      await expect(list.createFirstProgramButton).toBeVisible();

      // Reachable and operable by keyboard alone.
      await list.createFirstProgramButton.focus();
      await expect(list.createFirstProgramButton).toBeFocused();
      await page.keyboard.press('Enter');

      await expect(list.newProgramModal.programNameInput).toBeVisible();
    });

    // The Programs list renders all rows with no search box, no filter input,
    // and no pagination/load-more controls (verified against the live app), so
    // these scenarios describe functionality that does not exist yet.
    test.fixme('TC-016 Pagination or load more with 100+ programs', async () => {});

    test.fixme('TC-017 Search or filter by name narrows list', async () => {});

    test.fixme('TC-018 Filter with no matches shows zero-result copy', async () => {});
  });
});
