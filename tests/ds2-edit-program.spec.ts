import { test, expect } from '../fixtures/cleanup.fixture';
import {
  assertGuestRedirectedToLogin,
  createProgram,
  failProgramApi,
  openEditForProgram,
  requireApiToken,
  uniqueName,
} from './helpers/didaxis-programs.helpers';

requireApiToken('DS-2');

test.describe('DS-2 Edit existing program details', () => {
  test.describe('Positive flows', () => {
    test('TC-001 Edit form opens with current program values pre-populated', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development');
      const description = 'Full-stack cohort starting January 2026';

      await createProgram(page, request, trackProgram, name, { description });
      const programs = await openEditForProgram(page, name);
      const modal = programs.editProgramModal;

      await expect(modal.programNameInput).toHaveValue(name);
      await expect(modal.descriptionInput).toHaveValue(description);
      await expect(modal.saveButton).toBeVisible();
      await expect(modal.cancelButton).toBeVisible();
    });

    test('TC-002 Updated program name appears in the list after Save and modal closes', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Web Development');
      const updated = `${original} - Updated`;

      await createProgram(page, request, trackProgram, original);
      const programs = await openEditForProgram(page, original);
      const modal = programs.editProgramModal;

      await modal.fillProgramName(updated);
      await modal.submit();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(updated)).toBeVisible();
      await expect(programs.programInList(original)).toHaveCount(0);
    });

    test('TC-003 Saving after changing only Description leaves Name unchanged', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development');
      const originalDescription = 'Original cohort description';
      const updatedDescription = 'Updated: emphasis on React and Node.js projects.';

      await createProgram(page, request, trackProgram, name, {
        description: originalDescription,
      });
      let programs = await openEditForProgram(page, name);
      await programs.editProgramModal.fillDescription(updatedDescription);
      await programs.editProgramModal.submit();

      await expect(programs.editProgramModal.programNameInput).toBeHidden();
      await expect(programs.programInList(name)).toBeVisible();

      programs = await openEditForProgram(page, name);
      await expect(programs.editProgramModal.programNameInput).toHaveValue(name);
      await expect(programs.editProgramModal.descriptionInput).toHaveValue(
        updatedDescription,
      );
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
      let programs = await openEditForProgram(page, original);
      const modal = programs.editProgramModal;

      await modal.fillProgramName(updatedName);
      await modal.fillDescription(updatedDescription);
      await modal.submit();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(updatedName)).toBeVisible();

      programs = await openEditForProgram(page, updatedName);
      await expect(programs.editProgramModal.programNameInput).toHaveValue(updatedName);
      await expect(programs.editProgramModal.descriptionInput).toHaveValue(
        updatedDescription,
      );
    });

    test('TC-005 Clearing Description saves successfully when Description is optional', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Clear Description');

      await createProgram(page, request, trackProgram, name, {
        description: 'Will be cleared',
      });
      let programs = await openEditForProgram(page, name);
      await programs.editProgramModal.fillDescription('');
      await programs.editProgramModal.submit();

      await expect(programs.editProgramModal.programNameInput).toBeHidden();
      await expect(programs.programInList(name)).toBeVisible();

      programs = await openEditForProgram(page, name);
      await expect(programs.editProgramModal.descriptionInput).toHaveValue('');
    });
  });

  test.describe('Negative flows', () => {
    test('TC-007 Required Name must not be saved as empty', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Required Name');

      await createProgram(page, request, trackProgram, name);
      const programs = await openEditForProgram(page, name);
      const modal = programs.editProgramModal;

      await modal.fillProgramName('');
      await expect(modal.saveButton).toBeDisabled();

      await page.keyboard.press('Escape');
      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-021 Whitespace-only Name does not enable Save', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026');

      await createProgram(page, request, trackProgram, name);
      const programs = await openEditForProgram(page, name);
      const modal = programs.editProgramModal;

      await modal.fillProgramName('     ');
      await modal.descriptionInput.focus();
      await expect(modal.saveButton).toBeDisabled();

      await page.keyboard.press('Escape');
      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-011 Cancel discards edits and list keeps the original name', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Web Development');
      const discarded = `${original} - Discarded`;

      await createProgram(page, request, trackProgram, original);
      let programs = await openEditForProgram(page, original);
      const modal = programs.editProgramModal;

      await modal.fillProgramName(discarded);
      await modal.cancel();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(original)).toBeVisible();
      await expect(programs.programInList(discarded)).toHaveCount(0);

      programs = await openEditForProgram(page, original);
      await expect(programs.editProgramModal.programNameInput).toHaveValue(original);
    });

    test('TC-006 Program list must not show a new name if save fails', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Save Fail');
      await createProgram(page, request, trackProgram, original);
      const programs = await openEditForProgram(page, original);
      const modal = programs.editProgramModal;
      const attempted = `${original} - Renamed`;

      await failProgramApi(page, ['PUT', 'PATCH']);
      await modal.fillProgramName(attempted);
      await modal.submit();

      // Save was rejected by the backend: the attempted name must not leak
      // into the list, and the original must remain.
      await expect(programs.programInList(attempted)).toHaveCount(0);
      await expect(programs.programInList(original)).toHaveCount(1);
    });

    test('TC-010 Modal must not close when backend rejects the save payload', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Reject Save');
      await createProgram(page, request, trackProgram, original);
      const programs = await openEditForProgram(page, original);
      const modal = programs.editProgramModal;

      await failProgramApi(page, ['PUT', 'PATCH']);
      await modal.fillProgramName(`${original} - Rejected`);
      await modal.submit();

      // The modal must stay open so the user can correct and retry.
      await expect(modal.dialog).toBeVisible();
      await expect(modal.programNameInput).toBeVisible();
    });

    test('TC-009 Unauthorized user must not open edit or save changes', async ({
      browser,
    }) => {
      await assertGuestRedirectedToLogin(browser, '/programs');
    });

    // The program form exposes only Name and Description — there are no date
    // inputs in the New/Edit Program modal, so a date-range rule cannot be
    // exercised against this app.
    test.fixme('TC-008 Invalid date range must not be persisted', async () => {});
  });

  test.describe('Edge cases', () => {
    test('TC-012 255-character Program Name saves and displays correctly', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Max Length');
      // uniqueName('') yields a collision-proof " <timestamp>-<random>" suffix.
      const suffix = uniqueName('');
      const maxName = 'A'.repeat(255 - suffix.length) + suffix;
      expect(maxName).toHaveLength(255);

      await createProgram(page, request, trackProgram, original);
      const programs = await openEditForProgram(page, original);
      const modal = programs.editProgramModal;

      await modal.fillProgramName(maxName);
      await modal.submit();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(maxName)).toBeVisible();
    });

    test('TC-013 Name one character over maximum keeps Save disabled or blocks submit', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Over Max');
      const tooLong = `${'B'.repeat(256)}${Date.now()}`;

      await createProgram(page, request, trackProgram, name);
      const programs = await openEditForProgram(page, name);
      const modal = programs.editProgramModal;

      await modal.fillProgramName(tooLong);

      const disabled = await modal.saveButton.isDisabled();
      if (!disabled) {
        await modal.submit();
        await expect(modal.programNameInput).toBeVisible();
        await expect(programs.programInList(name)).toBeVisible();
        await expect(programs.programInList(tooLong)).toHaveCount(0);
      } else {
        await expect(modal.saveButton).toBeDisabled();
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
      let programs = await openEditForProgram(page, name);
      await programs.editProgramModal.fillDescription(longDescription);
      await programs.editProgramModal.submit();

      await expect(programs.editProgramModal.programNameInput).toBeHidden();
      programs = await openEditForProgram(page, name);
      await expect(programs.editProgramModal.descriptionInput).toHaveValue(
        longDescription,
      );
    });

    test('TC-015 Special characters in Name are stored and displayed verbatim', async ({
      page,
      request,
      trackProgram,
    }) => {
      const original = uniqueName('Special Chars Base');
      const special = uniqueName(`Web Dev 2026 <Advanced> & "React" — 100%`);

      let dialogTriggered = false;
      page.on('dialog', async (d) => {
        dialogTriggered = true;
        await d.dismiss();
      });

      await createProgram(page, request, trackProgram, original);
      const programs = await openEditForProgram(page, original);
      const modal = programs.editProgramModal;

      await modal.fillProgramName(special);
      await modal.submit();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(special)).toBeVisible();
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
      let programs = await openEditForProgram(page, name);
      await programs.editProgramModal.fillDescription(unicodeDescription);
      await programs.editProgramModal.submit();

      await expect(programs.editProgramModal.programNameInput).toBeHidden();
      programs = await openEditForProgram(page, name);
      await expect(programs.editProgramModal.descriptionInput).toHaveValue(
        unicodeDescription,
      );
    });

    test('TC-017 Renaming to an existing program name is allowed (duplicate names)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const nameA = uniqueName('Dup Edit A');
      const nameB = uniqueName('Dup Edit B');

      await createProgram(page, request, trackProgram, nameA, { description: 'A' });
      await createProgram(page, request, trackProgram, nameB, { description: 'B' });
      const programs = await openEditForProgram(page, nameA);
      const modal = programs.editProgramModal;

      await modal.fillProgramName(nameB);
      await modal.submit();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(nameA)).toHaveCount(0);
      await expect(programs.programInList(nameB)).toHaveCount(2);
    });

    test('TC-018 Leading and trailing whitespace in Name is trimmed on save', async ({
      page,
      request,
      trackProgram,
    }) => {
      const trimmed = uniqueName('Trim Edit');
      const padded = `   ${trimmed}   `;

      await createProgram(page, request, trackProgram, trimmed);
      const programs = await openEditForProgram(page, trimmed);
      const modal = programs.editProgramModal;

      await modal.fillProgramName(padded);
      await modal.submit();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(trimmed)).toBeVisible();
    });

    test('TC-019 Whitespace-only Description is rejected or normalized', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Whitespace Desc');
      const originalDescription = 'Has content';

      await createProgram(page, request, trackProgram, name, {
        description: originalDescription,
      });
      let programs = await openEditForProgram(page, name);
      await programs.editProgramModal.fillDescription('   \n');
      await programs.editProgramModal.submit();

      await expect(programs.editProgramModal.programNameInput).toBeHidden();
      programs = await openEditForProgram(page, name);
      const value = await programs.editProgramModal.descriptionInput.inputValue();
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
      const programs = await openEditForProgram(page, original);
      const modal = programs.editProgramModal;

      await modal.fillProgramName(updated);
      await modal.saveButton.dblclick();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(updated)).toHaveCount(1);
      await expect(programs.programInList(original)).toHaveCount(0);
    });
  });
});
