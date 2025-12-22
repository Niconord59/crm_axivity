"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
    queryKey: ["services", options],
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
    queryKey: ["service", id],
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
    queryKey: ["service-categories"],
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
