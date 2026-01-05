"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { mapToTache, mapTacheToInsert, mapTacheToUpdate } from "@/lib/mappers";
import type { Tache, TaskStatus } from "@/types";

export function useTaches(options?: {
  statut?: TaskStatus;
  projetId?: string;
  membreEquipeId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.taches.list(options),
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
    queryKey: queryKeys.taches.enRetard(userId),
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
    queryKey: queryKeys.taches.mesTaches(membreEquipeId),
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
    queryKey: queryKeys.taches.detail(id || ""),
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
      const insertData = mapTacheToInsert(data);

      const { data: record, error } = await supabase
        .from("taches")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToTache(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taches.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projets.all });
    },
  });
}

export function useUpdateTache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tache> }) => {
      const updateData = mapTacheToUpdate(data);

      const { data: record, error } = await supabase
        .from("taches")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToTache(record);
    },
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.taches.all });

      // Snapshot previous values
      const previousTaches = queryClient.getQueryData<Tache[]>(queryKeys.taches.list());
      const previousTache = queryClient.getQueryData<Tache>(queryKeys.taches.detail(id));

      // Optimistically update the list cache
      if (previousTaches) {
        queryClient.setQueryData<Tache[]>(
          queryKeys.taches.list(),
          previousTaches.map((tache) =>
            tache.id === id ? { ...tache, ...data } : tache
          )
        );
      }

      // Optimistically update the detail cache
      if (previousTache) {
        queryClient.setQueryData<Tache>(queryKeys.taches.detail(id), {
          ...previousTache,
          ...data,
        });
      }

      return { previousTaches, previousTache };
    },
    onError: (_, variables, context) => {
      // Rollback on error
      if (context?.previousTaches) {
        queryClient.setQueryData(queryKeys.taches.list(), context.previousTaches);
      }
      if (context?.previousTache) {
        queryClient.setQueryData(queryKeys.taches.detail(variables.id), context.previousTache);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taches.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.taches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projets.all });
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
    // Optimistic update for status change
    onMutate: async ({ id, statut }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.taches.all });

      // Snapshot previous values
      const previousTaches = queryClient.getQueryData<Tache[]>(queryKeys.taches.list());
      const previousTache = queryClient.getQueryData<Tache>(queryKeys.taches.detail(id));

      // Optimistically update the list cache
      if (previousTaches) {
        queryClient.setQueryData<Tache[]>(
          queryKeys.taches.list(),
          previousTaches.map((tache) =>
            tache.id === id
              ? {
                  ...tache,
                  statut,
                  dateTerminee: statut === "Terminé" ? new Date().toISOString().split("T")[0] : tache.dateTerminee,
                }
              : tache
          )
        );
      }

      // Optimistically update the detail cache
      if (previousTache) {
        queryClient.setQueryData<Tache>(queryKeys.taches.detail(id), {
          ...previousTache,
          statut,
          dateTerminee: statut === "Terminé" ? new Date().toISOString().split("T")[0] : previousTache.dateTerminee,
        });
      }

      return { previousTaches, previousTache };
    },
    onError: (_, variables, context) => {
      // Rollback on error
      if (context?.previousTaches) {
        queryClient.setQueryData(queryKeys.taches.list(), context.previousTaches);
      }
      if (context?.previousTache) {
        queryClient.setQueryData(queryKeys.taches.detail(variables.id), context.previousTache);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taches.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.taches.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projets.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.taches.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projets.all });
    },
  });
}
