import { getServiceClient } from "./supabase.js";
import { formatToolError, notFound, supabaseError } from "./errors.js";

/**
 * Generic list with optional filters and pagination.
 */
export async function listRecords(
  table: string,
  options: {
    filters?: Record<string, string | number | boolean>;
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    offset?: number;
    select?: string;
  } = {},
): Promise<{ data: unknown[]; count: number }> {
  const {
    filters = {},
    orderBy = "created_at",
    ascending = false,
    limit = 50,
    offset = 0,
    select = "*",
  } = options;

  try {
    const supabase = getServiceClient();
    let query = supabase.from(table).select(select, { count: "exact" });

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        query = query.eq(key, value);
      }
    }

    query = query.order(orderBy, { ascending }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw supabaseError(error.message, { table, filters });

    return { data: data ?? [], count: count ?? 0 };
  } catch (err) {
    throw new Error(formatToolError(err));
  }
}

/**
 * Get a single record by ID.
 */
export async function getRecord(
  table: string,
  id: string,
  select = "*",
): Promise<unknown> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from(table).select(select).eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") throw notFound(table, id);
    throw supabaseError(error.message, { table, id });
  }

  return data;
}

/**
 * Create a record, return the created row.
 */
export async function createRecord(
  table: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from(table).insert(payload).select().single();

  if (error) throw supabaseError(error.message, { table, payload });
  return data;
}

/**
 * Update a record by ID, return the updated row.
 */
export async function updateRecord(
  table: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") throw notFound(table, id);
    throw supabaseError(error.message, { table, id, payload });
  }

  return data;
}

/**
 * Delete a record by ID.
 */
export async function deleteRecord(table: string, id: string): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) throw supabaseError(error.message, { table, id });
}

/**
 * Format a result for MCP tool response.
 */
export function toolResult(data: unknown): { content: [{ type: "text"; text: string }] } {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}
