# DS-5 – Program list filtering and display

**Jira:** [DS-5 – Program list filtering and display](https://legionqaschool.atlassian.net/browse/DS-5)  
**User story:** As an admin user, I want to view all programs in a list with key details so that I can quickly find and manage them.

Feature: Program list filtering and display
  An authenticated admin navigates to the Programs page and sees each program's
  name and description in a list. When no programs exist, an empty state with a
  create-first-program prompt is shown.

  # Happy paths

  Scenario: Display program list with key details
    Given I am logged in as admin
    And programs exist in the system:
      | Program Name                    | Description                                      |
      | Web Development 2026              | Full-stack cohort starting January 2026          |
      | Data Science 2026                 | Python, ML, and data engineering track           |
      | Informatique & IA - Niveau 2      | Cycle secondaire — sciences et numérique         |
    When I navigate to the Programs page
    Then I see a list showing each program's name and description
    And the row for "Web Development 2026" shows "Full-stack cohort starting January 2026"
    And the row for "Data Science 2026" shows "Python, ML, and data engineering track"
    And the row for "Informatique & IA - Niveau 2" shows "Cycle secondaire — sciences et numérique"

  Scenario: Empty state when no programs exist
    Given no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program

  Scenario: List remains correct after refresh when programs exist
    Given a program "Web Development 2026" exists with Description "Full-stack cohort starting January 2026"
    And I am on the Programs page
    When I reload the page
    Then I see a list showing "Web Development 2026" and its description

  Scenario: Single program displays name and description without empty-state copy
    Given exactly one program "Test Program" exists with Description "Smoke test program for list UI"
    When I navigate to the Programs page
    Then I see a row showing "Test Program" and "Smoke test program for list UI"
    And I do not see a message indicating no programs have been created

  # Negative

  Scenario: Empty state must not appear when programs exist
    Given a program "Web Development 2026" exists
    When I navigate to the Programs page
    Then I see at least one program row in the list
    And I do not see a message indicating no programs have been created
    And I see the "+ New Program" button

  Scenario: List must not swap name and description in the row
    Given a program "DS-2026" exists with Description "This is intentionally longer text for column alignment testing."
    When I navigate to the Programs page
    Then the program name "DS-2026" appears before the description in the row
    And the row shows "DS-2026" and the full description text

  Scenario: API or network failure must not show a false empty state
    Given programs exist in the system
    And the programs list request will fail
    When I navigate to the Programs page
    Then I see an error state
    And I do not see a message indicating no programs have been created

  Scenario: Unauthorized user must not see program list content
    Given I am not authenticated or lack Programs page permission
    When I navigate to the Programs page
    Then I am redirected to login or see an access denied message
    And no program names are rendered

  Scenario: Program list must not expose programs the user cannot see
    Given I am logged in as a user with restricted program access
    When I navigate to the Programs page
    Then I see only programs I am permitted to view

  # Edge cases

  Scenario: Very long Description displays without breaking the row layout
    Given a program "Web Development 2026" exists with a 500-character description
    When I navigate to the Programs page
    Then the row for "Web Development 2026" is visible
    And the description text is displayed in the row without breaking the layout

  Scenario: Very long Program name displays in the list row
    Given a program with a 255-character name exists
    When I navigate to the Programs page
    Then the full program name is visible in the list row

  Scenario: Special characters and HTML-like text render safely in list
    Given a program "R&D \"Phase 1\" - Cost: 100%" exists with Description "Learn <HTML> & \"quotes\" — 50% practice."
    When I navigate to the Programs page
    Then the row shows "R&D \"Phase 1\" - Cost: 100%" as plain text
    And the row shows "<HTML>" as plain text
    And no JavaScript alert dialog is triggered

  Scenario: Unicode and accented text display correctly in name and description
    Given a program "École d'été — Zürich" exists with Description "日本語サマー — cohort mixte."
    When I navigate to the Programs page
    Then the row shows "École d'été — Zürich" correctly
    And the row shows "日本語サマー — cohort mixte." correctly

  Scenario: Empty Description shows name with blank or minimal description area
    Given a program "Minimal Program 2026" exists with an empty Description
    When I navigate to the Programs page
    Then the row shows "Minimal Program 2026"
    And the description area is blank or shows a minimal placeholder

  Scenario: Duplicate program names show two distinguishable rows
    Given two programs named "Test Program" exist with descriptions "Cohort A" and "Cohort B"
    When I navigate to the Programs page
    Then I see two rows named "Test Program"
    And one row shows "Cohort A" and the other shows "Cohort B"

  Scenario: List shows correct paired name and description for programs sharing a description
    Given programs "Alpha Track" and "Beta Track" exist with Description "Shared boilerplate text."
    When I navigate to the Programs page
    Then the row for "Alpha Track" shows "Shared boilerplate text."
    And the row for "Beta Track" shows "Shared boilerplate text."

  Scenario: Search or filter by name narrows list without losing column data
    Given programs "Web Development 2026", "Web Design 2026", and "Data Science 2026" exist
    And the Programs page has a search or filter control
    When I search for "Web Dev"
    Then the list shows only matching programs
    And each visible row still shows the program name and description

  Scenario: Filter that matches nothing shows zero-result copy
    Given programs exist in the system
    And the Programs page has a search or filter control
    When I search for "zzzz-no-match-12345"
    Then I see zero matching rows
    And I see a message such as "No programs match your search"
    And I do not see a message indicating no programs have been created

<!--
Ambiguities and gaps (not specified in DS-5 acceptance criteria):

1. Feature name vs. ACs — The ticket title references "filtering", but the Jira ACs
   only cover default list display and empty state. Verified: test.didaxis.studio has
   no search/filter control on the Programs page (TC-017, TC-018 are N/A until implemented).

2. List layout — Verified: name and description appear together in the first column,
   not as separate labeled columns. AC wording implies both fields are visible per row.

3. "Programs exist in the system" — Scope unclear (all tenants vs. current user's org);
   affects permission and empty-state testing.

4. Additional columns — ACs require name and description only; the live UI also shows
   row action buttons (edit, delete) but no Start date or Status columns.

5. Empty description — Not covered in ACs; verified empty Description shows name with
   minimal or blank description area.

6. Empty state exact copy — Wording of "no programs" message and CTA label not specified;
   empty-state testing requires a tenant with zero programs.

7. Error vs. empty — Distinction between "zero results" and "X "failed to load" is
   not in ACs; a failed API must not show the global empty state.

8. Duplicate names — Whether two programs may share a name is unstated. Verified:
   duplicate names are allowed (SS-25); two rows with the same name are distinguishable
   by description.

9. Pagination / performance — No NFR in ACs for lists with 100+ programs.

10. Real-time updates — If another user creates a program, whether the list auto-refreshes
    is not specified.
-->
