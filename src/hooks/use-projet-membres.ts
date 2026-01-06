"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import type { ProjetMembre } from "@/types";

// =============================================================================
// MAPPER: DB → TypeScript
// =============================================================================

interface DbProjetMembre {
  id: string;
  projet_id: string;
  profile_id: string;
  assigned_by: string | null;
  assigned_at: string;
  profiles?: {
    id: string;
    nom: string | null;
    prenom: string | null;
    email: string | null;
  } | {
    id: string;
    nom: string | null;
    prenom: string | null;
    email: string | null;
  }[];
}

function mapToProjetMembre(record: DbProjetMembre): ProjetMembre {
  // Supabase peut retourner profiles comme objet ou tableau selon le type de requête
  const profile = Array.isArray(record.profiles)
    ? record.profiles[0]
    : record.profiles;

  // Combine prenom + nom for display
  const fullName = profile
    ? [profile.prenom, profile.nom].filter(Boolean).join(" ") || null
    : null;

  return {
    id: record.id,
    projetId: record.projet_id,
    profileId: record.profile_id,
    assignedBy: record.assigned_by ?? undefined,
    assignedAt: record.assigned_at,
    profileNom: fullName ?? undefined,
    profileEmail: profile?.email ?? undefined,
  };
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Get all members assigned to a project
 */
export function useProjetMembres(projetId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projetMembres.list(projetId || ""),
    queryFn: async () => {
      if (!projetId) return [];

      const { data, error } = await supabase
        .from("projet_membres")
        .select(`
          *,
          profiles:profile_id (
            id,
            nom,
            prenom,
            email
          )
        `)
        .eq("projet_id", projetId)
        .order("assigned_at", { ascending: true });

      // Gracefully handle missing table (migration not run yet)
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        console.warn("Table projet_membres does not exist. Run migration 20_projet_membres_notifications.sql");
        return [];
      }
      if (error) throw error;
      return (data || []).map(mapToProjetMembre);
    },
    enabled: !!projetId,
  });
}

/**
 * Get all member IDs for multiple projects (for list display)
 */
export function useProjetsMembres(projetIds: string[]) {
  return useQuery({
    queryKey: [...queryKeys.projetMembres.all, "batch", projetIds],
    queryFn: async () => {
      if (!projetIds.length) return {};

      const { data, error } = await supabase
        .from("projet_membres")
        .select(`
          id,
          projet_id,
          profile_id,
          assigned_by,
          assigned_at,
          profiles:profile_id (
            id,
            nom,
            prenom,
            email
          )
        `)
        .in("projet_id", projetIds);

      // Gracefully handle missing table (migration not run yet)
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        console.warn("Table projet_membres does not exist. Run migration 20_projet_membres_notifications.sql");
        return {};
      }
      if (error) throw error;

      // Group by projet_id
      const grouped: Record<string, ProjetMembre[]> = {};
      (data || []).forEach((record) => {
        const projetId = record.projet_id;
        if (!grouped[projetId]) {
          grouped[projetId] = [];
        }
        grouped[projetId].push(mapToProjetMembre(record as DbProjetMembre));
      });

      return grouped;
    },
    enabled: projetIds.length > 0,
  });
}

/**
 * Get count of projects without any assigned members
 */
export function useProjetsNonAssignes() {
  return useQuery({
    queryKey: queryKeys.projetMembres.nonAssignes(),
    queryFn: async () => {
      // Get all active projects
      const { data: projets, error: projetsError } = await supabase
        .from("projets")
        .select("id")
        .in("statut", ["En cours", "En attente"]);

      if (projetsError) throw projetsError;

      if (!projets || projets.length === 0) {
        return { count: 0, projetIds: [] };
      }

      // Get all assigned project IDs
      const { data: assignments, error: assignmentsError } = await supabase
        .from("projet_membres")
        .select("projet_id");

      // Gracefully handle missing table (migration not run yet)
      if (assignmentsError?.code === "42P01" || assignmentsError?.message?.includes("does not exist")) {
        console.warn("Table projet_membres does not exist. Run migration 20_projet_membres_notifications.sql");
        // All projects are "unassigned" if table doesn't exist
        return {
          count: projets.length,
          projetIds: projets.map((p) => p.id),
        };
      }
      if (assignmentsError) throw assignmentsError;

      const assignedProjetIds = new Set(
        (assignments || []).map((a) => a.projet_id)
      );

      // Filter projects without assignments
      const unassignedProjets = projets.filter(
        (p) => !assignedProjetIds.has(p.id)
      );

      return {
        count: unassignedProjets.length,
        projetIds: unassignedProjets.map((p) => p.id),
      };
    },
  });
}

/**
 * Add a member to a project (admin only)
 */
export function useAddProjetMembre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projetId,
      profileId,
      assignedBy,
    }: {
      projetId: string;
      profileId: string;
      assignedBy: string;
    }) => {
      const { data, error } = await supabase
        .from("projet_membres")
        .insert({
          projet_id: projetId,
          profile_id: profileId,
          assigned_by: assignedBy,
        })
        .select(`
          *,
          profiles:profile_id (
            id,
            nom,
            prenom,
            email
          )
        `)
        .single();

      if (error) throw error;
      return mapToProjetMembre(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projetMembres.list(variables.projetId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projetMembres.nonAssignes(),
      });
    },
  });
}

/**
 * Remove a member from a project (admin only)
 */
export function useRemoveProjetMembre() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projetId,
      profileId,
    }: {
      projetId: string;
      profileId: string;
    }) => {
      const { error } = await supabase
        .from("projet_membres")
        .delete()
        .eq("projet_id", projetId)
        .eq("profile_id", profileId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projetMembres.list(variables.projetId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projetMembres.nonAssignes(),
      });
    },
  });
}

/**
 * Set all members for a project (replace existing)
 */
export function useSetProjetMembres() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projetId,
      profileIds,
      assignedBy,
    }: {
      projetId: string;
      profileIds: string[];
      assignedBy: string;
    }) => {
      // Delete all existing members
      const { error: deleteError } = await supabase
        .from("projet_membres")
        .delete()
        .eq("projet_id", projetId);

      if (deleteError) throw deleteError;

      // Insert new members if any
      if (profileIds.length > 0) {
        const { error: insertError } = await supabase
          .from("projet_membres")
          .insert(
            profileIds.map((profileId) => ({
              projet_id: projetId,
              profile_id: profileId,
              assigned_by: assignedBy,
            }))
          );

        if (insertError) throw insertError;
      }

      return { projetId, profileIds };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projetMembres.list(variables.projetId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projetMembres.nonAssignes(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projetMembres.all,
      });
    },
  });
}
