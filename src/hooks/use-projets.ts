"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { mapToProjet, mapProjetToInsert, mapProjetToUpdate, type ProjetWithOwner } from "@/lib/mappers";
import type { Projet, ProjectStatus } from "@/types";

export function useProjets(options?: { statut?: ProjectStatus; clientId?: string }) {
  return useQuery({
    queryKey: queryKeys.projets.list(options),
    queryFn: async () => {
      let query = supabase
        .from("projets")
        .select("*")
        .order("date_debut", { ascending: false, nullsFirst: false });

      if (options?.statut) {
        query = query.eq("statut", options.statut);
      }
      if (options?.clientId) {
        query = query.eq("client_id", options.clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToProjet);
    },
  });
}

export function useProjetsActifs(userId?: string) {
  return useQuery({
    queryKey: queryKeys.projets.actifs(userId),
    queryFn: async () => {
      let query = supabase
        .from("projets")
        .select("*")
        .in("statut", ["En cours", "Cadrage"])
        .order("date_fin_prevue", { ascending: true, nullsFirst: false });

      // Filter by owner if provided
      if (userId) {
        query = query.eq("owner_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToProjet);
    },
  });
}

export function useProjet(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projets.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("Projet ID required");

      const { data, error } = await supabase
        .from("projets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToProjet(data);
    },
    enabled: !!id,
  });
}

export function useCreateProjet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Projet> & { ownerId?: string }) => {
      const insertData = mapProjetToInsert(data as Partial<ProjetWithOwner>);

      const { data: record, error } = await supabase
        .from("projets")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToProjet(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projets.all });
    },
  });
}

export function useUpdateProjet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Projet> & { ownerId?: string } }) => {
      const updateData = mapProjetToUpdate(data as Partial<ProjetWithOwner>);

      const { data: record, error } = await supabase
        .from("projets")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToProjet(record);
    },
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.projets.all });

      // Snapshot previous values
      const previousProjets = queryClient.getQueryData<Projet[]>(queryKeys.projets.list());
      const previousProjet = queryClient.getQueryData<Projet>(queryKeys.projets.detail(id));

      // Optimistically update the list cache
      if (previousProjets) {
        queryClient.setQueryData<Projet[]>(
          queryKeys.projets.list(),
          previousProjets.map((projet) =>
            projet.id === id ? { ...projet, ...data } : projet
          )
        );
      }

      // Optimistically update the detail cache
      if (previousProjet) {
        queryClient.setQueryData<Projet>(queryKeys.projets.detail(id), {
          ...previousProjet,
          ...data,
        });
      }

      return { previousProjets, previousProjet };
    },
    onError: (_, variables, context) => {
      // Rollback on error
      if (context?.previousProjets) {
        queryClient.setQueryData(queryKeys.projets.list(), context.previousProjets);
      }
      if (context?.previousProjet) {
        queryClient.setQueryData(queryKeys.projets.detail(variables.id), context.previousProjet);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projets.detail(variables.id) });
    },
  });
}
