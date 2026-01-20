"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton pattern to avoid multiple GoTrueClient instances
let client: SupabaseClient | null = null;

/**
 * Creates a Supabase client for browser/client-side usage.
 *
 * IMPORTANT: @supabase/ssr automatically handles cookie-based storage.
 * Do NOT add auth.storageKey option - it forces localStorage usage
 * which breaks server-side session synchronization with the proxy.
 */
export function createClient() {
  if (client) {
    return client;
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
