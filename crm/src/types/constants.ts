// CRM Axivity - Constantes et Enums Centralisés
// Single Source of Truth pour tous les statuts, types et labels

// =============================================================================
// CLIENT
// =============================================================================

export const CLIENT_TYPES = ["PME", "ETI", "Grand Compte", "Startup", "Association"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const CLIENT_STATUSES = ["Prospect", "Actif", "Inactif", "Churned"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

// =============================================================================
// OPPORTUNITES
// =============================================================================

export const OPPORTUNITY_STATUSES = [
  "Qualifié",
  "Proposition",
  "Négociation",
  "Gagné",
  "Perdu",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_STATUS_COLORS: Record<OpportunityStatus, string> = {
  Qualifié: "bg-blue-500",
  Proposition: "bg-purple-500",
  Négociation: "bg-amber-500",
  Gagné: "bg-green-500",
  Perdu: "bg-red-500",
};

// =============================================================================
// PROJETS
// =============================================================================

export const PROJECT_STATUSES = [
  "Cadrage",
  "En cours",
  "En pause",
  "Terminé",
  "Annulé",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  Cadrage: "bg-blue-500",
  "En cours": "bg-green-500",
  "En pause": "bg-amber-500",
  Terminé: "bg-gray-500",
  Annulé: "bg-red-500",
};

// =============================================================================
// TACHES
// =============================================================================

export const TASK_STATUSES = ["À faire", "En cours", "En revue", "Terminé"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["Basse", "Moyenne", "Haute", "Critique"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  Basse: "bg-gray-500",
  Moyenne: "bg-blue-500",
  Haute: "bg-amber-500",
  Critique: "bg-red-500",
};

// =============================================================================
// FACTURES
// =============================================================================

export const INVOICE_STATUSES = ["Brouillon", "Envoyé", "Payé", "Annulé", "En retard"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  Brouillon: "bg-gray-500",
  Envoyé: "bg-blue-500",
  Payé: "bg-green-500",
  Annulé: "bg-red-500",
  "En retard": "bg-amber-500",
};

// Types de facture (acompte, solde, unique)
export const FACTURE_TYPES = ["acompte", "solde", "unique"] as const;
export type FactureType = (typeof FACTURE_TYPES)[number];

export const FACTURE_TYPE_LABELS: Record<FactureType, string> = {
  acompte: "Acompte",
  solde: "Solde",
  unique: "Unique",
};

export const FACTURE_TYPE_COLORS: Record<FactureType, string> = {
  acompte: "bg-purple-500",
  solde: "bg-green-600",
  unique: "bg-gray-500",
};

// =============================================================================
// INTERACTIONS
// =============================================================================

export const INTERACTION_TYPES = [
  "Email",
  "Appel",
  "Réunion",
  "Note",
  "Autre",
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const INTERACTION_TYPE_ICONS: Record<InteractionType, string> = {
  Email: "Mail",
  Appel: "Phone",
  Réunion: "Calendar",
  Note: "FileText",
  Autre: "MoreHorizontal",
};

// =============================================================================
// PROSPECTION
// =============================================================================

export const PROSPECT_STATUSES = [
  "À appeler",
  "Appelé - pas répondu",
  "Rappeler",
  "RDV planifié",
  "RDV effectué",
  "Qualifié",
  "Non qualifié",
  "Perdu",
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const PROSPECT_STATUS_COLORS: Record<ProspectStatus, string> = {
  "À appeler": "bg-gray-500",
  "Appelé - pas répondu": "bg-amber-500",
  Rappeler: "bg-blue-500",
  "RDV planifié": "bg-purple-500",
  "RDV effectué": "bg-indigo-500",
  Qualifié: "bg-green-500",
  "Non qualifié": "bg-red-500",
  Perdu: "bg-red-700",
};

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

// Types de premier contact (création directe)
export const FIRST_CONTACT_TYPES = [
  "Appel",
  "Email",
  "LinkedIn",
  "Physique",
  "Autre",
] as const;
export type FirstContactType = (typeof FIRST_CONTACT_TYPES)[number];

// Statuts initiaux pour création directe
export const INITIAL_STATUTS = [
  "À appeler",
  "Rappeler",
  "RDV planifié",
  "RDV effectué",
  "Qualifié",
] as const;
export type InitialStatus = (typeof INITIAL_STATUTS)[number];

// Type de RDV
export const RDV_TYPES = ["Visio", "Présentiel"] as const;
export type RdvType = (typeof RDV_TYPES)[number];

// =============================================================================
// DEVIS
// =============================================================================

export const DEVIS_STATUSES = ["brouillon", "envoye", "accepte", "refuse", "expire"] as const;
export type DevisStatus = (typeof DEVIS_STATUSES)[number];

export const DEVIS_STATUS_LABELS: Record<DevisStatus, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

export const DEVIS_STATUS_COLORS: Record<DevisStatus, string> = {
  brouillon: "bg-gray-500",
  envoye: "bg-blue-500",
  accepte: "bg-green-500",
  refuse: "bg-red-500",
  expire: "bg-amber-500",
};

// =============================================================================
// EQUIPE
// =============================================================================

export const TEAM_ROLES = [
  "admin",
  "developpeur_nocode",
  "developpeur_automatisme",
  "commercial",
  "client",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Admin",
  developpeur_nocode: "Développeur NoCode",
  developpeur_automatisme: "Développeur Automatisme",
  commercial: "Commercial",
  client: "Client",
};

// =============================================================================
// LIFECYCLE STAGES (Contact Funnel)
// =============================================================================

export const LIFECYCLE_STAGES = [
  "Lead",
  "MQL",
  "SQL",
  "Opportunity",
  "Customer",
  "Evangelist",
  "Churned",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  Lead: "Lead",
  MQL: "MQL",
  SQL: "SQL",
  Opportunity: "Opportunité",
  Customer: "Client",
  Evangelist: "Ambassadeur",
  Churned: "Perdu",
};

// Note: Tailwind doesn't have bg-gold-*, using bg-amber-500 as closest match for Evangelist
export const LIFECYCLE_STAGE_COLORS: Record<LifecycleStage, string> = {
  Lead: "bg-gray-500",
  MQL: "bg-blue-500",
  SQL: "bg-indigo-500",
  Opportunity: "bg-purple-500",
  Customer: "bg-green-500",
  Evangelist: "bg-amber-500", // Spec says "Gold" - amber is closest Tailwind equivalent
  Churned: "bg-red-500",
};

// =============================================================================
// CONTACT ROLES (in Opportunities)
// =============================================================================

export const CONTACT_ROLES = [
  "Decideur",
  "Influenceur",
  "Utilisateur",
  "Participant",
] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  Decideur: "Décideur",
  Influenceur: "Influenceur",
  Utilisateur: "Utilisateur",
  Participant: "Participant",
};

// =============================================================================
// VALEURS PAR DEFAUT
// =============================================================================

export const DEFAULTS = {
  TVA_RATE: 0.20,
  CURRENCY: "EUR",
  LOCALE: "fr-FR",
  COUNTRY: "France",
  DATE_FORMAT: "dd/MM/yyyy",
} as const;
