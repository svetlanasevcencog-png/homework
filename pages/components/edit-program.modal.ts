import type { Locator, Page } from '@playwright/test';

export class EditProgramModal {
  readonly dialog: Locator;
  readonly programNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly totalProgramHoursInput: Locator;
  readonly defaultSessionHoursInput: Locator;
  readonly defaultExamHoursInput: Locator;
  readonly targetAudienceInput: Locator;
  readonly focusAreasInput: Locator;
  readonly showAiConfigButton: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Edit Program' });
    this.programNameInput = this.dialog.getByLabel('Program Name');
    this.descriptionInput = this.dialog.getByLabel('Description');
    this.totalProgramHoursInput = this.dialog.getByLabel('Total Program Hours');
    this.defaultSessionHoursInput = this.dialog.getByLabel('Default Session Hours');
    this.defaultExamHoursInput = this.dialog.getByLabel('Default Exam Hours');
    this.targetAudienceInput = this.dialog.getByLabel('Target Audience');
    this.focusAreasInput = this.dialog.getByLabel('Focus Areas');
    this.showAiConfigButton = this.dialog.getByRole('button', {
      name: /Show AI Generation Config/i,
    });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.saveButton = this.dialog.getByRole('button', { name: 'Save', exact: true });
  }

  async fillProgramName(name: string) {
    await this.programNameInput.fill(name);
  }

  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async submit() {
    await this.saveButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
