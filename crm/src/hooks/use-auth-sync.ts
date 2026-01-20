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

  const handleAuthChange = useCallback(
    (event: AuthChangeEvent, _session: Session | null) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[AuthSync] Event:", event);
      }

      switch (event) {
        case "SIGNED_IN":
          // Nouvel utilisateur connecté, vider le cache de l'ancien
          queryClient.clear();
          break;

        case "SIGNED_OUT":
          // Nettoyer le cache (la redirection est gérée par use-auth.ts)
          queryClient.clear();
          break;

        case "TOKEN_REFRESHED":
          // Token rafraîchi, les données restent valides
          // Pas besoin d'invalider le cache
          break;

        case "USER_UPDATED":
          // Invalider uniquement les données utilisateur
          queryClient.invalidateQueries({ queryKey: ["user"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          queryClient.invalidateQueries({ queryKey: ["profiles"] });
          break;

        case "INITIAL_SESSION":
          // Session initiale chargée, rien à faire
          break;

        default:
          // Pour les événements inconnus, log en dev uniquement
          if (process.env.NODE_ENV === "development") {
            console.warn("[AuthSync] Unknown event:", event);
          }
          break;
      }
    },
    [queryClient]
  );

  // Écouter les changements d'état d'auth Supabase
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, handleAuthChange]);
}
