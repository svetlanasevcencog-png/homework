# Test Plan – DS-4: Delete Program with Confirmation

**Jira:** [DS-4 – Delete program with confirmation](https://legionqaschool.atlassian.net/browse/DS-4)  
**Feature:** Delete program with confirmation  
**Context:** Programs list with per-row **delete** icon; confirmation **dialog** before permanent removal  
**Sample program from ACs:** **Test Program**

**Source ACs (Jira):**

```gherkin
Scenario: Delete program with confirmation
  Given a program "Test Program" exists
  When I click the delete icon for "Test Program"
  Then I see a confirmation dialog
  When I confirm deletion
  Then "Test Program" is removed from the program list

Scenario: Cancel program deletion
  Given I click the delete icon for a program
  When I see the confirmation dialog
  And I click Cancel
  Then the program still exists in the list
```

**Coverage status:** Both Jira AC scenarios are covered by this test plan (2/2). TC-004 uses **Test Program** explicitly for the cancel path; TC-003 covers cancel with a named alternate program.

---

## Positive flows

### TC-001

- **Title:** Confirmation dialog appears when initiating delete for a specific program
- **Preconditions:** User is on the **Programs** page with permission to delete programs. Program **Test Program** exists in the list (visible row with **Program name** `Test Program`).
- **Steps:**
  1. Locate the row for **Test Program**.
  2. Click the **delete** icon (trash) for that row.
- **Expected result:** A confirmation **dialog** (modal or browser confirm) appears. The message clearly refers to deleting **Test Program** (or equivalent program identifier). Primary actions **Confirm** / **Delete** and **Cancel** (or labels used in the product) are visible.
- **Priority:** High

### TC-002

- **Title:** Program is removed from the list after user confirms deletion
- **Preconditions:** Confirmation dialog is open after clicking **delete** on **Test Program**. No other filter hides the row.
- **Steps:**
  1. Click the confirmation action that proceeds with deletion (e.g. **Delete**, **Confirm**, **Yes** — use actual label).
  2. Wait for the UI to finish updating.
- **Expected result:** Dialog closes. **Test Program** no longer appears in the program list. If the list is paginated, counts/totals update accordingly. No error toast unless deletion failed (success path only).
- **Priority:** High

### TC-003

- **Title:** Program remains in the list when user cancels from the confirmation dialog
- **Preconditions:** User clicked **delete** on a program row; confirmation dialog is visible. Use program **Web Development 2026** for a concrete second example if **Test Program** was already deleted in a prior test.
- **Steps:**
  1. Note the target program’s **Program name** (e.g. **Web Development 2026**).
  2. Click **Cancel** (or **No**, **Close** — actual dismiss control that means “do not delete”).
- **Expected result:** Dialog closes. The same program row is still present with the same **Program name** and data. No success message for deletion; program still openable/editable if those features exist.
- **Priority:** High

### TC-004

- **Title:** Cancel preserves **Test Program** when that is the program under delete
- **Preconditions:** **Test Program** exists. User opened delete confirmation for **Test Program** specifically.
- **Steps:**
  1. Click **Cancel** on the confirmation dialog.
- **Expected result:** **Test Program** remains in the list unchanged (matches AC “Cancel program deletion” for the named program).
- **Priority:** High

---

## Negative flows

### TC-005

- **Title:** Program must not be deleted if confirmation is never completed
- **Preconditions:** Delete dialog open for **Test Program** (or **Data Science 2026**).
- **Steps:**
  1. Do not click **Confirm**; only **Cancel** or dismiss (per TC-003 path).
- **Expected result:** No DELETE (or equivalent) API success for that program; server state unchanged for that id.
- **Priority:** High

### TC-006

- **Title:** Deletion must not occur when the server returns an error after confirm
- **Preconditions:** Ability to simulate failed delete (network offline, 500 response, or permission revoked mid-action).
- **Steps:**
  1. Open delete for **Test Program** and confirm deletion under failure conditions.
- **Expected result:** User sees an error message. **Test Program** remains in the list (or list refreshes to show it still exists). Dialog closes or stays open per UX, but UI does not claim success.
- **Priority:** High

### TC-007

- **Title:** User without delete permission must not remove a program from the list
- **Preconditions:** Read-only or non-admin user on Programs page; **Test Program** exists.
- **Steps:**
  1. Verify **delete** icon is hidden, disabled, or action returns **403** if forced via API.
- **Expected result:** **Test Program** cannot be deleted by this user; no confirmation dialog leading to successful delete.
- **Priority:** High

### TC-008

- **Title:** Double confirmation click must not cause inconsistent UI or duplicate error storms
- **Preconditions:** Delete confirmation open for **Test Program**; network slow or throttled.
- **Steps:**
  1. Rapidly double-click **Confirm** / **Delete**.
- **Expected result:** At most one successful delete; no duplicate modals; if second request errors (404), user sees handled message; list ends in correct state (program gone once).
- **Priority:** Medium

### TC-009

- **Title:** Program must not disappear from list before successful server acknowledgment
- **Preconditions:** Throttled network; delete flow uses async request.
- **Steps:**
  1. Confirm deletion of **Test Program** and observe list during request.
- **Expected result:** Either optimistic UI with rollback on failure, or row removed only after success — behavior is consistent; on failure, row returns (if optimistic) or never leaves until success.
- **Priority:** Medium

### TC-010

- **Title:** Deleting one program must not remove a different program
- **Preconditions:** **Test Program** and **Web Development 2026** both listed.
- **Steps:**
  1. Click **delete** on **Test Program** only.
  2. Confirm deletion.
- **Expected result:** Only **Test Program** is removed; **Web Development 2026** remains.
- **Priority:** High

---

## Edge cases

### TC-011

- **Title:** Confirmation copy displays correctly for program name with special characters
- **Preconditions:** Program **Informatique & IA - Niveau 2** exists.
- **Steps:**
  1. Click **delete** for that row.
- **Expected result:** Dialog shows the full name including `&`, hyphens, and accents without broken encoding or HTML injection.
- **Priority:** Medium

### TC-012

- **Title:** Confirmation copy displays correctly for very long program name (boundary display)
- **Preconditions:** Program exists with **Program name** at max length (e.g. 120 characters: `Test Program ` + filler to reach limit).
- **Steps:**
  1. Click **delete** for that program.
- **Expected result:** Dialog remains usable; long name wraps or scrolls without hiding **Cancel** / **Confirm**; no clipped unreadable title.
- **Priority:** Low

### TC-013

- **Title:** Keyboard **Escape** dismisses confirmation without deleting (if product standard)
- **Preconditions:** Delete dialog open for **Test Program**.
- **Steps:**
  1. Press **Escape**.
- **Expected result:** Dialog closes; **Test Program** still in list (same as cancel). If **Escape** is not supported, document actual behavior as gap vs. accessibility expectations.
- **Priority:** Medium

### TC-014

- **Title:** Clicking dialog backdrop (if present) cancels deletion without removing program
- **Preconditions:** Modal with dismiss-on-backdrop behavior (if implemented).
- **Steps:**
  1. Click outside the dialog on the backdrop.
- **Expected result:** Dialog closes; program remains. If backdrop does not close dialog, behavior matches spec.
- **Priority:** Low

### TC-015

- **Title:** Deleting the only program on the page shows appropriate empty state
- **Preconditions:** List filtered or environment where only **Test Program** exists.
- **Steps:**
  1. Confirm delete of **Test Program**.
- **Expected result:** List shows empty state or “no programs” message; no JavaScript errors; pagination resets sensibly.
- **Priority:** Medium

### TC-016

- **Title:** Two users: one deletes program while another has it open for edit
- **Preconditions:** Two sessions; user B editing **Test Program** while user A deletes it.
- **Steps:**
  1. User A confirms delete.
  2. User B attempts **Save** on edit form.
- **Expected result:** User B receives clear error (not found / conflict); no partial corrupt state; list for B refreshes to show program gone.
- **Priority:** Medium

### TC-017

- **Title:** Program name containing quotes or angle brackets renders safely in dialog
- **Preconditions:** Program **R&D "Phase 1" - Cost: 100%** or **Web <Dev> 2026** exists (unique names).
- **Steps:**
  1. Open delete confirmation.
- **Expected result:** Message shows literal name; no XSS; **Confirm** still works.
- **Priority:** Medium

### TC-018

- **Title:** Duplicate display names in list (if allowed) still delete only the selected row
- **Preconditions:** Two rows show same **Program name** `Test Program` but different internal IDs (only if product allows duplicates).
- **Steps:**
  1. Delete one row via its **delete** icon; confirm.
- **Expected result:** Exactly one program record removed; the other row remains (verify by secondary field e.g. **Start date** if shown).
- **Priority:** Low

### TC-019

- **Title:** Focus management when dialog opens and closes (accessibility)
- **Preconditions:** Delete triggered from **delete** icon on **Test Program**.
- **Steps:**
  1. Open dialog; observe focus on primary control or title.
  2. **Cancel**; observe focus returns to a sensible element (e.g. triggering row or **delete** button).
- **Expected result:** Meets WCAG focus expectations for modals (document pass/fail).
- **Priority:** Low

### TC-020

- **Title:** Cancel from dialog does not leave delete icon in stuck loading state
- **Preconditions:** Open delete for **Data Science Bootcamp 2026**; cancel.
- **Steps:**
  1. After cancel, click **delete** again on the same row.
- **Expected result:** New confirmation opens; controls responsive; no stuck spinner on icon.
- **Priority:** Low

---

## Traceability (AC coverage)

| Jira scenario | Test case IDs | Gap |
| --- | --- | --- |
| Delete with confirmation → dialog → confirm → removed from list | TC-001, TC-002, TC-010 | None |
| Cancel deletion → program still in list | TC-003, TC-004, TC-005 | None |

**Overall DS-4 ↔ Jira coverage:** Complete for all stated acceptance criteria.

---

## Ambiguities and gaps in the acceptance criteria

1. **Soft vs. hard delete** — AC says “removed from the list” but not whether the record is archived, recoverable, or permanently purged; affects audit and restore testing.

2. **Dialog type** — Native `window.confirm` vs. custom modal changes keyboard, backdrop, and accessibility behavior (TC-013, TC-014, TC-019).

3. **Dependencies** — No AC for programs linked to cohorts, enrollments, or courses; delete might need to be blocked or cascade; not specified.

4. **Naming** — Second scenario says “a program” without a fixed name; testing still valid but less precise than the first scenario’s **Test Program**.

5. **Success feedback** — No requirement for toast, undo, or analytics after confirm; only list removal is stated.

6. **Concurrent operations** — No AC for delete while another user edits (TC-016).

7. **Error handling** — Failed network or server error after confirm is not covered in ACs.

8. **Permissions** — Who may delete is not stated (TC-007).

9. **Search/filter** — After delete, whether list refresh preserves filters or pagination is unspecified.

10. **Undo** — No mention of recovery window; if product adds undo later, confirmation copy may need to change.

---
