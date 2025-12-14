# Interface Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-14

## Active Technologies

- TypeScript 5.x avec React 18.3.1 + Next.js 14 (App Router), Shadcn/UI, Tailwind CSS 3.x, Recharts, @hello-pangea/dnd (drag-and-drop)

## Project Structure

```text
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Shadcn/UI components (18 installed)
│   ├── layout/             # Sidebar, Header, AppLayout
│   ├── shared/             # KPICard, StatusBadge, SearchCommand, etc.
│   ├── forms/              # [Phase 2] Formulaires CRUD
│   └── charts/             # [Phase 2] Graphiques Recharts
├── hooks/                  # React Query hooks (6 hooks)
├── lib/
│   ├── airtable.ts         # API client
│   ├── airtable-tables.ts  # Table IDs (21 tables)
│   ├── utils.ts            # Helpers (cn, formatters)
│   └── schemas/            # [Phase 2] Zod validation schemas
├── providers/              # React Query provider
└── types/                  # TypeScript definitions
```

## Commands

```bash
npm run dev     # Development server
npm run build   # Production build
npm run lint    # ESLint
npm start       # Production server
```

## Code Style

- TypeScript strict mode
- French labels and UI text
- Shadcn/UI components exclusively
- Mobile-first responsive (375px, 768px, 1024px)

## Features

### 001-crm-axivity-interface (Phase 1 - COMPLETE)
- **Status**: 100% - 105/105 tasks
- **Specs**: `specs/001-crm-axivity-interface/`
- **Content**: Dashboard, Projets, Opportunités (Kanban), Tâches, Clients, Factures, Équipe, Rapports, Portail Client

### 002-crm-ameliorations (Phase 2 - PLANNED)
- **Status**: 0% - 0/51 tasks
- **Specs**: `specs/002-crm-ameliorations/`
- **Content**:
  - A1. Formulaires CRUD (Opportunités, Projets, Tâches, Factures, Clients)
  - A2. Fiche Client 360° (onglets fonctionnels)
  - A3. Graphiques Dashboard (CA Mensuel, Pipeline, Progression)
  - A4. Export CSV/Excel
  - A5. Calendrier Tâches
  - A6. Portail Client Externe
  - A7. Recherche Globale (Cmd+K)
  - A8. Gestion Équipe et Charge

## Documentation

- **Passation projet**: `Documentation/passation_projet_agence_ia.md`
- **Roadmap Phase 2**: `Documentation/Ameliorations_Phase2_Roadmap.md`
- **Guide construction Airtable**: `Documentation/Guide de Construction _ Base Airtable pour Agence IA.md`

## Airtable Integration

- **Base ID**: `appEf6JtWFdfLwsU6`
- **API Key**: `.env.local` (`NEXT_PUBLIC_AIRTABLE_API_KEY`)
- **Tables**: 21 tables (voir `lib/airtable-tables.ts`)
- **Rate Limit**: 5 req/sec, batch max 10 records

## Gates (Non-négociables)

1. **Mobile-First**: Responsive sur 3 breakpoints
2. **Shadcn/UI Only**: Aucun autre framework UI
3. **Airtable SSOT**: Pas de base locale
4. **Automation-Ready**: Statuts cohérents, liens bidirectionnels
5. **Data Integrity**: Pas de modification rollups/formulas
6. **YAGNI**: Simplicité, pas de sur-architecture

## Recent Changes

- 001-crm-axivity-interface: Phase 1 complète (Dashboard, Kanban, Pages, Hooks)
- 002-crm-ameliorations: Planification des améliorations Phase 2 (51 tâches)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
