"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton pattern to avoid multiple GoTrueClient instances
let client: SupabaseClient | null = null;

// Storage key for auth session - MUST match @/lib/supabase.ts
export const AUTH_STORAGE_KEY = "crm-axivity-auth";

export function createClient() {
  if (client) {
    return client;
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Persiste la session dans localStorage
        persistSession: true,
        // Utilise PKCE pour une meilleure sécurité
        flowType: "pkce",
        // Clé de stockage unifiée avec @/lib/supabase.ts
        storageKey: AUTH_STORAGE_KEY,
        // Rafraîchit automatiquement le token avant expiration
        autoRefreshToken: true,
      },
    }
  );

  return client;
}
