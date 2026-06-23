import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { AppNavigation } from './components/app-navigation';
import { DashboardCards } from './components/dashboard-cards';

export class DashboardPage extends BasePage {
  readonly heading: Locator;
  readonly welcomeText: Locator;
  readonly navigation: AppNavigation;
  readonly cards: DashboardCards;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard', level: 2 });
    this.welcomeText = page.getByText('Welcome to Didaxis Studio');
    this.navigation = new AppNavigation(page);
    this.cards = new DashboardCards(page);
  }

  async goto() {
    await this.page.goto(`${this.baseUrl}/`);
  }

  async reload() {
    await this.page.reload();
  }
}
