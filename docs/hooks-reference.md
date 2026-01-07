# CRM Axivity - Hooks Reference

> Generated: 2026-01-07 | Version: 1.1.0

## Overview

The CRM Axivity application uses React Query (TanStack Query) for all server state management. This document catalogs all 24 custom hooks organized by domain.

### Architecture

```
src/hooks/
├── index.ts                    # Re-exports core hooks
├── use-clients.ts              # Client CRUD operations
├── use-projets.ts              # Project management
├── use-opportunites.ts         # Sales pipeline (with optimistic updates)
├── use-taches.ts               # Task management
├── use-factures.ts             # Invoice operations
├── use-equipe.ts               # Team management
├── use-interactions.ts         # Interaction history
├── use-prospects.ts            # Prospection module
├── use-services.ts             # Service catalog
├── use-lignes-devis.ts         # Quote line items
├── use-devis.ts                # Quote management
├── use-convert-opportunity.ts  # Lead conversion
├── use-import-leads.ts         # CSV import
├── use-calendar.ts             # Calendar integration
├── use-email.ts                # Email sending
├── use-debounce.ts             # Debounce utilities
├── use-company-search.ts       # Company lookup (API Gouv)
├── use-google-places.ts        # Google Places enrichment
├── use-onboarding-tour.ts      # Onboarding tour state
├── use-auth.ts                 # Authentication
├── use-auth-sync.ts            # Cross-tab session sync
├── use-profiles.ts             # User profiles
└── use-company-settings.ts     # Company settings
```

### Query Keys

All query keys are centralized in `src/lib/queryKeys.ts` for consistent cache management:

```typescript
import { queryKeys } from "@/lib/queryKeys";

// Usage examples:
queryKeys.clients.all           // ["clients"]
queryKeys.clients.detail(id)    // ["clients", "detail", id]
queryKeys.opportunites.byStatut() // ["opportunites", "par-statut"]
```

---

## Core Entity Hooks

### use-clients.ts

Manages client entities with full CRUD support.

| Hook | Type | Description |
|------|------|-------------|
| `useClients(filters?)` | Query | Fetch all clients with optional filters |
| `useClient(id)` | Query | Fetch single client by ID |
| `useCreateClient()` | Mutation | Create new client |
| `useUpdateClient()` | Mutation | Update existing client |
| `useDeleteClient()` | Mutation | Delete client |

**Query Keys**: `queryKeys.clients.*`

**Example**:
```typescript
const { data: clients, isLoading } = useClients({ statut: "Actif" });
const createClient = useCreateClient();
createClient.mutate({ nom: "Acme Corp", statut: "Prospect" });
```

---

### use-projets.ts

Manages project lifecycle from creation to completion.

| Hook | Type | Description |
|------|------|-------------|
| `useProjets(filters?)` | Query | Fetch projects with optional filters |
| `useProjetsActifs(userId?)` | Query | Fetch active projects |
| `useProjet(id)` | Query | Fetch single project |
| `useCreateProjet()` | Mutation | Create new project |
| `useUpdateProjet()` | Mutation | Update project |
| `useDeleteProjet()` | Mutation | Delete project |

**Query Keys**: `queryKeys.projets.*`

---

### use-opportunites.ts

Sales pipeline management with **optimistic updates** for Kanban drag & drop.

| Hook | Type | Description |
|------|------|-------------|
| `useOpportunites(filters?)` | Query | Fetch opportunities |
| `useOpportunitesParStatut()` | Query | Fetch grouped by status (Kanban) |
| `useOpportunite(id)` | Query | Fetch single opportunity |
| `useCreateOpportunite()` | Mutation | Create opportunity |
| `useUpdateOpportunite()` | Mutation | Update with optimistic UI |
| `useUpdateOpportuniteStatut()` | Mutation | Status change (Kanban drag) |
| `useDeleteOpportunite()` | Mutation | Delete opportunity |

**Query Keys**: `queryKeys.opportunites.*`

**Optimistic Update Pattern**:
```typescript
const updateStatut = useUpdateOpportuniteStatut();

// Kanban drag handler
const handleDrop = (id: string, newStatut: OpportunityStatus) => {
  updateStatut.mutate(
    { id, statut: newStatut },
    {
      onMutate: async ({ id, statut }) => {
        // Cancel pending queries
        await queryClient.cancelQueries(queryKeys.opportunites.byStatut());

        // Snapshot previous value
        const previous = queryClient.getQueryData(queryKeys.opportunites.byStatut());

        // Optimistically update
        queryClient.setQueryData(queryKeys.opportunites.byStatut(), (old) => {
          // Move item between columns
        });

        return { previous };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        queryClient.setQueryData(queryKeys.opportunites.byStatut(), context?.previous);
      },
    }
  );
};
```

---

### use-taches.ts

Task management with workload tracking.

| Hook | Type | Description |
|------|------|-------------|
| `useTaches(filters?)` | Query | Fetch tasks |
| `useTachesEnRetard(userId?)` | Query | Overdue tasks |
| `useMesTaches(membreId)` | Query | Tasks assigned to user |
| `useTache(id)` | Query | Single task |
| `useCreateTache()` | Mutation | Create task |
| `useUpdateTache()` | Mutation | Update task (optimistic) |
| `useDeleteTache()` | Mutation | Delete task |

**Query Keys**: `queryKeys.taches.*`

---

### use-factures.ts

Invoice management with payment reminders.

| Hook | Type | Description |
|------|------|-------------|
| `useFactures(filters?)` | Query | Fetch invoices |
| `useFacturesImpayees()` | Query | Unpaid invoices |
| `useFacturesARelancer()` | Query | Invoices needing reminder |
| `useFacture(id)` | Query | Single invoice |
| `useCreateFacture()` | Mutation | Create invoice |
| `useUpdateFacture()` | Mutation | Update invoice |
| `useEnvoyerRelance()` | Mutation | Send payment reminder |

**Query Keys**: `queryKeys.factures.*`

---

### use-equipe.ts

Team member management and workload.

| Hook | Type | Description |
|------|------|-------------|
| `useEquipe(filters?)` | Query | Fetch team members |
| `useChargeEquipe()` | Query | Team workload summary |
| `useMembre(id)` | Query | Single team member |
| `useCreateMembre()` | Mutation | Add team member |
| `useUpdateMembre()` | Mutation | Update member |

**Query Keys**: `queryKeys.equipe.*`

---

### use-interactions.ts

Communication history tracking.

| Hook | Type | Description |
|------|------|-------------|
| `useInteractions(filters?)` | Query | Fetch interactions |
| `useLastInteractionDate(filters?)` | Query | Last interaction date |
| `useCreateInteraction()` | Mutation | Create interaction |

**Query Keys**: `queryKeys.interactions.*`

---

## Prospection Module Hooks

### use-prospects.ts

Lead management with prospection workflow.

| Hook | Type | Description |
|------|------|-------------|
| `useProspects(filters?)` | Query | Fetch prospects |
| `useProspectsWithClients(filters?)` | Query | Prospects with client data joined |
| `useProspect(id)` | Query | Single prospect |
| `useProspectionKPIs(prospectIds?)` | Query | Prospection dashboard KPIs |
| `useRappelsAujourdhui(userId?)` | Query | Today's callbacks |
| `useRdvAujourdhui(userId?)` | Query | Today's meetings |
| `usePastRdv()` | Query | Past meetings needing follow-up |
| `useCreateProspect()` | Mutation | Create prospect |
| `useUpdateProspectStatus()` | Mutation | Update prospect status |

**Query Keys**: `queryKeys.prospects.*`

**Filter Options**:
```typescript
interface ProspectFilters {
  statut?: ProspectStatus | ProspectStatus[];
  source?: ProspectSource;
  dateRappel?: string;
  search?: string;
}
```

---

### use-convert-opportunity.ts

Convert qualified lead to sales opportunity.

| Hook | Type | Description |
|------|------|-------------|
| `useConvertToOpportunity()` | Mutation | Create opportunity from prospect |

**Usage**:
```typescript
const convert = useConvertToOpportunity();

convert.mutate({
  prospectId: "contact-uuid",
  clientId: "client-uuid",
  opportunite: {
    nom: "Projet Automatisation",
    valeurEstimee: 25000,
    probabilite: 50,
  }
});
```

---

### use-import-leads.ts

Bulk CSV import for lead generation.

| Hook | Type | Description |
|------|------|-------------|
| `useImportLeads()` | Mutation | Import leads from parsed CSV |

**Features**:
- CSV parsing with papaparse
- Manual column mapping
- Batch upsert (client + contact)
- Progress tracking

---

## Quote & Invoice Hooks

### use-services.ts

Service catalog for quote line items.

| Hook | Type | Description |
|------|------|-------------|
| `useServices(filters?)` | Query | Fetch active services |
| `useServiceCategories()` | Query | Distinct categories |
| `useService(id)` | Query | Single service |

**Query Keys**: `queryKeys.services.*`

---

### use-lignes-devis.ts

Quote line item management with real-time calculations.

| Hook | Type | Description |
|------|------|-------------|
| `useLignesDevis(opportuniteId)` | Query | Lines for opportunity |
| `useCreateLigneDevis()` | Mutation | Add line |
| `useUpdateLigneDevis()` | Mutation | Update line |
| `useDeleteLigneDevis()` | Mutation | Remove line |
| `useDuplicateLigneDevis()` | Mutation | Duplicate line |

**Query Keys**: `queryKeys.lignesDevis.*`

**Calculation Example**:
```typescript
// montantHT = quantite * prixUnitaire * (1 - remisePourcent / 100)
const montantHT = ligne.quantite * ligne.prixUnitaire * (1 - ligne.remisePourcent / 100);
```

---

### use-devis.ts

Quote document management.

| Hook | Type | Description |
|------|------|-------------|
| `useDevis(filters?)` | Query | Fetch quotes |
| `useDevisForOpportunite(oppId)` | Query | Quotes for opportunity |
| `useSendDevis()` | Mutation | Send quote by email |

**Query Keys**: `queryKeys.devis.*`

---

## Integration Hooks

### use-calendar.ts

Google Calendar & Microsoft Outlook integration.

| Hook | Type | Description |
|------|------|-------------|
| `useCalendarEvents(range)` | Query | Fetch events for date range |
| `useCalendarStatus()` | Query | Check connection status |
| `useCalendarAuth()` | Hook | Auth state & signIn/signOut |
| `useCreateCalendarEvent()` | Mutation | Create event |

**Provider Detection**:
```typescript
// Session contains provider from OAuth
const { data: session } = useSession();
const provider = session?.provider; // "google" | "microsoft"
```

**Event Creation**:
```typescript
const createEvent = useCreateCalendarEvent();

createEvent.mutate({
  summary: "RDV Client",
  start: { dateTime: "2026-01-06T14:00:00", timeZone: "Europe/Paris" },
  end: { dateTime: "2026-01-06T15:00:00", timeZone: "Europe/Paris" },
  attendees: [{ email: "client@example.com" }],
  conferenceData: true, // Auto-add Meet/Teams link
});
```

---

### use-email.ts

Email sending via Gmail or Outlook.

| Hook | Type | Description |
|------|------|-------------|
| `useSendEmail()` | Mutation | Send email via OAuth provider |
| `generateFollowUpEmail()` | Utility | Generate follow-up template |

**Usage**:
```typescript
const sendEmail = useSendEmail();

sendEmail.mutate({
  to: "client@example.com",
  subject: "Suite a notre echange",
  body: "<p>Bonjour...</p>",
});
```

---

### use-company-search.ts

French company search via API Gouv.

| Hook | Type | Description |
|------|------|-------------|
| `useCompanySearch(query)` | Query | Search companies |
| `useCompanySearchState()` | Hook | Debounced search state |

**API**: `https://recherche-entreprises.api.gouv.fr/search`

**Returns**:
```typescript
interface CompanyResult {
  nom: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  secteurActivite: string;
}
```

---

### use-google-places.ts

Google Places API enrichment (phone + website).

| Hook | Type | Description |
|------|------|-------------|
| `useSearchGooglePlaces()` | Mutation | Search & enrich company |
| `enrichCompanyWithPlaces()` | Utility | Add phone/website to company |

**API Route**: `POST /api/places/search`

---

## Utility Hooks

### use-debounce.ts

Debounce utilities for search inputs.

| Hook | Type | Description |
|------|------|-------------|
| `useDebouncedValue(value, delay)` | Hook | Debounced value |
| `useDebouncedCallback(fn, delay)` | Hook | Debounced function |

**Usage**:
```typescript
const [search, setSearch] = useState("");
const debouncedSearch = useDebouncedValue(search, 300);

// Query only fires when debouncedSearch changes
const { data } = useCompanySearch(debouncedSearch);
```

---

### use-onboarding-tour.ts

Onboarding tour state management.

| Hook | Type | Description |
|------|------|-------------|
| `useOnboardingTour()` | Hook | Tour state with localStorage |

**State**:
```typescript
interface TourState {
  currentStep: number;
  isActive: boolean;
  hasCompleted: boolean;
  hasSkipped: boolean;
}
```

---

### use-auth.ts

Supabase authentication hooks.

| Hook | Type | Description |
|------|------|-------------|
| `useAuth()` | Hook | Current auth state |
| `useSignIn()` | Mutation | Sign in |
| `useSignOut()` | Mutation | Sign out |
| `useResetPassword()` | Mutation | Password reset |

---

### use-auth-sync.ts

Cross-tab session synchronization for multi-browser/tab scenarios.

| Hook | Type | Description |
|------|------|-------------|
| `useAuthSync()` | Hook | Syncs auth state across tabs |

**Features**:
- Listens to Supabase auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
- Listens to localStorage changes for cross-tab sync
- Invalidates React Query cache on session changes
- Auto-redirects to login on sign out from another tab

**Integration**:
```typescript
// Used automatically in AuthProvider
export function AuthProvider({ children }) {
  const auth = useAuth();
  useAuthSync(); // Syncs auth across tabs
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
```

**Events Handled**:
| Event | Action |
|-------|--------|
| `SIGNED_IN` | Clear query cache (new user) |
| `SIGNED_OUT` | Clear cache + redirect to login |
| `TOKEN_REFRESHED` | No action (session valid) |
| `USER_UPDATED` | Invalidate user/profile queries |
| `storage` change | Sync session between tabs |

---

### use-profiles.ts

User profile management.

| Hook | Type | Description |
|------|------|-------------|
| `useProfile(userId)` | Query | Fetch user profile |
| `useCurrentProfile()` | Query | Current user's profile |
| `useUpdateProfile()` | Mutation | Update profile |

---

### use-company-settings.ts

Company settings for PDF generation.

| Hook | Type | Description |
|------|------|-------------|
| `useCompanySettings()` | Query | Fetch company info |
| `useUpdateCompanySettings()` | Mutation | Update company info |

**Used by**: Devis/Facture templates for header information.

---

## Testing

All hooks have corresponding test files in `src/hooks/__tests__/`:

```bash
npm test -- --grep="use-opportunites"
```

**Test Utilities** (`src/test/utils.tsx`):
```typescript
import { renderHook } from "@/test/utils";

const { result } = renderHook(() => useClients());
await waitFor(() => expect(result.current.isSuccess).toBe(true));
```

---

## Performance Optimizations

### Optimistic Updates

Applied to high-frequency mutations:
- `useUpdateOpportunite` (Kanban drag)
- `useUpdateOpportuniteStatut`
- `useUpdateTache`
- `useUpdateLigneDevis`
- `useDeleteLigneDevis`

### Query Stale Times

```typescript
// React Query defaults in providers/query-provider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,     // 30 seconds - prevents cascade refetches between tabs
      gcTime: 5 * 60 * 1000,    // 5 minutes
      refetchOnWindowFocus: "always", // Respects staleTime
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

> **Note**: `staleTime: 30s` was increased from 0 to prevent infinite loading when the same user is logged in on multiple tabs (PR #5 - 7 jan. 2026).

### Parallel Queries

Use `useQueries` for independent data fetching:
```typescript
const results = useQueries({
  queries: [
    { queryKey: queryKeys.clients.all, queryFn: fetchClients },
    { queryKey: queryKeys.projets.all, queryFn: fetchProjets },
  ],
});
```

