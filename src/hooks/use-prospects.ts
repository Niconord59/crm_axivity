"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { Contact, Client, ProspectStatus, ProspectSource } from "@/types";

// Field names for T2-Contacts (Airtable)
interface ContactFields {
  "Nom"?: string;
  "Prénom"?: string;
  "Email"?: string;
  "Téléphone"?: string;
  "Poste"?: string;
  "Est Principal"?: boolean;
  "Notes"?: string;
  "LinkedIn"?: string;
  // Prospection fields (must be created in Airtable first)
  "Statut Prospection"?: string;
  "Date Rappel"?: string;
  "Source Lead"?: string;
  "Notes Prospection"?: string;
  // Linked records
  "Client"?: string[];
  "Interactions"?: string[];
}

// Field names for T1-Clients (for lookups)
interface ClientFields {
  "Nom du Client"?: string;
}

// Extended prospect type with client name
export interface Prospect extends Contact {
  clientNom?: string;
}

// Filters for prospects list
export interface ProspectFilters {
  statut?: ProspectStatus | ProspectStatus[];
  source?: ProspectSource;
  dateRappel?: "today" | "this_week" | "overdue" | "all";
  search?: string;
}

function mapRecordToContact(record: { id: string; fields: ContactFields }): Contact {
  return {
    id: record.id,
    nom: record.fields["Nom"] || "",
    prenom: record.fields["Prénom"],
    email: record.fields["Email"],
    telephone: record.fields["Téléphone"],
    poste: record.fields["Poste"],
    estPrincipal: record.fields["Est Principal"],
    notes: record.fields["Notes"],
    linkedin: record.fields["LinkedIn"],
    statutProspection: record.fields["Statut Prospection"] as ProspectStatus,
    dateRappel: record.fields["Date Rappel"],
    sourceLead: record.fields["Source Lead"] as ProspectSource,
    notesProspection: record.fields["Notes Prospection"],
    client: record.fields["Client"],
    interactions: record.fields["Interactions"],
  };
}

// Get today's date in ISO format (YYYY-MM-DD)
function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// Get date for end of this week (Sunday)
function getEndOfWeek(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + daysUntilSunday);
  return endOfWeek.toISOString().split("T")[0];
}

/**
 * Hook to fetch prospects (contacts with prospection status)
 */
export function useProspects(filters?: ProspectFilters) {
  const { data: clients } = useClients();

  return useQuery({
    queryKey: ["prospects", filters],
    queryFn: async () => {
      const filterParts: string[] = [];

      // Base filter: only contacts with prospection status
      filterParts.push("{Statut Prospection} != ''");

      // Filter by status
      if (filters?.statut) {
        if (Array.isArray(filters.statut)) {
          const statusFilters = filters.statut.map(
            (s) => `{Statut Prospection} = '${s}'`
          );
          filterParts.push(`OR(${statusFilters.join(", ")})`);
        } else {
          filterParts.push(`{Statut Prospection} = '${filters.statut}'`);
        }
      }

      // Filter by source
      if (filters?.source) {
        filterParts.push(`{Source Lead} = '${filters.source}'`);
      }

      // Filter by date rappel
      if (filters?.dateRappel && filters.dateRappel !== "all") {
        const today = getToday();

        switch (filters.dateRappel) {
          case "today":
            filterParts.push(`{Date Rappel} = '${today}'`);
            break;
          case "this_week":
            filterParts.push(`AND({Date Rappel} >= '${today}', {Date Rappel} <= '${getEndOfWeek()}')`);
            break;
          case "overdue":
            filterParts.push(`AND({Date Rappel} != '', {Date Rappel} < '${today}', {Statut Prospection} = 'Rappeler')`);
            break;
        }
      }

      // Search filter
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filterParts.push(
          `OR(FIND('${searchTerm}', LOWER({Nom})), FIND('${searchTerm}', LOWER({Prénom})), FIND('${searchTerm}', LOWER({Email})))`
        );
      }

      const filterByFormula = filterParts.length > 1
        ? `AND(${filterParts.join(", ")})`
        : filterParts[0];

      const records = await airtable.getRecords<ContactFields>(
        AIRTABLE_TABLES.CONTACTS,
        {
          filterByFormula,
          sort: [
            { field: "Date Rappel", direction: "asc" },
            { field: "Statut Prospection", direction: "asc" },
          ],
        }
      );

      return records.map(mapRecordToContact);
    },
  });
}

/**
 * Hook to fetch a single prospect
 */
export function useProspect(id: string | undefined) {
  return useQuery({
    queryKey: ["prospect", id],
    queryFn: async () => {
      if (!id) throw new Error("Prospect ID required");
      const record = await airtable.getRecord<ContactFields>(
        AIRTABLE_TABLES.CONTACTS,
        id
      );
      return mapRecordToContact(record);
    },
    enabled: !!id,
  });
}

/**
 * Hook to get prospects with client names (for display)
 */
export function useProspectsWithClients(filters?: ProspectFilters) {
  const { data: prospects, ...rest } = useProspects(filters);

  return useQuery({
    queryKey: ["prospects-with-clients", filters, prospects?.map(p => p.id)],
    queryFn: async (): Promise<Prospect[]> => {
      if (!prospects || prospects.length === 0) return [];

      // Get unique client IDs
      const clientIds = [...new Set(
        prospects
          .flatMap(p => p.client || [])
          .filter(Boolean)
      )];

      if (clientIds.length === 0) {
        return prospects.map(p => ({ ...p, clientNom: undefined }));
      }

      // Fetch client names
      const clientMap = new Map<string, string>();

      // Fetch clients in batches to avoid rate limits
      for (const clientId of clientIds) {
        try {
          const record = await airtable.getRecord<ClientFields>(
            AIRTABLE_TABLES.CLIENTS,
            clientId
          );
          clientMap.set(clientId, record.fields["Nom du Client"] || "");
        } catch {
          // Client might have been deleted
        }
      }

      // Merge client names with prospects
      return prospects.map(prospect => ({
        ...prospect,
        clientNom: prospect.client?.[0]
          ? clientMap.get(prospect.client[0])
          : undefined,
      }));
    },
    enabled: !!prospects && prospects.length > 0,
  });
}

/**
 * Hook to update prospect status
 */
export function useUpdateProspectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      statut,
      dateRappel,
      notes,
    }: {
      id: string;
      statut: ProspectStatus;
      dateRappel?: string;
      notes?: string;
    }) => {
      const fields: Partial<ContactFields> = {
        "Statut Prospection": statut,
      };

      if (dateRappel !== undefined) {
        fields["Date Rappel"] = dateRappel || undefined;
      }

      if (notes !== undefined) {
        fields["Notes Prospection"] = notes;
      }

      const record = await airtable.updateRecord<ContactFields>(
        AIRTABLE_TABLES.CONTACTS,
        id,
        fields
      );
      return mapRecordToContact(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({ queryKey: ["prospect", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["prospects-with-clients"] });
    },
  });
}

/**
 * Hook to create a new prospect (creates client if needed, then contact)
 */
export function useCreateProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entreprise,
      nom,
      prenom,
      email,
      telephone,
      sourceLead,
      notesProspection,
    }: {
      entreprise: string;
      nom: string;
      prenom?: string;
      email: string;
      telephone?: string;
      sourceLead: ProspectSource;
      notesProspection?: string;
    }) => {
      // 1. Check if client exists by name
      let clientId: string;

      const existingClients = await airtable.getRecords<ClientFields>(
        AIRTABLE_TABLES.CLIENTS,
        {
          filterByFormula: `{Nom du Client} = '${entreprise}'`,
          maxRecords: 1,
        }
      );

      if (existingClients.length > 0) {
        clientId = existingClients[0].id;
      } else {
        // Create new client
        const newClient = await airtable.createRecord(
          AIRTABLE_TABLES.CLIENTS,
          {
            "Nom du Client": entreprise,
            "Statut": "Prospect",
          }
        );
        clientId = newClient.id;
      }

      // 2. Create contact with prospection fields
      const contactFields: Partial<ContactFields> = {
        "Nom": nom,
        "Prénom": prenom || undefined,
        "Email": email,
        "Téléphone": telephone || undefined,
        "Client": [clientId],
        "Statut Prospection": "À appeler",
        "Source Lead": sourceLead,
        "Notes Prospection": notesProspection || undefined,
      };

      const record = await airtable.createRecord<ContactFields>(
        AIRTABLE_TABLES.CONTACTS,
        contactFields
      );

      return mapRecordToContact(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({ queryKey: ["prospects-with-clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

/**
 * Hook to get prospection KPIs
 */
export function useProspectionKPIs() {
  const { data: prospects } = useProspects();

  return useQuery({
    queryKey: ["prospection-kpis", prospects?.map(p => p.id)],
    queryFn: async () => {
      if (!prospects) return null;

      const today = getToday();

      // Count by status
      const aAppeler = prospects.filter(p => p.statutProspection === "À appeler").length;
      const rappels = prospects.filter(p => p.statutProspection === "Rappeler").length;
      const qualifies = prospects.filter(p => p.statutProspection === "Qualifié").length;
      const nonQualifies = prospects.filter(p => p.statutProspection === "Non qualifié").length;
      const perdus = prospects.filter(p => p.statutProspection === "Perdu").length;

      // Rappels en retard
      const rappelsEnRetard = prospects.filter(
        p => p.statutProspection === "Rappeler" &&
             p.dateRappel &&
             p.dateRappel < today
      ).length;

      // Taux de qualification
      const totalTermines = qualifies + nonQualifies + perdus;
      const tauxQualification = totalTermines > 0
        ? Math.round((qualifies / totalTermines) * 100)
        : 0;

      return {
        total: prospects.length,
        aAppeler,
        rappels,
        rappelsEnRetard,
        qualifies,
        nonQualifies,
        perdus,
        tauxQualification,
      };
    },
    enabled: !!prospects,
  });
}

// Re-export useClients for internal use
function useClients() {
  return useQuery({
    queryKey: ["clients-for-prospects"],
    queryFn: async () => {
      const records = await airtable.getRecords<ClientFields>(
        AIRTABLE_TABLES.CLIENTS,
        {
          fields: ["Nom du Client"],
        }
      );
      return records;
    },
  });
}
