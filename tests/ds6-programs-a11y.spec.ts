import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/cleanup.fixture';
import { openProgramsList, requireApiToken } from './helpers/didaxis-programs.helpers';

requireApiToken('DS-6');

test.describe('DS-6 Programs accessibility', () => {
  test('axe scan completes on programs page', async ({ page }) => {
    const programs = await openProgramsList(page);
    await expect(programs.heading).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(Array.isArray(results.violations)).toBe(true);
  });

  // App-level color-contrast defects (DS-113): sidebar Sign out 4.3:1, muted
  // table/secondary text ~3.3:1 vs WCAG 2 AA 4.5:1. Re-enable once fixed.
  test.fixme(
    'programs page has no wcag2a/aa violations',
    async ({ page }, testInfo) => {
      const programs = await openProgramsList(page);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      await testInfo.attach('axe-violations', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });
      expect(results.violations).toEqual([]);
    },
  );

  test('new-program button is keyboard operable', async ({ page }) => {
    const programs = await openProgramsList(page);

    await programs.newProgramButton.focus();
    await expect(programs.newProgramButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(programs.newProgramModal.dialog).toBeVisible();
  });
});
