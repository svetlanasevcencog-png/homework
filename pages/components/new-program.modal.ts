import type { Locator, Page } from '@playwright/test';

export class NewProgramModal {
  readonly dialog: Locator;
  readonly programNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly cancelButton: Locator;
  readonly createButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New Program' });
    this.programNameInput = this.dialog.getByLabel('Program Name');
    this.descriptionInput = this.dialog.getByLabel('Description');
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.createButton = this.dialog.getByRole('button', {
      name: 'Create',
      exact: true,
    });
  }

  async fillProgramName(name: string) {
    await this.programNameInput.fill(name);
  }

  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async submit() {
    await this.createButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async create(name: string, description?: string) {
    await this.fillProgramName(name);
    if (description !== undefined) {
      await this.fillDescription(description);
    }
    await this.submit();
  }
}
