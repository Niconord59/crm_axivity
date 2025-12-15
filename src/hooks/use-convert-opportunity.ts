"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";

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
      await airtable.updateRecord(
        AIRTABLE_TABLES.CONTACTS,
        contactId,
        {
          "Statut Prospection": "Qualifié",
        }
      );

      // 2. Check if client is "Prospect" and update to "Actif"
      try {
        const client = await airtable.getRecord<{ Statut?: string }>(
          AIRTABLE_TABLES.CLIENTS,
          clientId
        );

        if (client.fields.Statut === "Prospect") {
          await airtable.updateRecord(
            AIRTABLE_TABLES.CLIENTS,
            clientId,
            {
              Statut: "Actif",
            }
          );
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
