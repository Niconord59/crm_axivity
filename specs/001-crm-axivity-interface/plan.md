# Implementation Plan: Interface Web CRM Axivity

**Branch**: `001-crm-axivity-interface` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-crm-axivity-interface/spec.md`

## Summary

Application web SAAS complète pour le cockpit opérationnel CRM Axivity d'une agence IA. L'interface permet de gérer le cycle de vie client complet : prospection (opportunités), vente (pipeline), exécution (projets/tâches), facturation et fidélisation. L'application est construite avec React 19 + Next.js 16 + Shadcn/UI + Tailwind CSS, communiquant avec Supabase (migration depuis Airtable en cours). Design 100% responsive mobile-first.

## Technical Context

**Language/Version**: TypeScript 5.x avec React 19.2.3
**Primary Dependencies**: Next.js 16.0.10 (App Router + Turbopack), Shadcn/UI, Tailwind CSS 3.x, Recharts, @hello-pangea/dnd v18 (drag-and-drop)
**Storage**: Supabase self-hosted (https://supabase.axivity.cloud) - Migration depuis Airtable en cours (85%)
**Testing**: Vitest + React Testing Library + Playwright (E2E)
**Target Platform**: Web (navigateurs modernes), responsive mobile-first (375px minimum)
**Project Type**: Web application (frontend Next.js, backend = Supabase)
**Performance Goals**: Dashboard < 3s, interactions < 2s, 60fps animations
**Constraints**: Connexion internet requise, pas de mode offline
**Scale/Scope**: ~10 pages principales, ~50 composants, équipe 5-15 utilisateurs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Responsive | [x] Pass | 3 breakpoints définis (<768px, 768-1024px, >1024px), bottom nav mobile, sidebar desktop |
| II. Shadcn/UI Exclusivity | [x] Pass | Tous les composants UI via Shadcn (Card, Table, Sheet, Badge, etc.) |
| III. Airtable API as SSOT | [x] Pass | Toutes données via API REST Airtable, pas de cache local persistant |
| IV. Automation-Ready | [x] Pass | Structure compatible N8N workflows, liens bidirectionnels, status enums cohérents |
| V. Data Integrity | [x] Pass | Relations bidirectionnelles maintenues, rollups en lecture seule |
| VI. Simplicity & YAGNI | [x] Pass | Implémentation conforme à la spec, pas d'abstractions superflues |

## Project Structure

### Documentation (this feature)

```text
specs/001-crm-axivity-interface/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── airtable-api.md  # API contract documentation
├── checklists/
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/              # Main app with sidebar layout
│   │   ├── layout.tsx            # Dashboard layout (Sidebar + Header)
│   │   ├── page.tsx              # Dashboard principal (/)
│   │   ├── projets/
│   │   │   ├── page.tsx          # Liste projets
│   │   │   └── [id]/page.tsx     # Détail projet
│   │   ├── opportunites/
│   │   │   ├── page.tsx          # Pipeline Kanban
│   │   │   └── [id]/page.tsx     # Détail opportunité
│   │   ├── taches/
│   │   │   ├── page.tsx          # Liste tâches
│   │   │   └── calendrier/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx          # Liste clients
│   │   │   └── [id]/page.tsx     # Fiche client 360°
│   │   ├── factures/
│   │   │   ├── page.tsx          # Liste factures
│   │   │   └── relances/page.tsx # Factures à relancer
│   │   ├── equipe/
│   │   │   ├── page.tsx          # Liste équipe
│   │   │   └── charge/page.tsx   # Charge de travail
│   │   └── rapports/
│   │       └── page.tsx          # Dashboard CEO
│   └── portail/                  # Portail client externe
│       └── [clientId]/
│           ├── page.tsx          # Dashboard client
│           ├── projets/page.tsx
│           └── factures/page.tsx
├── components/
│   ├── ui/                       # Shadcn components (auto-generated)
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation sidebar (desktop)
│   │   ├── Header.tsx            # Top header with search
│   │   ├── MobileNav.tsx         # Bottom navigation (mobile)
│   │   └── Breadcrumb.tsx
│   ├── dashboard/
│   │   ├── KpiCard.tsx           # Card KPI générique
│   │   ├── KpiGrid.tsx           # Grille de 4 KPIs
│   │   ├── ChartCA.tsx           # Graphique CA mensuel
│   │   └── RecentProjects.tsx    # Liste projets récents
│   ├── projets/
│   │   ├── ProjetList.tsx        # Vue liste
│   │   ├── ProjetKanban.tsx      # Vue Kanban
│   │   ├── ProjetCard.tsx        # Card projet
│   │   └── ProjetSheet.tsx       # Panneau détail
│   ├── opportunites/
│   │   ├── OpportuniteKanban.tsx # Kanban drag-drop
│   │   ├── OpportuniteColumn.tsx # Colonne Kanban
│   │   └── OpportuniteCard.tsx   # Card opportunité
│   ├── taches/
│   │   ├── TacheList.tsx         # Vue liste
│   │   ├── TacheCalendar.tsx     # Vue calendrier
│   │   └── TacheItem.tsx         # Item tâche avec checkbox
│   ├── clients/
│   │   ├── ClientList.tsx        # Liste clients
│   │   ├── ClientCard.tsx        # Card client
│   │   └── ClientTabs.tsx        # Onglets fiche 360°
│   ├── factures/
│   │   ├── FactureList.tsx       # Liste factures
│   │   └── RelanceBadge.tsx      # Badge N1/N2/N3
│   ├── equipe/
│   │   ├── EquipeList.tsx        # Liste membres
│   │   └── ChargeBar.tsx         # Barre capacité
│   └── shared/
│       ├── DataTable.tsx         # Table générique Shadcn
│       ├── StatusBadge.tsx       # Badge statut coloré
│       ├── SearchCommand.tsx     # Recherche globale (Command)
│       ├── LoadingSkeleton.tsx   # États de chargement
│       └── ErrorMessage.tsx      # Message d'erreur convivial
├── lib/
│   ├── airtable.ts               # Client API Airtable
│   ├── airtable-tables.ts        # Table IDs constants
│   ├── utils.ts                  # Utilitaires (cn, formatters)
│   └── hooks/
│       ├── useProjects.ts        # Hook projets
│       ├── useTasks.ts           # Hook tâches
│       ├── useOpportunities.ts   # Hook opportunités
│       ├── useClients.ts         # Hook clients
│       ├── useInvoices.ts        # Hook factures
│       └── useTeam.ts            # Hook équipe
└── types/
    ├── index.ts                  # Types communs
    ├── client.ts                 # Types Client/Contact
    ├── project.ts                # Types Projet/Tâche
    ├── opportunity.ts            # Types Opportunité
    ├── invoice.ts                # Types Facture
    └── team.ts                   # Types Équipe

tests/
├── e2e/                          # Tests Playwright
│   ├── dashboard.spec.ts
│   ├── projects.spec.ts
│   └── opportunities.spec.ts
└── unit/                         # Tests Vitest
    ├── components/
    └── hooks/
```

**Structure Decision**: Web application frontend-only avec Next.js App Router. Le backend est entièrement géré par Airtable API. Structure organisée par domaine métier (projets, opportunités, tâches, etc.) pour faciliter la navigation et la maintenance.

## Complexity Tracking

> Aucune violation de constitution à justifier.
