# Test plan: Program list filtering and display

**Feature:** Program list filtering and display  
**Primary UI:** **Programs** page — list view with **Program name** and **Description** per row  
**Note:** Acceptance criteria define **display** and **empty state**; **filtering** is named in the feature title but not specified in ACs — covered in edge cases and gaps where applicable.

---

## Positive flows

### TC-001

- **Title:** Each program row shows **Program name** and **Description** when data exists
- **Preconditions:** At least three programs exist: **Web Development 2026** (`Description`: `Full-stack cohort starting January 2026`), **Data Science 2026** (`Description`: `Python, ML, and data engineering track`), **Informatique & IA - Niveau 2** (`Description`: `Cycle secondaire — sciences et numérique`). User is logged in with access to Programs.
- **Steps:**
  1. Navigate to the **Programs** page (via main navigation or direct URL per product).
- **Expected result:** A list (table, cards, or stacked rows) is visible. For every program above, the UI shows its **Program name** and **Description** text in the same row/card, readable without opening a detail view. Order is deterministic (e.g. alphabetical or by **Created date** — document actual rule).
- **Priority:** High

### TC-002

- **Title:** Empty state message and first-program prompt appear when the system has no programs
- **Preconditions:** Environment (or tenant) has zero programs — verified via admin or database seed. User has permission to view Programs and to create programs (so the prompt is actionable).
- **Steps:**
  1. Navigate to the **Programs** page.
- **Expected result:** No program rows are shown. User sees a clear message that **no programs have been created** (or equivalent wording). User sees a **prompt to create the first program** (e.g. button **Create program**, link **Add your first program**, or empty-state illustration with CTA). Clicking the CTA navigates to or opens the program creation flow.
- **Priority:** High

### TC-003

- **Title:** List remains correct after refresh when programs exist
- **Preconditions:** Same as TC-001; page already loaded once.
- **Steps:**
  1. Perform a full browser refresh on the **Programs** page.
- **Expected result:** All three programs still appear with matching **Program name** and **Description**; no duplicate phantom rows.
- **Priority:** Medium

### TC-004

- **Title:** Single program in the system displays name and description without empty-state copy
- **Preconditions:** Exactly one program exists: **Test Program**, **Description** `Smoke test program for list UI`.
- **Steps:**
  1. Open **Programs** page.
- **Expected result:** One row shows **Test Program** and the description; empty-state message from TC-002 is **not** shown.
- **Priority:** High

---

## Negative flows

### TC-005

- **Title:** Program list must not expose names or descriptions the user is not permitted to see
- **Preconditions:** User role restricted (e.g. no access to certain programs) if row-level security exists; otherwise use user with zero programs in scope.
- **Steps:**
  1. Navigate to **Programs** as restricted user.
- **Expected result:** List shows only allowed programs, or empty state / access denied per security design. No partial leak of **Program name** from hidden records in HTML or network responses visible in browser devtools (per security review scope).
- **Priority:** High

### TC-006

- **Title:** Empty state must not appear when programs exist
- **Preconditions:** **Web Development 2026** exists.
- **Steps:**
  1. Open **Programs** page.
- **Expected result:** List with at least one row is shown; “no programs” message and “create first program” empty-state block are absent (creation may still be available via header button).
- **Priority:** High

### TC-007

- **Title:** API or network failure must not show a false empty state with “create first program”
- **Preconditions:** Programs exist; ability to block API or simulate 500 for programs list.
- **Steps:**
  1. Open **Programs** with list request failing.
- **Expected result:** User sees error state (retry, error message), **not** the “no programs created” empty state, unless product explicitly maps errors to empty (document bug if so).
- **Priority:** High

### TC-008

- **Title:** List must not swap name and description columns or labels
- **Preconditions:** Programs with distinct short **Program name** and long **Description** (e.g. Name `DS-2026`, Description `This is intentionally longer text for column alignment testing.`).
- **Steps:**
  1. Open **Programs** page.
- **Expected result:** Column headers or visual hierarchy match spec: **Program name** column shows short name; **Description** shows longer text; no cross-mapping.
- **Priority:** Medium

### TC-009

- **Title:** Unauthorized user must not see program list content
- **Preconditions:** User not authenticated or without Programs permission.
- **Steps:**
  1. Navigate to **Programs** URL.
- **Expected result:** Redirect to login or **403** / “access denied”; no program names rendered.
- **Priority:** High

---

## Edge cases

### TC-010

- **Title:** Very long **Description** displays without breaking layout (truncate, tooltip, or expand)
- **Preconditions:** Program **Web Development 2026** has **Description** at or near max length (e.g. 5000 characters of mixed text).
- **Steps:**
  1. Open **Programs** page.
- **Expected result:** Layout does not overflow horizontally; user can read full text via ellipsis + tooltip, **Show more**, or row expand — per UX spec; no browser freeze.
- **Priority:** Medium

### TC-011

- **Title:** Very long **Program name** displays correctly within list constraints
- **Preconditions:** Program with **Program name** at max length (e.g. 120 characters: `Program ` + unique filler to 120 chars).
- **Steps:**
  1. Open **Programs** page.
- **Expected result:** Name visible in full or with consistent truncation + access to full string; row remains aligned with others.
- **Priority:** Medium

### TC-012

- **Title:** Special characters and HTML-like text in name and description render safely
- **Preconditions:** Program **R&D "Phase 1" - Cost: 100%** with **Description** `Learn <HTML> & "quotes" — 50% practice.`
- **Steps:**
  1. Open **Programs** page.
- **Expected result:** Characters display literally; no executed HTML/script; ampersands and quotes readable.
- **Priority:** Medium

### TC-013

- **Title:** Unicode and accented text display correctly in name and description
- **Preconditions:** Program **École d'été — Zürich** with **Description** `日本語サマー — cohort mixte.`
- **Steps:**
  1. Open **Programs** page.
- **Expected result:** Correct glyphs and direction; no tofu characters.
- **Priority:** Medium

### TC-014

- **Title:** Empty **Description** stored in database shows sensible placeholder or blank cell
- **Preconditions:** Program **Minimal Program 2026** exists with **Description** empty or null per data rules.
- **Steps:**
  1. Open **Programs** page.
- **Expected result:** **Program name** shows; **Description** column shows empty, em dash, or “No description” per product rule — consistently across rows.
- **Priority:** Medium

### TC-015

- **Title:** Duplicate **Program name** in data (if allowed) still shows two rows with distinct descriptions
- **Preconditions:** Two programs share **Program name** `Test Program` but differ in **Description** (`Cohort A` vs. `Cohort B`) and internal id — only if product allows duplicate names.
- **Steps:**
  1. Open **Programs** page.
- **Expected result:** Two rows visible; user can distinguish them by **Description** or secondary column if present; no merged row bug.
- **Priority:** Low

### TC-016

- **Title:** Pagination or “load more” when many programs exist (e.g. 100+)
- **Preconditions:** Seed 150 programs with unique names `Bulk Program 001` … `Bulk Program 150`.
- **Steps:**
  1. Open **Programs** page; navigate pages or scroll.
- **Expected result:** Performance acceptable; each visible row still shows **Program name** and **Description**; page numbers or infinite scroll consistent.
- **Priority:** Medium

### TC-017

- **Title:** Search or filter by name (if feature exists) narrows list without losing column data
- **Preconditions:** Programs **Web Development 2026**, **Web Design 2026**, **Data Science 2026** exist; UI has search box **Search programs** or filter control (skip if not implemented — document as N/A).
- **Steps:**
  1. Enter `Web Dev` in search (or select filter matching “Web”).
- **Expected result:** List shows only matching programs; each row still shows **Program name** and **Description**. Clearing search restores full list.
- **Priority:** Medium

### TC-018

- **Title:** Filter that matches nothing shows zero rows with appropriate copy
- **Preconditions:** Search/filter exists; programs exist.
- **Steps:**
  1. Search for `zzzz-no-match-12345`.
- **Expected result:** Zero rows; message such as “No programs match your search” — **not** the global “no programs have been created” empty state (unless product conflates them — flag as UX gap).
- **Priority:** Medium

### TC-019

- **Title:** Empty state CTA is keyboard and screen-reader accessible
- **Preconditions:** Zero programs; empty state visible.
- **Steps:**
  1. Tab to “create first program” control; activate with **Enter**.
- **Expected result:** Focus order logical; control has accessible name; creation flow opens.
- **Priority:** Low

### TC-020

- **Title:** List sorting stability when two programs have identical **Description**
- **Preconditions:** Two programs with same **Description** `Shared boilerplate text.` but different **Program name** (`Alpha Track`, `Beta Track`).
- **Steps:**
  1. Open **Programs** page; apply sort on **Description** if available.
- **Expected result:** Stable, predictable order; both rows always show correct paired **Program name** and **Description**.
- **Priority:** Low

---

## Traceability (AC coverage)

| Acceptance scenario | Test case IDs |
|---------------------|---------------|
| List shows each program’s **name** and **description** | TC-001, TC-003, TC-004, TC-008 |
| Empty state: no programs message + create-first prompt | TC-002 |
| Empty state must not appear when data exists | TC-006 |

---

## Ambiguities and gaps in the acceptance criteria

1. **Feature name vs. ACs** — Title references **filtering**, but ACs only cover default list display and empty state. Search, status filters, date range, and sort are **undefined**; TC-017–TC-018 assume possible UI.

2. **“Programs exist in the system”** — Scope unclear (all tenants vs. current user’s org); affects TC-005 and TC-001.

3. **Additional columns** — AC requires **name** and **description** only; real UI may show **Start date**, **Status**, actions — not specified.

4. **Empty description** — Not covered; TC-014 documents need for a rule.

5. **Empty state exact copy** — Wording of “no programs” and CTA label not specified; localization not mentioned.

6. **Pagination / performance** — No NFR in ACs; TC-016 addresses scale.

7. **Error vs. empty** — TC-007: distinction between “zero results” and “failed to load” is not in ACs.

8. **Duplicates** — Whether two programs may share a name is unstated (TC-015).

9. **Mobile / responsive** — Layout behavior for narrow viewports not stated.

10. **Real-time updates** — If another user creates a program, whether list auto-refreshes is not specified.

---

*Prepared as QA output for the prompt stored in `program-list-filtering-display-test-plan-prompt.md`.*
