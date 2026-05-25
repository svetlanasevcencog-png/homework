# DS-3 – Program name validation and duplicate prevention

**Jira:** [DS-3 – Program name validation and duplicate prevention](https://legionqaschool.atlassian.net/browse/DS-3)  
**User story:** As an admin user, I want program names validated on creation so that invalid or duplicate names are rejected before a program is saved.

Feature: Program name validation and duplicate prevention
  An authenticated admin creates a new academic program on the program creation
  form. Program Name is validated for emptiness, whitespace, special characters,
  and uniqueness before submission.

  # Happy paths

  Scenario: Accept program name with special characters
    Given I am logged in as admin
    And I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill in Description with "Cycle secondaire — orientation sciences"
    And I click Create
    Then the program is created successfully
    And the program list shows "Informatique & IA - Niveau 2"

  Scenario: Valid unique name with letters, numbers, and spaces is accepted
    Given I am on the program creation form
    When I enter "Data Science Bootcamp 2026" as the program name
    And I fill in Description with "Python, ML, and data engineering track"
    And I click Create
    Then the program is created successfully
    And the program list shows "Data Science Bootcamp 2026"

  Scenario: Name at maximum allowed length is accepted when unique
    Given I am on the program creation form
    When I enter a 255-character string as the program name
    And I fill in Description with a valid description
    And I click Create
    Then the program is created successfully
    And the program list shows the full 255-character program name

  # Negative

  Scenario: Reject program name with only whitespace
    Given I am on the program creation form
    When I enter "   " as the program name
    And I fill in Description with "Valid description"
    And I click Create
    Then the form is not submitted
    And the Create button is disabled
    And no new program is created

  Scenario: Empty program name must not create a program
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Description without a name"
    Then the Create button is disabled
    And no new program is created

  Scenario: Reject duplicate program name
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web Development 2026" as the program name
    And I fill in Description with "Second cohort"
    And I click Create
    Then I see an error indicating the name already exists
    And the program list shows exactly one entry named "Web Development 2026"

  Scenario: Duplicate name with leading and trailing spaces is rejected after trim
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "   Web Development 2026   " as the program name
    And I fill in Description with a valid description
    And I click Create
    Then I see an error indicating the name already exists
    And no second program is created

  Scenario: Case-variant duplicate follows product uniqueness rule
    Given a program "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "web development 2026" as the program name
    And I fill in Description with a valid description
    And I click Create
    Then the outcome is consistent with the documented case-sensitivity rule

  Scenario: Unauthorized user must not create a program with a valid unique name
    Given I am logged in as a user without program-create permission
    When I attempt to create a program named "Authorized Only Test"
    Then the program is not created

  # Edge cases

  Scenario: Unicode and accented characters in name are accepted when unique
    Given I am on the program creation form
    When I enter "École d'été — Zürich 2026" as the program name
    And I fill in Description with a valid description
    And I click Create
    Then the program is created successfully
    And the program list shows "École d'été — Zürich 2026"

  Scenario: Emoji in program name is accepted
    Given I am on the program creation form
    When I enter "Web Dev 2026 🚀" as the program name
    And I fill in Description with a valid description
    And I click Create
    Then the program is created successfully
    And the program list shows "Web Dev 2026 🚀"

  Scenario: HTML-like strings in name are stored as text, not executed
    Given I am on the program creation form
    When I enter "<script>alert(1)</script> Program 2026" as the program name
    And I fill in Description with a valid description
    And I click Create
    Then the program is created successfully
    And the program list shows "<script>alert(1)</script> Program 2026"
    And no JavaScript alert dialog is triggered

  Scenario: Name one character over maximum length is rejected or blocked
    Given I am on the program creation form
    When I enter a 256-character string as the program name
    And I click Create
    Then the form is not submitted
    And no program with the 256-character name appears in the list

  Scenario: Tab and newline characters in name are trimmed to a valid name
    Given I am on the program creation form
    When I enter a program name with leading tab and newline before "Valid Name 2026"
    And I fill in Description with a valid description
    And I click Create
    Then the program is created successfully
    And the program list shows "Valid Name 2026"

  Scenario: Single visible character name is accepted
    Given I am on the program creation form
    When I enter "A" as the program name
    And I fill in Description with a valid description
    And I click Create
    Then the program is created successfully

  Scenario: Special-character acceptance beyond the AC example
    Given I am on the program creation form
    When I enter "R&D \"Phase 1\" - Cost: 100%" as the program name
    And I fill in Description with "O'Brien & \"Co.\""
    And I click Create
    Then the program is created successfully
    And the program list shows "R&D \"Phase 1\" - Cost: 100%"

  Scenario: Rapid double-click on Create does not create two programs
    Given I am on the program creation form
    And I enter "Rapid Double Click 2026" as the program name
    When I double-click Create
    Then at most one program named "Rapid Double Click 2026" appears in the list

<!--
Ambiguities and gaps (not specified in DS-3 acceptance criteria):

1. Duplicate prevention (SS-25) — AC-3 requires rejecting duplicate "Web Development 2026",
   but the live app currently allows duplicate names on create. Scenarios above reflect
   the Jira AC intent; automation documents actual behavior until SS-25 is fixed.

2. Case sensitivity — ACs do not state whether uniqueness is case-insensitive.
   Verified: the app treats "Web Development 2026" and "web development 2026" as distinct.

3. Trim behavior — Whitespace-only names keep Create disabled (verified). Leading/trailing
   whitespace on otherwise valid names is trimmed on save, which affects duplicate detection.

4. "Other required fields" — AC-2 references other required fields but only Description
   exists on the live create form; Start date, End date, and Status are not present.

5. Max/min length — ACs do not define limits. Verified: 255-character names accepted;
   256-character names blocked or rejected.

6. Edit vs. create — ACs only cover the creation form; edit-flow validation should align
   but is out of scope for this ticket.

7. Error presentation — Duplicate scenario requires an error message but does not specify
   inline vs. banner vs. field-level placement.

8. Server-side enforcement — Client validation may be bypassed via API; server must still
   reject duplicates (TC-007 needs direct API testing).

9. Race conditions — Two users creating the same name simultaneously is not covered.

10. Non-admin access — User story implies admin role; non-admin create behavior needs a
    separate test account.
-->
