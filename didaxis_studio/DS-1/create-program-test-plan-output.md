# Test Plan – DS-1: Create New Academic Program

**Jira:** [DS-1 – Create new academic program](https://legionqaschool.atlassian.net/browse/DS-1)  
**Feature:** Create new academic program  
**Author:** Senior QA Engineer  
**Scope:** Functional verification of the "Create new academic program" feature against the provided Acceptance Criteria (AC-1, AC-2, AC-3), plus negative and edge coverage.

**Source ACs (Jira):**

```gherkin
Scenario: Navigate to program creation form
  Given I am logged in as admin
  When I navigate to the Programs page
  And I click "+ New Program"
  Then I see the program creation form with fields: Program Name, Description

Scenario: Successfully create a program
  Given I am on the program creation form
  When I fill in Program Name with "Web Development 2026"
  And I fill in Description with "Full-stack web development program"
  And I click Create
  Then the modal closes
  And the program list shows "Web Development 2026"

Scenario: Validation prevents empty program name
  Given I am on the program creation form
  When I leave the Program Name field empty
  Then the Create button is disabled
```

**Coverage status:** All three Jira AC scenarios are covered by this test plan (3/3). Remaining follow-ups are documented in §8 (backlog) and §9 (automation).

---

## 1. Feature Summary

An authenticated **admin** user can open the **Programs** page and create a new academic program via a modal form. The form exposes two fields:

- **Program Name** (free text)
- **Description** (free text)

Submission via **Create** closes the modal and appends the new program to the visible Programs list. The **Create** button is disabled while **Program Name** is empty.

---

## 2. Test Environment

| Item | Value |
| --- | --- |
| Role | Admin (only admins may create programs) |
| Entry point | Programs page (after login) |
| Trigger | `+ New Program` button |
| Form fields | Program Name, Description |
| Submit control | `Create` button (inside modal) |
| Browsers | Chromium (latest), Firefox (latest), WebKit (latest) |
| Viewport | Desktop 1280×720 |

---

## 3. Traceability Matrix (AC → Test Cases)

| AC | Description | Covered by |
| --- | --- | --- |
| AC-1 | Navigate to program creation form | TC-001, TC-002 |
| AC-2 | Successfully create a program | TC-003, TC-004 |
| AC-3 | Validation prevents empty program name | TC-N-001, TC-N-002, TC-005 |

---

## 4. Positive Flows

### TC-001 – Admin can open the program creation form from the Programs page

- **Preconditions:** User is logged in as **admin**; no modal is currently open.
- **Steps:**
  1. Navigate to the **Programs** page.
  2. Click the **`+ New Program`** button.
- **Expected result:**
  - A modal dialog opens.
  - The modal contains two visible, enabled input fields: **Program Name** and **Description**.
  - A **Create** button is visible.
  - The **Create** button is **disabled** by default (since Program Name is empty).
- **Priority:** High (covers AC-1)

### TC-002 – Opening the form reveals an interactive Program Name field

- **Preconditions:** User is logged in as admin and is on the Programs page.
- **Steps:**
  1. Click **`+ New Program`**.
  2. Click into the **Program Name** field.
- **Expected result:** **Program Name** is visible and editable; after clicking it, it has keyboard focus. *(Note: the modal does not auto-focus the Program Name field – focus lands on the close `×` button. See §8.)*
- **Priority:** Medium (supports AC-1)

### TC-003 – Admin can create a program with both Name and Description

- **Preconditions:** User is logged in as admin; program creation modal is open; no program named `Web Development 2026` exists.
- **Steps:**
  1. Fill **Program Name** with `Web Development 2026`.
  2. Fill **Description** with `Full-stack web development program`.
  3. Click **Create**.
- **Expected result:**
  - The modal closes.
  - The Programs list shows an entry titled exactly `Web Development 2026`.
  - The new entry appears without requiring a page reload.
- **Priority:** High (covers AC-2)

### TC-004 – Newly created program persists across reload

- **Preconditions:** Program `Web Development 2026` was just created in TC-003.
- **Steps:**
  1. Reload the Programs page.
- **Expected result:** `Web Development 2026` is still present in the list.
- **Priority:** High

### TC-005 – Create button becomes enabled as soon as Program Name has content

- **Preconditions:** Program creation modal is open; both fields are empty; **Create** is disabled.
- **Steps:**
  1. Type a single character (e.g., `W`) into **Program Name**.
- **Expected result:** **Create** button becomes enabled immediately (no blur required).
- **Priority:** Medium (supports AC-3 boundary)

### TC-006 – Description is optional

- **Preconditions:** Program creation modal is open; no program named `Data Science 2026` exists.
- **Steps:**
  1. Fill **Program Name** with `Data Science 2026`.
  2. Leave **Description** empty.
  3. Click **Create**.
- **Expected result:**
  - The modal closes.
  - The Programs list shows `Data Science 2026`.
  - Description is empty/blank for that entry (no error shown).
- **Priority:** Medium

---

## 5. Negative Flows

### TC-N-001 – Create button is disabled when Program Name is empty

- **Preconditions:** Program creation modal is open.
- **Steps:**
  1. Leave **Program Name** empty.
  2. Fill **Description** with `Full-stack web development program`.
- **Expected result:** **Create** button remains **disabled**; clicking it (if possible) does nothing; the modal stays open; no new program is created.
- **Priority:** High (covers AC-3)

### TC-N-002 – Whitespace-only Program Name does not enable Create

- **Preconditions:** Program creation modal is open.
- **Steps:**
  1. Type 5 spaces (`"     "`) into **Program Name**.
  2. Move focus to **Description**.
- **Expected result:** **Create** button stays **disabled**; no program named `"     "` is created.
- **Priority:** High (AC-3 boundary; prevents silent creation of blank-titled programs)

### TC-N-003 – Closing the modal discards the entry

- **Preconditions:** Program creation modal is open.
- **Steps:**
  1. Fill **Program Name** with `Throwaway`.
  2. Fill **Description** with `Should not be saved`.
  3. Dismiss the modal (close icon, Cancel button, or `Esc`).
- **Expected result:**
  - Modal closes.
  - No program titled `Throwaway` appears in the Programs list, on reload or otherwise.
- **Priority:** High

### TC-N-004 – Re-opening the form after dismiss retains the previously entered values

- **Preconditions:** Modal was just dismissed in TC-N-003 with non-empty fields.
- **Steps:**
  1. Click **`+ New Program`** again.
- **Expected result:** **Program Name** and **Description** still contain the values typed before dismiss; **Create** is enabled. *(Verified app behavior; see §8.)*
- **Priority:** Medium

---

## 6. Edge Cases

### TC-E-001 – Leading/trailing whitespace in Program Name is trimmed

- **Preconditions:** Program creation modal is open; no program named `Web Development 2026` exists.
- **Steps:**
  1. Fill **Program Name** with `   Web Development 2026   ` (3 spaces on each side).
  2. Click **Create**.
- **Expected result:** The Programs list shows the entry as exactly `Web Development 2026` (no surrounding whitespace).
- **Priority:** Medium

### TC-E-002 – Maximum-length Program Name (255 chars) is accepted

- **Preconditions:** Program creation modal is open. Maximum allowed length is **N** characters (currently unspecified – see §8; **255** is exercised as a reasonable boundary).
- **Steps:**
  1. Fill **Program Name** with a 255-character string (e.g., `'A'.repeat(255)`).
  2. Click **Create**.
- **Expected result:** The program is created; the full 255-character title is preserved verbatim in the list view.
- **Priority:** Medium

### TC-E-004 – Long Description (≥ 2000 characters) is accepted

- **Preconditions:** Program creation modal is open.
- **Steps:**
  1. Fill **Program Name** with `Long Description Program 2026`.
  2. Fill **Description** with a 2000-character body of text.
  3. Click **Create**.
- **Expected result:** The program is created; the full description is preserved (verified via detail view or reload).
- **Priority:** Low

### TC-E-006 – Special characters, emojis, and non-Latin scripts are accepted verbatim

- **Preconditions:** Program creation modal is open.
- **Steps:**
  1. Create a program named `<script>alert(1)</script>` with description `O'Brien & "Co."`.
  2. Create a program named `任务一 / مهمة / задача` with description `🚀 Multilingual program 🔥`.
- **Expected result:**
  - Both programs are created.
  - Titles and descriptions render exactly as typed (no HTML/script execution; no encoding artifacts visible to the user).
- **Priority:** High (XSS-safety + i18n)

### TC-E-007 – Short Program Name is accepted (lower boundary)

- **Preconditions:** Program creation modal is open.
- **Steps:**
  1. Fill **Program Name** with a single-letter prefix plus a unique suffix (e.g., `A<timestamp>`).
  2. Click **Create**.
- **Expected result:** The program is created and shown in the list.
- **Priority:** Low

---

## 7. Re-validation Against ACs

| AC | Verified |
| --- | --- |
| AC-1 Navigate to program creation form | TC-001 (modal opens with both fields and Create button), TC-002 (Program Name visible and editable) |
| AC-2 Successfully create a program | TC-003 (`Web Development 2026` with description), TC-004 (persists after reload), TC-006 (description optional) |
| AC-3 Validation prevents empty program name | TC-N-001 (empty name disables Create), TC-N-002 (whitespace-only also disables), TC-005 (enables on first non-whitespace character) |

All three acceptance criteria have at least one dedicated positive/negative test case, plus negative and edge coverage above.

---

## 8. Verified App Behavior (Notes on AC Ambiguities)

The ACs are minimal. The points below were not specified by the ACs and were **verified against the live app** (`https://test.didaxis.studio`) on 2026-05-13. The test cases above were aligned with the real behavior.

1. **Whitespace handling in Program Name** – Whitespace-only Program Name keeps **Create** disabled (TC-N-002). Leading/trailing whitespace **is trimmed** by the app on submit (TC-E-001).
2. **Maximum length** – A 255-character Program Name and a 2000-character Description are both accepted (TC-E-002, TC-E-004). The true upper bound and the "exceeds max" behavior were not exercised – the real cap should be confirmed with product.
3. **Description is optional vs. required** – Description is **optional**. Creating with name only succeeds (TC-006).
4. **Modal dismissal** – `Escape` and the explicit **Cancel** button both close the modal. **The form state is NOT reset on dismiss**: when the user reopens the modal via `+ New Program`, the previously entered Program Name and Description are still there. Only a **successful Create** clears the form. (TC-N-003 verifies the program is not persisted on dismiss; TC-N-004 verifies the state-retention behavior.)
5. **Form auto-focus** – Opening the modal places focus on the close button (`×`), **not** on the Program Name field. TC-002 reflects this.
6. **Persistence and ordering** – A newly created program is persisted (visible after reload, TC-004). Ordering is not asserted; should be confirmed with product.
7. **XSS / HTML rendering** – Special characters, emojis, and non-Latin scripts are stored verbatim and rendered as plain text — no script dialog is triggered when a `<script>` payload is used as the Program Name (TC-E-006).

### Items intentionally not covered by automated tests

The following were considered but require external information or environment support not currently available. They are kept here as a backlog of follow-ups rather than as broken/skipped tests in the suite:

- **Non-admin access** – implied by user story ("As an admin user…"); needs a non-admin account (`+ New Program` should be hidden/blocked for non-admins).
- **Confluence spec alignment** – Jira references *Program Setup & Management > Overview*; not cross-checked in this plan.
- **Server error response** – needs the documented create-program API endpoint to mock with `page.route` and force a 500 response.
- **Exceeding the maximum length** – needs the real max length (and the "over-max" behavior: hard cap vs. validation error) confirmed with product.
- **Duplicate Program Names** – needs a product decision: allowed (and rows remain distinguishable) or forbidden (validation error).
- **Newlines/tabs inside Program Name** – needs a product decision: strip, reject, or render multi-line.
- **Idempotent submit** – **known bug**: a rapid double-click on **Create** currently submits twice and creates two identical programs. The button is not disabled while the request is in flight. See [SS-26](https://legionqaschool.atlassian.net/browse/SS-26). The corresponding test (`TC-E-009`) lives in the spec as `test.fixme` and will be enabled once the bug is fixed.
- **Session expiry mid-flow** – needs a way to invalidate the admin session mid-flow (test hook or controlled session backend).
- **Accessibility** – not in scope here; recommended as a dedicated a11y pass (focus trap, `Esc` to close, ARIA labels on fields, error announcements).

---

## 9. Automation Alignment

Playwright spec: [`tests/ds1-create-program.spec.ts`](../../tests/ds1-create-program.spec.ts)  
Browser matrix (§2): configured in [`playwright.config.ts`](../../playwright.config.ts).

| Test plan TC | Automated | Notes |
| --- | --- | --- |
| TC-001 – TC-006 | Yes | Uses `uniqueName()` instead of literal AC example strings for test isolation |
| TC-N-001 – TC-N-004 | Yes | |
| TC-E-001, TC-E-002, TC-E-004, TC-E-006, TC-E-007 | Yes | |
| TC-E-009 | `test.fixme` | Blocked by [SS-26](https://legionqaschool.atlassian.net/browse/SS-26) |
| §8 backlog items | No | As documented above |
