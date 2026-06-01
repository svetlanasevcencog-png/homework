const { BasePage } = require('./base.page');

class LoginPage extends BasePage {
  emailInput() {
    return cy.contains('label', 'Email').parent().find('input');
  }

  passwordInput() {
    return cy.contains('label', 'Password').parent().find('input');
  }

  signInButton() {
    return cy.contains('button', 'Sign In');
  }

  visit() {
    cy.visit(`${this.baseUrl}/login`);
  }

  login(email, password) {
    this.visit();
    this.emailInput().type(email);
    this.passwordInput().type(password, { log: false });
    this.signInButton().click();
    cy.location('pathname', { timeout: 30000 }).should('not.eq', '/login');
  }
}

module.exports = { LoginPage };
