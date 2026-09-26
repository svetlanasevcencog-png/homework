# Suite reliability eval report

**As of:** 2026-09-26  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts.  
**Backlog run context:** Queue build blocked — `GET /rest/api/3/myself` returned **HTTP 401** with `JIRA_EMAIL` + `JIRA_API_TOKEN` Basic auth; authenticated `project/search` returned `total: 0` and `BROWSE_PROJECTS` = false. Unauthenticated-looking `search/jql` returned `issues: []` (not trusted as an empty backlog). No DS tickets processed this run.

---

## Flake rate

| | |
|---|---|
| **Number** | **n/a** |
| **How measured** | Listed the last 20 completed `playwright.yml` runs via `gh run list`. Nearly all recent runs are `chore/eval-report-*` PRs concluding `action_required` (environment approval) with **no** `playwright-junit-*` artifacts. Older success/failure runs (e.g. `31205910102`, `32642611864`) return `log not found` / expired logs or have no Playwright summary lines (`N flaky`) / JUnit XML to scrape. |
| **What it tells us** | Flake cannot be recomputed this window; prior measured baseline (2026-07-09) was **0%** over 20 runs / 1732 concluded tests — treat as stale until a green suite run uploads JUnit again. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | PR history (`gh pr list` / `fix/self-heal-*`): only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal (POM-only `pages/programs.page.ts`; no assertion changes). Skill/docs PRs on the same branch name (#21 / #24 / #25) excluded. No new self-heal PRs since last eval. Masked regressions (assertion weakenings or “healing” a real app bug): **0**. |
| **What it tells us** | Heal cohort unchanged; masked-regression budget still **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort = merged `qa/ds-*` PRs shipping ticket specs: **#17** (DS-3) and **#18** (DS-119). No new `qa/ds-*` PRs this run (Jira auth blocked queue). Gates: (1) green first `pull_request` job `test`; (2) conforming locators; (3) maps-to-AC via `features/*.feature.md` / PR body. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes (spec-only, no banned patterns) | Yes (body cites Gherkin plan / TCs) | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA; `gh pr checks` reported none | Yes (`getByRole`, no `waitForTimeout` / `page.locator`) | Yes (`features/DS-119.feature.md` + DS-119 link) | **Fail** |

| **What it tells us** | Gate score unchanged; the orchestrator Generation gate remains the control that should have blocked #18-style empty-check merges from being labeled done. |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **n/a** for multi-session rate; **this run: 0 asks : 0 guesses** (stop/escalate on auth failure — no ticket values invented) |
| **How measured** | Only **1** local agent transcript file is present under `agent-transcripts/` for this environment; historical multi-session corpus from the 2026-07-09 baseline (`29 asks : 1 guess` / 38 sessions) is not available here. This Backlog session did not invent ticket keys, AC, or env values when Jira returned 401. |
| **What it tells us** | Cannot refresh the multi-session ask:guess ratio; the important signal this run is that the agent stopped instead of guessing an empty or fake backlog. |

---

## Top reliability risk

**Jira API credentials for the headless orchestrator are invalid or the account has no site/project access** — backlog automation has been blocked across many consecutive runs (open `chore/eval-report-*` PRs #38–#57 and continuing). Empty `search/jql` results without a successful `/myself` must not be treated as “No qualifying tickets.”

Secondary: flake recompute is stalled because recent `playwright.yml` runs either need environment approval (`action_required`) or have expired logs/artifacts.

## Next action

1. **Human:** Rotate/fix `JIRA_EMAIL` + `JIRA_API_TOKEN` (GitHub `dev1` / orchestrator secrets); confirm `GET /rest/api/3/myself` → 200 and project **DS** is visible, then re-run Backlog mode.
2. Close or merge accumulated `chore/eval-report-*` PRs once secrets work, so the queue is not drowned out by eval-only noise.
3. Keep `suite-reliability-eval` mandatory on every orchestrator Done / Backlog REPORT; remeasure flake from JUnit once a suite run uploads artifacts again.
