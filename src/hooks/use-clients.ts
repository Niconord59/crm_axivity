"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { Client } from "@/types";

interface ClientFields {
  "Nom du Client"?: string;
  "Secteur d'activité"?: string;
  "Statut"?: string;
  "Site Web"?: string;
  "Notes"?: string;
  "Date de Création"?: string;
  // Billing / Address fields
  "SIRET"?: string;
  "Adresse"?: string;
  "Code Postal"?: string;
  "Ville"?: string;
  "Pays"?: string;
  // Calculated fields
  "Santé du Client"?: string;
  "CA Total Encaissé"?: number;
  // Linked records
  "Contacts"?: string[];
  "Projets"?: string[];
  "Opportunités"?: string[];
  "Factures"?: string[];
}

function mapRecordToClient(record: { id: string; fields: ClientFields }): Client {
  return {
    id: record.id,
    nom: record.fields["Nom du Client"] || "",
    secteurActivite: record.fields["Secteur d'activité"],
    statut: record.fields["Statut"] as Client["statut"],
    siteWeb: record.fields["Site Web"],
    notes: record.fields["Notes"],
    dateCreation: record.fields["Date de Création"],
    // Billing / Address fields
    siret: record.fields["SIRET"],
    adresse: record.fields["Adresse"],
    codePostal: record.fields["Code Postal"],
    ville: record.fields["Ville"],
    pays: record.fields["Pays"],
    // Calculated fields
    santeClient: record.fields["Santé du Client"],
    caTotal: record.fields["CA Total Encaissé"],
    // Linked records
    contacts: record.fields["Contacts"],
    projets: record.fields["Projets"],
    opportunites: record.fields["Opportunités"],
    factures: record.fields["Factures"],
  };
}

export function useClients(options?: { statut?: string; secteur?: string }) {
  return useQuery({
    queryKey: ["clients", options],
    queryFn: async () => {
      let filterByFormula: string | undefined;
      const filters: string[] = [];

      if (options?.statut) {
        filters.push(`{Statut} = '${options.statut}'`);
      }
      if (options?.secteur) {
        filters.push(`{Secteur d'activité} = '${options.secteur}'`);
      }

      if (filters.length > 0) {
        filterByFormula =
          filters.length === 1 ? filters[0] : `AND(${filters.join(", ")})`;
      }

      const records = await airtable.getRecords<ClientFields>(
        AIRTABLE_TABLES.CLIENTS,
        {
          filterByFormula,
          sort: [{ field: "Nom du Client", direction: "asc" }],
        }
      );

      return records.map(mapRecordToClient);
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) throw new Error("Client ID required");
      const record = await airtable.getRecord<ClientFields>(
        AIRTABLE_TABLES.CLIENTS,
        id
      );
      return mapRecordToClient(record);
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const fields: Partial<ClientFields> = {
        "Nom du Client": data.nom,
        "Secteur d'activité": data.secteurActivite,
        "Statut": data.statut,
        "Site Web": data.siteWeb,
        "Notes": data.notes,
      };

      const record = await airtable.createRecord<ClientFields>(
        AIRTABLE_TABLES.CLIENTS,
        fields
      );
      return mapRecordToClient(record);
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
      const fields: Partial<ClientFields> = {};

      if (data.nom !== undefined) fields["Nom du Client"] = data.nom;
      if (data.secteurActivite !== undefined) fields["Secteur d'activité"] = data.secteurActivite;
      if (data.statut !== undefined) fields["Statut"] = data.statut;
      if (data.siteWeb !== undefined) fields["Site Web"] = data.siteWeb;
      if (data.notes !== undefined) fields["Notes"] = data.notes;

      const record = await airtable.updateRecord<ClientFields>(
        AIRTABLE_TABLES.CLIENTS,
        id,
        fields
      );
      return mapRecordToClient(record);
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
      await airtable.deleteRecord(AIRTABLE_TABLES.CLIENTS, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
