# Didaxis QA Harness

End-to-end test suite and QA automation for [Didaxis Studio](https://github.com/svetlanasevcencog-png/homework), built with Playwright and Cypress. The repo also includes Cursor agents, skills, and CI workflows that turn Jira tickets into reviewed test plans and pull requests.

For architecture diagrams and agent coordination, see [docs/harness-diagram.md](docs/harness-diagram.md).

## Prerequisites

- Node.js (LTS)
- npm

## Install

```bash
npm install
npx playwright install
cp .env.example .env
```

Edit `.env` with real credentials. Never commit `.env` or put real secrets in `.env.example`.

## Environment variables

### Run tests

Required to clone the repo and run Playwright against Didaxis:

| Variable | Purpose |
|----------|---------|
| `DIDAXIS_URL` | Didaxis test environment URL |
| `DIDAXIS_EMAIL` | Login email (`auth.setup.ts` → `storageState`) |
| `DIDAXIS_PASSWORD` | Login password |
| `DIDAXIS_API_TOKEN` | Bearer token for API setup/teardown (`trackProgram`) |

Optional (permission / role probes):

| Variable | Purpose |
|----------|---------|
| `DIDAXIS_ALT_EMAIL` | Secondary account without full program permissions |
| `DIDAXIS_ALT_PASSWORD` | Password for the alt account |

`BASE_URL` is only for TodoMVC / demo specs.

### Agent / CI setup

Not needed for `npx playwright test` alone:

| Variable | Purpose |
|----------|---------|
| `CURSOR_API_KEY` | Headless `cursor-agent` in CI (`.github/workflows/qa-orchestrator.yml`) |
| `ATLASSIAN_BASE_URL` | Jira site URL for Atlassian MCP / local agents |
| `ATLASSIAN_EMAIL` | Atlassian account email |
| `ATLASSIAN_API_TOKEN` | Atlassian API token |

Configure Atlassian MCP tokens in **Cursor Settings → MCP** for local agent work. CI maps equivalent values via GitHub Environment secrets (`dev1`).

## Running tests

```bash
# Full suite (all projects / untagged filter)
npm run test:all

# Tagged slices (exactly one tag per test)
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive   # --workers=1 — shared/global state only

# Didaxis suite only (auth setup + authenticated specs)
npx playwright test --project=chromium-didaxis

# Single spec
npx playwright test tests/ds1-create-program.spec.ts --project=chromium-didaxis

# HTML report
npm run test:e2e:report
```

Tags: `@smoke` · `@sanity` · `@regression` · `@api` · `@e2e` · `@destructive`. Never tag `describe`. `@destructive` is only for tests that mutate shared/global state (locale, roles, flags, settings) and must include an `afterEach`/`afterAll` revert; own-data cleanup keeps an importance tag.

Playwright projects:

- **setup** — authenticates once and writes `storageState` to disk
- **chromium-didaxis** — authenticated Didaxis specs (`ds*.spec.ts`)
- **chromium-guest** — unauthenticated login page specs
- **chromium / firefox / webkit** — demo and example specs (TodoMVC, etc.)

### Cypress (legacy)

```bash
npm run cy:open   # interactive
npm run cy:run    # headless
```

### Playwright MCP (agent exploration)

```bash
npm run mcp:playwright:install
npm run mcp:playwright
```

## Cursor agents and skills

Open this repo in Cursor; project rules under `.cursor/rules/` apply automatically (including the constitution).

| Piece | Path | Role |
|-------|------|------|
| Constitution | `.cursor/rules/constitution.mdc` | Always-on MUST / SHOULD / WON'T |
| QA orchestrator | `.cursor/rules/qa-orchestrator.mdc` | Coordinates ticket → plan → tests → PR |
| Playwright conventions | `.cursor/rules/playwright-conventions.mdc` | Locators, auth, anti-flake |
| Skills | `.cursor/skills/` | `jira-ticket-analyzer`, `pom-conventions`, `api-cleanup`, `ci-failure-triage`, `self-heal`, … |
| Agents | `.cursor/agents/` | `test-writer`, `triage`, `bug-reporter` |
| Hooks | `.cursor/hooks.json` | Blocks constitution WON'T edits under `tests/` / `pages/` |

See [.cursor/skills/README.md](.cursor/skills/README.md) for when to use each skill. Invoke agents from chat (e.g. “use test-writer on DS-3”) or via the QA orchestrator / CI headless run.

## Project structure

```
features/          Gherkin test plans (DS-1, DS-2, …) — human-reviewed before implementation
tests/             Playwright specs and auth setup
  helpers/         Shared flows (create program, open dashboard, …)
pages/             Page Object Model — locators and actions, no assertions
fixtures/          Auth constants and API cleanup (trackProgram teardown)
test-data/         Faker factories, static invalid sets, enums
cypress/           Legacy Cypress specs and POMs
docs/              Architecture and harness documentation
.cursor/           Agent rules, skills, hooks, and agents
.github/workflows/ CI (tagged Playwright suites + daily QA orchestrator)
```

**Layering:** plans → specs (assertions) → pages (locators) → helpers/fixtures.

## CI

**E2E Tests** (`.github/workflows/playwright.yml`) select a Playwright tag by trigger:

| Trigger | Suite | Grep |
|---------|-------|------|
| Pull request → `main` | Smoke | `@smoke` |
| Push → `main` | Sanity | `@sanity` |
| Manual (`workflow_dispatch`) | Regression (default; smoke/sanity also selectable) | `@regression` |

Playwright runs setup + Didaxis + guest projects and uploads a `playwright-report-<suite>` artifact. **Cypress** runs in parallel on the same workflow.

Didaxis secrets live in the `dev1` GitHub Environment (`DIDAXIS_URL`, `DIDAXIS_EMAIL`, `DIDAXIS_PASSWORD`, `DIDAXIS_API_TOKEN`).

A daily **QA orchestrator** workflow (`.github/workflows/qa-orchestrator.yml`) processes backlog Jira tickets via headless `cursor-agent` (`CURSOR_API_KEY` + Jira secrets).

## License

ISC
