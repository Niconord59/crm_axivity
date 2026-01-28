"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import type { OpportuniteContact, ContactRole, Contact, Opportunite } from "@/types";
import {
  mapToOpportuniteContact,
  mapOpportuniteContactToInsert,
  mapOpportuniteContactToUpdate,
} from "@/lib/mappers/opportunite-contact.mapper";

// Extended type with loaded relations for display
export interface OpportuniteContactWithDetails extends OpportuniteContact {
  contact?: Contact & { clientNom?: string };
  opportunite?: Opportunite & { clientNom?: string };
}

// Mapper for contact data from join
function mapContactFromJoin(record: Record<string, unknown>): Contact {
  return {
    id: record.id as string,
    nom: (record.nom as string) || "",
    prenom: record.prenom as string | undefined,
    email: record.email as string | undefined,
    telephone: record.telephone as string | undefined,
    poste: record.poste as string | undefined,
    estPrincipal: record.est_principal as boolean | undefined,
    createdTime: record.created_at as string | undefined,
  };
}

// Mapper for opportunite data from join
function mapOpportuniteFromJoin(record: Record<string, unknown>): Opportunite {
  return {
    id: record.id as string,
    nom: (record.nom as string) || "",
    statut: record.statut as Opportunite["statut"],
    valeurEstimee: record.valeur_estimee as number | undefined,
    probabilite: record.probabilite as number | undefined,
    dateClotureEstimee: record.date_cloture_estimee as string | undefined,
    createdTime: record.created_at as string | undefined,
  };
}

/**
 * Hook to fetch all contacts linked to an opportunity (N:N relation)
 *
 * @param opportuniteId - The opportunity ID
 * @returns List of OpportuniteContact with contact details
 */
export function useOpportuniteContacts(opportuniteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.opportuniteContacts.byOpportunite(opportuniteId || ""),
    queryFn: async (): Promise<OpportuniteContactWithDetails[]> => {
      if (!opportuniteId) throw new Error("Opportunite ID required");

      // Fetch pivot records with contact details via join
      const { data, error } = await supabase
        .from("opportunite_contacts")
        .select(`
          *,
          contacts (
            id,
            nom,
            prenom,
            email,
            telephone,
            poste,
            est_principal,
            client_id,
            created_at
          )
        `)
        .eq("opportunite_id", opportuniteId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get unique client IDs to fetch client names
      const clientIds = [
        ...new Set(
          (data || [])
            .map((r) => {
              const contact = r.contacts as { client_id?: string } | null;
              return contact?.client_id;
            })
            .filter(Boolean)
        ),
      ];

      // Fetch client names if needed
      let clientMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from("clients")
          .select("id, nom")
          .in("id", clientIds);

        clientMap = new Map(
          (clients || []).map((c) => [c.id, c.nom || ""])
        );
      }

      // Map and enrich with contact and client data
      return (data || []).map((record) => {
        const baseRecord = mapToOpportuniteContact(record);
        const contactData = record.contacts as Record<string, unknown> | null;
        const contact = contactData ? mapContactFromJoin(contactData) : undefined;
        const clientId = (contactData?.client_id as string) || undefined;

        return {
          ...baseRecord,
          contact: contact
            ? {
                ...contact,
                clientNom: clientId ? clientMap.get(clientId) : undefined,
              }
            : undefined,
        };
      });
    },
    enabled: !!opportuniteId,
  });
}

/**
 * Hook to fetch all opportunities linked to a contact (N:N relation)
 *
 * @param contactId - The contact ID
 * @returns List of OpportuniteContact with opportunity details
 */
export function useContactOpportunites(contactId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.opportuniteContacts.byContact(contactId || ""),
    queryFn: async (): Promise<OpportuniteContactWithDetails[]> => {
      if (!contactId) throw new Error("Contact ID required");

      // Fetch pivot records with opportunity details via join
      const { data, error } = await supabase
        .from("opportunite_contacts")
        .select(`
          *,
          opportunites (
            id,
            nom,
            statut,
            valeur_estimee,
            probabilite,
            date_cloture_estimee,
            client_id,
            created_at
          )
        `)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique client IDs to fetch client names
      const clientIds = [
        ...new Set(
          (data || [])
            .map((r) => {
              const opp = r.opportunites as { client_id?: string } | null;
              return opp?.client_id;
            })
            .filter(Boolean)
        ),
      ];

      // Fetch client names if needed
      let clientMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from("clients")
          .select("id, nom")
          .in("id", clientIds);

        clientMap = new Map(
          (clients || []).map((c) => [c.id, c.nom || ""])
        );
      }

      // Map and enrich with opportunity and client data
      return (data || []).map((record) => {
        const baseRecord = mapToOpportuniteContact(record);
        const oppData = record.opportunites as Record<string, unknown> | null;
        const opportunite = oppData ? mapOpportuniteFromJoin(oppData) : undefined;
        const clientId = (oppData?.client_id as string) || undefined;

        return {
          ...baseRecord,
          opportunite: opportunite
            ? {
                ...opportunite,
                clientNom: clientId ? clientMap.get(clientId) : undefined,
              }
            : undefined,
        };
      });
    },
    enabled: !!contactId,
  });
}

/**
 * Hook to add a contact to an opportunity
 *
 * Creates a new opportunite_contact pivot record
 */
export function useAddContactToOpportunite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      opportuniteId,
      contactId,
      role,
      isPrimary = false,
    }: {
      opportuniteId: string;
      contactId: string;
      role: ContactRole;
      isPrimary?: boolean;
    }) => {
      // If setting as primary, unset other primaries first
      if (isPrimary) {
        await supabase
          .from("opportunite_contacts")
          .update({ is_primary: false })
          .eq("opportunite_id", opportuniteId)
          .eq("is_primary", true);
      }

      const insertData = mapOpportuniteContactToInsert({
        opportuniteId,
        contactId,
        role,
        isPrimary,
      });

      const { data, error } = await supabase
        .from("opportunite_contacts")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Check for unique constraint violation
        if (error.code === "23505") {
          throw new Error(
            "Ce contact est déjà associé à cette opportunité."
          );
        }
        throw error;
      }

      return mapToOpportuniteContact(data);
    },
    onSuccess: async (_, variables) => {
      // Invalidate queries for both directions
      await queryClient.refetchQueries({
        queryKey: queryKeys.opportuniteContacts.byOpportunite(variables.opportuniteId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportuniteContacts.byContact(variables.contactId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportuniteContacts.all,
      });
      // Also invalidate opportunites as they may display contact count
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunites.detail(variables.opportuniteId),
      });
    },
  });
}

/**
 * Hook to update a contact's role/isPrimary in an opportunity
 */
export function useUpdateOpportuniteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      opportuniteId,
      contactId,
      role,
      isPrimary,
    }: {
      id: string;
      opportuniteId: string;
      contactId: string;
      role?: ContactRole;
      isPrimary?: boolean;
    }) => {
      // If setting as primary, unset other primaries first
      if (isPrimary) {
        await supabase
          .from("opportunite_contacts")
          .update({ is_primary: false })
          .eq("opportunite_id", opportuniteId)
          .eq("is_primary", true)
          .neq("id", id);
      }

      const updateData = mapOpportuniteContactToUpdate({ role, isPrimary });

      const { data, error } = await supabase
        .from("opportunite_contacts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return mapToOpportuniteContact(data);
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.opportuniteContacts.byOpportunite(variables.opportuniteId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportuniteContacts.byContact(variables.contactId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportuniteContacts.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to remove a contact from an opportunity
 *
 * Deletes the opportunite_contact pivot record
 */
export function useRemoveContactFromOpportunite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      opportuniteId,
      contactId,
    }: {
      id: string;
      opportuniteId: string;
      contactId: string;
    }) => {
      const { error } = await supabase
        .from("opportunite_contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return { id, opportuniteId, contactId };
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.opportuniteContacts.byOpportunite(variables.opportuniteId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportuniteContacts.byContact(variables.contactId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportuniteContacts.all,
      });
      // Also invalidate opportunites as they may display contact count
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunites.detail(variables.opportuniteId),
      });
    },
  });
}

/**
 * Hook to set a contact as primary for an opportunity
 * (convenience wrapper around useUpdateOpportuniteContact)
 */
export function useSetPrimaryContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      opportuniteId,
      contactId,
      pivotId,
    }: {
      opportuniteId: string;
      contactId: string;
      pivotId: string;
    }) => {
      // First, unset all primaries for this opportunity
      await supabase
        .from("opportunite_contacts")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("opportunite_id", opportuniteId);

      // Then set the new primary
      const { data, error } = await supabase
        .from("opportunite_contacts")
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq("id", pivotId)
        .select()
        .single();

      if (error) throw error;

      return mapToOpportuniteContact(data);
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: queryKeys.opportuniteContacts.byOpportunite(variables.opportuniteId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportuniteContacts.byContact(variables.contactId),
      });
    },
  });
}

/**
 * Get a summary of opportunities for a contact
 * Useful for display in contact cards
 */
export function useContactOpportunitySummary(contactId: string | undefined) {
  const { data: opportuniteContacts, isLoading } = useContactOpportunites(contactId);

  const summary = {
    total: 0,
    active: 0,
    won: 0,
    lost: 0,
    totalValue: 0,
    roles: [] as ContactRole[],
  };

  if (opportuniteContacts) {
    summary.total = opportuniteContacts.length;
    summary.roles = [...new Set(opportuniteContacts.map((oc) => oc.role))];

    opportuniteContacts.forEach((oc) => {
      if (oc.opportunite) {
        const statut = oc.opportunite.statut;
        if (statut === "Gagné") {
          summary.won++;
          summary.totalValue += oc.opportunite.valeurEstimee || 0;
        } else if (statut === "Perdu") {
          summary.lost++;
        } else {
          summary.active++;
        }
      }
    });
  }

  return {
    summary,
    isLoading,
    opportuniteContacts,
  };
}
