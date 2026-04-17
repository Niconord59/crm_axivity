# Interface Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-27

## Active Technologies

- TypeScript 5.x avec React 19 + Next.js 16 (App Router + Turbopack), Shadcn/UI, Tailwind CSS 3.x, Recharts, @hello-pangea/dnd v18 (drag-and-drop)

## Project Structure

```text
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Shadcn/UI components (29 installed)
│   ├── layout/             # Sidebar, Header, AppLayout
│   ├── shared/             # KPICard, StatusBadge, LifecycleStageBadge, etc.
│   ├── forms/              # Formulaires CRUD
│   ├── charts/             # Graphiques Recharts
│   ├── prospection/        # Module prospection (LeadCard, CallResultDialog, etc.)
│   ├── opportunites/       # Pipeline commercial (OpportunityCard, OpportunityMiniSheet)
│   │   ├── widgets/        # AmountSelector, ProbabilitySlider, ManualNoteForm
│   │   └── tabs/           # OpportunityInfoTab, OpportunityHistoryTab, OpportunityContactsTab
│   ├── devis/              # Génération de devis (QuoteEditorSheet, ServiceSelector)
│   └── onboarding/         # Tour guidé (OnboardingTour, TourTrigger)
├── hooks/                  # React Query hooks (19 hooks Supabase)
│   ├── use-auth-sync.ts    # Synchronisation cross-tab des sessions
│   ├── use-lifecycle-stage.ts    # Gestion lifecycle stage contacts
│   ├── use-opportunite-contacts.ts # Relation N:N opportunites-contacts
│   └── __tests__/          # Tests des hooks
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── auth.ts             # NextAuth.js config (Google + Microsoft)
│   ├── utils.ts            # Helpers (cn, formatters)
│   ├── queryKeys.ts        # React Query key factory (centralisé)
│   ├── errors.ts           # Types d'erreurs (AppError hierarchy)
│   ├── api-error-handler.ts # Handler erreurs API centralisé
│   ├── schemas/            # Zod validation schemas
│   ├── mappers/            # Data mappers Supabase → TypeScript
│   ├── pdf/                # Browser pool pour génération PDF
│   ├── services/           # Calendar & Email services (multi-provider)
│   ├── templates/          # PDF templates (devis-template.ts)
│   ├── __tests__/          # Tests des utilitaires
│   └── tour-steps.ts       # Configuration des étapes du tour
├── test/                   # Configuration et utilitaires de test
│   ├── setup.ts            # Setup global Vitest
│   ├── utils.tsx           # Render wrapper React Query
│   └── mocks/              # Mocks (Supabase, etc.)
├── providers/              # React Query + Onboarding providers
└── types/                  # TypeScript definitions
    └── constants.ts        # Enums centralisés (statuts, etc.)
```

## Commands

```bash
npm run dev           # Development server
npm run build         # Production build
npm run lint          # ESLint
npm start             # Production server
npm test              # Run tests with Vitest
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # Vitest UI
```

## Code Style

- TypeScript strict mode
- French labels and UI text
- Shadcn/UI components exclusively
- Mobile-first responsive (375px, 768px, 1024px)

### `setState` dans `useEffect` — interdit en prospection (PRO-TRX-1)

Le pattern "sync prop → state via `useEffect(() => setX(prop), [prop])`" a été
introduit **4 fois** dans le module prospection (H5/H7/H8 du Sprint 1 + hotfix
`8e1405f7`). Un gate CI dédié (`npm run lint:prospection-gate`)
bloque toute nouvelle occurrence dans :

- `src/components/prospection/**`
- `src/app/(main)/prospection/**`
- `src/hooks/use-prospects.ts`, `src/hooks/use-calendar.ts`

**À la place**, utiliser un des deux patterns ci-dessous :

```tsx
// Pattern 1 — key prop : force un remount avec l'état initial correct.
<MyDialog key={item.id} item={item} />

// Pattern 2 — useMemo + lazy useState, pour dériver l'état initial.
const derived = useMemo(() => compute(prop), [prop]);
const [value, setValue] = useState(() => derived);
```

Le gate s'exécute via `eslint.prospection-gate.config.mjs` (config isolée
pour ne pas être bloquée par les 85 erreurs lint pré-existantes des autres
modules).

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

### 003-prospection (Module Prospection - COMPLETE)
- **Status**: 100% - 66/66 tasks
- **Specs**: `specs/003-prospection/`
- **Content**:
  - Page `/prospection` dédiée à la gestion des leads
  - Import CSV avec mapping manuel des colonnes (papaparse)
  - Suivi des appels (statuts, rappels, notes)
  - Conversion Lead → Opportunité
  - KPIs de prospection (à appeler, rappels, taux qualification, retards)
  - **Vue Agenda** : Toggle Leads/Agenda sur la page `/prospection` pour voir les RDV planifiés (WeekCalendar si OAuth connecté, liste Supabase sinon)
  - **Intégration Calendar** : Planifier des RDV (Google Calendar ou Microsoft 365)
  - **Intégration Email** : Envoyer des emails de suivi (Gmail ou Outlook)
  - **Création directe** : Mode pour leads historiques ou premiers contacts non téléphoniques
    - Types de premier contact : Appel, Email, LinkedIn, Physique, Autre
    - Statuts initiaux : À appeler, Rappeler, RDV planifié, RDV effectué, Qualifié
    - Création d'interaction automatique selon le type de contact
- **Nouveaux composants**:
  - `components/prospection/` : ProspectionKPIs, LeadCard, ProspectionFilters, CallResultDialog, ProspectForm, LeadImportDialog, EmailComposer, CompanySearch, ProspectionAgendaView
  - `components/prospection/agenda/` : AgendaTab, WeekCalendar, EventCard, CreateEventDialog, CalendarAuthButton
- **Nouveaux hooks**:
  - `use-prospects.ts` : useProspects, useProspectsWithClients, useUpdateProspectStatus, useCreateProspect, useProspectionKPIs, useUpcomingRdvProspects
  - `use-import-leads.ts` : useImportLeads (CSV parsing, mapping, batch import)
  - `use-convert-opportunity.ts` : useConvertToOpportunity
  - `use-calendar.ts` : useCalendarEvents, useCreateCalendarEvent, useCalendarStatus, useCalendarAuth
  - `use-email.ts` : useSendEmail, generateFollowUpEmail
  - `use-company-search.ts` : useCompanySearch, useCompanySearchState (API recherche-entreprises.api.gouv.fr)
  - `use-debounce.ts` : useDebouncedValue, useDebouncedCallback
  - `use-google-places.ts` : useSearchGooglePlaces, enrichCompanyWithPlaces (Google Places API)
- **Services multi-provider**:
  - `lib/services/calendar-service.ts` : Abstraction Calendar (Google + Microsoft Graph)
  - `lib/services/email-service.ts` : Abstraction Email (Gmail + Microsoft Graph)
- **Auth OAuth (Calendar + Email)**:
  - `lib/auth.ts` : Configuration NextAuth.js v5 avec Google + Microsoft providers
  - `app/api/auth/[...nextauth]/route.ts` : Handler NextAuth
  - `app/api/calendar/events/route.ts` : API GET/POST events (auto-détection provider)
  - `app/api/email/send/route.ts` : API POST pour envoyer des emails (auto-détection provider)
  - `providers/session-provider.tsx` : SessionProvider wrapper
- **Champs Supabase** (contacts) :
  - `statut_prospection` (ENUM) : À appeler, Appelé - pas répondu, Rappeler, RDV planifié, Qualifié, Non qualifié, Perdu
  - `date_rappel` (DATE)
  - `source_lead` (TEXT)
  - `notes_prospection` (TEXT)
  - `type_rdv` (ENUM) : Visio, Présentiel
  - `lien_visio` (TEXT)
- **Champs Supabase** (clients) :
  - `siret` (TEXT) : Numéro SIRET entreprise
  - `adresse` (TEXT) : Adresse postale
  - `code_postal` (TEXT)
  - `ville` (TEXT)
  - `pays` (TEXT) : Défaut "France"

### 004-onboarding-tour (Tour Guidé - COMPLETE)
- **Status**: 100% - Complete
- **Specs**: `specs/004-onboarding-tour/`
- **Content**:
  - Tour guidé automatique pour les nouveaux utilisateurs
  - 11 étapes couvrant toutes les fonctionnalités CRM
  - Persistance localStorage (tour complété/skippé)
  - Navigation clavier (→ Suivant, ← Précédent, Esc Fermer, ? Relancer)
  - Effet spotlight sur les éléments de navigation
  - Bouton d'aide dans le header avec animation pulse
- **Nouveaux composants**:
  - `components/onboarding/OnboardingTour.tsx` : Composant principal du tour (Card, Progress)
  - `components/onboarding/TourTrigger.tsx` : Bouton de déclenchement avec tooltip
- **Nouveaux fichiers**:
  - `hooks/use-onboarding-tour.ts` : Hook de gestion d'état avec localStorage
  - `lib/tour-steps.ts` : Configuration des 11 étapes du tour
  - `providers/onboarding-provider.tsx` : Context provider pour le tour

### 005-supabase-migration (Migration Backend - COMPLETE)
- **Status**: 100% - Complète
- **Specs**: `specs/005-supabase-migration/`
- **Content**:
  - Backend Supabase self-hosted
  - Déploiement via Coolify (template intégré)
  - 16 hooks React Query
  - 19 fichiers de migration SQL
  - Row Level Security (5 rôles utilisateur)
  - Auth UI complète (login, register, forgot-password, reset-password)
  - 4 workflows N8N
- **Auth UI**:
  - Pages : `/login`, `/register`, `/forgot-password`, `/reset-password`
  - Route groups : `(auth)` standalone, `(main)` avec sidebar
  - Proxy Next.js 16 : `src/proxy.ts` (remplace middleware.ts)
  - Helper : `src/lib/supabase/proxy.ts`
  - SMTP : Resend configuré (sandbox mode pour dev)
- **Hooks Supabase** :
  - `use-clients.ts`, `use-projets.ts`, `use-taches.ts`
  - `use-opportunites.ts`, `use-factures.ts`, `use-prospects.ts`
  - `use-equipe.ts`, `use-interactions.ts`
  - `use-convert-opportunity.ts`, `use-import-leads.ts`
  - `use-services.ts`, `use-lignes-devis.ts`, `use-devis.ts`

### 006-devis (Module Devis - COMPLETE)
- **Status**: 100% - 45/45 tâches
- **Specs**: `specs/006-devis/`
- **Content**:
  - Éditeur de devis accessible depuis le pipeline commercial
  - Sélection de services depuis le catalogue
  - Lignes de devis avec calculs automatiques (HT, TVA, TTC)
  - Génération PDF avec Puppeteer (template professionnel)
  - Prévisualisation avant génération finale
  - Historique des devis avec numérotation séquentielle (DEV-YYYY-NNN)
  - Statuts de suivi : brouillon, envoyé, accepté, refusé, expiré
  - Envoi par email via Resend avec PDF en pièce jointe
  - **Conversion Devis → Facture** : Génère une facture PDF depuis un devis accepté
- **Composants**:
  - `components/devis/QuoteEditorSheet.tsx` : Sheet principal avec onglets
  - `components/devis/QuoteLinesTable.tsx` : Table des lignes CRUD
  - `components/devis/ServiceSelector.tsx` : Sélecteur de service
- **Hooks**:
  - `use-services.ts` : Catalogue des services
  - `use-lignes-devis.ts` : CRUD lignes de devis
  - `use-devis.ts` : Historique et envoi email
- **APIs**:
  - `/api/devis/generate` : Génération PDF finale
  - `/api/devis/preview` : Prévisualisation temporaire
  - `/api/devis/send` : Envoi email via Resend
  - `/api/factures/generate` : Conversion devis → facture PDF
- **Templates PDF**:
  - `lib/templates/devis-template.ts` : Template HTML devis
  - `lib/templates/facture-template.ts` : Template HTML facture
- **Migration SQL**:
  - `19_factures_numerotation.sql` : Compteur séquentiel FAC-YYYY-NNN

### 007-refactorisation (Refactorisation & Scalabilité - COMPLETE)
- **Status**: 100% - 57/57 tâches
- **Specs**: `specs/007-refactorisation/`
- **Content**:
  - **Phase 1 - Tests** : 125 tests avec Vitest + Testing Library
  - **Phase 2 - Centralisation** : Enums, Query Keys factory, Mappers centralisés
  - **Phase 3 - Refactoring** : OpportunityMiniSheet décomposé (660 → 268 lignes, -60%)
  - **Phase 4 - Erreurs** : Types d'erreurs standardisés, handler API (8 routes)
  - **Phase 5 - Optimisations** : React.memo, optimistic updates, browser pool Puppeteer
- **Nouveaux fichiers**:
  - `vitest.config.ts` : Configuration Vitest
  - `src/test/setup.ts` : Setup global Vitest (jsdom, mocks)
  - `src/test/utils.tsx` : Render wrapper avec React Query
  - `src/test/mocks/supabase.ts` : Mock Supabase client
  - `src/types/constants.ts` : Enums centralisés (tous les statuts)
  - `src/lib/queryKeys.ts` : Factory query keys pour tous les hooks
  - `src/lib/errors.ts` : Hiérarchie AppError (8 types)
  - `src/lib/api-error-handler.ts` : `handleApiError()` + `validateRequestBody()`
  - `src/lib/schemas/api.ts` : Schemas Zod pour validation API
  - `src/lib/mappers/*.ts` : 6 mappers centralisés
  - `src/lib/pdf/browser-pool.ts` : Pool Puppeteer réutilisable
  - `src/components/opportunites/widgets/` : 4 widgets extraits
  - `src/components/opportunites/tabs/` : 2 onglets extraits
- **Métriques atteintes**:
  - 125 tests passent (Vitest)
  - OpportunityMiniSheet: 268 lignes (-60%)
  - Query keys: 100% centralisées
  - API routes avec handler: 100% (8/8)

### 008-test-coverage (Couverture de Tests Progressive - PLANNED)
- **Status**: 0% - 0/89 tâches
- **Specs**: `specs/008-test-coverage/`
- **Priority**: HIGH (identifié lors du code review du 6 janvier 2026)
- **Content**:
  - **Phase 1** : Hooks critiques (opportunites, factures, devis, prospects) + Mappers
  - **Phase 2** : API routes (devis, factures) + Hooks restants (projets, taches)
  - **Phase 3** : Composants métier (OpportunityCard, LeadCard, QuoteLinesTable)
  - **Phase 4** : Tests d'intégration + CI/CD
- **Objectifs de couverture**:
  - Phase 1 : 20% (fonctions critiques)
  - Phase 2 : 40% (APIs + hooks)
  - Phase 3 : 60% (composants)
  - Phase 4 : 80% (intégration)
- **État actuel** (baseline du 6 jan 2026):
  - Hooks testés : 1/16 (6.25%)
  - API routes testées : 0/8 (0%)
  - Composants testés : 3/100+ (~3%)
  - Tests existants : 125

### 009-lifecycle-model (Modèle Lifecycle HubSpot-inspired - COMPLETE)
- **Status**: 100% - 52/52 tâches
- **Specs**: `specs/009-lifecycle-model/`
- **Content**:
  - **Phase 1-3** ✅ : Database, Types, Hooks (lifecycle_stage, opportunite_contacts N:N)
  - **Phase 4** ✅ : Mappers (opportunite-contact.mapper.ts, mapToOpportuniteWithContacts)
  - **Phase 5** ✅ : Composants UI (LifecycleStageBadge, LifecycleStageSelect, OpportunityContactsTab)
  - **Phase 6** ✅ : Conversion prospect→opportunité avec lien N:N et lifecycle_stage update
  - **Phase 7** ✅ : Dashboard funnel lifecycle avec taux de conversion et cycle moyen
  - **Phase 8** ✅ : Documentation mise à jour
- **Nouveaux composants**:
  - `components/shared/LifecycleStageBadge.tsx` : Badge coloré avec icône par stage
  - `components/shared/LifecycleStageSelect.tsx` : Dropdown avec confirmation downgrade
  - `components/shared/lifecycle-stage-icons.ts` : Mapping icônes centralisé
  - `components/opportunites/tabs/OpportunityContactsTab.tsx` : Onglet contacts N:N
  - `components/charts/LifecycleFunnelChart.tsx` : Graphique funnel horizontal (cliquable)
- **Nouveaux hooks**:
  - `use-lifecycle-stage.ts` : `useUpdateLifecycleStage`, `useBatchUpdateLifecycleStage`, `isLifecycleDowngrade`, `getNextLifecycleStage`
  - `use-opportunite-contacts.ts` : `useOpportuniteContacts`, `useAddContactToOpportunite`, `useRemoveContactFromOpportunite`, `useSetPrimaryContact`
  - `use-lifecycle-funnel.ts` : `useLifecycleFunnel` (stats par stage, taux conversion, cycle moyen Lead→Customer)
- **Types ajoutés** (`types/constants.ts`):
  - `LIFECYCLE_STAGES` : Lead, MQL, SQL, Opportunity, Customer, Evangelist, Churned
  - `LIFECYCLE_STAGE_LABELS`, `LIFECYCLE_STAGE_COLORS`
  - `CONTACT_ROLES` : Decideur, Influenceur, Utilisateur, Participant
- **Migration SQL** : `24_lifecycle_stages.sql` (table pivot `opportunite_contacts`, enum, triggers)
- **Note deprecation** : Le champ `contact_id` dans `opportunites` est maintenu pour rétrocompatibilité mais `opportunite_contacts.is_primary` fait foi. Planifier suppression en v2.

## Documentation

| Fichier | Description |
|---------|-------------|
| `passation_projet_agence_ia.md` | Guide de passation du projet CRM Axivity |
| `Ameliorations_Phase2_Roadmap.md` | Roadmap des améliorations Phase 2 |
| `Guide de Construction _ Base Airtable pour Agence IA.md` | Guide de construction de la base Airtable originale |
| `Migration_Supabase_Plan.md` | Plan de migration Airtable → Supabase |
| `Refactorisation_Scalabilite_Plan.md` | Plan de refactorisation et scalabilité |

## Specs (Spécifications par feature)

| Dossier | Feature | Status |
|---------|---------|--------|
| `specs/001-crm-axivity-interface/` | Interface CRM de base | ✅ Complet |
| `specs/002-crm-ameliorations/` | Améliorations Phase 2 | 📋 Planifié |
| `specs/003-prospection/` | Module Prospection | ✅ Complet |
| `specs/004-onboarding-tour/` | Tour guidé onboarding | ✅ Complet |
| `specs/005-supabase-migration/` | Migration Supabase | ✅ Complet |
| `specs/006-devis/` | Module Devis & Factures | ✅ Complet |
| `specs/007-refactorisation/` | Refactorisation & Scalabilité | ✅ Complet |
| `specs/008-test-coverage/` | Couverture de Tests Progressive | 📋 Planifié |
| `specs/009-lifecycle-model/` | Modèle Lifecycle HubSpot-inspired | ✅ Complet |

## Supabase (Backend)

- **URL**: `https://supabase.axivity.cloud`
- **Client**: `lib/supabase.ts`
- **Migrations**: `supabase/migrations/` (18 fichiers SQL)
- **Déploiement**: Coolify (template Supabase intégré)
- **Variables d'environnement**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Migrations SQL

| Fichier | Description | Statut |
|---------|-------------|--------|
| `00_extensions.sql` | Extensions PostgreSQL | ✅ |
| `01_schema.sql` | 21 tables + ENUMs | ✅ |
| `02_rls.sql` | Row Level Security | ✅ |
| `03_functions.sql` | Triggers et fonctions | ✅ |
| `04_equipe_table.sql` | Table équipe + colonnes | ✅ |
| `05_dev_quick_fix.sql` | Désactiver RLS (dev) | ✅ |
| `06_test_data.sql` | Données de test | ✅ |
| `07_fix_profiles_rls.sql` | Fix RLS profiles | ✅ |
| `08_update_test_dates.sql` | Mise à jour dates test | ✅ |
| `09_factures_relance_columns.sql` | Colonnes relance factures | ✅ |
| `10_contacts_linkedin_column.sql` | Colonne LinkedIn contacts | ✅ |
| `11_update_user_roles.sql` | Mise à jour rôles | ✅ |
| `12_equipe_profile_unique.sql` | Contrainte unique équipe | ✅ |
| `13_projets_feedback_column.sql` | Colonne feedback_envoye | ✅ |
| `14_invoice_status_en_retard.sql` | Statut "En retard" factures | ✅ |
| `18_devis_table.sql` | Table devis + numérotation séquentielle | ✅ |

### Rôles utilisateur Supabase

| Rôle | Description |
|------|-------------|
| `admin` | Accès total |
| `developpeur_nocode` | Développeur no-code — lecture + modification tâches assignées |
| `developpeur_automatisme` | Développeur automatisme — lecture + modification tâches assignées |
| `commercial` | Pipeline + prospects |
| `client` | Portail client (lecture seule) |

## N8N Workflows

4 workflows disponibles dans `Workflows_n8n/`:

| Workflow | Fichier | Déclencheur |
|----------|---------|-------------|
| **Conversion Opportunité** | `supabase_conversion_opportunite_projet.json` | Toutes les minutes |
| **Feedback Post-Projet** | `supabase_feedback_post_projet.json` | Quotidien 9h |
| **Alertes Tâches** | `supabase_alertes_taches_retard.json` | Quotidien 9h (Lun-Ven) |
| **Relances Factures** | `supabase_relances_factures.json` | Quotidien 10h (Lun-Ven) |

### Configuration N8N

1. Credential Supabase API :
   - Host: `https://supabase.axivity.cloud`
   - Service Role Key: depuis Coolify → Variables

2. Syntaxe des filtres PostgREST (IMPORTANT) :
   ```
   "filterString": "={{ 'date_echeance=lt.' + $now.toISODate() + '&statut=neq.Terminé' }}"
   ```
   Note: Utiliser `={{ }}` pour les expressions dynamiques, pas `{{ }}`

## OAuth Providers (Calendar + Email)

L'application supporte deux providers OAuth pour le calendrier et l'email :

| Provider | Calendar | Email | Visio |
|----------|----------|-------|-------|
| **Google** | Google Calendar API | Gmail API | Google Meet |
| **Microsoft** | Microsoft Graph API | Microsoft Graph API | Teams |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CalendarAuthButton                           │
│              [Google]     [Microsoft 365]                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NextAuth.js v5                                │
│   Google Provider          │       MicrosoftEntraID Provider    │
│   - calendar scope         │       - Calendars.ReadWrite        │
│   - gmail.send scope       │       - Mail.Send                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Session (client-visible)                      │
│   { hasCalendarAccess, provider: "google" | "microsoft" }       │
│                                                                 │
│   SECURITY (PRO-C1) : le `accessToken` reste dans le JWT cookie │
│   chiffré. Les routes serveur le lisent via                     │
│   `getServerAccessToken(req)` depuis `lib/auth.ts` — jamais via │
│   `useSession()` côté client.                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Routes (auto-détection provider)               │
│   /api/calendar/events     │       /api/email/send              │
│   ↳ getServerAccessToken(req)  ← lit le JWT, refresh si expiré  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Services Layer                                │
│   calendar-service.ts      │       email-service.ts             │
│   - Google Calendar API    │       - Gmail API                  │
│   - Microsoft Graph API    │       - Microsoft Graph API        │
└─────────────────────────────────────────────────────────────────┘
```

### Variables d'environnement OAuth

```env
# NextAuth Secret
AUTH_SECRET=generate-with-openssl-rand-base64-32

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret

# Microsoft Azure AD OAuth
AUTH_MICROSOFT_ID=your-azure-client-id
AUTH_MICROSOFT_SECRET=your-azure-client-secret

# Google Places API (optional - for company phone/website enrichment)
GOOGLE_PLACES_API_KEY=your-google-places-api-key
```

### Configuration Google Places API (optionnel)

1. **Google Cloud Console** : https://console.cloud.google.com
2. **APIs & Services** → Enable **Places API**
3. **APIs & Services** → Credentials → Create API Key
4. **Restrict key** : HTTP referrers or IP addresses
5. Ajouter la clé dans `.env.local` : `GOOGLE_PLACES_API_KEY=...`

Note: Sans cette clé, le formulaire fonctionne mais les champs téléphone/site web ne sont pas auto-remplis.

### Configuration Azure AD

1. **Portal Azure** : https://portal.azure.com
2. **App registrations** → New registration
3. **Redirect URI** (Web) :
   - Dev : `http://localhost:3000/api/auth/callback/microsoft-entra-id`
   - Prod : `https://crm.axivity.cloud/api/auth/callback/microsoft-entra-id`
4. **API Permissions** (Delegated) :
   - `User.Read`
   - `Calendars.ReadWrite`
   - `Mail.Send`
   - `offline_access`

### Configuration Google Cloud

1. **Google Cloud Console** : https://console.cloud.google.com
2. **APIs & Services** → Credentials → OAuth 2.0 Client ID
3. **Redirect URI** :
   - Dev : `http://localhost:3000/api/auth/callback/google`
   - Prod : `https://crm.axivity.cloud/api/auth/callback/google`
4. **Scopes** :
   - `openid email profile`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/gmail.send`

## Gates (Non-négociables)

1. **Mobile-First**: Responsive sur 3 breakpoints
2. **Shadcn/UI Only**: Aucun autre framework UI
3. **Supabase SSOT**: Pas de base locale
4. **Automation-Ready**: Statuts cohérents, liens bidirectionnels
5. **Data Integrity**: Relations bidirectionnelles maintenues
6. **YAGNI**: Simplicité, pas de sur-architecture

## Recent Changes

- 001-crm-axivity-interface: Phase 1 complète (Dashboard, Kanban, Pages, Hooks)
- 002-crm-ameliorations: Planification des améliorations Phase 2 (51 tâches)
- **Migration Next.js 16** : Upgrade vers Next.js 16.0.10 + React 19.2.3 + Turbopack (15 déc. 2025)
- **003-prospection COMPLET** : Module complet de gestion des leads (15 déc. 2025)
- **004-onboarding-tour COMPLET** : Tour guidé pour nouveaux utilisateurs (15 déc. 2025)
- **Google Calendar Integration** : Intégration dans le module prospection (15 déc. 2025)
- **Gmail Integration** : Envoi d'emails de suivi (16 déc. 2025)
- **005-supabase-migration COMPLET** : Backend Supabase self-hosted (19 déc. 2025)
  - Déploiement Supabase self-hosted via Coolify
  - 13 hooks React Query
  - 21 tables, RLS, triggers
  - 5 rôles utilisateur
  - Auth UI complète
  - 4 workflows N8N
- **Pipeline Commercial Redesign** (19 déc. 2025)
- **Nettoyage références legacy** (19 déc. 2025) : Suppression de toutes les références à l'ancien backend
- **Microsoft 365 Integration** (22 déc. 2025) : Ajout de Microsoft comme provider alternatif
  - Support Microsoft Calendar (Outlook) via Microsoft Graph API
  - Support Microsoft Email (Outlook) via Microsoft Graph API
  - Support Teams pour les visioconférences
  - Architecture multi-provider avec auto-détection
  - CalendarAuthButton avec choix du provider (Google / Microsoft 365)
- **Génération de Devis PDF** (22-23 déc. 2025) : Système complet de devis
  - Éditeur de devis accessible depuis le pipeline commercial
  - Sélection de services depuis le catalogue (lignes_devis + catalogue_services)
  - Génération PDF avec Puppeteer (rendu HTML pixel-perfect)
  - Template professionnel avec en-tête, lignes, totaux (HT, TVA 20%, TTC)
  - **Historique des devis** : Table `devis` avec numérotation séquentielle (DEV-2025-001)
  - **Statuts** : brouillon, envoyé, accepté, refusé, expiré
  - **Envoi par email** : Via Resend API avec pièce jointe PDF
  - **Prévisualisation** : Génération PDF temporaire avant création finale
  - **Duplication lignes** : Copie rapide des lignes de devis
  - Nouveaux hooks: `use-services.ts`, `use-lignes-devis.ts`, `use-devis.ts`
  - Nouveaux composants: `QuoteEditorSheet`, `QuoteLinesTable`, `ServiceSelector`
  - APIs: `/api/devis/generate`, `/api/devis/preview`, `/api/devis/send`
- **Recherche Entreprises API Gouvernement** (23 déc. 2025) : Auto-complétion pour création de leads
  - Intégration API recherche-entreprises.api.gouv.fr
  - Recherche en temps réel (debounced) pendant la saisie
  - Auto-remplissage SIRET, adresse, code postal, ville, secteur d'activité
  - Enrichissement Google Places API : téléphone + site web
  - Nouveaux champs formulaire: SIRET, adresse, code postal, ville, pays
  - Nouveaux hooks: `use-company-search.ts`, `use-debounce.ts`, `use-google-places.ts`
  - Nouveau composant: `CompanySearch.tsx`
  - API: `/api/places/search` (POST) - Google Places enrichment
- **Création directe de leads** (23 déc. 2025) : Support leads historiques et contacts non téléphoniques
  - Mode "Création directe" dans ProspectForm pour contourner le workflow appel
  - Types de premier contact : Appel, Email, LinkedIn, Physique, Autre
  - Statuts initiaux : À appeler, Rappeler, RDV planifié, RDV effectué, Qualifié
  - Création automatique d'interaction selon le type de contact
  - Nouveaux types dans schema: `FIRST_CONTACT_TYPES`, `INITIAL_STATUTS`
- **OpportunityMiniSheet** (23 déc. 2025) : Édition rapide des opportunités
  - Drawer latéral accessible en cliquant sur une carte du Kanban
  - **Onglet Infos** :
    - Montants rapides : boutons présets (5k, 10k, 25k, 50k, 100k, 200k €)
    - Incréments/décréments : +1k, +5k / -1k, -5k
    - Slider probabilité : 0-100% par pas de 5%
    - Calcul valeur pondérée en temps réel
    - Sélecteur de date de clôture (calendrier français)
    - Zone de notes redimensionnable verticalement
    - Transition vers l'éditeur de devis complet
  - **Onglet Historique** :
    - Timeline des interactions liées au contact de l'opportunité
    - Formulaire d'ajout de note manuelle (style ambre)
    - Icônes par type : Appel (orange), Email (bleu), Réunion (violet), Note (ambre)
    - Continuité du suivi entre prospection et phase commerciale
  - Nouveau composant: `OpportunityMiniSheet.tsx`
  - Nouveau composant UI: `slider.tsx` (shadcn/ui)
- **LeadCard cliquable** (23 déc. 2025) : Clic direct sur la carte pour ouvrir le formulaire
- **007-refactorisation COMPLET** (24 déc. 2025) : Refactorisation et optimisations
  - **Phase 1 - Tests** : 125 tests Vitest (utils, hooks, composants)
  - **Phase 2 - Centralisation** : `queryKeys.ts`, `constants.ts`, `lib/mappers/`
  - **Phase 3 - Refactoring** : OpportunityMiniSheet 660 → 268 lignes (-60%)
  - **Phase 4 - Erreurs** : `errors.ts` + `api-error-handler.ts` (8 routes migrées)
  - **Phase 5 - Optimisations** :
    - `React.memo` sur OpportunityCard, LeadCard, EventCard
    - Optimistic updates sur 5 mutations (useUpdateOpportunite, useUpdateTache, etc.)
    - `lib/pdf/browser-pool.ts` : Pool Puppeteer réutilisable pour PDF
- **Configuration Email Production** (5 jan. 2026) : Emails transactionnels en production
  - Domaine Resend vérifié (`axivity.cloud`) avec DNS (SPF, DKIM, DMARC)
  - Templates email personnalisés en français (`public/templates/`)
  - Workaround Coolify : URLs hardcodées avec `{{ .TokenHash }}`
  - Auto-inscription désactivée, uniquement invitation admin
  - Page login : lien "Créer un compte" masqué
- **Fix Router Cache RSC** (6 jan. 2026) : Correction du loader infini
  - Ajout `staleTimes: { dynamic: 0, static: 0 }` dans `next.config.mjs`
  - Désactive le cache RSC qui causait des données stales après navigation
- **Fix Multi-Tab Session Sync** (7 jan. 2026) : Correction du chargement infini multi-onglets
  - Configuration Supabase client avec options multi-tab (persistSession, storageKey, autoRefreshToken, flowType: pkce)
  - React Query `staleTime: 30s` (était 0) pour éviter les refetch en cascade
  - Nouveau hook `use-auth-sync.ts` pour synchronisation cross-tab via localStorage events
  - Écoute des événements Supabase auth (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
- **Code Review Multi-Tab Fix** (7 jan. 2026) : Corrections post-review du fix multi-onglets
  - Unification des clients Supabase : `AUTH_STORAGE_KEY` partagé entre `supabase.ts` et `supabase/client.ts`
  - Options auth ajoutées au client SSR (`@/lib/supabase/client.ts`)
  - Suppression de la double écoute `onAuthStateChange` (redirection dans `use-auth.ts` uniquement)
  - Correction typage `session: unknown` → `Session | null`
  - Ajout debounce 100ms sur le handler storage pour éviter les rafales
  - Fix `refetchOnWindowFocus: "always"` → `true` (respecte maintenant staleTime)
  - 12 tests unitaires ajoutés pour `use-auth-sync.ts` (973 tests total)
- **Fix Auth Cookie Storage** (7 jan. 2026) : Correction du login qui échouait malgré un token valide
  - Suppression des options `auth` de `createBrowserClient` dans `src/lib/supabase/client.ts`
  - `@supabase/ssr` utilise maintenant le stockage cookie par défaut (au lieu de localStorage)
  - Correction de la désynchronisation client (localStorage) / serveur proxy (cookies)
  - Simplification de `use-auth-sync.ts` : suppression de l'écoute des storage events (obsolète avec cookies)
  - Tests mis à jour : 7 tests auth events (suppression des 6 tests storage events obsolètes)
  - 968 tests passent
- **Supabase Realtime** (16 jan. 2026) : Rafraîchissement automatique des données en temps réel
  - Migration `23_enable_realtime.sql` : Active les publications Realtime sur 10 tables
  - Nouveau hook `src/hooks/use-realtime.ts` avec 5 hooks spécialisés par page
  - Intégration dans : Prospection, Pipeline, Projets, Factures, Dashboard
  - Les données se mettent à jour instantanément sans Ctrl+Shift+R
- **Migration xlsx → ExcelJS** (20 jan. 2026) : Correction de la vulnérabilité npm
  - Remplacement de `xlsx` par `exceljs` (0 vulnérabilités npm)
  - `exportToExcel()` devient async dans `src/lib/export.ts`
  - Mise à jour de `ExportButton.tsx` avec `await`
  - Tests mis à jour pour async
- **Health Check Coolify** (20 jan. 2026) : Configuration du monitoring de santé
  - Nouvel endpoint `GET /api/health` retournant `{ status: "ok", timestamp: "..." }`
  - Ajout de `curl` dans le Dockerfile (Alpine n'inclut pas curl par défaut)
  - Configuration Coolify : Command `/usr/bin/curl http://localhost:3000/api/health`, Start Period 30s
  - Statut "Healthy" dans le dashboard Coolify
- **009-lifecycle-model Phase 5** (28 jan. 2026) : Composants UI Lifecycle Stages
  - `LifecycleStageBadge` : Badge coloré avec icône et tooltip par stage (Lead→Churned)
  - `LifecycleStageSelect` : Dropdown avec confirmation AlertDialog si downgrade
  - `OpportunityContactsTab` : Nouvel onglet contacts dans OpportunityMiniSheet
  - Filtre lifecycle_stage dans ProspectionFilters
  - Badge lifecycle dans LeadCard
  - Table pivot `opportunite_contacts` pour relation N:N (Phases 1-3 complétées précédemment)
- **009-lifecycle-model Phase 7 COMPLETE** (28 jan. 2026) : Dashboard Funnel Lifecycle
  - `use-lifecycle-funnel.ts` : Hook React Query pour statistiques funnel (contacts par stage, taux conversion, cycle moyen)
  - `LifecycleFunnelChart.tsx` : Graphique horizontal Recharts avec barres cliquables (navigation vers /prospection?lifecycleStage=XXX)
  - Intégration Dashboard : Widget funnel à côté du graphique CA Mensuel
  - KPI "Cycle moyen Lead → Customer" affiché en jours
  - 15 tests Vitest pour use-lifecycle-funnel.ts

- **Vue Agenda Prospection** (27 fév. 2026) : Toggle Leads/Agenda sur la page `/prospection`
  - Toggle Leads/Agenda dans le PageHeader avec boutons segmentés
  - `ProspectionAgendaView.tsx` : Vue agenda dual-mode (calendrier OAuth ou liste Supabase)
  - `useUpcomingRdvProspects()` : Hook pour RDV futurs (`statut_prospection = "RDV planifié"` + `date_rdv_prevu >= today`)
  - Si calendrier connecté : WeekCalendar + overlay RDV CRM en carte séparée
  - Si non connecté : Liste RDV groupés par date + invitation à connecter le calendrier
  - Clic sur un RDV → ouvre le CallResultDialog du prospect
  - KPIs et PastRdvNotifications restent visibles dans les deux vues

- **Fix validation silencieuse des formulaires** (16 avril 2026) : Correction du bouton "Suivant" non fonctionnel sur `/prospection`
  - **Symptôme** : sur certaines entreprises (ex: SIGMA à Brillon, code NAF 33.20C), le bouton "Suivant" de l'onglet Contact du `ProspectForm` était cliquable mais ne faisait rien, sans log console
  - **Cause** : le libellé NAF officiel auto-rempli dans `secteurActivite` faisait 107 chars, alors que le schéma Zod limitait à 100. Validation silencieuse sur un champ d'un autre onglet, sans feedback visuel
  - **Fix 1 — racine** : `secteurActivite.max(100)` → `.max(255)` dans `prospect.ts` et `client.ts`
  - **Fix 2 — défense structurelle** : ajout d'un callback `onInvalid` sur `form.handleSubmit` dans `FormDialog` (6 formulaires CRUD protégés), `ProspectForm` et `CallResultDialog`
  - Les erreurs de validation affichent désormais un `toast.error` systématique
  - `ProspectForm` bascule automatiquement sur l'onglet contenant le 1er champ en erreur
  - Fin de la classe de bug "bouton qui fait rien sans raison" sur tous les formulaires

## Production Checklist

### Domaine principal
- **Domaine** : `axivity.cloud`
- **Supabase** : `supabase.axivity.cloud`
- **CRM** : `crm.axivity.cloud`

### SMTP / Emails (Resend) ✅ CONFIGURÉ

**Configuration PRODUCTION** (active) :
```env
ENABLE_EMAIL_AUTOCONFIRM=false
DISABLE_SIGNUP=true  # Uniquement invitation admin
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxx  # API Key Resend
SMTP_ADMIN_EMAIL=noreply@axivity.cloud
SMTP_SENDER_NAME=CRM Axivity
GOTRUE_SITE_URL=https://crm.axivity.cloud
```

### Templates Email Personnalisés ✅

Les templates sont dans `public/templates/` :

| Fichier | Type | Redirect |
|---------|------|----------|
| `invite.html` | Invitation admin | `/auth/callback` |
| `confirmation.html` | Auto-inscription | `/auth/callback` |
| `recovery.html` | Mot de passe oublié | `/reset-password` |

**Variables Coolify pour les templates** :
```env
GOTRUE_MAILER_TEMPLATES_INVITE=https://crm.axivity.cloud/templates/invite.html
GOTRUE_MAILER_TEMPLATES_CONFIRMATION=https://crm.axivity.cloud/templates/confirmation.html
GOTRUE_MAILER_TEMPLATES_RECOVERY=https://crm.axivity.cloud/templates/recovery.html
```

**⚠️ Workaround Coolify** : Le template Supabase de Coolify génère une variable `SERVICE_URL_SUPABASEKONG` interne qui ne peut pas être surchargée. Les templates utilisent des URLs hardcodées avec `{{ .TokenHash }}` au lieu de `{{ .ConfirmationURL }}` pour contourner ce problème.

### Authentification

- **Auto-inscription** : Désactivée (`DISABLE_SIGNUP=true`)
- **Invitation admin** : Via `/api/admin/users` (admin uniquement)
- **Page login** : Lien "Créer un compte" masqué

### URLs de redirection

```env
ADDITIONAL_REDIRECT_URLS=https://crm.axivity.cloud/**,https://crm.axivity.cloud/auth/callback
GOTRUE_SITE_URL=https://crm.axivity.cloud
```

### Variables d'environnement Frontend (.env.production)

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.axivity.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Clé anon de production
NEXT_PUBLIC_APP_URL=https://crm.axivity.cloud
```

<!-- MANUAL ADDITIONS START -->

## Troubleshooting

### Loader infini / Données ne se chargent pas (Ctrl+Shift+R requis)

**Symptômes** :
- Loader qui tourne indéfiniment sur les pages
- Les données ne s'affichent qu'après Ctrl+Shift+R (hard reload)
- Erreur dans Network tab : `?_rsc=xxxxx` avec "No data found for resource"

**Cause** : Le Router Cache RSC de Next.js est désynchronisé.

**Solution** :
1. Vérifier que `next.config.mjs` contient :
```javascript
experimental: {
  staleTimes: {
    dynamic: 0,
    static: 0,
  },
},
```
2. Supprimer le cache : `rm -rf .next`
3. Redémarrer : `npm run dev`

**Documentation** : https://nextjs.org/docs/app/api-reference/next-config-js/staleTimes

### Chargement infini sur plusieurs onglets/navigateurs

**Symptômes** :
- Loader qui tourne en boucle quand le même utilisateur est connecté sur plusieurs onglets
- Les onglets se "battent" pour rafraîchir les données
- Déconnexion aléatoire sur certains onglets

**Causes** :
1. React Query `staleTime: 0` causait des refetch en cascade entre onglets
2. Race condition sur le refresh du token Supabase entre onglets

**Solution** (7 jan. 2026) :

1. **Client Supabase avec stockage cookie par défaut** :
```typescript
// src/lib/supabase/client.ts
// IMPORTANT: Ne PAS ajouter d'options auth - laisser @supabase/ssr
// utiliser le stockage cookie par défaut pour la compatibilité SSR
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

2. **React Query** avec `staleTime: 30s` et `refetchOnWindowFocus: true` :
```typescript
// src/providers/query-provider.tsx
staleTime: 30 * 1000,        // Données fraîches 30s
refetchOnWindowFocus: true,  // Respecte staleTime (pas "always")
```

3. **Hook `use-auth-sync.ts`** :
   - Écoute `onAuthStateChange` pour invalider le cache React Query
   - La synchronisation cross-tab est gérée automatiquement par les cookies HTTP
   - **Note** : La redirection `/login` est gérée par `use-auth.ts` uniquement

**Si le problème persiste** :
1. Supprimer les cookies Supabase du domaine
2. Vider l'ancien localStorage (migration) : `localStorage.removeItem('crm-axivity-auth')`
3. Se reconnecter

**Tests** : 7 tests unitaires dans `src/hooks/__tests__/use-auth-sync.test.ts`

### Login échoue malgré un token valide retourné

**Symptômes** :
- L'API Supabase retourne un token d'authentification valide
- Mais la page ne redirige pas vers le dashboard
- Les requêtes API échouent avec 401 Unauthorized

**Cause** : Le client browser (`createBrowserClient`) était configuré avec `storageKey` qui forçait le stockage en localStorage, mais le proxy serveur (`createServerClient`) lit la session depuis les cookies. Désynchronisation client/serveur.

**Solution** (commit `62b49cd1` - 7 jan. 2026) :
- Supprimer les options `auth` de `createBrowserClient` dans `src/lib/supabase/client.ts`
- Laisser `@supabase/ssr` utiliser le stockage cookie par défaut

```typescript
// AVANT (cassé)
client = createBrowserClient(url, key, {
  auth: {
    storageKey: 'crm-axivity-auth',  // Force localStorage
    persistSession: true,
  }
});

// APRÈS (fonctionnel)
client = createBrowserClient(url, key);  // Utilise cookies par défaut
```

**Si le problème persiste** :
1. Vider l'ancien localStorage : `localStorage.removeItem('crm-axivity-auth')`
2. Supprimer les cookies du domaine
3. Redémarrer le navigateur

### Données non rafraîchies après création/modification (Ctrl+Shift+R requis)

**Symptômes** :
- Un nouveau contact créé n'apparaît pas dans la liste
- Une modification n'est pas visible immédiatement
- Les données ne se mettent à jour qu'après Ctrl+Shift+R

**Cause** : React Query cache les données et ne les rafraîchit pas automatiquement quand la base de données change.

**Solution** (16 jan. 2026) : Supabase Realtime

1. **Migration SQL** : `supabase/migrations/23_enable_realtime.sql`
   - Active les publications Realtime pour toutes les tables principales

2. **Hook Realtime** : `src/hooks/use-realtime.ts`
   - `useProspectionRealtime()` : contacts, clients
   - `usePipelineRealtime()` : opportunités, clients, contacts, interactions
   - `useProjetsRealtime()` : projets, tâches
   - `useFacturesRealtime()` : factures, devis, lignes_devis
   - `useDashboardRealtime()` : toutes les tables

3. **Intégration** : Ajouter le hook dans chaque page :
```typescript
// Exemple dans src/app/(main)/prospection/page.tsx
import { useProspectionRealtime } from "@/hooks/use-realtime";

function ProspectionContent() {
  // ... autres hooks
  useProspectionRealtime(); // Écoute les changements en temps réel
}
```

**Vérification** :
1. Exécuter la migration `23_enable_realtime.sql` sur Supabase
2. Vérifier dans la console : `[Realtime] Prospection channel connected`
3. Créer un contact → doit apparaître instantanément

**Si Realtime ne fonctionne pas** :
1. Vérifier que les tables sont dans la publication :
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
2. Vérifier les logs Supabase Kong pour les erreurs WebSocket
3. Vérifier que le client Supabase est correctement initialisé

<!-- MANUAL ADDITIONS END -->
