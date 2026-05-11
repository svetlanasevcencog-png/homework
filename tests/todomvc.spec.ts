import { test, expect, Page, Locator } from '@playwright/test';

const APP_URL = 'https://demo.playwright.dev/todomvc/#/';

const ITEMS_4 = ['Buy milk', 'Walk the dog', 'Write test plan', 'Submit homework'] as const;

async function addTodo(page: Page, text: string) {
  const input = page.getByPlaceholder('What needs to be done?');
  await input.fill(text);
  await input.press('Enter');
}

async function addTodos(page: Page, items: readonly string[]) {
  for (const item of items) {
    await addTodo(page, item);
  }
}

function todoItems(page: Page): Locator {
  return page.locator('.todo-list li');
}

function todoByText(page: Page, text: string): Locator {
  return page.locator('.todo-list li').filter({ hasText: text });
}

test.beforeEach(async ({ page }) => {
  await page.goto(APP_URL);
});

/* ------------------------------------------------------------------ */
/* Positive flows                                                      */
/* ------------------------------------------------------------------ */
test.describe('Positive flows', () => {
  test('TC-001 New list shows empty state with no main/footer sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'todos' })).toBeVisible();

    const input = page.getByPlaceholder('What needs to be done?');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    await expect(page.locator('.main')).toHaveCount(0);
    await expect(page.locator('.footer')).toHaveCount(0);
  });

  test('TC-002 User can create a list by adding four items', async ({ page }) => {
    await addTodos(page, ITEMS_4);

    await expect(todoItems(page)).toHaveCount(4);
    await expect(page.locator('.todo-list li label')).toHaveText([...ITEMS_4]);

    for (const item of ITEMS_4) {
      await expect(todoByText(page, item).locator('.toggle')).not.toBeChecked();
    }

    await expect(page.locator('.todo-count')).toHaveText('4 items left');
  });

  test('TC-003 Input is cleared after each submission', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await addTodo(page, 'Task A');

    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
  });

  test('TC-004 Marking an item as completed updates its state', async ({ page }) => {
    await addTodos(page, ITEMS_4);

    const row = todoByText(page, 'Walk the dog');
    await row.locator('.toggle').check();

    await expect(row).toHaveClass(/completed/);
    await expect(row.locator('.toggle')).toBeChecked();
    await expect(page.locator('.todo-count')).toHaveText('3 items left');
    await expect(page.locator('.clear-completed')).toBeVisible();
  });

  test('TC-005 Unchecking a completed item returns it to active state', async ({ page }) => {
    await addTodos(page, ITEMS_4);
    const row = todoByText(page, 'Walk the dog');
    await row.locator('.toggle').check();
    await expect(row).toHaveClass(/completed/);

    await row.locator('.toggle').uncheck();

    await expect(row).not.toHaveClass(/completed/);
    await expect(page.locator('.todo-count')).toHaveText('4 items left');
    await expect(page.locator('.clear-completed')).toHaveCount(0);
  });

  test('TC-006 Removing an item via the destroy button removes only that item', async ({ page }) => {
    await addTodos(page, ITEMS_4);

    const row = todoByText(page, 'Write test plan');
    await row.hover();
    await row.locator('.destroy').click();

    await expect(todoItems(page)).toHaveCount(3);
    await expect(page.locator('.todo-list li label')).toHaveText([
      'Buy milk',
      'Walk the dog',
      'Submit homework',
    ]);
    await expect(page.locator('.todo-count')).toHaveText('3 items left');
  });

  test('TC-007 Removing the last remaining item hides main and footer', async ({ page }) => {
    await addTodo(page, 'Solo task');
    const row = todoByText(page, 'Solo task');
    await row.hover();
    await row.locator('.destroy').click();

    await expect(todoItems(page)).toHaveCount(0);
    await expect(page.locator('.main')).toHaveCount(0);
    await expect(page.locator('.footer')).toHaveCount(0);
  });

  test('TC-008 Items persist across page reloads', async ({ page }) => {
    await addTodos(page, ITEMS_4);
    await todoByText(page, 'Walk the dog').locator('.toggle').check();

    await page.reload();

    await expect(todoItems(page)).toHaveCount(4);
    await expect(page.locator('.todo-list li label')).toHaveText([...ITEMS_4]);
    await expect(todoByText(page, 'Walk the dog')).toHaveClass(/completed/);
    await expect(page.locator('.todo-count')).toHaveText('3 items left');
  });

  test('TC-009 Filtering shows only matching items', async ({ page }) => {
    await addTodos(page, ITEMS_4);
    await todoByText(page, 'Walk the dog').locator('.toggle').check();
    await todoByText(page, 'Submit homework').locator('.toggle').check();

    await page.getByRole('link', { name: 'Active' }).click();
    await expect(page).toHaveURL(/#\/active$/);
    await expect(page.locator('.todo-list li label')).toHaveText(['Buy milk', 'Write test plan']);

    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(page).toHaveURL(/#\/completed$/);
    await expect(page.locator('.todo-list li label')).toHaveText([
      'Walk the dog',
      'Submit homework',
    ]);

    await page.getByRole('link', { name: 'All' }).click();
    await expect(page).toHaveURL(/#\/$/);
    await expect(page.locator('.todo-list li label')).toHaveText([...ITEMS_4]);
  });

  test('TC-010 Clear completed removes only completed items', async ({ page }) => {
    await addTodos(page, ITEMS_4);
    await todoByText(page, 'Walk the dog').locator('.toggle').check();
    await todoByText(page, 'Submit homework').locator('.toggle').check();

    await page.locator('.clear-completed').click();

    await expect(todoItems(page)).toHaveCount(2);
    await expect(page.locator('.todo-list li label')).toHaveText(['Buy milk', 'Write test plan']);
    await expect(page.locator('.todo-count')).toHaveText('2 items left');
    await expect(page.locator('.clear-completed')).toHaveCount(0);
  });

  test('TC-011 Toggle-all marks every item as completed; toggling again clears them', async ({
    page,
  }) => {
    await addTodos(page, ITEMS_4);

    const toggleAll = page.locator('.toggle-all');
    await toggleAll.check();

    for (const item of ITEMS_4) {
      await expect(todoByText(page, item)).toHaveClass(/completed/);
    }
    await expect(page.locator('.todo-count')).toHaveText('0 items left');
    await expect(page.locator('.clear-completed')).toBeVisible();

    await toggleAll.uncheck();
    for (const item of ITEMS_4) {
      await expect(todoByText(page, item)).not.toHaveClass(/completed/);
    }
    await expect(page.locator('.todo-count')).toHaveText('4 items left');
  });

  test('TC-012 Double-click enables inline editing and Enter saves changes', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    const row = todoItems(page).first();

    await row.locator('label').dblclick();
    await expect(row).toHaveClass(/editing/);

    const editInput = row.locator('.edit');
    await expect(editInput).toBeFocused();
    await editInput.fill('Buy oat milk');
    await editInput.press('Enter');

    await expect(row).not.toHaveClass(/editing/);
    await expect(row.locator('label')).toHaveText('Buy oat milk');
    await expect(todoItems(page)).toHaveCount(1);
  });
});

/* ------------------------------------------------------------------ */
/* Negative flows                                                      */
/* ------------------------------------------------------------------ */
test.describe('Negative flows', () => {
  test('TC-N-001 Empty submission is rejected', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.focus();
    await input.press('Enter');

    await expect(todoItems(page)).toHaveCount(0);
    await expect(page.locator('.main')).toHaveCount(0);
    await expect(page.locator('.footer')).toHaveCount(0);
  });

  test('TC-N-002 Whitespace-only submission is rejected', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('   ');
    await input.press('Enter');

    await expect(todoItems(page)).toHaveCount(0);
    await expect(page.locator('.main')).toHaveCount(0);
    await expect(page.locator('.footer')).toHaveCount(0);
  });

  test('TC-N-003 Leading/trailing whitespace is trimmed on add', async ({ page }) => {
    await addTodo(page, '   Buy milk   ');

    await expect(todoItems(page)).toHaveCount(1);
    await expect(page.locator('.todo-list li label')).toHaveText('Buy milk');
  });

  test('TC-N-004 Editing to an empty value deletes the item', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    const row = todoByText(page, 'Buy milk');

    await row.locator('label').dblclick();
    const editInput = row.locator('.edit');
    await editInput.fill('');
    await editInput.press('Enter');

    await expect(todoItems(page)).toHaveCount(0);
  });

  test('TC-N-005 Escape during edit cancels changes', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    const row = todoByText(page, 'Buy milk');

    await row.locator('label').dblclick();
    const editInput = row.locator('.edit');
    await editInput.fill('XYZ');
    await editInput.press('Escape');

    await expect(row).not.toHaveClass(/editing/);
    await expect(row.locator('label')).toHaveText('Buy milk');
  });

  test('TC-N-006 Destroy button is not visible without hover/focus', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await page.mouse.move(0, 0);

    const destroy = todoByText(page, 'Buy milk').locator('.destroy');
    await expect(destroy).toBeHidden();
  });

  test('TC-N-007 Counter never goes negative or shows when list is empty', async ({ page }) => {
    await addTodo(page, 'Solo task');
    const row = todoByText(page, 'Solo task');
    await row.locator('.toggle').check();
    await page.locator('.clear-completed').click();

    await expect(page.locator('.footer')).toHaveCount(0);
    await expect(page.locator('.todo-count')).toHaveCount(0);
  });

  test('TC-N-008 Clear completed is not rendered when no items are completed', async ({
    page,
  }) => {
    await addTodos(page, ITEMS_4);
    await expect(page.locator('.clear-completed')).toHaveCount(0);
  });
});

/* ------------------------------------------------------------------ */
/* Edge cases                                                          */
/* ------------------------------------------------------------------ */
test.describe('Edge cases', () => {
  test('TC-E-001 Special characters and emojis are accepted verbatim', async ({ page }) => {
    const items = [
      '<script>alert(1)</script>',
      `O'Brien & "Co."`,
      '任务一 / مهمة / задача',
      '🚀🔥✅ celebrate',
    ];

    page.on('dialog', async (d) => {
      await d.dismiss();
      throw new Error('Unexpected dialog – possible XSS execution');
    });

    await addTodos(page, items);

    await expect(todoItems(page)).toHaveCount(4);
    await expect(page.locator('.todo-list li label')).toHaveText(items);
    await expect(page.locator('.todo-count')).toHaveText('4 items left');

    await expect(page.locator('.todo-list script')).toHaveCount(0);
  });

  test('TC-E-002 Duplicate titles are allowed and treated as distinct items', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Buy milk');

    await expect(todoItems(page)).toHaveCount(2);

    const rows = page.locator('.todo-list li');
    await rows.nth(0).locator('.toggle').check();

    await expect(rows.nth(0)).toHaveClass(/completed/);
    await expect(rows.nth(1)).not.toHaveClass(/completed/);
    await expect(page.locator('.todo-count')).toHaveText('1 item left');
  });

  test('TC-E-003 Long title (500 characters) is accepted and rendered', async ({ page }) => {
    const longText = 'a'.repeat(500);
    await addTodo(page, longText);

    await expect(todoItems(page)).toHaveCount(1);
    await expect(page.locator('.todo-list li label')).toHaveText(longText);
  });

  test('TC-E-004 Singular/plural in counter', async ({ page }) => {
    await addTodo(page, 'One');
    await expect(page.locator('.todo-count')).toHaveText('1 item left');

    await addTodo(page, 'Two');
    await expect(page.locator('.todo-count')).toHaveText('2 items left');
  });

  test('TC-E-005 Filter selection persists during adds within the same session', async ({
    page,
  }) => {
    await addTodos(page, ['Active 1', 'Active 2']);
    await addTodo(page, 'Completed 1');
    await todoByText(page, 'Completed 1').locator('.toggle').check();

    await page.getByRole('link', { name: 'Active' }).click();
    await expect(page).toHaveURL(/#\/active$/);

    await addTodo(page, 'New task');

    await expect(page).toHaveURL(/#\/active$/);
    await expect(page.getByRole('link', { name: 'Active' })).toHaveClass(/selected/);
    await expect(page.locator('.todo-list li label')).toHaveText([
      'Active 1',
      'Active 2',
      'New task',
    ]);
  });

  test('TC-E-006 Reload preserves selected filter via URL hash', async ({ page }) => {
    await addTodo(page, 'Task A');
    await todoByText(page, 'Task A').locator('.toggle').check();

    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(page).toHaveURL(/#\/completed$/);

    await page.reload();

    await expect(page).toHaveURL(/#\/completed$/);
    await expect(page.getByRole('link', { name: 'Completed' })).toHaveClass(/selected/);
    await expect(page.locator('.todo-list li label')).toHaveText(['Task A']);
  });

  test('TC-E-007 Toggle-all chevron reflects mixed state correctly', async ({ page }) => {
    await addTodos(page, ITEMS_4);
    await todoByText(page, 'Buy milk').locator('.toggle').check();
    await todoByText(page, 'Walk the dog').locator('.toggle').check();

    const toggleAll = page.locator('.toggle-all');
    await expect(toggleAll).not.toBeChecked();

    await toggleAll.check();
    for (const item of ITEMS_4) {
      await expect(todoByText(page, item)).toHaveClass(/completed/);
    }
    await expect(toggleAll).toBeChecked();

    await toggleAll.uncheck();
    for (const item of ITEMS_4) {
      await expect(todoByText(page, item)).not.toHaveClass(/completed/);
    }
    await expect(toggleAll).not.toBeChecked();
  });

  test('TC-E-008 Editing trims whitespace; pure-whitespace edit deletes item', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    const row = todoByText(page, 'Buy milk');

    await row.locator('label').dblclick();
    await row.locator('.edit').fill('   Buy bread   ');
    await row.locator('.edit').press('Enter');
    await expect(page.locator('.todo-list li label')).toHaveText('Buy bread');

    const renamed = todoByText(page, 'Buy bread');
    await renamed.locator('label').dblclick();
    await renamed.locator('.edit').fill('   ');
    await renamed.locator('.edit').press('Enter');

    await expect(todoItems(page)).toHaveCount(0);
  });

  test('TC-E-009 Blur commits edit (same semantics as Enter)', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    const row = todoItems(page).first();

    await row.locator('label').dblclick();
    await row.locator('.edit').fill('Buy oat milk');
    await page.getByRole('heading', { name: 'todos' }).click();

    await expect(row).not.toHaveClass(/editing/);
    await expect(row.locator('label')).toHaveText('Buy oat milk');
    await expect(todoItems(page)).toHaveCount(1);
  });
});
