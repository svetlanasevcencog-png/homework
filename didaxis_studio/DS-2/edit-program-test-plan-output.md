# Test Plan – DS-2: Edit Existing Program Details

**Jira:** [DS-2 – Edit existing program details](https://legionqaschool.atlassian.net/browse/DS-2)  
**Feature:** Edit existing program details  
**Form context:** Modal opened from Programs page via row edit icon  
**Primary fields referenced in ACs:** Name, Description (other program attributes assumed where AC says “other fields”)

**Source ACs (Jira):**

```gherkin
Scenario: Open program for editing
  Given I am on the Programs page
  And a program "Web Development 2026" exists
  When I click the edit icon on "Web Development 2026"
  Then I see the edit form pre-populated with the program's current data

Scenario: Successfully edit a program name
  Given I am editing "Web Development 2026"
  When I change the Name to "Web Development 2026 - Updated"
  And I click Save
  Then the modal closes
  And the program list immediately shows "Web Development 2026 - Updated"

Scenario: Edit preserves unchanged fields
  Given I am editing a program
  When I only change the Description
  And I click Save
  Then the Name and other fields remain unchanged
```

**Coverage status:** All three Jira AC scenarios are covered by this test plan (3/3). Extended negative and edge cases are documented below; ambiguities and backlog items are in the final section.

---

## Positive flows

### TC-001

- **Title:** Edit form opens with all current program values shown in the correct fields
- **Preconditions:** User is logged in with permission to manage programs. Programs page is open. Program **Web Development 2026** exists with known values (e.g. Name: `Web Development 2026`, Description: `Full-stack cohort starting January 2026`, Start date: `2026-01-15`, End date: `2026-06-30`, Status: `Active`).
- **Steps:**
  1. Navigate to the Programs page.
  2. Locate the row for **Web Development 2026**.
  3. Click the **edit** icon on that row.
- **Expected result:** A modal (or equivalent) titled for editing the program appears. **Name**, **Description**, **Start date**, **End date**, and **Status** (and any other visible program fields) match the stored values for **Web Development 2026** before any edits.
- **Priority:** High

### TC-002

- **Title:** Updated program name appears in the list immediately after save, and the edit UI closes
- **Preconditions:** User is editing **Web Development 2026** (edit modal open, form pre-populated).
- **Steps:**
  1. In **Name**, replace the value with **Web Development 2026 - Updated**.
  2. Click **Save**.
- **Expected result:** The modal closes without error. The Programs list refreshes or updates in place and shows a row whose **Name** is **Web Development 2026 - Updated**. No duplicate row for the old name remains.
- **Priority:** High

### TC-003

- **Title:** Saving after changing only Description leaves Name and all other fields unchanged
- **Preconditions:** User is editing program **Web Development 2026** with initial Name `Web Development 2026`, Description `Original cohort description`, Start date `2026-01-15`, End date `2026-06-30`, Status `Active`.
- **Steps:**
  1. Change **Description** to `Updated: emphasis on React and Node.js projects.`
  2. Do not change **Name**, **Start date**, **End date**, or **Status**.
  3. Click **Save**.
- **Expected result:** Modal closes successfully. In the list and on subsequent open of edit for the same program: **Name** remains `Web Development 2026`, **Start date** `2026-01-15`, **End date** `2026-06-30`, **Status** `Active`; **Description** is `Updated: emphasis on React and Node.js projects.`
- **Priority:** High

### TC-004

- **Title:** Name and Description can both be updated in one save
- **Preconditions:** Edit modal open for **Web Development 2026** with baseline values as in TC-003.
- **Steps:**
  1. Set **Name** to `Web Development 2026 - Spring`.
  2. Set **Description** to `Spring track; includes capstone.`
  3. Click **Save**.
- **Expected result:** Save succeeds; list shows **Web Development 2026 - Spring** with the new description when viewed or reopened for edit.
- **Priority:** Medium

### TC-005

- **Title:** Optional fields cleared to empty still save if business rules allow optional Description
- **Preconditions:** Program exists with non-empty **Description**; product rule allows empty Description (if not allowed, this case documents expected validation instead—execute against actual spec).
- **Steps:**
  1. Open edit for that program.
  2. Clear **Description** entirely.
  3. Click **Save**.
- **Expected result:** Per product rules: either save succeeds and **Description** is stored empty, or validation blocks save with a clear message (document actual behavior).
- **Priority:** Low

---

## Negative flows

### TC-006

- **Title:** Program list must not show a new name if save fails
- **Preconditions:** Edit modal open for **Web Development 2026**. Ability to simulate save failure (e.g. offline mode, API error mock, or invalid server state).
- **Steps:**
  1. Change **Name** to `Web Development 2026 - Should Not Persist`.
  2. Trigger conditions so **Save** returns an error (network 500, timeout, or validation failure).
  3. Observe the list and reopen edit if the modal stays open.
- **Expected result:** User sees an error message; **Name** in the list remains **Web Development 2026**. Reopening edit shows either unsaved changes or last saved server state—not a silent success.
- **Priority:** High

### TC-007

- **Title:** Required Name must not be saved as empty
- **Preconditions:** Edit modal open; **Name** is required by application rules.
- **Steps:**
  1. Clear **Name** (empty string).
  2. Click **Save**.
- **Expected result:** Save is blocked; inline or summary validation states that **Name** is required. Modal stays open; list unchanged.
- **Priority:** High

### TC-008

- **Title:** Invalid date range must not be persisted
- **Preconditions:** Edit modal open; **Start date** and **End date** exist.
- **Steps:**
  1. Set **Start date** to `2026-06-30` and **End date** to `2026-01-15`.
  2. Click **Save**.
- **Expected result:** Validation error (e.g. end before start); no partial update; list and stored program unchanged.
- **Priority:** Medium

### TC-009

- **Title:** Unauthorized user must not open edit or must not save changes
- **Preconditions:** User session without program-edit permission (or read-only role).
- **Steps:**
  1. Open Programs page.
  2. Attempt to click **edit** on **Web Development 2026** (if visible).
  3. If edit opens via deep link or API, attempt **Save** with a trivial change.
- **Expected result:** Edit control hidden/disabled, or action denied with appropriate messaging; no successful save; audit/security behavior per policy.
- **Priority:** High

### TC-010

- **Title:** Modal must not close without persisting when Save is clicked and backend rejects payload
- **Preconditions:** Edit open; payload can be rejected (e.g. stale version, conflict).
- **Steps:**
  1. Change **Description** to `Conflict test`.
  2. Simulate concurrent update of same program from another session, then click **Save**.
- **Expected result:** User receives conflict or refresh prompt; modal behavior is consistent (typically remains open); list does not show misleading success.
- **Priority:** Medium

### TC-011

- **Title:** Discard or Cancel must not update the program list
- **Preconditions:** Edit modal open; **Name** changed in UI only to `Web Development 2026 - Discarded`.
- **Steps:**
  1. Click **Cancel** or close modal via **X** (per UX).
  2. If a “unsaved changes” dialog appears, confirm discard.
- **Expected result:** List still shows **Web Development 2026** (original name). Reopening edit shows original server values.
- **Priority:** Medium

---

## Edge cases

### TC-012

- **Title:** Name at maximum allowed length saves and displays correctly
- **Preconditions:** Known max length for **Name** (e.g. 120 characters). Construct string of exactly 120 characters: `Web Development 2026 ` + filler to reach limit without exceeding.
- **Steps:**
  1. Open edit for **Web Development 2026**.
  2. Paste the 120-character **Name** into **Name**.
  3. Click **Save**.
- **Expected result:** Save succeeds; list and detail show full string without truncation mid-character; no server error.
- **Priority:** Medium

### TC-013

- **Title:** Name one character over maximum is rejected or truncated per rules
- **Preconditions:** Max **Name** length 120 (adjust to real limit).
- **Steps:**
  1. Enter 121 characters in **Name**.
  2. Click **Save**.
- **Expected result:** Validation prevents save or UI blocks input at 121st character—behavior matches documented rule; no corrupt value stored.
- **Priority:** Medium

### TC-014

- **Title:** Description at maximum length (e.g. 5000 characters) saves completely
- **Preconditions:** Max **Description** length defined (use 5000 if unknown; replace with actual).
- **Steps:**
  1. Fill **Description** with 5000-character text (mixed letters and newlines).
  2. Click **Save**.
- **Expected result:** Save succeeds; reopening edit shows full text.
- **Priority:** Low

### TC-015

- **Title:** Special characters in Name are stored and displayed verbatim
- **Preconditions:** Edit open for **Web Development 2026**.
- **Steps:**
  1. Set **Name** to `Web Dev 2026 <Advanced> & "React" — 100%`.
  2. Click **Save**.
- **Expected result:** List shows the same string; HTML/script is not executed; encoding is correct (no `&amp;` visible unless intentional).
- **Priority:** Medium

### TC-016

- **Title:** Unicode and emoji in Description persist correctly
- **Preconditions:** Edit open.
- **Steps:**
  1. Set **Description** to `Cohort in Zürich — 日本語 intro — 🚀 launch week.`
  2. Click **Save**.
- **Expected result:** Characters render correctly in list (if shown) and in edit form after reload.
- **Priority:** Low

### TC-017

- **Title:** Duplicate program Name is rejected when names must be unique
- **Preconditions:** Programs **Web Development 2026** and **Data Science 2026** exist. Product requires unique **Name** per tenant.
- **Steps:**
  1. Edit **Web Development 2026**.
  2. Set **Name** to `Data Science 2026`.
  3. Click **Save**.
- **Expected result:** Validation or server error: name already exists; no overwrite of the other program; original names preserved.
- **Priority:** High

### TC-018

- **Title:** Leading and trailing whitespace in Name is handled per product rules
- **Preconditions:** Edit open.
- **Steps:**
  1. Set **Name** to `  Web Development 2026 - Trim Test  `.
  2. Click **Save**.
- **Expected result:** Either trimmed to `Web Development 2026 - Trim Test` on save or validation rejects; list must not show confusing double spaces if trimming is required.
- **Priority:** Medium

### TC-019

- **Title:** Description containing only whitespace is rejected or stored as empty per rules
- **Preconditions:** Edit open.
- **Steps:**
  1. Set **Description** to three spaces and one newline.
  2. Click **Save**.
- **Expected result:** Consistent with TC-005 and validation rules (reject or normalize); **Name** unchanged.
- **Priority:** Low

### TC-020

- **Title:** Rapid double-click on Save does not create duplicate updates or inconsistent UI
- **Preconditions:** Edit open; **Name** changed to `Web Development 2026 - Once`.
- **Steps:**
  1. Double-click **Save** quickly.
- **Expected result:** Single logical save; no duplicate API calls causing errors, or idempotent handling; modal closes once; list shows one updated row.
- **Priority:** Medium

---

## Traceability (AC coverage)

| Jira scenario | Test case IDs | Gap |
| --- | --- | --- |
| Open program for editing (pre-populated form) | TC-001 | None |
| Successfully edit program name (modal closes, list updates) | TC-002 | None |
| Edit preserves unchanged fields when only Description changes | TC-003 | None |

**Overall DS-2 ↔ Jira coverage:** Complete for all stated acceptance criteria.

---

## Ambiguities and gaps in the acceptance criteria

1. **“Other fields”** — The third scenario requires **Name** and “other fields” unchanged but only **Description** is named besides **Name**. Which attributes exist (e.g. **Start date**, **End date**, **Status**, **Capacity**, **Instructor**, **Tags**) is unspecified; testers need a canonical field list and persistence rules.

2. **Uniqueness of Name** — No AC states whether two programs may share the same **Name**; duplicate behavior is undefined.

3. **Validation rules** — Required fields, max lengths, allowed characters, and date constraints are not in the ACs; TCs assume common patterns.

4. **Cancel / unsaved changes** — No scenario for abandoning edits; risk of accidental data loss or unclear UX is not covered.

5. **Immediate list update** — “Immediately” is not defined (synchronous refresh vs. optimistic UI vs. polling); failure rollback is not specified.

6. **Permissions and multi-tenant** — Who may edit, and whether program names are unique per account or global, is unstated.

7. **Concurrent editing** — No AC for two users editing the same program; last-write-wins vs. conflict detection is undefined.

8. **Accessibility and keyboard** — No requirement to verify modal focus trap, **Esc** behavior, or save via keyboard.

9. **Empty Description** — Whether **Description** is optional and whether empty string is allowed is not stated.

10. **Audit / history** — Whether edits are logged or versioned is not covered by the ACs.

---

## Automation alignment

Playwright spec: [`tests/ds2-edit-program.spec.ts`](../../tests/ds2-edit-program.spec.ts)

| Test plan TC | Automated | Notes |
| --- | --- | --- |
| TC-001 – TC-005 | Yes | Uses `uniqueName()` for isolation; edit via first row action button (✏️) |
| TC-007, TC-011 | Yes | |
| TC-012 – TC-020 | Yes | TC-017 documents [SS-25](https://legionqaschool.atlassian.net/browse/SS-25) (duplicate names allowed) |
| TC-006, TC-008, TC-009, TC-010 | `test.fixme` | API mock, date fields N/A, non-admin account, conflict simulation |

**Verified UI (test.didaxis.studio):** Edit modal exposes **Program Name**, **Description**, and additional fields (hours, audience, etc.) — not **Start date** / **End date** / **Status** from the written plan examples.

---
