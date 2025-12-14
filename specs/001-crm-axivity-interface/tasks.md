# Tasks: Interface Web CRM Axivity

**Input**: Design documents from `/specs/001-crm-axivity-interface/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Non demandés explicitement dans la spec - tests optionnels.

**Organization**: Tasks grouped by user story (9 stories: US1-US3 P1, US4-US6 P2, US7-US9 P3)

---

## 📊 Progress Summary (Updated: 2025-12-14)

| Phase | Status | Tasks Done | Total |
|-------|--------|------------|-------|
| Phase 1: Setup | ✅ Complete | 9/9 | 100% |
| Phase 2: Foundational | ✅ Complete | 19/19 | 100% |
| Phase 3: Dashboard (US1) | ✅ Complete | 10/10 | 100% |
| Phase 4: Projets (US2) | ✅ Complete | 8/8 | 100% |
| Phase 5: Opportunités (US3) | ✅ Complete | 7/7 | 100% |
| Phase 6: Tâches (US4) | ✅ Complete | 7/7 | 100% |
| Phase 7: Clients (US5) | ✅ Complete | 7/7 | 100% |
| Phase 8: Factures (US6) | ✅ Complete | 5/5 | 100% |
| Phase 9: Rapports (US7) | ✅ Complete | 6/6 | 100% |
| Phase 10: Équipe (US8) | ✅ Complete | 5/5 | 100% |
| Phase 11: Portail (US9) | ✅ Complete | 6/6 | 100% |
| Phase 12: Polish | ✅ Complete | 9/9 | 100% |
| Phase 13: Enhancements | ✅ Complete | 7/7 | 100% |

**Overall Progress: 105/105 tasks (100%)**

### Key Achievements
- ✅ Full Next.js 14 + Shadcn/UI application structure
- ✅ Airtable API integration with correct field mappings
- ✅ All 9 main pages implemented (Dashboard, Projets, Opportunités, Tâches, Clients, Factures, Équipe, Rapports, Portail)
- ✅ React Query hooks for all entities
- ✅ Responsive mobile-first design
- ✅ Drag-and-drop Kanban for Opportunités
- ✅ Custom calendar view for Tâches
- ✅ Relance tracking with N1/N2/N3 levels
- ✅ Team workload visualization
- ✅ External client portal with projets and factures views
- ✅ Global search command with Cmd+K shortcut
- ✅ Real-time notification panel with alerts
- ✅ Lead import from CSV/XLSX with column mapping

### All Work Completed
- ✅ Breadcrumb navigation (T092-T093)
- ✅ Quickstart validation (T097)
- ✅ Performance audit (T098) - Dashboard loads ~138KB First Load
- ✅ Notification panel (T099-T100)
- ✅ Lead import feature (T101-T105)

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js)**: `src/app/`, `src/components/`, `src/lib/`, `src/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Next.js 14 project with TypeScript and Tailwind CSS using `npx create-next-app@latest`
- [x] T002 Initialize Shadcn/UI with `npx shadcn@latest init` (New York style, Slate color)
- [x] T003 [P] Install core dependencies: @tanstack/react-query, @hello-pangea/dnd, recharts, react-big-calendar, date-fns
- [x] T004 [P] Install form dependencies: react-hook-form, @hookform/resolvers, zod
- [x] T005 [P] Add Shadcn components: button, card, input, select, checkbox, table, badge, avatar, progress, skeleton
- [x] T006 [P] Add Shadcn components: dialog, alert-dialog, sheet, tabs, toast, tooltip, dropdown-menu
- [x] T007 [P] Add Shadcn components: command, breadcrumb, calendar, form, textarea, separator, scroll-area, navigation-menu, toggle, switch
- [x] T008 Create environment configuration in `.env.local` with AIRTABLE_API_KEY and AIRTABLE_BASE_ID
- [x] T009 Create project folder structure per plan.md (app/, components/, lib/, types/)

**Checkpoint**: ✅ Project scaffolding complete, dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Create Airtable table IDs constants in `src/lib/airtable-tables.ts`
- [x] T011 Implement Airtable API client with retry logic in `src/lib/airtable.ts`
- [x] T012 [P] Create TypeScript types for Client and Contact in `src/types/index.ts` (consolidated)
- [x] T013 [P] Create TypeScript types for Projet and Tache in `src/types/index.ts` (consolidated)
- [x] T014 [P] Create TypeScript types for Opportunite in `src/types/index.ts` (consolidated)
- [x] T015 [P] Create TypeScript types for Facture in `src/types/index.ts` (consolidated)
- [x] T016 [P] Create TypeScript types for MembreEquipe in `src/types/index.ts` (consolidated)
- [x] T017 [P] Create common types and enums (statuts, colors) in `src/types/index.ts`
- [x] T018 Create React Query provider wrapper in `src/app/providers.tsx`
- [x] T019 Update root layout with Providers and Toaster in `src/app/layout.tsx`
- [x] T020 Create utility functions (cn, formatters) in `src/lib/utils.ts`
- [x] T021 [P] Create LoadingSkeleton component in `src/components/shared/index.tsx` (PageLoading)
- [x] T022 [P] Create ErrorMessage component in `src/components/shared/index.tsx` (EmptyState)
- [x] T023 [P] Create StatusBadge component in `src/components/shared/index.tsx`
- [x] T024 [P] Create DataTable generic component in `src/components/shared/index.tsx`
- [x] T025 Create Sidebar navigation component in `src/components/layout/Sidebar.tsx`
- [x] T026 Create Header component with search placeholder in `src/components/layout/Header.tsx`
- [x] T027 Create MobileNav bottom navigation component in `src/components/layout/MobileNav.tsx`
- [x] T028 Create dashboard layout with Sidebar and MobileNav in `src/app/layout.tsx` (root layout)

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Tableau de Bord Principal (Priority: P1) 🎯 MVP

**Goal**: Dashboard centralisé avec 4 KPIs, graphique CA mensuel et projets récents

**Independent Test**: Vérifier que les 4 KPIs s'affichent correctement avec données Airtable et navigation fonctionnelle

### Implementation for User Story 1

- [x] T029 [P] [US1] Create useProjects hook with fetchProjects in `src/hooks/use-projets.ts`
- [x] T030 [P] [US1] Create useOpportunities hook with fetchOpportunities in `src/hooks/use-opportunites.ts`
- [x] T031 [P] [US1] Create useTasks hook with fetchTasks in `src/hooks/use-taches.ts`
- [x] T032 [US1] Create useDashboard hook aggregating KPIs in `src/hooks/use-dashboard.ts`
- [x] T033 [P] [US1] Create KpiCard component in `src/components/dashboard/KpiCard.tsx`
- [x] T034 [US1] Create KpiGrid component (4 KPIs) - integrated in dashboard page
- [x] T035 [US1] Create ChartCA component with Recharts in `src/components/dashboard/ChartCA.tsx`
- [x] T036 [US1] Create RecentProjects component in `src/components/dashboard/RecentProjects.tsx`
- [x] T037 [US1] Implement Dashboard page with KPIs, chart and projects in `src/app/page.tsx`
- [x] T038 [US1] Add responsive grid layout for mobile (2x2 KPIs) in dashboard page

**Checkpoint**: ✅ Dashboard MVP functional - KPIs display, chart renders, navigation works

---

## Phase 4: User Story 2 - Gestion des Projets (Priority: P1)

**Goal**: Page Projets avec vue liste triable, vue Kanban par statut, et panneau détail

**Independent Test**: Créer/modifier un projet et vérifier les changements dans Airtable et les vues

### Implementation for User Story 2

- [x] T039 [US2] Extend useProjects hook with mutations (update) in `src/hooks/use-projets.ts`
- [x] T040 [P] [US2] Create ProjetCard component in `src/components/projets/ProjetCard.tsx`
- [x] T041 [P] [US2] Create ProjetList component with DataTable in `src/app/projets/page.tsx` (integrated)
- [x] T042 [US2] Create ProjetKanban component with status columns in `src/components/projets/ProjetKanban.tsx`
- [x] T043 [US2] Create ProjetSheet detail panel - via detail page instead
- [x] T044 [US2] Implement Projets list page with view toggle in `src/app/projets/page.tsx`
- [x] T045 [US2] Implement Projet detail page in `src/app/projets/[id]/page.tsx`
- [x] T046 [US2] Add responsive behavior for Kanban horizontal scroll on mobile

**Checkpoint**: ✅ Projets page functional - list view, kanban view, detail page all work

---

## Phase 5: User Story 3 - Pipeline Commercial Opportunités (Priority: P1)

**Goal**: Kanban drag-and-drop des opportunités avec valeur pondérée par colonne

**Independent Test**: Déplacer une opportunité entre colonnes et vérifier mise à jour Airtable + recalcul valeur pondérée

### Implementation for User Story 3

- [x] T047 [US3] Extend useOpportunities hook with updateStatus mutation in `src/hooks/use-opportunites.ts`
- [x] T048 [P] [US3] Create OpportuniteCard component with value display in `src/components/opportunites/OpportuniteCard.tsx`
- [x] T049 [US3] Create OpportuniteColumn component with sum calculation in `src/components/opportunites/OpportuniteColumn.tsx`
- [x] T050 [US3] Create OpportuniteKanban with @hello-pangea/dnd in `src/components/opportunites/OpportuniteKanban.tsx`
- [x] T051 [US3] Implement Opportunités page with drag-drop Kanban in `src/app/opportunites/page.tsx`
- [x] T052 [US3] Implement optimistic update for drag-drop status change
- [x] T053 [US3] Add mobile touch support and horizontal scroll for Kanban columns

**Checkpoint**: ✅ Pipeline commercial functional - drag-drop works, values recalculate, Airtable synced

---

## Phase 6: User Story 4 - Gestion des Tâches (Priority: P2)

**Goal**: Page Tâches avec liste filtrable et vue calendrier mensuel

**Independent Test**: Marquer tâche terminée et vérifier mise à jour du % progression projet parent

### Implementation for User Story 4

- [x] T054 [US4] Extend useTasks hook with filters and updateStatus in `src/hooks/use-taches.ts`
- [x] T055 [P] [US4] Create TacheItem component with checkbox in `src/components/taches/TacheCard.tsx`
- [x] T056 [US4] Create TacheList component with filters in `src/app/taches/page.tsx` (integrated)
- [x] T057 [US4] Create TacheCalendar component with custom calendar in `src/app/taches/calendrier/page.tsx`
- [x] T058 [US4] Implement Tâches page with view toggle (list/calendar) in `src/app/taches/page.tsx`
- [x] T059 [US4] Implement Calendar page in `src/app/taches/calendrier/page.tsx`
- [x] T060 [US4] Add visual indicator (red badge) for overdue tasks

**Checkpoint**: ✅ Tâches page functional - list filters work, calendar displays, checkbox updates

---

## Phase 7: User Story 5 - Fiche Client 360° (Priority: P2)

**Goal**: Liste clients searchable et fiche détaillée avec 4 onglets

**Independent Test**: Naviguer vers fiche client et vérifier affichage correct de tous les onglets

### Implementation for User Story 5

- [x] T061 [US5] Create useClients hook with fetchClients in `src/hooks/use-clients.ts`
- [x] T062 [P] [US5] Create ClientCard component in `src/app/clients/page.tsx` (integrated)
- [x] T063 [US5] Create ClientList component with search in `src/app/clients/page.tsx` (integrated)
- [x] T064 [US5] Create ClientTabs component (Infos, Projets, Factures, Interactions) in `src/app/clients/[id]/page.tsx`
- [x] T065 [US5] Create HealthBadge component - using santeClient field display
- [x] T066 [US5] Implement Clients list page in `src/app/clients/page.tsx`
- [x] T067 [US5] Implement Client 360° detail page with tabs in `src/app/clients/[id]/page.tsx`

**Checkpoint**: ✅ Clients page functional - search works, tabs display correct data, health indicator shows

---

## Phase 8: User Story 6 - Gestion des Factures et Relances (Priority: P2)

**Goal**: Liste factures filtrable avec niveau de relance visible et vue dédiée relances

**Independent Test**: Filtrer factures en retard et vérifier affichage correct N1/N2/N3

### Implementation for User Story 6

- [x] T068 [US6] Create useInvoices hook with filters in `src/hooks/use-factures.ts`
- [x] T069 [P] [US6] Create RelanceBadge component (N1/N2/N3) in `src/components/factures/RelanceBadge.tsx`
- [x] T070 [US6] Create FactureList component with status filters in `src/app/factures/page.tsx` (integrated)
- [x] T071 [US6] Implement Factures list page in `src/app/factures/page.tsx`
- [x] T072 [US6] Implement Relances page (filtered view) in `src/app/factures/relances/page.tsx`

**Checkpoint**: ✅ Factures page functional - filters work, relance page with N1/N2/N3 levels

---

## Phase 9: User Story 7 - Dashboard Stratégique CEO (Priority: P3)

**Goal**: Dashboard avec KPIs stratégiques, graphiques CA et top projets rentables

**Independent Test**: Vérifier calculs métriques agrégées (CA total, taux conversion, marge)

### Implementation for User Story 7

- [x] T073 [US7] Create useCeoMetrics hook for strategic KPIs in `src/hooks/use-dashboard.ts` (shared)
- [x] T074 [P] [US7] Create StrategicKpiCard component in `src/app/rapports/page.tsx` (integrated)
- [x] T075 [US7] Create PeriodSelector component (mois/trimestre/année) in `src/app/rapports/page.tsx`
- [x] T076 [US7] Create TopProjectsTable component in `src/app/rapports/page.tsx` (integrated)
- [x] T077 [US7] Create ConversionChart component in `src/app/rapports/page.tsx` (integrated)
- [x] T078 [US7] Implement Rapports CEO page in `src/app/rapports/page.tsx`

**Checkpoint**: ✅ Dashboard CEO functional - all KPIs display, period filter works, charts render

---

## Phase 10: User Story 8 - Gestion de l'Équipe (Priority: P3)

**Goal**: Liste équipe avec charge de travail visualisée par membre

**Independent Test**: Vérifier calcul % capacité atteinte pour chaque membre

### Implementation for User Story 8

- [x] T079 [US8] Create useTeam hook with capacity calculation in `src/hooks/use-equipe.ts`
- [x] T080 [P] [US8] Create ChargeBar component (progress bar) in `src/app/equipe/page.tsx` (integrated)
- [x] T081 [US8] Create EquipeList component in `src/app/equipe/page.tsx` (integrated)
- [x] T082 [US8] Implement Équipe list page in `src/app/equipe/page.tsx`
- [x] T083 [US8] Implement Charge de travail page in `src/app/equipe/charge/page.tsx`

**Checkpoint**: ✅ Équipe page functional - members list, capacity bars, charge de travail page

---

## Phase 11: User Story 9 - Portail Client Externe (Priority: P3)

**Goal**: Portail isolé pour clients externes avec vue projets et factures

**Independent Test**: Accéder au portail et vérifier affichage uniquement des données du client

### Implementation for User Story 9

- [x] T084 [US9] Create portail layout in `src/app/portail/layout.tsx`
- [x] T085 [US9] Create PortailProjetCard component - integrated in `src/app/portail/[clientId]/projets/page.tsx`
- [x] T086 [US9] Create PortailFactureList component - integrated in `src/app/portail/[clientId]/factures/page.tsx`
- [x] T087 [US9] Implement Portail client dashboard in `src/app/portail/[clientId]/page.tsx`
- [x] T088 [US9] Implement Portail projets page in `src/app/portail/[clientId]/projets/page.tsx`
- [x] T089 [US9] Implement Portail factures page in `src/app/portail/[clientId]/factures/page.tsx`

**Checkpoint**: ✅ Portail client functional - isolated view, shows only client-specific data

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T090 [P] Create SearchCommand global search component in `src/components/shared/SearchCommand.tsx`
- [x] T091 Integrate SearchCommand in Header component with Cmd+K shortcut
- [x] T092 [P] Add Breadcrumb component in `src/components/layout/AppBreadcrumb.tsx`
- [x] T093 Add breadcrumb to all detail pages (clients/[id], projets/[id], taches/calendrier, factures/relances, equipe/charge, portail/*)
- [x] T094 Review and ensure all pages are responsive (375px minimum)
- [x] T095 Verify all error states display ErrorMessage component
- [x] T096 Verify all loading states display LoadingSkeleton
- [x] T097 Run quickstart.md validation - all setup steps verified working
- [x] T098 Performance audit - dashboard First Load JS 138KB, 4 parallel API calls, React Query caching enabled

**Checkpoint**: ✅ Application fully polished - all tasks complete, 100% implementation

---

## Phase 13: Feature Enhancements

**Purpose**: Additional features requested after initial implementation

### Notification System
- [x] T099 [P] Install popover component via shadcn (`npx shadcn@latest add popover`)
- [x] T100 Create NotificationPanel component in `src/components/shared/NotificationPanel.tsx`
- [x] T101 Integrate NotificationPanel in Header - replaces static bell icon

### Lead Import Feature
- [x] T102 Install xlsx and papaparse dependencies for CSV/XLSX parsing
- [x] T103 Add batch create method to Airtable client in `src/lib/airtable.ts`
- [x] T104 Create LeadImportDialog component in `src/components/opportunites/LeadImportDialog.tsx`
- [x] T105 Add import button to Opportunités page with dialog integration

**Features implemented:**
- Notification panel with real-time alerts (tasks overdue, unpaid invoices, late projects)
- Lead import from CSV/XLSX with:
  - Drag & drop file upload
  - Auto-detection of column mappings
  - Manual column mapping interface
  - Data preview before import
  - Batch import with progress tracking
  - Support for custom default status

**Checkpoint**: ✅ All enhancement features complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phases 3-5 (P1 Stories)**: All depend on Phase 2
  - US1 (Dashboard): No dependencies on other stories
  - US2 (Projets): Shares useProjects with US1
  - US3 (Opportunités): Independent, uses useOpportunities
- **Phases 6-8 (P2 Stories)**: All depend on Phase 2
  - US4 (Tâches): Uses useTasks, can run parallel to US5/US6
  - US5 (Clients): Uses useClients, can run parallel to US4/US6
  - US6 (Factures): Uses useInvoices, can run parallel to US4/US5
- **Phases 9-11 (P3 Stories)**: All depend on Phase 2
  - US7 (CEO Dashboard): Uses aggregated data, can run parallel
  - US8 (Équipe): Uses useTeam, can run parallel
  - US9 (Portail): Isolated, can run parallel
- **Phase 12 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Dashboard)**: Foundation only - MVP starting point
- **US2 (Projets)**: Foundation only - can start with US1 parallel
- **US3 (Opportunités)**: Foundation only - can start with US1/US2 parallel
- **US4-US9**: Foundation only - all can run parallel after Phase 2

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel:
- Phase 1: T003, T004, T005, T006, T007 (all installs)
- Phase 2: T012-T017 (types), T021-T024 (shared components)
- US1: T029-T031 (hooks), T033 (KpiCard)
- US2: T040-T041 (components)
- US3: T048 (card)
- US5: T062 (card)
- US6: T069 (badge)
- US7: T074 (card)
- US8: T080 (bar)
- Phase 12: T090, T092 (components)

---

## Parallel Example: Phase 2 Foundation

```bash
# Launch all type definitions together:
Task: "Create TypeScript types for Client and Contact in src/types/client.ts"
Task: "Create TypeScript types for Projet and Tache in src/types/project.ts"
Task: "Create TypeScript types for Opportunite in src/types/opportunity.ts"
Task: "Create TypeScript types for Facture in src/types/invoice.ts"
Task: "Create TypeScript types for MembreEquipe in src/types/team.ts"
Task: "Create common types and enums in src/types/index.ts"

# Launch all shared components together:
Task: "Create LoadingSkeleton component in src/components/shared/LoadingSkeleton.tsx"
Task: "Create ErrorMessage component in src/components/shared/ErrorMessage.tsx"
Task: "Create StatusBadge component in src/components/shared/StatusBadge.tsx"
Task: "Create DataTable generic component in src/components/shared/DataTable.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Dashboard)
4. **STOP and VALIDATE**: Test Dashboard independently
5. Complete Phase 4: User Story 2 (Projets)
6. Complete Phase 5: User Story 3 (Opportunités)
7. **MVP COMPLETE**: Core operational features ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Dashboard) → Test → Demo
3. Add US2 (Projets) → Test → Demo
4. Add US3 (Opportunités) → Test → Demo (MVP!)
5. Add US4-US6 (P2) → Test → Demo
6. Add US7-US9 (P3) → Test → Demo
7. Polish phase → Final release

### Parallel Team Strategy

With 3 developers after Phase 2:
- Developer A: US1 → US4 → US7
- Developer B: US2 → US5 → US8
- Developer C: US3 → US6 → US9

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All UI text in French as per spec
- Test responsive at 375px, 768px, 1024px breakpoints
