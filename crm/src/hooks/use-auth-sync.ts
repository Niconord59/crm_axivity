"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

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
    let currentUserId: string | null = null;
    // Debounce: only invalidate once after a burst of events
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleInvalidate = () => {
      if (invalidateTimer) clearTimeout(invalidateTimer);
      invalidateTimer = setTimeout(() => {
        queryClient.invalidateQueries();
        invalidateTimer = null;
      }, 100);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id ?? null;

      switch (event) {
        case "SIGNED_IN": {
          // If a different user signed in, clear entirely
          if (currentUserId && currentUserId !== newUserId) {
            queryClient.clear();
          }
          currentUserId = newUserId;
          // SIGNED_IN fires when GoTrue refreshed the token internally.
          // During this refresh, the client lock blocks data queries.
          // Schedule an invalidation after the events settle to unblock them.
          scheduleInvalidate();
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
          // No need to invalidate — queries fire normally with INITIAL_SESSION
          break;
      }
    });

    return () => {
      if (invalidateTimer) clearTimeout(invalidateTimer);
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);
}
