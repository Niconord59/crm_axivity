"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Opportunite, OpportunityStatus } from "@/types";

// Mapper Supabase -> Opportunite type
function mapToOpportunite(record: Record<string, unknown>): Opportunite {
  const valeurEstimee = record.valeur_estimee as number | undefined;
  const probabilite = record.probabilite as number | undefined;

  return {
    id: record.id as string,
    nom: (record.nom as string) || "",
    statut: record.statut as OpportunityStatus,
    valeurEstimee: valeurEstimee,
    probabilite: probabilite,
    dateClotureEstimee: record.date_cloture_prevue as string | undefined,
    source: record.source as string | undefined,
    notes: record.notes as string | undefined,
    dateCreation: record.created_at as string | undefined,
    valeurPonderee: valeurEstimee && probabilite
      ? valeurEstimee * (probabilite / 100)
      : undefined,
    client: record.client_id ? [record.client_id as string] : undefined,
    contact: record.contact_id ? [record.contact_id as string] : undefined,
    projetCree: record.projet_id ? [record.projet_id as string] : undefined,
  };
}

export function useOpportunites(options?: {
  statut?: OpportunityStatus;
  clientId?: string;
}) {
  return useQuery({
    queryKey: ["opportunites", options],
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
    queryKey: ["opportunites", "par-statut"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunites")
        .select("*")
        .not("statut", "in", '("Gagné","Perdu")')
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
        if (opp.statut && grouped[opp.statut]) {
          grouped[opp.statut].push(opp);
        }
      });

      return grouped;
    },
  });
}

export function useOpportunite(id: string | undefined) {
  return useQuery({
    queryKey: ["opportunite", id],
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
      const insertData = {
        nom: data.nom,
        statut: data.statut || "Qualifié",
        valeur_estimee: data.valeurEstimee,
        probabilite: data.probabilite,
        date_cloture_prevue: data.dateClotureEstimee,
        source: data.source,
        notes: data.notes,
        client_id: data.client?.[0],
        contact_id: data.contact?.[0],
      };

      const { data: record, error } = await supabase
        .from("opportunites")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToOpportunite(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunites"] });
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
      const updateData: Record<string, unknown> = {};

      if (data.nom !== undefined) updateData.nom = data.nom;
      if (data.statut !== undefined) updateData.statut = data.statut;
      if (data.valeurEstimee !== undefined) updateData.valeur_estimee = data.valeurEstimee;
      if (data.probabilite !== undefined) updateData.probabilite = data.probabilite;
      if (data.dateClotureEstimee !== undefined) updateData.date_cloture_prevue = data.dateClotureEstimee;
      if (data.source !== undefined) updateData.source = data.source;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const { data: record, error } = await supabase
        .from("opportunites")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToOpportunite(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["opportunites"] });
      queryClient.invalidateQueries({ queryKey: ["opportunite", variables.id] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunites"] });
    },
  });
}
