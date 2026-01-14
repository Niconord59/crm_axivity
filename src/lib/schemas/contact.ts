import { z } from "zod";
import {
  PROSPECT_STATUSES,
  PROSPECT_SOURCES,
  RDV_TYPES,
} from "@/types/constants";

// Export enum arrays for form Select components
export { PROSPECT_STATUSES, PROSPECT_SOURCES, RDV_TYPES };

// Schéma pour la création/édition d'un contact
export const contactSchema = z.object({
  // Nom (obligatoire)
  nom: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  // Prénom (optionnel)
  prenom: z
    .string()
    .max(100, "Le prénom ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),

  // Email (optionnel mais doit être valide si fourni)
  email: z
    .string()
    .email("Veuillez entrer une adresse email valide")
    .optional()
    .or(z.literal("")),

  // Téléphone (optionnel)
  telephone: z
    .string()
    .max(20, "Le téléphone ne peut pas dépasser 20 caractères")
    .optional()
    .or(z.literal("")),

  // Poste (optionnel)
  poste: z
    .string()
    .max(100, "Le poste ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),

  // LinkedIn URL (optionnel)
  linkedin: z
    .string()
    .url("Veuillez entrer une URL LinkedIn valide")
    .optional()
    .or(z.literal("")),

  // Contact principal (boolean)
  estPrincipal: z.boolean().optional(),

  // Client ID (optionnel, peut être null pour contacts orphelins)
  clientId: z.string().uuid("ID client invalide").optional().or(z.literal("")),

  // === Champs de prospection ===

  // Statut de prospection (peut être null depuis la base de données)
  statutProspection: z.enum(PROSPECT_STATUSES, {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }).optional().nullable(),

  // Date de rappel
  dateRappel: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),

  // Date de RDV prévu
  dateRdvPrevu: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),

  // Type de RDV (peut être null depuis la base de données)
  typeRdv: z.enum(RDV_TYPES, {
    errorMap: () => ({ message: "Veuillez sélectionner un type de RDV valide" }),
  }).optional().nullable(),

  // Lien visio
  lienVisio: z
    .string()
    .url("Veuillez entrer une URL de visio valide")
    .optional()
    .or(z.literal("")),

  // Source du lead (peut être null depuis la base de données)
  sourceLead: z.enum(PROSPECT_SOURCES, {
    errorMap: () => ({ message: "Veuillez sélectionner une source valide" }),
  }).optional().nullable(),

  // Notes prospection
  notesProspection: z
    .string()
    .max(5000, "Les notes ne peuvent pas dépasser 5000 caractères")
    .optional()
    .or(z.literal("")),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Valeurs par défaut pour un nouveau formulaire
export const contactDefaultValues: Partial<ContactFormData> = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  poste: "",
  linkedin: "",
  estPrincipal: false,
  clientId: "",
  statutProspection: undefined,
  dateRappel: "",
  dateRdvPrevu: "",
  typeRdv: undefined,
  lienVisio: "",
  sourceLead: undefined,
  notesProspection: "",
};

// Helper pour mapper Contact → ContactFormData (pour l'édition)
export function contactToFormData(contact: {
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  poste?: string;
  linkedin?: string;
  estPrincipal?: boolean;
  statutProspection?: string;
  dateRappel?: string;
  dateRdvPrevu?: string;
  typeRdv?: string;
  lienVisio?: string;
  sourceLead?: string;
  notesProspection?: string;
  client?: string[];
}): ContactFormData {
  return {
    nom: contact.nom || "",
    prenom: contact.prenom || "",
    email: contact.email || "",
    telephone: contact.telephone || "",
    poste: contact.poste || "",
    linkedin: contact.linkedin || "",
    estPrincipal: contact.estPrincipal || false,
    clientId: contact.client?.[0] || "",
    statutProspection: contact.statutProspection as ContactFormData["statutProspection"],
    dateRappel: contact.dateRappel || "",
    dateRdvPrevu: contact.dateRdvPrevu || "",
    typeRdv: contact.typeRdv as ContactFormData["typeRdv"],
    lienVisio: contact.lienVisio || "",
    sourceLead: contact.sourceLead as ContactFormData["sourceLead"],
    notesProspection: contact.notesProspection || "",
  };
}
