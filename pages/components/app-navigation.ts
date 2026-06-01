import type { Locator, Page } from '@playwright/test';

export class AppNavigation {
  readonly dashboardButton: Locator;
  readonly programsButton: Locator;
  readonly calendarButton: Locator;
  readonly validationButton: Locator;
  readonly schedulerButton: Locator;
  readonly exportButton: Locator;
  readonly settingsButton: Locator;
  readonly signOutButton: Locator;

  constructor(private readonly page: Page) {
    this.dashboardButton = page.getByRole('button', { name: '📊 Dashboard' });
    this.programsButton = page.getByRole('button', { name: '🎓 Programs' });
    this.calendarButton = page.getByRole('button', { name: '📅 Calendar' });
    this.validationButton = page.getByRole('button', { name: '✅ Validation' });
    this.schedulerButton = page.getByRole('button', { name: '⚡ Scheduler' });
    this.exportButton = page.getByRole('button', { name: '📤 Export' });
    this.settingsButton = page.getByRole('button', { name: '⚙️ Settings' });
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
  }

  async goToDashboard() {
    await this.dashboardButton.click();
  }

  async goToPrograms() {
    await this.programsButton.click();
  }

  async signOut() {
    await this.signOutButton.click();
  }
}
