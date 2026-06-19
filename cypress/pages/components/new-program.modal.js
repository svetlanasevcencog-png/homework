class NewProgramModal {
  dialog(options) {
    return cy
      .get('[role="dialog"]', options)
      .filter(':has(h2:contains("New Program"))');
  }

  programNameInput() {
    return this.dialog().contains('label', 'Program Name').parent().find('input, textarea');
  }

  descriptionInput() {
    return this.dialog().contains('label', 'Description').parent().find('input, textarea');
  }

  totalProgramHoursInput() {
    return this.dialog().contains('label', 'Total Program Hours').parent().find('input, textarea');
  }

  defaultSessionHoursInput() {
    return this.dialog()
      .contains('label', 'Default Session Hours')
      .parent()
      .find('input, textarea');
  }

  defaultExamHoursInput() {
    return this.dialog()
      .contains('label', 'Default Exam Hours')
      .parent()
      .find('input, textarea');
  }

  targetAudienceInput() {
    return this.dialog().contains('label', 'Target Audience').parent().find('input, textarea');
  }

  focusAreasInput() {
    return this.dialog().contains('label', 'Focus Areas').parent().find('input, textarea');
  }

  showAiConfigButton() {
    return this.dialog().contains('button', 'Show AI Generation Config');
  }

  hideAiConfigButton() {
    return this.dialog().contains('button', 'Hide AI Generation Config');
  }

  expandAiGenerationConfig() {
    this.showAiConfigButton().click();
    this.hideAiConfigButton().should('be.visible');
  }

  collapseAiGenerationConfig() {
    this.hideAiConfigButton().click();
    this.showAiConfigButton().should('be.visible');
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
