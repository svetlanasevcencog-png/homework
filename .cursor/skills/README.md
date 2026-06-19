# Project skills

Cursor Agent Skills for this repository. Each skill is a folder with a `SKILL.md` file.

## Layout

```
.cursor/skills/
├── README.md
├── api-cleanup/
├── ci-failure-triage/
├── didaxis-program-deleter/
├── explore-and-generate/
├── jira-bug-reporter/
├── jira-ticket-analyzer/
├── pom-conventions/
└── <skill-name>/
    └── SKILL.md
```

## Available skills

| Skill | When to use |
|-------|-------------|
| [api-cleanup](api-cleanup/SKILL.md) | Generating or reviewing tests that create programs or other persistent Didaxis data — ensures teardown so data does not accumulate. |
| [ci-failure-triage](ci-failure-triage/SKILL.md) | A GitHub Actions CI run / PR check fails — investigate the run, classify the failure (product bug, flaky, infra, test-code), and route it to the right fix. |
| [didaxis-program-deleter](didaxis-program-deleter/SKILL.md) | Deleting specific program UUIDs via REST API, validating deletion, or explicit bulk cleanup in QA. |
| [explore-and-generate](explore-and-generate/SKILL.md) | Ticket-less coverage discovery — explore live UI via Playwright MCP, diff against existing specs, output one Gherkin plan in `features/explore-*.feature.md` for test-writer. |
| [jira-bug-reporter](jira-bug-reporter/SKILL.md) | A Playwright test fails and needs root-cause analysis plus a Jira bug ticket. |
| [jira-ticket-analyzer](jira-ticket-analyzer/SKILL.md) | Turning a Jira ticket (DS-1, DS-2, etc.) into reviewable Gherkin scenarios before writing Playwright code. |
| [pom-conventions](pom-conventions/SKILL.md) | Generating, refactoring, or reviewing Didaxis UI tests — Page Object Model layout, locators, and file structure; no inline locators in specs. |

## Adding a skill

1. Create a folder: `.cursor/skills/<skill-name>/`
2. Add `SKILL.md` with YAML frontmatter (`name`, `description`) and instructions.
3. Keep skills focused on one workflow (e.g. Didaxis test plans, Playwright conventions).

See [Cursor skills docs](https://cursor.com/docs/context/skills) or the `create-skill` skill in Cursor for full guidance.
