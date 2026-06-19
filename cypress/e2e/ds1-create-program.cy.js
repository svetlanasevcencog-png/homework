/// <reference types="cypress" />

const {
  cleanupTrackedPrograms,
  requireApiToken,
  resetProgramCleanup,
  trackProgramByName,
} = require('../helpers/api-cleanup.helpers');
const {
  ensureLoggedIn,
  openNewProgramForm,
  uniqueName,
  visitPrograms,
} = require('../helpers/didaxis-programs.helpers');

requireApiToken('DS-1');

describe('DS-1 Create new academic program', () => {
  beforeEach(() => {
    ensureLoggedIn();
    resetProgramCleanup();
  });

  afterEach(() => {
    cleanupTrackedPrograms();
  });

  /* ------------------------------------------------------------------ */
  /* Positive flows                                                      */
  /* ------------------------------------------------------------------ */
  context('Positive flows', () => {
    it('TC-001 Admin can open the program creation form from the Programs page', () => {
      const programs = visitPrograms();
      const modal = programs.newProgramModal;

      programs.openNewProgram();

      modal.dialog().should('be.visible');
      modal.programNameInput().should('be.visible').and('be.enabled');
      modal.descriptionInput().should('be.visible').and('be.enabled');
      modal.createButton().should('be.visible').and('be.disabled');
    });

    it('TC-001b New Program modal hides AI config fields until expanded', () => {
      const programs = visitPrograms();
      const modal = programs.newProgramModal;

      programs.openNewProgram();

      modal.dialog().should('be.visible');
      modal.programNameInput().should('be.visible');
      modal.descriptionInput().should('be.visible');
      modal.showAiConfigButton().should('be.visible');
      modal.hideAiConfigButton().should('not.be.visible');
      modal.createButton().should('be.visible').and('be.disabled');
    });

    it('TC-001c Expanding AI Generation Config reveals scheduling and audience fields', () => {
      const programs = visitPrograms();
      const modal = programs.newProgramModal;

      programs.openNewProgram();
      modal.expandAiGenerationConfig();

      modal.dialog().should('be.visible');
      modal.totalProgramHoursInput().should('be.visible');
      modal.dialog().contains('Required for AI curriculum generation').should('be.visible');
      modal.defaultSessionHoursInput().should('have.value', '4');
      modal.defaultExamHoursInput().should('have.value', '3');
      modal.targetAudienceInput().should('be.visible');
      modal.focusAreasInput().should('be.visible');
      modal.dialog().contains('Sync/Async Ratio: 70% sync / 30% async').should('be.visible');
    });

    it('TC-002 Opening the form reveals an interactive Program Name field', () => {
      // Verified app behavior: focus lands on the modal close button, not on the
      // Program Name field. We assert that the field is reachable and editable,
      // then focus it explicitly via click.
      const programs = visitPrograms();
      const modal = programs.newProgramModal;

      programs.openNewProgram();

      modal.programNameInput().should('be.visible').and('not.be.disabled');
      modal.programNameInput().click().should('have.focus');
    });

    it('TC-003 Admin can create a program with both Name and Description', () => {
      const name = uniqueName('Web Development');
      const description = 'Full-stack web development program';
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.create(name, description);

      modal.shouldBeClosed();
      programs.programInList(name).should('be.visible');
      trackProgramByName(name);
    });

    it('TC-004 Newly created program persists across reload', () => {
      const name = uniqueName('Persisted Program');
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.fillProgramName(name);
      modal.submit();
      programs.programInList(name).should('be.visible');

      cy.reload();

      programs.programInList(name).should('be.visible');
      trackProgramByName(name);
    });

    it('TC-005 Create button becomes enabled as soon as Program Name has content', () => {
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.createButton().should('be.disabled');

      modal.fillProgramName('W');

      modal.createButton().should('not.be.disabled');
    });

    it('TC-006 Description is optional', () => {
      const name = uniqueName('Data Science');
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.fillProgramName(name);
      modal.submit();

      modal.shouldBeClosed();
      programs.programInList(name).should('be.visible');
      trackProgramByName(name);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Negative flows                                                      */
  /* ------------------------------------------------------------------ */
  context('Negative flows', () => {
    it('TC-N-001 Create button is disabled when Program Name is empty', () => {
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.fillDescription('Full-stack web development program');

      modal.programNameInput().should('have.value', '');
      modal.createButton().should('be.disabled');
    });

    it('TC-N-002 Whitespace-only Program Name does not enable Create', () => {
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.fillProgramName('     ');
      modal.descriptionInput().focus();

      modal.createButton().should('be.disabled');
    });

    it('TC-N-003 Closing the modal discards the entry', () => {
      const name = uniqueName('Throwaway');
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.fillProgramName(name);
      modal.fillDescription('Should not be saved');
      cy.get('body').type('{esc}');

      modal.shouldBeClosed();

      cy.reload();
      programs.programInList(name).should('not.exist');
    });

    it('TC-N-004 Re-opening the form after dismiss retains the previously entered values', () => {
      // Verified app behavior: dismissing the modal via Escape (or via Cancel) does
      // NOT clear the form. Values persist on reopen until a successful Create
      // resets them.
      const draftName = uniqueName('Draft');
      const draftDescription = 'Should not be saved';
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.fillProgramName(draftName);
      modal.fillDescription(draftDescription);
      cy.get('body').type('{esc}');
      modal.shouldBeClosed();

      programs.openNewProgram();
      modal.dialog().should('be.visible');

      modal.programNameInput().should('have.value', draftName);
      modal.descriptionInput().should('have.value', draftDescription);
      modal.createButton().should('not.be.disabled');
    });
  });

  /* ------------------------------------------------------------------ */
  /* Edge cases                                                          */
  /* ------------------------------------------------------------------ */
  context('Edge cases', () => {
    it('TC-E-008 Hiding AI Generation Config collapses the extended fields', () => {
      const programs = visitPrograms();
      const modal = programs.newProgramModal;

      programs.openNewProgram();
      modal.expandAiGenerationConfig();
      modal.collapseAiGenerationConfig();

      modal.showAiConfigButton().should('be.visible');
      modal.hideAiConfigButton().should('not.be.visible');
      modal.createButton().should('be.disabled');
    });

    it('TC-E-001 Leading/trailing whitespace in Program Name is trimmed', () => {
      const trimmed = uniqueName('Trim Test');
      const padded = `   ${trimmed}   `;
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.fillProgramName(padded);
      modal.submit();

      modal.shouldBeClosed();
      programs.programInList(trimmed).should('be.visible');
      trackProgramByName(trimmed);
    });

    it('TC-E-002 255-character Program Name is accepted', () => {
      const suffix = ` ${Date.now()}`;
      const name = 'A'.repeat(255 - suffix.length) + suffix;
      expect(name).to.have.length(255);

      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.programNameInput().type(name, { delay: 0 });
      modal.submit();

      modal.shouldBeClosed();
      programs.programInList(name).should('be.visible');
      trackProgramByName(name);
    });

    it('TC-E-004 Long Description (2000 characters) is accepted', () => {
      const name = uniqueName('Long Description Program');
      const description = 'd'.repeat(2000);
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.fillProgramName(name);
      modal.descriptionInput().type(description, { delay: 0 });
      modal.submit();

      modal.shouldBeClosed();
      programs.programInList(name).should('be.visible');
      trackProgramByName(name);
    });

    it('TC-E-006 Special characters, emojis, and non-Latin scripts are accepted verbatim', () => {
      const xssName = `<script>alert(1)</script> ${Date.now()}`;
      const i18nName = `任务一 / مهمة / задача ${Date.now()}`;
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      cy.on('window:alert', (msg) => {
        throw new Error(`Unexpected window.alert (possible XSS): ${msg}`);
      });

      modal.programNameInput().type(xssName, { parseSpecialCharSequences: false });
      modal.descriptionInput().type(`O'Brien & "Co."`, {
        parseSpecialCharSequences: false,
      });
      modal.submit();
      modal.shouldBeClosed();
      programs.programInList(xssName).should('be.visible');
      trackProgramByName(xssName);

      programs.openNewProgram();
      modal.dialog().should('be.visible');
      modal.fillProgramName(i18nName);
      modal.fillDescription('🚀 Multilingual program 🔥');
      modal.submit();
      modal.shouldBeClosed();
      programs.programInList(i18nName).should('be.visible');
      trackProgramByName(i18nName);
    });

    it('TC-E-007 Short Program Name (single-letter prefix) is accepted', () => {
      // Single literal characters aren't isolation-safe (duplicate behavior is
      // undefined), so we exercise the lower boundary with a single-letter prefix
      // plus a unique timestamp suffix.
      const name = `A${Date.now()}`;
      const programs = openNewProgramForm();
      const modal = programs.newProgramModal;

      modal.fillProgramName(name);
      modal.submit();

      modal.shouldBeClosed();
      programs.programInList(name).should('be.visible');
      trackProgramByName(name);
    });
  });
});
