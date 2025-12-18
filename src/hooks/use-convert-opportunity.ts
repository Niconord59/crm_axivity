"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Hook to convert a prospect to an opportunity.
 * This updates the contact status to "Qualifié" and optionally
 * updates the client status to "Actif" if it was "Prospect".
 */
export function useConvertToOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      clientId,
    }: {
      contactId: string;
      clientId: string;
    }) => {
      // 1. Update contact status to "Qualifié"
      const { error: contactError } = await supabase
        .from("contacts")
        .update({ statut_prospection: "Qualifié" })
        .eq("id", contactId);

      if (contactError) throw contactError;

      // 2. Check if client is "Prospect" and update to "Actif"
      try {
        const { data: client } = await supabase
          .from("clients")
          .select("statut")
          .eq("id", clientId)
          .single();

        if (client?.statut === "Prospect") {
          await supabase
            .from("clients")
            .update({ statut: "Actif" })
            .eq("id", clientId);
        }
      } catch {
        // Client might not exist or have been deleted, continue anyway
      }

      return { contactId, clientId };
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({ queryKey: ["prospects-with-clients"] });
      queryClient.invalidateQueries({ queryKey: ["prospection-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["opportunites"] });
    },
  });
}
