/**
 * Pure, side-effect-free auth helpers.
 *
 * Kept in their own module so unit tests can import them without triggering the
 * full NextAuth() bootstrap in `lib/auth.ts` (which transitively imports
 * runtime-only Next.js internals incompatible with the Vitest ESM loader).
 *
 * Public re-exports live in `lib/auth.ts` — application code should keep
 * importing from there.
 */

import type { Session } from "next-auth";
import { getToken, type JWT } from "next-auth/jwt";

export type OAuthProvider = "google" | "microsoft";

export interface ExtendedJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  provider?: OAuthProvider;
}

// SECURITY (PRO-C1): augment the next-auth Session shape here, where the only
// writer (`buildPublicSession`) lives. Keeping the augmentation next to the
// writer prevents silent drift if `auth.ts` is ever split or restructured.
declare module "next-auth" {
  interface Session {
    /**
     * Server-strip flag. The OAuth `accessToken` is kept in the encrypted JWT
     * cookie only and never serialized into the public session response.
     * Use `hasCalendarAccess` on the client to know if the calendar/email
     * features are usable; call {@link getServerAccessToken} on the server to
     * read the actual token.
     */
    hasCalendarAccess?: boolean;
    error?: string;
    provider?: OAuthProvider;
  }
}

/**
 * Pure shaper for the session response. Exported so unit tests can assert that
 * `accessToken` is never serialized into the public session payload.
 *
 * SECURITY (PRO-C1): keep this in sync with the `session()` callback in
 * `lib/auth.ts`. Any new field carrying a secret MUST be deliberately omitted.
 */
export function buildPublicSession(session: Session, token: ExtendedJWT): Session {
  session.hasCalendarAccess = !!token.accessToken;
  session.error = token.error;
  session.provider = token.provider;
  return session;
}

/**
 * Exchanges a Google or Microsoft refresh token for a fresh access token.
 *
 * Shared between:
 * - the NextAuth `jwt()` callback (rotates on client session polls), and
 * - {@link getServerAccessToken} (rotates on direct server-route reads, which
 *   bypass the `jwt()` callback).
 *
 * Returns a new `ExtendedJWT` with the refreshed `accessToken` / `expiresAt`
 * and the same `refreshToken` (unless the provider issued a new one). On
 * failure, returns the input token with `error: "RefreshTokenError"` set so
 * downstream code can surface a re-auth prompt instead of silently 401-ing.
 */
export async function refreshAccessToken(token: ExtendedJWT): Promise<ExtendedJWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshTokenError" };
  }

  try {
    const isGoogle = token.provider === "google";

    const tokenUrl = isGoogle
      ? "https://oauth2.googleapis.com/token"
      : "https://login.microsoftonline.com/common/oauth2/v2.0/token";

    const body = isGoogle
      ? new URLSearchParams({
          client_id: process.env.AUTH_GOOGLE_ID!,
          client_secret: process.env.AUTH_GOOGLE_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        })
      : new URLSearchParams({
          client_id: process.env.AUTH_MICROSOFT_ID!,
          client_secret: process.env.AUTH_MICROSOFT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
          scope:
            "openid email profile User.Read Calendars.ReadWrite Mail.Send offline_access",
        });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokens = await response.json();

    if (!response.ok) {
      throw tokens;
    }

    return {
      ...token,
      accessToken: tokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return { ...token, error: "RefreshTokenError" };
  }
}

function isTokenFresh(token: ExtendedJWT): boolean {
  return !!token.expiresAt && Date.now() < token.expiresAt * 1000;
}

/**
 * NextAuth v5 picks the session-cookie name based on `secureCookie`:
 *   - secureCookie=true → `__Secure-authjs.session-token` (HTTPS)
 *   - secureCookie=false → `authjs.session-token` (HTTP dev)
 *
 * Behind a reverse proxy (Coolify in our case) the auto-detection inside
 * `getToken({ req })` can see an internal `http://` URL and pick the wrong
 * cookie name, so `getToken` returns null even though the `__Secure-` cookie
 * is sitting right there in the request. We force it explicitly.
 *
 * `NODE_ENV=production` is the right signal because we set it for every
 * deployment (staging + prod) via the Dockerfile. Local dev stays at `false`.
 */
function isSecureCookieEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Server-only helper. Reads the OAuth access token directly from the encrypted
 * JWT cookie so that it never has to flow through the public session response.
 *
 * SECURITY (PRO-C1) + refresh-token preservation:
 * - `getToken()` from next-auth/jwt does NOT invoke the `jwt()` callback, so we
 *   replicate the refresh logic here. Without this, expired tokens would reach
 *   Google/MS Graph and return 401s instead of being silently rotated.
 * - Any decode failure (missing `AUTH_SECRET`, tampered cookie) returns null
 *   so route handlers can cleanly emit 401 instead of a generic 500.
 *
 * Use in route handlers (`app/api/calendar/**`, `app/api/email/**`) instead of
 * `(await auth()).accessToken`, which no longer exists by design.
 */
export async function getServerAccessToken(
  req: Request,
): Promise<{ accessToken: string; provider: OAuthProvider } | null> {
  let token: ExtendedJWT | null;
  try {
    // `getToken` from @auth/core/jwt requires BOTH:
    // - `secret` (throws `MissingSecret` otherwise — the previous hotfix
    //   missed this because the tests mock `getToken` entirely)
    // - `secureCookie` explicitly (behind Coolify's reverse proxy the
    //   internal http:// URL confuses auto-detection — see isSecureCookieEnv).
    // Together they guarantee the helper can actually decode the encrypted
    // session cookie that NextAuth wrote during sign-in.
    token = (await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      secureCookie: isSecureCookieEnv(),
    })) as ExtendedJWT | null;
  } catch (error) {
    console.error("getServerAccessToken: failed to decode JWT", error);
    return null;
  }

  if (!token?.accessToken) return null;

  if (!isTokenFresh(token)) {
    token = await refreshAccessToken(token);
    if (token.error || !token.accessToken) return null;
  }

  return {
    accessToken: token.accessToken,
    provider: token.provider ?? "google",
  };
}
