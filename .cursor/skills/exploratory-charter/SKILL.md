---
name: exploratory-charter
description: >-
  Turns a feature + a risk into a session-based exploratory testing charter and
  a findings template. Use when the user asks for an exploratory charter,
  session charter, ET charter, "charter this feature", "explore with a risk",
  or wants a findings log for a time-boxed exploratory session. The human does
  the thinking and the session; this skill only keeps the format. Do NOT use for
  ticket → Gherkin (jira-ticket-analyzer), coverage-gap → Gherkin
  (explore-and-generate), or writing Playwright specs (test-writer).
---

# Exploratory Charter

Format only. You do not invent risks, design the tour, or run the session —
the human brings the feature, the risk, and the judgment. Fill the templates
below from what they give you; ask once if either input is missing.

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| **Feature** | Yes | Area, page, flow, or change under test (e.g. "Programs list filters") |
| **Risk** | Yes | What could go wrong / what matters (e.g. "stale results after delete") |
| Time box | Optional | Default 45–60 min if unspecified |
| Environment / build | Optional | Leave blank in the charter if unknown |

## Do / Don't

| Do | Don't |
|----|-------|
| Emit charter, then findings template | Write Gherkin, specs, or POMs |
| Keep fields short (one line where possible) | Expand into a full test plan |
| Leave blank lines for the human to fill during/after the session | Pretend you ran the session or invent findings |
| Point bugs to `jira-bug-reporter` when they ask to file | File Jira or heal locators from this skill |

## Step 1 — Charter

Output exactly this structure (fill from inputs; keep `Notes for the session` empty for the human):

```markdown
# Charter: <short title from feature + risk>

| Field | Value |
|-------|-------|
| **Feature** | <feature> |
| **Risk / focus** | <risk> |
| **Mission** | Explore <feature> with attention to <risk>. |
| **Time box** | <N min> |
| **Environment** | <env or _TBD_> |
| **Out of scope** | Automated regression; unrelated areas |

## Charter statement

Explore **<feature>** to learn whether **<risk>** shows up in real use.
Prefer questions over scripts. Stop when the time box ends.

## Notes for the session

- (human)
```

## Step 2 — Findings template

After the charter, output this blank log for the human to complete during/after
the session. Do not pre-fill findings.

```markdown
# Findings: <same title>

| Field | Value |
|-------|-------|
| **Charter** | <title> |
| **Session date** | |
| **Tester** | |
| **Time used** | / <time box> |
| **Build / env** | |

## Bugs

| # | Summary | Severity | Repro notes | Follow-up |
|---|---------|----------|-------------|-----------|
| 1 | | | | |

## Questions / uncertainties

-
-

## Interesting behavior (not bugs)

-
-

## Coverage ideas (candidates for automation later)

-
-

## Session debrief

| Prompt | Notes |
|--------|-------|
| Did we address the risk? | |
| What would you charter next? | |
| Anything to hand to test-writer / jira-bug-reporter? | |
```

## Handoffs

| Outcome | Next |
|---------|------|
| Confirmed bug | `jira-bug-reporter` / bug-reporter |
| Stable flow worth automating | Human reviews → Gherkin via explore-and-generate or jira-ticket-analyzer → test-writer |
| More exploration needed | New charter (new risk or narrower feature) |
