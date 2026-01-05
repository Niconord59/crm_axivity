// CRM Axivity - Facture Mapper
// Maps Supabase records to Facture type

import type { Facture } from "@/types";
import { INVOICE_STATUSES, DEFAULTS } from "@/types/constants";
import {
  parseString,
  parseOptionalString,
  parseOptionalNumber,
  parseEnum,
  parseLinkedId,
  type SupabaseRecord,
} from "./base.mapper";

/**
 * Map a Supabase record to Facture type
 */
export function mapToFacture(record: SupabaseRecord): Facture {
  const montantHT = parseOptionalNumber(record.montant_ht);
  const tauxTVA = parseOptionalNumber(record.taux_tva) || (DEFAULTS.TVA_RATE * 100);

  return {
    id: parseString(record.id),
    numero: parseOptionalString(record.numero),
    statut: parseEnum(record.statut, INVOICE_STATUSES, "Brouillon"),
    montantHT,
    montantTTC: montantHT ? montantHT * (1 + tauxTVA / 100) : undefined,
    dateEmission: parseOptionalString(record.date_emission),
    dateEcheance: parseOptionalString(record.date_echeance),
    datePaiement: parseOptionalString(record.date_paiement),
    notes: parseOptionalString(record.notes),
    // Relance fields
    niveauRelance: parseOptionalNumber(record.niveau_relance),
    niveauRelanceEnvoye: parseOptionalNumber(record.niveau_relance_envoye),
    dateDerniereRelance: parseOptionalString(record.date_derniere_relance),
    // Linked records
    projet: parseLinkedId(record.projet_id)
      ? [parseLinkedId(record.projet_id)!]
      : undefined,
    client: parseLinkedId(record.client_id)
      ? [parseLinkedId(record.client_id)!]
      : undefined,
  };
}

/**
 * Map Facture type to Supabase insert data
 */
export function mapFactureToInsert(data: Partial<Facture>): SupabaseRecord {
  return {
    numero: data.numero,
    statut: data.statut || "Brouillon",
    montant_ht: data.montantHT,
    date_emission: data.dateEmission,
    date_echeance: data.dateEcheance,
    notes: data.notes,
    projet_id: data.projet?.[0],
    client_id: data.client?.[0],
  };
}

/**
 * Map Facture type to Supabase update data
 */
export function mapFactureToUpdate(data: Partial<Facture>): SupabaseRecord {
  const updateData: SupabaseRecord = {};

  if (data.numero !== undefined) updateData.numero = data.numero;
  if (data.statut !== undefined) updateData.statut = data.statut;
  if (data.montantHT !== undefined) updateData.montant_ht = data.montantHT;
  if (data.dateEmission !== undefined) updateData.date_emission = data.dateEmission;
  if (data.dateEcheance !== undefined) updateData.date_echeance = data.dateEcheance;
  if (data.datePaiement !== undefined) updateData.date_paiement = data.datePaiement;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.niveauRelanceEnvoye !== undefined) updateData.niveau_relance_envoye = data.niveauRelanceEnvoye;
  if (data.dateDerniereRelance !== undefined) updateData.date_derniere_relance = data.dateDerniereRelance;

  return updateData;
}
