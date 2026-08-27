# Suite reliability eval report

**As of:** 2026-08-27  
**Scope:** Didaxis Playwright suite + QA harness (agents/skills/CI)  
**Backlog run:** Empty queue — all 11 In Progress DS tickets already carry `tests-generated`; no ticket specs, labels, or bugs changed.  
**Note:** Cursor has no built-in telemetry for flake, heal, generation-gate, or ask-vs-guess. Every number below was measured manually from CI logs, PR history, and agent session transcripts.

---

## Flake rate

| | |
|---|---|
| **Number** | **0%** — `0` flaky / `40` concluded tests (`passed` + `failed` + `flaky`) across the **last 20** completed `playwright.yml` runs |
| **How measured** | `gh run list --workflow=playwright.yml` → download `playwright-junit-*` artifacts where available; parse `junit-results.xml`. Of 20 completed runs: **2** had JUnit (runs [31205910102](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205910102) — 22 tests; [31205683508](https://github.com/svetlanasevcencog-png/homework/actions/runs/31205683508) — 18 tests), **2** were `action_required` eval-report PRs with no test job, **16** had expired or missing JUnit artifacts. Config uses `retries: 2` on CI (`playwright.config.ts`). |
| **What it tells us** | In the measurable window there is no retry-only pass signal; older runs in the window lack artifacts so the denominator is smaller than ideal. |

**Window detail:** 2 eval-report PR runs (`action_required`, no tests executed); 16 older runs had no retrievable JUnit — not counted as flake.

---

## Heal success rate

| | |
|---|---|
| **Number** | **100%** — `1` clean heal / `1` drift heal; **masked regressions: `0`** |
| **How measured** | PR history (`gh pr list --search "fix/self-heal"`): only **PR #22** ([Self-heal: restore Edit button role](https://github.com/svetlanasevcencog-png/homework/pull/22)) is a real drift heal. Diff is POM-only (`pages/programs.page.ts` `input` → `button`); **no `tests/**` files changed** (assertions untouched). Linked triage run [28054883297](https://github.com/svetlanasevcencog-png/homework/actions/runs/28054883297); PR CI was green. No new `fix/self-heal-*` PRs since last eval. Masked-regression count = assertion/spec weakenings or “heal” of a real app bug; none found. |
| **What it tells us** | The one heal stayed inside the contract (POM-only, assertions unchanged); the masked-regression budget is intact at **0**. |

---

## Generation-gate pass rate

| | |
|---|---|
| **Number** | **50%** — `1` / `2` harness-era generation PRs passed all three gates on the first PR |
| **How measured** | Cohort = merged `qa/ds-*` PRs that ship or tighten ticket specs under the agent pipeline: **#17** (DS-3) and **#18** (DS-119). Early DS-1–DS-5 specs landed on `main` without PRs and are **out of scope** for a first-PR gate. No new `qa/ds-*` generation PRs since last eval. For each PR: (1) **green** = first `pull_request` Playwright job `test` success; (2) **conforming** = no `waitForTimeout` / CSS-XPath defaults, role-based POM; (3) **maps-to-AC** = `features/*.feature.md` and/or Gherkin/AC linkage. |
| **What it tells us** | Half of agent generation PRs cleared the gate; the miss was missing CI (PR #18), not bad locators. All 11 In Progress tickets now labeled — backlog queue is empty. |

| PR | Green on first PR | Conforming | Maps-to-AC | Gate |
|----|-------------------|------------|------------|------|
| [#17](https://github.com/svetlanasevcencog-png/homework/pull/17) DS-3 tighten | Yes (run [27855459102](https://github.com/svetlanasevcencog-png/homework/actions/runs/27855459102)) | Yes | Yes | **Pass** |
| [#18](https://github.com/svetlanasevcencog-png/homework/pull/18) DS-119 generate | **No** — `0` workflow runs on head SHA | Yes | Yes | **Fail** |

### Mitigations in place

- **Orchestrator Generation gate** — require Playwright job `test` success before `tests-generated` label (`.cursor/rules/qa-orchestrator.mdc`).
- **Branch protection on `main`** — required status check context **`test`**.
- **JUnit artifact** — `playwright.yml` emits `junit-results.xml` for flake scraping.

Re-measure on the next `qa/ds-*` PR; target is **100%** with empty-check merges blocked.

---

## Ask-vs-guess

| | |
|---|---|
| **Number** | **n/a** — only **1** agent session transcript visible in this environment (current backlog run); prior baseline was **29 asks : 1 guess** across **38** sessions (2026-07-09 eval) |
| **How measured** | Session review of Cursor agent transcripts under `agent-transcripts/` (no product telemetry). Most historical transcripts are not present in this CI workspace; cannot re-count without the full transcript archive. |
| **What it tells us** | Ask-vs-guess trend is unchanged since last full measurement; re-sample when transcript archive is available locally. |

---

## Top reliability risk

**Artifact retention gap** — 16 of 20 recent `playwright.yml` runs had no retrievable JUnit, limiting flake-rate precision. Eval-report-only PRs also queue with `action_required` and no `test` job, which is expected but adds noise to the run window.

**Secondary risk:** agents that skip the orchestrator (manual PR paths) still need humans to wait for CI; branch protection blocks merge without `test`, but does not prevent opening a PR that never gets a run if workflow path filters skip it.

## Next action

Keep `suite-reliability-eval` mandatory on every orchestrator Done / Backlog REPORT. When new In Progress tickets appear without `tests-generated`, process them through analyze → test-writer → local run → PR → Generation gate before labeling. Consider extending JUnit artifact retention so flake windows stay meaningful across 20 runs.
