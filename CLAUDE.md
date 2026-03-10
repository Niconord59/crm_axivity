# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

```
CRM_Axivity/
├── crm/                    # 🎯 APPLICATION (Next.js - code production)
│   ├── src/                # Code source React/Next.js
│   ├── public/             # Assets statiques
│   ├── package.json        # Dépendances
│   └── ...                 # Configs (tsconfig, tailwind, etc.)
│
├── supabase/               # 🗄️ INFRASTRUCTURE DB
│   └── migrations/         # Scripts SQL de migration
│
├── workflows/              # ⚡ AUTOMATIONS
│   └── n8n/                # Workflows N8N (JSON)
│
├── docs/                   # 📚 DOCUMENTATION
│   ├── architecture/       # Doc technique (API, data models, hooks)
│   ├── specs/              # Spécifications par feature (001-xxx, 002-xxx...)
│   ├── guides/             # Guides legacy (passation, migration, roadmap)
│   └── templates/          # Templates utilisateur (CSV import, etc.)
│
├── .github/                # 🔄 CI/CD (GitHub Actions)
├── .claude/                # 🤖 Tooling Claude Code
├── _bmad/                  # 🤖 Tooling BMAD
│
└── CLAUDE.md               # Ce fichier (instructions globales)
```

### Commands

```bash
cd crm && npm run dev       # Development server
cd crm && npm run build     # Production build
cd crm && npm test          # Run tests
cd crm && npm run lint      # ESLint (replaces deprecated next lint)
```

## Git Workflow

### Branching Strategy

- `main` → production (auto-deploy via Coolify to `crm.axivity.cloud`)
- `develop` → staging (auto-deploy via Coolify to `crm-staging.axivity.cloud`)
- `feature/xxx`, `fix/xxx` → branches de travail

### Workflow

1. Créer une branche depuis `develop`
2. Push → ouvrir une PR vers `develop`
3. CI vérifie automatiquement (lint + tests + build)
4. Merge dans `develop` → staging se redéploie
5. PR de `develop` vers `main` quand validé en staging
6. Merge → prod se redéploie

### Rules

- **Ne jamais push directement sur `main`** (branch protection active)
- Commits en **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.) — validé par `commitlint`
- CI pipeline : `.github/workflows/ci.yml`

## Environments

| Environnement | CRM URL | Supabase URL | Branche |
|---------------|---------|--------------|---------|
| **Production** | `crm.axivity.cloud` | `supabase.axivity.cloud` | `main` |
| **Staging** | `crm-staging.axivity.cloud` | `supabase-staging.axivity.cloud` | `develop` |

Les deux environnements sont **complètement isolés** (bases de données et clés séparées).

## Project Overview

CRM Axivity is an **operational cockpit for an AI Agency** built on Airtable. It serves as a centralized "nervous system" for managing the entire client lifecycle: prospecting, sales pipeline, project execution, invoicing, and client retention.

**Base ID**: `appEf6JtWFdfLwsU6`
**Base URL**: https://airtable.com/appEf6JtWFdfLwsU6

## Architecture

### Core Tables (21 tables total)

The system follows an **Automation-Ready** design with bidirectional relationships:

| Category | Tables |
|----------|--------|
| **CRM Core** | T1-Clients, T2-Contacts, T8-Interactions |
| **Sales Pipeline** | T3-Opportunités, T14-Catalogue de Services, T15-Lignes de Devis |
| **Project Management** | T4-Projets, T5-Tâches, T6-Modèles de Tâches |
| **Finance** | T7-Factures |
| **Time & Resources** | T9-Journal de Temps, T10-Équipe |
| **Knowledge & Strategy** | T11-Connaissances, T12-Objectifs, T13-Résultats Clés |
| **Ecosystem** | T16-Feedback Client, T17-Partenaires & Freelances |
| **System** | T18-Changelog du Cockpit, T19-Scénarios Prévisionnels, T20-Accomplissements, T21-Demandes d'Évolution |

### Data Flow

```
Clients → Contacts → Interactions
    ↓
Opportunités → Lignes de Devis ← Catalogue de Services
    ↓
Projets → Tâches → Journal de Temps
    ↓         ↓
Factures    Équipe → Accomplissements

Projets → Feedback Client
       → Connaissances
       → Résultats Clés ← Objectifs
```

### Key Calculated Fields

**Projets:**
- `Nom du Projet`: Formula `'P' & {ID Projet} & ' - ' & {Brief Projet}`
- `% Tâches Terminées`: `{Nb Tâches Terminées} / {Nb Tâches}`
- `Budget Temps Consommé`: `{Total Heures Passées} / {Total Heures Estimées}`
- `Marge Brute`: `{Montant Total Facturé} - {Coût Interne Estimé}`

**Opportunités:**
- `Valeur Pondérée`: `{Valeur Estimée} * {Probabilité}`

**Factures:**
- `Montant TTC`: `{Montant HT} * 1.2`
- Relance levels (N1/N2/N3) at J+1, J+7, J+15

**Clients:**
- `Santé du Client`: "🔴 À relancer" if > 90 days without interaction

**T1-Clients - Champs de facturation (ajoutés 16 déc. 2025):**
- `SIRET` (Single Line Text) - Numéro SIRET entreprise (14 chiffres)
- `Adresse` (Single Line Text) - Adresse postale
- `Code Postal` (Single Line Text)
- `Ville` (Single Line Text)
- `Pays` (Single Line Text) - Défaut: France

## Integration Stack

| Tool | Usage |
|------|-------|
| **N8N** | Primary automation platform for complex workflows |
| **Make (Integromat)** | Secondary for simpler automations |
| **Airtable Automations** | Basic internal alerts |
| **Gmail** | Email sending (feedback, reminders) |
| **Slack** | Team notifications |
| **Google Calendar** | Deadline sync |

## Déploiement (Coolify)

### Docker Configuration

Le projet utilise un Dockerfile multi-stage optimisé pour Next.js standalone:

```dockerfile
# Stage 1: deps     - Installation des dépendances
# Stage 2: builder  - Build de l'application
# Stage 3: runner   - Image de production minimale
```

**Important**: L'image Alpine nécessite `curl` pour les health checks Coolify:
```dockerfile
# Dans le stage runner
RUN apk add --no-cache curl
```

### Health Check

Endpoint: `GET /api/health`

Réponse:
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T12:00:00.000Z"
}
```

**Configuration Coolify**:
| Paramètre | Valeur |
|-----------|--------|
| Command | `/usr/bin/curl http://localhost:3000/api/health` |
| Interval | 30s |
| Timeout | 30s |
| Retries | 3 |
| Start Period | 30s |
| Response Text | *(vide - l'endpoint retourne du JSON)* |

### Export Excel (ExcelJS)

L'export Excel utilise **ExcelJS** (remplace xlsx pour 0 vulnérabilités npm):
- Fichier: `src/lib/export.ts`
- Fonction async: `exportToExcel()`
- Composant: `src/components/shared/ExportButton.tsx`

### Watch Paths (Optimisation déploiement)

Seuls les changements dans `crm/**` déclenchent un redéploiement.
Les modifications dans `docs/`, `CLAUDE.md`, `supabase/migrations/` ne redéploient pas.

## Frontend Application - React + Shadcn/UI

L'interface utilisateur est développée comme une application web SAAS complète.

### Stack Technique

| Technologie | Version | Documentation |
|-------------|---------|---------------|
| **Next.js** | 16.0.10 (Turbopack) | https://nextjs.org/ |
| **React** | 19.2.3 | https://fr.react.dev/ |
| **Shadcn/UI** | Latest | https://ui.shadcn.com |
| **Tailwind CSS** | 3.x | https://tailwindcss.com |
| **Recharts** | Latest | Graphiques |

### Principes de Développement

1. **100% Responsive** : Mobile-first, optimisé smartphone
2. **Composants Shadcn** : Toute la partie graphique utilise exclusivement Shadcn/UI
3. **API Airtable** : Backend via REST API Airtable

### Structure des Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | KPIs, graphiques, projets récents |
| `/projets` | Projets | Liste, Kanban, détail projet |
| `/opportunites` | Pipeline | Kanban commercial drag & drop |
| `/taches` | Tâches | Liste, calendrier, mes tâches |
| `/clients` | Clients | Liste, fiche client 360° |
| `/clients/[id]` | Fiche Client | Onglets: Infos/Projets/Factures/Interactions |
| `/factures` | Factures | Liste, relances |
| `/equipe` | Équipe | Membres, charge de travail |
| `/rapports` | Dashboard CEO | KPIs stratégiques, graphiques |
| `/portail/[clientId]` | Portail Client | Interface externe client |

### Composants Shadcn Clés

- **Layout**: `Card`, `Sheet`, `Tabs`, `ScrollArea`
- **Navigation**: `NavigationMenu`, `Command`, `DropdownMenu`
- **Formulaires**: `Input`, `Select`, `Calendar`, `Form`
- **Data Display**: `Table`, `Badge`, `Progress`, `Avatar`
- **Feedback**: `Toast`, `Dialog`, `AlertDialog`

## N8N Workflows

Les workflows sont disponibles dans le dossier `workflows/n8n/`.

### Workflows Airtable (LEGACY)

| Workflow | Fichier | Déclencheur |
|----------|---------|-------------|
| **Conversion Opportunité** | `conversion_opportunite_projet.json` | Modification Airtable |
| **Feedback Post-Projet** | `feedback_post_projet.json` | Quotidien 9h |
| **Alertes Tâches** | `alertes_taches_retard.json` | Quotidien 9h (Lun-Ven) |
| **Relances Factures** | `relances_factures.json` | Quotidien 10h (Lun-Ven) |

### Workflows Supabase (ACTIFS - 19 déc. 2025)

| Workflow | Fichier | Déclencheur |
|----------|---------|-------------|
| **Conversion Opportunité** | `supabase_conversion_opportunite_projet.json` | Toutes les minutes |
| **Feedback Post-Projet** | `supabase_feedback_post_projet.json` | Quotidien 9h |
| **Alertes Tâches** | `supabase_alertes_taches_retard.json` | Quotidien 9h (Lun-Ven) |
| **Relances Factures** | `supabase_relances_factures.json` | Quotidien 10h (Lun-Ven) |

### Configuration N8N pour Supabase

1. Créer un credential Supabase API :
   - Host: `https://supabase.axivity.cloud`
   - Service Role Key: (depuis Coolify → Variables)

2. Syntaxe des filtres PostgREST :
   ```
   # Expression dynamique (IMPORTANT: utiliser ={{ }})
   "filterString": "={{ 'date_echeance=lt.' + $now.toISODate() + '&statut=neq.Terminé' }}"
   ```

### Colonnes Supabase requises pour les workflows

**projets:**
- `feedback_envoye` (BOOLEAN, default false) - Migration `13_projets_feedback_column.sql`

**factures:**
- `niveau_relance_envoye` (INTEGER, default 0)
- `date_derniere_relance` (DATE)
- Statut `'En retard'` dans l'enum - Migration `14_invoice_status_en_retard.sql`

### Champs Airtable utilisés par les workflows (LEGACY)

**T4 - Projets:**
- `Date Fin Réelle` (Date) - pour feedback post-projet
- `Notes` (Long text) - copié depuis l'opportunité lors de la conversion
- `Opportunités` (Lien vers T3) - lien bidirectionnel automatique

**T3 - Opportunités:**
- `Notes` (Long text) - transféré vers le projet
- `Projet Créé` (Lien vers T4) - pour éviter les doublons

**T5 - Tâches:**
- `Membre Équipe` (Lien vers T10) - utilisé pour récupérer l'email du responsable (pas le champ Collaborateur)

**T7 - Factures:**
- `Niveau Relance Envoyé` (Number 0-3) - mis à jour par le workflow
- `Date Dernière Relance` (Date) - mis à jour par le workflow
- `Niveau de Relance` (Formula) - lecture seule, calculé automatiquement

## Airtable Constraints

- Primary fields must be simple text (not links or formulas)
- Rollups/Formulas require manual configuration via UI (not all options available via API)
- "Current User" filtering not always available in collaborative views - use personal views
- **Collaborateur vs Lien**: Le champ `Responsable` (Collaborateur Airtable) ne peut pas être utilisé pour récupérer l'email via API. Utiliser `Membre Équipe` (Lien vers T10-Équipe) à la place.
- **Champs de type Link**: Ne peuvent pas être créés via API, doivent être créés manuellement dans l'interface Airtable

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Key fields (links) | Suffix `*` in docs | "Client `*`" |
| Operational views | UPPERCASE | "PIPELINE COMMERCIAL" |
| Template views | Emoji prefix + TEMPLATE | "🎯 TEMPLATE - Mes Tâches" |

## Modification Workflow

1. Document changes in "Changelog du Cockpit" table before modifying
2. When adding fields: fill description, check impact on rollups/formulas
3. When modifying formulas: verify referenced fields (`isValid: true`), test with real data

## Important Warnings

- Field deletion can cascade-break rollups and formulas
- Never change primary field type
- Bidirectional links auto-create inverse fields - don't delete them
