# Interface Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-22

## Active Technologies

- TypeScript 5.x avec React 19 + Next.js 16 (App Router + Turbopack), Shadcn/UI, Tailwind CSS 3.x, Recharts, @hello-pangea/dnd v18 (drag-and-drop)

## Project Structure

```text
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Shadcn/UI components (28 installed)
│   ├── layout/             # Sidebar, Header, AppLayout
│   ├── shared/             # KPICard, StatusBadge, SearchCommand, etc.
│   ├── forms/              # Formulaires CRUD
│   ├── charts/             # Graphiques Recharts
│   ├── prospection/        # Module prospection (LeadCard, CallResultDialog, etc.)
│   ├── opportunites/       # Pipeline commercial (OpportunityCard)
│   └── onboarding/         # Tour guidé (OnboardingTour, TourTrigger)
├── hooks/                  # React Query hooks (13 hooks Supabase)
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── auth.ts             # NextAuth.js config (Google + Microsoft)
│   ├── utils.ts            # Helpers (cn, formatters)
│   ├── schemas/            # Zod validation schemas
│   ├── services/           # Calendar & Email services (multi-provider)
│   └── tour-steps.ts       # Configuration des étapes du tour
├── providers/              # React Query + Onboarding providers
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

### 003-prospection (Module Prospection - COMPLETE)
- **Status**: 100% - 66/66 tasks
- **Specs**: `specs/003-prospection/`
- **Content**:
  - Page `/prospection` dédiée à la gestion des leads
  - Import CSV avec mapping manuel des colonnes (papaparse)
  - Suivi des appels (statuts, rappels, notes)
  - Conversion Lead → Opportunité
  - KPIs de prospection (à appeler, rappels, taux qualification, retards)
  - **Intégration Calendar** : Planifier des RDV (Google Calendar ou Microsoft 365)
  - **Intégration Email** : Envoyer des emails de suivi (Gmail ou Outlook)
- **Nouveaux composants**:
  - `components/prospection/` : ProspectionKPIs, LeadCard, ProspectionFilters, CallResultDialog, ProspectForm, LeadImportDialog, EmailComposer
  - `components/prospection/agenda/` : AgendaTab, WeekCalendar, EventCard, CreateEventDialog, CalendarAuthButton
- **Nouveaux hooks**:
  - `use-prospects.ts` : useProspects, useProspectsWithClients, useUpdateProspectStatus, useCreateProspect, useProspectionKPIs
  - `use-import-leads.ts` : useImportLeads (CSV parsing, mapping, batch import)
  - `use-convert-opportunity.ts` : useConvertToOpportunity
  - `use-calendar.ts` : useCalendarEvents, useCreateCalendarEvent, useCalendarStatus, useCalendarAuth
  - `use-email.ts` : useSendEmail, generateFollowUpEmail
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
  - 13 hooks React Query
  - 14 fichiers de migration SQL
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

## Documentation

- **Passation projet**: `Documentation/passation_projet_agence_ia.md`
- **Roadmap Phase 2**: `Documentation/Ameliorations_Phase2_Roadmap.md`

## Supabase (Backend)

- **URL**: `https://supabase.axivity.cloud`
- **Client**: `lib/supabase.ts`
- **Migrations**: `supabase/migrations/` (14 fichiers SQL)
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

### Rôles utilisateur Supabase

| Rôle | Description |
|------|-------------|
| `admin` | Accès total |
| `manager` | Gestion équipe + clients |
| `commercial` | Pipeline + prospects |
| `membre` | Ses tâches + projets assignés |
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
│                   Session (JWT)                                 │
│   { accessToken, provider: "google" | "microsoft" }             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Routes (auto-détection provider)               │
│   /api/calendar/events     │       /api/email/send              │
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
```

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

## Production Checklist

### Domaine principal
- **Domaine** : `axivity.cloud`
- **Supabase** : `supabase.axivity.cloud`

### SMTP / Emails (Resend)

**Configuration actuelle (DEV)** :
```env
ENABLE_EMAIL_AUTOCONFIRM=true  # Pas de confirmation email
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxx  # API Key Resend
SMTP_ADMIN_EMAIL=onboarding@resend.dev  # Sandbox
SMTP_SENDER_NAME=CRM Axivity
```

**Configuration PRODUCTION** (à faire avant déploiement) :
1. **Vérifier le domaine dans Resend** :
   - Aller sur https://resend.com/domains
   - Ajouter `axivity.cloud`
   - Configurer les DNS (MX, SPF, DKIM, DMARC)

2. **Modifier les variables Coolify** :
   ```env
   ENABLE_EMAIL_AUTOCONFIRM=false
   SMTP_ADMIN_EMAIL=noreply@axivity.cloud
   ADDITIONAL_REDIRECT_URLS=https://crm.axivity.cloud/**
   GOTRUE_SITE_URL=https://crm.axivity.cloud
   ```

3. **Redéployer le service Auth dans Coolify**

### URLs de redirection

**DEV** :
```env
ADDITIONAL_REDIRECT_URLS=http://localhost:3000/**,http://localhost:3000/auth/callback
```

**PRODUCTION** :
```env
ADDITIONAL_REDIRECT_URLS=https://crm.axivity.cloud/**,https://crm.axivity.cloud/auth/callback
GOTRUE_SITE_URL=https://crm.axivity.cloud
```

### Variables d'environnement Frontend (.env.production)

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.axivity.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Clé anon de production
```

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
