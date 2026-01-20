# CRM Axivity - Components Catalog

> Generated: 2026-01-06 | Version: 1.0.0

## Overview

The CRM Axivity interface contains **91 React components** organized into functional categories. All UI components are built exclusively with Shadcn/UI (new-york style) and Tailwind CSS.

### Directory Structure

```
src/components/
├── ui/               # Shadcn/UI primitives (29 components)
├── layout/           # App shell components
├── shared/           # Reusable business components
├── forms/            # Entity CRUD forms
├── charts/           # Recharts visualizations
├── prospection/      # Prospection module
│   └── agenda/       # Calendar integration
├── opportunites/     # Sales pipeline
│   ├── widgets/      # Mini-sheet widgets
│   └── tabs/         # Mini-sheet tabs
├── devis/            # Quote generation
├── onboarding/       # User onboarding tour
└── portail/          # Client portal
```

---

## UI Primitives (Shadcn/UI)

29 Shadcn/UI components installed via `npx shadcn@latest add`.

| Component | File | Usage |
|-----------|------|-------|
| Alert | `ui/alert.tsx` | Warning/info messages |
| AlertDialog | `ui/alert-dialog.tsx` | Confirmation dialogs |
| Avatar | `ui/avatar.tsx` | User/client avatars |
| Badge | `ui/badge.tsx` | Status indicators |
| Breadcrumb | `ui/breadcrumb.tsx` | Navigation breadcrumbs |
| Button | `ui/button.tsx` | Primary action buttons |
| Calendar | `ui/calendar.tsx` | Date picker calendar |
| Card | `ui/card.tsx` | Content containers |
| Checkbox | `ui/checkbox.tsx` | Boolean inputs |
| Command | `ui/command.tsx` | Command palette (Cmd+K) |
| Dialog | `ui/dialog.tsx` | Modal dialogs |
| DropdownMenu | `ui/dropdown-menu.tsx` | Action menus |
| Form | `ui/form.tsx` | React Hook Form integration |
| HoverCard | `ui/hover-card.tsx` | Hover previews |
| Input | `ui/input.tsx` | Text inputs |
| Label | `ui/label.tsx` | Form labels |
| Popover | `ui/popover.tsx` | Floating content |
| Progress | `ui/progress.tsx` | Progress bars |
| RadioGroup | `ui/radio-group.tsx` | Radio selections |
| ScrollArea | `ui/scroll-area.tsx` | Scrollable containers |
| Select | `ui/select.tsx` | Dropdown selects |
| Separator | `ui/separator.tsx` | Visual dividers |
| Sheet | `ui/sheet.tsx` | Side panels |
| Skeleton | `ui/skeleton.tsx` | Loading placeholders |
| Slider | `ui/slider.tsx` | Range inputs |
| Switch | `ui/switch.tsx` | Toggle switches |
| Table | `ui/table.tsx` | Data tables |
| Tabs | `ui/tabs.tsx` | Tabbed content |
| Textarea | `ui/textarea.tsx` | Multi-line inputs |
| Toast/Toaster | `ui/toast.tsx`, `ui/toaster.tsx` | Notifications |
| Tooltip | `ui/tooltip.tsx` | Hover tooltips |

---

## Layout Components

Application shell and navigation.

### Sidebar

**File**: `layout/Sidebar.tsx`

Main navigation sidebar with:
- Logo and app title
- Navigation links with icons
- Active route highlighting
- Collapsible on mobile

**Navigation Items**:
- Dashboard (`/`)
- Prospection (`/prospection`)
- Pipeline (`/opportunites`)
- Projets (`/projets`)
- Taches (`/taches`)
- Clients (`/clients`)
- Factures (`/factures`)
- Equipe (`/equipe`)
- Rapports (`/rapports`)

---

### Header

**File**: `layout/Header.tsx`

Top navigation bar with:
- Page title
- Search trigger (Cmd+K)
- Notifications panel
- User menu
- Tour trigger button

---

### AppLayout

**File**: `layout/app-layout.tsx`

Main layout wrapper providing:
- Sidebar + Header composition
- Main content area
- Responsive behavior
- Onboarding tour integration

---

### AppBreadcrumb

**File**: `layout/AppBreadcrumb.tsx`

Dynamic breadcrumb based on current route.

---

## Shared Components

Reusable business components.

### KPICard

**File**: `shared/kpi-card.tsx`

Dashboard KPI display card with:
- Icon
- Label
- Value (formatted)
- Trend indicator (optional)
- Loading skeleton state

**Props**:
```typescript
interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  isLoading?: boolean;
}
```

---

### StatusBadge

**File**: `shared/status-badge.tsx`

Colored badge for entity statuses with memoization.

**Props**:
```typescript
interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
}
```

**Usage**:
```tsx
<StatusBadge
  status={opportunite.statut}
  colorMap={OPPORTUNITY_STATUS_COLORS}
/>
```

---

### SearchCommand

**File**: `shared/SearchCommand.tsx`

Global search command palette (Cmd+K) with:
- Real-time search across entities
- Keyboard navigation
- Quick actions

---

### PageHeader

**File**: `shared/page-header.tsx`

Page title and actions bar.

---

### LoadingSpinner

**File**: `shared/loading-spinner.tsx`

Centered loading indicator.

---

### EmptyState

**File**: `shared/empty-state.tsx`

Empty list placeholder with icon and message.

---

### ExportButton

**File**: `shared/ExportButton.tsx`

CSV export functionality for data tables.

---

### FormDialog

**File**: `shared/FormDialog.tsx`

Modal dialog wrapper for forms.

---

### ChartContainer

**File**: `shared/ChartContainer.tsx`

Wrapper for Recharts with loading state.

---

### HealthBadge

**File**: `shared/HealthBadge.tsx`

Client health indicator badge.

---

### NotificationPanel

**File**: `shared/NotificationPanel.tsx`

Dropdown panel for system notifications.

---

## Form Components

Entity CRUD forms using React Hook Form + Zod.

### ClientForm

**File**: `forms/ClientForm.tsx`

Client creation/editing form with:
- Company name
- Industry sector
- Status select
- Contact information
- Address fields (SIRET, address, postal code, city, country)

---

### OpportuniteForm

**File**: `forms/OpportuniteForm.tsx`

Opportunity creation form with:
- Opportunity name
- Client select
- Contact select
- Estimated value
- Probability slider
- Expected close date

---

### ProjetForm

**File**: `forms/ProjetForm.tsx`

Project form with:
- Project brief
- Client link
- Status
- Dates (start, planned end)
- Budget
- Priority

---

### TacheForm

**File**: `forms/TacheForm.tsx`

Task form with:
- Task name
- Description
- Project link
- Assigned team member
- Priority
- Due date
- Estimated hours

---

### FactureForm

**File**: `forms/FactureForm.tsx`

Invoice form with:
- Invoice number (auto-generated)
- Client/Project links
- Amount
- Status
- Dates (issue, due, payment)

---

## Chart Components

Recharts-based visualizations.

### CAMensuelChart

**File**: `charts/CAMensuelChart.tsx`

Monthly revenue bar chart for dashboard.

---

### PipelineChart

**File**: `charts/PipelineChart.tsx`

Pipeline funnel visualization by stage.

---

### ProgressionChart

**File**: `charts/ProgressionChart.tsx`

Project completion progress over time.

---

## Prospection Module Components

### ProspectionKPIs

**File**: `prospection/ProspectionKPIs.tsx`

KPI cards for prospection dashboard:
- Leads to call
- Callbacks due
- Qualification rate
- Overdue leads

---

### LeadCard

**File**: `prospection/LeadCard.tsx`

Lead card with `React.memo` optimization:
- Contact info
- Client company
- Lead source badge
- Status badge
- Action buttons (Call, Schedule, Convert)
- Click to edit

---

### ProspectForm

**File**: `prospection/ProspectForm.tsx`

Lead creation/editing form with:
- Two modes: Prospection workflow / Direct creation
- Company search (API Gouv integration)
- Google Places enrichment (phone, website)
- First contact type selection
- Initial status selection

---

### ProspectionFilters

**File**: `prospection/ProspectionFilters.tsx`

Filter bar for lead list:
- Status multi-select
- Source filter
- Date filter
- Search input

---

### CallResultDialog

**File**: `prospection/CallResultDialog.tsx`

Dialog for recording call outcomes:
- Result status
- Notes
- Callback scheduling
- Meeting scheduling

---

### EmailComposer

**File**: `prospection/EmailComposer.tsx`

Email composition dialog with:
- Recipient display
- Subject input
- Rich text body
- Send via OAuth (Gmail/Outlook)

---

### CompanySearch

**File**: `prospection/CompanySearch.tsx`

Company autocomplete search using:
- API Gouv (recherche-entreprises)
- Debounced search
- Auto-fill SIRET, address, sector

---

### LeadImportDialog

**File**: `prospection/LeadImportDialog.tsx`

CSV import wizard with:
- File upload
- Column mapping interface
- Preview
- Import progress

---

### ProspectProgressStepper

**File**: `prospection/ProspectProgressStepper.tsx`

Visual stepper showing prospect journey stages.

---

### PastRdvNotifications

**File**: `prospection/PastRdvNotifications.tsx`

Alert for meetings needing follow-up.

---

## Prospection Agenda Components

Calendar integration for meetings.

### AgendaTab

**File**: `prospection/agenda/AgendaTab.tsx`

Agenda view with:
- Week calendar
- Event list
- Calendar auth status

---

### WeekCalendar

**File**: `prospection/agenda/WeekCalendar.tsx`

Weekly calendar grid with:
- Hour slots
- Event positioning
- Click to create

---

### EventCard

**File**: `prospection/agenda/EventCard.tsx`

Calendar event card with `React.memo`:
- Event title
- Time range
- Attendees
- Video call link

---

### CreateEventDialog

**File**: `prospection/agenda/CreateEventDialog.tsx`

Event creation dialog:
- Title
- Date/time picker
- Attendees
- Location
- Video conference toggle

---

### CalendarAuthButton

**File**: `prospection/agenda/CalendarAuthButton.tsx`

OAuth connection button with provider selection:
- Google Calendar
- Microsoft 365 (Outlook)

---

## Opportunities Module Components

### OpportunityCard

**File**: `opportunites/OpportunityCard.tsx`

Kanban card with `React.memo`:
- Opportunity name
- Client name
- Value display
- Probability badge
- Close date
- Action dropdown

---

### OpportunityMiniSheet

**File**: `opportunites/OpportunityMiniSheet.tsx`

Side sheet for quick opportunity editing (268 lines after refactor):
- Info tab (amount, probability, date)
- History tab (interactions timeline)
- Quote editor transition

---

### Opportunity Widgets

**Location**: `opportunites/widgets/`

| Component | Description |
|-----------|-------------|
| `AmountSelector.tsx` | Quick amount presets (5k, 10k, 25k, 50k, 100k, 200k) + increments |
| `ProbabilitySlider.tsx` | 0-100% slider with step 5 |
| `ManualNoteForm.tsx` | Note creation form (amber style) |
| `InteractionTimeline.tsx` | Vertical timeline with type icons |

---

### Opportunity Tabs

**Location**: `opportunites/tabs/`

| Component | Description |
|-----------|-------------|
| `OpportunityInfoTab.tsx` | Amount, probability, date editing |
| `OpportunityHistoryTab.tsx` | Interactions + note creation |

---

## Devis (Quote) Module Components

### QuoteEditorSheet

**File**: `devis/QuoteEditorSheet.tsx`

Full quote editor sheet with:
- Service selection
- Line items table
- Totals calculation
- Preview/Generate actions
- Email sending

---

### QuoteLinesTable

**File**: `devis/QuoteLinesTable.tsx`

Quote lines CRUD table:
- Add from catalog
- Manual entry
- Quantity/price editing
- Discount input
- Delete/duplicate actions

---

### QuoteLineRow

**File**: `devis/QuoteLineRow.tsx`

Single quote line row component.

---

### QuoteTotals

**File**: `devis/QuoteTotals.tsx`

Quote totals display:
- Total HT
- TVA (20%)
- Total TTC

---

### ServiceSelector

**File**: `devis/ServiceSelector.tsx`

Service catalog selector:
- Category filter
- Search
- Price display
- Add to quote

---

## Onboarding Components

### OnboardingTour

**File**: `onboarding/OnboardingTour.tsx`

Guided tour component with:
- 11 steps
- Spotlight effect
- Progress indicator
- Keyboard navigation
- localStorage persistence

---

### TourTrigger

**File**: `onboarding/TourTrigger.tsx`

Help button in header:
- Tooltip hint
- Pulse animation (first visit)
- Click to restart tour

---

## Portal Components

### PortailHeader

**File**: `portail/PortailHeader.tsx`

Client portal header with:
- Client logo
- Client name
- Logout button

---

## Component Testing

Tests located in `__tests__/` subdirectories:

```
src/components/
├── shared/__tests__/
│   ├── empty-state.test.tsx
│   └── ExportButton.test.tsx
└── opportunites/widgets/__tests__/
    ├── AmountSelector.test.tsx
    ├── ProbabilitySlider.test.tsx
    └── InteractionTimeline.test.tsx
```

**Run tests**:
```bash
npm test -- --grep="components"
```

---

## Component Best Practices

### Memoization

Performance-critical components use `React.memo`:

```typescript
export const LeadCard = memo(function LeadCard({ prospect, onClick }: Props) {
  // Component implementation
});
```

**Memoized components**:
- `OpportunityCard`
- `LeadCard`
- `EventCard`
- `StatusBadge`

### Prop Types

All components use TypeScript interfaces:

```typescript
interface ComponentProps {
  // Required props
  data: DataType;
  // Optional props with defaults
  variant?: "default" | "outline";
  // Callbacks
  onClick?: () => void;
}
```

### Loading States

Use Skeleton for loading:

```tsx
if (isLoading) {
  return <Skeleton className="h-24 w-full" />;
}
```

### Error Boundaries

Wrap complex components in error boundaries for graceful degradation.

