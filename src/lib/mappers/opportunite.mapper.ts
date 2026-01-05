// CRM Axivity - Opportunite Mapper
// Maps Supabase records to Opportunite type

import type { Opportunite } from "@/types";
import { OPPORTUNITY_STATUSES, type OpportunityStatus } from "@/types/constants";
import {
  parseString,
  parseOptionalString,
  parseOptionalNumber,
  parseLinkedId,
  parseEnum,
  type SupabaseRecord,
} from "./base.mapper";

/**
 * Map a Supabase record to Opportunite type
 */
export function mapToOpportunite(record: SupabaseRecord): Opportunite {
  const valeurEstimee = parseOptionalNumber(record.valeur_estimee);
  const probabilite = parseOptionalNumber(record.probabilite);

  return {
    id: parseString(record.id),
    nom: parseString(record.nom),
    statut: parseEnum(record.statut, OPPORTUNITY_STATUSES, "Qualifié"),
    valeurEstimee,
    probabilite,
    dateClotureEstimee: parseOptionalString(record.date_cloture_prevue),
    source: parseOptionalString(record.source),
    notes: parseOptionalString(record.notes),
    dateCreation: parseOptionalString(record.created_at),
    // Calculated field
    valeurPonderee: valeurEstimee && probabilite
      ? valeurEstimee * (probabilite / 100)
      : undefined,
    // Linked records
    client: parseLinkedId(record.client_id)
      ? [parseLinkedId(record.client_id)!]
      : undefined,
    contact: parseLinkedId(record.contact_id)
      ? [parseLinkedId(record.contact_id)!]
      : undefined,
    projetCree: parseLinkedId(record.projet_id)
      ? [parseLinkedId(record.projet_id)!]
      : undefined,
  };
}

/**
 * Map Opportunite type to Supabase insert data
 */
export function mapOpportuniteToInsert(data: Partial<Opportunite>): SupabaseRecord {
  return {
    nom: data.nom,
    statut: data.statut || "Qualifié",
    valeur_estimee: data.valeurEstimee,
    probabilite: data.probabilite,
    date_cloture_prevue: data.dateClotureEstimee,
    source: data.source,
    notes: data.notes,
    client_id: data.client?.[0],
    contact_id: data.contact?.[0],
  };
}

/**
 * Map Opportunite type to Supabase update data
 * Only includes defined fields
 */
export function mapOpportuniteToUpdate(data: Partial<Opportunite>): SupabaseRecord {
  const updateData: SupabaseRecord = {};

  if (data.nom !== undefined) updateData.nom = data.nom;
  if (data.statut !== undefined) updateData.statut = data.statut;
  if (data.valeurEstimee !== undefined) updateData.valeur_estimee = data.valeurEstimee;
  if (data.probabilite !== undefined) updateData.probabilite = data.probabilite;
  if (data.dateClotureEstimee !== undefined) updateData.date_cloture_prevue = data.dateClotureEstimee;
  if (data.source !== undefined) updateData.source = data.source;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return updateData;
}
