<!--
## Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (2025-12-19)
- Updated principles:
  - III. Airtable API as Single Source of Truth → III. Supabase as Single Source of Truth
- Updated sections:
  - Technical Stack Requirements: React 18.3.1 → 19.2.3, added Next.js 16.0.10, Airtable → Supabase
  - Compliance Review: Airtable → Supabase reference
- Templates requiring updates:
  - `.specify/templates/plan-template.md` - ✅ no changes needed
  - `.specify/templates/spec-template.md` - ✅ no changes needed
  - `.specify/templates/tasks-template.md` - ✅ no changes needed
- Follow-up TODOs: None
-->

# CRM Axivity Constitution

## Core Principles

### I. Mobile-First Responsive Design

Every interface MUST be designed mobile-first and provide a complete, usable experience across all device sizes:

- **Mobile (<768px)**: Primary design target with bottom navigation, 2-column grid for KPIs, full-width charts, and swipable cards
- **Tablet (768px-1024px)**: Adapted layouts with collapsible sidebar
- **Desktop (>=1024px)**: Full sidebar (240px) with expanded content area

**Rationale**: The target users (agency team members) need access to the CRM from any device, including on-the-go mobile access for client meetings and task updates.

### II. Shadcn/UI Component Exclusivity

All UI components MUST be built using Shadcn/UI. No custom component libraries or alternative UI frameworks are permitted.

Required component categories:
- **Layout**: `Card`, `Sheet`, `Tabs`, `ScrollArea`, `Separator`
- **Navigation**: `NavigationMenu`, `Command`, `DropdownMenu`, `Breadcrumb`
- **Forms**: `Input`, `Select`, `Calendar`, `Form`, `Checkbox`, `Textarea`
- **Data Display**: `Table`, `Badge`, `Avatar`, `Progress`, `Skeleton`
- **Feedback**: `Toast`, `Dialog`, `AlertDialog`, `Tooltip`
- **Actions**: `Button`, `Toggle`, `Switch`

**Rationale**: Shadcn/UI provides consistent, accessible, and customizable components that integrate seamlessly with Tailwind CSS, ensuring design coherence and reducing maintenance burden.

### III. Supabase as Single Source of Truth

All data operations MUST go through Supabase. The React application is a presentation layer only - no local database or data caching beyond reasonable UI performance optimizations (React Query).

- Supabase URL: `https://supabase.axivity.cloud`
- All 21 tables are defined in PostgreSQL with Row Level Security (RLS)
- CRUD operations MUST use the Supabase client (`lib/supabase.ts`)
- Authentication is handled via Supabase Auth

**Rationale**: Supabase serves as the "nervous system" of the agency, enabling both the web interface and N8N automations to operate on the same data source without synchronization issues. Migration from Airtable completed December 2025.

> **Legacy Note**: Original implementation used Airtable REST API (Base ID: `appEf6JtWFdfLwsU6`). Airtable client preserved in `lib/airtable.ts` for reference.

### IV. Automation-Ready Architecture

All data structures and UI flows MUST support automated workflows via N8N/Make integration:

- Links between tables MUST be bidirectional where specified
- Status fields MUST use consistent enum values across the system
- Date fields MUST be present for time-based automation triggers
- Email-accessible fields MUST use `Membre Equipe` link (not Collaborateur) for API access

**Rationale**: The CRM includes 4 core N8N workflows (feedback, conversion, alerts, relances) that depend on consistent data structure.

### V. Data Integrity & Bidirectional Relations

All table relationships MUST maintain referential integrity:

- When an Opportunity converts to a Project, both records MUST link to each other
- Client relationships MUST cascade correctly (Client -> Contacts -> Interactions)
- Rollup and formula fields MUST NOT be modified via API (read-only)
- Primary fields MUST remain simple text type

**Rationale**: The 21-table architecture depends on reliable relationships for calculated fields (CA Total, % Taches Terminees, Valeur Ponderee) to function correctly.

### VI. Simplicity & YAGNI

Start with the minimum viable implementation. Avoid premature optimization and unnecessary abstractions:

- Implement features as specified in the documentation
- Do not add extra configuration options unless requested
- Do not create wrapper abstractions around Shadcn components
- Do not implement features "for future use"

**Rationale**: The cockpit is designed to be operational quickly. Over-engineering delays delivery and complicates maintenance.

## Technical Stack Requirements

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.3 | Frontend framework |
| **Next.js** | 16.0.10 | App Router + Turbopack |
| **Shadcn/UI** | Latest | UI component library |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Recharts** | Latest | Charts and visualizations |
| **TypeScript** | 5.x | Type safety |
| **Supabase** | Self-hosted | Backend data layer (migrated from Airtable) |

**Project Structure**:
```
src/
├── app/                    # Routes and pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application with sidebar
│   └── portail/           # External client portal
├── components/
│   ├── ui/                # Shadcn components
│   ├── layout/            # Sidebar, Header, MobileNav
│   ├── dashboard/         # KPIs, charts
│   ├── projets/           # Project components
│   ├── taches/            # Task components
│   ├── clients/           # Client components
│   └── shared/            # DataTable, StatusBadge
├── lib/
│   ├── airtable.ts        # Airtable API client
│   ├── utils.ts           # Utility functions
│   └── hooks/             # React hooks
└── types/                 # TypeScript types
```

## Development Workflow

### Before Implementation

1. Read the relevant section in `Documentation/passation_projet_agence_ia.md`
2. Verify the Airtable table structure matches expected fields
3. Check if N8N workflows depend on the feature being modified

### During Implementation

1. Use Shadcn CLI to add new components: `npx shadcn@latest add [component]`
2. Test responsive behavior at 3 breakpoints minimum
3. Verify Airtable API calls work with real data
4. Ensure all user-facing text is in French

### After Implementation

1. Test on mobile device (or mobile emulator)
2. Verify no console errors related to Airtable API
3. Document any new Table IDs or Field IDs used

## Governance

This constitution supersedes all other development practices for the CRM Axivity Interface project. Amendments require:

1. Documentation of the change rationale
2. Update to this constitution file
3. Verification that templates remain consistent

**Versioning Policy**: MAJOR.MINOR.PATCH
- MAJOR: Principle removal or fundamental architecture change
- MINOR: New principle or significant guidance expansion
- PATCH: Clarifications and non-breaking updates

**Compliance Review**: All pull requests MUST verify:
- [ ] Mobile-first responsive design implemented
- [ ] Only Shadcn/UI components used
- [ ] Supabase used correctly (no local data storage)
- [ ] Bidirectional relations maintained
- [ ] No unnecessary complexity added

**Version**: 1.1.0 | **Ratified**: 2025-12-14 | **Last Amended**: 2025-12-19
