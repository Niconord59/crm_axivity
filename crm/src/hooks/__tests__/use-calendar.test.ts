import { describe, it, expect } from "vitest";
import { parseApiError } from "../use-calendar";

function htmlResponse(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("parseApiError (PRO-H13)", () => {
  it("returns a fallback message when a 502 HTML page is returned", async () => {
    const response = htmlResponse(502, "<html><body>Bad Gateway</body></html>");
    const msg = await parseApiError(response, "Erreur lors de la récupération");
    expect(msg).toBe("Erreur lors de la récupération (code 502)");
  });

  it("returns a fallback message when the body is not parseable JSON", async () => {
    const response = new Response("not-json-but-claims-to-be", {
      status: 500,
      headers: { "content-type": "application/json" },
    });
    const msg = await parseApiError(response, "Erreur générique");
    expect(msg).toBe("Erreur générique (code 500)");
  });

  it("extracts the `error` field from a JSON error payload", async () => {
    const response = jsonResponse(400, { error: "Paramètres invalides" });
    const msg = await parseApiError(response, "Fallback");
    expect(msg).toBe("Paramètres invalides");
  });

  it("falls back to the `message` field when `error` is absent", async () => {
    const response = jsonResponse(400, { message: "Jeton expiré" });
    const msg = await parseApiError(response, "Fallback");
    expect(msg).toBe("Jeton expiré");
  });

  it("returns a status-based message when JSON has neither `error` nor `message`", async () => {
    const response = jsonResponse(400, { some: "payload" });
    const msg = await parseApiError(response, "Fallback");
    expect(msg).toBe("Fallback (code 400)");
  });

  it("returns a status-based message when `error` is an empty string", async () => {
    const response = jsonResponse(500, { error: "" });
    const msg = await parseApiError(response, "Erreur serveur");
    expect(msg).toBe("Erreur serveur (code 500)");
  });

  it("tolerates a missing content-type header", async () => {
    const response = new Response("<html>Nope</html>", { status: 504 });
    const msg = await parseApiError(response, "Timeout");
    expect(msg).toBe("Timeout (code 504)");
  });
});
