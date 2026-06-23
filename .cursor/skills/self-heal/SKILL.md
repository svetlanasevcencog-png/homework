---
name: self-heal
description: >-
  Repairs Playwright locator drift in POMs after a UI change — re-discovers
  elements via the Playwright MCP a11y tree and patches role-based locators
  without touching spec assertions. Use when the build is red because a locator
  broke, fix the drifted selector, the test broke after a UI change, or heal the
  suite — ONLY after ci-failure-triage / triage classifies the failure as a
  test issue (drift). Never use for a real app bug; route those to
  jira-bug-reporter instead.
---

# Self-Heal (Locator Drift Repair)

Repairs **test issue / locator drift** only. One failing locator per run; every
heal ships as its own PR.

## Prerequisites

- A completed triage diagnosis from `ci-failure-triage` or the `triage` agent.
- Classification must be **test issue (drift)** — e.g. accessible name changed,
  role unchanged, app behaviour still correct.

If classification is **real app bug**, or triage is missing / inconclusive:
**STOP.** Route to `jira-bug-reporter` (or the `bug-reporter` agent). Do not
patch locators or weaken assertions.

## Steps

### 1. Require drift classification

Confirm the triage output explicitly classifies **test issue (drift)**.

- **Missing or inconclusive triage** → stop; run triage first.
- **Real app bug** → stop; hand off to `jira-bug-reporter`.
- **Drift confirmed** → proceed.

### 2. Find the failing locator and POM from the trace

From the Playwright error + trace (CI artifact or local `test-results/`):

1. Identify the failing test and the line that timed out or threw.
2. Follow the stack to the **POM method** (never start in the spec).
3. Record the **current locator** (role, name/options) and file path under
   `pages/`.

Specs must not contain inline locators — if the failure points at a spec line,
trace through the POM call it uses.

### 3. Re-discover the element via Playwright MCP a11y tree

Use the **playwright** MCP server (see `explore-and-generate` for setup).

1. Ensure auth: `playwright/.auth/user.json` via `playwright-mcp.config.json`;
   run `npx playwright test --project=setup` if missing.
2. `browser_navigate` to the route and UI state from the failing test.
3. `browser_snapshot` — source of truth. Find the control by **role + current
   accessible name** (same semantic intent as the old locator).
4. Do not use screenshots or CSS to guess. Prefer `getByRole` → `getByLabel` →
   `getByText` per `pom-conventions`.

If the element is absent from the a11y tree and the app visibly broke, **stop**
— this is not drift; re-classify and route to bug-reporter.

### 4. Patch the POM — minimal role-based diff

Edit **only** the locator in the POM constructor or the specific readonly
property. Follow `pom-conventions`:

- Use `getByRole`, `getByLabel`, or `getByText` — never CSS/XPath.
- Change the minimum needed (usually the accessible `name` string or label).
- **Never edit spec assertions** to make a red run green.
- **Never edit spec locators** — specs have none.

Example:

```tsx
// before
this.saveButton = page.getByRole('button', { name: 'Save Program' });
// after (accessible name drifted)
this.saveButton = page.getByRole('button', { name: 'Save' });
```

### 5. Re-run and prove green with assertions unchanged

```bash
npx playwright test <path-to-failing-spec>
```

Verify:

- [ ] The targeted spec passes.
- [ ] **Spec file diff is empty** — no assertion, timeout, or `test.fixme`
      changes.
- [ ] Only POM locator(s) changed.

**Green via weakened assertion is a bug.** If the only way to pass is changing
`expect(...)` text, matchers, or removing checks → **STOP and escalate** (likely
real app bug or wrong heal).

Re-run once if flaky; if the **same failure** appears twice, stop per QA
orchestrator loop guard.

### 6. Report and open a PR

Post a structured summary (PR comment or PR body):

```markdown
## Self-heal: locator drift

**Classification:** test issue (drift) — triage run <id or link>

**Locator diff:**
- File: `pages/...`
- Old: `getByRole('button', { name: 'Save Program' })`
- New: `getByRole('button', { name: 'Save' })`

**Proof:**
- Re-run: `npx playwright test tests/...` — **green**
- Spec assertions: unchanged
```

Ship the fix on a feature branch and open a PR (`fix/self-heal-<short-slug>`).
One locator repair per run — do not batch unrelated drift fixes.

## Rules

| Rule | Detail |
|------|--------|
| Drift only | Never heal a real app defect |
| POM only | Patch locators in `pages/`; never spec assertions |
| A11y tree | Re-discover via Playwright MCP `browser_snapshot` |
| One repair | One locator fix per self-heal run |
| Always a PR | Every heal becomes a PR; never merge automatically |
| No assertion hacks | Green with changed `expect()` → escalate, not ship |

## Related skills

- `ci-failure-triage` — required classification before healing
- `jira-bug-reporter` — route when drift is ruled out
- `pom-conventions` — locator style and file layout
