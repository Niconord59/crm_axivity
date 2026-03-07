"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton pattern to avoid multiple GoTrueClient instances
let client: SupabaseClient | null = null;

/**
 * Creates a Supabase client for browser/client-side usage.
 *
 * IMPORTANT:
 * - @supabase/ssr automatically handles cookie-based storage.
 *   Do NOT add auth.storageKey option - it forces localStorage usage
 *   which breaks server-side session synchronization with the middleware.
 * - global.fetch uses cache: 'no-store' to prevent the browser from
 *   serving stale cached API responses on page reload (F5). Without this,
 *   F5 can serve cached PostgREST responses while Ctrl+Shift+R works.
 */
export function createClient() {
  if (client) {
    return client;
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  );

  return client;
}
