// CRM Axivity - Tache Mapper
// Maps Supabase records to Tache type

import type { Tache } from "@/types";
import { TASK_STATUSES, TASK_PRIORITIES, type TaskStatus } from "@/types/constants";
import {
  parseString,
  parseOptionalString,
  parseOptionalNumber,
  parseEnum,
  parseLinkedId,
  type SupabaseRecord,
} from "./base.mapper";

/**
 * Map a Supabase record to Tache type
 */
export function mapToTache(record: SupabaseRecord): Tache {
  const dateEcheance = parseOptionalString(record.date_echeance);
  const statut = parseEnum(record.statut, TASK_STATUSES, "À faire") as TaskStatus;
  const today = new Date().toISOString().split("T")[0];

  return {
    id: parseString(record.id),
    nom: parseString(record.titre) || "",
    description: parseOptionalString(record.description),
    statut,
    priorite: parseEnum(record.priorite, TASK_PRIORITIES, "Moyenne"),
    dateEcheance,
    heuresEstimees: parseOptionalNumber(record.heures_estimees),
    heuresReelles: parseOptionalNumber(record.heures_passees),
    dateCreation: parseOptionalString(record.created_at),
    dateTerminee: parseOptionalString(record.date_terminee),
    ordre: parseOptionalNumber(record.ordre),
    // Calculated field (client-side)
    estEnRetard: dateEcheance && statut !== "Terminé" ? dateEcheance < today : false,
    // Linked records
    projet: parseLinkedId(record.projet_id)
      ? [parseLinkedId(record.projet_id)!]
      : undefined,
    membreEquipe: parseLinkedId(record.assignee_id)
      ? [parseLinkedId(record.assignee_id)!]
      : undefined,
  };
}

/**
 * Map Tache type to Supabase insert data
 */
export function mapTacheToInsert(data: Partial<Tache>): SupabaseRecord {
  return {
    titre: data.nom,
    description: data.description,
    statut: data.statut || "À faire",
    priorite: data.priorite || "Moyenne",
    date_echeance: data.dateEcheance,
    heures_estimees: data.heuresEstimees,
    projet_id: data.projet?.[0],
    assignee_id: data.membreEquipe?.[0],
  };
}

/**
 * Map Tache type to Supabase update data
 */
export function mapTacheToUpdate(data: Partial<Tache>): SupabaseRecord {
  const updateData: SupabaseRecord = {};

  if (data.nom !== undefined) updateData.titre = data.nom;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.statut !== undefined) updateData.statut = data.statut;
  if (data.priorite !== undefined) updateData.priorite = data.priorite;
  if (data.dateEcheance !== undefined) updateData.date_echeance = data.dateEcheance;
  if (data.heuresEstimees !== undefined) updateData.heures_estimees = data.heuresEstimees;
  if (data.heuresReelles !== undefined) updateData.heures_passees = data.heuresReelles;
  if (data.dateTerminee !== undefined) updateData.date_terminee = data.dateTerminee;
  if (data.ordre !== undefined) updateData.ordre = data.ordre;
  if (data.membreEquipe !== undefined) updateData.assignee_id = data.membreEquipe?.[0];

  return updateData;
}
