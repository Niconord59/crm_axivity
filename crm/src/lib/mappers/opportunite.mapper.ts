// CRM Axivity - Opportunite Mapper
// Maps Supabase records to Opportunite type
//
// DEPRECATION NOTE (v2 planned):
// The `contact_id` field in the `opportunites` table is deprecated.
// The source of truth for contact associations is now the `opportunite_contacts`
// pivot table (N:N relation). The `contact_id` field is maintained for backward
// compatibility during the transition period.
//
// For new code:
// - Use `opportunite_contacts` table to associate contacts with opportunities
// - Use `is_primary = true` to identify the primary contact
// - The `contact` field in Opportunite type will be removed in v2
//
// Migration plan: Remove `contact_id` column from `opportunites` table in v2

import type { Opportunite, OpportuniteContact } from "@/types";
import { OPPORTUNITY_STATUSES, type OpportunityStatus } from "@/types/constants";
import {
  parseString,
  parseOptionalString,
  parseOptionalNumber,
  parseLinkedId,
  parseEnum,
  type SupabaseRecord,
} from "./base.mapper";
import { mapToOpportuniteContact } from "./opportunite-contact.mapper";

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

/**
 * Extended Opportunite type with loaded contacts from N:N relation
 */
export interface OpportuniteWithContacts extends Opportunite {
  opportuniteContacts?: OpportuniteContact[];
}

/**
 * Map a Supabase record with joined opportunite_contacts to OpportuniteWithContacts
 * Used when fetching opportunities with their related contacts via join
 *
 * Expected Supabase query format:
 * .select(`*, opportunite_contacts(*, contacts(*))`)
 */
export function mapToOpportuniteWithContacts(
  record: SupabaseRecord
): OpportuniteWithContacts {
  const base = mapToOpportunite(record);

  // Parse joined opportunite_contacts if present
  const opportuniteContactsRaw = record.opportunite_contacts;
  let opportuniteContacts: OpportuniteContact[] | undefined;

  if (Array.isArray(opportuniteContactsRaw) && opportuniteContactsRaw.length > 0) {
    opportuniteContacts = opportuniteContactsRaw.map((oc: SupabaseRecord) => {
      const mapped = mapToOpportuniteContact(oc);

      // If contacts relation was also joined, attach it
      if (oc.contacts && typeof oc.contacts === "object") {
        mapped.contact = {
          id: parseString((oc.contacts as SupabaseRecord).id),
          nom: parseString((oc.contacts as SupabaseRecord).nom),
          prenom: parseOptionalString((oc.contacts as SupabaseRecord).prenom),
          email: parseOptionalString((oc.contacts as SupabaseRecord).email),
          telephone: parseOptionalString((oc.contacts as SupabaseRecord).telephone),
          poste: parseOptionalString((oc.contacts as SupabaseRecord).poste),
        };
      }

      return mapped;
    });
  }

  return {
    ...base,
    opportuniteContacts,
  };
}
