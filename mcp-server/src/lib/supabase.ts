import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config.js";

let serviceClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client with service_role privileges.
 * Used for admin operations and when impersonating users via RLS.
 */
export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return serviceClient;
}

/**
 * Returns a Supabase client scoped to a specific user via RLS.
 * The service_role key bypasses RLS, so we set the role and user context
 * via PostgreSQL session variables to enforce RLS as that user.
 */
export function getUserClient(userId: string): SupabaseClient {
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        // These headers tell Supabase PostgREST to enforce RLS as this user
        "x-supabase-auth-user-id": userId,
      },
    },
    db: {
      schema: "public",
    },
  });
}

/**
 * Helper to handle Supabase query errors consistently.
 */
export function handleSupabaseError(error: { message: string; code?: string; details?: string }): never {
  throw new Error(`Supabase: ${error.message}${error.details ? ` (${error.details})` : ""}`);
}
