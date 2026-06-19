import type { Locator, Page } from '@playwright/test';

export class NewProgramModal {
  readonly dialog: Locator;
  readonly programNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly totalProgramHoursInput: Locator;
  readonly defaultSessionHoursInput: Locator;
  readonly defaultExamHoursInput: Locator;
  readonly targetAudienceInput: Locator;
  readonly focusAreasInput: Locator;
  readonly showAiConfigButton: Locator;
  readonly hideAiConfigButton: Locator;
  readonly aiConfigRequiredHint: Locator;
  readonly syncAsyncRatioLabel: Locator;
  readonly cancelButton: Locator;
  readonly createButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New Program' });
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
    this.hideAiConfigButton = this.dialog.getByRole('button', {
      name: /Hide AI Generation Config/i,
    });
    this.aiConfigRequiredHint = this.dialog.getByText(
      'Required for AI curriculum generation',
    );
    this.syncAsyncRatioLabel = this.dialog.getByText(
      'Sync/Async Ratio: 70% sync / 30% async',
    );
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

  async expandAiGenerationConfig() {
    await this.showAiConfigButton.click();
    await this.hideAiConfigButton.waitFor({ state: 'visible' });
  }

  async collapseAiGenerationConfig() {
    await this.hideAiConfigButton.click();
    await this.showAiConfigButton.waitFor({ state: 'visible' });
  }

  async create(name: string, description?: string) {
    await this.fillProgramName(name);
    if (description !== undefined) {
      await this.fillDescription(description);
    }
    await this.submit();
  }
}
