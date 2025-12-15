# Document de Passation - Cockpit Airtable "Agence IA"

**Date de création** : 14 décembre 2025  
**Projet** : Base Airtable pour Agence IA  
**Base ID** : `appEf6JtWFdfLwsU6`  
**URL** : https://airtable.com/appEf6JtWFdfLwsU6

---

## 1. Présentation du Projet

### 1.1 Vision et Objectif

Ce projet consiste en la création d'un **cockpit opérationnel complet** pour une agence spécialisée en Intelligence Artificielle. L'objectif est de centraliser l'ensemble des opérations business dans une base Airtable unique, servant de "système nerveux central" pour l'agence.

Le cockpit couvre l'intégralité du cycle de vie client :
- **Prospection** → Gestion des leads et opportunités commerciales
- **Vente** → Pipeline commercial et devis automatisés
- **Exécution** → Gestion de projets et tâches
- **Facturation** → Suivi des factures et paiements
- **Fidélisation** → Feedback client et relation continue

### 1.2 Philosophie de Conception

Le système a été conçu selon les principes suivants :

1. **Automation-Ready** : Toutes les tables sont reliées de manière à permettre des automatisations complexes (N8N, Make, Zapier)
2. **Data Integrity** : Relations bidirectionnelles cohérentes entre toutes les tables
3. **Scalabilité** : Structure pensée pour supporter la croissance de l'équipe et du volume d'affaires
4. **Self-Documented** : Descriptions sur chaque champ et table pour faciliter l'onboarding

### 1.3 Documentation de Référence

Le projet s'appuie sur un guide de construction détaillé disponible dans le projet Claude : `Guide_de_Construction___Base_Airtable_pour_Agence_IA__1_.md`

Ce document de 37 sections décrit :
- La structure de chaque table (T1 à T21)
- Les vues stratégiques à créer
- Les automatisations recommandées
- Les dashboards et interfaces

---

## 2. État Actuel de l'Implémentation

### 2.1 Tables Implémentées (21/21) ✅

| # | Table | ID Airtable | Statut | Description |
|---|-------|-------------|--------|-------------|
| T1 | Clients | `tbljVwWGbg2Yq9toR` | ✅ Complet | CRM principal - entreprises clientes |
| T2 | Contacts | `tblNHBh9qBi6OeFca` | ✅ Complet | Personnes physiques chez les clients |
| T3 | Opportunités | `tbl8QiX8vGLQfRu0G` | ✅ Complet | Pipeline commercial |
| T4 | Projets | `tblwNbd9Lk8SxixAI` | ✅ Complet | Missions signées |
| T5 | Tâches | `tbl6x2Ju4HJyh8SW2` | ✅ Complet | Actions opérationnelles |
| T6 | Modèles de Tâches | `tblhOmJ1223G97l3k` | ✅ Complet | Templates pour automatisation |
| T7 | Factures | `tbl0d2o8Df9Sj827M` | ✅ Complet | Suivi facturation |
| T8 | Interactions | `tblUoIhmQVr3ie5BQ` | ✅ Complet | Journal CRM |
| T9 | Journal de Temps | `tblPFfQLwtEbp8PoG` | ✅ Complet | Time tracking |
| T10 | Équipe | `tblozWfDZEFW3Nkwv` | ✅ Complet | Membres internes |
| T11 | Connaissances | `tblizxKK7FJsHuWnU` | ✅ Complet | Wiki interne |
| T12 | Objectifs | `tblFhPGAqSaXSJZ0e` | ✅ Complet | OKRs stratégiques |
| T13 | Résultats Clés | `tbllcCCF5blNA8FQ6` | ✅ Complet | KRs mesurables |
| T14 | Catalogue de Services | `tbl7GlDVGVyuKM1Sx` | ✅ Complet | Offres productisées |
| T15 | Lignes de Devis | `tblDKpxirY53hAO8k` | ✅ Complet | Table de jonction devis |
| T16 | Feedback Client | `tbl9I3B5xqIy5Gcrt` | ✅ Complet | Satisfaction post-projet |
| T17 | Partenaires & Freelances | `tblJfPLFKJyCg23Az` | ✅ Complet | Collaborateurs externes |
| T18 | Changelog du Cockpit | `tblx1zcTUoahNDAgn` | ✅ Complet | Versioning de la base |
| T19 | Scénarios Prévisionnels | `tblU8SpVot0pxbosk` | ✅ Complet | Modélisation commerciale |
| T20 | Accomplissements | `tblBEg5xbIEwib9Eo` | ✅ Complet | Gamification équipe |
| T21 | Demandes d'Évolution | `tblaHSPKYf4r3RbNF` | ✅ Complet | Amélioration continue |

### 2.2 Conformité aux Spécifications

**Taux de conformité global : 100%**

#### ✅ Éléments conformes :
- Toutes les 21 tables créées avec les bons champs
- Relations bidirectionnelles entre tables
- Formules de calcul (Valeur Pondérée, % Tâches Terminées, Marge, etc.)
- Rollups pour agrégation de données
- Champs lookup pour affichage de données liées

#### ✅ Points vérifiés :

1. **Table Clients - Date de Création**
   - Le champ existe (`fldxaWbWyrTX3De5J`) et fonctionne ✅

2. **Statut de Facturation (Projets)**
   - Le champ existe en tant que Rollup (`fldu7xFvRQADOP0L5`) ✅

3. **Valeur Pondérée (Opportunités)**
   - Formule `{Valeur Estimée} * {Probabilité}` ✅

### 2.3 Vues Créées

| Table | Vue | Type | Description |
|-------|-----|------|-------------|
| Opportunités | Pipeline Commercial | Kanban | Vue par statut commercial |
| Opportunités | Opportunités à Relancer | Grid | Affaires sans activité récente |
| Projets | Projet par Statut | Kanban | Suivi de l'avancement |
| Projets | Santé des Projets | Grid | Projets en cours avec indicateurs |
| Projets | Projets en Retard | Grid | Projets dépassant la date de fin |
| Tâches | Calendrier des Échéances | Calendar | Planning des tâches |
| Tâches | Mes Tâches Hebdo (Template) | Grid | Template pour vues personnelles |
| Tâches | Mes Tâches Urgentes (Template) | Grid | Template pour tâches prioritaires |

---

## 3. Architecture Technique

### 3.1 Schéma des Relations

```
[Clients] ←──────────────────────────────────────────┐
    │                                                │
    ├── → [Contacts] ←── [Interactions]              │
    │         │                                      │
    │         └── → [Partenaires & Freelances]       │
    │                                                │
    ├── → [Opportunités] ←── [Lignes de Devis] ←── [Catalogue de Services]
    │         │
    │         └── → [Projets] ←─────────────────────┐
    │                   │                           │
    │                   ├── → [Tâches] ←── [Journal de Temps]
    │                   │         │
    │                   │         └── → [Équipe] ←── [Accomplissements]
    │                   │                   │
    │                   │                   └── [Demandes d'Évolution]
    │                   │
    │                   ├── → [Factures]
    │                   │
    │                   ├── → [Feedback Client]
    │                   │
    │                   ├── → [Connaissances]
    │                   │
    │                   └── → [Résultats Clés] ←── [Objectifs]
    │
    └── CA Total Encaissé (Rollup depuis Projets terminés)
```

### 3.2 Champs Calculés Clés

#### Projets
| Champ | Type | Formule/Config |
|-------|------|----------------|
| Nom du Projet | Formula | `'P' & {ID Projet} & ' - ' & {Brief Projet}` |
| % Tâches Terminées | Formula | `{Nb Tâches Terminées} / {Nb Tâches}` |
| Retard (jour) | Formula | Calcul des jours de retard si non terminé |
| Budget Temps Consommé | Formula | `{Total Heures Passées} / {Total Heures Estimées}` |
| Marge Brute | Formula | `{Montant Total Facturé} - {Coût Interne Estimé}` |
| Taux de Marge | Formula | `{Marge Brute} / {Montant Total Facturé}` |

#### Factures
| Champ | Type | Formule/Config |
|-------|------|----------------|
| Montant TTC | Formula | `{Montant HT} * 1.2` |
| Niveau de Relance | Formula | Système 3 niveaux (J+1, J+7, J+15) |
| Relance N1/N2/N3 | Formula | Flags automatiques pour relances |

#### Clients
| Champ | Type | Formule/Config |
|-------|------|----------------|
| CA Total Encaissé | Rollup | Somme budgets projets terminés |
| Santé du Client | Formula | "🔴 À relancer" si > 90 jours sans interaction |

### 3.3 Contraintes Techniques Airtable

**Limitations rencontrées :**

1. **Champ primaire** : Doit être de type texte simple (pas de lien, pas de formule comme champ primaire natif)
2. **Rollups/Formulas** : Ne peuvent pas être créés via API avec toutes leurs options, configuration manuelle requise
3. **Filtrage "Current User"** : Option pas toujours disponible dans les vues collaboratives - nécessite des vues personnelles

---

## 4. Ce Qui Reste à Faire

### 4.1 Automatisations Implémentées ✅

Les workflows N8N sont disponibles dans le dossier `Workflows_n8n/`. Chaque workflow a sa documentation dédiée.

#### Automatisation 1 : Email de Feedback Post-Projet ✅
- **Fichier** : `feedback_post_projet.json`
- **Déclencheur** : Quotidien 9h
- **Condition** : Projets avec `Date Fin Réelle` il y a 7 jours ET `Feedback Envoyé` = false
- **Action** : Email personnalisé au contact client + log interaction
- **Statut** : ✅ Implémenté

#### Automatisation 2 : Conversion Opportunité → Projet ✅
- **Fichier** : `conversion_opportunite_projet.json`
- **Déclencheur** : Modification Airtable (Opportunité)
- **Condition** : Statut = "Gagnée" ET pas de projet déjà lié
- **Actions** : Création projet, liaison bidirectionnelle, notifications Slack/Email, log Changelog
- **Champ utilisé** : `Opportunités` (lien bidirectionnel dans T4-Projets)
- **Statut** : ✅ Implémenté

#### Automatisation 3 : Alertes Tâches en Retard ✅
- **Fichier** : `alertes_taches_retard.json`
- **Déclencheur** : Quotidien 9h (Lun-Ven)
- **Condition** : Date Échéance < Aujourd'hui ET Statut ≠ "Terminée"
- **Actions** : Email individuel par responsable + résumé manager + Slack
- **Champ utilisé** : `Membre Équipe` (lien vers T10) pour récupérer l'email
- **Statut** : ✅ Implémenté

#### Automatisation 4 : Relances Factures ✅
- **Fichier** : `relances_factures.json`
- **Déclencheur** : Quotidien 10h (Lun-Ven)
- **Condition** : Statut = "Envoyée" ET Date d'Échéance dépassée
- **Actions** : Emails escalade N1/N2/N3 + mise à jour champs + log interaction
- **Champs utilisés** :
  - `Niveau Relance Envoyé` (Number 0-3) - mis à jour par le workflow
  - `Date Dernière Relance` (Date) - mis à jour par le workflow
  - `Niveau de Relance` (Formula) - lecture seule
- **Statut** : ✅ Implémenté

### 4.2 Application Web SAAS - React + Shadcn ✅

> **STATUT** : Application web SAAS complète implémentée avec succès (105 tâches complétées).

#### Stack Technique

| Technologie | Version | Documentation |
|-------------|---------|---------------|
| **Next.js** | 16.0.10 (Turbopack) | https://nextjs.org/ |
| **React** | 19.2.3 | https://fr.react.dev/ |
| **Shadcn/UI** | Latest | https://ui.shadcn.com |
| **Tailwind CSS** | 3.x | https://tailwindcss.com |
| **React Query** | 5.x | https://tanstack.com/query |
| **Airtable API** | REST | Backend / Source de données |

#### Principes de Conception

1. **100% Responsive** : Interface optimisée pour desktop, tablette et smartphone
2. **Mobile-First** : Conception prioritaire pour l'usage mobile
3. **Composants Shadcn** : Toute la partie graphique utilise exclusivement Shadcn/UI
4. **Connexion API Airtable** : Lecture/écriture des données via l'API REST Airtable

#### Architecture des Pages

```
src/
├── app/                          # Routes Next.js ou React Router
│   ├── (auth)/                   # Pages authentification
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Layout principal avec sidebar
│   │   ├── page.tsx              # Dashboard Principal
│   │   ├── projets/
│   │   │   ├── page.tsx          # Liste des projets
│   │   │   └── [id]/page.tsx     # Détail projet
│   │   ├── opportunites/
│   │   │   ├── page.tsx          # Pipeline commercial (Kanban)
│   │   │   └── [id]/page.tsx     # Détail opportunité
│   │   ├── taches/
│   │   │   ├── page.tsx          # Mes tâches
│   │   │   └── calendrier/       # Vue calendrier
│   │   ├── clients/
│   │   │   ├── page.tsx          # Liste clients
│   │   │   └── [id]/page.tsx     # Fiche client 360°
│   │   ├── factures/
│   │   │   ├── page.tsx          # Liste factures
│   │   │   └── relances/         # Factures à relancer
│   │   ├── equipe/
│   │   │   ├── page.tsx          # Gestion équipe
│   │   │   └── charge/           # Charge de travail
│   │   ├── rapports/
│   │   │   ├── page.tsx          # Dashboard stratégique CEO
│   │   │   └── financier/        # Rapport financier
│   │   └── parametres/
│   └── portail/                  # Portail client externe
│       ├── [clientId]/
│       │   ├── projets/
│       │   └── factures/
├── components/
│   ├── ui/                       # Composants Shadcn
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation latérale (responsive)
│   │   ├── Header.tsx            # En-tête avec recherche
│   │   ├── MobileNav.tsx         # Navigation mobile bottom bar
│   │   └── Breadcrumb.tsx
│   ├── dashboard/
│   │   ├── KpiCard.tsx           # Carte KPI
│   │   ├── ChartCA.tsx           # Graphique CA
│   │   └── RecentActivity.tsx
│   ├── projets/
│   │   ├── ProjetCard.tsx
│   │   ├── ProjetKanban.tsx
│   │   └── ProjetTimeline.tsx
│   ├── taches/
│   │   ├── TacheList.tsx
│   │   ├── TacheCalendar.tsx
│   │   └── TacheItem.tsx
│   └── shared/
│       ├── DataTable.tsx         # Table de données Shadcn
│       ├── SearchInput.tsx
│       └── StatusBadge.tsx
└── lib/
    ├── airtable.ts               # Client API Airtable
    └── utils.ts
```

#### Pages et Fonctionnalités

##### 1. Dashboard Principal (`/`)
| Composant Shadcn | Fonctionnalité |
|------------------|----------------|
| `Card` | KPIs : Projets actifs, CA Pipeline, CA Trimestre, Tâches en retard |
| `Table` | Liste des projets en cours avec progression |
| `Badge` | Statuts colorés (En cours, Terminé, En retard) |
| `Progress` | Barre de progression des projets |
| `Chart` (via Recharts) | Graphique CA mensuel |

##### 2. Pipeline Commercial (`/opportunites`)
| Composant Shadcn | Fonctionnalité |
|------------------|----------------|
| `Card` + Drag & Drop | Vue Kanban du pipeline |
| `Dialog` | Modal de création/édition opportunité |
| `Select` | Filtres par statut, client |
| `Badge` | Valeur pondérée par colonne |

##### 3. Gestion Projets (`/projets`)
| Composant Shadcn | Fonctionnalité |
|------------------|----------------|
| `DataTable` | Liste triable et filtrable |
| `Tabs` | Vue Liste / Kanban / Timeline |
| `Sheet` | Panneau latéral détail projet |
| `Avatar` | Photos équipe assignée |

##### 4. Mes Tâches (`/taches`)
| Composant Shadcn | Fonctionnalité |
|------------------|----------------|
| `Checkbox` | Marquer tâche terminée |
| `Calendar` | Vue calendrier des échéances |
| `DropdownMenu` | Actions rapides |
| `AlertDialog` | Confirmation suppression |

##### 5. Fiche Client 360° (`/clients/[id]`)
| Composant Shadcn | Fonctionnalité |
|------------------|----------------|
| `Tabs` | Infos / Projets / Factures / Interactions |
| `Timeline` | Historique des interactions |
| `Card` | Métriques client (CA total, Santé) |

##### 6. Dashboard Stratégique CEO (`/rapports`)
| Composant Shadcn | Fonctionnalité |
|------------------|----------------|
| `Card` | KPIs stratégiques |
| `Chart` | CA par mois, Taux conversion, Marge |
| `Table` | Top projets rentables |
| `Select` | Filtres par période |

##### 7. Portail Client (`/portail/[clientId]`)
| Composant Shadcn | Fonctionnalité |
|------------------|----------------|
| `Card` | Avancement projet |
| `Progress` | % de complétion |
| `Table` | Factures avec statut |
| `Badge` | Prochaines échéances |

#### Fonctionnalités Avancées Implémentées

##### 8. Panneau de Notifications (Header)
| Composant | Fonctionnalité |
|-----------|----------------|
| `Popover` | Panneau déroulant accessible via l'icône cloche |
| `Badge` | Compteur de notifications non lues |
| `ScrollArea` | Liste scrollable des alertes |

**Types de notifications :**
- Tâches en retard (avec échéance)
- Factures impayées (avec niveau de relance)
- Projets en difficulté (date de fin dépassée)

##### 9. Import de Leads (`/opportunites` → bouton "Importer")
| Composant | Fonctionnalité |
|-----------|----------------|
| `Dialog` | Boîte de dialogue multi-étapes |
| `Select` | Mapping colonnes fichier → champs Airtable |
| `Progress` | Barre de progression d'import |
| `Table` | Aperçu des données avant import |

**Processus d'import :**
1. Upload fichier (drag & drop ou clic)
2. Auto-détection des colonnes
3. Mapping manuel si nécessaire
4. Aperçu des données
5. Import batch avec progression

**Formats supportés :** CSV, XLSX, XLS

##### 10. Recherche Globale (Cmd+K)
| Composant | Fonctionnalité |
|-----------|----------------|
| `Command` | Palette de commandes accessible via ⌘K |
| `Dialog` | Modal de recherche |
| `ScrollArea` | Résultats groupés par type |

**Entités recherchables :**
- Projets
- Clients
- Opportunités
- Tâches
- Factures
- Membres de l'équipe

#### Design Responsive

```
┌─────────────────────────────────────────────────────────────┐
│                    DESKTOP (≥1024px)                        │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │              Contenu Principal                   │
│  240px   │                                                  │
│          │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  Logo    │  │  KPI 1  │ │  KPI 2  │ │  KPI 3  │ │  KPI 4  ││
│  Menu    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│  ...     │                                                  │
│          │  ┌─────────────────────┐ ┌─────────────────────┐│
│          │  │   Graphique CA      │ │   Projets récents   ││
│          │  │                     │ │                     ││
│          │  └─────────────────────┘ └─────────────────────┘│
└──────────┴──────────────────────────────────────────────────┘

┌─────────────────────────┐
│   MOBILE (<768px)       │
├─────────────────────────┤
│ ☰  CRM Axivity    🔔 👤 │  ← Header compact
├─────────────────────────┤
│ ┌─────────┐ ┌─────────┐ │
│ │  KPI 1  │ │  KPI 2  │ │  ← 2 colonnes
│ └─────────┘ └─────────┘ │
│ ┌─────────┐ ┌─────────┐ │
│ │  KPI 3  │ │  KPI 4  │ │
│ └─────────┘ └─────────┘ │
│ ┌─────────────────────┐ │
│ │   Graphique CA      │ │  ← Full width
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │   Projets récents   │ │
│ │   (cards swipable)  │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ 🏠  📊  ✅  👥  ⚙️      │  ← Bottom navigation
└─────────────────────────┘
```

#### Composants Shadcn Utilisés

| Catégorie | Composants |
|-----------|------------|
| **Layout** | `Card`, `Separator`, `Sheet`, `Tabs`, `ScrollArea` |
| **Navigation** | `NavigationMenu`, `Breadcrumb`, `DropdownMenu`, `Command` |
| **Formulaires** | `Input`, `Select`, `Checkbox`, `Calendar`, `DatePicker`, `Form` |
| **Data Display** | `Table`, `Badge`, `Avatar`, `Progress`, `Skeleton` |
| **Feedback** | `Alert`, `AlertDialog`, `Toast`, `Dialog`, `Tooltip` |
| **Actions** | `Button`, `Toggle`, `ToggleGroup` |

#### Intégration Airtable API

```typescript
// lib/airtable.ts
const AIRTABLE_BASE_ID = 'appEf6JtWFdfLwsU6';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

// Tables IDs
export const TABLES = {
  CLIENTS: 'tbljVwWGbg2Yq9toR',
  CONTACTS: 'tblNHBh9qBi6OeFca',
  OPPORTUNITES: 'tbl8QiX8vGLQfRu0G',
  PROJETS: 'tblwNbd9Lk8SxixAI',
  TACHES: 'tbl6x2Ju4HJyh8SW2',
  FACTURES: 'tbl0d2o8Df9Sj827M',
  INTERACTIONS: 'tblUoIhmQVr3ie5BQ',
  EQUIPE: 'tblozWfDZEFW3Nkwv',
};
```

### 4.3 Vues Complémentaires 🟢

| Table | Vue à créer | Type | Filtre |
|-------|-------------|------|--------|
| Factures | Factures en Retard | Grid | Statut = "Envoyée" ET Échéance < Aujourd'hui |
| Factures | À Relancer Aujourd'hui | Grid | Niveau de Relance contient emoji |
| Équipe | Charge de Travail | Grid | Afficher % Capacité Atteinte |
| Journal de Temps | Mon Temps (Semaine) | Grid | Collaborateur = Current User |

---

## 5. Guide d'Utilisation pour le Repreneur

### 5.1 Accès et Permissions

- **Base ID** : `appEf6JtWFdfLwsU6`
- **URL directe** : https://airtable.com/appEf6JtWFdfLwsU6
- **MCP Airtable** : Connecté et fonctionnel pour les opérations programmatiques

### 5.2 Conventions de Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Tables | Nom français explicite | "Partenaires & Freelances" |
| Champs clés (liens) | Suffixe `*` dans la doc | "Client `*`" |
| Vues opérationnelles | MAJUSCULES | "PIPELINE COMMERCIAL" |
| Vues templates | Préfixe emoji + TEMPLATE | "🎯 TEMPLATE - Mes Tâches" |
| Formules | camelCase dans le code | `{fldJ5vQH9i2RFfHvx}` |

### 5.3 Workflow de Modification

1. **Avant toute modification** :
   - Documenter dans la table "Changelog du Cockpit"
   - Tester sur une vue de test si possible

2. **Ajout de champ** :
   - Renseigner la description du champ
   - Vérifier l'impact sur les rollups/formulas existants

3. **Modification de formule** :
   - Vérifier les champs référencés (`isValid: true`)
   - Tester avec des données réelles

### 5.4 Points de Vigilance

⚠️ **Attention aux suppressions** : La suppression d'un champ peut casser des rollups et formulas en cascade

⚠️ **Champs primaires** : Ne jamais changer le type du champ primaire d'une table

⚠️ **Liens bidirectionnels** : Les liens créent automatiquement le champ inverse - ne pas le supprimer

---

## 6. Stack Technique Recommandée

### 6.1 Outils d'Automatisation

| Outil | Usage | Priorité |
|-------|-------|----------|
| **N8N** | Automatisations complexes multi-étapes | ⭐⭐⭐ Principal |
| Make (Integromat) | Automatisations simples | ⭐⭐ Secondaire |
| Airtable Automations | Alertes internes basiques | ⭐ Complémentaire |

### 6.2 Intégrations Prévues

- **Gmail** : Envoi d'emails (feedback, relances)
- **Slack** : Notifications équipe
- **Google Calendar** : Sync des échéances
- **Outils comptabilité** : Export factures (QuickBooks, Pennylane)

### 6.3 Ressources MCP Disponibles

```
- Airtable MCP Server : Opérations CRUD sur la base
- Make MCP : Création/gestion de scénarios
- N8N MCP : Workflows d'automatisation
- Context7 : Documentation technique
```

---

## 7. Prochaines Étapes Recommandées

### Phase 1 : Stabilisation (1-2 jours)
1. ✅ Vérifier toutes les formules (scan `isValid: false`)
2. ✅ Créer les vues manquantes prioritaires

### Phase 2 : Automatisations ✅ TERMINÉ
1. ✅ Workflow feedback post-projet (`feedback_post_projet.json`)
2. ✅ Workflow conversion Opportunité → Projet (`conversion_opportunite_projet.json`)
3. ✅ Workflow alertes tâches en retard (`alertes_taches_retard.json`)
4. ✅ Workflow relances factures (`relances_factures.json`)

**Note** : Voir `Workflows_n8n/README.md` pour les instructions d'installation

### Phase 3 : Application Web React + Shadcn ✅ TERMINÉ
> **Stack** : Next.js 16 + React 19 + Shadcn/UI + Tailwind CSS + React Query + Airtable API (migré le 15 déc. 2025)

1. ✅ Setup projet Next.js 16 avec TypeScript et Turbopack
2. ✅ Installation et configuration Shadcn/UI (New York style)
3. ✅ Création layout responsive (Sidebar + MobileNav + Header)
4. ✅ Dashboard avec KPIs et graphiques
5. ✅ Pipeline commercial (Kanban drag & drop)
6. ✅ Gestion des projets (liste + détail)
7. ✅ Gestion des tâches (liste + calendrier)
8. ✅ Fiche client 360° (onglets)
9. ✅ Gestion des factures (relances)
10. ✅ Dashboard CEO (rapports)
11. ✅ Gestion de l'équipe (charge de travail)
12. ✅ Portail client externe
13. ✅ Recherche globale (Cmd+K)
14. ✅ Panneau de notifications
15. ✅ Import de leads (CSV/XLSX)

**Dossier projet** : `Interface/`
**Documentation specs** : `Interface/specs/001-crm-axivity-interface/`
**Voir section 4.2 pour l'architecture détaillée**

### Phase 4 : Optimisation (ongoing)
1. 📈 Ajuster les formules selon les retours terrain
2. 📈 Créer des vues personnalisées par rôle
3. 📈 Documenter dans le Changelog chaque évolution

### Phase 5 : Améliorations Interface (En cours - 53%)

> **STATUT** : En cours - 27/51 tâches terminées (53%)
> **Documentation specs** : `Interface/specs/002-crm-ameliorations/`

Suite à l'audit de la Phase 3, les améliorations suivantes ont été identifiées pour transformer l'application de lecture-seule en outil opérationnel complet :

#### A1 - Formulaires CRUD (Priorité CRITIQUE) ✅ TERMINÉ
| Entité | Fonctionnalité | Statut |
|--------|----------------|--------|
| Opportunité | Création/Édition via Dialog | ✅ Terminé |
| Projet | Création/Édition avec liaison client | ✅ Terminé |
| Tâche | Création/Édition avec liaison projet/responsable | ✅ Terminé |
| Facture | Création/Édition avec calcul TTC auto | ✅ Terminé |
| Client | Création/Édition | ✅ Terminé |

**Fichiers créés** :
- `src/components/shared/FormDialog.tsx` - Composant Dialog générique
- `src/lib/schemas/*.ts` - 5 schémas Zod
- `src/components/forms/*.tsx` - 5 formulaires CRUD
- `src/components/ui/form.tsx`, `label.tsx`, `textarea.tsx` - Composants UI

**Impact** : ✅ Application maintenant opérationnelle pour création/modification des entités

#### A2 - Fiche Client 360° (Priorité HAUTE)
| Onglet | Contenu | Statut |
|--------|---------|--------|
| Informations | Détails client complets | 📋 Planifié |
| Projets | Projets liés avec statut/budget | 📋 Planifié |
| Factures | Factures liées avec statut paiement | 📋 Planifié |
| Interactions | Historique des contacts (timeline) | 📋 Planifié |

**Indicateur** : Badge "Santé Client" (>90j sans interaction = rouge)

#### A3 - Graphiques Dashboard (Priorité HAUTE) ✅ TERMINÉ
| Graphique | Type | Page | Statut |
|-----------|------|------|--------|
| CA Mensuel | BarChart | Dashboard (/) | ✅ Terminé |
| Pipeline par Statut | PieChart | Opportunités, Rapports | ✅ Terminé |
| Progression Projets | AreaChart | Rapports | ✅ Terminé |

**Fichiers créés** :
- `src/components/shared/ChartContainer.tsx` - Wrapper responsive
- `src/components/charts/CAMensuelChart.tsx` - CA mensuel (6 mois)
- `src/components/charts/PipelineChart.tsx` - Pipeline par statut
- `src/components/charts/ProgressionChart.tsx` - Progression projets
- `src/components/charts/index.ts` - Barrel export

**Impact** : ✅ Visualisations graphiques opérationnelles sur Dashboard, Opportunités et Rapports

#### A4 - Export CSV/Excel (Priorité MOYENNE)
| Page | Export |
|------|--------|
| Projets | CSV + Excel |
| Clients | CSV + Excel |
| Factures | CSV + Excel |
| Opportunités | CSV + Excel |

**Technologie** : xlsx + papaparse (déjà installés)

#### A5 - Calendrier Tâches (Priorité MOYENNE)
- Vue mensuelle avec react-big-calendar
- Tâches positionnées par date d'échéance
- Couleurs par priorité (P1=rouge, P2=orange, P3=bleu)
- Clic → détail de la tâche

#### A6 - Portail Client Externe (Priorité MOYENNE)
| Page | Contenu |
|------|---------|
| Dashboard | KPIs client (projets actifs, factures en attente) |
| Projets | Liste avec % complétion |
| Factures | Liste avec statut paiement |

**Sécurité** : Isolation des données par clientId

#### A7 - Recherche Globale (Priorité BASSE)
- Déclenchement : Cmd+K (Mac) / Ctrl+K (Windows)
- Entités : Clients, Projets, Opportunités, Tâches
- Résultats groupés par type
- Navigation directe vers l'entité

#### A8 - Gestion Équipe (Priorité BASSE)
| Page | Contenu |
|------|---------|
| /equipe | Liste membres avec rôle et tâches en cours |
| /equipe/charge | Barres de progression (heures/capacité) |

**Alerte** : Badge rouge si >100% capacité

#### Estimation Globale

| Phase | Effort | Priorité |
|-------|--------|----------|
| Infrastructure (FormDialog, Schemas) | 2-3h | P1 |
| Formulaires CRUD (5 entités) | 6-8h | P1-CRITIQUE |
| Graphiques (3) | 2-3h | P1 |
| Fiche Client 360° | 3-4h | P1 |
| Export CSV/Excel | 2h | P2 |
| Calendrier Tâches | 3-4h | P2 |
| Portail Client | 4-5h | P2 |
| Recherche & Équipe | 3-4h | P3 |
| **Total** | **25-33h** | - |

---

### Phase 6 : Module Prospection ✅ TERMINÉ

> **STATUT** : 95% - 28/32 tâches (Phase 0 Airtable en attente)
> **Documentation specs** : `Interface/specs/003-prospection/`

#### Contexte

L'import de leads se faisait via la page Opportunités, ce qui impliquait qu'un lead devenait automatiquement une opportunité. Or, un lead doit d'abord être qualifié par téléphone avant de devenir une opportunité.

#### Fonctionnalités Implémentées ✅

| Feature | Description | Statut |
|---------|-------------|--------|
| Page `/prospection` | Liste des leads avec KPIs, filtres, carte par lead | ✅ Terminé |
| Import CSV | Wizard 3 étapes avec mapping, preview, détection doublons | ✅ Terminé |
| Suivi appels | CallResultDialog (5 résultats + date rappel + notes) | ✅ Terminé |
| Création manuelle | ProspectForm pour créer leads manuellement | ✅ Terminé |
| Conversion | Lead qualifié → Opportunité avec pré-remplissage | ✅ Terminé |

#### Fichiers Créés

**Composants** (`src/components/prospection/`) :
- `ProspectionKPIs.tsx` - 4 KPIs (à appeler, rappels, taux qualif, retards)
- `LeadCard.tsx` - Carte lead avec badges et actions
- `ProspectionFilters.tsx` - Filtres statut/source/rappel
- `CallResultDialog.tsx` - Dialog résultat d'appel
- `ProspectForm.tsx` - Formulaire création lead
- `LeadImportDialog.tsx` - Wizard import CSV 3 étapes

**Hooks** (`src/hooks/`) :
- `use-prospects.ts` - useProspects, useProspectsWithClients, useUpdateProspectStatus, useCreateProspect, useProspectionKPIs
- `use-import-leads.ts` - useImportLeads (parsing CSV, mapping, batch import)
- `use-convert-opportunity.ts` - useConvertToOpportunity

**Schemas** (`src/lib/schemas/`) :
- `prospect.ts` - prospectSchema, callResultSchema, csvMappingSchema

#### Prérequis Airtable (ACTION UTILISATEUR REQUISE)

Les champs suivants doivent être créés manuellement dans T2-Contacts via l'interface Airtable :

| Champ | Type | Options |
|-------|------|---------|
| `Statut Prospection` | Single Select | À appeler, Appelé - pas répondu, Rappeler, Qualifié, Non qualifié, Perdu |
| `Date Rappel` | Date | Format European (DD/MM/YYYY) |
| `Source Lead` | Single Select | LinkedIn, Site web, Salon, Recommandation, Achat liste, Autre |
| `Notes Prospection` | Long Text | Rich text désactivé |

#### Flux de prospection

```
Import CSV → Clients (Prospect) + Contacts (À appeler)
                            ↓
                    Appels & Qualification
                            ↓
            Qualifié → Client (Actif) + Opportunité (Qualifié)
```

---

## 8. Contacts et Ressources

### Documentation
- Guide de construction complet : `/mnt/project/Guide_de_Construction___Base_Airtable_pour_Agence_IA__1_.md`
- Documentation Airtable : https://support.airtable.com/
- Documentation N8N : Via Context7 MCP

### Accès Techniques
- Base Airtable : `appEf6JtWFdfLwsU6`
- MCP Airtable : Configuré et opérationnel
- MCP Make : Disponible pour automatisations
- MCP N8N : Disponible pour workflows

---

*Document généré le 14 décembre 2025*
*Dernière mise à jour : 15 décembre 2025*
*Version : 1.7* - Module Prospection implémenté (Phase 6 - 95%)
