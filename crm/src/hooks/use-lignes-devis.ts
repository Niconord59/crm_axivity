"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import type { LigneDevis } from "@/types";

// Mapper Supabase -> LigneDevis type
function mapToLigneDevis(record: Record<string, unknown>): LigneDevis {
  return {
    id: record.id as string,
    opportuniteId: record.opportunite_id as string,
    serviceId: record.service_id as string | undefined,
    description: record.description as string | undefined,
    quantite: (record.quantite as number) || 1,
    prixUnitaire: (record.prix_unitaire as number) || 0,
    remisePourcent: (record.remise_pourcent as number) || 0,
    montantHT: (record.montant_ht as number) || 0,
    // Denormalized from join
    serviceNom: record.service_nom as string | undefined,
    serviceCategorie: record.service_categorie as string | undefined,
    createdTime: record.created_at as string | undefined,
  };
}

export function useLignesDevis(opportuniteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.lignesDevis.list(opportuniteId || ""),
    queryFn: async () => {
      if (!opportuniteId) throw new Error("Opportunite ID required");

      // Join with catalogue_services to get service name and category
      const { data, error } = await supabase
        .from("lignes_devis")
        .select(`
          *,
          catalogue_services (
            nom,
            categorie
          )
        `)
        .eq("opportunite_id", opportuniteId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Map and denormalize service info
      return (data || []).map((record) => {
        const service = record.catalogue_services as { nom?: string; categorie?: string } | null;
        return mapToLigneDevis({
          ...record,
          service_nom: service?.nom,
          service_categorie: service?.categorie,
        });
      });
    },
    enabled: !!opportuniteId,
  });
}

interface CreateLigneDevisData {
  opportuniteId: string;
  serviceId?: string;
  description?: string;
  quantite: number;
  prixUnitaire: number;
  remisePourcent?: number;
}

export function useCreateLigneDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLigneDevisData) => {
      const insertData = {
        opportunite_id: data.opportuniteId,
        service_id: data.serviceId || null,
        description: data.description,
        quantite: data.quantite,
        prix_unitaire: data.prixUnitaire,
        remise_pourcent: data.remisePourcent || 0,
      };

      const { data: record, error } = await supabase
        .from("lignes_devis")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToLigneDevis(record);
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.lignesDevis.list(variables.opportuniteId)
      });
    },
  });
}

interface UpdateLigneDevisData {
  id: string;
  opportuniteId: string;
  serviceId?: string;
  description?: string;
  quantite?: number;
  prixUnitaire?: number;
  remisePourcent?: number;
}

export function useUpdateLigneDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateLigneDevisData) => {
      const updateData: Record<string, unknown> = {};

      if (data.serviceId !== undefined) updateData.service_id = data.serviceId || null;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.quantite !== undefined) updateData.quantite = data.quantite;
      if (data.prixUnitaire !== undefined) updateData.prix_unitaire = data.prixUnitaire;
      if (data.remisePourcent !== undefined) updateData.remise_pourcent = data.remisePourcent;

      const { data: record, error } = await supabase
        .from("lignes_devis")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToLigneDevis(record);
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.lignesDevis.list(variables.opportuniteId)
      });
    },
  });
}

export function useDeleteLigneDevis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, opportuniteId }: { id: string; opportuniteId: string }) => {
      const { error } = await supabase
        .from("lignes_devis")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, opportuniteId };
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.lignesDevis.list(variables.opportuniteId)
      });
    },
  });
}

// Calculate totals from lines
export function calculateQuoteTotals(lignes: LigneDevis[]) {
  const TVA_RATE = 0.20;

  const totalHT = lignes.reduce((sum, ligne) => sum + (ligne.montantHT || 0), 0);
  const tva = totalHT * TVA_RATE;
  const totalTTC = totalHT + tva;

  return {
    totalHT,
    tva,
    totalTTC,
  };
}
