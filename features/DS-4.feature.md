# DS-4 – Delete program with confirmation

**Jira:** [DS-4 – Delete program with confirmation](https://legionqaschool.atlassian.net/browse/DS-4)  
**User story:** As an admin user, I want to delete a program with a confirmation step so that I do not remove programs accidentally.

Feature: Delete program with confirmation
  An authenticated admin removes a program from the Programs list by clicking the
  row delete icon. A confirmation dialog appears before the program is permanently
  removed.

  # Happy paths

  Scenario: Delete program with confirmation
    Given I am logged in as admin
    And I am on the Programs page
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    And the dialog message refers to deleting "Test Program"
    When I confirm deletion
    Then "Test Program" is removed from the program list

  Scenario: Confirmation dialog appears when initiating delete
    Given I am on the Programs page
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    And the dialog message contains "Delete program"
    And the dialog message contains "Test Program"
    And the dialog message indicates the action cannot be undone

  Scenario: Cancel program deletion
    Given I am on the Programs page
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I see the confirmation dialog
    And I click Cancel
    Then the program still exists in the list
    And the program list shows "Test Program"

  Scenario: Cancel preserves a different named program
    Given I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the delete icon for "Web Development 2026"
    And I see the confirmation dialog
    And I click Cancel
    Then the program list shows "Web Development 2026"

  Scenario: Deleting one program does not remove a different program
    Given programs "Test Program" and "Web Development 2026" exist in the list
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And "Web Development 2026" remains in the program list

  # Negative

  Scenario: Program must not be deleted if confirmation is never completed
    Given I am on the Programs page
    And a program "Data Science 2026" exists
    When I click the delete icon for "Data Science 2026"
    And I dismiss the confirmation dialog without confirming
    Then "Data Science 2026" remains in the program list

  Scenario: Deletion must not occur when the server returns an error after confirm
    Given I am on the Programs page
    And a program "Test Program" exists
    And the delete request will fail with a server error
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then I see an error message
    And "Test Program" remains in the program list

  Scenario: User without delete permission must not remove a program
    Given I am logged in as a user without program-delete permission
    And a program "Test Program" exists
    When I attempt to delete "Test Program"
    Then the program is not removed from the list

  Scenario: Double confirmation click performs a single delete
    Given I am on the Programs page
    And a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I rapidly double-click Confirm
    Then "Test Program" is removed from the program list exactly once
    And no duplicate error dialogs appear

  # Edge cases

  Scenario: Confirmation copy displays correctly for program name with special characters
    Given a program "Informatique & IA - Niveau 2" exists
    When I click the delete icon for "Informatique & IA - Niveau 2"
    Then the confirmation dialog shows "Informatique & IA - Niveau 2"
    And the characters render without broken encoding or HTML injection

  Scenario: Program name containing quotes renders safely in dialog
    Given a program "R&D \"Phase 1\" - Cost: 100%" exists
    When I click the delete icon for "R&D \"Phase 1\" - Cost: 100%"
    Then the confirmation dialog shows the full name including quotes
    When I confirm deletion
    Then "R&D \"Phase 1\" - Cost: 100%" is removed from the program list

  Scenario: Dismiss on confirmation dialog keeps program in the list
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I dismiss the confirmation dialog
    Then "Test Program" remains in the program list

  Scenario: Cancel does not leave delete control stuck
    Given a program "Data Science Bootcamp 2026" exists
    When I click the delete icon for "Data Science Bootcamp 2026"
    And I dismiss the confirmation dialog
    And I click the delete icon for "Data Science Bootcamp 2026" again
    Then a new confirmation dialog appears
    And the delete control is responsive

  Scenario: Confirmation copy for very long program name remains usable
    Given a program with a 255-character name exists
    When I click the delete icon for that program
    Then the confirmation dialog appears
    And the dialog remains usable with Cancel and Confirm actions visible

  Scenario: Deleting the only program shows an appropriate empty state
    Given only one program "Test Program" exists in the system
    When I click the delete icon for "Test Program"
    And I confirm deletion
    Then "Test Program" is removed from the program list
    And I see a message indicating no programs have been created

  Scenario: Duplicate display names delete only the selected row
    Given two programs named "Test Program" exist with different descriptions
    When I click the delete icon on one "Test Program" row
    And I confirm deletion
    Then exactly one "Test Program" row is removed
    And the other "Test Program" row remains in the list

<!--
Ambiguities and gaps (not specified in DS-4 acceptance criteria):

1. Dialog type — Verified: the app uses a native window.confirm dialog, not a custom
   modal. Backdrop click, focus trap, and Escape behavior follow browser defaults.

2. Soft vs. hard delete — ACs say "removed from the list" but do not specify whether
   the record is archived, recoverable, or permanently purged.

3. Dependencies — No AC for programs linked to cohorts, enrollments, or courses;
   delete might need to be blocked or cascade.

4. Success feedback — No requirement for toast, undo, or analytics after confirm;
   only list removal is stated.

5. Error handling — Failed network or server error after confirm is not covered in ACs.

6. Permissions — Who may delete is not stated; needs a non-admin test account.

7. Concurrent operations — No AC for delete while another user edits the same program.

8. Search/filter — After delete, whether list refresh preserves filters or pagination
   is unspecified.

9. Undo — No mention of a recovery window after confirmation.

10. Empty state after last delete — Deleting the only program may show the DS-5 empty
    state; exact copy is not defined in DS-4 ACs.
-->
