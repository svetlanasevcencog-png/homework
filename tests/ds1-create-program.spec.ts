import { test, expect } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/programs.page';
import {
  openNewProgramForm,
  openProgramsList,
  requireApiToken,
  trackProgramByName,
  uniqueName,
} from './helpers/didaxis-programs.helpers';

requireApiToken('DS-1');

test.describe('DS-1 Create new academic program', () => {
  // Auth state comes from tests/auth.setup.ts via playwright.config storageState.

  test.describe('Positive flows', () => {
    test('TC-001 Admin can open the program creation form from the Programs page', async ({
      page,
    }) => {
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await expect(modal.programNameInput).toBeVisible();
      await expect(modal.programNameInput).toBeEnabled();
      await expect(modal.descriptionInput).toBeVisible();
      await expect(modal.descriptionInput).toBeEnabled();
      await expect(modal.createButton).toBeVisible();
      await expect(modal.createButton).toBeDisabled();
    });

    test('TC-001b New Program modal hides AI config fields until expanded', async ({
      page,
    }) => {
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await expect(modal.dialog).toBeVisible();
      await expect(modal.programNameInput).toBeVisible();
      await expect(modal.descriptionInput).toBeVisible();
      await expect(modal.showAiConfigButton).toBeVisible();
      await expect(modal.hideAiConfigButton).toBeHidden();
      await expect(modal.cancelButton).toBeVisible();
      await expect(modal.createButton).toBeVisible();
    });

    test('TC-001c Expanding AI Generation Config reveals scheduling and audience fields', async ({
      page,
    }) => {
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.expandAiGenerationConfig();

      await expect(modal.dialog).toBeVisible();
      await expect(modal.totalProgramHoursInput).toBeVisible();
      await expect(modal.aiConfigRequiredHint).toBeVisible();
      await expect(modal.defaultSessionHoursInput).toHaveValue('4');
      await expect(modal.defaultExamHoursInput).toHaveValue('3');
      await expect(modal.targetAudienceInput).toBeVisible();
      await expect(modal.focusAreasInput).toBeVisible();
      await expect(modal.syncAsyncRatioLabel).toBeVisible();
    });

    test('TC-002 Opening the form reveals an interactive Program Name field', async ({
      page,
    }) => {
      const programs = await openNewProgramForm(page);
      const nameField = programs.newProgramModal.programNameInput;

      await expect(nameField).toBeVisible();
      await expect(nameField).toBeEditable();
      await nameField.click();
      await expect(nameField).toBeFocused();
    });

    test('TC-003 Admin can create a program with both Name and Description', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Web Development');
      const description = 'Full-stack web development program';
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.fillDescription(description);
      await modal.submit();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(name)).toBeVisible();
      await trackProgramByName(request, trackProgram, name);
    });

    test('TC-004 Newly created program persists across reload', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Persisted Program');
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.submit();
      await expect(programs.programInList(name)).toBeVisible();

      await page.reload();

      const reloaded = new ProgramsPage(page);
      await expect(reloaded.programInList(name)).toBeVisible();
      await trackProgramByName(request, trackProgram, name);
    });

    test('TC-005 Create button becomes enabled as soon as Program Name has content', async ({
      page,
    }) => {
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await expect(modal.createButton).toBeDisabled();
      await modal.fillProgramName('W');
      await expect(modal.createButton).toBeEnabled();
    });

    test('TC-005b New-program button is keyboard operable', async ({ page }) => {
      const programs = await openProgramsList(page);

      await programs.newProgramButton.focus();
      await expect(programs.newProgramButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(programs.newProgramModal.dialog).toBeVisible();
    });

    test('TC-006 Description is optional', async ({ page, request, trackProgram }) => {
      const name = uniqueName('Data Science');
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.submit();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(name)).toBeVisible();
      await trackProgramByName(request, trackProgram, name);
    });
  });

  test.describe('Negative flows', () => {
    test('TC-N-001 Create button is disabled when Program Name is empty', async ({
      page,
    }) => {
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillDescription('Full-stack web development program');

      await expect(modal.programNameInput).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
    });

    test('TC-N-002 Whitespace-only Program Name does not enable Create', async ({
      page,
    }) => {
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName('     ');
      await modal.descriptionInput.focus();

      await expect(modal.createButton).toBeDisabled();
    });

    test('TC-N-003 Closing the modal discards the entry', async ({ page }) => {
      const name = uniqueName('Throwaway');
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.fillDescription('Should not be saved');
      await page.keyboard.press('Escape');

      await expect(modal.programNameInput).toBeHidden();

      await page.reload();
      const reloaded = new ProgramsPage(page);
      await expect(reloaded.programInList(name)).toHaveCount(0);
    });

    test('TC-N-004 Re-opening the form after dismiss retains the previously entered values', async ({
      page,
    }) => {
      const draftName = uniqueName('Draft');
      const draftDescription = 'Should not be saved';
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(draftName);
      await modal.fillDescription(draftDescription);
      await page.keyboard.press('Escape');
      await expect(modal.programNameInput).toBeHidden();

      await programs.openNewProgram();

      await expect(modal.programNameInput).toHaveValue(draftName);
      await expect(modal.descriptionInput).toHaveValue(draftDescription);
      await expect(modal.createButton).toBeEnabled();
    });

    test('TC-N-005 Cancel dismisses New Program modal without saving', async ({ page }) => {
      const name = uniqueName('Cancelled Draft');
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.cancel();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(name)).toHaveCount(0);
    });

    test('TC-N-006 Invalid Total Program Hours closes modal without creating or explaining (DS-115)', async ({
      page,
    }) => {
      const name = uniqueName('Hours Alpha');
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.totalProgramHoursInput.fill('abc');
      await modal.submit();
      await expect(modal.programNameInput).toBeHidden();

      await expect(programs.programInList(name)).toHaveCount(0);
    });

    test('TC-N-007 Negative Total Program Hours is rejected silently on submit (DS-115)', async ({
      page,
    }) => {
      const name = uniqueName('Hours Beta');
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(name);
      await modal.totalProgramHoursInput.fill('-5');
      await modal.submit();
      await expect(modal.programNameInput).toBeHidden();

      await expect(programs.programInList(name)).toHaveCount(0);
    });
  });

  test.describe('Edge cases', () => {
    test('TC-E-008 Hiding AI Generation Config collapses the extended fields', async ({
      page,
    }) => {
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.expandAiGenerationConfig();
      await modal.collapseAiGenerationConfig();

      await expect(modal.showAiConfigButton).toBeVisible();
      await expect(modal.hideAiConfigButton).toBeHidden();
      await expect(modal.createButton).toBeDisabled();
    });

    test('TC-E-001 Leading/trailing whitespace in Program Name is trimmed', async ({
      page,
      request,
      trackProgram,
    }) => {
      const trimmed = uniqueName('Trim Test');
      const padded = `   ${trimmed}   `;
      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.fillProgramName(padded);
      await modal.submit();

      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(trimmed)).toBeVisible();
      await trackProgramByName(request, trackProgram, trimmed);
    });

    test('TC-E-002 255-character Program Name is accepted', async ({
      page,
      request,
      trackProgram,
    }) => {
      // uniqueName('') yields a collision-proof " <timestamp>-<random>" suffix.
      const suffix = uniqueName('');
      const name = 'A'.repeat(255 - suffix.length) + suffix;
      expect(name).toHaveLength(255);

      const programs = await openNewProgramForm(page);
      await programs.newProgramModal.create(name);

      await expect(programs.newProgramModal.programNameInput).toBeHidden();
      await expect(programs.programInList(name)).toBeVisible();
      await trackProgramByName(request, trackProgram, name);
    });

    test('TC-E-004 Long Description (2000 characters) is accepted', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('Long Description Program');
      const description = 'd'.repeat(2000);
      const programs = await openNewProgramForm(page);

      await programs.newProgramModal.create(name, description);

      await expect(programs.newProgramModal.programNameInput).toBeHidden();
      await expect(programs.programInList(name)).toBeVisible();
      await trackProgramByName(request, trackProgram, name);
    });

    test('TC-E-006 Special characters, emojis, and non-Latin scripts are accepted verbatim', async ({
      page,
      request,
      trackProgram,
    }) => {
      const xssName = uniqueName('<script>alert(1)</script>');
      const i18nName = uniqueName('任务一 / مهمة / задача');

      let dialogTriggered = false;
      page.on('dialog', async (d) => {
        dialogTriggered = true;
        await d.dismiss();
      });

      const programs = await openNewProgramForm(page);
      const modal = programs.newProgramModal;

      await modal.create(xssName, `O'Brien & "Co."`);
      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(xssName)).toBeVisible();
      await trackProgramByName(request, trackProgram, xssName);

      await programs.openNewProgram();
      await modal.create(i18nName, '🚀 Multilingual program 🔥');
      await expect(modal.programNameInput).toBeHidden();
      await expect(programs.programInList(i18nName)).toBeVisible();
      await trackProgramByName(request, trackProgram, i18nName);

      expect(dialogTriggered).toBe(false);
    });

    test('TC-E-007 Short Program Name (single-letter prefix) is accepted', async ({
      page,
      request,
      trackProgram,
    }) => {
      const name = uniqueName('A');
      const programs = await openNewProgramForm(page);

      await programs.newProgramModal.create(name);

      await expect(programs.newProgramModal.programNameInput).toBeHidden();
      await expect(programs.programInList(name)).toBeVisible();
      await trackProgramByName(request, trackProgram, name);
    });

    // Known defect SS-26: rapid double-click submits twice and creates two
    // programs. Keep deferred until the submit is de-bounced.
    test.fixme(
      'TC-E-009 Rapid double-click on Create does not create two programs',
      async ({ page }) => {
        const name = uniqueName('Idempotent');
        const programs = await openNewProgramForm(page);
        const modal = programs.newProgramModal;

        await modal.fillProgramName(name);
        await modal.createButton.dblclick();

        await expect(modal.programNameInput).toBeHidden();
        await expect(programs.programInList(name)).toHaveCount(1);
      },
    );
  });
});
