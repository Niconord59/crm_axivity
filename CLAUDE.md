# Interface Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-16

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
│   └── onboarding/         # Tour guidé (OnboardingTour, TourTrigger)
├── hooks/                  # React Query hooks (13 hooks)
├── lib/
│   ├── airtable.ts         # API client
│   ├── airtable-tables.ts  # Table IDs (21 tables)
│   ├── utils.ts            # Helpers (cn, formatters)
│   ├── schemas/            # Zod validation schemas
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
- **Status**: 100% - 62/62 tasks
- **Specs**: `specs/003-prospection/`
- **Content**:
  - Page `/prospection` dédiée à la gestion des leads
  - Import CSV avec mapping manuel des colonnes (papaparse)
  - Suivi des appels (statuts, rappels, notes)
  - Conversion Lead → Opportunité
  - KPIs de prospection (à appeler, rappels, taux qualification, retards)
  - **Intégration Google Calendar** (Phase 7) : Planifier des RDV depuis le CallResultDialog
  - **Intégration Gmail** (Phase 8) : Envoyer des emails de suivi après "Pas répondu"
- **Nouveaux composants**:
  - `components/prospection/` : ProspectionKPIs, LeadCard, ProspectionFilters, CallResultDialog, ProspectForm, LeadImportDialog, EmailComposer
  - `components/prospection/agenda/` : AgendaTab, WeekCalendar, EventCard, CreateEventDialog, GoogleAuthButton
- **Nouveaux hooks**:
  - `use-prospects.ts` : useProspects, useProspectsWithClients, useUpdateProspectStatus, useCreateProspect, useProspectionKPIs
  - `use-import-leads.ts` : useImportLeads (CSV parsing, mapping, batch import)
  - `use-convert-opportunity.ts` : useConvertToOpportunity
  - `use-google-calendar.ts` : useCalendarEvents, useCreateCalendarEvent, useGoogleCalendarStatus
  - `use-gmail.ts` : useSendEmail, generateFollowUpEmail
- **Auth Google (Calendar + Gmail)**:
  - `lib/auth.ts` : Configuration NextAuth.js v5 avec Google OAuth + calendar + gmail.send scopes
  - `app/api/auth/[...nextauth]/route.ts` : Handler NextAuth
  - `app/api/calendar/events/route.ts` : API GET/POST events
  - `app/api/gmail/send/route.ts` : API POST pour envoyer des emails
  - `providers/session-provider.tsx` : SessionProvider wrapper
- **Champs Airtable** (T2-Contacts) ✅:
  - "Statut Prospection" (Single Select) : À appeler, Appelé - pas répondu, Rappeler, RDV planifié, Qualifié, Non qualifié, Perdu
  - "Date Rappel" (Date)
  - "Source Lead" (Single Select)
  - "Notes Prospection" (Long Text)
  - "Type RDV" (Single Select) : Visio, Présentiel
  - "Lien Visio" (URL)
- **Champs Airtable** (T1-Clients) ✅ - Ajoutés le 16 déc. 2025 :
  - "SIRET" (Single Line Text) : Numéro SIRET entreprise
  - "Adresse" (Single Line Text) : Adresse postale
  - "Code Postal" (Single Line Text)
  - "Ville" (Single Line Text)
  - "Pays" (Single Line Text) : Défaut "France"
- **Variables d'environnement Google**:
  - `AUTH_SECRET` : Secret NextAuth (openssl rand -base64 32)
  - `AUTH_GOOGLE_ID` : Google OAuth Client ID
  - `AUTH_GOOGLE_SECRET` : Google OAuth Client Secret

### 004-onboarding-tour (Tour Guidé - IMPLEMENTED)
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
- **Migration Next.js 16** : Upgrade vers Next.js 16.0.10 + React 19.2.3 + Turbopack (15 déc. 2025)
- **Fix TacheForm** : Correction SelectItem value vide pour le champ Responsable (15 déc. 2025)
- **003-prospection IMPLEMENTÉ** : Module complet de gestion des leads (15 déc. 2025)
  - Page `/prospection` avec KPIs, filtres, liste de leads
  - Import CSV avec wizard 3 étapes (upload, mapping, preview)
  - Suivi des appels (CallResultDialog avec résultats et rappels)
  - Création manuelle de prospects (ProspectForm)
  - Conversion Lead → Opportunité avec mise à jour statuts
- **004-onboarding-tour IMPLEMENTÉ** : Tour guidé pour nouveaux utilisateurs (15 déc. 2025)
  - Solution custom (react-joyride incompatible React 19)
  - 11 étapes avec navigation inter-pages
  - Persistance localStorage + auto-démarrage première visite
  - Raccourcis clavier (→←, Esc, ?)
- **Google Calendar Integration** : Intégration dans le module prospection (15 déc. 2025)
  - Onglet "Agenda" dans CallResultDialog avec vue semaine
  - Authentification Google OAuth via NextAuth.js v5
  - Création de RDV pré-remplis avec infos du lead
  - Nouveau statut "RDV planifié" (badge violet)
  - Onglet "Appel" renommé en "Résultat"
  - Notes et checkbox masqués pour "RDV planifié" (évite doublons)
  - Rafraîchissement automatique de la liste après mise à jour statut
- **Gmail Integration (Phase 8)** : Envoi d'emails de suivi (16 déc. 2025)
  - Option "Message vocal laissé" pour "Pas répondu"
  - Toggle "Envoyer un email de suivi" avec EmailComposer intégré
  - Template email pré-rempli avec infos prospect + mention voicemail
  - Envoi via Gmail API (scope gmail.send)
  - Interaction Email créée automatiquement avec contenu complet
  - Historique enrichi : emails affichés avec style distinct (fond bleu)
  - Résumé dynamique des actions (voicemail + email) sous checkbox interaction
- **Champs Airtable ajoutés** (T2-Contacts) : "Type RDV" (Visio/Présentiel), "Lien Visio" (URL)
- **Onglet "RDV en cours"** : Pour les visio, affiche lien Meet + prise de notes en direct
- **Champs Airtable Clients (Phase 9)** : Ajout SIRET, Adresse, Code Postal, Ville, Pays (16 déc. 2025)
  - Import CSV enrichi avec 17 champs mappables (entreprise + contact)
  - Affichage SIRET et adresse complète dans l'onglet "Entreprise" du CallResultDialog
  - Modèle CSV disponible : `modele_import_leads.csv`
- **Logo Axivity dans la sidebar** (16 déc. 2025)
  - Logo déplacé vers `public/images/logo-axivity.png`
  - Remplace le texte "A CRM Axivity" par le logo officiel
  - Utilisation de `next/image` pour optimisation
- **UX LeadCard améliorée (Phase 10)** (16 déc. 2025)
  - Bouton d'action dynamique selon le statut du lead :
    - À appeler → "Appeler" (Phone)
    - Appelé - pas répondu / Rappeler → "Rappeler" (PhoneCall)
    - RDV planifié → "Voir RDV" (Calendar)
    - Qualifié → "Convertir" (ArrowRight)
    - Non qualifié / Perdu → "Voir fiche" (FileText)
  - Suppression du bouton "Qualifier" redondant (qualification via dialog)
  - Header CallResultDialog simplifié : juste le nom avec icône User
  - Suppression du formulaire OpportuniteForm de la page (conversion via CallResultDialog)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
