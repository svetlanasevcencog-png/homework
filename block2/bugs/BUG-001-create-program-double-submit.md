# BUG-001 – Create Program: double-click creates two identical programs

| | |
| --- | --- |
| **ID** | BUG-001 |
| **Title** | Rapid double-click on **Create** in the "New Program" modal creates two duplicate programs |
| **Component** | Didaxis Studio · Programs · New Program modal |
| **Severity** | Major |
| **Priority** | High |
| **Reporter** | QA |
| **Reported on** | 2026-05-13 |
| **Environment** | `https://test.didaxis.studio` (test env), Chromium (Playwright 1.59.x), admin role |
| **Build / Commit** | unknown – test env, no build banner exposed |
| **Related test** | `tests/ds1-create-program.spec.ts` → `TC-E-009 Rapid double-click on Create does not create two programs` (currently `test.fixme`) |
| **Linked test plan item** | `block2/test-plan-ds1-create-program.md` §8 → *Items intentionally not covered by automated tests* → **Idempotent submit** |

---

## Summary

The **Create** button in the *New Program* modal is **not disabled while the create request is in flight**. Clicking it twice in quick succession (a real-world double-click, or a fast keyboard repeat of `Enter`) fires two POST requests to the create-program endpoint. Both succeed because the backend currently accepts duplicate Program Names, so the user ends up with two identical rows in the Programs list and has to clean one up manually.

## Steps to reproduce

1. Sign in to `https://test.didaxis.studio` as an admin (`DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD`).
2. Navigate to **Programs** (`/programs`).
3. Click **`+ New Program`**.
4. Fill **Program Name** with any value (e.g. `Idempotent <timestamp>`). Leave **Description** empty.
5. **Double-click** the **Create** button (a quick `click + click` within ~200 ms).

## Expected behavior

- The form is submitted **exactly once**.
- The modal closes.
- The Programs list shows **exactly one** new entry with the typed Program Name.

## Actual behavior

- The form is submitted **twice**.
- The modal closes.
- The Programs list shows **two consecutive rows** with the same Program Name (and same Description if any).

### Evidence

Captured from the live Playwright snapshot taken right after the reproduction steps above (`Idempotent 1778705457609`):

```yaml
- row "Idempotent 1778705457609 ✏️ 🗑" [ref=e65]:
    - cell "Idempotent 1778705457609" [ref=e66]:
      - paragraph [ref=e67]: Idempotent 1778705457609
- row "Idempotent 1778705457609 ✏️ 🗑" [ref=e74]:
    - cell "Idempotent 1778705457609" [ref=e75]:
      - paragraph [ref=e76]: Idempotent 1778705457609
```

The original Playwright assertion (later removed in favor of `test.fixme`) failed with:

```text
Error: expect(locator).toHaveCount(expected) failed
Locator:  getByText('Idempotent 1778705457609', { exact: true })
Expected: 1
Received: 2
```

## Root cause (suspected)

- The **Create** button is not flipped to `disabled` (or `aria-busy="true"`) between the click handler and the API response.
- There is no client-side guard against re-entrancy in the submit handler.
- The backend does not enforce a uniqueness constraint or accept an idempotency key, so it persists both POSTs.

The UI guard is enough to close the user-facing window. The backend guard is the stronger fix and would also prevent duplicates from other vectors (network retry, double-tap on touch devices, scripted clients).

## Impact

- **User confusion** – duplicate programs in the list look identical and the user can't tell which one the rest of the app has linked to.
- **Data integrity** – any future "no duplicate Program Names" rule cannot be enforced reliably as long as this is open.
- **Cleanup cost** – the user has to manually delete one of the rows. The delete button (`🗑`) currently has no visible confirmation step, which raises the risk of deleting the wrong one.
- **Test signal** – a single passing run cannot guarantee 1-vs-2 program count, making downstream automated tests (and any monitoring on Program counts) flaky.

## Suggested fix

**Client-side (minimum):**

```tsx
const [submitting, setSubmitting] = useState(false);

const onCreate = async () => {
  if (submitting) return;
  setSubmitting(true);
  try {
    await api.createProgram({ name: name.trim(), description });
    onClose();
  } finally {
    setSubmitting(false);
  }
};

<Button onClick={onCreate} disabled={submitting || !name.trim()}>
  {submitting ? 'Creating…' : 'Create'}
</Button>
```

**Server-side (recommended additional):**

- Accept an `Idempotency-Key` header on the create endpoint and de-duplicate within a short window (e.g. 30 s).
- Optionally add a soft uniqueness check on `(owner_id, name)` once product confirms whether duplicate Program Names are actually allowed.

## Verification / acceptance criteria for the fix

When fixed, the following must all be true:

1. While the create request is in flight, the **Create** button is **disabled** (visually and via the `disabled` attribute / `aria-disabled`).
2. A real double-click on **Create** results in **exactly one** new program in the list.
3. Pressing `Enter` twice quickly in the **Program Name** or **Description** field also results in exactly one new program.
4. `TC-E-009` in `tests/ds1-create-program.spec.ts` can have the `test.fixme` marker removed and passes deterministically on Chromium, Firefox, and WebKit.
5. (If the server-side fix is in scope) replaying the same `Idempotency-Key` twice returns the same Program (no second insert).

## Workarounds

- Click **Create** once and wait for the modal to close before interacting again.
- If a duplicate has already been created, delete the extra row via the `🗑` icon.

## Notes

- Reproduces consistently on Chromium 1.59 via Playwright; not yet exercised on Firefox/WebKit (browsers not installed locally).
- The double-click reproducer is not specific to the mouse — `await createButton.dblclick()` in Playwright reproduces it, and keyboard users hitting `Enter` twice will hit the same window.
- The Programs list also contained many leftover duplicates from earlier QA runs (`Web Development 2026 …`, `Idempotent …`, etc.), independently confirming this is not a one-off race.
