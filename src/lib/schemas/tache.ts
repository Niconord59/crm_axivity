import { z } from "zod";

// Statuts disponibles pour les tâches
export const TACHE_STATUTS = [
  "À faire",
  "En cours",
  "En revue",
  "Terminé",
] as const;

export type TacheStatut = (typeof TACHE_STATUTS)[number];

// Priorités disponibles
export const TACHE_PRIORITES = ["Basse", "Moyenne", "Haute", "Critique"] as const;

export type TachePriorite = (typeof TACHE_PRIORITES)[number];

// Schéma pour la création/édition d'une tâche
export const tacheSchema = z.object({
  // Nom de la tâche (obligatoire)
  nom: z
    .string()
    .min(1, "Le nom de la tâche est requis")
    .max(300, "Le nom ne peut pas dépasser 300 caractères"),

  // Lien vers Projet (ID Airtable)
  projetId: z
    .string()
    .min(1, "Veuillez sélectionner un projet"),

  // Responsable (lien vers Équipe) - optionnel
  responsableId: z
    .string()
    .optional()
    .or(z.literal("")),

  // Date d'échéance
  dateEcheance: z
    .string()
    .min(1, "La date d'échéance est requise"),

  // Priorité
  priorite: z.enum(TACHE_PRIORITES, {
    errorMap: () => ({ message: "Veuillez sélectionner une priorité" }),
  }),

  // Statut
  statut: z.enum(TACHE_STATUTS, {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Heures estimées (optionnel)
  heuresEstimees: z
    .number({ invalid_type_error: "Veuillez entrer un nombre valide" })
    .min(0, "Les heures doivent être positives")
    .max(1000, "Les heures ne peuvent pas dépasser 1000")
    .optional()
    .or(z.literal(0)),

  // Description (optionnel)
  description: z
    .string()
    .max(5000, "La description ne peut pas dépasser 5000 caractères")
    .optional()
    .or(z.literal("")),
});

export type TacheFormData = z.infer<typeof tacheSchema>;

// Valeurs par défaut pour un nouveau formulaire
export const tacheDefaultValues: Partial<TacheFormData> = {
  nom: "",
  projetId: "",
  responsableId: "",
  dateEcheance: "",
  priorite: "Moyenne",
  statut: "À faire",
  heuresEstimees: 0,
  description: "",
};
