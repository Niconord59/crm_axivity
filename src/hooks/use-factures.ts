"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { airtable, AIRTABLE_TABLES } from "@/lib/airtable";
import type { Facture, InvoiceStatus } from "@/types";

interface FactureFields {
  "Numéro de Facture"?: string;
  "Statut"?: string;
  "Montant HT"?: number;
  "Montant TTC"?: number;
  "Date d'Émission"?: string;
  "Date d'Échéance"?: string;
  "Date de Paiement"?: string;
  "Notes"?: string;
  "Niveau de Relance"?: number;
  "Niveau Relance Envoyé"?: number;
  "Date Dernière Relance"?: string;
  "Projet"?: string[];
  "Client"?: string[];
}

function mapRecordToFacture(
  record: { id: string; fields: FactureFields }
): Facture {
  return {
    id: record.id,
    numero: record.fields["Numéro de Facture"],
    statut: record.fields["Statut"] as InvoiceStatus,
    montantHT: record.fields["Montant HT"],
    montantTTC: record.fields["Montant TTC"],
    dateEmission: record.fields["Date d'Émission"],
    dateEcheance: record.fields["Date d'Échéance"],
    datePaiement: record.fields["Date de Paiement"],
    notes: record.fields["Notes"],
    niveauRelance: record.fields["Niveau de Relance"],
    niveauRelanceEnvoye: record.fields["Niveau Relance Envoyé"],
    dateDerniereRelance: record.fields["Date Dernière Relance"],
    projet: record.fields["Projet"],
    client: record.fields["Client"],
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
      let filterByFormula: string | undefined;
      const filters: string[] = [];

      if (options?.statut) {
        filters.push(`{Statut} = '${options.statut}'`);
      }
      if (options?.clientId) {
        filters.push(`FIND('${options.clientId}', ARRAYJOIN({Client}))`);
      }
      if (options?.projetId) {
        filters.push(`FIND('${options.projetId}', ARRAYJOIN({Projet}))`);
      }

      if (filters.length > 0) {
        filterByFormula =
          filters.length === 1 ? filters[0] : `AND(${filters.join(", ")})`;
      }

      const records = await airtable.getRecords<FactureFields>(
        AIRTABLE_TABLES.FACTURES,
        {
          filterByFormula,
          sort: [{ field: "Date d'Émission", direction: "desc" }],
        }
      );

      return records.map(mapRecordToFacture);
    },
  });
}

export function useFacturesImpayees() {
  return useQuery({
    queryKey: ["factures", "impayees"],
    queryFn: async () => {
      const records = await airtable.getRecords<FactureFields>(
        AIRTABLE_TABLES.FACTURES,
        {
          filterByFormula: "{Statut} = 'Envoyé'",
          sort: [{ field: "Date d'Échéance", direction: "asc" }],
        }
      );

      return records.map(mapRecordToFacture);
    },
  });
}

export function useFacturesARelancer() {
  return useQuery({
    queryKey: ["factures", "a-relancer"],
    queryFn: async () => {
      const records = await airtable.getRecords<FactureFields>(
        AIRTABLE_TABLES.FACTURES,
        {
          filterByFormula:
            "AND({Statut} = 'Envoyé', {Niveau de Relance} > 0)",
          sort: [{ field: "Date d'Échéance", direction: "asc" }],
        }
      );

      return records.map(mapRecordToFacture);
    },
  });
}

export function useFacture(id: string | undefined) {
  return useQuery({
    queryKey: ["facture", id],
    queryFn: async () => {
      if (!id) throw new Error("Facture ID required");
      const record = await airtable.getRecord<FactureFields>(
        AIRTABLE_TABLES.FACTURES,
        id
      );
      return mapRecordToFacture(record);
    },
    enabled: !!id,
  });
}

export function useCreateFacture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Facture>) => {
      const fields: Partial<FactureFields> = {
        "Numéro de Facture": data.numero,
        "Statut": data.statut || "Brouillon",
        "Montant HT": data.montantHT,
        "Date d'Émission": data.dateEmission,
        "Date d'Échéance": data.dateEcheance,
        "Notes": data.notes,
        "Projet": data.projet,
        "Client": data.client,
      };

      const record = await airtable.createRecord<FactureFields>(
        AIRTABLE_TABLES.FACTURES,
        fields
      );
      return mapRecordToFacture(record);
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
      const fields: Partial<FactureFields> = {};

      if (data.numero !== undefined) fields["Numéro de Facture"] = data.numero;
      if (data.statut !== undefined) fields["Statut"] = data.statut;
      if (data.montantHT !== undefined) fields["Montant HT"] = data.montantHT;
      if (data.dateEmission !== undefined) fields["Date d'Émission"] = data.dateEmission;
      if (data.dateEcheance !== undefined) fields["Date d'Échéance"] = data.dateEcheance;
      if (data.datePaiement !== undefined) fields["Date de Paiement"] = data.datePaiement;
      if (data.notes !== undefined) fields["Notes"] = data.notes;

      const record = await airtable.updateRecord<FactureFields>(
        AIRTABLE_TABLES.FACTURES,
        id,
        fields
      );
      return mapRecordToFacture(record);
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
      const record = await airtable.updateRecord<FactureFields>(
        AIRTABLE_TABLES.FACTURES,
        id,
        {
          Statut: "Payé",
          "Date de Paiement": new Date().toISOString().split("T")[0],
        }
      );
      return mapRecordToFacture(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factures"] });
    },
  });
}
