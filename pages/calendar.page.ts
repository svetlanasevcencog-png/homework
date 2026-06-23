import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { AppNavigation } from './components/app-navigation';

export class CalendarPage extends BasePage {
  readonly heading: Locator;
  readonly navigation: AppNavigation;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Calendar', level: 2 });
    this.navigation = new AppNavigation(page);
  }

  async goto() {
    await this.page.goto(`${this.baseUrl}/calendar`);
  }
}
