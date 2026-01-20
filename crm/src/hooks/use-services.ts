"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import type { CatalogueService } from "@/types";

// Mapper Supabase -> CatalogueService type
function mapToService(record: Record<string, unknown>): CatalogueService {
  return {
    id: record.id as string,
    nom: (record.nom as string) || "",
    description: record.description as string | undefined,
    prixUnitaire: (record.prix_unitaire as number) || 0,
    unite: (record.unite as string) || "forfait",
    categorie: record.categorie as string | undefined,
    actif: (record.actif as boolean) ?? true,
    createdTime: record.created_at as string | undefined,
  };
}

interface UseServicesOptions {
  categorie?: string;
  actifOnly?: boolean;
}

export function useServices(options?: UseServicesOptions) {
  return useQuery({
    queryKey: queryKeys.services.list(options),
    queryFn: async () => {
      let query = supabase
        .from("catalogue_services")
        .select("*")
        .order("categorie", { ascending: true })
        .order("nom", { ascending: true });

      if (options?.categorie) {
        query = query.eq("categorie", options.categorie);
      }

      if (options?.actifOnly !== false) {
        // By default, only get active services
        query = query.eq("actif", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToService);
    },
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.services.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("Service ID required");

      const { data, error } = await supabase
        .from("catalogue_services")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToService(data);
    },
    enabled: !!id,
  });
}

// Get unique categories for filtering/grouping
export function useServiceCategories() {
  return useQuery({
    queryKey: queryKeys.services.categories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalogue_services")
        .select("categorie")
        .eq("actif", true)
        .order("categorie", { ascending: true });

      if (error) throw error;

      // Get unique categories
      const categories = [...new Set(
        (data || [])
          .map(d => d.categorie as string)
          .filter(Boolean)
      )];

      return categories;
    },
  });
}

// ============================================
// MUTATIONS
// ============================================

interface CreateServiceData {
  nom: string;
  description?: string;
  prixUnitaire: number;
  unite?: string;
  categorie?: string;
  actif?: boolean;
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceData) => {
      const insertData = {
        nom: data.nom,
        description: data.description || null,
        prix_unitaire: data.prixUnitaire,
        unite: data.unite || "forfait",
        categorie: data.categorie || null,
        actif: data.actif ?? true,
      };

      const { data: record, error } = await supabase
        .from("catalogue_services")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToService(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.categories() });
    },
  });
}

interface UpdateServiceData {
  id: string;
  nom?: string;
  description?: string;
  prixUnitaire?: number;
  unite?: string;
  categorie?: string;
  actif?: boolean;
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateServiceData) => {
      const updateData: Record<string, unknown> = {};

      if (data.nom !== undefined) updateData.nom = data.nom;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.prixUnitaire !== undefined) updateData.prix_unitaire = data.prixUnitaire;
      if (data.unite !== undefined) updateData.unite = data.unite;
      if (data.categorie !== undefined) updateData.categorie = data.categorie;
      if (data.actif !== undefined) updateData.actif = data.actif;

      const { data: record, error } = await supabase
        .from("catalogue_services")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToService(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.categories() });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("catalogue_services")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.categories() });
    },
  });
}

export function useToggleServiceActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const { data: record, error } = await supabase
        .from("catalogue_services")
        .update({ actif })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToService(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.detail(variables.id) });
    },
  });
}
