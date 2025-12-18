"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Interaction, InteractionType } from "@/types";

// Mapper Supabase -> Interaction type
function mapToInteraction(record: Record<string, unknown>): Interaction {
  return {
    id: record.id as string,
    objet: (record.objet as string) || "",
    type: record.type as InteractionType,
    date: record.date as string | undefined,
    resume: record.resume as string | undefined,
    contact: record.contact_id ? [record.contact_id as string] : undefined,
    client: record.client_id ? [record.client_id as string] : undefined,
    membreEquipe: record.user_id ? [record.user_id as string] : undefined,
    createdTime: record.created_at as string | undefined,
  };
}

export function useInteractions(options?: {
  contactId?: string;
  clientId?: string;
}) {
  return useQuery({
    queryKey: ["interactions", options],
    queryFn: async () => {
      let query = supabase
        .from("interactions")
        .select("*")
        .order("date", { ascending: false, nullsFirst: false });

      if (options?.contactId) {
        query = query.eq("contact_id", options.contactId);
      }
      if (options?.clientId) {
        query = query.eq("client_id", options.clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToInteraction);
    },
  });
}

export function useInteraction(id: string | undefined) {
  return useQuery({
    queryKey: ["interaction", id],
    queryFn: async () => {
      if (!id) throw new Error("Interaction ID required");

      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToInteraction(data);
    },
    enabled: !!id,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Interaction>) => {
      const insertData = {
        objet: data.objet,
        type: data.type,
        date: data.date,
        resume: data.resume,
        contact_id: data.contact?.[0],
        client_id: data.client?.[0],
        user_id: data.membreEquipe?.[0],
      };

      const { data: record, error } = await supabase
        .from("interactions")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToInteraction(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
    },
  });
}

export function useLastInteractionDate(options?: {
  contactId?: string;
  clientId?: string;
}) {
  return useQuery({
    queryKey: ["interactions", "last-date", options],
    queryFn: async () => {
      if (!options?.contactId && !options?.clientId) return null;

      let query = supabase
        .from("interactions")
        .select("date")
        .order("date", { ascending: false })
        .limit(1);

      if (options?.contactId) {
        query = query.eq("contact_id", options.contactId);
      }
      if (options?.clientId) {
        query = query.eq("client_id", options.clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0].date || null;
    },
    enabled: !!(options?.contactId || options?.clientId),
  });
}
