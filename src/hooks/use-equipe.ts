"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { MembreEquipe, TeamRole } from "@/types";

interface EquipeFields {
  "Nom du Membre"?: string;
  "Email"?: string;
  "Rôle"?: string;
  "Actif"?: boolean;
  "Taux Horaire"?: number;
  "Capacité Hebdo (h)"?: number;
  "Avatar"?: { url: string; filename: string }[];
  "Téléphone"?: string;
  "Charge Prévue (Semaine)"?: number;
  "% Capacité Atteinte"?: number;
  "Tâches Assignées"?: string[];
  "Projets"?: string[];
  "Accomplissements"?: string[];
}

function mapRecordToMembreEquipe(
  record: { id: string; fields: EquipeFields }
): MembreEquipe {
  return {
    id: record.id,
    nom: record.fields["Nom du Membre"] || "",
    email: record.fields["Email"],
    role: record.fields["Rôle"] as TeamRole,
    actif: record.fields["Actif"],
    tauxHoraire: record.fields["Taux Horaire"],
    capaciteHebdo: record.fields["Capacité Hebdo (h)"],
    avatar: record.fields["Avatar"],
    telephone: record.fields["Téléphone"],
    heuresSemaine: record.fields["Charge Prévue (Semaine)"],
    chargeActuelle: record.fields["% Capacité Atteinte"],
    tachesAssignees: record.fields["Tâches Assignées"],
    projetsParticipant: record.fields["Projets"],
    accomplissements: record.fields["Accomplissements"],
  };
}

export function useEquipe(options?: { actifOnly?: boolean; role?: TeamRole }) {
  return useQuery({
    queryKey: ["equipe", options],
    queryFn: async () => {
      let filterByFormula: string | undefined;
      const filters: string[] = [];

      if (options?.actifOnly !== false) {
        filters.push("{Actif} = TRUE()");
      }
      if (options?.role) {
        filters.push(`{Rôle} = '${options.role}'`);
      }

      if (filters.length > 0) {
        filterByFormula =
          filters.length === 1 ? filters[0] : `AND(${filters.join(", ")})`;
      }

      const records = await airtable.getRecords<EquipeFields>(
        AIRTABLE_TABLES.EQUIPE,
        {
          filterByFormula,
          sort: [{ field: "Nom du Membre", direction: "asc" }],
        }
      );

      return records.map(mapRecordToMembreEquipe);
    },
  });
}

export function useMembreEquipe(id: string | undefined) {
  return useQuery({
    queryKey: ["membre-equipe", id],
    queryFn: async () => {
      if (!id) throw new Error("Membre équipe ID required");
      const record = await airtable.getRecord<EquipeFields>(
        AIRTABLE_TABLES.EQUIPE,
        id
      );
      return mapRecordToMembreEquipe(record);
    },
    enabled: !!id,
  });
}

export function useChargeEquipe() {
  return useQuery({
    queryKey: ["equipe", "charge"],
    queryFn: async () => {
      const records = await airtable.getRecords<EquipeFields>(
        AIRTABLE_TABLES.EQUIPE,
        {
          filterByFormula: "{Actif} = TRUE()",
          sort: [{ field: "% Capacité Atteinte", direction: "desc" }],
        }
      );

      return records.map(mapRecordToMembreEquipe);
    },
  });
}

export function useCreateMembreEquipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<MembreEquipe>) => {
      const fields: Partial<EquipeFields> = {
        "Nom du Membre": data.nom,
        "Email": data.email,
        "Rôle": data.role,
        "Actif": data.actif ?? true,
        "Taux Horaire": data.tauxHoraire,
        "Capacité Hebdo (h)": data.capaciteHebdo,
        "Téléphone": data.telephone,
      };

      const record = await airtable.createRecord<EquipeFields>(
        AIRTABLE_TABLES.EQUIPE,
        fields
      );
      return mapRecordToMembreEquipe(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipe"] });
    },
  });
}

export function useUpdateMembreEquipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<MembreEquipe>;
    }) => {
      const fields: Partial<EquipeFields> = {};

      if (data.nom !== undefined) fields["Nom du Membre"] = data.nom;
      if (data.email !== undefined) fields["Email"] = data.email;
      if (data.role !== undefined) fields["Rôle"] = data.role;
      if (data.actif !== undefined) fields["Actif"] = data.actif;
      if (data.tauxHoraire !== undefined) fields["Taux Horaire"] = data.tauxHoraire;
      if (data.capaciteHebdo !== undefined) fields["Capacité Hebdo (h)"] = data.capaciteHebdo;
      if (data.telephone !== undefined) fields["Téléphone"] = data.telephone;

      const record = await airtable.updateRecord<EquipeFields>(
        AIRTABLE_TABLES.EQUIPE,
        id,
        fields
      );
      return mapRecordToMembreEquipe(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipe"] });
      queryClient.invalidateQueries({ queryKey: ["membre-equipe", variables.id] });
    },
  });
}
