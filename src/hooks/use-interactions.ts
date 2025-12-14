"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { Interaction, InteractionType } from "@/types";

interface InteractionFields {
  "Objet"?: string;
  "Type d'Interaction"?: string;
  "Date"?: string;
  "Résumé"?: string;
  "Prochaine Tâche"?: string;
  "Contact"?: string[];
  "Client"?: string[];
  "Membre Équipe"?: string[];
}

function mapRecordToInteraction(
  record: { id: string; fields: InteractionFields }
): Interaction {
  return {
    id: record.id,
    objet: record.fields["Objet"] || "",
    type: record.fields["Type d'Interaction"] as InteractionType,
    date: record.fields["Date"],
    resume: record.fields["Résumé"],
    prochaineTache: record.fields["Prochaine Tâche"],
    contact: record.fields["Contact"],
    client: record.fields["Client"],
    membreEquipe: record.fields["Membre Équipe"],
  };
}

export function useInteractions(options?: { clientId?: string }) {
  return useQuery({
    queryKey: ["interactions", options],
    queryFn: async () => {
      let filterByFormula: string | undefined;

      if (options?.clientId) {
        filterByFormula = `FIND('${options.clientId}', ARRAYJOIN({Client}))`;
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
      const fields: Partial<InteractionFields> = {
        "Objet": data.objet,
        "Type d'Interaction": data.type,
        "Date": data.date,
        "Résumé": data.resume,
        "Prochaine Tâche": data.prochaineTache,
        "Contact": data.contact,
        "Client": data.client,
        "Membre Équipe": data.membreEquipe,
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

export function useLastInteractionDate(clientId: string | undefined) {
  return useQuery({
    queryKey: ["interactions", "last-date", clientId],
    queryFn: async () => {
      if (!clientId) return null;

      const records = await airtable.getRecords<InteractionFields>(
        AIRTABLE_TABLES.INTERACTIONS,
        {
          filterByFormula: `FIND('${clientId}', ARRAYJOIN({Client}))`,
          sort: [{ field: "Date", direction: "desc" }],
          maxRecords: 1,
        }
      );

      if (records.length === 0) return null;
      return records[0].fields["Date"] || null;
    },
    enabled: !!clientId,
  });
}
