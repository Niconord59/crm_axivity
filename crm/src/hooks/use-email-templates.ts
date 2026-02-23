"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import {
  mapToEmailTemplate,
  mapEmailTemplateToInsert,
  mapEmailTemplateToUpdate,
} from "@/lib/mappers";
import type { EmailTemplate } from "@/types";

export function useEmailTemplates() {
  return useQuery({
    queryKey: queryKeys.emailTemplates.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("nom", { ascending: true });

      if (error) throw error;
      return (data || []).map(mapToEmailTemplate);
    },
  });
}

export function useEmailTemplate(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("Template ID required");

      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToEmailTemplate(data);
    },
    enabled: !!id,
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<EmailTemplate>) => {
      const insertData = mapEmailTemplateToInsert(data);

      const { data: record, error } = await supabase
        .from("email_templates")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToEmailTemplate(record);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.emailTemplates.all,
      });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<EmailTemplate>;
    }) => {
      const updateData = mapEmailTemplateToUpdate(data);

      const { data: record, error } = await supabase
        .from("email_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToEmailTemplate(record);
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.emailTemplates.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.emailTemplates.detail(variables.id),
      });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.emailTemplates.all,
      });
    },
  });
}
