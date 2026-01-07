"use client";

import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

/**
 * Hook de synchronisation d'authentification cross-tab
 *
 * Ce hook:
 * 1. Écoute les changements d'état d'auth Supabase
 * 2. Invalide le cache React Query lors des changements de session
 * 3. Redirige vers /login en cas de déconnexion
 * 4. Gère les conflits de session entre onglets
 */
export function useAuthSync() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleAuthChange = useCallback(
    (event: string, session: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[AuthSync] Event:", event);
      }

      switch (event) {
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
          // Session valide, pas besoin d'invalider le cache
          // sauf si c'est un nouvel utilisateur
          if (event === "SIGNED_IN") {
            queryClient.clear();
          }
          break;

        case "SIGNED_OUT":
          // Nettoyer le cache et rediriger
          queryClient.clear();
          router.push("/login");
          break;

        case "USER_UPDATED":
          // Invalider uniquement les données utilisateur
          queryClient.invalidateQueries({ queryKey: ["user"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          break;

        case "INITIAL_SESSION":
          // Session initiale chargée, rien à faire
          break;

        default:
          // Pour les événements inconnus, invalider tout par sécurité
          if (process.env.NODE_ENV === "development") {
            console.warn("[AuthSync] Unknown event:", event);
          }
          break;
      }
    },
    [queryClient, router]
  );

  useEffect(() => {
    // S'abonner aux changements d'état d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthChange]);

  // Écouter les événements de storage pour la synchronisation cross-tab
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Vérifier si c'est notre clé de session
      if (event.key === "crm-axivity-auth") {
        if (event.newValue === null) {
          // Session supprimée dans un autre onglet
          queryClient.clear();
          router.push("/login");
        } else if (event.oldValue !== event.newValue) {
          // Session changée dans un autre onglet
          // Invalider les queries pour forcer un refetch avec la nouvelle session
          queryClient.invalidateQueries();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [queryClient, router]);
}
