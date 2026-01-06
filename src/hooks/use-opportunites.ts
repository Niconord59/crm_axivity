"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { mapToOpportunite, mapOpportuniteToInsert, mapOpportuniteToUpdate } from "@/lib/mappers";
import type { Opportunite, OpportunityStatus } from "@/types";

export function useOpportunites(options?: {
  statut?: OpportunityStatus;
  clientId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.opportunites.list(options),
    queryFn: async () => {
      let query = supabase
        .from("opportunites")
        .select("*")
        .order("date_cloture_prevue", { ascending: true, nullsFirst: false });

      if (options?.statut) {
        query = query.eq("statut", options.statut);
      }
      if (options?.clientId) {
        query = query.eq("client_id", options.clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToOpportunite);
    },
  });
}

export function useOpportunitesParStatut() {
  return useQuery({
    queryKey: queryKeys.opportunites.byStatut(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunites")
        .select("*")
        .order("date_cloture_prevue", { ascending: true, nullsFirst: false });

      if (error) throw error;

      const opportunites = (data || []).map(mapToOpportunite);

      // Group by status for Kanban
      const grouped: Record<OpportunityStatus, Opportunite[]> = {
        Qualifié: [],
        Proposition: [],
        Négociation: [],
        Gagné: [],
        Perdu: [],
      };

      opportunites.forEach((opp) => {
        const statut = opp.statut as OpportunityStatus | undefined;
        if (statut && statut in grouped) {
          grouped[statut].push(opp);
        }
      });

      return grouped;
    },
  });
}

export function useOpportunite(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.opportunites.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("Opportunite ID required");

      const { data, error } = await supabase
        .from("opportunites")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToOpportunite(data);
    },
    enabled: !!id,
  });
}

export function useCreateOpportunite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Opportunite>) => {
      const insertData = mapOpportuniteToInsert(data);

      const { data: record, error } = await supabase
        .from("opportunites")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToOpportunite(record);
    },
    onSuccess: async () => {
      // Force refetch immédiat pour que les nouvelles données s'affichent
      await queryClient.refetchQueries({ queryKey: queryKeys.opportunites.all });
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
      const updateData = mapOpportuniteToUpdate(data);

      const { data: record, error } = await supabase
        .from("opportunites")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToOpportunite(record);
    },
    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.opportunites.all });

      // Snapshot previous value
      const previousOpportunites = queryClient.getQueryData<Record<OpportunityStatus, Opportunite[]>>(
        queryKeys.opportunites.byStatut()
      );

      // Optimistically update the cache
      if (previousOpportunites) {
        const updated = { ...previousOpportunites };
        for (const status of Object.keys(updated) as OpportunityStatus[]) {
          updated[status] = updated[status].map((opp) =>
            opp.id === id ? { ...opp, ...data } : opp
          );
        }
        queryClient.setQueryData(queryKeys.opportunites.byStatut(), updated);
      }

      return { previousOpportunites };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousOpportunites) {
        queryClient.setQueryData(queryKeys.opportunites.byStatut(), context.previousOpportunites);
      }
    },
    onSettled: async (_, __, variables) => {
      // Force refetch pour synchroniser avec la BDD
      await queryClient.refetchQueries({ queryKey: queryKeys.opportunites.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunites.detail(variables.id) });
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
      const { data: record, error } = await supabase
        .from("opportunites")
        .update({ statut })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToOpportunite(record);
    },
    // Optimistic update for Kanban drag & drop
    onMutate: async ({ id, statut }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.opportunites.all });

      // Snapshot previous value
      const previousOpportunites = queryClient.getQueryData<Record<OpportunityStatus, Opportunite[]>>(
        queryKeys.opportunites.byStatut()
      );

      // Optimistically move the opportunity to the new status
      if (previousOpportunites) {
        const updated = { ...previousOpportunites };
        let movedOpp: Opportunite | undefined;

        // Find and remove from current status
        for (const status of Object.keys(updated) as OpportunityStatus[]) {
          const index = updated[status].findIndex((opp) => opp.id === id);
          if (index !== -1) {
            movedOpp = { ...updated[status][index], statut };
            updated[status] = updated[status].filter((opp) => opp.id !== id);
            break;
          }
        }

        // Add to new status
        if (movedOpp && statut in updated) {
          updated[statut] = [...updated[statut], movedOpp];
        }

        queryClient.setQueryData(queryKeys.opportunites.byStatut(), updated);
      }

      return { previousOpportunites };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousOpportunites) {
        queryClient.setQueryData(queryKeys.opportunites.byStatut(), context.previousOpportunites);
      }
    },
    onSettled: async () => {
      // Force refetch pour synchroniser avec la BDD après drag & drop
      await queryClient.refetchQueries({ queryKey: queryKeys.opportunites.all });
    },
  });
}
