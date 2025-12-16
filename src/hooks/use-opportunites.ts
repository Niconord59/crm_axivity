"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { Opportunite, OpportunityStatus } from "@/types";

interface OpportuniteFields {
  "Nom de l'Opportunité"?: string;
  "Statut"?: string;
  "Valeur Estimée"?: number;
  "Probabilité"?: number;
  "Date de Clôture Estimée"?: string;
  "Source"?: string;
  "Notes"?: string;
  "Date de Création"?: string;
  "Valeur Pondérée"?: number;
  "Client"?: string[];
  "Contact"?: string[];
  "Lignes de Devis"?: string[];
  "Projet Créé"?: string[];
}

function mapRecordToOpportunite(
  record: { id: string; fields: OpportuniteFields }
): Opportunite {
  return {
    id: record.id,
    nom: record.fields["Nom de l'Opportunité"] || "",
    statut: record.fields["Statut"] as OpportunityStatus,
    valeurEstimee: record.fields["Valeur Estimée"],
    probabilite: record.fields["Probabilité"],
    dateClotureEstimee: record.fields["Date de Clôture Estimée"],
    source: record.fields["Source"],
    notes: record.fields["Notes"],
    dateCreation: record.fields["Date de Création"],
    valeurPonderee: record.fields["Valeur Pondérée"],
    client: record.fields["Client"],
    contact: record.fields["Contact"],
    lignesDevis: record.fields["Lignes de Devis"],
    projetCree: record.fields["Projet Créé"],
  };
}

export function useOpportunites(options?: {
  statut?: OpportunityStatus;
  clientId?: string;
}) {
  return useQuery({
    queryKey: ["opportunites", options],
    queryFn: async () => {
      let filterByFormula: string | undefined;
      const filters: string[] = [];

      if (options?.statut) {
        filters.push(`{Statut} = '${options.statut}'`);
      }
      if (options?.clientId) {
        filters.push(`FIND('${options.clientId}', ARRAYJOIN({Client}))`);
      }

      if (filters.length > 0) {
        filterByFormula =
          filters.length === 1 ? filters[0] : `AND(${filters.join(", ")})`;
      }

      const records = await airtable.getRecords<OpportuniteFields>(
        AIRTABLE_TABLES.OPPORTUNITES,
        {
          filterByFormula,
          sort: [{ field: "Date de Clôture Estimée", direction: "asc" }],
        }
      );

      return records.map(mapRecordToOpportunite);
    },
  });
}

export function useOpportunitesParStatut() {
  return useQuery({
    queryKey: ["opportunites", "par-statut"],
    queryFn: async () => {
      const records = await airtable.getRecords<OpportuniteFields>(
        AIRTABLE_TABLES.OPPORTUNITES,
        {
          filterByFormula:
            "AND({Statut} != 'Gagné', {Statut} != 'Perdu')",
          sort: [{ field: "Date de Clôture Estimée", direction: "asc" }],
        }
      );

      const opportunites = records.map(mapRecordToOpportunite);

      // Group by status for Kanban
      const grouped: Record<OpportunityStatus, Opportunite[]> = {
        Qualifié: [],
        Proposition: [],
        Négociation: [],
        Gagné: [],
        Perdu: [],
      };

      opportunites.forEach((opp) => {
        if (opp.statut && grouped[opp.statut]) {
          grouped[opp.statut].push(opp);
        }
      });

      return grouped;
    },
  });
}

export function useOpportunite(id: string | undefined) {
  return useQuery({
    queryKey: ["opportunite", id],
    queryFn: async () => {
      if (!id) throw new Error("Opportunite ID required");
      const record = await airtable.getRecord<OpportuniteFields>(
        AIRTABLE_TABLES.OPPORTUNITES,
        id
      );
      return mapRecordToOpportunite(record);
    },
    enabled: !!id,
  });
}

export function useCreateOpportunite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Opportunite>) => {
      const fields: Partial<OpportuniteFields> = {
        "Nom de l'Opportunité": data.nom,
        "Statut": data.statut,
        "Valeur Estimée": data.valeurEstimee,
        "Probabilité": data.probabilite,
        "Date de Clôture Estimée": data.dateClotureEstimee,
        "Source": data.source,
        "Notes": data.notes,
        "Client": data.client,
        "Contact": data.contact,
      };

      const record = await airtable.createRecord<OpportuniteFields>(
        AIRTABLE_TABLES.OPPORTUNITES,
        fields
      );
      return mapRecordToOpportunite(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunites"] });
    },
  });
}

export function useUpdateOpportunite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Opportunite>;
    }) => {
      const fields: Partial<OpportuniteFields> = {};

      if (data.nom !== undefined) fields["Nom de l'Opportunité"] = data.nom;
      if (data.statut !== undefined) fields["Statut"] = data.statut;
      if (data.valeurEstimee !== undefined)
        fields["Valeur Estimée"] = data.valeurEstimee;
      if (data.probabilite !== undefined)
        fields["Probabilité"] = data.probabilite;
      if (data.dateClotureEstimee !== undefined)
        fields["Date de Clôture Estimée"] = data.dateClotureEstimee;
      if (data.source !== undefined) fields["Source"] = data.source;
      if (data.notes !== undefined) fields["Notes"] = data.notes;

      const record = await airtable.updateRecord<OpportuniteFields>(
        AIRTABLE_TABLES.OPPORTUNITES,
        id,
        fields
      );
      return mapRecordToOpportunite(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["opportunites"] });
      queryClient.invalidateQueries({ queryKey: ["opportunite", variables.id] });
    },
  });
}

export function useUpdateOpportuniteStatut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      statut,
    }: {
      id: string;
      statut: OpportunityStatus;
    }) => {
      const record = await airtable.updateRecord<OpportuniteFields>(
        AIRTABLE_TABLES.OPPORTUNITES,
        id,
        { Statut: statut }
      );
      return mapRecordToOpportunite(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunites"] });
    },
  });
}
