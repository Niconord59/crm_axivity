// CRM Axivity - Centralized Error Types
// Custom error classes for consistent API error handling

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Validation error (400 Bad Request)
 * Use when request data fails validation
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

/**
 * Authentication error (401 Unauthorized)
 * Use when user is not authenticated
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Non authentifié") {
    super(message, "UNAUTHORIZED", 401);
  }
}

/**
 * Authorization error (403 Forbidden)
 * Use when user lacks permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Accès refusé") {
    super(message, "FORBIDDEN", 403);
  }
}

/**
 * Not found error (404 Not Found)
 * Use when resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} avec l'ID "${id}" non trouvé`
      : `${resource} non trouvé`;
    super(message, "NOT_FOUND", 404, { resource, id });
  }
}

/**
 * Conflict error (409 Conflict)
 * Use when resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "CONFLICT", 409, details);
  }
}

/**
 * Database error (500 Internal Server Error)
 * Use for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(operation: string, details?: Record<string, unknown>) {
    super(
      `Erreur de base de données lors de: ${operation}`,
      "DATABASE_ERROR",
      500,
      details
    );
  }
}

/**
 * External service error (502 Bad Gateway)
 * Use when external API calls fail
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, details?: Record<string, unknown>) {
    super(
      `Erreur du service externe: ${service}`,
      "EXTERNAL_SERVICE_ERROR",
      502,
      details
    );
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}
