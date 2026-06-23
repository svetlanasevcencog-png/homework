import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { AppNavigation } from './components/app-navigation';
import { EditProgramModal } from './components/edit-program.modal';
import { NewProgramModal } from './components/new-program.modal';

export class ProgramsPage extends BasePage {
  readonly heading: Locator;
  readonly programsTable: Locator;
  readonly newProgramButton: Locator;
  readonly programColumnHeader: Locator;
  readonly tableColumnHeaders: Locator;
  readonly actionsColumnHeader: Locator;
  readonly createFirstProgramButton: Locator;
  readonly emptyStateMessage: Locator;
  readonly navigation: AppNavigation;
  readonly newProgramModal: NewProgramModal;
  readonly editProgramModal: EditProgramModal;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Programs', level: 2 });
    this.programsTable = page.getByRole('table');
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.programColumnHeader = page.getByRole('columnheader', {
      name: 'Program',
    });
    this.tableColumnHeaders = page.getByRole('columnheader');
    this.actionsColumnHeader = page.getByRole('columnheader').nth(1);
    this.createFirstProgramButton = page.getByRole('button', {
      name: 'Create Program',
    });
    this.emptyStateMessage = page.getByText(
      /no programs have been created|create your first program/i,
    );
    this.navigation = new AppNavigation(page);
    this.newProgramModal = new NewProgramModal(page);
    this.editProgramModal = new EditProgramModal(page);
  }

  async goto() {
    await this.page.goto(`${this.baseUrl}/programs`);
  }

  async openNewProgram() {
    await this.newProgramButton.click();
  }

  programInList(programName: string) {
    return this.page.getByText(programName, { exact: true });
  }

  programRow(programName: string) {
    return this.page.getByRole('row').filter({
      has: this.programInList(programName),
    });
  }

  programDataCell(row: Locator) {
    return row.getByRole('cell').first();
  }

  editButtonFor(programName: string) {
    return this.page.getByRole('input', { name: `Edit ${programName}` });
  }

  deleteButtonFor(programName: string) {
    return this.page.getByRole('button', { name: `Delete ${programName}` });
  }

  /** Delete control scoped to a single row — required when duplicate names
   * make `deleteButtonFor(name)` match more than one button. */
  deleteButtonInRow(row: Locator) {
    return row.getByRole('button', { name: /^Delete / });
  }

  async openEditFor(programName: string) {
    await this.editButtonFor(programName).click();
  }

  async openDeleteFor(programName: string) {
    await this.deleteButtonFor(programName).click();
  }
}
