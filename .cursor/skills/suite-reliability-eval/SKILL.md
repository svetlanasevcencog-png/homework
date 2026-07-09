---
name: suite-reliability-eval
description: >-
  Measures suite reliability and updates eval-report.md (flake rate, heal
  success + masked regressions, generation-gate pass rate, ask-vs-guess). Use
  whenever the QA orchestrator finishes a ticket or backlog run, or when the
  user asks for a reliability / eval report. Cursor has no built-in telemetry —
  measure from CI logs, JUnit artifacts, PR history, and session transcripts.
---

# Suite reliability eval

**Mandatory** for the QA orchestrator: do not mark a ticket or backlog run
**Done** until `eval-report.md` is refreshed with this skill.

Cursor has **no built-in telemetry** for these metrics. Measure them yourself.

## Output

Update repo-root `eval-report.md`. Keep the four metric sections plus **Top
reliability risk** and **Next action**. For each metric include: the
**number**, **how you measured it**, and **one line on what it tells us**.

## Metrics (required)

### 1. Flake rate

Tests that passed only on retry, last **N** completed `playwright.yml` runs
(default N = 20).

- Prefer artifact `playwright-junit-<suite>` / `junit-results.xml` when present.
- Else parse `gh run view <id> --log` for Playwright summary `N flaky`.
- Report: `flaky / (passed + failed + flaky)` and the window size.

### 2. Heal success rate

Drift heals that landed cleanly / total drift heals, plus **masked regressions
(must be 0)**.

- Cohort: merged `fix/self-heal-*` PRs that change `pages/` (exclude skill/docs-only).
- Clean = POM-only, no `tests/**` assertion changes, re-run / PR `test` green.
- Masked regression = assertion weakened, or a real app bug “healed” instead of
  filed — count explicitly; **must stay 0**.

### 3. Generation-gate pass rate

Generated specs that were **green + conforming + maps-to-AC on the first PR**.

- Cohort: harness-era `qa/ds-*` (and similar) PRs that add/change `tests/ds*.spec.ts`.
- Green = first `pull_request` Playwright job `test` success (not local-only).
- Conforming = no `waitForTimeout` / CSS-XPath defaults; role-based POM.
- Maps-to-AC = `features/*.feature.md` and/or explicit AC/Gherkin linkage.

### 4. Ask-vs-guess

Times the agent **asked** vs **invented** a missing value.

- Review agent session transcripts for this project (no product telemetry).
- Ask = clarifying question to the user about a missing decision/value.
- Guess = `I'll assume…` / inventing ticket scope, env, or AC without asking.
- Report as `asks : guesses` and session count.

## Steps

1. Pull last N completed E2E runs (`gh run list --workflow=playwright.yml`).
2. Compute flake from JUnit artifacts or logs.
3. Scan self-heal PRs for clean vs masked.
4. Score recent generation PRs against the three gates.
5. Sample recent agent transcripts for ask vs guess.
6. Write/overwrite `eval-report.md` with dated **As of**, all four sections,
   top risk, and next action.
7. If this run is inside an open PR, include the updated `eval-report.md` in
   that PR (or open a small `chore/eval-report` PR). Never push to `main`.

## Rules

- Never invent numbers — if a source is unavailable, say so and use `n/a` with
  the measurement gap named.
- Masked-regression count must be stated explicitly even when 0.
- Do not skip this skill when the orchestrator says Done / finishes Backlog
  mode REPORT.
