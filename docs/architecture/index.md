# CRM Axivity - Documentation Index

> Generated: 2026-01-06 | Scan Level: Exhaustive | Version: 1.0.0

## Project Summary

**CRM Axivity** is an operational cockpit for an AI Agency, managing the complete client lifecycle from prospecting through invoicing. Built as a modern web application with Next.js 16 and Supabase backend.

### Quick Stats

| Metric | Value |
|--------|-------|
| **Project Type** | Web Application (Monolith) |
| **Framework** | Next.js 16.0.10 + React 19.2.3 |
| **Backend** | Supabase (self-hosted via Coolify) |
| **Database Tables** | 21 PostgreSQL tables |
| **API Routes** | 11 endpoints |
| **React Hooks** | 23 custom hooks |
| **UI Components** | 91 components |
| **Test Coverage** | 125 tests (Vitest) |

---

## Documentation Files

### Core Documentation

| Document | Description | Status |
|----------|-------------|--------|
| [architecture.md](./architecture.md) | Complete system architecture | Generated |
| [api-contracts.md](./api-contracts.md) | API reference with request/response schemas | Generated |
| [data-models.md](./data-models.md) | TypeScript interfaces and database entities | Generated |
| [hooks-reference.md](./hooks-reference.md) | React Query hooks catalog | Generated |
| [components-catalog.md](./components-catalog.md) | UI components inventory | Generated |

### Existing Documentation

| Document | Location | Description |
|----------|----------|-------------|
| CLAUDE.md | `Interface/CLAUDE.md` | Development guidelines (618 lines) |
| Project CLAUDE.md | `../CLAUDE.md` | Airtable base documentation |
| Migration Plan | `Documentation/Migration_Supabase_Plan.md` | Supabase migration strategy |
| Phase 2 Roadmap | `Documentation/Ameliorations_Phase2_Roadmap.md` | Future improvements |
| Refactoring Plan | `Documentation/Refactorisation_Scalabilite_Plan.md` | Code quality improvements |

### Feature Specifications

| Feature | Location | Status |
|---------|----------|--------|
| 001 - CRM Interface | `specs/001-crm-axivity-interface/` | Complete |
| 002 - Improvements | `specs/002-crm-ameliorations/` | Planned |
| 003 - Prospection | `specs/003-prospection/` | Complete |
| 004 - Onboarding Tour | `specs/004-onboarding-tour/` | Complete |
| 005 - Supabase Migration | `specs/005-supabase-migration/` | Complete |
| 006 - Devis Module | `specs/006-devis/` | Complete |
| 007 - Refactoring | `specs/007-refactorisation/` | Complete |

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.10 | React framework (App Router + Turbopack) |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Shadcn/UI | Latest | Component library (new-york style) |
| React Query | 5.x | Server state management |
| Recharts | Latest | Data visualization |
| @hello-pangea/dnd | 18.x | Drag and drop (Kanban) |

### Backend

| Technology | Purpose |
|------------|---------|
| Supabase | Database + Auth + Storage |
| PostgreSQL | Database engine |
| NextAuth.js | OAuth (Google + Microsoft) |
| Puppeteer | PDF generation |
| Resend | Transactional emails |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Coolify | Self-hosted deployment |
| N8N | Workflow automation |
| Google/Microsoft APIs | Calendar + Email integration |

---

## Key Integrations

### OAuth Providers

```
┌─────────────────────────────────────────────────────────────┐
│                    CalendarAuthButton                        │
│              [Google]     [Microsoft 365]                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   NextAuth.js v5                             │
│   Google Provider          │       MicrosoftEntraID          │
│   - calendar scope         │       - Calendars.ReadWrite     │
│   - gmail.send scope       │       - Mail.Send               │
└─────────────────────────────────────────────────────────────┘
```

### N8N Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| Conversion Opportunite | Every minute | Convert won opportunities to projects |
| Feedback Post-Projet | Daily 9h | Request client feedback |
| Alertes Taches | Daily 9h (Mon-Fri) | Notify overdue tasks |
| Relances Factures | Daily 10h (Mon-Fri) | Send payment reminders |

---

## Development Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Docker (for Supabase local development)

### Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Type check
npm run type-check
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://supabase.axivity.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# NextAuth
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_MICROSOFT_ID=...
AUTH_MICROSOFT_SECRET=...

# Services
RESEND_API_KEY=...
GOOGLE_PLACES_API_KEY=...
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js 16 App Router                       │
├───────────────┬───────────────┬───────────────┬───────────────────-─┤
│   Dashboard   │   Pipeline    │  Prospection  │   Other Pages       │
│      /        │ /opportunites │ /prospection  │ /projets, /clients  │
└───────────────┴───────────────┴───────────────┴─────────────────────┘
        │                │                │                │
        └────────────────┴────────────────┴────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    React Query Hooks   │
                    │   (23 custom hooks)    │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   Supabase    │      │  API Routes   │      │  External     │
│   Client      │      │  (11 routes)  │      │  Services     │
└───────────────┘      └───────────────┘      └───────────────┘
        │                       │                       │
        ▼                       │                       │
┌───────────────┐               │                       │
│  PostgreSQL   │               │         ┌─────────────┴──────────┐
│  (21 tables)  │               │         │ Google Calendar/Gmail  │
│  + RLS        │               │         │ Microsoft Graph        │
└───────────────┘               │         │ Resend                 │
                                │         │ API Gouv               │
                    ┌───────────┴─────┐   │ Google Places          │
                    │ NextAuth OAuth  │   └────────────────────────┘
                    └─────────────────┘
```

---

## Entity Relationships

```
Clients ─┬─► Contacts ─► Interactions
         │
         ├─► Opportunites ─► Lignes de Devis ◄─ Catalogue Services
         │        │
         │        ▼
         └─► Projets ─┬─► Taches ─► Journal Temps
              │       │
              │       └─► Equipe
              │
              └─► Factures
```

---

## File Structure

```
Interface/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, register)
│   │   ├── (main)/             # Protected pages with sidebar
│   │   └── api/                # API routes
│   ├── components/             # React components (91 total)
│   ├── hooks/                  # React Query hooks (23 total)
│   ├── lib/                    # Utilities and services
│   │   ├── supabase.ts         # Supabase client
│   │   ├── queryKeys.ts        # React Query keys
│   │   ├── errors.ts           # Error types
│   │   ├── schemas/            # Zod validation
│   │   ├── mappers/            # Data transformers
│   │   └── pdf/                # PDF generation
│   ├── types/                  # TypeScript definitions
│   └── test/                   # Test utilities
├── supabase/
│   └── migrations/             # SQL migrations (19 files)
├── Workflows_n8n/              # N8N workflow exports
├── docs/                       # Generated documentation
└── specs/                      # Feature specifications
```

---

## Security Model

### Row Level Security (RLS)

5 user roles with cascading permissions:

| Role | Access |
|------|--------|
| `admin` | Full access |
| `manager` | Team + clients |
| `commercial` | Pipeline + prospects |
| `membre` | Assigned tasks/projects |
| `client` | Portal (read-only) |

### Authentication

- **Supabase Auth**: Email/password for CRM users
- **NextAuth.js**: OAuth for calendar/email integration
- **SMTP**: Resend for transactional emails

---

## Recent Updates

| Date | Change |
|------|--------|
| 2026-01-06 | Generated exhaustive documentation |
| 2026-01-05 | Production email configuration |
| 2025-12-24 | Phase 007 refactoring complete |
| 2025-12-23 | Devis module complete |
| 2025-12-22 | Microsoft 365 integration |
| 2025-12-19 | Supabase migration complete |
| 2025-12-15 | Prospection module complete |

---

## Next Steps

1. **Review generated documentation** for accuracy
2. **Update CLAUDE.md** with any corrections
3. **Consider Phase 2 improvements** from `specs/002-crm-ameliorations/`
4. **Maintain documentation** as codebase evolves

---

## Support

- **Issues**: Report via GitHub Issues
- **Documentation updates**: Edit markdown files in `docs/`
- **Feature specs**: Add to `specs/` directory

