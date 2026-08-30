# Suite reliability eval report

**As of:** 2026-08-30  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Backlog run outcome:** **STOPPED** — Jira REST Basic auth failed (`x-seraph-loginreason: AUTHENTICATED_FAILED`; `GET /rest/api/3/myself` → **401**). Search returned `issues: []` while unauthenticated; that is **not** treated as an empty queue. No ticket specs, labels, or Jira bugs were changed.  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Numbers below were measured from CI artifacts, PR history, and the transcripts available in this environment.

---

## Flake rate

| | |
|---|---|
| **Number** | **0%** — `0` flaky / `40` concluded tests (`passed` + `failed` + `flaky`) across **2** completed `playwright.yml` runs with unexpired JUnit |
| **How measured** | `gh run list --workflow=playwright.yml --limit 30` → download unexpired `playwright-junit-*` artifacts → parse `junit-results.xml`. Only runs [31205683508](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205683508) (smoke, 18 cases) and [31205910102](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205910102) (sanity, 22 cases) still had JUnit. Zero `<failure>` / `<error>` / flaky markers. Older runs’ JUnit artifacts are expired; five recent `chore/eval-report-*` PRs concluded `action_required` (no test execution). |
| **What it tells us** | In the measurable window the suite shows no retry-only passes — but coverage is thin (2/20+ runs) until more JUnit artifacts stay retained. |

**Gap:** Full last-20 flake scrape is **n/a** for expired-artifact runs (cannot invent counts from missing XML).

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | `gh pr list` for `fix/self-heal-*`: only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal (POM-only `pages/programs.page.ts`; no `tests/**` changes). PR #24 same branch name is docs-only — excluded. No new heal PRs since prior eval. |
| **What it tells us** | The one heal stayed inside the contract; masked-regression budget remains **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort = merged `qa/ds-*` PRs shipping/tightening ticket specs: **#17** (DS-3) and **#18** (DS-119). No new `qa/ds-*` PRs this run (Jira auth blocked queue). Green / conforming / maps-to-AC scoring unchanged from prior measurement. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA | Yes | Yes | **Fail** |

**What it tells us:** Gate miss mode remains “CI never ran” (PR #18). Orchestrator Generation gate + required `test` check on `main` mitigate merge, but backlog cannot exercise the gate until Jira auth works.

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **This session: `0` asks : `0` guesses** (1 transcript file available). Historical multi-session corpus: **n/a** |
| **How measured** | Scanned `/github/home/.cursor/projects/w-homework-homework/agent-transcripts/**/*.jsonl` (1 file). No invent-phrasings; queue was not claimed empty — auth failure escalated. Prior report’s `29 asks : 1 guess` / 38 sessions cannot be re-verified here (transcripts not mounted). |
| **What it tells us** | This run refused to invent an empty backlog from an unauthenticated empty search; historical ask/guess ratio is unverifiable in this environment. |

---

## Top reliability risk

**Jira API token / email pair is invalid** — backlog automation cannot list In Progress DS tickets (`AUTHENTICATED_FAILED`). Repeated open `chore/eval-report-*` PRs (#38–#42) show the same blocker across days.

Secondary: generation PRs can still open without a `test` workflow run if someone bypasses the orchestrator; branch protection blocks merge only.

## Next action

1. **Human:** rotate or fix GitHub secret `JIRA_API_TOKEN` (and confirm `JIRA_EMAIL` matches the Atlassian account that owns the token); verify with `GET /rest/api/3/myself` → 200.  
2. Re-run Backlog orchestrator; process ≤5 In Progress tickets without `tests-generated`.  
3. Close or supersede stale `chore/eval-report-*` PRs after merging the latest refresh.
