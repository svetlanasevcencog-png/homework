# Suite reliability eval report

**As of:** 2026-09-02  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts.  
**Backlog context:** This refresh follows a Backlog run that **could not build a queue** — Jira REST `GET /rest/api/3/myself` returned **HTTP 401** with the configured `JIRA_EMAIL` / `JIRA_API_TOKEN` (ticket search therefore unusable). No DS tickets were processed.

---

## Flake rate

| | |
|---|---|
| **Number** | **0%** — `0` flaky / `40` concluded tests (`passed` + `failed` + `flaky`) from **2** of the last **20** concluded `playwright.yml` runs that still had downloadable JUnit |
| **How measured** | `gh run list --workflow=playwright.yml` → last 20 success/failure runs. Downloaded `playwright-junit-*` artifacts where available; parsed `junit-results.xml` testcases. Runnable JUnit: run [31205910102](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205910102) (22 passed) and [31205683508](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205683508) (18 passed). **7** older junit artifacts returned HTTP 410 (expired); **11** runs had report-only artifacts / no parseable summary lines in `gh run view --log`. |
| **What it tells us** | In the measurable window the suite shows no retry-only passes — but coverage of the 20-run window is incomplete because most JUnit artifacts expired. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | `gh pr list --state all --search 'head:fix/self-heal'`: only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal (POM-only; no assertion/spec weakenings). PR #24 on the same branch name is docs-only — excluded from the denominator. No new `fix/self-heal-*` PRs since the prior eval. |
| **What it tells us** | The heal contract still holds; masked-regression count remains **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort = `qa/ds-*` PRs that add/change `tests/ds*.spec.ts`: **#17** (DS-3) and **#18** (DS-119). No new `qa/ds-*` PRs since prior eval (`gh pr list --search 'head:qa/ds-'`). Green = first `pull_request` Playwright `test` success; conforming = role-based POM / no banned waits; maps-to-AC = feature plan / AC linkage. |
| **What it tells us** | Gate enforcement is in the orchestrator + branch protection, but backlog cannot exercise it until Jira auth works and a new `qa/ds-*` PR is opened. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA | Yes | Yes | **Fail** |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **n/a** (full project cohort) — this environment only had **1** agent transcript file available; prior **29 asks : 1 guess / 38 sessions** cannot be re-verified here |
| **How measured** | Listed `agent-transcripts/**/*.jsonl` under the Cursor project (1 file). Did **not** invent ask/guess ratios from incomplete history. This Backlog session: **0 guesses** on ticket queue contents — stopped on Jira **401** instead of assuming an empty backlog. |
| **What it tells us** | Auth/ops failures are being escalated rather than invented away; transcript retention in CI/headless hosts is too thin for a stable ask-vs-guess trend. |

---

## Top reliability risk

**Jira REST credentials for the orchestrator are invalid (HTTP 401).** Backlog mode cannot discover In Progress DS tickets, so generation-gate, labeling, and defect filing never run. Open chore-only eval PRs keep stacking without ticket progress (see PRs #38–#43).

## Next action

1. Rotate / fix GitHub secrets `JIRA_EMAIL` + `JIRA_API_TOKEN` (and confirm the account can see project **DS**).  
2. Re-run Backlog mode; process up to 5 In Progress tickets without `tests-generated`.  
3. Confirm the next `qa/ds-*` PR shows Playwright job `test` → success before applying `tests-generated`.
