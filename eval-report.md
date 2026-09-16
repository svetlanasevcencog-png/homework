# Suite reliability eval report

**As of:** 2026-09-16  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts.  
**Backlog run context:** Queue build blocked — Jira REST Basic auth failed (`GET /rest/api/3/myself` → HTTP 401; `search/jql` returned HTTP 200 with `x-seraph-loginreason: AUTHENTICATED_FAILED` and empty `issues`). No tickets processed.

---

## Flake rate

| | |
|---|---|
| **Number** | **n/a** |
| **How measured** | Window: last **20** completed `playwright.yml` runs with conclusion `success` or `failure` (`gh run list --workflow=playwright.yml`). Attempted `gh run view <id> --log` for Playwright summary (`N flaky` / `N passed` / `N failed`) — **all 20 log streams empty**. JUnit artifacts (`playwright-junit-*` / `junit-results.xml`) on recent successful runs (e.g. [31205910102](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205910102), [31205683508](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205683508)) are **expired**. Cannot compute `flaky / (passed + failed + flaky)` without inventing. |
| **What it tells us** | Measurement gap: CI retention has dropped logs/artifacts for the usable window; re-measure after the next green `playwright.yml` run while artifacts are still downloadable. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | Cohort: merged `fix/self-heal-*` PRs that change `pages/` (exclude skill/docs). Only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) qualifies — POM-only (`pages/programs.page.ts`), no `tests/**` assertion changes, CI green. PRs #21 / #24 / #25 excluded (skill/docs). No new heal PRs since prior eval. Masked regressions (assertion weaken / heal of real app bug): **0**. |
| **What it tells us** | Heal contract still holds on the only landed drift fix; no new heal activity to re-score this run. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort unchanged: merged `qa/ds-*` PRs adding/changing `tests/ds*.spec.ts` — **#17** (DS-3) and **#18** (DS-119). Green = first `pull_request` Playwright job `test` success; conforming = no `waitForTimeout` / CSS-XPath defaults; maps-to-AC = feature plan / Gherkin linkage. No new `qa/ds-*` PRs this run (Jira auth blocked backlog). |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA | Yes | Yes | **Fail** |

| **What it tells us** | Gate enforcement exists in orchestrator + branch protection, but backlog cannot exercise it until Jira credentials work and a new `qa/ds-*` PR is opened. |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **0 asks : 0 guesses** (across **1** agent session transcript available this run) |
| **How measured** | Reviewed `agent-transcripts/` for this project (1 `.jsonl` session = this Backlog orchestrator run). Counted assistant clarifying questions about missing decisions/values vs inventing ticket scope/env/AC (`I'll assume…`). This session escalated on auth failure without inventing a ticket queue. Historical **29 : 1** across **38** sessions (as of 2026-07-09) is not re-countable — prior transcripts are not present in this environment. |
| **What it tells us** | Current session stayed ask/guess-neutral (hard stop on bad auth). Cannot refresh the long-window ratio without archived transcripts. |

---

## Top reliability risk

**Orchestrator cannot build the DS backlog** — GitHub secrets `JIRA_EMAIL` / `JIRA_API_TOKEN` (and/or account access) fail Basic auth against `https://legionqaschool.atlassian.net`. Empty `search/jql` bodies must not be treated as an empty queue when `AUTHENTICATED_FAILED` is present.

Secondary: flake rate remains unmeasurable until CI logs/JUnit are retained for a fresh `playwright.yml` window.

## Next action

1. **Human:** rotate/fix `JIRA_API_TOKEN` (and confirm `JIRA_EMAIL` owns a valid Atlassian API token for the site); verify `GET /rest/api/3/myself` returns 200.
2. Re-run QA Orchestrator Backlog mode; process up to 5 In Progress DS tickets without `tests-generated`.
3. On the next green Playwright CI run, download `playwright-junit-*` before expiry and re-fill flake rate.
