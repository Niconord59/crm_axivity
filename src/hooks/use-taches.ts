"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Tache, TaskStatus, TaskPriority } from "@/types";

// Mapper Supabase -> Tache type
function mapToTache(record: Record<string, unknown>): Tache {
  const dateEcheance = record.date_echeance as string | undefined;
  const statut = record.statut as TaskStatus;
  const today = new Date().toISOString().split("T")[0];

  return {
    id: record.id as string,
    nom: (record.titre as string) || "",
    description: record.description as string | undefined,
    statut: statut,
    priorite: record.priorite as TaskPriority,
    dateEcheance: dateEcheance,
    heuresEstimees: record.heures_estimees as number | undefined,
    heuresReelles: record.heures_passees as number | undefined,
    dateCreation: record.created_at as string | undefined,
    dateTerminee: record.date_terminee as string | undefined,
    ordre: record.ordre as number | undefined,
    estEnRetard: dateEcheance && statut !== "Terminé" ? dateEcheance < today : false,
    projet: record.projet_id ? [record.projet_id as string] : undefined,
    membreEquipe: record.assignee_id ? [record.assignee_id as string] : undefined,
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
      let query = supabase
        .from("taches")
        .select("*")
        .order("date_echeance", { ascending: true, nullsFirst: false })
        .order("priorite", { ascending: false });

      if (options?.statut) {
        query = query.eq("statut", options.statut);
      }
      if (options?.projetId) {
        query = query.eq("projet_id", options.projetId);
      }
      if (options?.membreEquipeId) {
        query = query.eq("assignee_id", options.membreEquipeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToTache);
    },
  });
}

export function useTachesEnRetard(userId?: string) {
  return useQuery({
    queryKey: ["taches", "en-retard", userId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      let query = supabase
        .from("taches")
        .select("*")
        .neq("statut", "Terminé")
        .lt("date_echeance", today)
        .order("date_echeance", { ascending: true });

      // Filter by user if provided
      if (userId) {
        query = query.eq("assignee_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToTache);
    },
  });
}

export function useMesTaches(membreEquipeId: string | undefined) {
  return useQuery({
    queryKey: ["taches", "mes-taches", membreEquipeId],
    queryFn: async () => {
      if (!membreEquipeId) return [];

      const { data, error } = await supabase
        .from("taches")
        .select("*")
        .eq("assignee_id", membreEquipeId)
        .neq("statut", "Terminé")
        .order("date_echeance", { ascending: true, nullsFirst: false })
        .order("priorite", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToTache);
    },
    enabled: !!membreEquipeId,
  });
}

export function useTache(id: string | undefined) {
  return useQuery({
    queryKey: ["tache", id],
    queryFn: async () => {
      if (!id) throw new Error("Tache ID required");

      const { data, error } = await supabase
        .from("taches")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToTache(data);
    },
    enabled: !!id,
  });
}

export function useCreateTache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Tache>) => {
      const insertData = {
        titre: data.nom,
        description: data.description,
        statut: data.statut || "À faire",
        priorite: data.priorite || "Moyenne",
        date_echeance: data.dateEcheance,
        heures_estimees: data.heuresEstimees,
        projet_id: data.projet?.[0],
        assignee_id: data.membreEquipe?.[0],
      };

      const { data: record, error } = await supabase
        .from("taches")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToTache(record);
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
      const updateData: Record<string, unknown> = {};

      if (data.nom !== undefined) updateData.titre = data.nom;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.statut !== undefined) updateData.statut = data.statut;
      if (data.priorite !== undefined) updateData.priorite = data.priorite;
      if (data.dateEcheance !== undefined) updateData.date_echeance = data.dateEcheance;
      if (data.heuresEstimees !== undefined) updateData.heures_estimees = data.heuresEstimees;
      if (data.heuresReelles !== undefined) updateData.heures_passees = data.heuresReelles;
      if (data.membreEquipe !== undefined) updateData.assignee_id = data.membreEquipe?.[0];

      const { data: record, error } = await supabase
        .from("taches")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToTache(record);
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
      const updateData: Record<string, unknown> = {
        statut: statut,
      };

      if (statut === "Terminé") {
        updateData.date_terminee = new Date().toISOString().split("T")[0];
      }

      const { data: record, error } = await supabase
        .from("taches")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToTache(record);
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
      const { error } = await supabase
        .from("taches")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taches"] });
      queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });
}
