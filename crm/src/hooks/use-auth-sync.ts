"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

/**
 * Hook de synchronisation d'authentification cross-tab
 *
 * Ce hook:
 * 1. Écoute les changements d'état d'auth Supabase
 * 2. Invalide le cache React Query lors des changements de session
 *
 * NOTE: Avec @supabase/ssr, la session est stockée dans les cookies.
 * La synchronisation cross-tab est gérée automatiquement par le cookie.
 * La redirection vers /login est gérée par use-auth.ts pour éviter la duplication.
 */
export function useAuthSync() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Track the current user ID to detect actual user changes
    // (not just cookie chunk updates that fire multiple SIGNED_IN events)
    let currentUserId: string | null = null;
    let isInitialLoad = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthSync] Event:", event, "userId:", session?.user?.id?.slice(0, 8) ?? "null");

      const newUserId = session?.user?.id ?? null;

      switch (event) {
        case "SIGNED_IN": {
          // Only clear cache if the user actually changed (different user logged in).
          // On page reload, @supabase/ssr fires multiple SIGNED_IN events
          // (one per cookie chunk) — clearing the cache each time destroys
          // in-flight queries and prevents data from loading.
          if (!isInitialLoad && currentUserId && currentUserId !== newUserId) {
            queryClient.clear();
          }
          currentUserId = newUserId;
          isInitialLoad = false;
          break;
        }

        case "SIGNED_OUT":
          queryClient.clear();
          currentUserId = null;
          break;

        case "TOKEN_REFRESHED":
          // Token refreshed, data remains valid
          break;

        case "USER_UPDATED":
          queryClient.invalidateQueries({ queryKey: ["user"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          queryClient.invalidateQueries({ queryKey: ["profiles"] });
          break;

        case "INITIAL_SESSION":
          currentUserId = newUserId;
          isInitialLoad = false;
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);
}
