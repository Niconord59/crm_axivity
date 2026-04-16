/**
 * SECURITY (PRO-C1) — regression tests guarding against OAuth access token
 * leaking into the public session payload AND guarding against the
 * refresh-token flow silently breaking in server routes.
 *
 * The `session()` callback returns the JSON that ends up at
 * `GET /api/auth/session` and inside `useSession()` on the client. This file
 * pins the contract: any property carrying the raw access/refresh tokens MUST
 * be stripped before that JSON crosses the network boundary — AND an expired
 * access token MUST trigger a refresh before the server hands it to Google /
 * Microsoft Graph.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { Session } from "next-auth";

import {
  buildPublicSession,
  getServerAccessToken,
  refreshAccessToken,
  type ExtendedJWT,
} from "@/lib/auth-helpers";

// Mock the JWT module so getServerAccessToken is testable without real cookies.
vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

import { getToken } from "next-auth/jwt";
const getTokenMock = getToken as unknown as ReturnType<typeof vi.fn>;

const originalFetch = globalThis.fetch;
const fetchMock = vi.fn();

beforeEach(() => {
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  // Refresh endpoints read these at call time.
  process.env.AUTH_GOOGLE_ID = "test-google-id";
  process.env.AUTH_GOOGLE_SECRET = "test-google-secret";
  process.env.AUTH_MICROSOFT_ID = "test-ms-id";
  process.env.AUTH_MICROSOFT_SECRET = "test-ms-secret";
});

afterEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = originalFetch;
});

function makeSession(): Session {
  return {
    user: { name: "Alice", email: "alice@example.com" },
    expires: "2099-01-01T00:00:00.000Z",
  } as Session;
}

describe("buildPublicSession (PRO-C1)", () => {
  it("never copies the OAuth accessToken onto the session", () => {
    const session = makeSession();
    const token: ExtendedJWT = {
      accessToken: "ya29.SECRET-google-access-token",
      refreshToken: "1//0eSECRET-refresh-token",
      expiresAt: 9999999999,
      provider: "google",
    };

    const result = buildPublicSession(session, token);

    expect(result).not.toHaveProperty("accessToken");
    expect(result).not.toHaveProperty("refreshToken");
    expect(JSON.stringify(result)).not.toContain("ya29.SECRET-google-access-token");
    expect(JSON.stringify(result)).not.toContain("1//0eSECRET-refresh-token");
  });

  it("exposes hasCalendarAccess=true when the JWT carries an accessToken", () => {
    const result = buildPublicSession(makeSession(), {
      accessToken: "any-non-empty-string",
      provider: "microsoft",
    });

    expect(result.hasCalendarAccess).toBe(true);
    expect(result.provider).toBe("microsoft");
  });

  it("exposes hasCalendarAccess=false when the JWT has no accessToken", () => {
    const result = buildPublicSession(makeSession(), {
      provider: "google",
    });

    expect(result.hasCalendarAccess).toBe(false);
  });

  it("propagates RefreshTokenError without leaking secrets", () => {
    const result = buildPublicSession(makeSession(), {
      accessToken: undefined,
      refreshToken: "should-stay-server-side",
      error: "RefreshTokenError",
      provider: "google",
    });

    expect(result.error).toBe("RefreshTokenError");
    expect(result.hasCalendarAccess).toBe(false);
    expect(JSON.stringify(result)).not.toContain("should-stay-server-side");
  });
});

describe("getServerAccessToken (PRO-C1)", () => {
  it("returns the accessToken + provider from a fresh JWT without refreshing", async () => {
    getTokenMock.mockResolvedValueOnce({
      accessToken: "ya29.real-google-token",
      provider: "google",
      refreshToken: "refresh-1",
      expiresAt: Math.floor(Date.now() / 1000) + 3600, // fresh
    } satisfies ExtendedJWT);

    const req = new Request("https://example.invalid/api/calendar/events");
    const result = await getServerAccessToken(req);

    expect(result).toEqual({
      accessToken: "ya29.real-google-token",
      provider: "google",
    });
    // secureCookie is set explicitly (see isSecureCookieEnv in auth-helpers);
    // we just care that `req` is forwarded.
    expect(getTokenMock).toHaveBeenCalledWith(expect.objectContaining({ req }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes an expired token via the provider refresh endpoint (H1 regression guard)", async () => {
    getTokenMock.mockResolvedValueOnce({
      accessToken: "ya29.expired",
      refreshToken: "refresh-google",
      provider: "google",
      expiresAt: Math.floor(Date.now() / 1000) - 60, // expired 1 min ago
    } satisfies ExtendedJWT);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ access_token: "ya29.fresh", expires_in: 3600 }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await getServerAccessToken(
      new Request("https://example.invalid/api/calendar/events"),
    );

    expect(result).toEqual({
      accessToken: "ya29.fresh",
      provider: "google",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://oauth2.googleapis.com/token");
  });

  it("returns null when the provider refresh endpoint rejects the refresh token", async () => {
    getTokenMock.mockResolvedValueOnce({
      accessToken: "ya29.expired",
      refreshToken: "revoked",
      provider: "google",
      expiresAt: Math.floor(Date.now() / 1000) - 60,
    } satisfies ExtendedJWT);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }),
    );

    const result = await getServerAccessToken(
      new Request("https://example.invalid/api/calendar/events"),
    );

    expect(result).toBeNull();
  });

  it("defaults provider to 'google' when missing on the JWT", async () => {
    getTokenMock.mockResolvedValueOnce({
      accessToken: "token-without-provider",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    } satisfies ExtendedJWT);

    const result = await getServerAccessToken(
      new Request("https://example.invalid/api/email/send"),
    );

    expect(result).toEqual({
      accessToken: "token-without-provider",
      provider: "google",
    });
  });

  it("returns null when the JWT is missing", async () => {
    getTokenMock.mockResolvedValueOnce(null);

    const result = await getServerAccessToken(
      new Request("https://example.invalid/api/calendar/events"),
    );

    expect(result).toBeNull();
  });

  it("returns null when the JWT has no accessToken", async () => {
    getTokenMock.mockResolvedValueOnce({
      provider: "microsoft",
    } satisfies ExtendedJWT);

    const result = await getServerAccessToken(
      new Request("https://example.invalid/api/calendar/events"),
    );

    expect(result).toBeNull();
  });

  it("returns null (not 500) when getToken throws on a tampered cookie (L2)", async () => {
    getTokenMock.mockRejectedValueOnce(new Error("JWE decryption failed"));

    const result = await getServerAccessToken(
      new Request("https://example.invalid/api/calendar/events"),
    );

    expect(result).toBeNull();
  });

  it("forces secureCookie=true AND passes AUTH_SECRET in production (hotfix v2 regression guard)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "test-auth-secret-for-prod");

    getTokenMock.mockResolvedValueOnce({
      accessToken: "t",
      provider: "google",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    } satisfies ExtendedJWT);

    await getServerAccessToken(new Request("https://example.invalid/api/calendar/events"));

    expect(getTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        secureCookie: true,
        secret: "test-auth-secret-for-prod",
      }),
    );

    vi.unstubAllEnvs();
  });

  it("keeps secureCookie=false in dev so it finds authjs.session-token on http://localhost", async () => {
    vi.stubEnv("NODE_ENV", "development");

    getTokenMock.mockResolvedValueOnce({
      accessToken: "t",
      provider: "google",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    } satisfies ExtendedJWT);

    await getServerAccessToken(new Request("http://localhost/api/calendar/events"));

    expect(getTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ secureCookie: false }),
    );

    vi.unstubAllEnvs();
  });
});

describe("refreshAccessToken", () => {
  it("hits Google's token endpoint when provider is google", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          access_token: "new-google-token",
          expires_in: 3600,
          refresh_token: "new-refresh",
        }),
        { status: 200 },
      ),
    );

    const result = await refreshAccessToken({
      accessToken: "old",
      refreshToken: "old-refresh",
      provider: "google",
    });

    expect(result.accessToken).toBe("new-google-token");
    expect(result.refreshToken).toBe("new-refresh");
    expect(result.error).toBeUndefined();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://oauth2.googleapis.com/token");
  });

  it("hits the Microsoft token endpoint when provider is microsoft", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ access_token: "new-ms-token", expires_in: 3600 }),
        { status: 200 },
      ),
    );

    const result = await refreshAccessToken({
      accessToken: "old",
      refreshToken: "ms-refresh",
      provider: "microsoft",
    });

    expect(result.accessToken).toBe("new-ms-token");
    expect(result.refreshToken).toBe("ms-refresh"); // kept because API didn't return a new one
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    );
  });

  it("returns RefreshTokenError when no refresh token is present", async () => {
    const result = await refreshAccessToken({
      accessToken: "old",
      provider: "google",
    });

    expect(result.error).toBe("RefreshTokenError");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns RefreshTokenError when fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const result = await refreshAccessToken({
      accessToken: "old",
      refreshToken: "r",
      provider: "google",
    });

    expect(result.error).toBe("RefreshTokenError");
  });
});
