# Suite reliability eval report

**As of:** 2026-09-03  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Backlog run note:** Queue build **blocked** — Jira REST `GET /rest/api/3/myself` returned **HTTP 401** with the configured `JIRA_EMAIL` / `JIRA_API_TOKEN`. Search/jql returned an empty `issues` array with HTTP 200 under the same bad auth (do **not** treat as “No qualifying tickets”). **0** DS tickets processed this run.  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI artifacts/logs, PR history, and available agent session transcripts.

---

## Flake rate

| | |
|---|---|
| **Number** | **0%** — `0` flaky / `40` concluded tests (`passed` + `failed` + `flaky`) from **2** of the last **20** completed `playwright.yml` runs that still had downloadable `playwright-junit-*` artifacts |
| **How measured** | `gh run list --workflow=playwright.yml --limit 20` (and extended to 50 to find success/failure runs). Of the newest 20 completed runs, **7** were `action_required` chore/eval-report PRs with **no downloadable logs**. For the remaining success/failure runs, downloaded `playwright-junit-*` → `junit-results.xml` where the artifact still existed: runs [31205910102](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205910102) (22 tests, sanity) and [31205683508](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205683508) (18 tests, smoke). Counted `testcase` nodes; failures/errors/skipped = 0; no flaky/retry properties on cases. Older junit artifacts in the window returned download failures (likely expired). `retries: 2` is still set on CI (`playwright.config.ts`). |
| **What it tells us** | Where JUnit is still available, nothing is passing only on retry — but the measurement window is thin because most recent workflow runs never executed the suite or no longer expose artifacts. |

**Window detail:** Prefer JUnit over log greps. Treat `n/a` for the 18/20 newest runs without usable JUnit/logs rather than inventing flake counts.

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | `gh pr list` for `fix/self-heal-*`: only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) changes `pages/` (POM-only `pages/programs.page.ts`). No `tests/**` files in that PR (assertions untouched). PR check `test` was **SUCCESS**. PRs #21 / #24 / #25 are skill/docs only — excluded from the heal denominator. No new self-heal PRs since the prior eval. Masked-regression count = assertion weakenings or “heal” of a real app bug; **none found**. |
| **What it tells us** | The single heal stayed inside the contract; the masked-regression budget remains **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort = merged `qa/ds-*` PRs that add/change ticket specs: **#17** (DS-3) and **#18** (DS-119). No new `qa/ds-*` PRs since prior eval (this backlog run processed **0** tickets). For each: (1) **green** = first `pull_request` Playwright job `test` success; (2) **conforming** = no `waitForTimeout` / CSS-XPath defaults; (3) **maps-to-AC** = feature plan / AC linkage. |
| **What it tells us** | Gate rate is unchanged; the historical miss (#18 empty checks) is why empty/red `test` still blocks `tests-generated`. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — no workflow runs on head branch `qa/ds-DS-119-tests` | Yes | Yes (`features/DS-119.feature.md`) | **Fail** |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **1 ask : 0 guesses** across **1** agent session available in this environment’s transcripts; prior cohort on `main` (**29 asks : 1 guess** / **38** sessions as of 2026-07-09) is **n/a to re-verify** this run |
| **How measured** | Walked `agent-transcripts/` for this project in the current runner (1 `.jsonl` session). Counted assistant turns that asked for a missing decision/value vs invented assumptions (`I'll assume…`). Historical 38-session files are not present on this runner, so that ratio is cited only as unreverified prior baseline — **not** re-counted. |
| **What it tells us** | This run asked rather than inventing ticket scope under auth failure; multi-session ask/guess trend cannot be refreshed until transcripts are retained across harness runs. |

---

## Top reliability risk

**Orchestrator cannot build the Backlog queue** — Jira Basic auth with current GitHub secrets returns **401** on `/rest/api/3/myself`. Repeated chore-only eval PRs (#38–#44 and this one) accumulate while no `qa/ds-*` work lands. Secondary risk: flake measurement depends on short-lived JUnit artifacts; most of the last 20 `playwright.yml` runs are non-suite `action_required` chores.

## Next action

1. **Rotate / fix** GitHub secrets `JIRA_EMAIL` and `JIRA_API_TOKEN` (confirm with a manual `GET /rest/api/3/myself` → 200).  
2. Re-run QA orchestrator **Backlog mode** and process In Progress DS tickets without `tests-generated`.  
3. On the next `qa/ds-*` PR, confirm Generation gate (`test` → success) before labeling.  
4. Prefer retaining JUnit artifacts longer (or scrape flaky from logs before expiry) so flake rate covers a full N=20 suite window.
