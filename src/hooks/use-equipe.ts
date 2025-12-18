"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MembreEquipe, TeamRole } from "@/types";

// Mapper Supabase -> MembreEquipe type
function mapToMembreEquipe(record: Record<string, unknown>): MembreEquipe {
  return {
    id: record.id as string,
    nom: (record.nom as string) || "",
    email: record.email as string | undefined,
    role: record.role as TeamRole,
    capaciteHebdo: record.capacite_hebdo as number | undefined,
    heuresSemaine: record.charge_prevue_semaine as number | undefined,
    chargeActuelle: record.capacite_atteinte as number | undefined,
    createdTime: record.created_at as string | undefined,
  };
}

export function useEquipe(options?: { role?: TeamRole }) {
  return useQuery({
    queryKey: ["equipe", options],
    queryFn: async () => {
      let query = supabase
        .from("equipe")
        .select("*")
        .order("nom", { ascending: true });

      if (options?.role) {
        query = query.eq("role", options.role);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToMembreEquipe);
    },
  });
}

export function useMembreEquipe(id: string | undefined) {
  return useQuery({
    queryKey: ["membre-equipe", id],
    queryFn: async () => {
      if (!id) throw new Error("Membre équipe ID required");

      const { data, error } = await supabase
        .from("equipe")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToMembreEquipe(data);
    },
    enabled: !!id,
  });
}

export function useChargeEquipe() {
  return useQuery({
    queryKey: ["equipe", "charge"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipe")
        .select("*")
        .order("capacite_atteinte", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data || []).map(mapToMembreEquipe);
    },
  });
}

export function useCreateMembreEquipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<MembreEquipe>) => {
      const insertData = {
        nom: data.nom,
        email: data.email,
        role: data.role,
        capacite_hebdo: data.capaciteHebdo,
      };

      const { data: record, error } = await supabase
        .from("equipe")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToMembreEquipe(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipe"] });
    },
  });
}

export function useUpdateMembreEquipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<MembreEquipe>;
    }) => {
      const updateData: Record<string, unknown> = {};

      if (data.nom !== undefined) updateData.nom = data.nom;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.capaciteHebdo !== undefined) updateData.capacite_hebdo = data.capaciteHebdo;

      const { data: record, error } = await supabase
        .from("equipe")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToMembreEquipe(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipe"] });
      queryClient.invalidateQueries({ queryKey: ["membre-equipe", variables.id] });
    },
  });
}
