"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Données toujours considérées comme "stale" → refetch à chaque montage
            gcTime: 5 * 60 * 1000, // 5 minutes de cache en mémoire
            retry: 1,
            refetchOnWindowFocus: true, // Rafraîchir quand on revient sur l'onglet
            refetchOnMount: true, // Rafraîchir au montage du composant
            refetchOnReconnect: true, // Rafraîchir après reconnexion réseau
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
