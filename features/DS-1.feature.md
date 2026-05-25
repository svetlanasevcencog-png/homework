# DS-1 – Create new academic program

**Jira:** [DS-1 – Create new academic program](https://legionqaschool.atlassian.net/browse/DS-1)  
**User story:** As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.

Feature: Create new academic program
  An authenticated admin opens the Programs page and creates a new academic program
  via a modal form with Program Name and Description fields.

  # Happy paths

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields: Program Name, Description
    And the Create button is visible
    And the Create button is disabled

  Scenario: Opening the form reveals an interactive Program Name field
    Given I am logged in as admin
    And I am on the Programs page
    When I click "+ New Program"
    And I click into the Program Name field
    Then the Program Name field is visible and editable
    And the Program Name field has keyboard focus

  Scenario: Successfully create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  Scenario: Newly created program persists across reload
    Given I am logged in as admin
    And a program named "Web Development 2026" exists in the Programs list
    When I reload the Programs page
    Then the program list shows "Web Development 2026"

  Scenario: Create button becomes enabled as soon as Program Name has content
    Given I am on the program creation form
    And the Create button is disabled
    When I fill in Program Name with "W"
    Then the Create button is enabled

  Scenario: Description is optional
    Given I am on the program creation form
    When I fill in Program Name with "Data Science 2026"
    And I leave Description empty
    And I click Create
    Then the modal closes
    And the program list shows "Data Science 2026"

  # Negative

  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled

  Scenario: Create button stays disabled when only Description is filled
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And no new program is created

  Scenario: Whitespace-only Program Name does not enable Create
    Given I am on the program creation form
    When I fill in Program Name with "     "
    And I move focus to Description
    Then the Create button is disabled
    And no program is created

  Scenario: Closing the modal discards the entry
    Given I am on the program creation form
    When I fill in Program Name with "Throwaway"
    And I fill in Description with "Should not be saved"
    And I dismiss the modal by pressing Escape
    Then the modal closes
    And the program list does not show "Throwaway"
    And after I reload the Programs page the program list still does not show "Throwaway"

  Scenario: Re-opening the form after dismiss retains previously entered values
    Given I am on the program creation form
    And I fill in Program Name with "Draft Program"
    And I fill in Description with "Should not be saved"
    And I dismiss the modal by pressing Escape
    When I click "+ New Program"
    Then the Program Name field contains "Draft Program"
    And the Description field contains "Should not be saved"
    And the Create button is enabled

  # Edge cases

  Scenario: Leading and trailing whitespace in Program Name is trimmed on submit
    Given I am on the program creation form
    When I fill in Program Name with "   Web Development 2026   "
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program list does not show "   Web Development 2026   "

  Scenario: 255-character Program Name is accepted
    Given I am on the program creation form
    When I fill in Program Name with a 255-character string
    And I click Create
    Then the modal closes
    And the program list shows the full 255-character Program Name

  Scenario: Long Description of 2000 characters is accepted
    Given I am on the program creation form
    When I fill in Program Name with "Long Description Program 2026"
    And I fill in Description with a 2000-character string
    And I click Create
    Then the modal closes
    And the program list shows "Long Description Program 2026"

  Scenario: Special characters and HTML in Program Name are stored as plain text
    Given I am on the program creation form
    When I fill in Program Name with "<script>alert(1)</script>"
    And I fill in Description with "O'Brien & \"Co.\""
    And I click Create
    Then the modal closes
    And the program list shows "<script>alert(1)</script>"
    And no JavaScript alert dialog is triggered

  Scenario: Non-Latin scripts and emojis are accepted verbatim
    Given I am on the program creation form
    When I fill in Program Name with "任务一 / مهمة / задача"
    And I fill in Description with "🚀 Multilingual program 🔥"
    And I click Create
    Then the modal closes
    And the program list shows "任务一 / مهمة / задача"

  Scenario: Short Program Name with a single-letter prefix is accepted
    Given I am on the program creation form
    When I fill in Program Name with "A"
    And I click Create
    Then the modal closes
    And the program list shows "A"

  Scenario: Rapid double-click on Create does not create duplicate programs
    Given I am on the program creation form
    When I fill in Program Name with "Idempotent Program"
    And I double-click Create
    Then the modal closes
    And the program list shows exactly one entry named "Idempotent Program"

<!--
Ambiguities and gaps (not specified in DS-1 acceptance criteria):

1. Maximum field length — ACs do not define the upper bound for Program Name or
   Description. Live app accepts 255-character names and 2000-character descriptions;
   behavior when exceeding the real cap (hard truncate vs. validation error) is unknown.

2. Duplicate Program Names — ACs do not state whether two programs may share the same
   name. Product decision needed before adding a duplicate-name scenario.

3. Description required vs. optional — AC-2 shows both fields filled; AC-3 only
   validates Program Name. Confirmed on live app: Description is optional.

4. Modal dismiss behavior — ACs do not specify whether form state resets on dismiss.
   Verified: Escape/Cancel close the modal without persisting the program, but
   previously entered values remain when the modal is reopened.

5. Form auto-focus — AC-1 does not specify which field receives focus on open.
   Verified: focus lands on the close button, not Program Name.

6. Non-admin access — user story says "As an admin user"; non-admin behavior
   (+ New Program hidden or blocked) is not covered by the ACs and needs a
   separate test account.

7. Idempotent submit — rapid double-click on Create currently creates duplicate
   programs (linked bug DS-17 / SS-26). Desired behavior is single submission.

8. Confluence reference — ticket points to "Program Setup & Management > Overview";
   not cross-checked against this test plan.

9. Server error handling — ACs do not define behavior when the create API returns
   an error (e.g. 500).

10. List ordering — AC-2 asserts presence in the list but not sort order of new entries.
-->
