# Programs — AI Generation Config panel (discovered)

Exploration baseline: `cypress/e2e/ds1-create-program.cy.js` (DS-1 create-program flows).
Live UI explored via accessibility tree on `https://test.didaxis.studio/programs` (this session).

## Coverage snapshot

- Page: `/programs` (New Program modal)
- Already covered (Cypress DS-1): open form (TC-001), Program Name focus (TC-002),
  create with name+description (TC-003), reload persistence (TC-004), Create
  enablement on name (TC-005), optional description (TC-006), empty/whitespace
  name negatives (TC-N-001/002), Escape dismiss + draft retention (TC-N-003/004),
  trim/length/special-char edge cases (TC-E-*)
- Not covered in Cypress DS-1: **▸ Show AI Generation Config** toggle, collapsed
  vs expanded field visibility, default session/exam hour values, sync/async ratio
  slider, Cancel-button draft retention (Escape only), keyboard-open modal
- Explored via a11y tree: this session

## Selected gap (one flow)

**Flow:** Expand and collapse the AI Generation Config section in the New Program modal

**Why this one:** The modal exposes a collapsible config region (hours, audience,
focus areas, sync/async slider) that Cypress DS-1 never opens or asserts; it is
a distinct UI surface from the name/description happy path and easy to regress silently.

## Gherkin test plan

Feature: Programs — AI Generation Config panel (discovered)

  # Positive path
  Scenario: Expanding AI Generation Config reveals scheduling and audience fields
    Given I am logged in as admin
    And I am on the Programs page
    When I click "+ New Program"
    And I click "▸ Show AI Generation Config"
    Then I see the dialog "New Program"
    And I see the textbox "Total Program Hours"
    And I see the text "Required for AI curriculum generation"
    And I see the textbox "Default Session Hours" with value "4"
    And I see the textbox "Default Exam Hours" with value "3"
    And I see the textbox "Target Audience"
    And I see the textbox "Focus Areas"
    And I see the text "Sync/Async Ratio: 70% sync / 30% async"

  # Edge case
  Scenario: Hiding AI Generation Config collapses the extended fields
    Given I am logged in as admin
    And I am on the Programs page
    And I have opened the New Program modal
    And I have expanded AI Generation Config
    When I click "▾ Hide AI Generation Config"
    Then I see the button "▸ Show AI Generation Config"
    And I do not see the textbox "Total Program Hours"
    And I do not see the textbox "Target Audience"
    And the button "Create" is disabled

## Locator hints (from a11y tree)

- New Program entry: `button "+ New Program"`
- Modal: `dialog "New Program"` / `heading "New Program" [level=2]`
- Expand control: `button "▸ Show AI Generation Config"`
- Collapse control: `button "▾ Hide AI Generation Config"`
- Total Program Hours: `textbox "Total Program Hours"` (placeholder `e.g. 900`)
- Default Session Hours: `textbox "Default Session Hours"` (default `"4"`)
- Default Exam Hours: `textbox "Default Exam Hours"` (default `"3"`)
- Target Audience: `textbox "Target Audience"`
- Focus Areas: `textbox "Focus Areas"`
- Sync/async label: text `Sync/Async Ratio: 70% sync / 30% async`
- Cancel: `button "Cancel"`
- Create: `button "Create"`

## For test-writer

- **Incorporated into DS-1** (no new spec file):
  - Playwright: `tests/ds1-create-program.spec.ts` — TC-001b (collapsed), TC-001c
    (expand), TC-E-008 (collapse); TC-N-006/007 expand before hours fill
  - Cypress: `cypress/e2e/ds1-create-program.cy.js` — same case IDs
- POM: `expandAiGenerationConfig()` / `collapseAiGenerationConfig()` on
  `NewProgramModal` (Playwright + Cypress)
