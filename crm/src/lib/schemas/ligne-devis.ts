import { z } from "zod";

export const ligneDevisSchema = z.object({
  serviceId: z.string().optional().or(z.literal("")),
  description: z
    .string()
    .min(1, "La description est requise")
    .max(500, "La description ne peut pas dépasser 500 caractères"),
  quantite: z
    .number({ required_error: "La quantité est requise" })
    .min(0.01, "La quantité doit être supérieure à 0"),
  prixUnitaire: z
    .number({ required_error: "Le prix unitaire est requis" })
    .min(0, "Le prix doit être positif ou nul"),
  remisePourcent: z
    .number()
    .min(0, "La remise ne peut pas être négative")
    .max(100, "La remise ne peut pas dépasser 100%")
    .default(0),
});

export type LigneDevisFormData = z.infer<typeof ligneDevisSchema>;

// Schema for creating a new ligne (requires opportuniteId)
export const createLigneDevisSchema = ligneDevisSchema.extend({
  opportuniteId: z.string().uuid("ID d'opportunité invalide"),
});

export type CreateLigneDevisFormData = z.infer<typeof createLigneDevisSchema>;
