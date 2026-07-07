# Didaxis QA Harness

End-to-end test suite and QA automation for [Didaxis Studio](https://github.com/svetlanasevcencog-png/homework), built with Playwright and Cypress. The repo also includes Cursor agents, skills, and CI workflows that turn Jira tickets into reviewed test plans and pull requests.

For architecture diagrams and agent coordination, see [docs/harness-diagram.md](docs/harness-diagram.md).

## Prerequisites

- Node.js (LTS)
- npm

## Setup

```bash
npm install
npx playwright install
```

Copy the environment template and fill in credentials:

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `BASE_URL` | Demo app URL (TodoMVC example specs) |
| `DIDAXIS_URL` | Didaxis test environment |
| `DIDAXIS_EMAIL` | Login email |
| `DIDAXIS_PASSWORD` | Login password |
| `DIDAXIS_API_TOKEN` | API token for test cleanup |

`.env` is gitignored — never commit real credentials.

## Running tests

### Playwright (primary)

```bash
# All tests
npm run test:e2e

# Open HTML report after a run
npm run test:e2e:report

# Run a single spec
npx playwright test tests/ds1-create-program.spec.ts --project=chromium-didaxis
```

Playwright projects:

- **setup** — authenticates once and writes `storageState` to disk
- **chromium-didaxis** — authenticated Didaxis specs (`ds*.spec.ts`)
- **chromium-guest** — unauthenticated login page specs
- **chromium / firefox / webkit** — demo and example specs (TodoMVC, etc.)

### Cypress (legacy Didaxis specs)

```bash
npm run cy:open   # interactive
npm run cy:run    # headless
```

### Playwright MCP (for agent-driven exploration)

```bash
npm run mcp:playwright:install
npm run mcp:playwright
```

## Project structure

```
features/          Gherkin test plans (DS-1, DS-2, …) — human-reviewed before implementation
tests/             Playwright specs and auth setup
  helpers/         Shared flows (create program, open dashboard, …)
pages/             Page Object Model — locators and actions, no assertions
fixtures/          Auth constants and API cleanup (trackProgram teardown)
cypress/           Legacy Cypress specs and POMs
docs/              Architecture and harness documentation
.cursor/           Agent rules, skills, and hooks
.github/workflows/ CI (Playwright E2E on every PR, daily QA orchestrator)
```

**Layering:** plans → specs (assertions) → pages (locators) → helpers/fixtures.

## CI

GitHub Actions runs on every push and pull request to `main`:

- **E2E Tests** (`.github/workflows/playwright.yml`) — Playwright setup + Didaxis + guest projects; uploads `playwright-report` artifact on failure
- **Cypress** — runs in parallel on the same workflow

Secrets are stored in the `dev1` GitHub Environment (`DIDAXIS_URL`, `DIDAXIS_EMAIL`, `DIDAXIS_PASSWORD`, `DIDAXIS_API_TOKEN`).

A daily **QA orchestrator** workflow (`.github/workflows/qa-orchestrator.yml`) processes backlog Jira tickets via Cursor agents.

## Cursor automation

This repo is set up for agent-assisted QA:

| Component | Location |
|-----------|----------|
| QA orchestrator | `.cursor/rules/qa-orchestrator.mdc` |
| Playwright conventions | `.cursor/rules/playwright-conventions.mdc` |
| Skills (triage, self-heal, Jira, …) | `.cursor/skills/` |
| Specialist agents | `.cursor/agents/` |

See [.cursor/skills/README.md](.cursor/skills/README.md) for skill descriptions.

## License

ISC
