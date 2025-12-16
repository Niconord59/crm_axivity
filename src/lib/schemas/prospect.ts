import { z } from "zod";

// Statuts de prospection
export const PROSPECT_STATUTS = [
  "À appeler",
  "Appelé - pas répondu",
  "Rappeler",
  "RDV planifié",
  "RDV effectué",
  "Qualifié",
  "Non qualifié",
  "Perdu",
] as const;

export type ProspectStatut = (typeof PROSPECT_STATUTS)[number];

// Sources de leads
export const PROSPECT_SOURCES = [
  "Appel entrant",
  "LinkedIn",
  "Site web",
  "Salon",
  "Recommandation",
  "Achat liste",
  "Autre",
] as const;

export type ProspectSource = (typeof PROSPECT_SOURCES)[number];

// Schéma pour la création manuelle d'un prospect
export const prospectSchema = z.object({
  // === ENTREPRISE ===
  // Nom de l'entreprise (obligatoire)
  entreprise: z
    .string()
    .min(1, "Le nom de l'entreprise est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),

  // ID client existant (si sélectionné dans le combobox)
  clientId: z.string().optional(),

  // Informations entreprise complémentaires (optionnelles)
  secteurActivite: z
    .string()
    .max(100, "Le secteur ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),

  siteWeb: z
    .string()
    .max(200, "L'URL ne peut pas dépasser 200 caractères")
    .optional()
    .or(z.literal("")),

  telephoneEntreprise: z
    .string()
    .max(30, "Le téléphone ne peut pas dépasser 30 caractères")
    .optional()
    .or(z.literal("")),

  // === CONTACT ===
  // Nom du contact (obligatoire)
  nom: z
    .string()
    .min(1, "Le nom du contact est requis")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),

  // Prénom (optionnel)
  prenom: z
    .string()
    .max(100, "Le prénom ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),

  // Email (optionnel mais email OU téléphone requis)
  email: z
    .string()
    .email("Veuillez entrer un email valide")
    .optional()
    .or(z.literal("")),

  // Téléphone (optionnel mais email OU téléphone requis)
  telephone: z
    .string()
    .max(30, "Le téléphone ne peut pas dépasser 30 caractères")
    .optional()
    .or(z.literal("")),

  // Rôle / Poste (optionnel)
  role: z
    .string()
    .max(100, "Le rôle ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal("")),

  // Source du lead
  sourceLead: z.enum(PROSPECT_SOURCES, {
    errorMap: () => ({ message: "Veuillez sélectionner une source" }),
  }),

  // Notes prospection (optionnel)
  notesProspection: z
    .string()
    .max(5000, "Les notes ne peuvent pas dépasser 5000 caractères")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => {
    // Au moins email OU téléphone requis
    const hasEmail = data.email && data.email.trim() !== "";
    const hasPhone = data.telephone && data.telephone.trim() !== "";
    return hasEmail || hasPhone;
  },
  {
    message: "Email ou téléphone requis",
    path: ["telephone"], // Affiche l'erreur sur le champ téléphone
  }
);

export type ProspectFormData = z.infer<typeof prospectSchema>;

// Valeurs par défaut pour un nouveau prospect
export const prospectDefaultValues: Partial<ProspectFormData> = {
  // Entreprise
  entreprise: "",
  clientId: undefined,
  secteurActivite: "",
  siteWeb: "",
  telephoneEntreprise: "",
  // Contact
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  role: "",
  sourceLead: "Appel entrant",
  notesProspection: "",
};

// Schéma pour le résultat d'un appel
export const callResultSchema = z.object({
  // Résultat de l'appel ou du RDV
  resultat: z.enum([
    "Appelé - pas répondu",
    "Rappeler",
    "RDV planifié",
    "RDV effectué",
    "Reporter", // Action pour reporter un RDV (statut reste "RDV planifié")
    "Qualifié",
    "Non qualifié",
    "Perdu",
  ], {
    errorMap: () => ({ message: "Veuillez sélectionner un résultat" }),
  }),

  // Date de rappel/report (obligatoire si résultat = "Rappeler" ou "Reporter")
  dateRappel: z.string().optional(),

  // Notes de l'appel
  notes: z
    .string()
    .max(2000, "Les notes ne peuvent pas dépasser 2000 caractères")
    .optional()
    .or(z.literal("")),

  // Créer une interaction dans le CRM
  creerInteraction: z.boolean().default(true),
}).refine(
  (data) => {
    // Si résultat est "Rappeler" ou "Reporter", dateRappel est obligatoire
    if ((data.resultat === "Rappeler" || data.resultat === "Reporter") && !data.dateRappel) {
      return false;
    }
    return true;
  },
  {
    message: "La date est requise",
    path: ["dateRappel"],
  }
);

export type CallResultFormData = z.infer<typeof callResultSchema>;

// Valeurs par défaut pour le résultat d'appel
export const callResultDefaultValues: Partial<CallResultFormData> = {
  resultat: undefined,
  dateRappel: "",
  notes: "",
  creerInteraction: true,
};

// Schéma pour le mapping CSV
export const csvMappingSchema = z.object({
  // Colonnes mappées (clé = nom colonne CSV, valeur = champ CRM)
  colonneEntreprise: z.string().min(1, "Sélectionnez la colonne entreprise"),
  colonneNom: z.string().min(1, "Sélectionnez la colonne nom"),
  colonneEmail: z.string().min(1, "Sélectionnez la colonne email"),
  colonnePrenom: z.string().optional(),
  colonneTelephone: z.string().optional(),
  colonneSource: z.string().optional(),
  colonneNotes: z.string().optional(),
});

export type CsvMappingData = z.infer<typeof csvMappingSchema>;

// Schéma pour un lead importé (après mapping)
export const importedLeadSchema = z.object({
  entreprise: z.string().min(1),
  nom: z.string().min(1),
  email: z.string().email(),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  sourceLead: z.enum(PROSPECT_SOURCES).optional(),
  notesProspection: z.string().optional(),
});

export type ImportedLead = z.infer<typeof importedLeadSchema>;
