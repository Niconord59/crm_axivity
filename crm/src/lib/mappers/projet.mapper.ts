// CRM Axivity - Projet Mapper
// Maps Supabase records to Projet type

import type { Projet } from "@/types";
import { PROJECT_STATUSES, TASK_PRIORITIES } from "@/types/constants";
import {
  parseString,
  parseOptionalString,
  parseOptionalNumber,
  parseEnum,
  parseLinkedId,
  type SupabaseRecord,
} from "./base.mapper";

// Extended Projet type with ownerId for internal use
export type ProjetWithOwner = Projet & { ownerId?: string };

/**
 * Map a Supabase record to Projet type
 */
export function mapToProjet(record: SupabaseRecord): ProjetWithOwner {
  return {
    id: parseString(record.id),
    idProjet: parseOptionalNumber(record.id_projet),
    briefProjet: parseOptionalString(record.brief),
    nomProjet: parseOptionalString(record.nom),
    statut: parseEnum(record.statut, PROJECT_STATUSES, "Cadrage"),
    dateDebut: parseOptionalString(record.date_debut),
    dateFinPrevue: parseOptionalString(record.date_fin_prevue),
    dateFinReelle: parseOptionalString(record.date_fin_reelle),
    budget: parseOptionalNumber(record.budget_initial),
    notes: parseOptionalString(record.notes),
    priorite: parseEnum(record.priorite, TASK_PRIORITIES),
    // Calculated fields
    totalHeuresEstimees: parseOptionalNumber(record.heures_estimees),
    totalHeuresPassees: parseOptionalNumber(record.heures_passees),
    // Linked records
    client: parseLinkedId(record.client_id)
      ? [parseLinkedId(record.client_id)!]
      : undefined,
    // Extended field
    ownerId: parseOptionalString(record.chef_projet_id),
  };
}

/**
 * Map Projet type to Supabase insert data
 */
export function mapProjetToInsert(data: Partial<ProjetWithOwner>): SupabaseRecord {
  const insertData: SupabaseRecord = {
    brief: data.briefProjet,
    nom: data.nomProjet || data.briefProjet,
    statut: data.statut || "Cadrage",
    date_debut: data.dateDebut,
    date_fin_prevue: data.dateFinPrevue,
    budget_initial: data.budget,
    notes: data.notes,
    client_id: data.client?.[0],
  };

  if (data.ownerId) {
    insertData.chef_projet_id = data.ownerId;
  }

  return insertData;
}

/**
 * Map Projet type to Supabase update data
 */
export function mapProjetToUpdate(data: Partial<ProjetWithOwner>): SupabaseRecord {
  const updateData: SupabaseRecord = {};

  if (data.briefProjet !== undefined) updateData.brief = data.briefProjet;
  if (data.nomProjet !== undefined) updateData.nom = data.nomProjet;
  if (data.statut !== undefined) updateData.statut = data.statut;
  if (data.dateDebut !== undefined) updateData.date_debut = data.dateDebut;
  if (data.dateFinPrevue !== undefined) updateData.date_fin_prevue = data.dateFinPrevue;
  if (data.dateFinReelle !== undefined) updateData.date_fin_reelle = data.dateFinReelle;
  if (data.budget !== undefined) updateData.budget_initial = data.budget;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.priorite !== undefined) updateData.priorite = data.priorite;
  if (data.ownerId !== undefined) updateData.chef_projet_id = data.ownerId || null;

  return updateData;
}
