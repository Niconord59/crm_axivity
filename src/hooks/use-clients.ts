"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { mapToClient, mapClientToInsert, mapClientToUpdate } from "@/lib/mappers";
import type { Client } from "@/types";

export function useClients(options?: { statut?: string; secteur?: string }) {
  return useQuery({
    queryKey: queryKeys.clients.list(options),
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("nom", { ascending: true });

      if (options?.statut) {
        query = query.eq("statut", options.statut);
      }
      if (options?.secteur) {
        query = query.eq("secteur", options.secteur);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToClient);
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("Client ID required");

      // Fetch client with related record counts
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          contacts:contacts(id),
          projets:projets(id),
          opportunites:opportunites(id),
          factures:factures(id)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Map client and add relationship arrays
      const client = mapToClient(data);
      return {
        ...client,
        contacts: data.contacts?.map((c: { id: string }) => c.id) || [],
        projets: data.projets?.map((p: { id: string }) => p.id) || [],
        opportunites: data.opportunites?.map((o: { id: string }) => o.id) || [],
        factures: data.factures?.map((f: { id: string }) => f.id) || [],
      };
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const insertData = mapClientToInsert(data);

      const { data: record, error } = await supabase
        .from("clients")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToClient(record);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const updateData = mapClientToUpdate(data);

      const { data: record, error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToClient(record);
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(variables.id) });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: queryKeys.clients.all });
    },
  });
}
