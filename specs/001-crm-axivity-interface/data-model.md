# Data Model: Interface Web CRM Axivity

**Feature**: 001-crm-axivity-interface
**Date**: 2025-12-14

## Overview

Ce document décrit le modèle de données TypeScript pour l'interface CRM Axivity. Les types correspondent aux tables Airtable existantes et incluent les champs calculés (rollups/formulas) en lecture seule.

## Airtable Table IDs

```typescript
// lib/airtable-tables.ts
export const AIRTABLE_BASE_ID = 'appEf6JtWFdfLwsU6';

export const TABLES = {
  CLIENTS: 'tbljVwWGbg2Yq9toR',
  CONTACTS: 'tblNHBh9qBi6OeFca',
  OPPORTUNITES: 'tbl8QiX8vGLQfRu0G',
  PROJETS: 'tblwNbd9Lk8SxixAI',
  TACHES: 'tbl6x2Ju4HJyh8SW2',
  MODELES_TACHES: 'tblhOmJ1223G97l3k',
  FACTURES: 'tbl0d2o8Df9Sj827M',
  INTERACTIONS: 'tblUoIhmQVr3ie5BQ',
  JOURNAL_TEMPS: 'tblPFfQLwtEbp8PoG',
  EQUIPE: 'tblozWfDZEFW3Nkwv',
  CONNAISSANCES: 'tblizxKK7FJsHuWnU',
  OBJECTIFS: 'tblFhPGAqSaXSJZ0e',
  RESULTATS_CLES: 'tbllcCCF5blNA8FQ6',
  CATALOGUE_SERVICES: 'tbl7GlDVGVyuKM1Sx',
  LIGNES_DEVIS: 'tblDKpxirY53hAO8k',
  FEEDBACK_CLIENT: 'tbl9I3B5xqIy5Gcrt',
  PARTENAIRES: 'tblJfPLFKJyCg23Az',
  CHANGELOG: 'tblx1zcTUoahNDAgn',
  SCENARIOS: 'tblU8SpVot0pxbosk',
  ACCOMPLISSEMENTS: 'tblBEg5xbIEwib9Eo',
  DEMANDES_EVOLUTION: 'tblaHSPKYf4r3RbNF',
} as const;
```

## Core Entities

### Client (T1)

```typescript
// types/client.ts

export type ClientStatut = 'Prospect' | 'Actif' | 'Ancien' | 'En pause';

export interface Client {
  id: string;                          // Airtable Record ID
  nomClient: string;                   // Nom du Client (primary field)
  statut: ClientStatut;                // Statut
  dateCreation: string;                // Date de Création (ISO date)

  // Relations (array of Record IDs)
  contacts: string[];                  // Lien vers T2 Contacts
  projets: string[];                   // Lien vers T4 Projets
  opportunites: string[];              // Lien vers T3 Opportunités

  // Champs calculés (lecture seule)
  caTotalEncaisse?: number;            // Rollup: somme budgets projets terminés
  santeClient?: string;                // Formula: "À relancer" si >90j sans interaction
  dernierContact?: string;             // Lookup: date dernière interaction
}

export interface ClientCreate {
  nomClient: string;
  statut: ClientStatut;
}

export interface ClientUpdate {
  nomClient?: string;
  statut?: ClientStatut;
}
```

### Contact (T2)

```typescript
// types/client.ts (suite)

export interface Contact {
  id: string;
  nomComplet: string;                  // Nom Complet (primary field)
  email?: string;                      // Email
  telephone?: string;                  // Téléphone
  role?: string;                       // Rôle (CEO, Chef de projet, etc.)

  // Relations
  client: string;                      // Lien vers T1 Client (single)

  // Lookups
  nomClient?: string;                  // Lookup: nom du client
}

export interface ContactCreate {
  nomComplet: string;
  client: string;
  email?: string;
  telephone?: string;
  role?: string;
}
```

### Opportunité (T3)

```typescript
// types/opportunity.ts

export type OpportuniteStatut =
  | 'Lead'
  | 'Qualifié'
  | 'Proposition envoyée'
  | 'Négociation'
  | 'Gagnée'
  | 'Perdue';

export interface Opportunite {
  id: string;
  nomOpportunite: string;              // Nom de l'Opportunité (primary field)
  statut: OpportuniteStatut;           // Statut (pipeline stage)
  valeurEstimee: number;               // Valeur Estimée (€)
  probabilite: number;                 // Probabilité (0-1)
  dateClotureEstimee?: string;         // Date de Clôture Estimée (ISO date)
  notes?: string;                      // Notes

  // Relations
  client: string;                      // Lien vers T1 Client
  projetCree?: string;                 // Lien vers T4 Projet (après conversion)

  // Champs calculés (lecture seule)
  valeurPonderee?: number;             // Formula: valeurEstimee * probabilite
  nomClient?: string;                  // Lookup: nom du client
}

export interface OpportuniteCreate {
  nomOpportunite: string;
  client: string;
  statut: OpportuniteStatut;
  valeurEstimee: number;
  probabilite: number;
  dateClotureEstimee?: string;
  notes?: string;
}

export interface OpportuniteUpdate {
  nomOpportunite?: string;
  statut?: OpportuniteStatut;
  valeurEstimee?: number;
  probabilite?: number;
  dateClotureEstimee?: string;
  notes?: string;
}
```

### Projet (T4)

```typescript
// types/project.ts

export type ProjetStatut =
  | 'En attente'
  | 'Planification'
  | 'En cours'
  | 'En revue'
  | 'Terminé'
  | 'Facturé';

export interface Projet {
  id: string;
  nomProjet: string;                   // Nom du Projet (primary field ou formula)
  statut: ProjetStatut;                // Statut
  budgetFinal: number;                 // Budget Final (€)
  dateDebut?: string;                  // Date de Début (ISO date)
  dateFinPrevue?: string;              // Date de Fin Prévue (ISO date)
  dateFinReelle?: string;              // Date Fin Réelle (ISO date)
  notes?: string;                      // Notes

  // Relations
  client: string;                      // Lien vers T1 Client
  opportunites?: string[];             // Lien vers T3 Opportunités (bidirectionnel)
  taches: string[];                    // Lien vers T5 Tâches
  factures?: string[];                 // Lien vers T7 Factures

  // Champs calculés (lecture seule)
  pourcentageTachesTerminees?: number; // Rollup/Formula: nb terminées / nb total
  retardJours?: number;                // Formula: jours de retard si applicable
  nomClient?: string;                  // Lookup: nom du client
  nbTaches?: number;                   // Rollup: count tâches
  nbTachesTerminees?: number;          // Rollup: count tâches terminées
  totalHeuresPassees?: number;         // Rollup: depuis Journal de Temps
  margeBrute?: number;                 // Formula: montant facturé - coût interne
}

export interface ProjetCreate {
  nomProjet: string;
  client: string;
  statut: ProjetStatut;
  budgetFinal: number;
  dateDebut?: string;
  dateFinPrevue?: string;
  notes?: string;
}

export interface ProjetUpdate {
  nomProjet?: string;
  statut?: ProjetStatut;
  budgetFinal?: number;
  dateDebut?: string;
  dateFinPrevue?: string;
  dateFinReelle?: string;
  notes?: string;
}
```

### Tâche (T5)

```typescript
// types/project.ts (suite)

export type TacheStatut = 'À faire' | 'En cours' | 'En attente de validation' | 'Terminée';
export type TachePriorite = 'Haute' | 'Moyenne' | 'Basse';

export interface Tache {
  id: string;
  nomTache: string;                    // Nom de la Tâche (primary field)
  statut: TacheStatut;                 // Statut
  priorite: TachePriorite;             // Priorité
  dateEcheance?: string;               // Date d'Échéance (ISO date)

  // Relations
  projet: string;                      // Lien vers T4 Projet
  membreEquipe?: string;               // Lien vers T10 Équipe (pour récupérer email)

  // Lookups
  nomProjet?: string;                  // Lookup: nom du projet
  nomClient?: string;                  // Lookup: nom du client (via projet)
  nomResponsable?: string;             // Lookup: nom du membre équipe
  emailResponsable?: string;           // Lookup: email du membre équipe

  // Champs calculés
  enRetard?: boolean;                  // Formula: dateEcheance < today && statut != Terminée
}

export interface TacheCreate {
  nomTache: string;
  projet: string;
  statut: TacheStatut;
  priorite: TachePriorite;
  dateEcheance?: string;
  membreEquipe?: string;
}

export interface TacheUpdate {
  nomTache?: string;
  statut?: TacheStatut;
  priorite?: TachePriorite;
  dateEcheance?: string;
  membreEquipe?: string;
}
```

### Facture (T7)

```typescript
// types/invoice.ts

export type FactureStatut = 'Brouillon' | 'Envoyée' | 'Payée' | 'Annulée';
export type NiveauRelance = 0 | 1 | 2 | 3;

export interface Facture {
  id: string;
  numeroFacture: string;               // Numéro Facture (primary field)
  statut: FactureStatut;               // Statut
  montantHT: number;                   // Montant HT (€)
  dateEmission: string;                // Date d'Émission (ISO date)
  dateEcheance: string;                // Date d'Échéance (ISO date)
  datePaiement?: string;               // Date de Paiement (ISO date)

  // Champs pour relances (mis à jour par N8N)
  niveauRelanceEnvoye: NiveauRelance;  // 0-3
  dateDerniereRelance?: string;        // Date Dernière Relance

  // Relations
  projet: string;                      // Lien vers T4 Projet
  client?: string;                     // Lien vers T1 Client (via projet)

  // Champs calculés (lecture seule)
  montantTTC?: number;                 // Formula: montantHT * 1.2
  niveauRelance?: string;              // Formula: "N1", "N2", "N3" basé sur retard
  joursRetard?: number;                // Formula: si statut Envoyée et dateEcheance passée
  nomProjet?: string;                  // Lookup: nom du projet
  nomClient?: string;                  // Lookup: nom du client
}

export interface FactureCreate {
  numeroFacture: string;
  projet: string;
  statut: FactureStatut;
  montantHT: number;
  dateEmission: string;
  dateEcheance: string;
}

export interface FactureUpdate {
  statut?: FactureStatut;
  montantHT?: number;
  dateEcheance?: string;
  datePaiement?: string;
  niveauRelanceEnvoye?: NiveauRelance;
  dateDerniereRelance?: string;
}
```

### Membre Équipe (T10)

```typescript
// types/team.ts

export interface MembreEquipe {
  id: string;
  nom: string;                         // Nom (primary field)
  email: string;                       // Email
  role: string;                        // Rôle (Développeur, Chef de projet, etc.)
  capaciteHebdo?: number;              // Capacité Hebdo (heures)

  // Champs calculés (lecture seule)
  nbTachesEnCours?: number;            // Rollup: tâches non terminées
  heuresAssigneesHebdo?: number;       // Rollup: heures tâches en cours
  pourcentageCapacite?: number;        // Formula: heuresAssignees / capaciteHebdo
}
```

### Interaction (T8)

```typescript
// types/client.ts (suite)

export type InteractionType = 'Appel' | 'Email' | 'Réunion' | 'Note';

export interface Interaction {
  id: string;
  titre: string;                       // Titre (primary field)
  type: InteractionType;               // Type
  date: string;                        // Date (ISO date)
  notes?: string;                      // Notes

  // Relations
  client: string;                      // Lien vers T1 Client
  contact?: string;                    // Lien vers T2 Contact
  membreEquipe?: string;               // Lien vers T10 Équipe (auteur)
}
```

## Enums and Status Values

```typescript
// types/index.ts

// Tous les statuts pour validation et filtres
export const CLIENT_STATUTS = ['Prospect', 'Actif', 'Ancien', 'En pause'] as const;
export const OPPORTUNITE_STATUTS = ['Lead', 'Qualifié', 'Proposition envoyée', 'Négociation', 'Gagnée', 'Perdue'] as const;
export const PROJET_STATUTS = ['En attente', 'Planification', 'En cours', 'En revue', 'Terminé', 'Facturé'] as const;
export const TACHE_STATUTS = ['À faire', 'En cours', 'En attente de validation', 'Terminée'] as const;
export const TACHE_PRIORITES = ['Haute', 'Moyenne', 'Basse'] as const;
export const FACTURE_STATUTS = ['Brouillon', 'Envoyée', 'Payée', 'Annulée'] as const;
export const INTERACTION_TYPES = ['Appel', 'Email', 'Réunion', 'Note'] as const;

// Couleurs pour les badges
export const STATUT_COLORS: Record<string, string> = {
  // Clients
  'Prospect': 'bg-blue-100 text-blue-800',
  'Actif': 'bg-green-100 text-green-800',
  'Ancien': 'bg-gray-100 text-gray-800',
  'En pause': 'bg-yellow-100 text-yellow-800',

  // Opportunités
  'Lead': 'bg-slate-100 text-slate-800',
  'Qualifié': 'bg-blue-100 text-blue-800',
  'Proposition envoyée': 'bg-purple-100 text-purple-800',
  'Négociation': 'bg-orange-100 text-orange-800',
  'Gagnée': 'bg-green-100 text-green-800',
  'Perdue': 'bg-red-100 text-red-800',

  // Projets
  'En attente': 'bg-slate-100 text-slate-800',
  'Planification': 'bg-blue-100 text-blue-800',
  'En cours': 'bg-yellow-100 text-yellow-800',
  'En revue': 'bg-purple-100 text-purple-800',
  'Terminé': 'bg-green-100 text-green-800',
  'Facturé': 'bg-emerald-100 text-emerald-800',

  // Tâches
  'À faire': 'bg-slate-100 text-slate-800',
  // 'En cours' déjà défini
  'En attente de validation': 'bg-orange-100 text-orange-800',
  'Terminée': 'bg-green-100 text-green-800',

  // Priorités
  'Haute': 'bg-red-100 text-red-800',
  'Moyenne': 'bg-yellow-100 text-yellow-800',
  'Basse': 'bg-slate-100 text-slate-800',

  // Factures
  'Brouillon': 'bg-slate-100 text-slate-800',
  'Envoyée': 'bg-blue-100 text-blue-800',
  'Payée': 'bg-green-100 text-green-800',
  'Annulée': 'bg-red-100 text-red-800',

  // Relances
  'N1': 'bg-yellow-100 text-yellow-800',
  'N2': 'bg-orange-100 text-orange-800',
  'N3': 'bg-red-100 text-red-800',
};
```

## Airtable Record Wrapper

```typescript
// types/index.ts

// Wrapper générique pour les records Airtable
export interface AirtableRecord<T> {
  id: string;
  createdTime: string;
  fields: T;
}

export interface AirtableResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;  // Pour pagination
}

// Helper pour extraire les fields
export function unwrapRecords<T>(response: AirtableResponse<T>): (T & { id: string })[] {
  return response.records.map(record => ({
    id: record.id,
    ...record.fields,
  }));
}
```

## Relationships Diagram

```
┌─────────────┐     1:N     ┌─────────────┐
│   Client    │────────────►│   Contact   │
│    (T1)     │             │    (T2)     │
└─────────────┘             └─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐     1:1     ┌─────────────┐
│ Opportunité │────────────►│   Projet    │
│    (T3)     │  (optional) │    (T4)     │
└─────────────┘             └─────────────┘
                                   │
                                   │ 1:N
                                   ▼
┌─────────────┐             ┌─────────────┐
│   Facture   │◄────────────│   Tâche     │
│    (T7)     │     N:1     │    (T5)     │
└─────────────┘             └─────────────┘
                                   │
                                   │ N:1
                                   ▼
                            ┌─────────────┐
                            │   Équipe    │
                            │   (T10)     │
                            └─────────────┘

┌─────────────┐
│ Interaction │◄──── Client (N:1), Contact (N:1), Équipe (N:1)
│    (T8)     │
└─────────────┘
```

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| Client | nomClient | Required, non-empty |
| Contact | email | Valid email format if provided |
| Opportunité | probabilite | Between 0 and 1 |
| Opportunité | valeurEstimee | Positive number |
| Projet | budgetFinal | Positive number |
| Projet | dateDebut | Must be before dateFinPrevue |
| Tâche | dateEcheance | Valid date |
| Facture | montantHT | Positive number |
| Facture | dateEcheance | Must be after dateEmission |
