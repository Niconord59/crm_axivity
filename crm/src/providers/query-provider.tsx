"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Détecte si une erreur Supabase est une erreur d'authentification (401/403).
 * Ces erreurs indiquent que le token a expiré et ne peut pas être rafraîchi
 * (ex: refresh token révoqué par un autre appareil).
 */
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;
  // PostgREST retourne code "PGRST301" pour 401 Unauthorized
  if (err.code === "PGRST301") return true;
  // Supabase-js retourne un status 401 (ne pas inclure 403 qui peut venir de RLS)
  if (err.status === 401) return true;
  // Vérifier le message d'erreur
  const msg = String(err.message || "").toLowerCase();
  if (msg.includes("jwt expired") || msg.includes("invalid claim") || msg.includes("token is expired")) return true;
  return false;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const signOutInProgressRef = useRef(false);

  const handleAuthError = useCallback(async () => {
    // Éviter les sign-out en cascade (plusieurs queries échouent en même temps)
    if (signOutInProgressRef.current) return;
    console.warn("[QueryProvider] Auth error detected, triggering sign-out");
    signOutInProgressRef.current = true;

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      // Le redirect vers /login est géré par use-auth.ts onAuthStateChange SIGNED_OUT
    } catch {
      // Si signOut échoue aussi, forcer la navigation
      window.location.href = "/login";
    } finally {
      // Reset après un délai pour permettre les redirections
      setTimeout(() => {
        signOutInProgressRef.current = false;
      }, 5000);
    }
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Données considérées "fraîches" pendant 30 secondes
            // Évite les refetch en cascade entre onglets
            staleTime: 30 * 1000,
            // Cache gardé 5 minutes après le dernier usage
            gcTime: 5 * 60 * 1000,
            // Ne pas retry les erreurs d'auth (inutile si le token est révoqué)
            retry: (failureCount, error) => {
              if (isAuthError(error)) return false;
              return failureCount < 1;
            },
            // Délai exponentiel entre les retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Rafraîchir quand on revient sur l'onglet (respecte staleTime: refetch seulement si données stale)
            refetchOnWindowFocus: true,
            // Refetch au montage seulement si données stale (respecte staleTime)
            refetchOnMount: true,
            // Rafraîchir après reconnexion réseau
            refetchOnReconnect: true,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  // Écouter les erreurs de queries globalement pour détecter les 401
  useState(() => {
    queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.query.state.status === "error") {
        if (isAuthError(event.query.state.error)) {
          handleAuthError();
        }
      }
    });
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
