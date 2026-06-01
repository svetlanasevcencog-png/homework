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
  return `${prefix} ${Date.now()}`;
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
  programs.openNewProgram();
  programs.newProgramModal.dialog().should('be.visible');
  programs.newProgramModal.programNameInput().should('be.visible');
  return programs;
}

module.exports = {
  ensureLoggedIn,
  openNewProgramForm,
  uniqueName,
  visitPrograms,
};
