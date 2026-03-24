import "dotenv/config";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server.js";
import { validateApiKey, extractApiKey } from "./auth.js";
import { registerOAuthEndpoints } from "./oauth.js";
import { config, validateConfig } from "./config.js";
import { logger } from "./lib/logger.js";

validateConfig();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests for debugging
app.use((req, _res, next) => {
  logger.debug("Incoming request", {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.authorization,
    authPrefix: req.headers.authorization?.slice(0, 20),
    sessionId: req.headers["mcp-session-id"] ?? "none",
  });
  next();
});

// Health check (no auth required)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// OAuth endpoints (required by Claude Code's HTTP transport)
registerOAuthEndpoints(app);

// Session store: each authenticated session gets its own MCP server + transport
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; userId: string }>();

// MCP endpoint — Streamable HTTP
app.all("/mcp", async (req, res) => {
  try {
    // --- Resolve user identity ---
    // Try API key first, fall back to anonymous (OAuth tokens are pass-through)
    const authHeader = req.headers.authorization;
    const apiKey = extractApiKey(authHeader);
    let userId = "anonymous";
    let userEmail = "anonymous";
    let userRole = "admin"; // Default to admin for OAuth pass-through

    if (apiKey && apiKey.startsWith("axv_")) {
      // Real API key
      const keyInfo = await validateApiKey(apiKey);
      if (keyInfo) {
        userId = keyInfo.userId;
        userEmail = keyInfo.email;
        userRole = keyInfo.role;
      }
    } else if (apiKey) {
      // OAuth token — pass-through, accept as authenticated
      logger.debug("OAuth token received, accepting as authenticated");
    }

    // --- Session management ---
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    logger.debug("MCP request", {
      method: req.method,
      hasSession: !!sessionId,
      sessionExists: sessionId ? sessions.has(sessionId) : false,
      activeSessions: sessions.size,
    });

    if (req.method === "GET") {
      if (!sessionId || !sessions.has(sessionId)) {
        logger.warn("GET without valid session", { sessionId });
        res.status(400).json({ error: "Invalid or missing session ID" });
        return;
      }
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    if (req.method === "POST") {
      // Existing session
      if (sessionId && sessions.has(sessionId)) {
        logger.debug("Continuing existing session", { sessionId });
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res, req.body);
        return;
      }

      // New session
      logger.info("Creating new MCP session", { user: userEmail });
      const server = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          sessions.set(newSessionId, { transport, userId });
          logger.info("MCP session initialized", {
            sessionId: newSessionId,
            user: userEmail,
            role: userRole,
          });
        },
      });

      (transport as any).__userId = userId;
      (transport as any).__userEmail = userEmail;
      (transport as any).__userRole = userRole;

      transport.onclose = () => {
        const sid = Array.from(sessions.entries()).find(([, s]) => s.transport === transport)?.[0];
        if (sid) {
          sessions.delete(sid);
          logger.info("MCP session closed", { sessionId: sid });
        }
      };

      await server.connect(transport);
      logger.debug("Server connected to transport, handling request");
      await transport.handleRequest(req, res, req.body);
      logger.debug("Request handled successfully");
      return;
    }

    if (req.method === "DELETE") {
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res, req.body);
        sessions.delete(sessionId);
        logger.info("MCP session terminated", { sessionId });
        return;
      }
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    logger.error("MCP endpoint error", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      method: req.method,
      sessionId: req.headers["mcp-session-id"] as string,
    });
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Catch-all: return JSON 404 (not HTML) for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(config.server.port, () => {
  logger.info(`MCP Server CRM Axivity started`, {
    port: config.server.port,
    env: config.server.nodeEnv,
    endpoint: `http://localhost:${config.server.port}/mcp`,
  });
});
