import { z } from "zod";

// Statuts disponibles pour les opportunités
// Note: "Lead" n'est plus un statut d'opportunité - les leads sont gérés dans /prospection
export const OPPORTUNITE_STATUTS = [
  "Qualifié",
  "Proposition",
  "Négociation",
  "Gagné",
  "Perdu",
] as const;

export type OpportuniteStatut = (typeof OPPORTUNITE_STATUTS)[number];

// Schéma pour la création/édition d'une opportunité
export const opportuniteSchema = z.object({
  // Nom de l'opportunité (obligatoire)
  nom: z
    .string()
    .min(1, "Le nom de l'opportunité est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),

  // Lien vers Client (ID Airtable)
  clientId: z
    .string()
    .min(1, "Veuillez sélectionner un client"),

  // Valeur estimée en euros
  valeurEstimee: z
    .number({ invalid_type_error: "Veuillez entrer un nombre valide" })
    .min(0, "La valeur doit être positive")
    .max(10000000, "La valeur ne peut pas dépasser 10 000 000 €"),

  // Probabilité de conversion (0-100%)
  probabilite: z
    .number({ invalid_type_error: "Veuillez entrer un nombre valide" })
    .min(0, "La probabilité doit être entre 0 et 100")
    .max(100, "La probabilité doit être entre 0 et 100"),

  // Date de clôture prévue
  dateClotureEstimee: z
    .string()
    .min(1, "La date de clôture est requise"),

  // Statut pipeline
  statut: z.enum(OPPORTUNITE_STATUTS, {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Source de l'opportunité (optionnel)
  source: z
    .string()
    .max(100, "La source ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),

  // Notes (optionnel)
  notes: z
    .string()
    .max(5000, "Les notes ne peuvent pas dépasser 5000 caractères")
    .optional()
    .or(z.literal("")),
});

export type OpportuniteFormData = z.infer<typeof opportuniteSchema>;

// Valeurs par défaut pour un nouveau formulaire
export const opportuniteDefaultValues: Partial<OpportuniteFormData> = {
  nom: "",
  clientId: "",
  valeurEstimee: 0,
  probabilite: 50,
  dateClotureEstimee: "",
  statut: "Qualifié",
  source: "",
  notes: "",
};
