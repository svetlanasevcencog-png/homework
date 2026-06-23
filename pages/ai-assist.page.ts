import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { AppNavigation } from './components/app-navigation';

export class AiAssistPage extends BasePage {
  readonly heading: Locator;
  readonly navigation: AppNavigation;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'AI Assist', level: 2 });
    this.navigation = new AppNavigation(page);
  }

  async goto() {
    await this.page.goto(`${this.baseUrl}/cli`);
  }
}
