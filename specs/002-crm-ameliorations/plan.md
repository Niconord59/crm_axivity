# Implementation Plan: Améliorations CRM Axivity - Phase 2

**Branch**: `002-crm-ameliorations` | **Date**: 2025-12-14 | **Updated**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-crm-ameliorations/spec.md`
**Status**: En cours (53% - Phases 1-3 terminées)

## Summary

Phase 2 du projet CRM Axivity visant à transformer l'application de lecture-seule en outil opérationnel complet. Les améliorations incluent : formulaires CRUD pour toutes les entités, graphiques de visualisation, export CSV/Excel, calendrier des tâches, portail client fonctionnel, recherche globale connectée, et pages équipe complètes.

## Technical Context

**Language/Version**: TypeScript 5.x avec React 18.3.1
**Primary Dependencies**: Next.js 14 (App Router), Shadcn/UI, Tailwind CSS 3.x, Recharts 2.13, react-hook-form, Zod, xlsx, papaparse, react-big-calendar
**Storage**: Airtable REST API (Base ID: appEf6JtWFdfLwsU6)
**Testing**: Tests manuels + validation Airtable
**Target Platform**: Web responsive (375px minimum)
**Project Type**: Web application (frontend uniquement)
**Performance Goals**: Formulaires < 1s, graphiques < 2s, export < 5s
**Constraints**: API Airtable rate limits (5 req/sec), batch max 10 records
**Scale/Scope**: 8 améliorations majeures, ~40 nouvelles tâches

## Constitution Check

*GATE: Must pass before implementation.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Responsive | [x] Pass | Formulaires en fullscreen sur mobile, graphiques responsifs |
| II. Shadcn/UI Exclusivity | [x] Pass | Dialog, Form, Select, Input - tous via Shadcn |
| III. Airtable API as SSOT | [x] Pass | POST/PATCH via airtable.ts existant |
| IV. Automation-Ready | [x] Pass | Statuts cohérents, liens bidirectionnels maintenus |
| V. Data Integrity | [x] Pass | Validation Zod, pas de modification de rollups/formulas |
| VI. Simplicity & YAGNI | [x] Pass | Composants réutilisables, pas de sur-architecture |

## Project Structure

### Documentation (this feature)

```text
specs/002-crm-ameliorations/
├── spec.md              # Feature specification
├── plan.md              # This file
├── tasks.md             # Task breakdown
├── checklists/
│   └── requirements.md  # Validation checklist
└── contracts/
    └── form-schemas.md  # Zod schemas documentation
```

### New/Modified Files

```text
src/
├── components/
│   ├── shared/
│   │   ├── FormDialog.tsx          # NEW - Dialog CRUD réutilisable
│   │   ├── ExportButton.tsx        # NEW - Export CSV/Excel
│   │   └── ChartContainer.tsx      # NEW - Wrapper responsive charts
│   │
│   ├── forms/                      # NEW - Formulaires par entité
│   │   ├── OpportuniteForm.tsx
│   │   ├── ProjetForm.tsx
│   │   ├── TacheForm.tsx
│   │   ├── FactureForm.tsx
│   │   └── ClientForm.tsx
│   │
│   ├── charts/                     # NEW - Graphiques
│   │   ├── CAMensuelChart.tsx
│   │   ├── PipelineChart.tsx
│   │   └── ProgressionChart.tsx
│   │
│   ├── clients/
│   │   └── ClientTabs.tsx          # MODIFIED - Onglets fonctionnels
│   │
│   └── taches/
│       └── TacheCalendar.tsx       # MODIFIED - Calendrier complet
│
├── app/
│   ├── page.tsx                    # MODIFIED - Ajout graphique CA
│   ├── opportunites/page.tsx       # MODIFIED - Bouton création + chart
│   ├── projets/page.tsx            # MODIFIED - Bouton création + export
│   ├── taches/page.tsx             # MODIFIED - Bouton création
│   ├── taches/calendrier/page.tsx  # MODIFIED - Calendrier fonctionnel
│   ├── factures/page.tsx           # MODIFIED - Bouton création + export
│   ├── clients/page.tsx            # MODIFIED - Bouton création + export
│   ├── clients/[id]/page.tsx       # MODIFIED - Onglets fonctionnels
│   ├── equipe/page.tsx             # MODIFIED - Contenu complet
│   ├── equipe/charge/page.tsx      # MODIFIED - Barres de charge
│   └── portail/
│       ├── [clientId]/page.tsx     # MODIFIED - Dashboard client
│       ├── [clientId]/projets/     # MODIFIED - Projets client
│       └── [clientId]/factures/    # MODIFIED - Factures client
│
├── lib/
│   ├── schemas/                    # NEW - Schémas Zod
│   │   ├── opportunite.ts
│   │   ├── projet.ts
│   │   ├── tache.ts
│   │   ├── facture.ts
│   │   └── client.ts
│   │
│   └── export.ts                   # NEW - Utilitaires export
│
└── hooks/
    ├── use-search.ts               # NEW - Hook recherche globale
    └── use-*.ts                    # MODIFIED - Ajout mutations create
```

## Implementation Phases

### Phase 1: Infrastructure Formulaires (Blocking)

**Objectif**: Créer les composants de base réutilisables

| Tâche | Fichier | Priorité |
|-------|---------|----------|
| FormDialog component | `src/components/shared/FormDialog.tsx` | P1 |
| Schémas Zod | `src/lib/schemas/*.ts` | P1 |
| Mutations create dans hooks | `src/hooks/use-*.ts` | P1 |

**Checkpoint**: FormDialog fonctionnel avec validation Zod

### Phase 2: Formulaires CRUD (P1-CRITIQUE)

**Objectif**: Implémenter tous les formulaires de création/édition

| Entité | Formulaire | Page Modified |
|--------|------------|---------------|
| Opportunité | OpportuniteForm.tsx | opportunites/page.tsx |
| Projet | ProjetForm.tsx | projets/page.tsx |
| Tâche | TacheForm.tsx | taches/page.tsx |
| Facture | FactureForm.tsx | factures/page.tsx |
| Client | ClientForm.tsx | clients/page.tsx |

**Checkpoint**: Tous les formulaires CRUD opérationnels

### Phase 3: Visualisations (P1)

**Objectif**: Ajouter les graphiques manquants

| Graphique | Composant | Page |
|-----------|-----------|------|
| CA Mensuel | CAMensuelChart.tsx | Dashboard (/) |
| Pipeline | PipelineChart.tsx | Opportunités |
| Progression | ProgressionChart.tsx | Rapports |

**Checkpoint**: 3 graphiques affichés avec données réelles

### Phase 4: Fiche Client 360° (P1)

**Objectif**: Compléter les onglets de la fiche client

| Onglet | Données | Source |
|--------|---------|--------|
| Informations | Détails client | useClient |
| Projets | Projets liés | useProjets (filter by client) |
| Factures | Factures liées | useFactures (filter by client) |
| Interactions | Historique | useInteractions (new hook) |

**Checkpoint**: 4 onglets fonctionnels avec données

### Phase 5: Export & Utilitaires (P2)

**Objectif**: Ajouter les fonctionnalités d'export

| Fonctionnalité | Composant | Pages |
|----------------|-----------|-------|
| ExportButton | ExportButton.tsx | Projets, Clients, Factures, Opportunités |
| Export CSV | lib/export.ts | - |
| Export Excel | lib/export.ts | - |

**Checkpoint**: Export fonctionnel sur 4 pages

### Phase 6: Calendrier Tâches (P2)

**Objectif**: Implémenter le calendrier complet

| Fonctionnalité | Détail |
|----------------|--------|
| Vue mensuelle | react-big-calendar |
| Couleurs priorité | P1=rouge, P2=orange, P3=bleu |
| Click → détail | Sheet avec infos tâche |

**Checkpoint**: Calendrier affiche les tâches avec interactions

### Phase 7: Portail Client (P2)

**Objectif**: Rendre le portail client fonctionnel

| Page | Contenu |
|------|---------|
| Dashboard | KPIs client (projets actifs, factures en attente) |
| Projets | Liste projets avec % complétion |
| Factures | Liste factures avec statut paiement |

**Checkpoint**: Portail isolé et fonctionnel

### Phase 8: Recherche & Équipe (P3)

**Objectif**: Finaliser les fonctionnalités secondaires

| Fonctionnalité | Composant |
|----------------|-----------|
| Recherche globale | SearchCommand connecté |
| Page équipe | Liste membres complète |
| Charge travail | Barres de progression |

**Checkpoint**: Recherche et équipe opérationnels

## Dependencies & Execution Order

```
Phase 1 (Infrastructure)
    │
    ├── Phase 2 (Formulaires CRUD) ──────────────────────┐
    │       │                                            │
    │       ├── US10 Opportunités ───────┐               │
    │       ├── US11 Projets ────────────┤               │
    │       ├── US12 Tâches ─────────────┤ [P] Parallel  │
    │       ├── US13 Factures ───────────┤               │
    │       └── US14 Clients ────────────┘               │
    │                                                    │
    ├── Phase 3 (Graphiques) ────────────────────────────┤
    │       │                                            │
    │       ├── US16 Dashboard Chart ────┐               │
    │       ├── US16 Pipeline Chart ─────┤ [P] Parallel  │
    │       └── US16 Progress Chart ─────┘               │
    │                                                    │
    ├── Phase 4 (Fiche Client 360°) ─────────────────────┤
    │       └── US15 Onglets complets                    │
    │                                                    │
    ├── Phase 5 (Export) ────────────────────────────────┤
    │       └── US17 CSV/Excel                           │
    │                                                    │
    ├── Phase 6 (Calendrier) ────────────────────────────┤
    │       └── US18 Calendrier tâches                   │
    │                                                    │
    ├── Phase 7 (Portail) ───────────────────────────────┤
    │       └── US19 Portail client                      │
    │                                                    │
    └── Phase 8 (Recherche & Équipe) ────────────────────┘
            ├── US20 Recherche globale
            └── US21 Équipe/Charge
```

## Estimated Effort

| Phase | Effort | Priorité |
|-------|--------|----------|
| Phase 1: Infrastructure | 2-3h | P1 |
| Phase 2: Formulaires CRUD | 6-8h | P1-CRITIQUE |
| Phase 3: Graphiques | 2-3h | P1 |
| Phase 4: Fiche Client | 3-4h | P1 |
| Phase 5: Export | 2h | P2 |
| Phase 6: Calendrier | 3-4h | P2 |
| Phase 7: Portail | 4-5h | P2 |
| Phase 8: Recherche & Équipe | 3-4h | P3 |
| **Total estimé** | **25-33h** | - |

## Risk Mitigation

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Rate limiting Airtable | Création en batch échoue | Batch max 10, délai 200ms entre appels |
| Conflits de modification | Données écrasées | Timestamps, refresh après save |
| Champs Link Airtable | Création impossible via API | Utiliser IDs existants, pas de création de liens |
| Performance graphiques | Lenteur avec beaucoup de données | Pagination, lazy loading, memoization |

## Complexity Tracking

> Aucune violation de constitution à justifier.

## Validation Checklist

Avant livraison de chaque phase :

- [ ] Mobile responsive (375px, 768px, 1024px)
- [ ] Composants Shadcn exclusivement
- [ ] Données persistées dans Airtable
- [ ] Pas d'erreurs console
- [ ] Textes en français
- [ ] Loading states implémentés
- [ ] Error handling avec messages utilisateur
