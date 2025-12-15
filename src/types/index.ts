// CRM Axivity - TypeScript Types
// Based on Airtable Base: appEf6JtWFdfLwsU6

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export const CLIENT_TYPES = ["PME", "ETI", "Grand Compte", "Startup", "Association"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const CLIENT_STATUSES = ["Prospect", "Actif", "Inactif", "Churned"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const OPPORTUNITY_STATUSES = [
  "Lead",
  "Qualifié",
  "Proposition",
  "Négociation",
  "Gagné",
  "Perdu",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const PROJECT_STATUSES = [
  "Cadrage",
  "En cours",
  "En pause",
  "Terminé",
  "Annulé",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = ["À faire", "En cours", "En revue", "Terminé"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["Basse", "Moyenne", "Haute", "Critique"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const INVOICE_STATUSES = ["Brouillon", "Envoyé", "Payé", "Annulé"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INTERACTION_TYPES = [
  "Email",
  "Appel",
  "Réunion",
  "Note",
  "Autre",
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

// Prospection
export const PROSPECT_STATUSES = [
  "À appeler",
  "Appelé - pas répondu",
  "Rappeler",
  "Qualifié",
  "Non qualifié",
  "Perdu",
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const PROSPECT_SOURCES = [
  "LinkedIn",
  "Site web",
  "Salon",
  "Recommandation",
  "Achat liste",
  "Autre",
] as const;
export type ProspectSource = (typeof PROSPECT_SOURCES)[number];

export const TEAM_ROLES = [
  "Direction",
  "Chef de Projet",
  "Développeur",
  "Designer",
  "Commercial",
  "Support",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

// =============================================================================
// BASE ENTITY INTERFACE
// =============================================================================

export interface BaseEntity {
  id: string;
  createdTime?: string;
}

// =============================================================================
// T1 - CLIENTS
// =============================================================================

export interface Client extends BaseEntity {
  nom: string;
  secteurActivite?: string;
  statut?: ClientStatus;
  siteWeb?: string;
  notes?: string;
  dateCreation?: string;
  // Calculated fields
  santeClient?: string;
  caTotal?: number;
  // Linked records (IDs)
  contacts?: string[];
  projets?: string[];
  opportunites?: string[];
  factures?: string[];
}

// =============================================================================
// T2 - CONTACTS
// =============================================================================

export interface Contact extends BaseEntity {
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  poste?: string;
  estPrincipal?: boolean;
  notes?: string;
  linkedin?: string;
  // Prospection fields
  statutProspection?: ProspectStatus;
  dateRappel?: string;
  sourceLead?: ProspectSource;
  notesProspection?: string;
  // Linked records
  client?: string[];
  interactions?: string[];
}

// =============================================================================
// T3 - OPPORTUNITES
// =============================================================================

export interface Opportunite extends BaseEntity {
  nom: string;
  statut?: OpportunityStatus;
  valeurEstimee?: number;
  probabilite?: number;
  dateClotureEstimee?: string;
  source?: string;
  notes?: string;
  dateCreation?: string;
  // Calculated fields
  valeurPonderee?: number;
  // Linked records
  client?: string[];
  contact?: string[];
  lignesDevis?: string[];
  projetCree?: string[];
}

// =============================================================================
// T4 - PROJETS
// =============================================================================

export interface Projet extends BaseEntity {
  idProjet?: number;
  briefProjet?: string;
  nomProjet?: string; // Formula field
  statut?: ProjectStatus;
  dateDebut?: string;
  dateFinPrevue?: string;
  dateFinReelle?: string;
  budget?: number;
  notes?: string;
  priorite?: TaskPriority;
  // Calculated fields
  pourcentageTachesTerminees?: number;
  budgetTempsConsomme?: number;
  margeBrute?: number;
  totalHeuresEstimees?: number;
  totalHeuresPassees?: number;
  montantTotalFacture?: number;
  coutInterneEstime?: number;
  nbTaches?: number;
  nbTachesTerminees?: number;
  // Linked records
  client?: string[];
  opportunite?: string[];
  taches?: string[];
  factures?: string[];
  equipe?: string[];
  feedbacks?: string[];
}

// =============================================================================
// T5 - TACHES
// =============================================================================

export interface Tache extends BaseEntity {
  nom: string;
  description?: string;
  statut?: TaskStatus;
  priorite?: TaskPriority;
  dateEcheance?: string;
  heuresEstimees?: number;
  heuresReelles?: number;
  dateCreation?: string;
  dateTerminee?: string;
  ordre?: number;
  // Calculated fields
  estEnRetard?: boolean;
  // Linked records
  projet?: string[];
  membreEquipe?: string[];
  journalTemps?: string[];
}

// =============================================================================
// T6 - MODELES DE TACHES
// =============================================================================

export interface ModeleTache extends BaseEntity {
  nom: string;
  description?: string;
  heuresEstimees?: number;
  categorie?: string;
  ordre?: number;
}

// =============================================================================
// T7 - FACTURES
// =============================================================================

export interface Facture extends BaseEntity {
  numero?: string;
  statut?: InvoiceStatus;
  montantHT?: number;
  montantTTC?: number; // Formula field
  dateEmission?: string;
  dateEcheance?: string;
  datePaiement?: string;
  notes?: string;
  // Relance fields
  niveauRelance?: number; // Formula: 0, 1, 2, 3
  niveauRelanceEnvoye?: number;
  dateDerniereRelance?: string;
  // Linked records
  projet?: string[];
  client?: string[];
}

// =============================================================================
// T8 - INTERACTIONS
// =============================================================================

export interface Interaction extends BaseEntity {
  objet: string;
  type?: InteractionType;
  date?: string;
  resume?: string;
  prochaineTache?: string;
  // Linked records
  contact?: string[];
  client?: string[];
  membreEquipe?: string[];
}

// =============================================================================
// T9 - JOURNAL DE TEMPS
// =============================================================================

export interface JournalTemps extends BaseEntity {
  date?: string;
  heures?: number;
  description?: string;
  facturable?: boolean;
  // Linked records
  tache?: string[];
  membreEquipe?: string[];
  projet?: string[];
}

// =============================================================================
// T10 - EQUIPE
// =============================================================================

export interface MembreEquipe extends BaseEntity {
  nom: string;
  email?: string;
  role?: TeamRole;
  actif?: boolean;
  tauxHoraire?: number;
  capaciteHebdo?: number;
  avatar?: { url: string; filename: string }[];
  telephone?: string;
  // Calculated fields
  heuresSemaine?: number;
  chargeActuelle?: number;
  // Linked records
  tachesAssignees?: string[];
  projetsParticipant?: string[];
  accomplissements?: string[];
}

// =============================================================================
// T11 - CONNAISSANCES
// =============================================================================

export interface Connaissance extends BaseEntity {
  titre: string;
  contenu?: string;
  categorie?: string;
  tags?: string[];
  dateCreation?: string;
  dateMiseAJour?: string;
  // Linked records
  projet?: string[];
  auteur?: string[];
}

// =============================================================================
// T12 - OBJECTIFS
// =============================================================================

export interface Objectif extends BaseEntity {
  nom: string;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  progression?: number;
  // Linked records
  resultats?: string[];
}

// =============================================================================
// T13 - RESULTATS CLES
// =============================================================================

export interface ResultatCle extends BaseEntity {
  nom: string;
  valeurCible?: number;
  valeurActuelle?: number;
  unite?: string;
  // Calculated fields
  progression?: number;
  // Linked records
  objectif?: string[];
  projet?: string[];
}

// =============================================================================
// T14 - CATALOGUE DE SERVICES
// =============================================================================

export interface Service extends BaseEntity {
  nom: string;
  description?: string;
  prixUnitaire?: number;
  unite?: string;
  categorie?: string;
  actif?: boolean;
}

// =============================================================================
// T15 - LIGNES DE DEVIS
// =============================================================================

export interface LigneDevis extends BaseEntity {
  quantite?: number;
  prixUnitaire?: number;
  remise?: number;
  // Calculated fields
  montantHT?: number;
  // Linked records
  opportunite?: string[];
  service?: string[];
}

// =============================================================================
// T16 - FEEDBACK CLIENT
// =============================================================================

export interface FeedbackClient extends BaseEntity {
  note?: number;
  commentaire?: string;
  dateReponse?: string;
  // Linked records
  projet?: string[];
  client?: string[];
}

// =============================================================================
// T17 - PARTENAIRES & FREELANCES
// =============================================================================

export interface Partenaire extends BaseEntity {
  nom: string;
  type?: "Partenaire" | "Freelance";
  specialite?: string;
  email?: string;
  telephone?: string;
  tauxJournalier?: number;
  notes?: string;
  actif?: boolean;
}

// =============================================================================
// T20 - ACCOMPLISSEMENTS
// =============================================================================

export interface Accomplissement extends BaseEntity {
  titre: string;
  description?: string;
  date?: string;
  categorie?: string;
  // Linked records
  membreEquipe?: string[];
}

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface DashboardKPIs {
  caTotal: number;
  caMois: number;
  caEvolution: number;
  projetsActifs: number;
  projetsEnRetard: number;
  tauxSuccesOpp: number;
  opportunitesEnCours: number;
  valeurPipeline: number;
  facturesImpayees: number;
  montantImpayes: number;
  satisfactionMoyenne: number;
}

export interface ProjectSummary {
  id: string;
  nom: string;
  client: string;
  statut: ProjectStatus;
  progression: number;
  dateFinPrevue: string;
  estEnRetard: boolean;
}

export interface OpportunitySummary {
  id: string;
  nom: string;
  client: string;
  statut: OpportunityStatus;
  valeur: number;
  probabilite: number;
  dateClotureEstimee: string;
}

export interface TaskSummary {
  id: string;
  nom: string;
  projet: string;
  priorite: TaskPriority;
  dateEcheance: string;
  estEnRetard: boolean;
  responsable?: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset?: string;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
