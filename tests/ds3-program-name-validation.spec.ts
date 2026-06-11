import { test, expect } from '../fixtures/cleanup.fixture';
import {
  assertGuestRedirectedToLogin,
  failProgramApi,
  openNewProgramForm,
  requireApiToken,
  submitNewProgram,
  uniqueName,
} from './helpers/didaxis-programs.helpers';

requireApiToken('DS-3');

test.describe('DS-3 Program name validation and duplicate prevention', () => {
  test.describe('Positive flows', () => {
    test('TC-001 Program with special characters in name is created successfully', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Informatique & IA - Niveau 2');
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.fillDescription('Cycle secondaire — orientation sciences');
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-002 Valid unique name with letters, numbers, and spaces is accepted', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Data Science Bootcamp 2026');
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.fillDescription('Python, ML, and data engineering track');
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-003 Name at maximum allowed length (255) is accepted when unique', async ({
      page,
      request,
      trackProgram,
    }) => {
      // uniqueName('') yields a collision-proof " <timestamp>-<random>" suffix.
      const suffix = uniqueName('');
      const name = 'A'.repeat(255 - suffix.length) + suffix;
      expect(name).toHaveLength(255);

      const programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(name);
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toBeVisible();
    });
  });

  test.describe('Negative flows', () => {
    test('TC-004 Whitespace-only program name is not submitted', async ({ page }) => {
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName('   ');
      await modal.fillDescription('Valid description');

      await expect(modal.createButton).toBeDisabled();
    });

    test('TC-006 Empty program name must not create a program', async ({ page }) => {
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillDescription('Description without a name');

      await expect(modal.programNameInput).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
    });

    test('TC-005 Duplicate name is allowed (no blocking error)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026');

      let programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(name);
      await submitNewProgram(programs, request, trackProgram, name);

      programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(name);
      await programs.newProgramModal.fillDescription('Second cohort');
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toHaveCount(2);
    });

    test('TC-009 Padded duplicate name is allowed after trim (SS-25)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026 Padded');
      const padded = `  ${name}  `;

      let programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(name);
      await submitNewProgram(programs, request, trackProgram, name);

      programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(padded);
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toHaveCount(2);
    });

    test('TC-008 Case-variant duplicate is allowed (case-sensitive uniqueness)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const baseName = uniqueName('Web Development 2026');
      const variant = baseName.replace('Web', 'web');

      let programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(baseName);
      await submitNewProgram(programs, request, trackProgram, baseName);

      programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(variant);
      await submitNewProgram(programs, request, trackProgram, variant);

      await expect(programs.programInList(baseName)).toBeVisible();
      await expect(programs.programInList(variant)).toBeVisible();
    });

    test('TC-007 Server rejection on create surfaces without a phantom program', async ({
      page,
    }) => {
      // The live server accepts duplicates (SS-25), so there is no genuine
      // server-side duplicate rejection to trigger. We simulate a server error
      // on create to verify the client does not optimistically add a phantom
      // row and keeps the modal open for retry.
      const name = uniqueName('Server Reject Create');
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await failProgramApi(page, ['POST']);
      await modal.fillProgramName(name);
      await modal.submit();

      await expect(modal.dialog).toBeVisible();
      await expect(programs.programInList(name)).toHaveCount(0);
    });

    test('TC-010 Unauthorized user must not create a program', async ({ browser }) => {
      await assertGuestRedirectedToLogin(browser, '/programs');
    });
  });

  test.describe('Edge cases', () => {
    test('TC-011 Name one character over maximum is rejected or blocked', async ({
      page,
    }) => {
      const tooLong = `${'B'.repeat(256)}${Date.now()}`;
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(tooLong);

      const disabled = await modal.createButton.isDisabled();
      if (!disabled) {
        await modal.submit();
        await expect(modal.programNameInput).toBeVisible();
        await expect(programs.programInList(tooLong)).toHaveCount(0);
      } else {
        await expect(modal.createButton).toBeDisabled();
      }
    });

    test('TC-012 Unicode and accented characters in name are accepted when unique', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName(`École d'été — Zürich 2026`);
      const programs = await openNewProgramForm(page);

      await programs.newProgramModal.fillProgramName(name);
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-013 Emoji in program name is accepted', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Dev 2026 🚀');
      const programs = await openNewProgramForm(page);

      await programs.newProgramModal.fillProgramName(name);
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-014 HTML-like strings in name are stored as text, not executed', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('<script>alert(1)</script> Program');
      let dialogTriggered = false;
      page.on('dialog', async (d) => {
        dialogTriggered = true;
        await d.dismiss();
      });

      const programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(name);
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toBeVisible();
      expect(dialogTriggered).toBe(false);
    });

    test('TC-015 Duplicate check after trim allows duplicate (SS-25)', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development 2026 Trim Dup');
      const padded = `   ${name}   `;

      let programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(name);
      await submitNewProgram(programs, request, trackProgram, name);

      programs = await openNewProgramForm(page);
      await programs.newProgramModal.fillProgramName(padded);
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toHaveCount(2);
    });

    test('TC-016 Tab and newline in name are trimmed to a valid unique name', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Valid Name 2026');
      const messy = `\t\n  ${name}`;
      const programs = await openNewProgramForm(page);

      await programs.newProgramModal.fillProgramName(messy);
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-017 Single visible character name is accepted with unique suffix', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('A');
      const programs = await openNewProgramForm(page);

      await programs.newProgramModal.fillProgramName(name);
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-019 Special-character acceptance beyond AC example', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName(`R&D "Phase 1" - Cost: 100%`);
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.fillDescription(`O'Brien & "Co."`);
      await submitNewProgram(programs, request, trackProgram, name);

      await expect(programs.programInList(name)).toBeVisible();
    });

    test('TC-020 Dismissing the form retains field values for a corrected retry', async ({
      page,
      request,
      trackProgram,
    }) => {
      const duplicate = uniqueName('Web Development 2026');
      const unique = `${duplicate} - New`;
      const description = 'Should remain after cancel';

      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(duplicate);
      await modal.fillDescription(description);
      await page.keyboard.press('Escape');
      await expect(modal.programNameInput).toBeHidden();

      await programs.openNewProgram();
      await modal.fillProgramName(unique);
      await expect(modal.descriptionInput).toHaveValue(description);
      await submitNewProgram(programs, request, trackProgram, unique);

      await expect(programs.programInList(unique)).toBeVisible();
    });

    // Known defect SS-26: a rapid double-click on Create submits twice and
    // creates two programs. Keep deferred until the app de-bounces the submit.
    test.fixme('TC-018 Rapid double-click on Create does not create two programs', async () => {});
  });
});
