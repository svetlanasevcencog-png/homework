# Suite reliability eval report

**As of:** 2026-10-14  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts.  
**This backlog run:** stopped before any ticket work — Jira REST Basic auth returned **401 Unauthorized** (`GET /rest/api/3/myself`); search/jql returns empty `issues` (same response without credentials), so the queue is not trustworthy. Secrets `JIRA_EMAIL` / `JIRA_API_TOKEN` need rotation or email/token pairing fix.

---

## Flake rate

| | |
|---|---|
| **Number** | **n/a** |
| **How measured** | `gh run list --workflow=playwright.yml` → last **20** completed runs with `conclusion` in `{success,failure}` (excluded `action_required`). Scraped `test` job logs for `N passed` / `N failed` / `N flaky`; listed run artifacts. Only **2 / 20** runs yielded usable counts (runs [31205910102](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205910102) and [31205683508](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205683508): combined `40` passed, `0` failed, `0` flaky). Remaining window is mostly artifact-less `chore/eval-report-*` failures or expired empty logs. **0** JUnit artifacts in this window. |
| **What it tells us** | Cannot publish a window flake rate without inventing counts for 18/20 runs. Partial scrape shows no flaky markers where counts exist; prior 2026-07-09 figure (`0` / `1732`) is not re-confirmed. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | `gh pr list` for `fix/self-heal-*`. Only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal (POM-only `pages/programs.page.ts`; no assertion changes). PR #24 is docs on the same branch name — excluded. No new heal PRs since the prior eval. Masked-regression count = assertion weakenings or “heal” of a real app bug; none found. |
| **What it tells us** | Heal cohort unchanged; masked-regression budget still **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort still only **#17** (DS-3) and **#18** (DS-119). No new merged or open `qa/ds-*` ticket-spec PRs since the prior eval (`gh pr list` / `head:qa/ds-`). Gates: green first-PR `test` check, conforming locators, maps-to-AC via `features/*.feature.md`. |
| **What it tells us** | Gate score unchanged; backlog cannot produce new generation PRs until Jira auth works. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA | Yes | Yes | **Fail** |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **n/a** (multi-session); this run **0 asks : 0 guesses** (1 session file) |
| **How measured** | Agent transcripts under `agent-transcripts/`: this environment exposes **1** `.jsonl` file (current run). No invent/`I'll assume` phrasing for ticket queue or AC; no clarifying ask to invent a backlog (auth failure escalated instead). Historical **29 : 1 / 38 sessions** from 2026-07-09 cannot be re-counted — corpus not present on this runner. |
| **What it tells us** | This run correctly stopped on missing Jira auth instead of inventing a queue; broader ask-vs-guess trend is unmeasurable here. |

---

## Top reliability risk

**Jira API credentials invalid for headless backlog runs** — `JIRA_API_TOKEN` + `JIRA_EMAIL` yield HTTP **401** on `/rest/api/3/myself`; search returns empty `issues` without a usable queue. Recurring across open `chore/eval-report-*` PRs (#42–#65). Blocks all DS ticket processing, labeling, and bug filing.

Secondary: flake rate cannot be refreshed while recent `playwright.yml` runs are mostly env-gated (`action_required`) or artifact-less chore failures.

## Next action

1. **Rotate / fix** GitHub secrets `JIRA_EMAIL` + `JIRA_API_TOKEN` (Atlassian API token must match the account email; verify with `GET /rest/api/3/myself` → 200).  
2. Re-run the QA orchestrator backlog after auth works.  
3. Close or merge stale open `chore/eval-report-*` PRs so CI noise drops.  
4. On the next successful suite run with JUnit artifacts, recompute flake rate from `junit-results.xml`.
