"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Facture, InvoiceStatus } from "@/types";

// Mapper Supabase -> Facture type
function mapToFacture(record: Record<string, unknown>): Facture {
  const montantHT = record.montant_ht as number | undefined;
  const tauxTVA = (record.taux_tva as number) || 20;

  return {
    id: record.id as string,
    numero: record.numero as string | undefined,
    statut: record.statut as InvoiceStatus,
    montantHT: montantHT,
    montantTTC: montantHT ? montantHT * (1 + tauxTVA / 100) : undefined,
    dateEmission: record.date_emission as string | undefined,
    dateEcheance: record.date_echeance as string | undefined,
    datePaiement: record.date_paiement as string | undefined,
    notes: record.notes as string | undefined,
    niveauRelance: record.niveau_relance as number | undefined,
    projet: record.projet_id ? [record.projet_id as string] : undefined,
    client: record.client_id ? [record.client_id as string] : undefined,
  };
}

export function useFactures(options?: {
  statut?: InvoiceStatus;
  clientId?: string;
  projetId?: string;
}) {
  return useQuery({
    queryKey: ["factures", options],
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
    queryKey: ["factures", "impayees"],
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
    queryKey: ["factures", "a-relancer"],
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

export function useFacture(id: string | undefined) {
  return useQuery({
    queryKey: ["facture", id],
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
      const insertData = {
        numero: data.numero,
        statut: data.statut || "Brouillon",
        montant_ht: data.montantHT,
        date_emission: data.dateEmission,
        date_echeance: data.dateEcheance,
        notes: data.notes,
        projet_id: data.projet?.[0],
        client_id: data.client?.[0],
      };

      const { data: record, error } = await supabase
        .from("factures")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToFacture(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
    },
  });
}

export function useUpdateFacture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Facture> }) => {
      const updateData: Record<string, unknown> = {};

      if (data.numero !== undefined) updateData.numero = data.numero;
      if (data.statut !== undefined) updateData.statut = data.statut;
      if (data.montantHT !== undefined) updateData.montant_ht = data.montantHT;
      if (data.dateEmission !== undefined) updateData.date_emission = data.dateEmission;
      if (data.dateEcheance !== undefined) updateData.date_echeance = data.dateEcheance;
      if (data.datePaiement !== undefined) updateData.date_paiement = data.datePaiement;
      if (data.notes !== undefined) updateData.notes = data.notes;

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
      queryClient.invalidateQueries({ queryKey: ["factures"] });
      queryClient.invalidateQueries({ queryKey: ["facture", variables.id] });
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
      queryClient.invalidateQueries({ queryKey: ["factures"] });
    },
  });
}
