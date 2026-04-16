# Code Review: PRO-C1 — Move OAuth accessToken server-side

**Reviewed**: 2026-04-16
**Branch**: `fix/prospection-hardening-sprint1`
**Scope**: uncommitted changes related to PRO-C1 only
**Decision**: **REQUEST CHANGES** (1 HIGH finding: token refresh regression)

## Summary
Security goal is achieved — `accessToken` no longer reaches the browser (0 grep hits in `src/`, 13/13 new tests pass, full build green). However, the move from `auth()` to raw `getToken()` silently drops the automatic refresh-token rotation that the `jwt()` callback performed on every session read. This is a real UX regression for users who keep the app idle past the access-token TTL (~1h for Google). Fix is small but mandatory before merging to `main`.

## Files Reviewed

| File | Change |
|---|---|
| `crm/src/lib/auth.ts` | Modified |
| `crm/src/lib/auth-helpers.ts` | **New** |
| `crm/src/app/api/calendar/events/route.ts` | Modified |
| `crm/src/app/api/email/send/route.ts` | Modified |
| `crm/src/hooks/use-calendar.ts` | Modified |
| `crm/src/lib/__tests__/auth-session.test.ts` | **New** |
| `crm/src/app/api/calendar/events/__tests__/route.test.ts` | **New** |
| `crm/next-env.d.ts` | Auto-generated — ignore |

## Findings

### CRITICAL
None. Primary security goal (no token leak) is verified:
- `grep -r "session\.accessToken" crm/src` → 0 results outside of historical comments.
- `buildPublicSession` never assigns `accessToken` / `refreshToken` to the session.
- Test `auth-session.test.ts:40` asserts both `.not.toHaveProperty("accessToken")` and a `JSON.stringify` substring check for the literal token value — rigorous.

### HIGH

#### H1 — Lost refresh-token rotation on API routes
**Files**: `crm/src/lib/auth-helpers.ts:46-55`, `crm/src/app/api/calendar/events/route.ts:10, 42`, `crm/src/app/api/email/send/route.ts:10`

**Problem** — Before PRO-C1, the routes called `await auth()`. That triggered the `jwt()` callback in `auth.ts:60-131`, which checks `extendedToken.expiresAt` and transparently refreshes via `oauth2.googleapis.com/token` or the Microsoft endpoint when the access token is expired. Now the routes call `getToken({ req })` directly, which **only decrypts the cookie — it never invokes the `jwt()` callback**, so the refresh branch is dead code for these request paths.

**Impact** — After ~1 h of inactivity (Google access-token TTL), the first Calendar or Email call fails. The user gets an `ExternalServiceError` toast instead of a silent refresh. Previously this was invisible.

**Repro path** — User signs in → leaves tab open > 1 h → clicks "Créer événement" → request arrives with expired `accessToken` still in the JWT cookie → `getToken` returns it as-is → Google returns 401 → `ExternalServiceError` surfaces.

**Recommended fix** (choose one):

1. **Trigger refresh via `auth()` inside the helper** — simplest, keeps the existing refresh logic as single source of truth:
   ```ts
   // auth-helpers.ts
   export async function getServerAccessToken(req: Request) {
     // auth() invokes the jwt() callback which rotates expired tokens
     // and rewrites the cookie on the response. getToken() then reads
     // the fresh cookie that auth() just decoded.
     const session = await auth(); // from @/lib/auth
     if (!session?.hasCalendarAccess) return null;
     const token = (await getToken({ req })) as ExtendedJWT | null;
     if (!token?.accessToken) return null;
     return { accessToken: token.accessToken, provider: token.provider ?? "google" };
   }
   ```
   ⚠️ Needs runtime validation — confirm `getToken({ req })` returns the refreshed value after `auth()` has rotated it in the same request. If not, fall back to option 2.

2. **Port the refresh logic into `getServerAccessToken`** — defensive duplication, no dependency on NextAuth's request mutation behavior. Copy the `expiresAt < now && refreshToken` branch from `auth.ts:75-131` into the helper.

3. **Accept the degradation + add a client retry** — if the API returns 401, `useCalendarEvents` could call `signIn("google", { prompt: "none" })` to silently re-auth. Larger scope; probably for a follow-up.

**Test to add** — in `auth-session.test.ts`, feed `getTokenMock` a token with `expiresAt` in the past and assert the helper either triggers a refresh or surfaces a `RefreshTokenError` instead of returning a stale token.

### MEDIUM

#### M1 — Stale docs in `crm/CLAUDE.md`
**File**: `crm/CLAUDE.md` (OAuth Providers section — ASCII diagram)

The architecture diagram still describes `Session (JWT) { accessToken, provider }`. This is now wrong and future contributors will copy the pattern. Update the box to `{ hasCalendarAccess, provider }` and add a short line: "Server-only access token: see `getServerAccessToken()` in `lib/auth.ts`."

#### M2 — No test coverage for `/api/email/send`
**File**: `crm/src/app/api/email/send/route.ts`

The plan asked for a calendar route test; we delivered. But the email route went through the exact same migration (3 call-sites, same pattern), and it handles a different failure mode (`ForbiddenError` on `"Permission"` substring). A 2-test smoke covering (a) null credentials → 401, (b) happy path → sendEmail called with the JWT token, would mirror the calendar test in <30 lines and prevent the email route from drifting.

#### M3 — `declare module "next-auth"` augmentation sits in `auth.ts`, not `auth-helpers.ts`
**File**: `crm/src/lib/auth.ts:14-25`, `crm/src/lib/auth-helpers.ts:32`

`buildPublicSession` (in `auth-helpers.ts`) writes `session.hasCalendarAccess = ...`, which type-checks only because TypeScript picks up the `declare module` from `auth.ts` elsewhere in the project graph. Unit tests and the helpers module "work by accident" — if someone later trims `auth.ts`'s include path or extracts the helper to a separate package, the type augmentation quietly vanishes. Move the `declare module "next-auth" { interface Session { hasCalendarAccess?: boolean; error?: string; provider?: OAuthProvider; } }` block into `auth-helpers.ts` where the only writer lives. 5-line move.

### LOW

#### L1 — `next-env.d.ts` diff mixed into PRO-C1
**File**: `crm/next-env.d.ts`

Auto-regenerated by Next.js 16 (`./.next/dev/types/routes.d.ts` → `./.next/types/routes.d.ts`). Unrelated to PRO-C1. Either commit separately with a `chore:` message, or revert before staging so the security commit stays focused.

#### L2 — `getToken({ req })` swallows decode errors
**File**: `crm/src/lib/auth-helpers.ts:49`

If `AUTH_SECRET` is missing in the environment or the cookie has been tampered with, `getToken` throws rather than returning null. The current route handlers catch via `handleApiError(error)`, so the user gets a generic 500 instead of a clear 401 "please reconnect". Wrap with `try { ... } catch { return null; }` inside the helper, and optionally `console.error` for ops visibility.

#### L3 — `provider: token.provider ?? "google"` fallback is silent
**File**: `crm/src/lib/auth-helpers.ts:53`

If the JWT somehow loses its `provider` field (e.g. a stale JWT from before the `provider` field was added), we default to Google. That's what the legacy code did too (`session.provider || "google"` in the old routes), so this is not a regression — but it's worth a `console.warn` in non-prod, because the symptom if Microsoft tokens leak into the Google code path is confusing (scope errors from Graph).

## Validation Results

| Check | Result | Notes |
|---|---|---|
| Type check (`tsc --noEmit`) | Pass for changed files | Pre-existing TS errors in unrelated test-mock files unchanged |
| Lint (`npm run lint`) | Pass for changed files | Total 199 problems (was 200 baseline); 0 new issues from PRO-C1 |
| Unit tests (`npm test`) | **Pass** | 1207/1207 — 13 new, all green |
| Build (`npm run build`) | **Pass** | Production build compiles all routes |
| Regression grep: `session\.accessToken` | **0 hits** | Contract held |

## Security Posture vs Plan

| Acceptance Criterion | Status |
|---|---|
| `fetch("/api/auth/session").then(r => r.json())` has no `accessToken` and `hasCalendarAccess === true` | Satisfied (unit-tested) |
| Server route gets `accessToken` via JWT, not session | Satisfied |
| `grep session.accessToken crm/src` returns zero | Satisfied |
| **Unstated but implied**: OAuth flow continues to work silently past token expiry | **Regressed** (see H1) |

## Decision

**REQUEST CHANGES** — address H1 (refresh-token regression) before merging Sprint 1 to `develop`. M1–M3 are strongly recommended follow-ups (can ship in the same commit or a quick follow-up). L1–L3 are optional.

## Next Steps

1. Fix H1 via option (1) or (2) above. Add the expired-token test.
2. Update `crm/CLAUDE.md` (M1).
3. Add email route smoke test (M2).
4. Relocate the `declare module` block (M3).
5. (Optional) Split `next-env.d.ts` into its own `chore:` commit (L1).
6. Re-run `npm test && npm run build` → commit → continue with PRO-H7.
