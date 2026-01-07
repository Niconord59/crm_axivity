"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient, AUTH_STORAGE_KEY } from "@/lib/supabase/client";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

/**
 * Hook de synchronisation d'authentification cross-tab
 *
 * Ce hook:
 * 1. Écoute les changements d'état d'auth Supabase
 * 2. Invalide le cache React Query lors des changements de session
 * 3. Gère les conflits de session entre onglets via localStorage events
 *
 * NOTE: La redirection vers /login est gérée par use-auth.ts pour éviter la duplication
 */
export function useAuthSync() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Debounce ref pour éviter les rafales d'événements storage
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 100;

  const handleAuthChange = useCallback(
    (event: AuthChangeEvent, session: Session | null) => {
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

  // Écouter les événements de storage pour la synchronisation cross-tab
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Vérifier si c'est notre clé de session
      if (event.key !== AUTH_STORAGE_KEY) {
        return;
      }

      // Debounce pour éviter les rafales d'événements
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (event.newValue === null) {
          // Session supprimée dans un autre onglet
          // La redirection est gérée par use-auth.ts via onAuthStateChange
          queryClient.clear();
        } else if (event.oldValue !== event.newValue) {
          // Session changée dans un autre onglet
          // Invalider seulement les queries user/profile, pas tout le cache
          queryClient.invalidateQueries({ queryKey: ["user"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          queryClient.invalidateQueries({ queryKey: ["profiles"] });
        }
      }, DEBOUNCE_MS);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      // Cleanup du timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [queryClient]);
}
