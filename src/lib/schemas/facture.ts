import { z } from "zod";

// Statuts disponibles pour les factures
export const FACTURE_STATUTS = [
  "Brouillon",
  "Envoyé",
  "Payé",
  "Annulé",
] as const;

export type FactureStatut = (typeof FACTURE_STATUTS)[number];

// Schéma pour la création/édition d'une facture
export const factureSchema = z.object({
  // Numéro de facture (optionnel - peut être auto-généré)
  numero: z
    .string()
    .max(50, "Le numéro ne peut pas dépasser 50 caractères")
    .optional()
    .or(z.literal("")),

  // Lien vers Projet (ID Airtable)
  projetId: z
    .string()
    .min(1, "Veuillez sélectionner un projet"),

  // Montant HT
  montantHT: z
    .number({ invalid_type_error: "Veuillez entrer un nombre valide" })
    .min(0, "Le montant doit être positif")
    .max(10000000, "Le montant ne peut pas dépasser 10 000 000 €"),

  // Date d'émission
  dateEmission: z
    .string()
    .min(1, "La date d'émission est requise"),

  // Date d'échéance
  dateEcheance: z
    .string()
    .min(1, "La date d'échéance est requise"),

  // Statut
  statut: z.enum(FACTURE_STATUTS, {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Notes (optionnel)
  notes: z
    .string()
    .max(2000, "Les notes ne peuvent pas dépasser 2000 caractères")
    .optional()
    .or(z.literal("")),
}).refine((data) => {
  if (data.dateEmission && data.dateEcheance) {
    return new Date(data.dateEcheance) >= new Date(data.dateEmission);
  }
  return true;
}, {
  message: "La date d'échéance doit être après la date d'émission",
  path: ["dateEcheance"],
});

export type FactureFormData = z.infer<typeof factureSchema>;

// Valeurs par défaut pour un nouveau formulaire
export const factureDefaultValues: Partial<FactureFormData> = {
  numero: "",
  projetId: "",
  montantHT: 0,
  dateEmission: new Date().toISOString().split("T")[0],
  dateEcheance: "",
  statut: "Brouillon",
  notes: "",
};

// Fonction utilitaire pour calculer le TTC
export const calculerMontantTTC = (montantHT: number): number => {
  return Math.round(montantHT * 1.2 * 100) / 100; // TVA 20%, arrondi 2 décimales
};
