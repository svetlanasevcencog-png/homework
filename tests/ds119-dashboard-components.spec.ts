import { test, expect } from '../fixtures/cleanup.fixture';
import { AiAssistPage } from '../pages/ai-assist.page';
import { CalendarPage } from '../pages/calendar.page';
import { DashboardPage } from '../pages/dashboard.page';
import { ProgramsPage } from '../pages/programs.page';
import { ValidationPage } from '../pages/validation.page';
import {
  assertGuestRedirectedFromDashboard,
  expectDashboardBlocksVisible,
  openDashboard,
} from './helpers/didaxis-dashboard.helpers';

test.describe('DS-119 Dashboard displaying the right components', () => {
  test.describe('Happy paths', () => {
    test('Navigate to the Dashboard', { tag: '@smoke' }, async ({ page }) => {
      const dashboard = await openDashboard(page);

      await expect(dashboard.heading).toBeVisible();
      await expect(dashboard.welcomeText).toBeVisible();
      await expectDashboardBlocksVisible(dashboard);
    });

    test('Successfully navigate to Program Page', { tag: '@smoke' }, async ({ page }) => {
      const dashboard = await openDashboard(page);

      await dashboard.cards.click('Programs');

      await expect(page).toHaveURL(/\/programs$/);
      const programs = new ProgramsPage(page);
      await expect(programs.heading).toBeVisible();
    });

    test('Successfully navigate to Calendar Page', { tag: '@sanity' }, async ({ page }) => {
      const dashboard = await openDashboard(page);

      await dashboard.cards.click('Calendar');

      await expect(page).toHaveURL(/\/calendar$/);
      const calendar = new CalendarPage(page);
      await expect(calendar.heading).toBeVisible();
    });

    test('Successfully navigate to Validation Page', { tag: '@sanity' }, async ({ page }) => {
      const dashboard = await openDashboard(page);

      await dashboard.cards.click('Validation');

      await expect(page).toHaveURL(/\/validation$/);
      const validation = new ValidationPage(page);
      await expect(validation.heading).toBeVisible();
    });

    test('Successfully navigate to AI Assist Page', { tag: '@sanity' }, async ({ page }) => {
      const dashboard = await openDashboard(page);

      await dashboard.cards.click('AI Assist');

      await expect(page).toHaveURL(/\/cli$/);
      const aiAssist = new AiAssistPage(page);
      await expect(aiAssist.heading).toBeVisible();
    });
  });

  test.describe('Negative flows', () => {
    test('Dashboard does not show unrelated product blocks', { tag: '@regression' }, async ({ page }) => {
      const dashboard = await openDashboard(page);

      await expect(dashboard.cards.titleInGrid('Export')).toHaveCount(0);
      await expect(dashboard.cards.titleInGrid('Scheduler')).toHaveCount(0);
    });

    test('Guest user cannot access Dashboard blocks', { tag: '@regression' }, async ({ browser }) => {
      await assertGuestRedirectedFromDashboard(browser);
    });
  });

  test.describe('Edge cases', () => {
    test('Dashboard blocks remain visible after browser reload', { tag: '@regression' }, async ({ page }) => {
      const dashboard = await openDashboard(page);
      await expectDashboardBlocksVisible(dashboard);

      await dashboard.reload();
      await expect(dashboard.heading).toBeVisible();
      await expectDashboardBlocksVisible(dashboard);
    });

    test('Returning to Dashboard from Programs via sidebar', { tag: '@regression' }, async ({ page }) => {
      const programs = new ProgramsPage(page);
      await programs.goto();
      await expect(programs.heading).toBeVisible();

      await programs.navigation.goToDashboard();

      await expect(page).toHaveURL(/\/$/);
      const dashboard = new DashboardPage(page);
      await expect(dashboard.heading).toBeVisible();
      await expectDashboardBlocksVisible(dashboard);
    });

    // Blocked by DS-121 — cards are clickable divs without tabindex or button/link role.
    test.fixme(
      'Each dashboard card is keyboard-focusable and activatable',
      async ({ page }) => {
        const dashboard = await openDashboard(page);

        await dashboard.cards.programs.focus();
        await expect(dashboard.cards.programs).toBeFocused();
        await page.keyboard.press('Enter');

        await expect(page).toHaveURL(/\/programs$/);
        const programs = new ProgramsPage(page);
        await expect(programs.heading).toBeVisible();
      },
    );
  });
});
