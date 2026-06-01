class NewProgramModal {
  dialog() {
    return cy
      .get('[role="dialog"]')
      .filter(':has(h2:contains("New Program"))');
  }

  programNameInput() {
    return this.dialog().contains('label', 'Program Name').parent().find('input, textarea');
  }

  descriptionInput() {
    return this.dialog().contains('label', 'Description').parent().find('input, textarea');
  }

  cancelButton() {
    return this.dialog().contains('button', 'Cancel');
  }

  createButton() {
    return this.dialog()
      .find('button')
      .filter((_, el) => el.innerText.trim() === 'Create');
  }

  fillProgramName(name) {
    this.programNameInput().clear().type(name);
  }

  fillDescription(description) {
    this.descriptionInput().clear().type(description);
  }

  submit() {
    this.createButton().click();
  }

  create(name, description) {
    this.fillProgramName(name);
    if (description !== undefined) {
      this.fillDescription(description);
    }
    this.submit();
  }

  /** Modal may be hidden in DOM or removed after submit — accept either. */
  shouldBeClosed() {
    cy.get('body', { timeout: 15_000 }).should(($body) => {
      const $dialogs = $body
        .find('[role="dialog"]')
        .filter(
          (_, el) =>
            Cypress.$(el).find('h2').first().text().trim() === 'New Program',
        );
      if ($dialogs.length === 0) {
        return;
      }
      expect($dialogs.first()).not.to.be.visible;
    });
  }
}

module.exports = { NewProgramModal };
