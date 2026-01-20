"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/lib/supabase";

export interface ProfileListItem {
  id: string;
  nom: string;
  prenom: string | null;
  email: string;
  role: UserRole;
}

function mapToProfileListItem(record: Record<string, unknown>): ProfileListItem {
  return {
    id: record.id as string,
    nom: record.nom as string,
    prenom: record.prenom as string | null,
    email: record.email as string,
    role: record.role as UserRole,
  };
}

export function useProfiles(options?: { role?: UserRole }) {
  return useQuery({
    queryKey: ["profiles", options],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, nom, prenom, email, role")
        .order("nom", { ascending: true });

      if (options?.role) {
        query = query.eq("role", options.role);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToProfileListItem);
    },
  });
}

// Hook pour récupérer uniquement les utilisateurs assignables (non-clients)
export function useAssignableUsers() {
  return useQuery({
    queryKey: ["profiles", "assignable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nom, prenom, email, role")
        .neq("role", "client")
        .order("nom", { ascending: true });

      if (error) throw error;
      return (data || []).map(mapToProfileListItem);
    },
  });
}
