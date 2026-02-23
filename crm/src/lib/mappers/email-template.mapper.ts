// CRM Axivity - Email Template Mapper
// Maps Supabase records to EmailTemplate type

import type { EmailTemplate } from "@/types";
import {
  parseString,
  parseOptionalString,
  type SupabaseRecord,
} from "./base.mapper";

/**
 * Map a Supabase record to EmailTemplate type
 */
export function mapToEmailTemplate(record: SupabaseRecord): EmailTemplate {
  const variables = record.variables;
  return {
    id: parseString(record.id),
    nom: parseString(record.nom),
    objet: parseString(record.objet),
    contenu: parseString(record.contenu),
    variables: Array.isArray(variables) ? variables.map(String) : [],
    createdBy: parseOptionalString(record.created_by),
    createdTime: parseOptionalString(record.created_at),
  };
}

/**
 * Map EmailTemplate type to Supabase insert data
 */
export function mapEmailTemplateToInsert(
  data: Partial<EmailTemplate>
): SupabaseRecord {
  return {
    nom: data.nom,
    objet: data.objet,
    contenu: data.contenu,
    variables: data.variables || [],
  };
}

/**
 * Map EmailTemplate type to Supabase update data
 * Only includes defined fields
 */
export function mapEmailTemplateToUpdate(
  data: Partial<EmailTemplate>
): SupabaseRecord {
  const updateData: SupabaseRecord = {};

  if (data.nom !== undefined) updateData.nom = data.nom;
  if (data.objet !== undefined) updateData.objet = data.objet;
  if (data.contenu !== undefined) updateData.contenu = data.contenu;
  if (data.variables !== undefined) updateData.variables = data.variables;

  return updateData;
}
