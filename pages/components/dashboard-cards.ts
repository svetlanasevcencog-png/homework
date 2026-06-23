import type { Locator, Page } from '@playwright/test';

/** Dashboard navigation blocks verified on test.didaxis.studio (DS-119). */
export const DASHBOARD_BLOCK_NAMES = [
  'Programs',
  'Calendar',
  'Validation',
  'AI Assist',
] as const;

export type DashboardBlockName = (typeof DASHBOARD_BLOCK_NAMES)[number];

const BLOCK_SUBTITLES: Record<DashboardBlockName, string> = {
  Programs: 'Manage academic programs',
  Calendar: 'Schedule & drag-drop',
  Validation: 'Check for conflicts',
  'AI Assist': 'AI-powered editing',
};

export class DashboardCards {
  readonly programs: Locator;
  readonly calendar: Locator;
  readonly validation: Locator;
  readonly aiAssist: Locator;

  constructor(private readonly page: Page) {
    this.programs = this.card('Programs');
    this.calendar = this.card('Calendar');
    this.validation = this.card('Validation');
    this.aiAssist = this.card('AI Assist');
  }

  card(name: DashboardBlockName): Locator {
    return this.page.getByText(BLOCK_SUBTITLES[name], { exact: true });
  }

  /** Title within a navigation block, scoped via that block's unique subtitle. */
  title(name: DashboardBlockName): Locator {
    return this.card(name).locator('..').getByText(name, { exact: true });
  }

  /** Block titles inside the dashboard card grid (excludes sidebar navigation). */
  titleInGrid(name: string): Locator {
    return this.grid.getByText(name, { exact: true });
  }

  async click(name: DashboardBlockName) {
    await this.card(name).click();
  }

  private get grid(): Locator {
    return this.page
      .getByText(BLOCK_SUBTITLES.Programs, { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"SimpleGrid")][1]');
  }
}
