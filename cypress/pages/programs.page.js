const { BasePage } = require('./base.page');
const { NewProgramModal } = require('./components/new-program.modal');

class ProgramsPage extends BasePage {
  constructor() {
    super();
    this.newProgramModal = new NewProgramModal();
  }

  visit() {
    cy.visit(`${this.baseUrl}/programs`);
  }

  newProgramButton() {
    return cy.contains('button', '+ New Program');
  }

  programsTable() {
    return cy.get('[role="table"]');
  }

  programColumnHeader() {
    return cy.contains('[role="columnheader"]', 'Program');
  }

  createFirstProgramButton() {
    return cy.contains('button', 'Create Program');
  }

  openNewProgram() {
    this.newProgramButton().click();
  }

  programInList(programName) {
    return cy.contains(programName, { exact: true });
  }
}

module.exports = { ProgramsPage };
