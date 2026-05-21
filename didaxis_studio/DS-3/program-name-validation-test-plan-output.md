# Test Plan – DS-3: Program Name Validation and Duplicate Prevention

**Jira:** [DS-3 – Program name validation and duplicate prevention](https://legionqaschool.atlassian.net/browse/DS-3)  
**Feature:** Program name validation and duplicate prevention  
**Context:** Program **creation** form (primary); duplicate rule references existing program **Web Development 2026**  
**Primary field under test:** **Program name** (other required fields filled per scenario)

**Source ACs (Jira):**

```gherkin
Scenario: Reject program name with only whitespace
  Given I am on the program creation form
  When I enter "   " as the program name
  And I click Create
  Then the form is not submitted (name is trimmed, treated as empty)

Scenario: Accept program name with special characters
  Given I am on the program creation form
  When I enter "Informatique & IA - Niveau 2" as the program name
  And I fill other required fields
  And I click Create
  Then the program is created successfully

Scenario: Reject duplicate program name
  Given a program "Web Development 2026" already exists
  When I try to create a new program with the same name
  Then I see an error indicating the name already exists
```

**Coverage status:** All three Jira AC scenarios are covered by this test plan (3/3). TC-006 (fully empty name) and other cases extend coverage beyond the ACs.

---

## Positive flows

### TC-001

- **Title:** Program with special characters in name is created when other required fields are valid
- **Preconditions:** User is on the **program creation** form with permission to create programs. No existing program uses **Informatique & IA - Niveau 2**. Other required fields are available (e.g. **Description**: `Cycle secondaire — orientation sciences`; **Start date**: `2026-09-01`; **End date**: `2027-06-30`; **Status**: `Draft` — adjust to match the real form).
- **Steps:**
  1. In **Program name**, enter `Informatique & IA - Niveau 2`.
  2. Fill every other required field with valid values.
  3. Click **Create**.
- **Expected result:** Program is created successfully; user is redirected or sees success state; new program appears in the program list with **Program name** exactly `Informatique & IA - Niveau 2`.
- **Priority:** High

### TC-002

- **Title:** Valid unique name with letters, numbers, and spaces is accepted
- **Preconditions:** Creation form open; name `Data Science Bootcamp 2026` does not exist.
- **Steps:**
  1. Enter **Program name** `Data Science Bootcamp 2026`.
  2. Complete other required fields with valid data.
  3. Click **Create**.
- **Expected result:** Program is created; list shows `Data Science Bootcamp 2026`.
- **Priority:** High

### TC-003

- **Title:** Name at maximum allowed length is accepted when unique
- **Preconditions:** Product defines max **Program name** length (assume **120** characters if unspecified). Build a string of exactly 120 characters, e.g. `Program ` + repeated alphanumeric segment to reach 120, ensuring uniqueness.
- **Steps:**
  1. Paste the 120-character name into **Program name**.
  2. Fill other required fields.
  3. Click **Create**.
- **Expected result:** Creation succeeds; stored name matches all 120 characters.
- **Priority:** Medium

---

## Negative flows

### TC-004

- **Title:** Whitespace-only program name is not submitted; treated as empty after trim
- **Preconditions:** User is on the program creation form.
- **Steps:**
  1. In **Program name**, enter exactly three spaces: `   `.
  2. Fill other required fields with valid values.
  3. Click **Create**.
- **Expected result:** Form is **not** submitted (no new program persisted). User sees validation that **Program name** is required or empty (after trim). No success toast or navigation to list with a blank-named program.
- **Priority:** High

### TC-005

- **Title:** Duplicate name matches existing program and creation is blocked with a clear error
- **Preconditions:** Program **Web Development 2026** already exists in the same scope (tenant/account). User is on the creation form.
- **Steps:**
  1. Enter **Program name** `Web Development 2026`.
  2. Fill other required fields with valid values.
  3. Click **Create**.
- **Expected result:** Program is **not** created. User sees an error indicating the name already exists (or equivalent: “A program with this name already exists”). Existing **Web Development 2026** row count in the list remains one.
- **Priority:** High

### TC-006

- **Title:** Empty program name must not create a program
- **Preconditions:** Creation form open.
- **Steps:**
  1. Leave **Program name** empty (no characters).
  2. Fill other required fields.
  3. Click **Create**.
- **Expected result:** Validation blocks submit; no program created.
- **Priority:** High

### TC-007

- **Title:** Server must not persist a duplicate if client validation is bypassed
- **Preconditions:** **Web Development 2026** exists. Ability to send create request via API or devtools with same **Program name**.
- **Steps:**
  1. Submit a create payload with **Program name** `Web Development 2026` and otherwise valid body.
- **Expected result:** HTTP 4xx (e.g. 409 Conflict or 400 with field error); no second program with that name; response body indicates duplicate name.
- **Priority:** High

### TC-008

- **Title:** Near-duplicate name with different casing must follow product rule (allowed or rejected consistently)
- **Preconditions:** **Web Development 2026** exists.
- **Steps:**
  1. On creation form, enter **Program name** `web development 2026`.
  2. Fill other fields; click **Create**.
- **Expected result:** Behavior is **consistent** with documented rule: either rejected as duplicate (case-insensitive uniqueness) or allowed (case-sensitive). AC does not specify; document actual product decision and ensure no ambiguous mixed behavior.
- **Priority:** Medium

### TC-009

- **Title:** Trailing or leading spaces on an otherwise valid name must not create a second logical duplicate
- **Preconditions:** **Web Development 2026** exists.
- **Steps:**
  1. Enter **Program name** `  Web Development 2026  `.
  2. Fill other fields; click **Create**.
- **Expected result:** After trim, name equals existing program → duplicate error **or** trim normalizes to unique value per rules; must **not** silently create confusing duplicate or empty name.
- **Priority:** High

### TC-010

- **Title:** Unauthorized user must not create a program even with a valid unique name
- **Preconditions:** Session without create-program permission.
- **Steps:**
  1. Open creation flow if exposed, or POST create with **Program name** `Authorized Only Test`.
- **Expected result:** UI blocks access or API returns 403; no new program.
- **Priority:** High

---

## Edge cases

### TC-011

- **Title:** Name one character over maximum length is rejected or blocked in UI
- **Preconditions:** Max length **120** for **Program name** (replace with actual limit).
- **Steps:**
  1. Enter 121 characters in **Program name**.
  2. Complete other required fields.
  3. Click **Create**.
- **Expected result:** Validation prevents submit or field hard-limits input; no truncated silent save unless product explicitly defines truncation (prefer rejection with message).
- **Priority:** Medium

### TC-012

- **Title:** Unicode and accented characters in name are accepted when unique
- **Preconditions:** Name `École d'été — Zürich 2026` not in use.
- **Steps:**
  1. Enter that exact string in **Program name**.
  2. Fill other required fields.
  3. Click **Create**.
- **Expected result:** Program created; list and detail show correct Unicode rendering.
- **Priority:** Medium

### TC-013

- **Title:** Emoji in program name follow allowed-character policy
- **Preconditions:** Product policy unknown; test documents behavior.
- **Steps:**
  1. Enter **Program name** `Web Dev 2026 🚀`.
  2. Fill other fields; click **Create**.
- **Expected result:** Either success (if allowed) or clear validation “unsupported characters”; no server 500 or corrupt display.
- **Priority:** Low

### TC-014

- **Title:** HTML-like strings in name are stored as text, not executed
- **Preconditions:** Unique name `<script>alert(1)</script> Program 2026` or `Web <b>Bold</b> 2026`.
- **Steps:**
  1. Enter the string in **Program name**.
  2. Fill other fields; click **Create**.
- **Expected result:** Value appears escaped/safe in UI; no script execution in list or detail views.
- **Priority:** Medium

### TC-015

- **Title:** Duplicate check applies after trim so logical duplicates are caught
- **Preconditions:** **Web Development 2026** exists.
- **Steps:**
  1. Enter **Program name** `   Web Development 2026   `.
  2. Fill other fields; click **Create**.
- **Expected result:** Duplicate error (same as TC-005), not a new program.
- **Priority:** High

### TC-016

- **Title:** Tab and newline characters in name are trimmed or rejected consistently
- **Preconditions:** Creation form open.
- **Steps:**
  1. Enter **Program name** with leading tab and newline, e.g. `\t\n  Valid Name 2026` (paste from editor).
  2. Fill other fields; click **Create**.
- **Expected result:** Trim/normalize yields `Valid Name 2026`; if that exists, duplicate rules apply; if whitespace-only after trim, same as TC-004.
- **Priority:** Medium

### TC-017

- **Title:** Single visible character name is accepted if allowed by minimum-length rules
- **Preconditions:** No min length above 1, or min is 1.
- **Steps:**
  1. Enter **Program name** `A`.
  2. Fill other fields; click **Create**.
- **Expected result:** Per product rules: created or rejected with “minimum length” message; behavior documented.
- **Priority:** Low

### TC-018

- **Title:** Rapid double-click on Create does not create two programs for one valid submission
- **Preconditions:** Unique name `Rapid Double Click 2026`; form valid.
- **Steps:**
  1. Double-click **Create** quickly.
- **Expected result:** At most one program created; no duplicate rows with same name from double submit.
- **Priority:** Medium

### TC-019

- **Title:** Special-character acceptance extends beyond the AC example (ampersand, hyphen, quotes)
- **Preconditions:** Unique names for each run.
- **Steps:**
  1. Create program with **Program name** `R&D "Phase 1" - Cost: 100%`.
  2. Repeat with `O'Brien Leadership 2026` if apostrophe handling differs.
- **Expected result:** Creation succeeds; characters display correctly in list and exports (if any).
- **Priority:** Low

### TC-020

- **Title:** Duplicate error does not clear already-valid entries for other required fields
- **Preconditions:** **Web Development 2026** exists; form retains user input on error.
- **Steps:**
  1. Fill **Program name** `Web Development 2026`, **Description** `Should remain after error`, dates, etc.
  2. Click **Create**; receive duplicate error.
  3. Change only **Program name** to `Web Development 2026 - New` and save again.
- **Expected result:** Other field values remain as entered (or UX clearly explains reset); second submit succeeds without re-entering everything unnecessarily.
- **Priority:** Low

---

## Traceability (AC coverage)

| Jira scenario | Test case IDs | Gap |
| --- | --- | --- |
| Reject whitespace-only name (trim → empty, not submitted) | TC-004, TC-015, TC-016 | None |
| Accept name with special characters (`Informatique & IA - Niveau 2`) | TC-001, TC-019 | None |
| Reject duplicate (`Web Development 2026`) | TC-005, TC-007, TC-009, TC-015 | None |

**Overall DS-3 ↔ Jira coverage:** Complete for all stated acceptance criteria.

---

## Ambiguities and gaps in the acceptance criteria

1. **Scope of “duplicate”** — Unclear whether uniqueness is global, per organization, per campus, or case-insensitive. TC-008 and TC-009 depend on a written rule.

2. **“Other required fields”** — Not enumerated; testers need the real field list (**Description**, **Start date**, **End date**, **Status**, etc.) and valid value formats.

3. **Whitespace scenario wording** — “Form is not submitted” vs. “name is trimmed, treated as empty” implies client-side trim; whether tabs, NBSP, or full-width spaces behave like spaces is unspecified.

4. **Max and min length** — ACs do not state limits; boundary testing requires product specs.

5. **Edit vs. create** — ACs only mention **creation** form. Whether the same validation applies when **editing** a program name (and whether user can “rename” into a duplicate) is out of scope here but should align for consistency.

6. **Error presentation** — Duplicate scenario requires an error “indicating the name already exists” but not inline vs. banner vs. field-level; accessibility of the message is not specified.

7. **Trim on save for valid names** — Whether `  My Program  ` is stored with spaces or normalized to `My Program` is not stated; affects duplicate detection (TC-009, TC-015).

8. **Async / race** — Two users creating the same name simultaneously is not covered; server must still enforce one winner and one error.

9. **Special characters** — Only one positive example; policy on emoji, RTL text, or disallowed symbols is not defined.

---
