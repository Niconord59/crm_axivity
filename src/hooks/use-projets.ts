"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Projet, ProjectStatus } from "@/types";

// Mapper Supabase -> Projet type
function mapToProjet(record: Record<string, unknown>): Projet & { ownerId?: string } {
  return {
    id: record.id as string,
    idProjet: record.id_projet as number | undefined,
    briefProjet: record.brief as string | undefined,
    nomProjet: record.nom as string | undefined,
    statut: record.statut as ProjectStatus,
    dateDebut: record.date_debut as string | undefined,
    dateFinPrevue: record.date_fin_prevue as string | undefined,
    dateFinReelle: record.date_fin_reelle as string | undefined,
    budget: record.budget_initial as number | undefined,
    notes: record.notes as string | undefined,
    priorite: record.priorite as Projet["priorite"],
    // Calculated fields will come from database views/functions later
    totalHeuresEstimees: record.heures_estimees as number | undefined,
    totalHeuresPassees: record.heures_passees as number | undefined,
    client: record.client_id ? [record.client_id as string] : undefined,
    ownerId: record.owner_id as string | undefined,
  };
}

export function useProjets(options?: { statut?: ProjectStatus; clientId?: string }) {
  return useQuery({
    queryKey: ["projets", options],
    queryFn: async () => {
      let query = supabase
        .from("projets")
        .select("*")
        .order("date_debut", { ascending: false, nullsFirst: false });

      if (options?.statut) {
        query = query.eq("statut", options.statut);
      }
      if (options?.clientId) {
        query = query.eq("client_id", options.clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToProjet);
    },
  });
}

export function useProjetsActifs(userId?: string) {
  return useQuery({
    queryKey: ["projets", "actifs", userId],
    queryFn: async () => {
      let query = supabase
        .from("projets")
        .select("*")
        .in("statut", ["En cours", "Cadrage"])
        .order("date_fin_prevue", { ascending: true, nullsFirst: false });

      // Filter by owner if provided
      if (userId) {
        query = query.eq("owner_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToProjet);
    },
  });
}

export function useProjet(id: string | undefined) {
  return useQuery({
    queryKey: ["projet", id],
    queryFn: async () => {
      if (!id) throw new Error("Projet ID required");

      const { data, error } = await supabase
        .from("projets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToProjet(data);
    },
    enabled: !!id,
  });
}

export function useCreateProjet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Projet> & { ownerId?: string }) => {
      const insertData: Record<string, unknown> = {
        brief: data.briefProjet,
        nom: data.nomProjet || data.briefProjet,
        statut: data.statut || "Cadrage",
        date_debut: data.dateDebut,
        date_fin_prevue: data.dateFinPrevue,
        budget_initial: data.budget,
        notes: data.notes,
        client_id: data.client?.[0],
      };

      // Ajouter owner_id si fourni
      if (data.ownerId) {
        insertData.owner_id = data.ownerId;
      }

      const { data: record, error } = await supabase
        .from("projets")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToProjet(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projets"] });
    },
  });
}

export function useUpdateProjet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Projet> & { ownerId?: string } }) => {
      const updateData: Record<string, unknown> = {};

      if (data.briefProjet !== undefined) updateData.brief = data.briefProjet;
      if (data.nomProjet !== undefined) updateData.nom = data.nomProjet;
      if (data.statut !== undefined) updateData.statut = data.statut;
      if (data.dateDebut !== undefined) updateData.date_debut = data.dateDebut;
      if (data.dateFinPrevue !== undefined) updateData.date_fin_prevue = data.dateFinPrevue;
      if (data.dateFinReelle !== undefined) updateData.date_fin_reelle = data.dateFinReelle;
      if (data.budget !== undefined) updateData.budget_initial = data.budget;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.priorite !== undefined) updateData.priorite = data.priorite;
      if (data.ownerId !== undefined) updateData.owner_id = data.ownerId || null;

      const { data: record, error } = await supabase
        .from("projets")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToProjet(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projets"] });
      queryClient.invalidateQueries({ queryKey: ["projet", variables.id] });
    },
  });
}
