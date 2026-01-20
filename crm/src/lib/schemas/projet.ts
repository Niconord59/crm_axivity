import { z } from "zod";

// Statuts disponibles pour les projets
export const PROJET_STATUTS = [
  "Cadrage",
  "En cours",
  "En pause",
  "Terminé",
  "Annulé",
] as const;

export type ProjetStatut = (typeof PROJET_STATUTS)[number];

// Priorités disponibles
export const PROJET_PRIORITES = ["Basse", "Moyenne", "Haute", "Critique"] as const;

export type ProjetPriorite = (typeof PROJET_PRIORITES)[number];

// Schéma pour la création/édition d'un projet
export const projetSchema = z.object({
  // Brief du projet (devient le nom via formula)
  briefProjet: z
    .string()
    .min(1, "Le brief du projet est requis")
    .max(500, "Le brief ne peut pas dépasser 500 caractères"),

  // Lien vers Client (ID Supabase)
  clientId: z
    .string()
    .min(1, "Veuillez sélectionner un client"),

  // Responsable du projet (ID utilisateur)
  ownerId: z
    .string()
    .optional()
    .or(z.literal("")),

  // Budget total en euros
  budget: z
    .number({ invalid_type_error: "Veuillez entrer un nombre valide" })
    .min(0, "Le budget doit être positif")
    .max(10000000, "Le budget ne peut pas dépasser 10 000 000 €"),

  // Date de début
  dateDebut: z
    .string()
    .min(1, "La date de début est requise"),

  // Date de fin prévue
  dateFinPrevue: z
    .string()
    .min(1, "La date de fin prévue est requise"),

  // Statut du projet
  statut: z.enum(PROJET_STATUTS, {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Priorité
  priorite: z.enum(PROJET_PRIORITES, {
    errorMap: () => ({ message: "Veuillez sélectionner une priorité" }),
  }).optional(),

  // Notes (optionnel)
  notes: z
    .string()
    .max(10000, "Les notes ne peuvent pas dépasser 10000 caractères")
    .optional()
    .or(z.literal("")),
}).refine((data) => {
  if (data.dateDebut && data.dateFinPrevue) {
    return new Date(data.dateFinPrevue) >= new Date(data.dateDebut);
  }
  return true;
}, {
  message: "La date de fin doit être après la date de début",
  path: ["dateFinPrevue"],
});

export type ProjetFormData = z.infer<typeof projetSchema>;

// Valeurs par défaut pour un nouveau formulaire
export const projetDefaultValues: Partial<ProjetFormData> = {
  briefProjet: "",
  clientId: "",
  ownerId: "",
  budget: 0,
  dateDebut: "",
  dateFinPrevue: "",
  statut: "Cadrage",
  priorite: "Moyenne",
  notes: "",
};
