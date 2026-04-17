/**
 * SECURITY (PRO-C1) — verifies that the calendar API route reads the OAuth
 * access token from the encrypted JWT cookie (via getServerAccessToken) and
 * never relies on a session field that could leak to the browser.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getServerAccessToken: vi.fn(),
}));

vi.mock("@/lib/services/calendar-service", () => ({
  getCalendarEvents: vi.fn(),
  createCalendarEvent: vi.fn(),
}));

import { getServerAccessToken } from "@/lib/auth";
import {
  getCalendarEvents,
  createCalendarEvent,
} from "@/lib/services/calendar-service";
import { GET, POST } from "../route";

const getServerAccessTokenMock = getServerAccessToken as unknown as ReturnType<
  typeof vi.fn
>;
const getCalendarEventsMock = getCalendarEvents as unknown as ReturnType<
  typeof vi.fn
>;
const createCalendarEventMock = createCalendarEvent as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  vi.clearAllMocks();
});

function buildGetRequest(): NextRequest {
  return new NextRequest(
    "https://example.invalid/api/calendar/events?timeMin=2026-04-16T00:00:00Z&timeMax=2026-04-23T00:00:00Z",
  );
}

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.invalid/api/calendar/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/calendar/events (PRO-C1)", () => {
  it("returns 401 when getServerAccessToken returns null", async () => {
    getServerAccessTokenMock.mockResolvedValueOnce(null);

    const response = await GET(buildGetRequest());

    expect(response.status).toBe(401);
    expect(getServerAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(getCalendarEventsMock).not.toHaveBeenCalled();
  });

  it("forwards the JWT-derived token + provider to the service layer", async () => {
    getServerAccessTokenMock.mockResolvedValueOnce({
      accessToken: "ya29.from-encrypted-cookie",
      provider: "microsoft",
    });
    getCalendarEventsMock.mockResolvedValueOnce({ events: [], error: null });

    const request = buildGetRequest();
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getServerAccessTokenMock).toHaveBeenCalledWith(request);
    expect(getCalendarEventsMock).toHaveBeenCalledWith(
      "microsoft",
      "ya29.from-encrypted-cookie",
      "2026-04-16T00:00:00Z",
      "2026-04-23T00:00:00Z",
    );
  });

  it("returns 400 when timeMin is missing", async () => {
    getServerAccessTokenMock.mockResolvedValueOnce({
      accessToken: "tok",
      provider: "google",
    });

    const response = await GET(
      new NextRequest(
        "https://example.invalid/api/calendar/events?timeMax=2026-04-23T00:00:00Z",
      ),
    );

    expect(response.status).toBe(400);
    expect(getCalendarEventsMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/calendar/events (PRO-C1)", () => {
  it("returns 401 when getServerAccessToken returns null", async () => {
    getServerAccessTokenMock.mockResolvedValueOnce(null);

    const response = await POST(
      buildPostRequest({
        summary: "RDV",
        start: { dateTime: "2026-04-16T10:00:00Z" },
        end: { dateTime: "2026-04-16T11:00:00Z" },
      }),
    );

    expect(response.status).toBe(401);
    expect(createCalendarEventMock).not.toHaveBeenCalled();
  });

  it("forwards the JWT-derived token to createCalendarEvent", async () => {
    getServerAccessTokenMock.mockResolvedValueOnce({
      accessToken: "ya29.cookie-token",
      provider: "google",
    });
    createCalendarEventMock.mockResolvedValueOnce({
      event: { id: "evt-1" },
      error: null,
    });

    const response = await POST(
      buildPostRequest({
        summary: "Demo",
        start: { dateTime: "2026-04-16T10:00:00Z", timeZone: "Europe/Paris" },
        end: { dateTime: "2026-04-16T11:00:00Z", timeZone: "Europe/Paris" },
        location: "Paris",
      }),
    );

    expect(response.status).toBe(200);
    expect(createCalendarEventMock).toHaveBeenCalledTimes(1);
    const [providerArg, tokenArg] = createCalendarEventMock.mock.calls[0];
    expect(providerArg).toBe("google");
    expect(tokenArg).toBe("ya29.cookie-token");
  });
});
