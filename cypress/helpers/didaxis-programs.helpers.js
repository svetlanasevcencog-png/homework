const { LoginPage } = require('../pages/login.page');
const { ProgramsPage } = require('../pages/programs.page');

const EMAIL = () => Cypress.env('DIDAXIS_EMAIL');
const PASSWORD = () => Cypress.env('DIDAXIS_PASSWORD');

function requireCredentials() {
  if (!EMAIL() || !PASSWORD()) {
    throw new Error(
      'DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be defined in .env to run Didaxis Cypress tests.',
    );
  }
}

function uniqueName(prefix) {
  // Add a random segment so parallel/fast CI runs cannot collide on Date.now().
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix} ${suffix}` : suffix;
}

function ensureLoggedIn() {
  requireCredentials();
  const login = new LoginPage();
  cy.session(
    'didaxis-admin',
    () => login.login(EMAIL(), PASSWORD()),
    { cacheAcrossSpecs: true },
  );
}

function visitPrograms() {
  ensureLoggedIn();
  const programs = new ProgramsPage();
  programs.visit();
  return programs;
}

function openNewProgramForm() {
  const programs = visitPrograms();
  // The /programs page runs POST /api/auth/refresh + GET /api/programs on load;
  // under CI load this is slow. Wait until the page is interactive before
  // clicking so we don't click into a still-loading page.
  programs.newProgramButton().should('be.visible').and('not.be.disabled');
  programs.openNewProgram();
  // Mantine animates the modal content opacity 0 -> 1; give the open
  // transition headroom beyond the default 4s command timeout.
  programs.newProgramModal.dialog({ timeout: 10_000 }).should('be.visible');
  programs.newProgramModal.programNameInput().should('be.visible');
  return programs;
}

module.exports = {
  ensureLoggedIn,
  openNewProgramForm,
  uniqueName,
  visitPrograms,
};
