import { logger } from "./logger.js";

export class McpToolError extends Error {
  constructor(
    message: string,
    public readonly code: string = "TOOL_ERROR",
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "McpToolError";
  }
}

export function formatToolError(error: unknown): string {
  if (error instanceof McpToolError) {
    logger.warn("Tool error", { code: error.code, message: error.message, details: error.details });
    return `[${error.code}] ${error.message}`;
  }

  if (error instanceof Error) {
    logger.error("Unexpected error", { message: error.message, stack: error.stack });
    return `Erreur: ${error.message}`;
  }

  logger.error("Unknown error", { error: String(error) });
  return "Erreur inconnue";
}

export function notFound(entity: string, id: string): McpToolError {
  return new McpToolError(`${entity} introuvable (id: ${id})`, "NOT_FOUND");
}

export function validationError(message: string): McpToolError {
  return new McpToolError(message, "VALIDATION_ERROR");
}

export function supabaseError(message: string, details?: Record<string, unknown>): McpToolError {
  return new McpToolError(message, "SUPABASE_ERROR", details);
}
