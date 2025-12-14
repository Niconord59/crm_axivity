"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { Projet, ProjectStatus } from "@/types";

interface ProjetFields {
  "ID Projet"?: number;
  "Brief Projet"?: string;
  "Nom du Projet"?: string;
  "Statut"?: string;
  "Date de Début"?: string;
  "Date de Fin Prévue"?: string;
  "Date Fin Réelle"?: string;
  "Budget Final"?: number;
  "Notes"?: string;
  "Priorité"?: string;
  "% Tâches Terminées"?: number;
  "Budget Temps Consommé"?: number;
  "Marge Brute"?: number;
  "Total Heures Estimées"?: number;
  "Total Heures Passées"?: number;
  "Montant Total Facturé"?: number;
  "Coût Interne Estimé"?: number;
  "Nb Tâches"?: number;
  "Nb Tâches Terminées"?: number;
  "Client"?: string[];
  "Opportunités"?: string[];
  "Tâches"?: string[];
  "Factures"?: string[];
  "Équipe"?: string[];
  "Feedback"?: string[];
}

function mapRecordToProjet(record: { id: string; fields: ProjetFields }): Projet {
  return {
    id: record.id,
    idProjet: record.fields["ID Projet"],
    briefProjet: record.fields["Brief Projet"],
    nomProjet: record.fields["Nom du Projet"],
    statut: record.fields["Statut"] as ProjectStatus,
    dateDebut: record.fields["Date de Début"],
    dateFinPrevue: record.fields["Date de Fin Prévue"],
    dateFinReelle: record.fields["Date Fin Réelle"],
    budget: record.fields["Budget Final"],
    notes: record.fields["Notes"],
    priorite: record.fields["Priorité"] as Projet["priorite"],
    pourcentageTachesTerminees: record.fields["% Tâches Terminées"],
    budgetTempsConsomme: record.fields["Budget Temps Consommé"],
    margeBrute: record.fields["Marge Brute"],
    totalHeuresEstimees: record.fields["Total Heures Estimées"],
    totalHeuresPassees: record.fields["Total Heures Passées"],
    montantTotalFacture: record.fields["Montant Total Facturé"],
    coutInterneEstime: record.fields["Coût Interne Estimé"],
    nbTaches: record.fields["Nb Tâches"],
    nbTachesTerminees: record.fields["Nb Tâches Terminées"],
    client: record.fields["Client"],
    opportunite: record.fields["Opportunités"],
    taches: record.fields["Tâches"],
    factures: record.fields["Factures"],
    equipe: record.fields["Équipe"],
    feedbacks: record.fields["Feedback"],
  };
}

export function useProjets(options?: { statut?: ProjectStatus; clientId?: string }) {
  return useQuery({
    queryKey: ["projets", options],
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

      const records = await airtable.getRecords<ProjetFields>(
        AIRTABLE_TABLES.PROJETS,
        {
          filterByFormula,
          sort: [{ field: "Date de Début", direction: "desc" }],
        }
      );

      return records.map(mapRecordToProjet);
    },
  });
}

export function useProjetsActifs() {
  return useQuery({
    queryKey: ["projets", "actifs"],
    queryFn: async () => {
      const records = await airtable.getRecords<ProjetFields>(
        AIRTABLE_TABLES.PROJETS,
        {
          filterByFormula: "OR({Statut} = 'En cours', {Statut} = 'Cadrage')",
          sort: [{ field: "Date de Fin Prévue", direction: "asc" }],
        }
      );

      return records.map(mapRecordToProjet);
    },
  });
}

export function useProjet(id: string | undefined) {
  return useQuery({
    queryKey: ["projet", id],
    queryFn: async () => {
      if (!id) throw new Error("Projet ID required");
      const record = await airtable.getRecord<ProjetFields>(
        AIRTABLE_TABLES.PROJETS,
        id
      );
      return mapRecordToProjet(record);
    },
    enabled: !!id,
  });
}

export function useCreateProjet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Projet>) => {
      const fields: Partial<ProjetFields> = {
        "Brief Projet": data.briefProjet,
        "Statut": data.statut,
        "Date de Début": data.dateDebut,
        "Date de Fin Prévue": data.dateFinPrevue,
        "Budget Final": data.budget,
        "Notes": data.notes,
        "Priorité": data.priorite,
        "Client": data.client,
      };

      const record = await airtable.createRecord<ProjetFields>(
        AIRTABLE_TABLES.PROJETS,
        fields
      );
      return mapRecordToProjet(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });
}

export function useUpdateProjet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Projet> }) => {
      const fields: Partial<ProjetFields> = {};

      if (data.briefProjet !== undefined) fields["Brief Projet"] = data.briefProjet;
      if (data.statut !== undefined) fields["Statut"] = data.statut;
      if (data.dateDebut !== undefined) fields["Date de Début"] = data.dateDebut;
      if (data.dateFinPrevue !== undefined) fields["Date de Fin Prévue"] = data.dateFinPrevue;
      if (data.dateFinReelle !== undefined) fields["Date Fin Réelle"] = data.dateFinReelle;
      if (data.budget !== undefined) fields["Budget Final"] = data.budget;
      if (data.notes !== undefined) fields["Notes"] = data.notes;
      if (data.priorite !== undefined) fields["Priorité"] = data.priorite;

      const record = await airtable.updateRecord<ProjetFields>(
        AIRTABLE_TABLES.PROJETS,
        id,
        fields
      );
      return mapRecordToProjet(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projets"] });
      queryClient.invalidateQueries({ queryKey: ["projet", variables.id] });
    },
  });
}
