---
name: pom-conventions
description: Page Object Model conventions for Playwright tests in this project. Apply whenever generating, refactoring, or reviewing any Playwright test that interacts with the Didaxis UI — even if the user doesn't say "POM". Tests should never contain inline locators.
---

# Page Object Model Conventions

All UI interactions go through Page Objects in `pages/`. Tests describe
intent; POMs handle mechanics.

## Layering

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Page objects** | `pages/` | Locators + single UI actions. **No `expect()`.** |
| **Test helpers** | `tests/helpers/didaxis-programs.helpers.ts` | Multi-step flows reused across DS specs (open form, create program, delete with confirm). May use `expect()` for synchronization waits only. |
| **Specs** | `tests/ds*.spec.ts` | Scenario structure and business assertions. **No inline locators** (`getByRole`, `getByLabel`, `locator`, etc.). |

Reuse existing helpers before adding new ones. Extend POMs when a locator is missing; add a helper when three or more specs share the same flow.

`createProgram(page, request, trackProgram, name, { description?, refreshList? })` — pass options object, not positional description + options.

## Steps

1. One Page Object class per page or distinct component.
   Examples: `LoginPage`, `ProgramsPage`, `NewProgramModal`.

2. Define locators as `readonly` properties in the constructor,
   using `getByRole`, `getByLabel`, or `getByText` — never CSS selectors.

3. Provide methods for user actions: `goto`, `openNewProgram`, `fillProgramName`, `submit`.
   Methods perform actions; they do not assert.

4. **No assertions inside Page Objects.** All scenario `expect(...)` calls
   live in spec files (helpers may assert only for flow synchronization).

5. Compose POMs when a page contains distinct components — e.g.
   `ProgramsPage` holds `NewProgramModal`, `EditProgramModal`, and `AppNavigation`.

6. Import POMs at the top of each spec; instantiate with `new XxxPage(page)`.

## File layout

```
pages/
  base.page.ts              # DIDAXIS_URL from fixtures/auth.constants
  login.page.ts
  dashboard.page.ts
  programs.page.ts
  components/
    app-navigation.ts
    new-program.modal.ts
    edit-program.modal.ts

tests/helpers/
  didaxis-programs.helpers.ts   # openProgramsList, openNewProgramForm, submitNewProgram, createProgram, openEditForProgram, clickDeleteWithDialog, trackProgramByName, uniqueName
```

`BasePage` centralizes `baseUrl` from `fixtures/auth.constants` — do not
scatter `process.env.DIDAXIS_URL` across POM `goto()` methods.

## Didaxis page inventory

Verified via Playwright MCP against `https://test.didaxis.studio`.

| Route | Page Object | Notes |
|-------|-------------|-------|
| `/login` | `LoginPage` | Unauthenticated entry; used by `tests/auth.setup.ts` and guest tests only |
| `/` | `DashboardPage` | Post-login landing; heading "Dashboard" |
| `/programs` | `ProgramsPage` | Main CRUD surface for DS-1 through DS-5 |

Shared chrome on every authenticated route:

| Component | Page Object | Locators |
|-----------|-------------|----------|
| Sidebar nav | `AppNavigation` | `getByRole('button', { name: '📊 Dashboard' })`, `… '🎓 Programs'`, `… '📅 Calendar'`, etc. |
| User menu | `AppNavigation` | `getByRole('button', { name: 'Sign out' })` |

Modals (compose inside `ProgramsPage`):

| Dialog | Page Object | Key locators |
|--------|-------------|--------------|
| `New Program` | `NewProgramModal` | `dialog`, `getByLabel('Program Name')`, `getByLabel('Description')`, `Cancel`, `Create` (exact) |
| `Edit Program` | `EditProgramModal` | Same fields; submit is `Save` (exact) |

`ProgramsPage` list surface:

| Member | Purpose |
|--------|---------|
| `newProgramButton` | `getByRole('button', { name: '+ New Program' })` — use full accessible name |
| `programsTable` | `getByRole('table')` |
| `programColumnHeader` | `getByRole('columnheader', { name: 'Program' })` |
| `createFirstProgramButton` | Empty-state CTA: `'Create Program'` |
| `emptyStateMessage` | Regex for "no programs" / "create your first program" |
| `programInList(name)` | `getByText(name, { exact: true })` |
| `programRow(name)` | `getByRole('row')` filtered by program name |
| `programDataCell(row)` | First `cell` in a row (name + description) |
| `editButtonFor` / `deleteButtonFor` | `Edit ${name}` / `Delete ${name}` |
| `openEditFor` / `openDeleteFor` | Click row action buttons |

Authenticated tests rely on `storageState` from `tests/auth.setup.ts`.
Do **not** call `LoginPage.login()` in every test — only in setup or
explicit unauthenticated scenarios.

## Locator rules (Didaxis-specific)

1. **Scope modal locators to the dialog** to avoid collisions with the
   page behind it:
   `this.dialog.getByRole('button', { name: 'Create', exact: true })`

2. **`Create` vs `Create Program`** — the empty-state button is named
   "Create Program"; the modal submit is "Create". Always use
   `{ exact: true }` on modal `Create`.

3. **Edit/delete rows by accessible name**, not emoji or `nth()`:
   `getByRole('button', { name: \`Edit ${programName}\` })`
   Never `locator('tbody tr').filter(...)` + `button.nth(1)` for delete.

4. **Program name in list** — use `programInList(name)` or `programRow(name)`;
   prefer role-based row lookup over CSS table selectors.

5. **URLs** — inherit from `BasePage` / `fixtures/auth.constants` (reads
   `process.env.DIDAXIS_URL`, default in `fixtures/didaxis-url.js`); never
   hardcode host strings inside POMs or specs.

## What stays in specs (not POMs)

These are test-runtime concerns, not page structure:

- `page.on('dialog', …)` for native `window.confirm` on delete
- `page.keyboard.press('Escape')` to dismiss modals
- `page.reload()` for persistence checks
- `page.on('dialog')` for XSS alert detection

Use `clickDeleteWithDialog()` from helpers for delete confirm flows.

## Known demo guardrails

Do not attempt to fix or work around these intentional demo-app behaviors.
Document them in test titles or comments; use `test.fixme` when the test
describes desired behavior that is not yet implemented.

| Issue | Jira | Affected tests | Notes |
|-------|------|----------------|-------|
| Duplicate program names allowed on create | SS-25 | DS-3 TC-005, TC-008, TC-009, TC-015; DS-5 TC-015 | Assert current behavior (`toHaveCount(2)`), do not expect validation errors |
| Duplicate names allowed on rename | SS-25 | DS-2 TC-017 | Documents live behavior; not marked `test.fail` |
| Create double-click submits twice | SS-26 | DS-1 TC-E-009, DS-3 TC-018 | Use `test.fixme` until fixed |

## Output

- New locators → `pages/` (extend existing classes when possible)
- Shared multi-step flows → `tests/helpers/didaxis-programs.helpers.ts`
- Assertions and scenario logic → `tests/ds*.spec.ts`

## Example

```typescript
// tests/ds1-create-program.spec.ts
import { test, expect } from '../fixtures/cleanup.fixture';
import {
  openNewProgramForm,
  requireApiToken,
  uniqueName,
} from './helpers/didaxis-programs.helpers';

requireApiToken('DS-1');

test('TC-001 Admin can open the program creation form', async ({ page }) => {
  const programs = await openNewProgramForm(page);
  const modal = programs.newProgramModal;

  await expect(modal.programNameInput).toBeVisible();
  await expect(modal.programNameInput).toBeEnabled();
  await expect(modal.descriptionInput).toBeVisible();
  await expect(modal.createButton).toBeVisible();
  await expect(modal.createButton).toBeDisabled();
});

test('TC-003 Admin can create a program', async ({ page, request, trackProgram }) => {
  const name = uniqueName('Web Development');
  const programs = await openNewProgramForm(page);

  await programs.newProgramModal.create(name, 'Full-stack web development program');
  await expect(programs.newProgramModal.programNameInput).toBeHidden();
  await expect(programs.programInList(name)).toBeVisible();
  // trackProgramByName(request, trackProgram, name) when cleanup is needed
});
```

See `pages/programs.page.ts`, `pages/components/new-program.modal.ts`, and
`tests/helpers/didaxis-programs.helpers.ts` for the canonical implementation.
