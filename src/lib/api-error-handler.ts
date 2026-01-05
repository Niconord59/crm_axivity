// CRM Axivity - API Error Handler
// Centralized error handling for Next.js API routes

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError, ValidationError } from "./errors";

interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Handle API errors and return appropriate NextResponse
 * Use this in catch blocks of API routes
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   try {
 *     // ... route logic
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Log error for debugging (but not for validation errors)
  if (!isAppError(error) || error.statusCode >= 500) {
    console.error("[API Error]", error);
  }

  // Handle AppError (our custom errors)
  if (isAppError(error)) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = formatZodErrors(error);
    return NextResponse.json(
      {
        error: "Données invalides",
        code: "VALIDATION_ERROR",
        details,
      },
      { status: 400 }
    );
  }

  // Handle standard Error
  if (error instanceof Error) {
    // Check for common error messages
    const message = error.message.toLowerCase();

    if (message.includes("not found") || message.includes("non trouvé")) {
      return NextResponse.json(
        { error: error.message, code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (message.includes("unauthorized") || message.includes("non authentifié")) {
      return NextResponse.json(
        { error: error.message, code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (message.includes("forbidden") || message.includes("accès refusé")) {
      return NextResponse.json(
        { error: error.message, code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Default to internal server error
    return NextResponse.json(
      {
        error: "Erreur serveur interne",
        code: "INTERNAL_ERROR",
        details: { message: error.message },
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: "Erreur inattendue",
      code: "UNKNOWN_ERROR",
      details: { raw: String(error) },
    },
    { status: 500 }
  );
}

/**
 * Format Zod validation errors into a readable object
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  });

  return details;
}

/**
 * Validate request body with Zod schema
 * Throws ValidationError if validation fails
 *
 * @example
 * ```ts
 * const data = await validateRequestBody(request, MySchema);
 * ```
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Corps de requête JSON invalide");
  }

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatZodErrors(error);
      throw new ValidationError("Données invalides", details);
    }
    throw error;
  }
}

/**
 * Create a wrapped API handler with automatic error handling
 *
 * @example
 * ```ts
 * export const POST = withErrorHandler(async (request) => {
 *   // ... route logic
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withErrorHandler<T>(
  handler: (request: Request) => Promise<NextResponse<T>>
) {
  return async (request: Request): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
