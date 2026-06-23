# QA Harness Architecture

Overview of the Didaxis QA harness: agent coordination, Playwright test stack, CI, and guardrails.

## System overview

```mermaid
flowchart TB
  subgraph Triggers["Entry points"]
    T1["Jira ticket DS-*"]
    T2["Coverage gap / explore"]
    T3["Red CI run / failed run id"]
    T4["Daily cron + workflow_dispatch"]
  end

  subgraph Coordinator["Coordinator"]
    ORCH["QA Orchestrator\n.cursor/rules/qa-orchestrator.mdc"]
    CI["Headless runner\n.github/workflows/qa-orchestrator.yml\ncursor-agent + prompt"]
  end

  subgraph Agents["Specialist agents"]
    TW["test-writer"]
    TR["triage"]
    BR["bug-reporter"]
  end

  subgraph Skills["Skills"]
    JTA["jira-ticket-analyzer"]
    EXP["explore-and-generate"]
    CFT["ci-failure-triage"]
    SH["self-heal"]
    JBR["jira-bug-reporter"]
    POM["pom-conventions"]
    API["api-cleanup"]
  end

  subgraph Guardrails["Guardrails"]
    HOOK["afterFileEdit hook\nguard-test-assertions\nblocks weakened expect()"]
    RULES["playwright-conventions\nRefusals / hard stops"]
    HUMAN["Human gates\nplan review · PR merge"]
  end

  subgraph TestStack["Playwright test stack"]
    FEAT["features/*.feature.md\nGherkin plans"]
    SPEC["tests/ds*.spec.ts\nassertions only"]
    PAGES["pages/*.page.ts\nlocators + actions"]
    HELP["tests/helpers/\nshared flows"]
    FIX["fixtures/cleanup.fixture\ntrackProgram · auth"]
    SETUP["tests/auth.setup.ts\nstorageState"]
  end

  subgraph CI["GitHub Actions"]
    E2E["playwright.yml\nE2E on push/PR"]
    ART["playwright-report artifact"]
  end

  subgraph External["External systems"]
    JIRA["Jira DS project"]
    GH["GitHub runs · PRs"]
    APP["Didaxis app\ndev1 env"]
    PWMCP["Playwright MCP\na11y tree"]
    ATL["Atlassian MCP\nlocal Jira"]
  end

  T1 --> ORCH
  T2 --> ORCH
  T3 --> ORCH
  T4 --> CI --> ORCH

  ORCH --> JTA & EXP
  JTA --> FEAT
  EXP --> FEAT
  FEAT --> HUMAN
  HUMAN --> TW
  TW --> POM & API
  TW --> SPEC & PAGES & HELP

  ORCH -->|"npx playwright test"| E2E
  E2E --> APP
  E2E --> ART

  ORCH -->|"red"| TR
  TR --> CFT
  CFT --> ART & SPEC & PAGES

  TR -->|"real app bug"| BR
  BR --> JBR
  JBR --> JIRA & ATL

  TR -->|"drift"| SH
  SH --> PWMCP & APP
  SH --> PAGES
  SH -->|"re-run green"| E2E
  SH -->|"fix/self-heal-* PR"| GH

  TW -->|"feat/* PR"| GH
  BR -->|"bug key"| GH

  HOOK -.->|"blocks"| SPEC
  RULES -.-> TW & SH
  HUMAN -.-> GH
```

## Ticket → green (happy path)

```mermaid
sequenceDiagram
  actor Human
  participant Orch as QA Orchestrator
  participant Jira
  participant TW as test-writer
  participant PW as Playwright
  participant GH as GitHub

  Human->>Orch: DS ticket or backlog trigger
  Orch->>Jira: read acceptance criteria
  Orch->>Orch: jira-ticket-analyzer
  Orch->>GH: save features/DS-N.feature.md
  Orch->>Human: STOP — review plan
  Human->>Orch: plan approved
  Orch->>TW: delegate
  TW->>TW: write tests/dsN-*.spec.ts + pages/
  Orch->>PW: npx playwright test
  PW-->>Orch: green
  Orch->>GH: open PR (one ticket = one PR)
  Human->>GH: approve merge
```

## Heal on red

```mermaid
flowchart LR
  RED["Red run"] --> TRI["triage\n(ci-failure-triage)"]
  TRI --> CLASS{"Classify"}

  CLASS -->|"real app bug"| BUG["bug-reporter\n(jira-bug-reporter)"]
  BUG --> JIRA["File / link Jira bug"]
  BUG --> STOP1["Never heal"]

  CLASS -->|"drift"| HEAL["self-heal"]
  HEAL --> MCP["Playwright MCP\nbrowser_snapshot"]
  MCP --> POM["Patch POM only\npages/"]
  POM --> RERUN["Re-run spec\nassertions unchanged"]
  RERUN --> PR["fix/self-heal-* PR"]
  PR --> HUMAN["Human merges"]

  CLASS -->|"inconclusive"| ESC["Stop & escalate"]

  HOOK["guard-test-assertions hook"] -.->|"exit 2 if expect weakened"| POM

  HEAL --> BUDGET["≤ 5 heals / run"]
```

## Test stack layout

```mermaid
flowchart TB
  subgraph Repo["Repository layers"]
    direction TB
    L1["features/*.feature.md — plans (human-reviewed)"]
    L2["tests/ds*.spec.ts — intent + expect()"]
    L3["pages/ — getByRole locators, no assertions"]
    L4["tests/helpers/ — createProgram, openProgramsList, …"]
    L5["fixtures/cleanup.fixture — trackProgram API teardown"]
    L6["tests/auth.setup.ts — storageState once per run"]
  end

  L1 --> L2
  L2 --> L3
  L2 --> L4
  L4 --> L5
  L6 --> L2

  subgraph Projects["Playwright projects"]
    SETUP["setup"]
    AUTH["chromium-didaxis\n(storageState)"]
    GUEST["chromium-guest"]
  end

  L6 --> SETUP --> AUTH
  L2 --> AUTH & GUEST
```

## Key constraints

| Layer | Constraint |
|-------|------------|
| **Orchestrator** | ≤5 delegations/task · ≤5 self-heals/run · never merge without human |
| **Triage** | Read-only — classify, never fix |
| **Self-heal** | POM only · assertions unchanged · drift only |
| **Hook** | Blocks deleted/commented `expect(` in `tests/**` |
| **Playwright rules** | Refusals: no assertion weakening, no CSS/XPath, no `waitForTimeout` |
| **CI** | `playwright.yml` on every PR · `qa-orchestrator.yml` daily backlog (≤5 tickets) |

## Related files

| Component | Path |
|-----------|------|
| Orchestrator rule | `.cursor/rules/qa-orchestrator.mdc` |
| Playwright conventions | `.cursor/rules/playwright-conventions.mdc` |
| Assertion guard hook | `.cursor/hooks.json`, `.cursor/hooks/guard-test-assertions.*` |
| E2E workflow | `.github/workflows/playwright.yml` |
| Backlog orchestrator | `.github/workflows/qa-orchestrator.yml` |
| Headless prompt | `.github/qa-orchestrator-prompt.md` |
| Agents | `.cursor/agents/test-writer.md`, `triage.md`, `bug-reporter.md` |
| Skills | `.cursor/skills/` |
