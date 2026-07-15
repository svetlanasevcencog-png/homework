# Suite reliability eval report

**As of:** 2026-07-15  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Backlog run:** queue empty — all 9 in-progress DS tickets already carry `tests-generated`; 0 tickets processed this run.  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI artifacts, PR history, and agent session transcripts.

---

## Flake rate

| | |
|---|---|
| **Number** | **0%** — `0` flaky / `138` concluded tests (`passed` + `failed` + `flaky`) across **7** of the last 20 completed `playwright.yml` runs with JUnit artifacts |
| **How measured** | `gh run list --workflow=playwright.yml --limit 20` → download `playwright-junit-*` artifacts via `gh api …/artifacts/<id>/zip` → parse `junit-results.xml` testcase counts. **13** runs in the window had no JUnit artifact (pre-artifact merges, docs-only, or Cypress-only jobs) — excluded from the denominator. `gh run view --log` returned empty in this headless environment; JUnit used instead. |
| **What it tells us** | In the measurable window the suite shows no retry-only passes; green means first-attempt green for the sanity subset that ran. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | PR history (`gh pr list --search "fix/self-heal"`): only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal. Diff is POM-only (`pages/programs.page.ts` `input` → `button`); **no `tests/**` files changed** (assertions untouched). Linked triage run [28054883297](https://github.com/svetlanasevcencog-png/homework/actions/runs/28054883297). PRs #21 / #24 / #25 are skill/docs only — excluded. No new `fix/self-heal-*` PRs since last eval. |
| **What it tells us** | The one heal stayed inside the contract (POM-only, assertions unchanged); masked-regression budget remains **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort = merged `qa/ds-*` PRs that ship or tighten ticket specs: **#17** (DS-3) and **#18** (DS-119). No new `qa/ds-*` PRs merged since 2026-07-09. For each PR: (1) **green** = first `pull_request` Playwright job `test` success; (2) **conforming** = no `waitForTimeout` / CSS-XPath defaults, role-based POM; (3) **maps-to-AC** = `features/*.feature.md` and/or explicit Gherkin linkage. |
| **What it tells us** | Half of agent generation PRs cleared the gate; the miss was missing CI (#18), not bad locators. Orchestrator gate + branch protection on `test` are in place; no new generation PRs to re-score this run. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA | Yes | Yes | **Fail** |

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **0 asks : 0 guesses** (this backlog run; **1** agent session in project transcripts) |
| **How measured** | Session review of Cursor agent transcripts under `agent-transcripts/` for this run. Prior baseline (2026-07-09): **29 asks : 1 guess** across **38** sessions. This run had no ticket scope decisions to ask or guess about — queue was empty after `tests-generated` filter. |
| **What it tells us** | Empty-queue runs avoid scope-invention risk; when tickets resume, continue confirming ambiguous AC before generating specs. |

---

## Top reliability risk

**Backlog stall when all in-progress tickets are labeled but app defects remain open** — DS-120 (dashboard navigation bug) and DS-129 (case-insensitive duplicate fix) are in progress with `tests-generated`, so the orchestrator skips them even though underlying work may not be done. Humans must clear or relabel tickets when follow-up test work is needed.

## Next action

When new DS stories enter **In Progress** without `tests-generated`, confirm the orchestrator Generation gate (`test` check green) before labeling. Consider a Jira filter or label policy so bug/fix tickets (DS-120, DS-129) do not block discovery of net-new story coverage.
