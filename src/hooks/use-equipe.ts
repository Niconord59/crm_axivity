"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MembreEquipe, TeamRole } from "@/types";

interface TacheData {
  id: string;
  heures_estimees: number | null;
  statut: string;
}

// Mapper Supabase -> MembreEquipe type
function mapToMembreEquipe(
  record: Record<string, unknown>,
  taches?: TacheData[]
): MembreEquipe {
  // Récupérer le rôle depuis le profile lié si disponible, sinon utiliser le rôle de equipe
  const profiles = record.profiles as Record<string, unknown> | null;
  const profileRole = profiles?.role as TeamRole | undefined;

  // Calculer les heures depuis les tâches non terminées
  const tachesEnCours = taches?.filter((t) => t.statut !== "Terminé") || [];
  const heuresSemaine = tachesEnCours.reduce(
    (sum, t) => sum + (t.heures_estimees || 0),
    0
  );

  const capaciteHebdo = (record.capacite_hebdo as number) || 35;
  const chargeActuelle =
    capaciteHebdo > 0 ? (heuresSemaine / capaciteHebdo) * 100 : 0;

  return {
    id: record.id as string,
    nom: (record.nom as string) || "",
    email: record.email as string | undefined,
    role: profileRole || (record.role as TeamRole),
    capaciteHebdo: capaciteHebdo,
    heuresSemaine: heuresSemaine,
    chargeActuelle: Math.round(chargeActuelle),
    tachesAssignees: taches?.map((t) => t.id) || [],
    createdTime: record.created_at as string | undefined,
  };
}

export function useEquipe(options?: { role?: TeamRole }) {
  return useQuery({
    queryKey: ["equipe", options],
    queryFn: async () => {
      // 1. Récupérer les membres de l'équipe avec leurs profiles
      let query = supabase
        .from("equipe")
        .select("*, profiles(id, role)")
        .order("nom", { ascending: true });

      if (options?.role) {
        query = query.eq("profiles.role", options.role);
      }

      const { data: equipeData, error: equipeError } = await query;
      if (equipeError) throw equipeError;

      // 2. Récupérer les profile_ids pour chercher les tâches
      const profileIds = (equipeData || [])
        .map((e) => (e.profiles as { id: string } | null)?.id)
        .filter(Boolean) as string[];

      // 3. Récupérer toutes les tâches assignées à ces profiles
      let tachesMap: Record<string, TacheData[]> = {};
      if (profileIds.length > 0) {
        const { data: tachesData, error: tachesError } = await supabase
          .from("taches")
          .select("id, heures_estimees, statut, assignee_id")
          .in("assignee_id", profileIds);

        if (!tachesError && tachesData) {
          // Grouper les tâches par assignee_id
          tachesData.forEach((t) => {
            if (t.assignee_id) {
              if (!tachesMap[t.assignee_id]) {
                tachesMap[t.assignee_id] = [];
              }
              tachesMap[t.assignee_id].push({
                id: t.id,
                heures_estimees: t.heures_estimees,
                statut: t.statut,
              });
            }
          });
        }
      }

      // 4. Mapper avec les tâches
      return (equipeData || []).map((record) => {
        const profileId = (record.profiles as { id: string } | null)?.id;
        const taches = profileId ? tachesMap[profileId] : undefined;
        return mapToMembreEquipe(record, taches);
      });
    },
  });
}

export function useMembreEquipe(id: string | undefined) {
  return useQuery({
    queryKey: ["membre-equipe", id],
    queryFn: async () => {
      if (!id) throw new Error("Membre équipe ID required");

      const { data, error } = await supabase
        .from("equipe")
        .select("*, profiles(role)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToMembreEquipe(data);
    },
    enabled: !!id,
  });
}

export function useChargeEquipe() {
  return useQuery({
    queryKey: ["equipe", "charge"],
    queryFn: async () => {
      // 1. Récupérer les membres de l'équipe avec leurs profiles
      const { data: equipeData, error: equipeError } = await supabase
        .from("equipe")
        .select("*, profiles(id, role)")
        .order("nom", { ascending: true });

      if (equipeError) throw equipeError;

      // 2. Récupérer les profile_ids pour chercher les tâches
      const profileIds = (equipeData || [])
        .map((e) => (e.profiles as { id: string } | null)?.id)
        .filter(Boolean) as string[];

      // 3. Récupérer toutes les tâches assignées à ces profiles
      let tachesMap: Record<string, TacheData[]> = {};
      if (profileIds.length > 0) {
        const { data: tachesData, error: tachesError } = await supabase
          .from("taches")
          .select("id, heures_estimees, statut, assignee_id")
          .in("assignee_id", profileIds);

        if (!tachesError && tachesData) {
          tachesData.forEach((t) => {
            if (t.assignee_id) {
              if (!tachesMap[t.assignee_id]) {
                tachesMap[t.assignee_id] = [];
              }
              tachesMap[t.assignee_id].push({
                id: t.id,
                heures_estimees: t.heures_estimees,
                statut: t.statut,
              });
            }
          });
        }
      }

      // 4. Mapper avec les tâches et trier par charge
      const membres = (equipeData || []).map((record) => {
        const profileId = (record.profiles as { id: string } | null)?.id;
        const taches = profileId ? tachesMap[profileId] : undefined;
        return mapToMembreEquipe(record, taches);
      });

      // Trier par charge décroissante
      return membres.sort(
        (a, b) => (b.chargeActuelle || 0) - (a.chargeActuelle || 0)
      );
    },
  });
}

export function useCreateMembreEquipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<MembreEquipe>) => {
      const insertData = {
        nom: data.nom,
        email: data.email,
        role: data.role,
        capacite_hebdo: data.capaciteHebdo,
      };

      const { data: record, error } = await supabase
        .from("equipe")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToMembreEquipe(record);
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
      const updateData: Record<string, unknown> = {};

      if (data.nom !== undefined) updateData.nom = data.nom;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.capaciteHebdo !== undefined) updateData.capacite_hebdo = data.capaciteHebdo;

      const { data: record, error } = await supabase
        .from("equipe")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToMembreEquipe(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipe"] });
      queryClient.invalidateQueries({ queryKey: ["membre-equipe", variables.id] });
    },
  });
}
