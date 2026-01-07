"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
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
            // Retry une seule fois en cas d'erreur
            retry: 1,
            // Délai exponentiel entre les retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Rafraîchir quand on revient sur l'onglet (mais respecte staleTime)
            refetchOnWindowFocus: "always",
            // Ne pas refetch automatiquement au montage si les données sont fraîches
            refetchOnMount: true,
            // Rafraîchir après reconnexion réseau
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
