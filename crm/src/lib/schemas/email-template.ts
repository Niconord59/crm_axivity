// CRM Axivity - Email Template Schema
// Zod validation for email template forms

import { z } from "zod";

export const emailTemplateSchema = z.object({
  nom: z.string().min(1, "Le nom du template est requis").max(200),
  objet: z.string().min(1, "L'objet de l'email est requis").max(500),
  contenu: z.string().min(1, "Le contenu est requis").max(10000),
  variables: z.array(z.string()),
});

export type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

export const emailTemplateDefaultValues: EmailTemplateFormData = {
  nom: "",
  objet: "",
  contenu: "",
  variables: [],
};

/**
 * Available variables for email templates
 * These are replaced with actual contact data when sending
 */
export const AVAILABLE_VARIABLES = [
  { key: "prenom", label: "Prénom", description: "Prénom du contact" },
  { key: "nom", label: "Nom", description: "Nom du contact" },
  { key: "email", label: "Email", description: "Email du contact" },
  { key: "telephone", label: "Téléphone", description: "Téléphone du contact" },
  { key: "poste", label: "Poste", description: "Poste du contact" },
  { key: "entreprise", label: "Entreprise", description: "Nom du client/entreprise" },
] as const;
