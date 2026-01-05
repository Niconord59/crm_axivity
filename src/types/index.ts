// CRM Axivity - TypeScript Types
// Based on Supabase schema

// =============================================================================
// ENUMS & CONSTANTS - Imported from centralized constants
// =============================================================================

// Import for internal use
import type {
  ClientType as _ClientType,
  ClientStatus as _ClientStatus,
  OpportunityStatus as _OpportunityStatus,
  ProjectStatus as _ProjectStatus,
  TaskStatus as _TaskStatus,
  TaskPriority as _TaskPriority,
  InvoiceStatus as _InvoiceStatus,
  InteractionType as _InteractionType,
  ProspectStatus as _ProspectStatus,
  ProspectSource as _ProspectSource,
  FirstContactType as _FirstContactType,
  InitialStatus as _InitialStatus,
  RdvType as _RdvType,
  DevisStatus as _DevisStatus,
  TeamRole as _TeamRole,
} from "./constants";

// Re-export everything for external consumers
export {
  // Client
  CLIENT_TYPES,
  CLIENT_STATUSES,
  type ClientType,
  type ClientStatus,
  // Opportunites
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_COLORS,
  type OpportunityStatus,
  // Projets
  PROJECT_STATUSES,
  PROJECT_STATUS_COLORS,
  type ProjectStatus,
  // Taches
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_PRIORITY_COLORS,
  type TaskStatus,
  type TaskPriority,
  // Factures
  INVOICE_STATUSES,
  INVOICE_STATUS_COLORS,
  type InvoiceStatus,
  // Interactions
  INTERACTION_TYPES,
  INTERACTION_TYPE_ICONS,
  type InteractionType,
  // Prospection
  PROSPECT_STATUSES,
  PROSPECT_STATUS_COLORS,
  PROSPECT_SOURCES,
  FIRST_CONTACT_TYPES,
  INITIAL_STATUTS,
  RDV_TYPES,
  type ProspectStatus,
  type ProspectSource,
  type FirstContactType,
  type InitialStatus,
  type RdvType,
  // Devis
  DEVIS_STATUSES,
  DEVIS_STATUS_LABELS,
  DEVIS_STATUS_COLORS,
  type DevisStatus,
  // Equipe
  TEAM_ROLES,
  TEAM_ROLE_LABELS,
  type TeamRole,
  // Defaults
  DEFAULTS,
} from "./constants";

// Local type aliases for internal use in interfaces
type ClientStatus = _ClientStatus;
type OpportunityStatus = _OpportunityStatus;
type ProjectStatus = _ProjectStatus;
type TaskStatus = _TaskStatus;
type TaskPriority = _TaskPriority;
type InvoiceStatus = _InvoiceStatus;
type InteractionType = _InteractionType;
type ProspectStatus = _ProspectStatus;
type ProspectSource = _ProspectSource;
type RdvType = _RdvType;
type TeamRole = _TeamRole;

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
  telephone?: string;
  notes?: string;
  dateCreation?: string;
  // Billing / Address fields
  siret?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
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
  dateRdvPrevu?: string;
  typeRdv?: RdvType;
  lienVisio?: string;
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
  capaciteHebdo?: number;
  // Calculated fields (rollup/formula)
  heuresSemaine?: number;
  chargeActuelle?: number;
  // Linked records
  tachesAssignees?: string[];
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

export interface CatalogueService extends BaseEntity {
  nom: string;
  description?: string;
  prixUnitaire: number;
  unite: string;
  categorie?: string;
  actif: boolean;
}

// Alias pour compatibilité
export type Service = CatalogueService;

// =============================================================================
// T15 - LIGNES DE DEVIS
// =============================================================================

export interface LigneDevis extends BaseEntity {
  opportuniteId: string;
  serviceId?: string;
  description?: string;
  quantite: number;
  prixUnitaire: number;
  remisePourcent: number;
  // Calculated field (stored in DB)
  montantHT: number;
  // Denormalized for display
  serviceNom?: string;
  serviceCategorie?: string;
}

// =============================================================================
// DEVIS (QUOTE) DATA - For PDF Generation
// =============================================================================

export interface DevisCompanyInfo {
  nom: string;
  formeJuridique?: string;
  capital?: string;
  siret?: string;
  rcs?: string;
  tvaIntracommunautaire?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  logoUrl?: string;
  headerDevisUrl?: string;
  couleurPrincipale?: string;
}

export interface DevisData {
  numeroDevis: string;
  dateDevis: string;
  dateValidite: string;
  // Company info (from parametres_entreprise)
  entreprise?: DevisCompanyInfo;
  client: {
    nom: string;
    siret?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    pays?: string;
  };
  contact?: {
    nom: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    poste?: string;
  };
  opportunite: {
    nom: string;
    notes?: string;
  };
  lignes: LigneDevis[];
  totalHT: number;
  tva: number;
  totalTTC: number;
  conditionsPaiement: string;
}

// =============================================================================
// FACTURE DATA - For PDF Generation
// =============================================================================

export interface FactureCompanyInfo extends DevisCompanyInfo {
  iban?: string;
  bic?: string;
}

export interface FactureData {
  numeroFacture: string;
  dateEmission: string;
  dateEcheance: string;
  // Company info (from parametres_entreprise)
  entreprise?: FactureCompanyInfo;
  client: {
    nom: string;
    siret?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    pays?: string;
  };
  contact?: {
    nom: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    poste?: string;
  };
  objet: string;
  devisReference?: string;
  lignes: LigneDevis[];
  totalHT: number;
  tauxTva: number;
  tva: number;
  totalTTC: number;
  conditionsPaiement: string;
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
