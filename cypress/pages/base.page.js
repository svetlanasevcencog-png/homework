const { DEFAULT_DIDAXIS_URL } = require('../../fixtures/didaxis-url');

class BasePage {
  constructor() {
    this.baseUrl = Cypress.env('DIDAXIS_URL') || DEFAULT_DIDAXIS_URL;
  }
}

module.exports = { BasePage };
