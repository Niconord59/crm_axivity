# CRM Axivity - Architecture Documentation

> Generated: 2026-01-06 | Scan Level: Exhaustive | Project Type: Web (Next.js 16)

## Overview

CRM Axivity is an **operational cockpit for an AI Agency** serving as a centralized "nervous system" for managing the entire client lifecycle: prospecting, sales pipeline, project execution, invoicing, and client retention.

### Key Characteristics

| Attribute | Value |
|-----------|-------|
| **Type** | Full-stack Web Application |
| **Framework** | Next.js 16.0.10 (App Router + Turbopack) |
| **Language** | TypeScript 5.x (strict mode) |
| **UI** | React 19.2.3 + Shadcn/UI (new-york style) |
| **Backend** | Supabase (self-hosted) |
| **Deployment** | Docker/Coolify (standalone output) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Browser (React 19 + Next.js App Router + Shadcn/UI + Tailwind CSS)     ││
│  │  ├── Dashboard (KPIs, Charts, Recent Projects)                          ││
│  │  ├── Prospection (Leads, Calendar Integration, Email)                   ││
│  │  ├── Pipeline (Kanban Drag & Drop, Opportunity Mini-Sheet)              ││
│  │  ├── Projects (Kanban, Tasks, Time Tracking)                            ││
│  │  ├── Invoicing (Devis PDF, Factures, Relances)                          ││
│  │  └── Client Portal (External view for clients)                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Application Layer                                  │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────────────┐  │
│  │   React Query     │  │   API Routes      │  │   Services Layer        │  │
│  │   (Cache Layer)   │  │   (11 routes)     │  │                         │  │
│  │   • 23 hooks      │  │   • Auth          │  │   • calendar-service    │  │
│  │   • Optimistic    │  │   • Calendar      │  │   • email-service       │  │
│  │     updates       │  │   • Email         │  │   • pdf/browser-pool    │  │
│  │   • Query keys    │  │   • Devis (3)     │  │   • templates           │  │
│  │     factory       │  │   • Factures (2)  │  │                         │  │
│  │                   │  │   • Admin (2)     │  │                         │  │
│  │                   │  │   • Places        │  │                         │  │
│  └───────────────────┘  └───────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Data Layer                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Supabase (Self-Hosted)                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │  │
│  │  │  PostgreSQL  │  │   Auth       │  │   Storage                    │ │  │
│  │  │  21 tables   │  │   (RLS)      │  │   • devis-pdf                │ │  │
│  │  │  5 roles     │  │   5 roles    │  │   • factures-pdf             │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Services                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Google    │  │  Microsoft  │  │   Resend    │  │   N8N (Workflows)   │ │
│  │  Calendar   │  │  Graph API  │  │   (Email)   │  │   • Conversion      │ │
│  │  Gmail API  │  │  Outlook    │  │             │  │   • Feedback        │ │
│  │  Places API │  │  Teams      │  │             │  │   • Relances        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (standalone pages)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (main)/                   # Main group (with sidebar)
│   │   ├── dashboard/
│   │   ├── projets/
│   │   ├── opportunites/
│   │   ├── prospection/
│   │   ├── taches/
│   │   ├── clients/[id]/
│   │   ├── factures/
│   │   ├── equipe/
│   │   └── rapports/
│   ├── portail/[clientId]/       # Client portal (external)
│   └── api/                      # API Routes (11)
│       ├── auth/[...nextauth]/
│       ├── admin/users/
│       ├── calendar/events/
│       ├── email/send/
│       ├── devis/{generate,preview,send}/
│       ├── factures/{generate,relance}/
│       └── places/search/
│
├── components/                   # 91 React components
│   ├── ui/                       # Shadcn/UI (29 components)
│   ├── layout/                   # AppLayout, Sidebar, Header
│   ├── shared/                   # KPICard, StatusBadge, EmptyState
│   ├── forms/                    # ClientForm, TacheForm, etc.
│   ├── charts/                   # Recharts components
│   ├── prospection/              # Lead management components
│   │   └── agenda/               # Calendar integration
│   ├── opportunites/             # Pipeline components
│   │   ├── widgets/              # AmountSelector, ProbabilitySlider
│   │   └── tabs/                 # InfoTab, HistoryTab
│   ├── devis/                    # Quote editor components
│   ├── onboarding/               # Tour components
│   └── portail/                  # Client portal components
│
├── hooks/                        # 23 React Query hooks
│   ├── use-clients.ts
│   ├── use-projets.ts
│   ├── use-opportunites.ts
│   ├── use-taches.ts
│   ├── use-factures.ts
│   ├── use-prospects.ts
│   ├── use-equipe.ts
│   ├── use-interactions.ts
│   ├── use-services.ts
│   ├── use-lignes-devis.ts
│   ├── use-devis.ts
│   ├── use-calendar.ts
│   ├── use-email.ts
│   ├── use-company-search.ts
│   ├── use-google-places.ts
│   ├── use-import-leads.ts
│   ├── use-convert-opportunity.ts
│   ├── use-auth.ts
│   ├── use-profiles.ts
│   ├── use-company-settings.ts
│   ├── use-debounce.ts
│   └── use-onboarding-tour.ts
│
├── lib/                          # Utilities and services
│   ├── supabase.ts               # Supabase client
│   ├── auth.ts                   # NextAuth.js config
│   ├── utils.ts                  # cn(), formatters
│   ├── queryKeys.ts              # Query key factory
│   ├── errors.ts                 # AppError hierarchy
│   ├── api-error-handler.ts      # Centralized error handling
│   ├── schemas/api.ts            # Zod validation schemas
│   ├── mappers/                  # Data mappers (6 files)
│   ├── services/                 # External service wrappers
│   │   ├── calendar-service.ts   # Google + Microsoft
│   │   └── email-service.ts      # Gmail + Outlook
│   ├── pdf/                      # PDF generation
│   │   └── browser-pool.ts       # Puppeteer pool
│   └── templates/                # PDF templates
│       ├── devis-template.ts
│       └── facture-template.ts
│
├── providers/                    # React context providers
│   ├── query-provider.tsx
│   ├── session-provider.tsx
│   └── onboarding-provider.tsx
│
├── types/                        # TypeScript definitions
│   ├── index.ts                  # ~600 lines, 25+ interfaces
│   └── constants.ts              # Centralized enums
│
├── test/                         # Test infrastructure
│   ├── setup.ts
│   ├── utils.tsx
│   └── mocks/
│
└── proxy.ts                      # Next.js 16 proxy (auth middleware)

supabase/
└── migrations/                   # 22 SQL migration files
    ├── 00_extensions.sql
    ├── 01_schema.sql             # 21 tables + ENUMs
    ├── 02_rls.sql                # Row Level Security
    ├── 03_functions.sql          # Triggers
    └── ...

specs/                            # 7 feature specifications
├── 001-crm-axivity-interface/
├── 002-crm-ameliorations/
├── 003-prospection/
├── 004-onboarding-tour/
├── 005-supabase-migration/
├── 006-devis/
└── 007-refactorisation/
```

---

## Data Model

### Core Tables (21)

| Category | Tables | Description |
|----------|--------|-------------|
| **CRM Core** | `clients`, `contacts`, `interactions` | Customer relationship management |
| **Sales Pipeline** | `opportunites`, `catalogue_services`, `lignes_devis`, `devis` | Quote generation |
| **Project Management** | `projets`, `taches`, `modeles_taches` | Project and task tracking |
| **Finance** | `factures` | Invoicing and payment tracking |
| **Time & Resources** | `journal_temps`, `equipe` | Time tracking and team |
| **Knowledge & Strategy** | `connaissances`, `objectifs`, `resultats_cles` | OKRs |
| **Ecosystem** | `feedback_client`, `partenaires` | Feedback and partners |
| **System** | `changelog`, `scenarios_previsionnels`, `accomplissements`, `demandes_evolution`, `parametres_entreprise`, `profiles` | Configuration |

### Key Relationships

```
profiles ←──────────────────────────────────────────────────────┐
    │                                                            │
    ▼                                                            │
clients ─────→ contacts ─────→ interactions                      │
    │              │                 │                           │
    │              ▼                 │                           │
    │        opportunites ←──────────┘                           │
    │              │                                             │
    │              ├─────→ lignes_devis ←── catalogue_services   │
    │              │                                             │
    │              └─────→ devis                                 │
    │                        │                                   │
    └─────→ projets ─────────┼─────→ factures                   │
               │             │                                   │
               ▼             │                                   │
           taches ←──────────┤                                   │
               │             │                                   │
               ▼             │                                   │
        journal_temps        │                                   │
               │             │                                   │
               └─────────────┴───────────────────────────────────┘
                                    (owner_id, assignee_id, etc.)
```

### ENUMs

| Enum | Values |
|------|--------|
| `client_status` | Prospect, Actif, Inactif, Churned |
| `opportunity_status` | Qualifié, Proposition, Négociation, Gagné, Perdu |
| `project_status` | Cadrage, En cours, En pause, Terminé, Annulé |
| `task_status` | À faire, En cours, En revue, Terminé |
| `task_priority` | Basse, Moyenne, Haute, Critique |
| `invoice_status` | Brouillon, Envoyé, Payé, En retard, Annulé |
| `prospect_status` | À appeler, Appelé - pas répondu, Rappeler, RDV planifié, RDV effectué, Qualifié, Non qualifié, Perdu |
| `user_role` | admin, manager, commercial, membre, client |

---

## API Routes

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth.js handlers (Google + Microsoft OAuth) |

### Calendar Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calendar/events?timeMin=&timeMax=` | Get calendar events (auto-detects provider) |
| `POST` | `/api/calendar/events` | Create calendar event |

### Email

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/email/send` | Send email via Gmail or Outlook |

### Devis (Quotes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/devis/preview` | Generate preview PDF (not saved) |
| `POST` | `/api/devis/generate` | Generate final PDF + save to DB |
| `POST` | `/api/devis/send` | Send quote by email via Resend |

### Factures (Invoices)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/factures/generate` | Convert devis to facture |
| `POST` | `/api/factures/relance` | Send payment reminder via N8N |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users (admin only) |
| `POST` | `/api/admin/users` | Invite new user |
| `PATCH` | `/api/admin/users/[id]` | Update user role |
| `DELETE` | `/api/admin/users/[id]` | Delete user |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/places/search` | Search Google Places API |

---

## React Query Hooks

### Core CRUD Hooks

| Hook | Entity | Operations |
|------|--------|------------|
| `useClients` | Clients | list, detail, create, update |
| `useProjets` | Projects | list, byStatut, detail, create, update |
| `useOpportunites` | Opportunities | list, byStatut, detail, create, update, updateStatut |
| `useTaches` | Tasks | list, byProjet, detail, create, update, updateStatut |
| `useFactures` | Invoices | list, byClient, detail, create, update |
| `useEquipe` | Team | list, detail |
| `useInteractions` | Interactions | list, byContact, create |
| `useProspects` | Leads | list, withClients, updateStatus, create, KPIs |
| `useServices` | Catalog | list |
| `useLignesDevis` | Quote lines | list, create, update, delete, duplicate |
| `useDevis` | Quotes | list, byOpportunite, send |

### Integration Hooks

| Hook | Purpose |
|------|---------|
| `useCalendar` | Calendar events (Google/Microsoft) |
| `useEmail` | Send emails |
| `useCompanySearch` | French company search (API gouvernement) |
| `useGooglePlaces` | Google Places enrichment |
| `useImportLeads` | CSV import for leads |
| `useConvertOpportunity` | Lead → Opportunity conversion |

### Utility Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Supabase authentication |
| `useProfiles` | User profiles |
| `useCompanySettings` | Company parameters |
| `useDebounce` | Debounced values/callbacks |
| `useOnboardingTour` | Guided tour state |

---

## External Integrations

### OAuth Providers

| Provider | APIs | Use Cases |
|----------|------|-----------|
| **Google** | Calendar, Gmail, Places | RDV booking, email sending, company search |
| **Microsoft** | Graph (Calendar, Mail) | RDV booking, email sending |

### Email Services

| Service | Usage |
|---------|-------|
| **Resend** | Transactional emails (quotes, auth) |
| **Gmail API** | User-initiated emails (follow-up) |
| **Microsoft Graph** | User-initiated emails (follow-up) |

### Automation

| Platform | Workflows |
|----------|-----------|
| **N8N** | Opportunity conversion, Feedback, Task alerts, Invoice reminders |

---

## Security

### Row Level Security (RLS)

5 user roles with different access levels:

| Role | Access |
|------|--------|
| `admin` | Full access to all data |
| `manager` | Team management + clients |
| `commercial` | Pipeline + prospects |
| `membre` | Own tasks + assigned projects |
| `client` | Client portal (read-only) |

### Authentication

- **Supabase Auth**: Primary authentication for CRM users
- **NextAuth.js**: OAuth for calendar/email integrations (Google + Microsoft)
- **Proxy (Next.js 16)**: Route protection via `src/proxy.ts`

---

## Deployment

### Infrastructure

| Component | Platform |
|-----------|----------|
| **Application** | Docker (standalone output) |
| **Database** | Supabase (self-hosted via Coolify) |
| **PaaS** | Coolify |

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://supabase.axivity.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# NextAuth
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_MICROSOFT_ID=...
AUTH_MICROSOFT_SECRET=...

# Email
RESEND_API_KEY=...

# Optional
GOOGLE_PLACES_API_KEY=...
N8N_WEBHOOK_URL=...
```

---

## Testing

| Framework | Coverage | Threshold |
|-----------|----------|-----------|
| **Vitest** | 125 tests | 60% |
| **Testing Library** | Component tests | - |
| **MSW** | API mocking | - |

Test files are located in:
- `src/lib/__tests__/`
- `src/hooks/__tests__/`
- `src/components/**/__tests__/`

---

## Performance Optimizations

1. **React Query Cache**: Centralized query keys, optimistic updates
2. **React.memo**: Applied to frequently rendered cards (OpportunityCard, LeadCard, EventCard)
3. **Puppeteer Pool**: Reusable browser instances for PDF generation
4. **Next.js Turbopack**: Fast development builds
5. **Standalone Output**: Optimized production Docker images

---

## Feature Modules

### Completed (6)

1. **001-crm-axivity-interface**: Core CRM (Dashboard, Kanban, Pages)
2. **003-prospection**: Lead management with calendar/email integration
3. **004-onboarding-tour**: Guided onboarding tour
4. **005-supabase-migration**: Backend migration from Airtable
5. **006-devis**: Quote generation and invoicing
6. **007-refactorisation**: Code quality and scalability

### Planned (1)

1. **002-crm-ameliorations**: Phase 2 improvements (51 tasks)
   - CRUD forms enhancement
   - Client 360° view
   - Dashboard charts
   - CSV/Excel export
   - Task calendar
   - Global search (Cmd+K)
