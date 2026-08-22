# Suite reliability eval report

**As of:** 2026-08-22  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts.

---

## Flake rate

| | |
|---|---|
| **Number** | **0%** — `0` flaky / `40` concluded testcases in **2** of the last **20** completed `playwright.yml` runs with downloadable JUnit artifacts; **18** older runs had expired artifacts (measurement gap) |
| **How measured** | `gh run list --workflow=playwright.yml --limit 20` → `gh run download <id>` for `playwright-junit-*` / `junit-results.xml`. Runs **31205910102** (22 tests) and **31205683508** (18 tests): all `failures="0"`, no flaky markers. Remaining 18 runs in the window: artifact download failed (retention expired). Config uses `retries: 2` on CI; a pass-only-on-retry would appear as flaky in JUnit or Playwright summary. |
| **What it tells us** | In the measurable recent window the suite is stable — no retry-only passes. Full 20-run denominator cannot be reconstructed until more runs accumulate with retained JUnit. |

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | PR history (`gh pr list` / `fix/self-heal-*`): only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal. Diff is POM-only (`pages/programs.page.ts` `input` → `button`); **no `tests/**` files changed** (assertions untouched). Linked triage run [28054883297](https://github.com/svetlanasevcencog-png/homework/actions/runs/28054883297); PR CI was green. PRs #21 / #24 / #25 are skill/docs only — excluded from the heal denominator. Masked-regression count = assertion/spec weakenings or “heal” of a real app bug; none found. |
| **What it tells us** | The one heal stayed inside the contract (POM-only, assertions unchanged); the masked-regression budget is intact at **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort = merged `qa/ds-*` PRs that ship or tighten ticket specs under the agent pipeline: **#17** (DS-3) and **#18** (DS-119). Early DS-1–DS-5 specs landed on `main` without PRs and are **out of scope** for a first-PR gate. For each PR: (1) **green** = first `pull_request` Playwright job `test` success via `gh pr checks`; (2) **conforming** = diff has no `waitForTimeout` / `page.locator` / CSS-XPath defaults, role-based POM usage; (3) **maps-to-AC** = `features/*.feature.md` in the PR and/or explicit Gherkin/AC linkage in the PR body. No new `qa/ds-*` generation PRs since the last eval. |
| **What it tells us** | Half of agent generation PRs cleared the gate; the miss was missing CI, not bad locators. Backlog queue is empty (all In Progress DS tickets already labeled `tests-generated`), so no new gate data this run. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes (spec-only, no banned patterns) | Yes (body cites Gherkin plan / TCs) | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA; `gh pr checks` reported none | Yes (`getByRole`, no `waitForTimeout` / `page.locator`) | Yes (`features/DS-119.feature.md` + DS-119 link) | **Fail** |

### Mitigations in place

- **Orchestrator Generation gate** — after `gh pr create`, require Playwright job `test` success; empty/red → stop, no `tests-generated` label (`.cursor/rules/qa-orchestrator.mdc`, `.github/qa-orchestrator-prompt.md`).
- **Branch protection on `main`** — required status check context **`test`** (strict, up-to-date with base).
- **JUnit artifact** — `playwright.yml` emits `junit-results.xml` for flake scraping.

Re-measure generation-gate on the next `qa/ds-*` PR; target is **100%** with empty-check merges blocked.

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **0 asks : 0 guesses** (this backlog run session); prior baseline **29 asks : 1 guess** across **38** sessions (2026-07-09 eval) |
| **How measured** | This run: headless Backlog orchestrator with empty queue — no clarifying questions or invented values. Prior: session review of Cursor agent transcripts under `agent-transcripts/` (no product telemetry). |
| **What it tells us** | Empty-queue runs are low-risk for guess errors; the prior single invent (assuming ticket scope) remains the main footgun when tickets are processed. |

---

## Top reliability risk

**Artifact retention limits long-window flake measurement** — only 2 of the last 20 `playwright.yml` runs retained downloadable JUnit; flake rate over the full window is under-reported until retention is extended or metrics are scraped closer to run time.

**Remaining risk:** agents that skip the orchestrator (manual `gh pr create` / direct push paths) still need humans to wait for CI; protection blocks merge to `main` without `test`, but does not stop opening a PR that never gets a run if the workflow is misconfigured.

## Next action

When new In Progress DS tickets appear without `tests-generated`, process them through the full Backlog flow and confirm the first `qa/ds-*` PR shows `test` → success before labeling. Extend JUnit artifact retention or add a scheduled flake scrape so the 20-run window is fully measurable.
