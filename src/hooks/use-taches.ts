"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { Tache, TaskStatus, TaskPriority } from "@/types";

interface TacheFields {
  "Nom de la Tâche"?: string;
  "Description"?: string;
  "Statut"?: string;
  "Priorité"?: string;
  "Date d'Échéance"?: string;
  "Temps Estimé (h)"?: number;
  "Temps Passé (h)"?: number;
  "Date de Création"?: string;
  "Date de Complétion"?: string;
  "Ordre"?: number;
  "Est en Retard"?: boolean;
  "Projet"?: string[];
  "Membre Équipe"?: string[];
  "Journal de Temps"?: string[];
}

function mapRecordToTache(record: { id: string; fields: TacheFields }): Tache {
  return {
    id: record.id,
    nom: record.fields["Nom de la Tâche"] || "",
    description: record.fields["Description"],
    statut: record.fields["Statut"] as TaskStatus,
    priorite: record.fields["Priorité"] as TaskPriority,
    dateEcheance: record.fields["Date d'Échéance"],
    heuresEstimees: record.fields["Temps Estimé (h)"],
    heuresReelles: record.fields["Temps Passé (h)"],
    dateCreation: record.fields["Date de Création"],
    dateTerminee: record.fields["Date de Complétion"],
    ordre: record.fields["Ordre"],
    estEnRetard: record.fields["Est en Retard"],
    projet: record.fields["Projet"],
    membreEquipe: record.fields["Membre Équipe"],
    journalTemps: record.fields["Journal de Temps"],
  };
}

export function useTaches(options?: {
  statut?: TaskStatus;
  projetId?: string;
  membreEquipeId?: string;
}) {
  return useQuery({
    queryKey: ["taches", options],
    queryFn: async () => {
      let filterByFormula: string | undefined;
      const filters: string[] = [];

      if (options?.statut) {
        filters.push(`{Statut} = '${options.statut}'`);
      }
      if (options?.projetId) {
        filters.push(`FIND('${options.projetId}', ARRAYJOIN({Projet}))`);
      }
      if (options?.membreEquipeId) {
        filters.push(
          `FIND('${options.membreEquipeId}', ARRAYJOIN({Membre Équipe}))`
        );
      }

      if (filters.length > 0) {
        filterByFormula =
          filters.length === 1 ? filters[0] : `AND(${filters.join(", ")})`;
      }

      const records = await airtable.getRecords<TacheFields>(
        AIRTABLE_TABLES.TACHES,
        {
          filterByFormula,
          sort: [
            { field: "Date d'Échéance", direction: "asc" },
            { field: "Priorité", direction: "desc" },
          ],
        }
      );

      return records.map(mapRecordToTache);
    },
  });
}

export function useTachesEnRetard() {
  return useQuery({
    queryKey: ["taches", "en-retard"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const records = await airtable.getRecords<TacheFields>(
        AIRTABLE_TABLES.TACHES,
        {
          filterByFormula: `AND({Statut} != 'Terminé', {Date d'Échéance} < '${today}')`,
          sort: [{ field: "Date d'Échéance", direction: "asc" }],
        }
      );

      return records.map(mapRecordToTache);
    },
  });
}

export function useMesTaches(membreEquipeId: string | undefined) {
  return useQuery({
    queryKey: ["taches", "mes-taches", membreEquipeId],
    queryFn: async () => {
      if (!membreEquipeId) return [];

      const records = await airtable.getRecords<TacheFields>(
        AIRTABLE_TABLES.TACHES,
        {
          filterByFormula: `AND(FIND('${membreEquipeId}', ARRAYJOIN({Membre Équipe})), {Statut} != 'Terminé')`,
          sort: [
            { field: "Date d'Échéance", direction: "asc" },
            { field: "Priorité", direction: "desc" },
          ],
        }
      );

      return records.map(mapRecordToTache);
    },
    enabled: !!membreEquipeId,
  });
}

export function useTache(id: string | undefined) {
  return useQuery({
    queryKey: ["tache", id],
    queryFn: async () => {
      if (!id) throw new Error("Tache ID required");
      const record = await airtable.getRecord<TacheFields>(
        AIRTABLE_TABLES.TACHES,
        id
      );
      return mapRecordToTache(record);
    },
    enabled: !!id,
  });
}

export function useCreateTache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Tache>) => {
      const fields: Partial<TacheFields> = {
        "Nom de la Tâche": data.nom,
        "Description": data.description,
        "Statut": data.statut || "À faire",
        "Priorité": data.priorite || "Moyenne",
        "Date d'Échéance": data.dateEcheance,
        "Temps Estimé (h)": data.heuresEstimees,
        "Projet": data.projet,
        "Membre Équipe": data.membreEquipe,
      };

      const record = await airtable.createRecord<TacheFields>(
        AIRTABLE_TABLES.TACHES,
        fields
      );
      return mapRecordToTache(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taches"] });
      queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });
}

export function useUpdateTache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tache> }) => {
      const fields: Partial<TacheFields> = {};

      if (data.nom !== undefined) fields["Nom de la Tâche"] = data.nom;
      if (data.description !== undefined) fields["Description"] = data.description;
      if (data.statut !== undefined) fields["Statut"] = data.statut;
      if (data.priorite !== undefined) fields["Priorité"] = data.priorite;
      if (data.dateEcheance !== undefined) fields["Date d'Échéance"] = data.dateEcheance;
      if (data.heuresEstimees !== undefined) fields["Temps Estimé (h)"] = data.heuresEstimees;
      if (data.heuresReelles !== undefined) fields["Temps Passé (h)"] = data.heuresReelles;
      if (data.membreEquipe !== undefined) fields["Membre Équipe"] = data.membreEquipe;

      const record = await airtable.updateRecord<TacheFields>(
        AIRTABLE_TABLES.TACHES,
        id,
        fields
      );
      return mapRecordToTache(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["taches"] });
      queryClient.invalidateQueries({ queryKey: ["tache", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });
}

export function useUpdateTacheStatut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: TaskStatus }) => {
      const fields: Partial<TacheFields> = {
        Statut: statut,
      };

      if (statut === "Terminé") {
        fields["Date de Complétion"] = new Date().toISOString().split("T")[0];
      }

      const record = await airtable.updateRecord<TacheFields>(
        AIRTABLE_TABLES.TACHES,
        id,
        fields
      );
      return mapRecordToTache(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taches"] });
      queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });
}

export function useDeleteTache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await airtable.deleteRecord(AIRTABLE_TABLES.TACHES, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taches"] });
      queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });
}
