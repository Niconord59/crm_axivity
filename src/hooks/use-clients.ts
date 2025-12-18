"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Client } from "@/types";

// Mapper Supabase -> Client type
function mapToClient(record: Record<string, unknown>): Client {
  return {
    id: record.id as string,
    nom: (record.nom as string) || "",
    secteurActivite: record.secteur as string | undefined,
    statut: record.statut as Client["statut"],
    siteWeb: record.site_web as string | undefined,
    telephone: record.telephone as string | undefined,
    notes: record.notes as string | undefined,
    dateCreation: record.created_at as string | undefined,
    // Billing / Address fields
    siret: record.siret as string | undefined,
    adresse: record.adresse as string | undefined,
    codePostal: record.code_postal as string | undefined,
    ville: record.ville as string | undefined,
    pays: record.pays as string | undefined,
    // Calculated fields
    santeClient: record.sante_client as string | undefined,
  };
}

export function useClients(options?: { statut?: string; secteur?: string }) {
  return useQuery({
    queryKey: ["clients", options],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("nom", { ascending: true });

      if (options?.statut) {
        query = query.eq("statut", options.statut);
      }
      if (options?.secteur) {
        query = query.eq("secteur", options.secteur);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapToClient);
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) throw new Error("Client ID required");

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToClient(data);
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const insertData = {
        nom: data.nom,
        secteur: data.secteurActivite,
        statut: data.statut || "Prospect",
        site_web: data.siteWeb,
        telephone: data.telephone,
        notes: data.notes,
        siret: data.siret,
        adresse: data.adresse,
        code_postal: data.codePostal,
        ville: data.ville,
        pays: data.pays || "France",
      };

      const { data: record, error } = await supabase
        .from("clients")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return mapToClient(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const updateData: Record<string, unknown> = {};

      if (data.nom !== undefined) updateData.nom = data.nom;
      if (data.secteurActivite !== undefined) updateData.secteur = data.secteurActivite;
      if (data.statut !== undefined) updateData.statut = data.statut;
      if (data.siteWeb !== undefined) updateData.site_web = data.siteWeb;
      if (data.telephone !== undefined) updateData.telephone = data.telephone;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.siret !== undefined) updateData.siret = data.siret;
      if (data.adresse !== undefined) updateData.adresse = data.adresse;
      if (data.codePostal !== undefined) updateData.code_postal = data.codePostal;
      if (data.ville !== undefined) updateData.ville = data.ville;
      if (data.pays !== undefined) updateData.pays = data.pays;

      const { data: record, error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToClient(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", variables.id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
