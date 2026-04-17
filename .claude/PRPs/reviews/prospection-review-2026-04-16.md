# Code Review — Prospection Feature

**Reviewed:** 2026-04-16
**Reviewer:** Claude Code (3 parallel ecc:typescript-reviewer agents)
**Branch:** feature/mcp-server
**Scope:** 25 files — page, 20+ components, hooks, schemas, tests, Google Calendar integration
**Decision:** **BLOCK** — 1 CRITICAL + 13 HIGH must be fixed before merge to `main`

---

## Summary

The Prospection module is structurally sound and follows project conventions (React Query, Zod, Shadcn/UI, Supabase). However, review surfaced **1 CRITICAL security flaw** (OAuth token leak), and **13 HIGH** issues split across three domains:

- **Data layer** — unsafe casts, stale cache, broken import schema, dead code
- **UI components** — floating promise, two `setState`-in-`useEffect` ESLint errors, non-null assertions, unvalidated file upload
- **Agenda / Calendar** — prop mutation, broken timezone helper, fragile error parsing

Two of the `setState`-in-effect issues are the **same class of bug** that blocked the save button in commit `8e1405f7` — recurrence suggests a lint rule or codemod is warranted.

---

## Findings

### CRITICAL

**C1 — OAuth access token exposed to browser**
`crm/src/lib/auth.ts:127-128`
`session.accessToken` is serialized into the NextAuth session and reaches the client (`useSession()` / `/api/auth/session`). Scopes include `calendar`, `calendar.events`, `gmail.send`. Any XSS reads the token. Client only needs a boolean flag.
**Fix:** `session.hasCalendarAccess = !!extendedToken.accessToken` — keep token server-only in the JWT; server route handlers already call `auth()` server-side.

---

### HIGH

#### Data layer & page

**H1 — `mapToContact` is an unvalidated cast factory**
`crm/src/hooks/use-prospects.ts:34-56` — every field `as ProspectStatus`, `as RdvType` without validation. Schema drift silently produces wrong-typed `Contact` objects.
**Fix:** Zod-parse at the mapper boundary, or explicit null guards.

**H2 — Stale enrichment cache in `useProspectsWithClients`**
`crm/src/hooks/use-prospects.ts:165-241` — inner query key omits prospect IDs; parent background refetch leaves enriched view stale.
**Fix:** Include stable ID hash in key, or collapse to a single Supabase join `select("*, clients(id, nom)")`.

**H3 — `importedLeadSchema` requires email but phone-only leads are valid**
`crm/src/lib/schemas/prospect.ts:282` — `email: z.string().email()` contradicts `prospectSchema`'s "email OR phone" refine. CSV imports with phone-only rows fail silently.
**Fix:** `.email().optional()` + same cross-refine.

**H4 — Dead `updateStatus` registration**
`crm/src/app/(main)/prospection/page.tsx:71` — `const updateStatus = useUpdateProspectStatus();` never used.
**Fix:** Delete the line.

**H5 — Unsafe `as Prospect` cast on `Contact`**
`crm/src/app/(main)/prospection/page.tsx:65` — also triggers `react-hooks/set-state-in-effect` ESLint. `Contact` lacks `clientNom`/`opportuniteCount`; downstream reads get `undefined`.
**Fix:** Enrich with explicit `undefined` fields or fetch via `useProspectsWithClients` for the one ID.

#### UI components

**H6 — Floating promise on interaction create**
`crm/src/components/prospection/CallResultDialog.tsx:1382-1390` — `createInteraction.mutate(...)` in `onEmailSent` has no `await`/`.catch()`. Errors are swallowed.
**Fix:** `mutateAsync` in async handler with try/catch.

**H7 — `setState` inside `useEffect` (ESLint error)**
`crm/src/components/prospection/InteractionEditDialog.tsx:73-87` — same class as commit `8e1405f7`.
**Fix:** Use `key={interaction.id}` reset pattern or derive via `useMemo`.

**H8 — `setState` inside `useEffect` (ESLint error)**
`crm/src/components/prospection/EmailComposer.tsx:77-85` — cascading re-renders.
**Fix:** `useMemo` for derived body; initialize `useState` from memo once. Remove unused `isPreviewMode` state (line 73).

**H9 — Non-null assertions on possibly undefined IDs**
- `ProspectForm.tsx:541` — `result.clientId!`
- `CallResultDialog.tsx:283` — `prospect?.client?.[0]` used as definite string at line 414.
**Fix:** Explicit `if (!clientId) return;` guards.

**H10 — No file size / MIME validation in CSV import**
`crm/src/components/prospection/LeadImportDialog.tsx:109-128, 131` — only `file.name.endsWith(".csv")` check; `handleFileSelect` has none; no size cap. Multi-MB files block main thread via PapaParse.
**Fix:** Enforce `file.type === "text/csv"` + size cap (e.g. 5 MB).

#### Agenda / Calendar

**H11 — Prop mutation in `CreateEventDialog`**
`crm/src/components/prospection/agenda/CreateEventDialog.tsx:62-66` — `initialDate.setMinutes(0,0,0,0)` mutates parent state by reference.
**Fix:** Clone: `new Date(initialDate || new Date())`.

**H12 — `toISOStringWithTimezone` ignores its `timeZone` param**
`crm/src/lib/google-calendar.ts:80-82` — returns UTC despite promising local-offset ISO string. Misleading vs `DEFAULT_TIMEZONE = "Europe/Paris"`.
**Fix:** Implement real TZ formatting, or rename to `toUTCISOString` and drop the parameter.

**H13 — Unconditional `response.json()` in error path**
`crm/src/hooks/use-calendar.ts:24, 44` — 502/504 HTML from proxies breaks parsing; user sees `"Unexpected token '<'"`.
**Fix:** Guard on `Content-Type` or wrap in try/catch.

---

### MEDIUM

**Data layer**
- **M1** Unbounded `select("*")` without `.limit()` — `use-prospects.ts:82`. Add `.limit(500)` safeguard; plan pagination.
- **M2** 5× duplicated enrichment pattern in `use-prospects.ts` (lines 183, 635, 692, 740, 797). Extract `enrichWithClientNames()`.
- **M3** `useProspectionKPIs` key instability — `use-prospects.ts:565` — `prospects?.map(p => p.id)` regenerates on every render. Replace with `useMemo` or stabilize key.
- **M4** KPI tests re-implement logic instead of rendering the hook — `__tests__/use-prospects.test.ts:1027-1128`.
- **M5** SIRET validation accepts non-digit and <14 chars — `prospect.ts:92`. Use `regex(/^\d{14}$/)`.
- **M6** Inconsistent `refetch` vs `invalidate` in mutation success handlers — `use-prospects.ts:302-306` vs :389.
- **M7** Missing tests: `useUpdateContact`, `useDeleteContact`, `useUpcomingRdvProspects`, `useContactsByClient`.
- **M8** `PROSPECT_SOURCES` / `PROSPECT_STATUTS` duplicated between `prospect.ts:18-26` and `types/constants.ts`. Import canonical.

**UI**
- **M9** `useEffect` for tab auto-navigation — `ProspectForm.tsx:177-181`. Call `setActiveTab` directly in `handleSubmit:327`.
- **M10** Escape-key suppressed unconditionally in dialogs — `ProspectForm.tsx:647-648`, `CallResultDialog.tsx:554-555`. Only block when data pending.
- **M11** Duplicated `isToday` / `isOverdue` / badge helpers in `LeadCard.tsx` & `LeadListTable.tsx`. Extract `prospection/utils.ts`.
- **M12** Index keys in import preview — `LeadImportDialog.tsx:437`.
- **M13** No error state in `ProspectionKPIs.tsx:9` — silent zeros on fetch error.
- **M14** `DialogTitle` nesting may break `aria-labelledby` — `CallResultDialog.tsx:550`.
- **M15** Unescaped apostrophes (ESLint error) — `LeadCard.tsx:504,534,565`.
- **M16** `ProspectionKPIData` not exported — test type error, `__tests__/ProspectionKPIs.test.tsx:17`.
- **M17** Unused imports / dead state — `ProspectForm.tsx:55,122`, `CallResultDialog.tsx:47,890`, `PastRdvNotifications.tsx:8`, `EmailComposer.tsx:73`.
- **M18** `resultOptions` → `callResultSchema` coverage check needed — `CallResultDialog.tsx:325-328,1291`.

**Agenda**
- **M19** Double success toast on event creation — `CreateEventDialog.tsx:228, 244`.
- **M20** No pagination for calendar events — `api/calendar/events/route.ts:34`. Events > page size dropped.
- **M21** O(n) event scan 91× per render — `WeekCalendar.tsx:138-141`. Pre-bucket events in `useMemo`.
- **M22** Index key for attendees — `EventCard.tsx:66`.
- **M23** Empty prospect passed to dialog produces `"RDV - "` title — `ProspectionAgendaView.tsx:94`.
- **M24** No keyboard nav / ARIA on calendar grid — `WeekCalendar.tsx:144-162`.
- **M25** Zero test coverage for the entire `agenda/` folder + `google-calendar.ts`.

---

### LOW

- **L1** Clipboard write without try/catch — `page.tsx:89`.
- **L2** Sunday = empty week edge — `use-prospects.ts:64-71`.
- **L3** `console.warn` / `console.error` in production paths — `ProspectForm.tsx:299`, `CreateEventDialog.tsx:236`.
- **L4** `ProspectProgressStepper.tsx:56` — "Rappeler" mapped to "Contact établi" (UX mismatch).
- **L5** Missing tests for `InteractionEditDialog`, `ProspectForm`, `LeadImportDialog`, `CompanySearch`.
- **L6** `window.location.href` leaked into Google Calendar description — `CreateEventDialog.tsx:96, 118`.

---

## Validation Results

Validation commands not run in this review (read-only scope across 3 subagents). Known pre-existing failures: ESLint errors `react-hooks/set-state-in-effect` (H5, H7, H8) and `react/no-unescaped-entities` (M15); `tsc` failures in unrelated test files.

| Check | Result |
|---|---|
| Type check | Skipped (pre-existing unrelated errors flagged) |
| Lint | **Fail** (4 confirmed errors in scope) |
| Tests | Not run |
| Build | Not run |

Recommend running `cd crm && npm run lint && npm run typecheck && npm test` before fixing.

---

## Files Reviewed (25)

**Page & data layer (6):** `app/(main)/prospection/page.tsx`, `hooks/use-prospects.ts`, `hooks/__tests__/use-prospects.test.ts`, `lib/schemas/prospect.ts`, `lib/schemas/client.ts`, `lib/schemas/__tests__/prospect.test.ts`

**UI components (17):** `components/prospection/{index.ts, ProspectForm.tsx, LeadCard.tsx, LeadListTable.tsx, CallResultDialog.tsx, InteractionEditDialog.tsx, LeadImportDialog.tsx, CompanySearch.tsx, ProspectionKPIs.tsx, ProspectionFilters.tsx, ProspectProgressStepper.tsx, PastRdvNotifications.tsx, BusinessCardScannerButton.tsx, EmailComposer.tsx}` + 3 test files

**Agenda + integration (8):** `components/prospection/ProspectionAgendaView.tsx`, `components/prospection/agenda/{index.ts, AgendaTab.tsx, CalendarAuthButton.tsx, EventCard.tsx, WeekCalendar.tsx, CreateEventDialog.tsx}`, `lib/google-calendar.ts`

---

## Recommended Next Steps (priority order)

1. **C1** — patch OAuth token leak (server-side only). Security priority.
2. **H7/H8/H5** — fix the three `setState`-in-effect occurrences; consider adding `react-hooks/set-state-in-effect` as `error` project-wide (already enforced; just needs CI gate).
3. **H10** — add CSV file size / MIME guard before merging any production import flow.
4. **H11/H12** — fix calendar prop mutation + rename/fix the timezone helper.
5. **H1–H4, H6, H9, H13** — batch PR for data-layer + UI correctness.
6. Extract shared utils (M2, M11), then tackle M3/M5/M13 for smaller quick wins.
7. Backfill tests for `agenda/*`, `ProspectForm`, `InteractionEditDialog`, `LeadImportDialog` (spec 008-test-coverage).
