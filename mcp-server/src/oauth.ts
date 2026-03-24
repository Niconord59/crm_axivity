/**
 * Minimal OAuth 2.1 endpoints to satisfy MCP client requirements.
 *
 * Claude Code's HTTP transport REQUIRES OAuth discovery + registration + token flow.
 * Since we use API keys for real auth (validated on every /mcp request),
 * this OAuth layer is a pass-through that auto-approves everything.
 */
import type { Express, Request, Response } from "express";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";

export function registerOAuthEndpoints(app: Express): void {
  const baseUrl = getBaseUrl();

  // --- OAuth Protected Resource Metadata (RFC 9728) ---
  // Claude Code tries multiple path variants
  const protectedResourceHandler = (_req: Request, res: Response) => {
    res.json({
      resource: `${baseUrl}/mcp`,
      authorization_servers: [baseUrl],
      bearer_methods_supported: ["header"],
    });
  };

  app.get("/.well-known/oauth-protected-resource", protectedResourceHandler);
  app.get("/.well-known/oauth-protected-resource/mcp", protectedResourceHandler);

  // --- OAuth Authorization Server Metadata (RFC 8414) ---
  const authServerHandler = (_req: Request, res: Response) => {
    res.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      registration_endpoint: `${baseUrl}/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      token_endpoint_auth_methods_supported: ["none"],
      code_challenge_methods_supported: ["S256"],
    });
  };

  app.get("/.well-known/oauth-authorization-server", authServerHandler);
  app.get("/.well-known/oauth-authorization-server/mcp", authServerHandler);
  app.get("/.well-known/openid-configuration", authServerHandler);
  app.get("/.well-known/openid-configuration/mcp", authServerHandler);
  app.get("/mcp/.well-known/openid-configuration", authServerHandler);

  // --- Dynamic Client Registration (RFC 7591) ---
  app.post("/register", (req: Request, res: Response) => {
    const clientId = `client_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    logger.info("OAuth client registered", { clientId });

    res.status(201).json({
      client_id: clientId,
      client_secret: undefined,
      client_name: req.body?.client_name ?? "MCP Client",
      redirect_uris: req.body?.redirect_uris ?? [],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    });
  });

  // --- Authorization Endpoint ---
  // Auto-approves and redirects back with an auth code
  app.get("/authorize", (req: Request, res: Response) => {
    const { redirect_uri, state, code_challenge } = req.query;

    if (!redirect_uri) {
      res.status(400).json({ error: "missing redirect_uri" });
      return;
    }

    // Generate a simple auth code
    const code = `code_${crypto.randomUUID().replace(/-/g, "")}`;

    // Store code_challenge for PKCE verification (simple in-memory)
    authCodes.set(code, {
      codeChallenge: code_challenge as string,
      redirectUri: redirect_uri as string,
      expiresAt: Date.now() + 60_000, // 1 minute
    });

    // Auto-redirect with code (no user interaction needed)
    const url = new URL(redirect_uri as string);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state as string);

    logger.info("OAuth auto-approved", { code: code.slice(0, 10) + "..." });
    res.redirect(302, url.toString());
  });

  // --- Token Endpoint ---
  app.post("/token", (req: Request, res: Response) => {
    const { grant_type, code, refresh_token } = req.body;

    if (grant_type === "authorization_code") {
      const stored = authCodes.get(code);
      if (!stored || stored.expiresAt < Date.now()) {
        res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired code" });
        return;
      }
      authCodes.delete(code);
    }

    // Issue tokens (these are just pass-through tokens, real auth is via API keys)
    const accessToken = `mcp_at_${crypto.randomUUID().replace(/-/g, "")}`;
    const newRefreshToken = `mcp_rt_${crypto.randomUUID().replace(/-/g, "")}`;

    logger.info("OAuth token issued", { grant_type });

    res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefreshToken,
    });
  });
}

// In-memory store for auth codes (short-lived)
const authCodes = new Map<string, {
  codeChallenge: string;
  redirectUri: string;
  expiresAt: number;
}>();

function getBaseUrl(): string {
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL;
  }
  const port = config.server.port;
  return `http://localhost:${port}`;
}
