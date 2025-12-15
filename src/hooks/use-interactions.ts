"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { Interaction, InteractionType } from "@/types";

interface InteractionFields {
  "Objet de l'Interaction"?: string;
  "Type"?: string;
  "Date"?: string;
  "Notes"?: string;
  "Contact"?: string[];
  "Client"?: { id: string; name: string }[]; // Lookup field (read-only)
  "Participant Interne"?: { id: string; email: string; name: string };
}

function mapRecordToInteraction(
  record: { id: string; fields: InteractionFields }
): Interaction {
  return {
    id: record.id,
    objet: record.fields["Objet de l'Interaction"] || "",
    type: record.fields["Type"] as InteractionType,
    date: record.fields["Date"],
    resume: record.fields["Notes"],
    contact: record.fields["Contact"],
    client: record.fields["Client"]?.map(c => c.id),
    membreEquipe: record.fields["Participant Interne"]
      ? [record.fields["Participant Interne"].id]
      : undefined,
  };
}

export function useInteractions(options?: {
  contactId?: string;      // Filter by contact ID (direct link field)
  clientName?: string;     // Filter by client name (lookup field shows names)
}) {
  return useQuery({
    queryKey: ["interactions", options],
    queryFn: async () => {
      let filterByFormula: string | undefined;

      // Filter by Contact ID (linked field with actual IDs) - preferred for prospects
      if (options?.contactId) {
        filterByFormula = `FIND('${options.contactId}', ARRAYJOIN({Contact}))`;
      }
      // Filter by Client name (lookup field contains names, not IDs) - for client pages
      else if (options?.clientName) {
        filterByFormula = `FIND('${options.clientName}', ARRAYJOIN({Client}))`;
      }

      const records = await airtable.getRecords<InteractionFields>(
        AIRTABLE_TABLES.INTERACTIONS,
        {
          filterByFormula,
          sort: [{ field: "Date", direction: "desc" }],
        }
      );

      return records.map(mapRecordToInteraction);
    },
  });
}

export function useInteraction(id: string | undefined) {
  return useQuery({
    queryKey: ["interaction", id],
    queryFn: async () => {
      if (!id) throw new Error("Interaction ID required");
      const record = await airtable.getRecord<InteractionFields>(
        AIRTABLE_TABLES.INTERACTIONS,
        id
      );
      return mapRecordToInteraction(record);
    },
    enabled: !!id,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Interaction>) => {
      // Note: "Client" is a lookup field (read-only), auto-populated from Contact
      const fields: Partial<InteractionFields> = {
        "Objet de l'Interaction": data.objet,
        "Type": data.type,
        "Date": data.date,
        "Notes": data.resume,
        "Contact": data.contact,
        // Don't include "Client" - it's a lookup field auto-populated via Contact
      };

      const record = await airtable.createRecord<InteractionFields>(
        AIRTABLE_TABLES.INTERACTIONS,
        fields
      );
      return mapRecordToInteraction(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
    },
  });
}

export function useLastInteractionDate(options?: {
  contactId?: string;
  clientName?: string;
}) {
  return useQuery({
    queryKey: ["interactions", "last-date", options],
    queryFn: async () => {
      let filterByFormula: string | undefined;

      if (options?.contactId) {
        filterByFormula = `FIND('${options.contactId}', ARRAYJOIN({Contact}))`;
      } else if (options?.clientName) {
        filterByFormula = `FIND('${options.clientName}', ARRAYJOIN({Client}))`;
      }

      if (!filterByFormula) return null;

      const records = await airtable.getRecords<InteractionFields>(
        AIRTABLE_TABLES.INTERACTIONS,
        {
          filterByFormula,
          sort: [{ field: "Date", direction: "desc" }],
          maxRecords: 1,
        }
      );

      if (records.length === 0) return null;
      return records[0].fields["Date"] || null;
    },
    enabled: !!(options?.contactId || options?.clientName),
  });
}
