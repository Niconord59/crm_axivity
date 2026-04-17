# Implementation Report: PRO-C1 — Empêcher la fuite du token OAuth côté client

## Summary
Migrated the OAuth `accessToken` (Google + Microsoft scopes: Calendar, Calendar.events, Gmail.send, Mail.Send) out of the public NextAuth session. The token now lives only in the encrypted JWT cookie and is read server-side via a new `getServerAccessToken()` helper. The client-facing `Session` exposes a boolean `hasCalendarAccess` flag instead.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Severity | CRITICAL | CRITICAL |
| Size | M | M |
| Files Changed | ~5 + 2 new tests | 5 modified + 3 new |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Update `auth.ts` Session type and callback | Complete | Replaced `accessToken?: string` with `hasCalendarAccess?: boolean`; session callback delegates to `buildPublicSession()` |
| 2 | Migrate API routes to JWT lookup | Complete | Both `/api/calendar/events` (GET+POST) and `/api/email/send` now call `getServerAccessToken(request)` |
| 3 | Update client hooks | Complete | `useCalendarStatus()` and `useCalendarAuth()` now read `session?.hasCalendarAccess` |
| 4 | Write tests | Complete | 8 tests in `auth-session.test.ts`, 5 tests in `events/route.test.ts` |
| 5 | Validation (lint, typecheck, tests, build) | Complete | All green for new code; pre-existing lint/typecheck errors unchanged |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (lint) | Pass for new code | Total problems: 199 (was 200 baseline). Zero new lint errors/warnings introduced. Pre-existing 88 errors/111 warnings untouched. |
| Type Check | Pass for new code | `tsc --noEmit` reports zero errors in the 5 modified files + 3 new files. Pre-existing test-mock TS errors unchanged. |
| Unit Tests | Pass | 1207/1207 tests across 56 files. New: 13 tests added (8 auth-session + 5 calendar route). |
| Build (`npm run build`) | Pass | Production build succeeds, all routes still generated. |
| Acceptance grep | Pass | `grep -r "session\.accessToken" crm/src` → **0 results**. |

## Files Changed

| File | Action | Notes |
|---|---|---|
| `crm/src/lib/auth-helpers.ts` | CREATED | Pure helpers (`buildPublicSession`, `getServerAccessToken`, types) split out so unit tests don't trigger NextAuth bootstrap |
| `crm/src/lib/auth.ts` | UPDATED | Session interface now exposes `hasCalendarAccess` only; session callback delegates to helper; re-exports helpers for app code |
| `crm/src/app/api/calendar/events/route.ts` | UPDATED | GET + POST replaced `auth()` + `session.accessToken` with `getServerAccessToken(request)` |
| `crm/src/app/api/email/send/route.ts` | UPDATED | POST replaced `auth()` + `session.accessToken` with `getServerAccessToken(request)` |
| `crm/src/hooks/use-calendar.ts` | UPDATED | `useCalendarStatus()` and `useCalendarAuth()` read `session?.hasCalendarAccess` |
| `crm/src/lib/__tests__/auth-session.test.ts` | CREATED | 8 tests pinning `buildPublicSession` and `getServerAccessToken` contracts |
| `crm/src/app/api/calendar/events/__tests__/route.test.ts` | CREATED | 5 tests verifying GET/POST use the JWT-derived token |
| `crm/next-env.d.ts` | UPDATED | Auto-touched by Next.js during build |

## Deviations from Plan

1. **Helper split into `auth-helpers.ts`** (not in original plan).
   - **Why**: importing `@/lib/auth` in vitest triggers `next-auth → next/server` ESM resolution failure. Splitting the pure helpers out lets unit tests load them without booting the full NextAuth handler. App code is unaffected — `auth.ts` re-exports them.
2. **Branch name** is `fix/prospection-hardening-sprint1` (Sprint 1 omnibus) rather than the plan's suggested `security/pro-c1-oauth-token-leak`.
   - **Why**: user-chosen branch covering the whole Sprint 1 lot; subsequent stories (H5/H7/H8/H10/H11/H12) will land on the same branch.

## Issues Encountered

1. **Vitest could not import `@/lib/auth`**: `next-auth/lib/env.js` does `import "next/server"` (no `.js`) which the Vitest ESM loader refuses. Resolved by extracting pure helpers into `auth-helpers.ts` (no NextAuth side-effects).

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `crm/src/lib/__tests__/auth-session.test.ts` | 8 | `buildPublicSession` (4 cases — token strip, hasCalendarAccess true/false, RefreshTokenError) + `getServerAccessToken` (4 cases — happy path, default provider fallback, null JWT, JWT without accessToken) |
| `crm/src/app/api/calendar/events/__tests__/route.test.ts` | 5 | GET 401/200/400 + POST 401/200, all asserting `getServerAccessToken` is the source of the token |

## Risk / Follow-up

- **TRX-2 (rotation runbook)** is the mandatory follow-up after deploy: existing JWTs in active browser sessions still carry `accessToken` and would still surface it via `useSession()` until the JWT is re-signed. Forcing re-auth is required (rotate `AUTH_SECRET` in staging then prod).
- **CSP** could harden this further (block inline scripts) but is out of scope for PRO-C1.

## Next Steps
- [ ] Continue Sprint 1 with PRO-H7, PRO-H8, PRO-H5 (setState-in-effect class) on the same branch.
- [ ] Then PRO-H10 (CSV validation), PRO-H11 (prop mutation), PRO-H12 (timezone helper).
- [ ] Open PR `fix/prospection-hardening-sprint1 → develop` once the full Sprint 1 lot is in.
- [ ] After merge to `main` + deploy: execute TRX-2 runbook to invalidate live sessions.
