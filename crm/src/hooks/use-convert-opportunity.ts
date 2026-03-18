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
  /** If provided, skip opportunity creation and link to this existing opportunity */
  opportuniteId?: string;
}

/**
 * Hook to convert a prospect to an opportunity.
 *
 * Two modes:
 * - Without opportuniteId: creates the opportunity + runs all lifecycle steps
 * - With opportuniteId: links to an existing opportunity + runs lifecycle steps only
 *
 * Lifecycle steps:
 * 1. Creates the N:N link in opportunite_contacts (isPrimary: true, role: "Decideur")
 * 2. Updates the contact lifecycle_stage to "Opportunity" and status to "Qualifié"
 * 3. Creates an interaction "Passage en Opportunité" for audit trail
 * 4. Updates the client status to "Actif" if it was "Prospect"
 * 5. Links contact_id on the opportunity for backward compatibility
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
      opportuniteId,
    }: ConvertToOpportunityParams) => {
      let finalOpportunityId: string;
      let opportunityName: string;

      if (opportuniteId) {
        // Mode: link to existing opportunity
        finalOpportunityId = opportuniteId;

        // Fetch the opportunity name for the interaction audit trail
        const { data: opp } = await supabase
          .from("opportunites")
          .select("nom")
          .eq("id", opportuniteId)
          .single();
        opportunityName = opp?.nom || "Opportunité";

        // Update contact_id on the opportunity for backward compatibility
        await supabase
          .from("opportunites")
          .update({ contact_id: contactId })
          .eq("id", opportuniteId);
      } else {
        // Mode: create new opportunity
        opportunityName = `${clientNom} - ${contactNom}`;
        const { data: opportunity, error: oppError } = await supabase
          .from("opportunites")
          .insert({
            nom: opportunityName,
            client_id: clientId,
            contact_id: contactId,
            statut: "Qualifié",
            valeur_estimee: valeurEstimee || null,
            probabilite: 20,
            notes: notes || null,
            date_cloture_prevue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          })
          .select()
          .single();

        if (oppError) throw oppError;
        finalOpportunityId = opportunity.id;
      }

      // 1. Create N:N link in opportunite_contacts
      const { error: pivotError } = await supabase
        .from("opportunite_contacts")
        .insert({
          opportunite_id: finalOpportunityId,
          contact_id: contactId,
          role: "Decideur",
          is_primary: true,
        });

      if (pivotError) throw pivotError;

      // 2. Update contact: lifecycle_stage to "Opportunity" and status to "Qualifié"
      const { error: contactError } = await supabase
        .from("contacts")
        .update({
          statut_prospection: "Qualifié",
          lifecycle_stage: "Opportunity",
          lifecycle_stage_changed_at: new Date().toISOString(),
        })
        .eq("id", contactId);

      if (contactError) throw contactError;

      // 3. Create interaction for audit trail
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

      // 4. Check if client is "Prospect" and update to "Actif"
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

      return { contactId, clientId, opportunityId: finalOpportunityId };
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
