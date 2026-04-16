# Implementation Report: PRO-H7 — `setState` in `useEffect` in `InteractionEditDialog`

## Summary
Replaced the `useEffect(() => setState(...), [interaction])` prop-sync anti-pattern with a `key`-based remount strategy. The parent (`CallResultDialog`) now passes `key={editingInteraction?.id}` so the child's lazy `useState` initializers re-run on every new interaction, avoiding the extra render pass that could race with form submission (same class of bug as hotfix `8e1405f7`).

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Severity | HIGH | HIGH |
| Size | S | S |
| Files Changed | 1 + 1 test | 2 modified + 1 test |

The plan predicted 1 file modification; in reality the parent call-site also needed a 1-line change to pass the `key`, so 2 source files touched.

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Remove `useEffect` prop-sync from `InteractionEditDialog` | Complete | Extracted `computeInitialValues()` pure helper |
| 2 | Initialize state via `useMemo` + lazy `useState()` | Complete | Memo stable, useState takes `initial.x` on first render only |
| 3 | Pass `key` from `CallResultDialog` | Complete | `key={editingInteraction?.id ?? "none"}` |
| 4 | Add regression tests | Complete | 5 tests (mount-initial, remount-on-key, no-hidden-sync-without-key, null prop, no-date default) |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (lint) | Pass for changed files | Total errors 87 (was 88 — removed the `set-state-in-effect` violation on this file) |
| Type Check | Pass | No TS errors on touched files |
| Unit Tests | Pass | 1222/1222 — 5 new, all green |
| Build (`npm run build`) | Pass | |
| Edge Cases | Pass | Null interaction → null render; no date → "09:00" fallback |

## Files Changed

| File | Action | Notes |
|---|---|---|
| `crm/src/components/prospection/InteractionEditDialog.tsx` | UPDATED | Removed `useEffect` + `useState("")` pattern, added `computeInitialValues()` + `useMemo` + lazy `useState()` |
| `crm/src/components/prospection/CallResultDialog.tsx` | UPDATED | Added `key={editingInteraction?.id ?? "none"}` on the dialog (+ inline comment) |
| `crm/src/components/prospection/__tests__/InteractionEditDialog.test.tsx` | CREATED | 5 tests pinning the new contract |

## Deviations from Plan
None.

## Issues Encountered
None. Straightforward application of the `RESET_PATTERN` from the plan.

## Tests Written

| Test | What it asserts |
|---|---|
| "initializes the form from the interaction prop without any useEffect sync" | Mount with interaction=A → fields reflect A |
| "shows the new interaction's values after a key-triggered remount" | `key` change → fresh state from new prop |
| "keeps the initial values when the interaction prop changes WITHOUT a key change (confirms no hidden useEffect sync)" | Inverse regression guard: prove the bug (silent overwrite) is gone |
| "renders null when no interaction is passed (dialog closed state)" | `interaction={null}` → empty DOM |
| "initializes with safe defaults when the interaction has no date" | Missing date → time defaults to "09:00" |

## Next Steps
- [ ] Continue Sprint 1 with PRO-H8 (same pattern, `EmailComposer`) and PRO-H5 (same pattern, `prospection/page.tsx`).
- [ ] After all three H5/H7/H8 land, enable `react-hooks/set-state-in-effect` as a CI gate (TRX-1).
