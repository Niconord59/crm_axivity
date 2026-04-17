// CRM Axivity — Zod schema pour les records Supabase de la table `contacts`
//
// PRO-H1 — Le mapper `mapToContact` cassait silencieusement si une enum
// prenait une valeur hors liste (drift de schéma entre DB et code). Ce
// schéma valide la forme au boundary et laisse le mapper décider d'ignorer
// la ligne avec un log plutôt que de produire un type corrompu.

import { z } from "zod";
import {
  PROSPECT_STATUSES,
  PROSPECT_SOURCES,
  RDV_TYPES,
  LIFECYCLE_STAGES,
} from "@/types/constants";

// Helpers — chaque colonne Supabase peut être `null` en base ; Zod traite
// `null` comme invalide pour `string()` donc on le transforme en `undefined`.
const nullableString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v === null || v === undefined ? undefined : v));

const nullableBoolean = z
  .union([z.boolean(), z.null(), z.undefined()])
  .transform((v) => (v === null || v === undefined ? undefined : v));

// Enum "souple" : accepte `null`/`undefined`/valeur de l'enum.
// Une valeur string hors enum fait échouer le safeParse → mapper ignore la ligne.
function nullableEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z
    .union([z.enum(values), z.null(), z.undefined()])
    .transform((v) => (v === null || v === undefined ? undefined : v));
}

export const contactDbRecordSchema = z.object({
  id: z.string().min(1, "id requis"),
  // `nom` est NOT NULL en base (cf. `01_schema.sql`), mais on tolère vide pour
  // rester compatibles avec les tests existants qui fallback sur "".
  nom: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v === null || v === undefined ? "" : v)),
  prenom: nullableString,
  email: nullableString,
  telephone: nullableString,
  poste: nullableString,
  linkedin: nullableString,
  est_principal: nullableBoolean,
  lifecycle_stage: nullableEnum(LIFECYCLE_STAGES),
  lifecycle_stage_changed_at: nullableString,
  statut_prospection: nullableEnum(PROSPECT_STATUSES),
  date_rappel: nullableString,
  date_rdv_prevu: nullableString,
  type_rdv: nullableEnum(RDV_TYPES),
  lien_visio: nullableString,
  source_lead: nullableEnum(PROSPECT_SOURCES),
  notes_prospection: nullableString,
  client_id: nullableString,
  created_at: nullableString,
});

export type ContactDbRecord = z.infer<typeof contactDbRecordSchema>;
