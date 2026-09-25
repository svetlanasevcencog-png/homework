# Suite reliability eval report

**As of:** 2026-09-25  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts.  
**Backlog run context:** Queue build blocked — `GET /rest/api/3/myself` returned **HTTP 401** with `JIRA_EMAIL` + `JIRA_API_TOKEN` Basic auth; `GET /rest/api/3/project` returned `[]`. No DS tickets processed this run.

---

## Flake rate

| | |
|---|---|
| **Number** | **n/a** |
| **How measured** | Listed the last 20 completed `playwright.yml` runs via `gh run list`. Nearly all recent runs are `chore/eval-report-*` PRs concluding `action_required` (environment approval) with **no** `playwright-junit-*` artifacts. Older success/failure runs (e.g. `31205910102`, `32642611864`) return `log not found` / expired logs, so Playwright summary lines (`N flaky`) and JUnit XML could not be scraped. |
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
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA | Yes | Yes | **Fail** |

| **What it tells us** | Rate unchanged until the next generation PR; empty-CI miss (#18) remains the only gate failure in cohort. |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **n/a** for full project history this host; **this session: `0` asks : `0` guesses** (escalated on missing auth instead of inventing a ticket queue) |
| **How measured** | Only **1** agent transcript is present under this runner’s `agent-transcripts/` (current backlog session). Prior eval (2026-07-09) reported **29 asks : 1 guess** across **38** sessions — that corpus is not available here, so the historical ratio is **not** re-asserted. |
| **What it tells us** | This run stopped on auth failure rather than inventing In-Progress tickets; multi-session ask/guess needs a fuller transcript store to re-measure. |

---

## Top reliability risk

**Jira credentials for the headless orchestrator are invalid or unauthorized** (`/myself` → 401). Daily Backlog runs cannot build a queue; a long chain of open `chore/eval-report-*` PRs (#38–#56+) records the same block without processing DS work.

Secondary: flake re-measure is blocked while suite CI on chore PRs stays `action_required` / without JUnit artifacts.

## Next action

1. **Human:** rotate/fix `JIRA_EMAIL` + `JIRA_API_TOKEN` in the `dev1` GitHub Environment; confirm `GET /rest/api/3/myself` → 200 and project `DS` is visible.
2. Re-run Backlog mode; process In-Progress tickets missing `tests-generated`.
3. After the next green `playwright.yml` suite run, re-scrape JUnit for flake rate.
