# DS-2 – Edit existing program details

**Jira:** [DS-2 – Edit existing program details](https://legionqaschool.atlassian.net/browse/DS-2)  
**User story:** As an admin user, I want to edit an existing academic program's details so that I can keep program information accurate and up to date.

Feature: Edit existing program details
  An authenticated admin opens the Programs page, edits a program via the row
  edit icon, and saves changes to Program Name and Description in a modal form.

  # Happy paths

  Scenario: Open program for editing
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Web Development 2026" exists with Description "Full-stack cohort starting January 2026"
    When I click the edit icon on "Web Development 2026"
    Then I see the edit form pre-populated with the program's current data
    And the Program Name field contains "Web Development 2026"
    And the Description field contains "Full-stack cohort starting January 2026"
    And the Save button is visible
    And the Cancel button is visible

  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"
    And the program list does not show "Web Development 2026"

  Scenario: Edit preserves unchanged fields
    Given I am editing a program named "Web Development 2026" with Description "Original cohort description"
    When I only change the Description to "Updated: emphasis on React and Node.js projects."
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026"
    And when I reopen edit for "Web Development 2026"
    Then the Name remains "Web Development 2026"
    And the Description is "Updated: emphasis on React and Node.js projects."

  Scenario: Name and Description can both be updated in one save
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Spring"
    And I change the Description to "Spring track; includes capstone."
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 - Spring"
    And when I reopen edit for "Web Development 2026 - Spring"
    Then the Name is "Web Development 2026 - Spring"
    And the Description is "Spring track; includes capstone."

  Scenario: Clearing Description saves successfully when Description is optional
    Given I am editing a program with a non-empty Description
    When I clear the Description field entirely
    And I click Save
    Then the modal closes
    And when I reopen edit for that program
    Then the Description field is empty

  # Negative

  Scenario: Required Name must not be saved as empty
    Given I am editing "Web Development 2026"
    When I clear the Name field
    Then the Save button is disabled
    And the program list still shows "Web Development 2026"

  Scenario: Whitespace-only Name does not enable Save
    Given I am editing "Web Development 2026"
    When I change the Name to "     "
    And I move focus to Description
    Then the Save button is disabled
    And the program list still shows "Web Development 2026"

  Scenario: Cancel discards edits and list keeps the original name
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Discarded"
    And I click Cancel
    Then the modal closes
    And the program list shows "Web Development 2026"
    And the program list does not show "Web Development 2026 - Discarded"
    And when I reopen edit for "Web Development 2026"
    Then the Name is "Web Development 2026"

  Scenario: Program list must not show a new name if save fails
    Given I am editing "Web Development 2026"
    And the save request will fail with a server error
    When I change the Name to "Web Development 2026 - Should Not Persist"
    And I click Save
    Then I see an error message
    And the program list still shows "Web Development 2026"

  Scenario: Unauthorized user must not open edit or save changes
    Given I am logged in as a user without program-edit permission
    And I am on the Programs page
    And a program "Web Development 2026" exists
    When I attempt to edit "Web Development 2026"
    Then I cannot save changes to the program

  # Edge cases

  Scenario: 255-character Program Name saves and displays correctly
    Given I am editing "Web Development 2026"
    When I change the Name to a 255-character string
    And I click Save
    Then the modal closes
    And the program list shows the full 255-character Name

  Scenario: Name one character over maximum is rejected or blocks submit
    Given I am editing "Web Development 2026"
    When I change the Name to a 256-character string
    And I click Save
    Then the save is blocked or the modal remains open
    And the program list still shows "Web Development 2026"

  Scenario: Long Description of 2000 characters is accepted
    Given I am editing "Web Development 2026"
    When I change the Description to a 2000-character string
    And I click Save
    Then the modal closes
    And when I reopen edit for "Web Development 2026"
    Then the Description contains the full 2000-character string

  Scenario: Special characters in Name are stored and displayed verbatim
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Dev 2026 <Advanced> & \"React\" — 100%"
    And I click Save
    Then the modal closes
    And the program list shows "Web Dev 2026 <Advanced> & \"React\" — 100%"
    And no JavaScript alert dialog is triggered

  Scenario: Unicode and emoji in Description persist correctly
    Given I am editing "Web Development 2026"
    When I change the Description to "Cohort in Zürich — 日本語 intro — 🚀 launch week."
    And I click Save
    Then the modal closes
    And when I reopen edit for "Web Development 2026"
    Then the Description is "Cohort in Zürich — 日本語 intro — 🚀 launch week."

  Scenario: Renaming to an existing program name is allowed
    Given programs "Web Development 2026" and "Data Science 2026" exist
    When I edit "Web Development 2026"
    And I change the Name to "Data Science 2026"
    And I click Save
    Then the modal closes
    And the program list shows two entries named "Data Science 2026"
    And the program list does not show "Web Development 2026"

  Scenario: Leading and trailing whitespace in Name is trimmed on save
    Given I am editing "Web Development 2026"
    When I change the Name to "   Web Development 2026 - Trim Test   "
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 - Trim Test"

  Scenario: Whitespace-only Description is normalized to empty
    Given I am editing "Web Development 2026" with Description "Has content"
    When I change the Description to "   \n"
    And I click Save
    Then the modal closes
    And when I reopen edit for "Web Development 2026"
    Then the Description field is empty

  Scenario: Rapid double-click on Save performs a single update
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Once"
    And I double-click Save
    Then the modal closes
    And the program list shows exactly one entry named "Web Development 2026 - Once"

<!--
Ambiguities and gaps (not specified in DS-2 acceptance criteria):

1. "Other fields" — AC-3 requires Name and "other fields" unchanged when only
   Description is edited, but only Name and Description are named. The live edit
   modal also exposes additional fields (e.g. hours, audience); persistence rules
   for those fields are unspecified.

2. Start date / End date / Status — referenced in draft test plans but not present
   on the live edit modal at test.didaxis.studio; date-range validation (TC-008)
   is not applicable to the current UI.

3. Duplicate Program Names — ACs do not state whether names must be unique.
   Verified: the app allows duplicate names on edit (linked bug SS-25).

4. Validation rules — required fields, max lengths, and allowed characters are not
   in the ACs. Verified: Name is required; 255-char names accepted; empty
   Description allowed.

5. Cancel / unsaved changes — no AC covers abandoning edits; verified Cancel
   discards changes and list keeps the original name.

6. Save failure / rollback — no AC defines behavior when the API returns an
   error; needs API mock to automate (TC-006).

7. Concurrent editing — no AC for two users editing the same program; conflict
   detection vs. last-write-wins is undefined (TC-010).

8. Non-admin access — user story implies admin role; non-admin behavior needs a
   separate test account (TC-009).

9. "Immediately" — AC-2 requires the list to update immediately after save;
   synchronous refresh vs. optimistic UI is not defined.

10. Confluence reference — if the ticket links to Program Setup & Management docs,
    field list and validation rules should be cross-checked there.
-->
