# Suite reliability eval report

**As of:** 2026-09-06  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI artifacts, PR history, and agent session transcripts available in this environment.  
**Backlog run note:** Jira REST auth failed (`GET /rest/api/3/myself` → HTTP 401; `GET /issue/DS-1` → 404; project list empty). Queue was **not** treated as empty — ticket processing stopped; no `tests-generated` labels applied.

---

## Flake rate

| | |
|---|---|
| **Number** | **0%** — `0` flaky / `40` concluded tests across **2** of the last 20 `playwright.yml` runs that still expose JUnit |
| **How measured** | `gh run list --workflow=playwright.yml --limit 20` → `gh run download` of `playwright-junit-sanity` / `playwright-junit-smoke` where present. Parsed top-level `testsuites` counts from `junit-results.xml` (runs [31205910102](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205910102) = 22 tests, [31205683508](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205683508) = 18 tests). No `flaky` attributes/properties in XML. Remaining 18 runs in the window: 9× `action_required` (eval-report-only PRs; no test job) + older successes without retained JUnit — **gap named**, not invented. |
| **What it tells us** | In the measurable subset the suite is not hiding failures behind retries; coverage of the 20-run window is thin because most recent workflow runs never produced downloadable JUnit. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | `gh pr list` for `fix/self-heal-*`: **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) — POM-only (`pages/programs.page.ts`); no `tests/**` files. **PR #24** is docs on the same branch name after merge — excluded from the heal denominator. No new heal PRs since prior report. Masked-regression count = assertion weakenings or “heal” of a real app bug; none found. |
| **What it tells us** | The one heal stayed inside the contract; the masked-regression budget remains **0**. No heal work ran in this backlog session (auth block before any ticket). |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR *(unchanged; no new `qa/ds-*` PRs this run)* |
| **How measured** | Cohort = merged `qa/ds-*` PRs that ship ticket specs: **#17** (DS-3) and **#18** (DS-119). Green = first `pull_request` Playwright job `test` success; conforming = no `waitForTimeout` / CSS-XPath defaults; maps-to-AC = feature plan / AC linkage. This backlog run opened **zero** ticket PRs (Jira auth blocked queue build). |
| **What it tells us** | Gate discipline is defined; we still need a post-fix `qa/ds-*` PR to re-measure toward 100%. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA | Yes | Yes | **Fail** |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **0 asks : 0 guesses** in the **1** agent transcript available in this environment for this run; historical multi-session corpus **n/a** (not present on this runner) |
| **How measured** | Reviewed `/github/home/.cursor/projects/w-homework-homework/agent-transcripts/**/*.jsonl` (1 file). This backlog session escalated on HTTP 401 rather than inventing an In Progress queue or inventing ticket AC. Prior report’s `29 : 1` / 38 sessions cannot be re-verified here — source missing → not carried forward as a fresh measurement. |
| **What it tells us** | This run stayed on the ask-vs-guess contract (no invented queue). Broader ask/guess trend needs a fuller transcript archive on the runner. |

---

## Top reliability risk

**Orchestrator cannot build the DS backlog queue** — `JIRA_API_TOKEN` / account used in CI returns HTTP 401 on `/rest/api/3/myself` and cannot read project DS issues. Repeated chore-only eval PRs (#38–#46) without ticket processing.

Secondary: generation-gate still historically 50% until a new `qa/ds-*` PR proves green `test` on first CI.

## Next action

1. **Rotate / fix GitHub secrets** `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` so `/rest/api/3/myself` returns 200 and `project = DS` search returns issues.  
2. Re-run QA orchestrator Backlog mode; process In Progress tickets lacking `tests-generated`.  
3. Keep `suite-reliability-eval` mandatory on every Done / Backlog REPORT.
