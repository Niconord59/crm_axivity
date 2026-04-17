/**
 * SECURITY (PRO-C1) — verifies that the email API route reads the OAuth
 * access token via `getServerAccessToken` (encrypted JWT cookie) and never
 * via a session field that would leak to the browser.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getServerAccessToken: vi.fn(),
}));

vi.mock("@/lib/services/email-service", () => ({
  sendEmail: vi.fn(),
}));

import { getServerAccessToken } from "@/lib/auth";
import { sendEmail } from "@/lib/services/email-service";
import { POST } from "../route";

const getServerAccessTokenMock = getServerAccessToken as unknown as ReturnType<
  typeof vi.fn
>;
const sendEmailMock = sendEmail as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.invalid/api/email/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/email/send (PRO-C1)", () => {
  it("returns 401 when getServerAccessToken returns null", async () => {
    getServerAccessTokenMock.mockResolvedValueOnce(null);

    const response = await POST(
      buildPostRequest({
        to: "test@example.com",
        subject: "Hello",
        body: "Body",
      }),
    );

    expect(response.status).toBe(401);
    expect(getServerAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("forwards the JWT-derived token + provider to sendEmail", async () => {
    getServerAccessTokenMock.mockResolvedValueOnce({
      accessToken: "ya29.cookie-token",
      provider: "microsoft",
    });
    sendEmailMock.mockResolvedValueOnce({
      success: true,
      messageId: "msg-1",
      threadId: "thr-1",
    });

    const request = buildPostRequest({
      to: "alice@example.com",
      subject: "Suivi",
      body: "Bonjour",
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(getServerAccessTokenMock).toHaveBeenCalledWith(request);
    expect(sendEmailMock).toHaveBeenCalledWith(
      "microsoft",
      "ya29.cookie-token",
      { to: "alice@example.com", subject: "Suivi", body: "Bonjour" },
    );

    const json = await response.json();
    expect(json).toEqual({ success: true, messageId: "msg-1", threadId: "thr-1" });
  });

  it("returns 403 ForbiddenError when sendEmail surfaces a Permission error", async () => {
    getServerAccessTokenMock.mockResolvedValueOnce({
      accessToken: "tok",
      provider: "google",
    });
    sendEmailMock.mockResolvedValueOnce({
      success: false,
      error: "Permission denied: gmail.send scope missing",
    });

    const response = await POST(
      buildPostRequest({
        to: "bob@example.com",
        subject: "Test",
        body: "Body",
      }),
    );

    expect(response.status).toBe(403);
  });
});
