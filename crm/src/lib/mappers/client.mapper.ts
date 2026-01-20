// CRM Axivity - Client Mapper
// Maps Supabase records to Client type

import type { Client } from "@/types";
import { CLIENT_STATUSES, type ClientStatus } from "@/types/constants";
import {
  parseString,
  parseOptionalString,
  parseEnum,
  type SupabaseRecord,
} from "./base.mapper";

/**
 * Map a Supabase record to Client type
 */
export function mapToClient(record: SupabaseRecord): Client {
  return {
    id: parseString(record.id),
    nom: parseString(record.nom),
    secteurActivite: parseOptionalString(record.secteur),
    statut: parseEnum(record.statut, CLIENT_STATUSES, "Prospect"),
    siteWeb: parseOptionalString(record.site_web),
    telephone: parseOptionalString(record.telephone),
    notes: parseOptionalString(record.notes),
    dateCreation: parseOptionalString(record.created_at),
    // Billing / Address fields
    siret: parseOptionalString(record.siret),
    adresse: parseOptionalString(record.adresse),
    codePostal: parseOptionalString(record.code_postal),
    ville: parseOptionalString(record.ville),
    pays: parseOptionalString(record.pays),
    // Social / Web presence
    linkedinPage: parseOptionalString(record.linkedin_page),
    // Calculated fields
    santeClient: parseOptionalString(record.sante_client),
  };
}

/**
 * Map Client type to Supabase insert data
 */
export function mapClientToInsert(data: Partial<Client>): SupabaseRecord {
  return {
    nom: data.nom,
    secteur: data.secteurActivite,
    statut: data.statut || "Prospect",
    site_web: data.siteWeb,
    telephone: data.telephone,
    notes: data.notes,
    siret: data.siret,
    adresse: data.adresse,
    code_postal: data.codePostal,
    ville: data.ville,
    pays: data.pays || "France",
    linkedin_page: data.linkedinPage,
  };
}

/**
 * Map Client type to Supabase update data
 * Only includes defined fields
 */
export function mapClientToUpdate(data: Partial<Client>): SupabaseRecord {
  const updateData: SupabaseRecord = {};

  if (data.nom !== undefined) updateData.nom = data.nom;
  if (data.secteurActivite !== undefined) updateData.secteur = data.secteurActivite;
  if (data.statut !== undefined) updateData.statut = data.statut;
  if (data.siteWeb !== undefined) updateData.site_web = data.siteWeb;
  if (data.telephone !== undefined) updateData.telephone = data.telephone;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.siret !== undefined) updateData.siret = data.siret;
  if (data.adresse !== undefined) updateData.adresse = data.adresse;
  if (data.codePostal !== undefined) updateData.code_postal = data.codePostal;
  if (data.ville !== undefined) updateData.ville = data.ville;
  if (data.pays !== undefined) updateData.pays = data.pays;
  if (data.linkedinPage !== undefined) updateData.linkedin_page = data.linkedinPage;

  return updateData;
}
