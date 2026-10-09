# Suite reliability eval report

**As of:** 2026-10-09  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts.  
**Backlog run note:** Queue build blocked — `GET /rest/api/3/myself` returned **401** (`x-seraph-loginreason: AUTHENTICATED_FAILED`). Unauthenticated / failed-auth `POST /rest/api/3/search/jql` returns `issues: []` (HTTP 200); that must **not** be treated as an empty queue.

---

## Flake rate

| | |
|---|---|
| **Number** | **0%** — `0` flaky / `42` concluded tests (`passed` + `failed` + `flaky`) across **2** `playwright.yml` runs with a recoverable Playwright summary (window = last **20** `success`/`failure` runs; **11** had no `test` job; **7** had expired/unavailable job logs) |
| **How measured** | `gh run list --workflow=playwright.yml` → filter `conclusion` in `{success,failure}` (skip `action_required`) → `gh api .../actions/jobs/<id>/logs` for job `test` → parse `\d+ passed|failed|flaky` (GHA timestamp-prefixed lines; smoke + full summaries summed per run). JUnit artifacts were **not** present on sampled runs. |
| **What it tells us** | In the measurable window the suite is not papering over failures with retries. **Caveat:** of the **last 20 overall** workflow runs, **14** are `action_required` and **6** are `failure` (chore eval PRs / never-executed tests) — flake signal is stale relative to calendar time. |

**Window detail:** Recoverable smoke runs (2026-08-07): run [31205910102](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205910102) `p=1+22`; run [31205683508](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205683508) `p=1+18`; all `flaky=0`. Older chore `failure` runs in the success/failure window had **no** `test` job.

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | PR history (`gh pr list` / `fix/self-heal-*`): only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal. Files: `pages/programs.page.ts` only — **no `tests/**` changes**. **PR #24** on the same branch is docs-only — excluded from the heal denominator. Masked-regression count = assertion/spec weakenings or “heal” of a real app bug; none found. |
| **What it tells us** | The one heal stayed inside the contract (POM-only, assertions unchanged); the masked-regression budget is intact at **0**. No new heals this backlog run (no tickets processed). |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort = merged `qa/ds-*` PRs: **#17** (DS-3) and **#18** (DS-119). Early DS-1–DS-5 specs landed on `main` without PRs — out of scope. Gates: (1) **green** = first `pull_request` Playwright job `test` success; (2) **conforming** = no `waitForTimeout` / CSS-XPath defaults; (3) **maps-to-AC** = feature plan and/or AC linkage. No new `qa/ds-*` PRs this run (Jira auth blocked queue). |
| **What it tells us** | Half of agent generation PRs cleared the gate; the miss was missing CI (#18), not bad locators. Gate rules remain in force; re-measure when the next ticket PR opens. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes (spec-only) | Yes (Gherkin / TCs cited) | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA | Yes (`getByRole`, no banned waits/locators) | Yes (`features/DS-119.feature.md`) | **Fail** |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **n/a** (multi-session) — this host retains **1** transcript file; prior **29 asks : 1 guess / 38 sessions** cannot be re-verified here. **This session:** `1` escalate (Jira 401) : `0` guesses (did not invent an In Progress queue from empty failed-auth search). |
| **How measured** | Listed `agent-transcripts/`; only one `.jsonl` present for this environment. This backlog run’s behavior coded as ask/escalate vs invent-queue. |
| **What it tells us** | Orchestrator correctly refused to treat auth-failure empty search as “No qualifying tickets.” Credential repair is the blocker, not agent guessing. |

---

## Top reliability risk

**Jira API token / email secrets are invalid** — backlog automation has been auth-blocked across many consecutive scheduled runs (**26** open `chore/eval-report-*` PRs as of this refresh). Until `/rest/api/3/myself` returns 200, no DS ticket can be analyzed, labeled, or bug-filed.

Secondary: **14/20** recent `playwright.yml` runs are `action_required` (workflow approval), so live flake/generation-gate signals are not refreshing.

## Next action

1. **Human:** rotate/repair `JIRA_API_TOKEN` + confirm `JIRA_EMAIL` for `legionqaschool.atlassian.net`; verify `GET /rest/api/3/myself` → 200 and `project = DS` search returns issues.  
2. Re-run Backlog mode; process ≤5 In Progress tickets without `tests-generated`.  
3. Approve or close the backlog of open `chore/eval-report-*` PRs stuck on `action_required`.
