# Suite reliability eval report

**As of:** 2026-07-09  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts.

---

## Flake rate

| | |
|---|---|
| **Number** | **0%** — `0` flaky / `1732` concluded tests (`passed` + `failed` + `flaky`) across the **last 20** completed `playwright.yml` runs |
| **How measured** | `gh run list --workflow=playwright.yml` → `gh run view <id> --log` for each of the last 20 completed runs; parsed Playwright summary lines (`N passed` / `N failed` / `N flaky`). Config uses `retries: 2` on CI (`playwright.config.ts`), so a pass-only-on-retry would appear as `flaky` in the summary. Going forward, CI also uploads `playwright-junit-<suite>` (`junit-results.xml`) for the same scrape without log greps. |
| **What it tells us** | In this window the suite is not papering over failures with retries — green means first-attempt green (or no tests ran). |

**Window detail:** 18 runs with test execution (including post-tag smoke/sanity subsets); 2 runs failed with `No tests found` after `@sanity` filtering (PR #30) — counted as zero flaky, not as flake.

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | PR history (`gh pr list` / `fix/self-heal-*`): only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal. Diff is POM-only (`pages/programs.page.ts` `input` → `button`); **no `tests/**` files changed** (assertions untouched). Linked triage run [28054883297](https://github.com/svetlanasevcencog-png/homework/actions/runs/28054883297); PR body documents local re-run green; PR CI was green. PRs #21 / #24 / #25 are skill/docs only — excluded from the heal denominator. Masked-regression count = assertion/spec weakenings or “heal” of a real app bug; none found. |
| **What it tells us** | The one heal stayed inside the contract (POM-only, assertions unchanged); the masked-regression budget is intact at **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR *(baseline before the fix below)* |
| **How measured** | Cohort = merged `qa/ds-*` PRs that ship or tighten ticket specs under the agent pipeline: **#17** (DS-3) and **#18** (DS-119). Early DS-1–DS-5 specs landed on `main` without PRs and are **out of scope** for a first-PR gate. For each PR: (1) **green** = first `pull_request` Playwright run success via `gh` / checks; (2) **conforming** = diff has no `waitForTimeout` / `page.locator` / CSS-XPath defaults, role-based POM usage; (3) **maps-to-AC** = `features/*.feature.md` in the PR and/or explicit Gherkin/AC linkage in the PR body. |
| **What it tells us** | Half of agent generation PRs cleared the gate; the miss was missing CI, not bad locators. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes (spec-only, no banned patterns) | Yes (body cites Gherkin plan / TCs) | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA; `gh pr checks` reported none | Yes (`getByRole`, no `waitForTimeout` / `page.locator`) | Yes (`features/DS-119.feature.md` + DS-119 link) | **Fail** |

### Fix applied (this change)

- **Orchestrator Generation gate** — after `gh pr create`, require Playwright job `test` success; empty/red → stop, no `tests-generated` label (`.cursor/rules/qa-orchestrator.mdc`, `.github/qa-orchestrator-prompt.md`).
- **Branch protection on `main`** — required status check context **`test`** (strict, up-to-date with base).
- **JUnit artifact** — `playwright.yml` emits `junit-results.xml` for flake scraping.

Re-measure generation-gate on the next `qa/ds-*` PR; target is **100%** with empty-check merges blocked.

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **29 asks : 1 guess** (across **38** agent sessions in this project’s transcripts) |
| **How measured** | Session review of Cursor agent transcripts under `agent-transcripts/` (no product telemetry). Counted assistant turns that asked the user for a missing decision/value (`Want me to…?`, `Do you have…?`, `Which…?`, `Could you…?`) vs turns that invented a missing value (`I'll assume you mean…`). Deduped near-duplicate invent phrasings in the same turn. |
| **What it tells us** | The agent usually stops for confirmation; the one invent (assuming “DS-1 and DS-2” when the user said something else) is rare but real — still a reliability footgun on ticket scope. |

---

## Top reliability risk

~~**Generated ticket PRs can merge without a first-PR Playwright signal**~~ — **mitigated:** orchestrator Generation gate + `main` requires check `test`.

**Remaining risk:** agents that skip the orchestrator (manual `gh pr create` / direct push paths) still need humans to wait for CI; protection blocks merge to `main` without `test`, but does not stop opening a PR that never gets a run if the workflow is misconfigured.

## Next action

On the next ticket generation PR: confirm `gh pr checks` shows `test` → success before applying `tests-generated`, and scrape flake from the new `playwright-junit-*` artifact instead of log greps.
