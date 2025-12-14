import { z } from "zod";

// Statuts disponibles pour les clients
export const CLIENT_STATUTS = [
  "Prospect",
  "Actif",
  "Inactif",
  "Churned",
] as const;

export type ClientStatut = (typeof CLIENT_STATUTS)[number];

// Types de clients
export const CLIENT_TYPES = [
  "PME",
  "ETI",
  "Grand Compte",
  "Startup",
  "Association",
] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

// Schéma pour la création/édition d'un client
export const clientSchema = z.object({
  // Nom de l'entreprise (obligatoire)
  nom: z
    .string()
    .min(1, "Le nom du client est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),

  // Secteur d'activité (optionnel)
  secteurActivite: z
    .string()
    .max(100, "Le secteur ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),

  // Statut client
  statut: z.enum(CLIENT_STATUTS, {
    errorMap: () => ({ message: "Veuillez sélectionner un statut valide" }),
  }),

  // Site web (optionnel)
  siteWeb: z
    .string()
    .url("Veuillez entrer une URL valide (ex: https://example.com)")
    .optional()
    .or(z.literal("")),

  // Notes (optionnel)
  notes: z
    .string()
    .max(5000, "Les notes ne peuvent pas dépasser 5000 caractères")
    .optional()
    .or(z.literal("")),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Valeurs par défaut pour un nouveau formulaire
export const clientDefaultValues: Partial<ClientFormData> = {
  nom: "",
  secteurActivite: "",
  statut: "Prospect",
  siteWeb: "",
  notes: "",
};
