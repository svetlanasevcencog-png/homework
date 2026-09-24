# Suite reliability eval report

**As of:** 2026-09-24  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts. This refresh follows a Backlog run that **could not build a Jira queue** (`GET /rest/api/3/myself` → **401** with `JIRA_EMAIL` + `JIRA_API_TOKEN` Basic auth).

---

## Flake rate

| | |
|---|---|
| **Number** | **n/a** |
| **How measured** | Attempted last **20** completed `playwright.yml` runs via `gh run list` → `gh run view <id> --log` and `gh run download` for `playwright-junit-*` / `junit-results.xml`. Of those 20: **16** `action_required` and **2** `failure` on `chore/eval-report-*` PRs had **no `test` job**; the **2** `success` runs that did have `test` returned **empty logs** (0 bytes) and **no downloadable artifacts** (expired). Older successful runs in the next 30 likewise returned 0-byte logs. |
| **What it tells us** | Flake cannot be recomputed in this environment until CI retains logs/JUnit long enough (or a fresh suite run uploads `junit-results.xml`). Do **not** treat the prior 0% figure as re-verified today. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | `gh pr list` for `fix/self-heal-*`: only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal. Files: **POM-only** `pages/programs.page.ts` (no `tests/**`). **PR #24** is docs/conventions on the same branch name — excluded from the heal denominator. No new self-heal PRs since the prior report. Masked-regression count = assertion weakenings or “heal” of a real app bug; **none found**. |
| **What it tells us** | The heal cohort is unchanged and still inside the contract; masked-regression budget remains **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort = `qa/ds-*` PRs that add/change `tests/ds*.spec.ts`: **#17** (DS-3) and **#18** (DS-119). No new `qa/ds-*` PRs since. Green = first `pull_request` Playwright job `test` success; conforming = role-based POM / no banned waits; maps-to-AC = feature plan / AC linkage. |
| **What it tells us** | Gate score is unchanged; backlog still cannot produce a new generation PR until Jira auth is fixed. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102); `gh pr checks` still shows `test` pass) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA at merge time | Yes | Yes | **Fail** |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **n/a** for full corpus; **this session: `1` escalate/ask : `0` ticket-scope guesses** (1 transcript file available) |
| **How measured** | Only one agent transcript was present under `agent-transcripts/` in this runner. Prior report’s **29 asks : 1 guess / 38 sessions** could **not** be re-counted (older transcripts absent). This Backlog session did **not** invent an In Progress queue after Jira **401**; it stopped and escalated for credential repair. |
| **What it tells us** | Historical ask/guess ratio is unverifiable here; the live run correctly refused to invent ticket work without an authenticated queue. |

---

## Top reliability risk

**Jira REST auth is broken in headless Backlog runs** — `JIRA_EMAIL` + `JIRA_API_TOKEN` Basic auth returns **401** on `/rest/api/3/myself`; unauthenticated `/search/jql` returns an empty `issues` array (looks like “no tickets” but is not a valid queue). Recurring `chore/eval-report-*` PRs (#38–#55) show the same blocker across many scheduled runs.

Secondary: flake rate is currently **unmeasurable** because Playwright run logs/JUnit artifacts have expired.

## Next action

1. **Human:** rotate/repair GitHub secrets `JIRA_API_TOKEN` (and confirm `JIRA_EMAIL` matches the Atlassian account that can see project **DS**); verify with `GET /rest/api/3/myself` → 200 and `project = DS` search returns issues.  
2. Re-run Backlog mode after auth works; require Generation gate `test` success before `tests-generated`.  
3. Keep `suite-reliability-eval` on every Backlog REPORT; prefer JUnit artifacts over expired logs for flake.
