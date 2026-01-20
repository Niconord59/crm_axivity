# Story 2.22: Admin Edit Contact

Status: dev-complete

## Story

As an **admin user**,
I want to **edit the information of an existing contact**,
so that **I can keep contact data accurate and up-to-date in the CRM**.

## Acceptance Criteria

1. **AC1** - Given an admin user is viewing a contact, When they click "Edit", Then a form dialog opens with all contact fields pre-filled
2. **AC2** - Given the edit form is open, When the admin modifies any field and saves, Then the contact is updated in Supabase and the UI refreshes
3. **AC3** - Given the admin edits a contact, When validation fails (empty required fields, invalid email), Then error messages display in French
4. **AC4** - Given a contact belongs to a client, When editing, Then the client association is displayed (read-only or editable via dropdown)
5. **AC5** - Given the admin edits prospection fields, When saving, Then prospection-specific fields (statut, date_rappel, source, notes_prospection) are correctly updated

## Tasks / Subtasks

- [x] **Task 1: Create Zod schema for Contact** (AC: #3)
  - [x] 1.1 Create `src/lib/schemas/contact.ts` with validation rules
  - [x] 1.2 Define ContactFormData type with all editable fields
  - [x] 1.3 Add French error messages for validation
  - [x] 1.4 Export contactDefaultValues + contactToFormData helper

- [x] **Task 2: Add useUpdateContact mutation** (AC: #2)
  - [x] 2.1 Add `useUpdateContact` mutation to `src/hooks/use-prospects.ts`
  - [x] 2.2 Map form data to Supabase column names (camelCase → snake_case)
  - [x] 2.3 Invalidate relevant queries (prospects, contacts, clients) on success
  - [x] 2.4 Add `useContactsByClient` hook for Client 360 page

- [x] **Task 3: Create ContactForm component** (AC: #1, #3, #5)
  - [x] 3.1 Create `src/components/forms/ContactForm.tsx` following ClientForm pattern
  - [x] 3.2 Include all contact fields: nom, prenom, email, telephone, poste, linkedin
  - [x] 3.3 Include prospection fields: statutProspection, dateRappel, sourceLead, notesProspection, typeRdv, lienVisio
  - [x] 3.4 Add client selector (Select dropdown with all clients)
  - [x] 3.5 Support edit mode via `contact` prop

- [x] **Task 4: Integrate edit button in UI** (AC: #1, #4)
  - [x] 4.1 Add edit button to LeadCard dropdown menu (prospection page)
  - [x] 4.2 Add "Contacts" tab with edit buttons in Client 360 page (`/clients/[id]`)
  - [x] 4.3 Ensure edit form opens with contact data pre-populated

- [x] **Task 5: Testing and validation** (AC: all)
  - [x] 5.1 TypeScript compilation successful
  - [x] 5.2 Production build successful
  - [x] 5.3 RLS policy `contacts_all_admin` allows admin to update any contact
  - [x] 5.4 Form uses responsive grid layout (mobile-friendly)

## Dev Notes

### Database Schema Reference

**Table: contacts** (from `supabase/migrations/01_schema.sql:87-111`)
```sql
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  poste TEXT,
  est_principal BOOLEAN DEFAULT false,
  -- Prospection fields
  statut_prospection prospect_status,
  date_rappel DATE,
  source_lead prospect_source,
  notes_prospection TEXT,
  type_rdv rdv_type,
  lien_visio TEXT,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies (Admin Access)

**From `supabase/migrations/02_rls.sql:145-148`**:
```sql
-- CRUD admin
CREATE POLICY "contacts_all_admin"
  ON contacts FOR ALL
  USING (auth.user_role() = 'admin');
```

Admin users have full CRUD access to all contacts via this policy.

### Existing Patterns to Follow

**1. Form Component Pattern** - `src/components/forms/ClientForm.tsx`
- Use `FormDialog` wrapper component
- Accept optional `client` prop for edit mode vs create mode
- Use `useCreateX` and `useUpdateX` mutations
- Support controlled open state via `open`/`onOpenChange` props

**2. Zod Schema Pattern** - `src/lib/schemas/client.ts`
- Define const arrays for enum values
- Export schema, FormData type, and defaultValues
- French error messages in validation

**3. Hook Mutation Pattern** - `src/hooks/use-prospects.ts:194-254`
- Use `useMutation` from @tanstack/react-query
- Map camelCase form data to snake_case Supabase columns
- Invalidate/refetch related queries in `onSuccess`

### TypeScript Types

**Contact interface** - `src/types/index.ts:135-155`
```typescript
export interface Contact extends BaseEntity {
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  poste?: string;
  estPrincipal?: boolean;
  notes?: string;
  linkedin?: string;
  // Prospection fields
  statutProspection?: ProspectStatus;
  dateRappel?: string;
  dateRdvPrevu?: string;
  typeRdv?: RdvType;
  lienVisio?: string;
  sourceLead?: ProspectSource;
  notesProspection?: string;
  // Linked records
  client?: string[];
}
```

### Enum Values

**ProspectStatus** - `src/types/constants.ts`
```typescript
'À appeler' | 'Appelé - pas répondu' | 'Rappeler' |
'RDV planifié' | 'RDV effectué' | 'Qualifié' | 'Non qualifié' | 'Perdu'
```

**ProspectSource** - `src/types/constants.ts`
```typescript
'Appel entrant' | 'LinkedIn' | 'Site web' | 'Salon' |
'Recommandation' | 'Achat liste' | 'Autre'
```

**RdvType** - `src/types/constants.ts`
```typescript
'Visio' | 'Présentiel'
```

### Project Structure Notes

| File to Create/Modify | Purpose |
|----------------------|---------|
| `src/lib/schemas/contact.ts` | NEW - Zod validation schema |
| `src/hooks/use-prospects.ts` | MODIFY - Add useUpdateContact mutation |
| `src/components/forms/ContactForm.tsx` | NEW - Form component |
| `src/components/prospection/LeadCard.tsx` | MODIFY - Add edit button |
| `src/app/clients/[id]/page.tsx` | MODIFY - Add edit button to contacts list |

### Architecture Compliance

- **Shadcn/UI Only**: Use FormDialog, Form, Input, Select, Textarea from shadcn
- **React Query**: Use useMutation with proper cache invalidation
- **Zod Validation**: Client-side validation before API call
- **Mobile-First**: Test 375px, 768px, 1024px breakpoints
- **French UI**: All labels and error messages in French

### Testing Requirements

- Test admin user can edit any contact
- Test commercial user can only edit their own contacts (owner_id match)
- Test validation errors appear correctly
- Test form pre-population in edit mode
- Test successful update reflects in UI immediately

### References

- [Source: supabase/migrations/01_schema.sql#contacts] - Table schema
- [Source: supabase/migrations/02_rls.sql#contacts] - RLS policies
- [Source: src/components/forms/ClientForm.tsx] - Form pattern reference
- [Source: src/lib/schemas/client.ts] - Zod schema pattern
- [Source: src/hooks/use-prospects.ts] - Hook mutation pattern
- [Source: src/types/index.ts#Contact] - TypeScript interface

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-07 | BMAD Workflow | Initial story creation |

### File List

Files to be created:
- `src/lib/schemas/contact.ts`
- `src/components/forms/ContactForm.tsx`

Files to be modified:
- `src/hooks/use-prospects.ts` (add useUpdateContact)
- `src/components/prospection/LeadCard.tsx` (add edit button)
- `src/app/clients/[id]/page.tsx` (add edit button to contacts)
