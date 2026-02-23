// CRM Axivity - API Request Schemas
// Zod schemas for API request validation

import { z } from "zod";

// ============================================
// EMAIL
// ============================================

export const sendEmailSchema = z.object({
  to: z.string().email("Adresse email invalide"),
  subject: z.string().min(1, "Le sujet est requis"),
  body: z.string().min(1, "Le contenu est requis"),
  replyTo: z.string().email().optional(),
});

export type SendEmailRequest = z.infer<typeof sendEmailSchema>;

// ============================================
// CALENDAR
// ============================================

export const createCalendarEventSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  startDateTime: z.string().datetime("Date de début invalide"),
  endDateTime: z.string().datetime("Date de fin invalide"),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  conferenceType: z.enum(["google_meet", "teams"]).optional(),
});

export type CreateCalendarEventRequest = z.infer<typeof createCalendarEventSchema>;

// ============================================
// DEVIS
// ============================================

export const generateDevisSchema = z.object({
  opportuniteId: z.string().uuid("ID opportunité invalide"),
});

export type GenerateDevisRequest = z.infer<typeof generateDevisSchema>;

export const previewDevisSchema = z.object({
  opportuniteId: z.string().uuid("ID opportunité invalide"),
});

export type PreviewDevisRequest = z.infer<typeof previewDevisSchema>;

export const sendDevisSchema = z.object({
  devisId: z.string().uuid("ID devis invalide"),
  recipientEmail: z.string().email("Adresse email invalide").optional(),
  customMessage: z.string().optional(),
});

export type SendDevisRequest = z.infer<typeof sendDevisSchema>;

// ============================================
// FACTURES
// ============================================

export const generateFactureSchema = z.object({
  devisId: z.string().uuid("ID devis invalide"),
  typeFacture: z.enum(["acompte", "solde", "unique"]).optional().default("unique"),
  pourcentageAcompte: z.number().min(0).max(100).optional(),
  factureParentId: z.string().uuid("ID facture parent invalide").optional(),
  montantTotalProjet: z.number().min(0).optional(),
});

export type GenerateFactureRequest = z.infer<typeof generateFactureSchema>;

export const sendRelanceSchema = z.object({
  factureId: z.string().uuid("ID facture invalide"),
});

export type SendRelanceRequest = z.infer<typeof sendRelanceSchema>;

// ============================================
// BULK EMAIL (Templates + Contacts)
// ============================================

export const sendBulkEmailSchema = z.object({
  contactIds: z.array(z.string().uuid("ID contact invalide")).min(1, "Au moins un contact requis"),
  objet: z.string().min(1, "Le sujet est requis"),
  contenu: z.string().min(1, "Le contenu est requis"),
});

export type SendBulkEmailRequest = z.infer<typeof sendBulkEmailSchema>;

// ============================================
// PLACES (Google Places)
// ============================================

export const searchPlacesSchema = z.object({
  query: z.string().min(1, "La requête est requise"),
  limit: z.number().int().min(1).max(10).optional().default(5),
});

export type SearchPlacesRequest = z.infer<typeof searchPlacesSchema>;
