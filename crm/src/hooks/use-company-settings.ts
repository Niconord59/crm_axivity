"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CompanySettings {
  id: string;
  // Company identity
  nom: string;
  forme_juridique: string | null;
  capital: string | null;
  // Legal identifiers
  siret: string | null;
  rcs: string | null;
  tva_intracommunautaire: string | null;
  // Address
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  pays: string | null;
  // Contact
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  // Branding
  logo_url: string | null;
  header_devis_url: string | null;
  couleur_principale: string | null;
  // Quote settings
  conditions_paiement_defaut: string | null;
  validite_devis_jours: number | null;
  taux_tva_defaut: number | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export type CompanySettingsUpdate = Partial<Omit<CompanySettings, "id" | "created_at" | "updated_at">>;

/**
 * Hook to fetch company settings
 */
export function useCompanySettings() {
  return useQuery({
    queryKey: ["company-settings"],
    queryFn: async (): Promise<CompanySettings | null> => {
      const { data, error } = await supabase
        .from("parametres_entreprise")
        .select("*")
        .limit(1)
        .single();

      if (error) {
        // If no row exists, return null
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data as CompanySettings;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to update company settings
 */
export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: CompanySettingsUpdate) => {
      // First, check if a row exists
      const { data: existing } = await supabase
        .from("parametres_entreprise")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        // Update existing row
        const { data, error } = await supabase
          .from("parametres_entreprise")
          .update(settings)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as CompanySettings;
      } else {
        // Insert new row
        const { data, error } = await supabase
          .from("parametres_entreprise")
          .insert(settings)
          .select()
          .single();

        if (error) throw error;
        return data as CompanySettings;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
    },
  });
}

/**
 * Hook to upload company asset (logo or header)
 */
export function useUploadCompanyAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: "logo" | "header_devis";
    }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("company-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("company-assets")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update company settings with new URL
      const fieldName = type === "logo" ? "logo_url" : "header_devis_url";

      const { data: existing } = await supabase
        .from("parametres_entreprise")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        const { error: updateError } = await supabase
          .from("parametres_entreprise")
          .update({ [fieldName]: publicUrl })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("parametres_entreprise")
          .insert({ [fieldName]: publicUrl });

        if (insertError) throw insertError;
      }

      return { url: publicUrl, type };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
    },
  });
}

/**
 * Hook to delete company asset
 */
export function useDeleteCompanyAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: "logo" | "header_devis") => {
      const fieldName = type === "logo" ? "logo_url" : "header_devis_url";

      // Get current URL to extract file name
      const { data: settings } = await supabase
        .from("parametres_entreprise")
        .select("logo_url, header_devis_url")
        .limit(1)
        .single();

      const currentUrl = type === "logo" ? settings?.logo_url : settings?.header_devis_url;

      if (currentUrl) {
        // Extract file name from URL
        const fileName = currentUrl.split("/").pop();

        if (fileName) {
          // Delete file from storage
          await supabase.storage.from("company-assets").remove([fileName]);
        }
      }

      // Update settings to remove URL
      const { data: existing } = await supabase
        .from("parametres_entreprise")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("parametres_entreprise")
          .update({ [fieldName]: null })
          .eq("id", existing.id);

        if (error) throw error;
      }

      return { type };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
    },
  });
}
