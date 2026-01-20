// CRM Axivity - Base Mapper Utilities
// Common functions for mapping Supabase records to App types

/**
 * Safely parse a string value
 */
export function parseString(
  value: unknown,
  defaultValue: string = ""
): string {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

/**
 * Safely parse an optional string value
 */
export function parseOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  return String(value);
}

/**
 * Safely parse a number value
 */
export function parseNumber(
  value: unknown,
  defaultValue: number = 0
): number {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely parse an optional number value
 */
export function parseOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * Safely parse a boolean value
 */
export function parseBoolean(
  value: unknown,
  defaultValue: boolean = false
): boolean {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

/**
 * Safely parse a date string (ISO format)
 */
export function parseDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  // Return as-is if it's already a string (ISO date)
  return String(value);
}

/**
 * Parse linked record IDs from Supabase
 * Handles both single ID and array of IDs
 */
export function parseLinkedIds(value: unknown): string[] | undefined {
  if (value === null || value === undefined) return undefined;

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string" && value) {
    return [value];
  }

  return undefined;
}

/**
 * Parse a single linked record ID
 */
export function parseLinkedId(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  return String(value);
}

/**
 * Safely cast to a typed enum value
 */
export function parseEnum<T extends string>(
  value: unknown,
  validValues: readonly T[],
  defaultValue?: T
): T | undefined {
  if (value === null || value === undefined) return defaultValue;
  const strValue = String(value);
  if (validValues.includes(strValue as T)) {
    return strValue as T;
  }
  return defaultValue;
}

/**
 * Type for raw Supabase record
 */
export type SupabaseRecord = Record<string, unknown>;
