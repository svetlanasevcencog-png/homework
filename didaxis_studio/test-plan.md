# Test Plan – TodoMVC (React)

**Application Under Test:** https://demo.playwright.dev/todomvc/#/
**Author:** Senior QA Engineer
**Scope:** Functional verification of the TodoMVC demo application against the provided Acceptance Criteria, plus edge and negative coverage.

---

## 1. Feature Summary

The TodoMVC application allows a user to:

- Create a todo list (single list, persisted in `localStorage`).
- Add new items via an input field labeled **"What needs to be done?"** (committed with `Enter`).
- Mark items as completed via a per-item checkbox.
- Remove items via a destroy (`×`) button that appears on hover.
- Edit items by double-clicking the label.
- Filter items by **All / Active / Completed**.
- Mark all items completed via the **toggle-all** chevron (`❯`).
- Bulk-remove completed items via **Clear completed**.
- See the count of remaining items in the footer (`X items left`).

---

## 2. Test Environment

| Item | Value |
| --- | --- |
| URL | https://demo.playwright.dev/todomvc/#/ |
| Browsers | Chromium (latest), Firefox (latest), WebKit (latest) |
| Viewport | Desktop 1280×720; Mobile 375×667 (smoke) |
| Storage | `localStorage` cleared before each test |
| Tooling | Playwright Test |

---

## 3. Traceability Matrix (AC → Test Cases)

| AC | Description | Covered by |
| --- | --- | --- |
| AC-1 | Create a todo list | TC-001, TC-002 |
| AC-2 | Add items (4) | TC-002, TC-003 |
| AC-3 | Finish item, expect to be finished | TC-004, TC-005 |
| AC-4 | Remove item from the list, expect to be removed | TC-006, TC-007 |

---

## 4. Positive Flows

### TC-001 – New list shows empty state with no main/footer sections

- **Preconditions:** `localStorage` is empty; user lands on the application URL.
- **Steps:**
  1. Open `https://demo.playwright.dev/todomvc/#/`.
- **Expected result:**
  - Header **"todos"** is visible.
  - Input placeholder reads `What needs to be done?` and has focus.
  - No `.main` section and no `.footer` are rendered (no items, no counter, no filters).
- **Priority:** High

### TC-002 – User can create a list by adding four items

- **Preconditions:** Empty list.
- **Steps:**
  1. Type `Buy milk` in the input and press `Enter`.
  2. Type `Walk the dog` and press `Enter`.
  3. Type `Write test plan` and press `Enter`.
  4. Type `Submit homework` and press `Enter`.
- **Expected result:**
  - List contains exactly 4 items in the order entered.
  - Each item is rendered as unchecked.
  - Footer counter shows `4 items left`.
  - Input is cleared after each submission and retains focus.
- **Priority:** High (covers AC-1 & AC-2)

### TC-003 – Input is cleared after each submission

- **Preconditions:** Empty list.
- **Steps:**
  1. Type `Task A` and press `Enter`.
  2. Inspect the input field value.
- **Expected result:** Input value is `""` and the cursor remains in the input.
- **Priority:** Medium

### TC-004 – Marking an item as completed updates its state

- **Preconditions:** List contains `Buy milk`, `Walk the dog`, `Write test plan`, `Submit homework`.
- **Steps:**
  1. Click the checkbox of `Walk the dog`.
- **Expected result:**
  - `Walk the dog` row has the `completed` class.
  - Its label is rendered with strikethrough styling.
  - Footer counter updates to `3 items left`.
  - **Clear completed** button becomes visible in the footer.
- **Priority:** High (covers AC-3)

### TC-005 – Unchecking a completed item returns it to active state

- **Preconditions:** `Walk the dog` is completed; counter shows `3 items left`.
- **Steps:**
  1. Click the checkbox of `Walk the dog` again.
- **Expected result:**
  - Row no longer has the `completed` class; strikethrough removed.
  - Footer counter returns to `4 items left`.
  - **Clear completed** button is no longer visible.
- **Priority:** Medium

### TC-006 – Removing an item via the destroy button removes only that item

- **Preconditions:** List contains the 4 items from TC-002.
- **Steps:**
  1. Hover over the row `Write test plan`.
  2. Click the `×` (destroy) button that becomes visible on hover.
- **Expected result:**
  - `Write test plan` is removed from the DOM.
  - List length is 3 (`Buy milk`, `Walk the dog`, `Submit homework`) in original order.
  - Footer counter shows `3 items left`.
- **Priority:** High (covers AC-4)

### TC-007 – Removing the last remaining item hides main and footer

- **Preconditions:** List contains exactly one item `Solo task`.
- **Steps:**
  1. Hover the item and click `×`.
- **Expected result:**
  - List is empty.
  - `.main` and `.footer` sections are not rendered (back to empty state per TC-001).
- **Priority:** Medium

### TC-008 – Items persist across page reloads

- **Preconditions:** Four items from TC-002 exist; `Walk the dog` is completed.
- **Steps:**
  1. Reload the page.
- **Expected result:**
  - All 4 items are present in original order.
  - `Walk the dog` remains marked as completed.
  - Counter shows `3 items left`.
- **Priority:** High

### TC-009 – Filtering shows only matching items

- **Preconditions:** Four items exist; `Walk the dog` and `Submit homework` are completed.
- **Steps:**
  1. Click filter **Active**.
  2. Click filter **Completed**.
  3. Click filter **All**.
- **Expected result:**
  - **Active** shows only `Buy milk` and `Write test plan`.
  - **Completed** shows only `Walk the dog` and `Submit homework`.
  - **All** shows all four.
  - URL hash updates to `#/active`, `#/completed`, `#/`, respectively.
- **Priority:** Medium

### TC-010 – Clear completed removes only completed items

- **Preconditions:** Four items exist; `Walk the dog` and `Submit homework` are completed.
- **Steps:**
  1. Click **Clear completed**.
- **Expected result:**
  - Only `Buy milk` and `Write test plan` remain.
  - Counter shows `2 items left`.
  - **Clear completed** button is hidden (no completed items remain).
- **Priority:** Medium

### TC-011 – Toggle-all marks every item as completed; toggling again clears them

- **Preconditions:** Four active items exist.
- **Steps:**
  1. Click the toggle-all chevron `❯` in the header.
  2. Click it again.
- **Expected result:**
  - After first click: all 4 items are completed; counter shows `0 items left`; **Clear completed** is visible.
  - After second click: all 4 items are active; counter shows `4 items left`.
- **Priority:** Medium

### TC-012 – Double-click enables inline editing and Enter saves changes

- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click the label of `Buy milk`.
  2. Replace text with `Buy oat milk`.
  3. Press `Enter`.
- **Expected result:**
  - During edit, the row has the `editing` class and an editable input is focused.
  - After `Enter`: row exits edit mode, label reads `Buy oat milk`, list length unchanged.
- **Priority:** Medium

---

## 5. Negative Flows

### TC-N-001 – Empty submission is rejected

- **Preconditions:** Empty list.
- **Steps:**
  1. Click into the input and press `Enter` without typing.
- **Expected result:** No item is added; `.main` and `.footer` remain hidden.
- **Priority:** High

### TC-N-002 – Whitespace-only submission is rejected

- **Preconditions:** Empty list.
- **Steps:**
  1. Type `"   "` (3 spaces) and press `Enter`.
- **Expected result:** No item is added; input is cleared; list remains empty.
- **Priority:** High

### TC-N-003 – Leading/trailing whitespace is trimmed on add

- **Preconditions:** Empty list.
- **Steps:**
  1. Type `   Buy milk   ` and press `Enter`.
- **Expected result:** A single item with label exactly `Buy milk` is added (no surrounding spaces).
- **Priority:** Medium

### TC-N-004 – Editing to an empty value deletes the item

- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click `Buy milk`.
  2. Clear the field and press `Enter`.
- **Expected result:** `Buy milk` is removed from the list (TodoMVC spec behavior).
- **Priority:** Medium

### TC-N-005 – Escape during edit cancels changes

- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click `Buy milk`.
  2. Type `XYZ`.
  3. Press `Escape`.
- **Expected result:** Edit mode exits; label remains `Buy milk` (unchanged).
- **Priority:** Medium

### TC-N-006 – Destroy button is not visible without hover/focus

- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Move the mouse outside of all rows.
- **Expected result:** The `×` destroy button is not visible (opacity 0 / hidden) for any row.
- **Priority:** Low

### TC-N-007 – Counter never goes negative or shows when list is empty

- **Preconditions:** Single item `Solo task` exists.
- **Steps:**
  1. Complete the item.
  2. Click **Clear completed**.
- **Expected result:** Counter is no longer rendered (footer hidden); no `-1 items left` or `0 items left` is displayed.
- **Priority:** Medium

### TC-N-008 – Clear completed has no effect when no items are completed

- **Preconditions:** Four active items exist; none completed.
- **Steps:**
  1. Observe footer.
- **Expected result:** **Clear completed** button is not rendered. No action possible.
- **Priority:** Low

---

## 6. Edge Cases

### TC-E-001 – Special characters and emojis are accepted verbatim

- **Preconditions:** Empty list.
- **Steps:**
  1. Add the following items in order:
     - `<script>alert(1)</script>`
     - `O'Brien & "Co."`
     - `任务一 / مهمة / задача`
     - `🚀🔥✅ celebrate`
- **Expected result:**
  - 4 items are added with labels rendered exactly as typed (no script execution, no HTML injection; characters rendered as text).
  - Counter shows `4 items left`.
- **Priority:** High

### TC-E-002 – Duplicate titles are allowed and treated as distinct items

- **Preconditions:** Empty list.
- **Steps:**
  1. Add `Buy milk`.
  2. Add `Buy milk` again.
  3. Complete the first occurrence.
- **Expected result:**
  - List contains two rows both labeled `Buy milk`.
  - Only the first row is completed; the second remains active.
  - Counter shows `1 item left` (singular form expected when count is 1).
- **Priority:** Medium

### TC-E-003 – Long title (≥ 500 characters) is accepted and rendered

- **Preconditions:** Empty list.
- **Steps:**
  1. Add an item with a 500-character string (e.g., `'a'.repeat(500)`).
- **Expected result:**
  - Item is added; full text is preserved in `localStorage` and label.
  - Layout does not break (text wraps or is clipped per CSS; row remains interactable).
- **Priority:** Medium

### TC-E-004 – Singular/plural in counter

- **Preconditions:** Empty list.
- **Steps:**
  1. Add 1 item, observe counter.
  2. Add a second item, observe counter.
- **Expected result:**
  - With one active item: `1 item left`.
  - With two active items: `2 items left`.
- **Priority:** Low

### TC-E-005 – Filter selection persists during edits/adds within the same session

- **Preconditions:** Mixed list with active and completed items; filter set to **Active**.
- **Steps:**
  1. Add a new item `New task`.
- **Expected result:**
  - **Active** filter remains selected.
  - `New task` (active) appears in the filtered view.
  - Completed items remain hidden under the **Active** filter.
- **Priority:** Medium

### TC-E-006 – Reload preserves selected filter via URL hash

- **Preconditions:** Filter set to **Completed** (`#/completed`); at least one completed item exists.
- **Steps:**
  1. Reload the page.
- **Expected result:** URL still ends with `#/completed`; only completed items are shown; **Completed** is highlighted in footer.
- **Priority:** Low

### TC-E-007 – Toggle-all chevron reflects mixed state correctly

- **Preconditions:** Four items, two completed, two active.
- **Steps:**
  1. Inspect the toggle-all control.
  2. Click it once.
  3. Click it again.
- **Expected result:**
  - Initial state: control is not "active" (since not all items are completed).
  - After first click: all items completed; control appears active.
  - After second click: all items active (uncompleted); control appears inactive.
- **Priority:** Medium

### TC-E-008 – Editing trims whitespace; pure-whitespace edit deletes item

- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click and change the value to `   Buy bread   `; press `Enter`.
  2. Double-click again and change to `   ` (only spaces); press `Enter`.
- **Expected result:**
  - After step 1: label is exactly `Buy bread` (trimmed).
  - After step 2: the item is deleted.
- **Priority:** Medium

### TC-E-009 – Blur commits edit (same semantics as Enter)

- **Preconditions:** Item `Buy milk` exists.
- **Steps:**
  1. Double-click and change value to `Buy oat milk`.
  2. Click elsewhere on the page (blur the input) without pressing Enter.
- **Expected result:** Edit is committed; label becomes `Buy oat milk`.
- **Priority:** Low

---

## 7. Re-validation Against ACs

| AC | Verified |
| --- | --- |
| AC-1 Create a todo list | TC-001 (empty state), TC-002 (list with 4 items created) |
| AC-2 Add items (4) | TC-002, TC-003; also exercised in TC-008, TC-009, TC-010, TC-011, TC-E-001 |
| AC-3 Finish item, expect to be finished | TC-004 (completes one), TC-005 (un-completes), TC-011 (bulk complete) |
| AC-4 Remove item from the list, expect to be removed | TC-006 (remove one of many), TC-007 (remove the last one), TC-010 (bulk via Clear completed) |

All four acceptance criteria have at least one dedicated positive test case, plus negative and edge coverage above.

---

## 8. Ambiguities & Gaps in the ACs

The provided ACs are minimal; the following points are intentionally not specified and were resolved using TodoMVC reference behavior:

1. **Trim/whitespace rules** – ACs do not state whether `"   "` is a valid title or whether leading/trailing whitespace should be trimmed. Assumed: whitespace-only input is rejected; outer whitespace is trimmed (TC-N-002, TC-N-003).
2. **Empty title on edit** – ACs do not define what happens when an edit clears the value. Assumed: the item is deleted (TC-N-004), per TodoMVC reference.
3. **Duplicates** – ACs do not address duplicate titles. Assumed allowed and distinct (TC-E-002).
4. **Maximum length** – No upper bound is specified for item titles (TC-E-003 uses 500 chars as a reasonable boundary; a true max is unknown).
5. **Special characters / XSS** – ACs do not address HTML/script content. Assumed: rendered as plain text (TC-E-001).
6. **Persistence** – ACs do not mention persistence; the demo persists via `localStorage` (TC-008, TC-E-006).
7. **Filtering, Clear completed, Toggle-all, Edit** – Not mentioned in ACs but are visible features of the UI; covered to prevent regressions (TC-009, TC-010, TC-011, TC-012).
8. **Counter singular/plural and visibility when empty** – ACs do not specify counter behavior; assumed singular for 1, plural otherwise, and hidden when list is empty (TC-E-004, TC-N-007).
9. **Order of items** – ACs do not specify ordering. Assumed: insertion order, newest at the bottom (verified throughout positive flows).
10. **Accessibility / keyboard-only flows** – Not covered by ACs; a dedicated a11y pass (focus order, ARIA labels, screen-reader announcements) is recommended as a follow-up.

