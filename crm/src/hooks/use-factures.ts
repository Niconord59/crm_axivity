"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import { mapToFacture, mapFactureToInsert, mapFactureToUpdate } from "@/lib/mappers";
import type { Facture, InvoiceStatus, FactureType } from "@/types";

export function useFactures(options?: {
  statut?: InvoiceStatus;
  clientId?: string;
  projetId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.factures.list(options),
    queryFn: async () => {
      let query = supabase
        .from("factures")
        .select("*")
        .order("date_emission", { ascending: false, nullsFirst: false });

      if (options?.statut) {
        query = query.eq("statut", options.statut);
      }
      if (options?.clientId) {
        query = query.eq("client_id", options.clientId);
      }
      if (options?.projetId) {
        query = query.eq("projet_id", options.projetId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToFacture);
    },
  });
}

export function useFacturesImpayees() {
  return useQuery({
    queryKey: queryKeys.factures.impayees(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factures")
        .select("*")
        .eq("statut", "Envoyé")
        .order("date_echeance", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []).map(mapToFacture);
    },
  });
}

export function useFacturesARelancer() {
  return useQuery({
    queryKey: queryKeys.factures.aRelancer(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factures")
        .select("*")
        .eq("statut", "Envoyé")
        .gt("niveau_relance", 0)
        .order("date_echeance", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []).map(mapToFacture);
    },
  });
}

/**
 * Récupérer les factures liées à un devis (pour calcul du solde)
 */
export function useFacturesByDevis(devisId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.factures.byDevis(devisId),
    queryFn: async () => {
      if (!devisId) return [];
      const { data, error } = await supabase
        .from("factures")
        .select("*")
        .eq("devis_id", devisId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapToFacture);
    },
    enabled: !!devisId,
  });
}

/**
 * Calculer le montant restant à facturer pour un devis
 */
export function calculateSoldeRestant(
  montantTotal: number,
  facturesExistantes: Facture[]
): { montant: number; pourcentage: number } {
  const totalAcomptes = facturesExistantes
    .filter(f => f.typeFacture === "acompte" && f.statut === "Payé")
    .reduce((sum, f) => sum + (f.montantHT || 0), 0);
  const montant = montantTotal - totalAcomptes;
  const pourcentage = montantTotal > 0 ? (montant / montantTotal) * 100 : 100;
  return { montant, pourcentage };
}

/**
 * Récupérer les acomptes payés pour un devis (pour affichage sur facture de solde)
 */
export function getAcomptesPayes(facturesExistantes: Facture[]): Facture[] {
  return facturesExistantes
    .filter(f => f.typeFacture === "acompte" && f.statut === "Payé")
    .sort((a, b) => {
      const dateA = a.dateEmission ? new Date(a.dateEmission).getTime() : 0;
      const dateB = b.dateEmission ? new Date(b.dateEmission).getTime() : 0;
      return dateA - dateB;
    });
}

export function useFacture(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.factures.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("Facture ID required");

      const { data, error } = await supabase
        .from("factures")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToFacture(data);
    },
    enabled: !!id,
  });
}

export function useCreateFacture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Facture>) => {
      const insertData = mapFactureToInsert(data);

      const { data: record, error } = await supabase
        .from("factures")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToFacture(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.factures.all });
    },
  });
}

export function useUpdateFacture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Facture> }) => {
      const updateData = mapFactureToUpdate(data);

      const { data: record, error } = await supabase
        .from("factures")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToFacture(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.factures.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.factures.detail(variables.id) });
    },
  });
}

export function useMarquerFacturePayee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: record, error } = await supabase
        .from("factures")
        .update({
          statut: "Payé",
          date_paiement: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToFacture(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.factures.all });
    },
  });
}

interface RelanceResponse {
  success: boolean;
  message: string;
  niveau_relance: number;
  facture_id: string;
  error?: string;
}

export function useEnvoyerRelance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (factureId: string): Promise<RelanceResponse> => {
      const response = await fetch("/api/factures/relance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ factureId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de la relance");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.factures.all });
    },
  });
}
