# CRM Axivity - Data Models Reference

> Generated: 2026-01-06 | Version: 1.0.0

## Overview

The CRM Axivity data layer consists of 21 PostgreSQL tables managed through Supabase. All entities are defined as TypeScript interfaces in `src/types/index.ts` with centralized enums in `src/types/constants.ts`.

---

## Type System Architecture

```
src/types/
├── constants.ts       # Centralized enums (SSOT for all status values)
└── index.ts           # TypeScript interfaces + re-exports from constants
```

### Base Entity

All entities extend `BaseEntity`:

```typescript
interface BaseEntity {
  id: string;           // UUID primary key
  createdTime?: string; // ISO 8601 timestamp
}
```

---

## Core CRM Entities

### T1 - Client

Business entity representing a company or organization.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `nom` | string | Company name (required) |
| `secteurActivite` | string | Industry sector |
| `statut` | ClientStatus | Prospect / Actif / Inactif / Churned |
| `siteWeb` | string | Website URL |
| `telephone` | string | Phone number |
| `notes` | string | Internal notes |
| `dateCreation` | string | Creation date |
| `siret` | string | French business ID (14 digits) |
| `adresse` | string | Street address |
| `codePostal` | string | Postal code |
| `ville` | string | City |
| `pays` | string | Country (default: France) |
| `santeClient` | string | Calculated health indicator |
| `caTotal` | number | Total revenue (calculated) |

**Relationships**:
- Has many `Contact`
- Has many `Projet`
- Has many `Opportunite`
- Has many `Facture`

---

### T2 - Contact

Individual person associated with a client company.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `nom` | string | Last name (required) |
| `prenom` | string | First name |
| `email` | string | Email address |
| `telephone` | string | Phone number |
| `poste` | string | Job title |
| `estPrincipal` | boolean | Primary contact flag |
| `notes` | string | Internal notes |
| `linkedin` | string | LinkedIn profile URL |
| `statutProspection` | ProspectStatus | Prospection status |
| `dateRappel` | string | Callback date |
| `dateRdvPrevu` | string | Scheduled meeting date |
| `typeRdv` | RdvType | Visio / Presentiel |
| `lienVisio` | string | Video call link |
| `sourceLead` | ProspectSource | Lead source |
| `notesProspection` | string | Prospection notes |

**Relationships**:
- Belongs to `Client`
- Has many `Interaction`

---

### T3 - Opportunite

Sales opportunity in the commercial pipeline.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `nom` | string | Opportunity name (required) |
| `statut` | OpportunityStatus | Pipeline stage |
| `valeurEstimee` | number | Estimated value in EUR |
| `probabilite` | number | Win probability (0-100) |
| `dateClotureEstimee` | string | Expected close date |
| `source` | string | Opportunity source |
| `notes` | string | Internal notes |
| `valeurPonderee` | number | Weighted value (calculated) |

**Relationships**:
- Belongs to `Client`
- Belongs to `Contact`
- Has many `LigneDevis`
- Has one `Projet` (when converted)

---

### T4 - Projet

Client project for service delivery.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `idProjet` | number | Sequential project ID |
| `briefProjet` | string | Project description |
| `nomProjet` | string | Full name (formula: P{id} - {brief}) |
| `statut` | ProjectStatus | Cadrage / En cours / En pause / Termine / Annule |
| `dateDebut` | string | Start date |
| `dateFinPrevue` | string | Planned end date |
| `dateFinReelle` | string | Actual end date |
| `budget` | number | Budget in EUR |
| `notes` | string | Internal notes |
| `priorite` | TaskPriority | Priority level |
| `pourcentageTachesTerminees` | number | % tasks completed (calculated) |
| `budgetTempsConsomme` | number | Time budget consumed (calculated) |
| `margeBrute` | number | Gross margin (calculated) |

**Relationships**:
- Belongs to `Client`
- Belongs to `Opportunite`
- Has many `Tache`
- Has many `Facture`
- Has many `MembreEquipe`

---

### T5 - Tache

Task within a project.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `nom` | string | Task name (required) |
| `description` | string | Task description |
| `statut` | TaskStatus | A faire / En cours / En revue / Termine |
| `priorite` | TaskPriority | Basse / Moyenne / Haute / Critique |
| `dateEcheance` | string | Due date |
| `heuresEstimees` | number | Estimated hours |
| `heuresReelles` | number | Actual hours spent |
| `dateCreation` | string | Creation date |
| `dateTerminee` | string | Completion date |
| `ordre` | number | Display order |
| `estEnRetard` | boolean | Overdue flag (calculated) |

**Relationships**:
- Belongs to `Projet`
- Belongs to `MembreEquipe`
- Has many `JournalTemps`

---

### T7 - Facture

Invoice for client billing.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `numero` | string | Invoice number (FAC-YYYY-NNN) |
| `statut` | InvoiceStatus | Brouillon / Envoye / Paye / Annule / En retard |
| `montantHT` | number | Amount before tax |
| `montantTTC` | number | Amount with tax (calculated: HT * 1.20) |
| `dateEmission` | string | Issue date |
| `dateEcheance` | string | Due date |
| `datePaiement` | string | Payment date |
| `niveauRelance` | number | Reminder level (0-3, calculated) |
| `niveauRelanceEnvoye` | number | Last reminder sent |
| `dateDerniereRelance` | string | Last reminder date |

**Relationships**:
- Belongs to `Projet`
- Belongs to `Client`

---

### T8 - Interaction

Communication record with a contact.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `objet` | string | Subject (required) |
| `type` | InteractionType | Email / Appel / Reunion / Note / Autre |
| `date` | string | Interaction date |
| `resume` | string | Summary |
| `prochaineTache` | string | Next action |

**Relationships**:
- Belongs to `Contact`
- Belongs to `Client`
- Belongs to `MembreEquipe`

---

## Sales & Quoting Entities

### T14 - CatalogueService

Service catalog for quote line items.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `nom` | string | Service name (required) |
| `description` | string | Service description |
| `prixUnitaire` | number | Unit price in EUR (required) |
| `unite` | string | Unit (e.g., "jour", "forfait") (required) |
| `categorie` | string | Category |
| `actif` | boolean | Active flag (required) |

---

### T15 - LigneDevis

Quote line item linked to an opportunity.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `opportuniteId` | UUID | Parent opportunity (required) |
| `serviceId` | UUID | Linked service |
| `description` | string | Custom description |
| `quantite` | number | Quantity (required) |
| `prixUnitaire` | number | Unit price (required) |
| `remisePourcent` | number | Discount percentage (required) |
| `montantHT` | number | Line total before tax (calculated) |
| `serviceNom` | string | Denormalized service name |
| `serviceCategorie` | string | Denormalized category |

---

### Devis (Quote)

Database table for quote records with sequential numbering.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `numero` | string | Quote number (DEV-YYYY-NNN) |
| `statut` | DevisStatus | brouillon / envoye / accepte / refuse / expire |
| `opportunite_id` | UUID | Parent opportunity |
| `montant_ht` | number | Total before tax |
| `montant_ttc` | number | Total with tax |
| `date_creation` | string | Creation date |
| `date_envoi` | string | Send date |
| `date_validite` | string | Validity date |
| `pdf_url` | string | Stored PDF URL |
| `facture_id` | UUID | Linked invoice (when converted) |

---

## Team & Resource Entities

### T10 - MembreEquipe

Team member with workload tracking.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `nom` | string | Full name (required) |
| `email` | string | Email address |
| `role` | TeamRole | User role |
| `capaciteHebdo` | number | Weekly capacity in hours |
| `heuresSemaine` | number | Current week hours (calculated) |
| `chargeActuelle` | number | Current workload % (calculated) |

**Relationships**:
- Has many `Tache`
- Has many `Accomplissement`

---

### T9 - JournalTemps

Time tracking entry.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `date` | string | Entry date |
| `heures` | number | Hours spent |
| `description` | string | Work description |
| `facturable` | boolean | Billable flag |

**Relationships**:
- Belongs to `Tache`
- Belongs to `MembreEquipe`
- Belongs to `Projet`

---

## Enums Reference

All enums are centralized in `src/types/constants.ts`.

### Client Statuses

```typescript
const CLIENT_STATUSES = ["Prospect", "Actif", "Inactif", "Churned"] as const;
```

### Opportunity Statuses (Pipeline Stages)

```typescript
const OPPORTUNITY_STATUSES = [
  "Qualifie",      // Blue
  "Proposition",   // Purple
  "Negociation",   // Amber
  "Gagne",         // Green
  "Perdu",         // Red
] as const;
```

### Project Statuses

```typescript
const PROJECT_STATUSES = [
  "Cadrage",       // Blue
  "En cours",      // Green
  "En pause",      // Amber
  "Termine",       // Gray
  "Annule",        // Red
] as const;
```

### Task Statuses

```typescript
const TASK_STATUSES = ["A faire", "En cours", "En revue", "Termine"] as const;
```

### Task Priorities

```typescript
const TASK_PRIORITIES = ["Basse", "Moyenne", "Haute", "Critique"] as const;
```

### Invoice Statuses

```typescript
const INVOICE_STATUSES = ["Brouillon", "Envoye", "Paye", "Annule", "En retard"] as const;
```

### Prospect Statuses

```typescript
const PROSPECT_STATUSES = [
  "A appeler",
  "Appele - pas repondu",
  "Rappeler",
  "RDV planifie",
  "RDV effectue",
  "Qualifie",
  "Non qualifie",
  "Perdu",
] as const;
```

### Devis Statuses

```typescript
const DEVIS_STATUSES = ["brouillon", "envoye", "accepte", "refuse", "expire"] as const;
```

### Team Roles

```typescript
const TEAM_ROLES = [
  "admin",
  "developpeur_nocode",
  "developpeur_automatisme",
  "commercial",
  "client",
] as const;
```

---

## PDF Data Transfer Objects

### DevisData

Used for quote PDF generation via `/api/devis/generate`.

```typescript
interface DevisData {
  numeroDevis: string;
  dateDevis: string;
  dateValidite: string;
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
```

### FactureData

Used for invoice PDF generation via `/api/factures/generate`.

```typescript
interface FactureData {
  numeroFacture: string;
  dateEmission: string;
  dateEcheance: string;
  entreprise?: FactureCompanyInfo;
  client: {...};
  contact?: {...};
  objet: string;
  devisReference?: string;
  lignes: LigneDevis[];
  totalHT: number;
  tauxTva: number;
  tva: number;
  totalTTC: number;
  conditionsPaiement: string;
}
```

---

## Dashboard Types

```typescript
interface DashboardKPIs {
  caTotal: number;           // Total revenue
  caMois: number;            // Monthly revenue
  caEvolution: number;       // Revenue evolution %
  projetsActifs: number;     // Active projects count
  projetsEnRetard: number;   // Overdue projects count
  tauxSuccesOpp: number;     // Win rate %
  opportunitesEnCours: number;
  valeurPipeline: number;    // Pipeline value
  facturesImpayees: number;  // Unpaid invoices count
  montantImpayes: number;    // Unpaid amount
  satisfactionMoyenne: number;
}
```

---

## API Response Types

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset?: string;
  hasMore: boolean;
}

interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
```

---

## Entity Relationship Diagram

```
                    ┌─────────────────┐
                    │   T1 - Clients  │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────────┐  ┌──────────┐
    │ T2-Contacts│     │T3-Opportunites│  │T4-Projets│
    └─────┬────┘      └───────┬──────┘  └────┬─────┘
          │                   │               │
          │                   │               │
          ▼                   ▼               ▼
    ┌──────────┐      ┌──────────────┐  ┌──────────┐
    │T8-Interactions│  │T15-LignesDevis│ │T5-Taches │
    └──────────┘      └──────────────┘  └────┬─────┘
                             │                │
                             ▼                ▼
                      ┌──────────────┐  ┌──────────────┐
                      │ T14-Services │  │T9-JournalTemps│
                      └──────────────┘  └──────────────┘
                                              │
                                              ▼
                                        ┌──────────┐
                                        │T10-Equipe│
                                        └──────────┘
```

