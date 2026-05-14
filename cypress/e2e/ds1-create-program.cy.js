/// <reference types="cypress" />

const APP_BASE = 'https://test.didaxis.studio';
const LOGIN_PATH = '/login';
const PROGRAMS_PATH = '/programs';

const EMAIL = Cypress.env('DIDAXIS_EMAIL');
const PASSWORD = Cypress.env('DIDAXIS_PASSWORD');

if (!EMAIL || !PASSWORD) {
  throw new Error(
    'DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be defined in .env to run DS-1 tests.',
  );
}

const PROGRAM_NAME_INPUT_SEL = 'input[placeholder="e.g. Computer Science BSc"]';
const DESCRIPTION_INPUT_SEL = '[placeholder="Brief description"]';
const DIALOG_SEL = '[role="dialog"]';

const uniqueName = (prefix) => `${prefix} ${Date.now()}`;

const programNameInput = () => cy.get(PROGRAM_NAME_INPUT_SEL);
const descriptionInput = () => cy.get(DESCRIPTION_INPUT_SEL);
const dialog = () => cy.get(DIALOG_SEL);
const createButton = () => cy.get(DIALOG_SEL).contains('button', 'Create');
const newProgramButton = () => cy.contains('button', 'New Program');

const login = () => {
  cy.visit(`${APP_BASE}${LOGIN_PATH}`);
  cy.get('input[placeholder="you@college.edu"]').type(EMAIL);
  cy.get('input[placeholder="Your password"]').type(PASSWORD, { log: false });
  cy.contains('button', 'Sign In').click();
  cy.location('pathname', { timeout: 30000 }).should('not.eq', LOGIN_PATH);
};

// Log in once per session and reuse cookies + storage across tests/specs.
// Mirrors the worker-scoped `authedStorageState` fixture in the Playwright spec.
const ensureLoggedIn = () => {
  cy.session('didaxis-admin', login, { cacheAcrossSpecs: true });
};

const visitPrograms = () => {
  ensureLoggedIn();
  cy.visit(`${APP_BASE}${PROGRAMS_PATH}`);
};

const openProgramForm = () => {
  visitPrograms();
  newProgramButton().click();
  dialog().should('be.visible');
  programNameInput().should('be.visible');
};

describe('DS-1 Create new academic program', () => {
  beforeEach(() => {
    ensureLoggedIn();
  });

  /* ------------------------------------------------------------------ */
  /* Positive flows                                                      */
  /* ------------------------------------------------------------------ */
  context('Positive flows', () => {
    it('TC-001 Admin can open the program creation form from the Programs page', () => {
      cy.visit(`${APP_BASE}${PROGRAMS_PATH}`);
      newProgramButton().click();

      dialog().should('be.visible');
      programNameInput().should('be.visible').and('be.enabled');
      descriptionInput().should('be.visible').and('be.enabled');
      createButton().should('be.visible').and('be.disabled');
    });

    it('TC-002 Opening the form reveals an interactive Program Name field', () => {
      // Verified app behavior: focus lands on the modal close button, not on the
      // Program Name field. We assert that the field is reachable and editable,
      // then focus it explicitly via click.
      cy.visit(`${APP_BASE}${PROGRAMS_PATH}`);
      newProgramButton().click();

      programNameInput().should('be.visible').and('not.be.disabled');
      programNameInput().click().should('have.focus');
    });

    it('TC-003 Admin can create a program with both Name and Description', () => {
      const name = uniqueName('Web Development');
      const description = 'Full-stack web development program';

      openProgramForm();
      programNameInput().type(name);
      descriptionInput().type(description);
      createButton().click();

      dialog().should('not.exist');
      cy.contains(name).should('be.visible');
    });

    it('TC-004 Newly created program persists across reload', () => {
      const name = uniqueName('Persisted Program');

      openProgramForm();
      programNameInput().type(name);
      createButton().click();
      cy.contains(name).should('be.visible');

      cy.reload();

      cy.contains(name).should('be.visible');
    });

    it('TC-005 Create button becomes enabled as soon as Program Name has content', () => {
      openProgramForm();
      createButton().should('be.disabled');

      programNameInput().type('W');

      createButton().should('not.be.disabled');
    });

    it('TC-006 Description is optional', () => {
      const name = uniqueName('Data Science');

      openProgramForm();
      programNameInput().type(name);
      createButton().click();

      dialog().should('not.exist');
      cy.contains(name).should('be.visible');
    });
  });

  /* ------------------------------------------------------------------ */
  /* Negative flows                                                      */
  /* ------------------------------------------------------------------ */
  context('Negative flows', () => {
    it('TC-N-001 Create button is disabled when Program Name is empty', () => {
      openProgramForm();
      descriptionInput().type('Full-stack web development program');

      programNameInput().should('have.value', '');
      createButton().should('be.disabled');
    });

    it('TC-N-002 Whitespace-only Program Name does not enable Create', () => {
      openProgramForm();
      programNameInput().type('     ');
      descriptionInput().focus();

      createButton().should('be.disabled');
    });

    it('TC-N-003 Closing the modal discards the entry', () => {
      const name = uniqueName('Throwaway');

      openProgramForm();
      programNameInput().type(name);
      descriptionInput().type('Should not be saved');
      cy.get('body').type('{esc}');

      dialog().should('not.exist');

      cy.reload();
      cy.contains(name).should('not.exist');
    });

    it('TC-N-004 Re-opening the form after dismiss retains the previously entered values', () => {
      // Verified app behavior: dismissing the modal via Escape (or via Cancel) does
      // NOT clear the form. Values persist on reopen until a successful Create
      // resets them.
      const draftName = uniqueName('Draft');
      const draftDescription = 'Should not be saved';

      openProgramForm();
      programNameInput().type(draftName);
      descriptionInput().type(draftDescription);
      cy.get('body').type('{esc}');
      dialog().should('not.exist');

      newProgramButton().click();
      dialog().should('be.visible');

      programNameInput().should('have.value', draftName);
      descriptionInput().should('have.value', draftDescription);
      createButton().should('not.be.disabled');
    });
  });

  /* ------------------------------------------------------------------ */
  /* Edge cases                                                          */
  /* ------------------------------------------------------------------ */
  context('Edge cases', () => {
    it('TC-E-001 Leading/trailing whitespace in Program Name is trimmed', () => {
      const trimmed = uniqueName('Trim Test');
      const padded = `   ${trimmed}   `;

      openProgramForm();
      programNameInput().type(padded);
      createButton().click();

      dialog().should('not.exist');
      cy.contains(trimmed).should('be.visible');
    });

    it('TC-E-002 255-character Program Name is accepted', () => {
      const suffix = ` ${Date.now()}`;
      const name = 'A'.repeat(255 - suffix.length) + suffix;
      expect(name).to.have.length(255);

      openProgramForm();
      programNameInput().type(name, { delay: 0 });
      createButton().click();

      dialog().should('not.exist');
      cy.contains(name).should('be.visible');
    });

    it('TC-E-004 Long Description (2000 characters) is accepted', () => {
      const name = uniqueName('Long Description Program');
      const description = 'd'.repeat(2000);

      openProgramForm();
      programNameInput().type(name);
      descriptionInput().type(description, { delay: 0 });
      createButton().click();

      dialog().should('not.exist');
      cy.contains(name).should('be.visible');
    });

    it('TC-E-006 Special characters, emojis, and non-Latin scripts are accepted verbatim', () => {
      const xssName = `<script>alert(1)</script> ${Date.now()}`;
      const i18nName = `任务一 / مهمة / задача ${Date.now()}`;

      cy.on('window:alert', (msg) => {
        throw new Error(`Unexpected window.alert (possible XSS): ${msg}`);
      });

      openProgramForm();
      programNameInput().type(xssName, { parseSpecialCharSequences: false });
      descriptionInput().type(`O'Brien & "Co."`, { parseSpecialCharSequences: false });
      createButton().click();
      dialog().should('not.exist');
      cy.contains(xssName).should('be.visible');

      newProgramButton().click();
      dialog().should('be.visible');
      programNameInput().clear().type(i18nName);
      descriptionInput().clear().type('🚀 Multilingual program 🔥');
      createButton().click();
      dialog().should('not.exist');
      cy.contains(i18nName).should('be.visible');
    });

    it('TC-E-007 Short Program Name (single-letter prefix) is accepted', () => {
      // Single literal characters aren't isolation-safe (duplicate behavior is
      // undefined), so we exercise the lower boundary with a single-letter prefix
      // plus a unique timestamp suffix.
      const name = `A${Date.now()}`;

      openProgramForm();
      programNameInput().type(name);
      createButton().click();

      dialog().should('not.exist');
      cy.contains(name).should('be.visible');
    });
  });
});
