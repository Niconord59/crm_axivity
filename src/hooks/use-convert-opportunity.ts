"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface ConvertToOpportunityParams {
  contactId: string;
  clientId: string;
  contactNom: string;
  clientNom: string;
  valeurEstimee?: number;
  notes?: string;
}

/**
 * Hook to convert a prospect to an opportunity.
 * This:
 * 1. Creates an opportunity in the opportunites table
 * 2. Updates the contact status to "Qualifié"
 * 3. Updates the client status to "Actif" if it was "Prospect"
 */
export function useConvertToOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      clientId,
      contactNom,
      clientNom,
      valeurEstimee,
      notes,
    }: ConvertToOpportunityParams) => {
      // 1. Create the opportunity
      const opportunityName = `${clientNom} - ${contactNom}`;
      const { data: opportunity, error: oppError } = await supabase
        .from("opportunites")
        .insert({
          nom: opportunityName,
          client_id: clientId,
          contact_id: contactId,
          statut: "Qualifié",
          valeur_estimee: valeurEstimee || null,
          probabilite: 20, // Default probability for new opportunities
          notes: notes || null,
          date_cloture_prevue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
        })
        .select()
        .single();

      if (oppError) throw oppError;

      // 2. Update contact status to "Qualifié"
      const { error: contactError } = await supabase
        .from("contacts")
        .update({ statut_prospection: "Qualifié" })
        .eq("id", contactId);

      if (contactError) throw contactError;

      // 3. Check if client is "Prospect" and update to "Actif"
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

      return { contactId, clientId, opportunityId: opportunity.id };
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
