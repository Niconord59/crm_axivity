"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";

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
 * 2. Creates the N:N link in opportunite_contacts (isPrimary: true, role: "Decideur")
 * 3. Updates the contact lifecycle_stage to "Opportunity" and status to "Qualifié"
 * 4. Creates an interaction "Passage en Opportunité" for audit trail
 * 5. Updates the client status to "Actif" if it was "Prospect"
 *
 * Note: contact_id is still written for backward compatibility during transition period
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
      // 1. Create the opportunity (with contact_id for backward compatibility)
      const opportunityName = `${clientNom} - ${contactNom}`;
      const { data: opportunity, error: oppError } = await supabase
        .from("opportunites")
        .insert({
          nom: opportunityName,
          client_id: clientId,
          contact_id: contactId, // Keep for backward compatibility
          statut: "Qualifié",
          valeur_estimee: valeurEstimee || null,
          probabilite: 20, // Default probability for new opportunities
          notes: notes || null,
          date_cloture_prevue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
        })
        .select()
        .single();

      if (oppError) throw oppError;

      // 2. Create N:N link in opportunite_contacts
      const { error: pivotError } = await supabase
        .from("opportunite_contacts")
        .insert({
          opportunite_id: opportunity.id,
          contact_id: contactId,
          role: "Decideur",
          is_primary: true,
        });

      if (pivotError) throw pivotError;

      // 3. Update contact: lifecycle_stage to "Opportunity" and status to "Qualifié"
      const { error: contactError } = await supabase
        .from("contacts")
        .update({
          statut_prospection: "Qualifié",
          lifecycle_stage: "Opportunity",
          lifecycle_stage_changed_at: new Date().toISOString(),
        })
        .eq("id", contactId);

      if (contactError) throw contactError;

      // 4. Create interaction for audit trail
      try {
        await supabase
          .from("interactions")
          .insert({
            objet: "Passage en Opportunité",
            type: "Note",
            date: new Date().toISOString().split("T")[0],
            resume: `Contact converti en opportunité "${opportunityName}"`,
            contact_id: contactId,
            client_id: clientId,
          });
      } catch {
        // Non-blocking: interaction creation is for audit, don't fail conversion
      }

      // 5. Check if client is "Prospect" and update to "Actif"
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
    onSuccess: async () => {
      // Force refetch pour afficher immédiatement les changements
      await Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.prospects.all }),
        queryClient.refetchQueries({ queryKey: queryKeys.clients.all }),
        queryClient.refetchQueries({ queryKey: queryKeys.opportunites.all }),
      ]);
      queryClient.invalidateQueries({ queryKey: queryKeys.prospects.kpis() });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportuniteContacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.interactions.all });
    },
  });
}
