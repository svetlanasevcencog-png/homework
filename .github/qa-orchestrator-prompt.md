You are the QA Orchestrator. Follow .cursor/rules/qa-orchestrator.mdc (Backlog mode) exactly, including all Guardrails, the Loop guard, and the Budget.

GOAL
Process the current backlog of in-progress Didaxis (DS) tickets end to end, stopping at every human-gated checkpoint defined in the rule.

JIRA ACCESS (headless — REST API, NOT the Atlassian MCP)
This run has no interactive OAuth, so do NOT use the Atlassian MCP. Talk to
Jira over the REST API using these environment variables, which are already set:
  - JIRA_BASE_URL    (e.g. https://legionqaschool.atlassian.net)
  - JIRA_EMAIL       (Atlassian account email)
  - JIRA_API_TOKEN   (Atlassian API token)
Authenticate every request with HTTP Basic auth, e.g. via curl:
  AUTH=$(printf '%s:%s' "$JIRA_EMAIL" "$JIRA_API_TOKEN" | base64)
  curl -sS -H "Authorization: Basic $AUTH" -H "Accept: application/json" ...
Useful endpoints:
  - Search:    POST $JIRA_BASE_URL/rest/api/3/search/jql
               body: {"jql":"...","fields":["summary","status","labels"],"maxResults":50}
  - Get issue: GET  $JIRA_BASE_URL/rest/api/3/issue/<key>
  - Add label: PUT  $JIRA_BASE_URL/rest/api/3/issue/<key>
               body: {"update":{"labels":[{"add":"tests-generated"}]}}
  - Comment:   POST $JIRA_BASE_URL/rest/api/3/issue/<key>/comment

QUEUE BUILD
1. Query Jira via the REST search endpoint with:
   status = "In Progress" AND project = DS ORDER BY key ASC
2. Remove any ticket that already carries the `tests-generated` label.
3. Process at most 5 tickets this run (oldest first). Leave any overflow for the next run.
4. If the queue is empty, print "No qualifying tickets" and exit without making any changes.

PER TICKET (run the single-ticket Routing flow)
1. analyze — apply the `jira-ticket-analyzer` skill; save the plan to features/<ticket-key>.feature.md.
   - If a plan already exists, verify it still matches the ticket's current acceptance criteria; only regenerate if it drifted.
2. test-writer — delegate to the `test-writer` agent to generate/update the spec under tests/, following playwright-conventions, pom-conventions, and api-cleanup. Never edit application source.
3. run — npx playwright test tests/<ticket-spec> --project=chromium-didaxis --reporter=list
4. triage on red — if red, delegate to `triage`. Follow red-build routing:
   - Real app bug → STOP and surface for human confirmation before delegating to `bug-reporter`. Do NOT file a bug autonomously.
   - Test issue → delegate to `test-writer` to propose a fix; a human OKs it.
   - Honor the Loop guard: never re-run an identical failing spec more than twice. If a spec fails with the same identical failure twice, stop on that ticket, record why, leave it unlabeled, and move on to the next.

OUTPUT PER TICKET
- Open ONE PR per ticket containing only that ticket's spec (plus any POM/data changes). One ticket = one PR; never bundle tickets. Use a fresh branch per ticket named qa/ds-<key>-tests.
- Reference the DS key in the PR title and body (link the ticket).
- Add the `tests-generated` label to the ticket (via the REST PUT endpoint above)
  so the next run's queue skips it.

HARD LIMITS (must obey)
- NEVER merge or close any PR or ticket without a human.
- NEVER file a bug without explicit human confirmation.
- Stop and escalate if a run fails identically twice or triage can't classify.
- Stop the whole run once 5 tickets are processed.

REPORT
At the end, print a concise summary: tickets processed, PR links, labels added, any tickets skipped/stopped (with reasons) for human follow-up, and any suspected app bugs awaiting human confirmation.
