import type { Page } from '@playwright/test';
import { DIDAXIS_URL } from '../fixtures/auth.constants';

export abstract class BasePage {
  protected readonly baseUrl = DIDAXIS_URL;

  constructor(protected readonly page: Page) {}
}
