// CRM Axivity — Contact mapper (Supabase → domain type)
//
// PRO-H1 — Avant ce refactor, `mapToContact` était un bloc de `as X`
// inline dans `use-prospects.ts`. Un drift de schéma (ex. enum ajouté côté
// DB mais pas côté code) passait en silence et corrompait le type domaine.
// On valide maintenant via Zod au boundary, et on ignore proprement les
// lignes invalides plutôt que de produire des `statut_prospection` bidon.

import { contactDbRecordSchema } from "@/lib/schemas/contact-db";
import type { Contact } from "@/types";
import type { SupabaseRecord } from "./base.mapper";

/**
 * Convertit un record Supabase en `Contact`.
 *
 * Retourne `null` si le record est invalide (id manquant, enum hors liste…)
 * et log un `console.warn` structuré — les appelants doivent filtrer les
 * `null` pour les listes, ou traiter `null` comme "record introuvable"
 * pour les queries à un seul record.
 */
export function mapToContact(record: SupabaseRecord): Contact | null {
  const parsed = contactDbRecordSchema.safeParse(record);

  if (!parsed.success) {
    console.warn("[mapToContact] record invalide, ignoré", {
      id: typeof record?.id === "string" ? record.id : "<unknown>",
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return null;
  }

  const r = parsed.data;

  return {
    id: r.id,
    nom: r.nom,
    prenom: r.prenom,
    email: r.email,
    telephone: r.telephone,
    poste: r.poste,
    linkedin: r.linkedin,
    estPrincipal: r.est_principal,
    lifecycleStage: r.lifecycle_stage,
    lifecycleStageChangedAt: r.lifecycle_stage_changed_at,
    statutProspection: r.statut_prospection,
    dateRappel: r.date_rappel,
    dateRdvPrevu: r.date_rdv_prevu,
    typeRdv: r.type_rdv,
    lienVisio: r.lien_visio,
    sourceLead: r.source_lead,
    notesProspection: r.notes_prospection,
    client: r.client_id ? [r.client_id] : undefined,
    createdTime: r.created_at,
  };
}

/**
 * Helper : `mapToContact` mais lève une erreur si le record est invalide.
 * Usage : queries `single()` où l'appelant demande explicitement un record.
 */
export function mapToContactOrThrow(record: SupabaseRecord): Contact {
  const contact = mapToContact(record);
  if (!contact) {
    throw new Error("Contact introuvable ou format invalide");
  }
  return contact;
}

/**
 * Helper : applique `mapToContact` à une liste et filtre les invalides.
 */
export function mapToContacts(records: SupabaseRecord[]): Contact[] {
  return records
    .map(mapToContact)
    .filter((c): c is Contact => c !== null);
}
