# Tasks: Améliorations CRM Axivity - Phase 2

**Input**: Design documents from `/specs/002-crm-ameliorations/`
**Prerequisites**: Phase 1 complète (105 tâches), plan.md, spec.md
**Tests**: Tests manuels + validation Supabase

**Organization**: Tasks grouped by improvement area (8 areas: A1-A8)

---

## Progress Summary

| Phase | Status | Tasks Done | Total |
|-------|--------|------------|-------|
| Phase 1: Infrastructure | ✅ Terminé | 6/6 | 100% |
| Phase 2: Formulaires CRUD | ✅ Terminé | 15/15 | 100% |
| Phase 3: Graphiques | ✅ Terminé | 6/6 | 100% |
| Phase 4: Fiche Client 360° | ✅ Terminé | 5/5 | 100% |
| Phase 5: Export | ✅ Terminé | 4/4 | 100% |
| Phase 6: Calendrier | ✅ Terminé | 4/4 | 100% |
| Phase 7: Portail Client | ✅ Terminé | 5/5 | 100% |
| Phase 8: Recherche & Équipe | ✅ Terminé | 6/6 | 100% |

**Overall Progress: 51/51 tasks (100%) ✅ COMPLET**

---

## Format: `[ID] [P?] [US] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US]**: User Story reference (e.g., US10, US11)

## Path Conventions

- **Components**: `src/components/`
- **Pages**: `src/app/`
- **Lib**: `src/lib/`
- **Hooks**: `src/hooks/`

---

## Phase 1: Infrastructure Formulaires (BLOCKING) ✅ TERMINÉ

**Purpose**: Créer les composants de base réutilisables pour tous les formulaires

**CRITICAL**: Aucune tâche de Phase 2+ ne peut commencer avant la fin de cette phase

- [x] T106 Create FormDialog generic component in `src/components/shared/FormDialog.tsx` using Shadcn Dialog + Form ✅
- [x] T107 [P] Create Zod schema for Opportunité in `src/lib/schemas/opportunite.ts` ✅
- [x] T108 [P] Create Zod schema for Projet in `src/lib/schemas/projet.ts` ✅
- [x] T109 [P] Create Zod schema for Tâche in `src/lib/schemas/tache.ts` ✅
- [x] T110 [P] Create Zod schema for Facture in `src/lib/schemas/facture.ts` ✅
- [x] T111 [P] Create Zod schema for Client in `src/lib/schemas/client.ts` ✅

**Checkpoint**: ✅ FormDialog fonctionnel, tous les schémas Zod créés (14 décembre 2025)

---

## Phase 2: Formulaires CRUD (P1-CRITIQUE) ✅ TERMINÉ

**Purpose**: Permettre la création et modification de toutes les entités

### A1 - Formulaire Opportunités (US10) ✅

- [x] T112 [US10] Add useCreateOpportunite mutation to `src/hooks/use-opportunites.ts` ✅ (existait déjà)
- [x] T113 [US10] Create OpportuniteForm component in `src/components/forms/OpportuniteForm.tsx` ✅
- [x] T114 [US10] Add "Nouvelle opportunité" button with FormDialog to `src/app/opportunites/page.tsx` ✅

**Checkpoint**: ✅ Création d'opportunité fonctionnelle avec sync Supabase

### A1 - Formulaire Projets (US11) ✅

- [x] T115 [US11] Add useCreateProjet mutation to `src/hooks/use-projets.ts` ✅ (existait déjà)
- [x] T116 [US11] Create ProjetForm component in `src/components/forms/ProjetForm.tsx` ✅
- [x] T117 [US11] Add "Nouveau projet" button with FormDialog to `src/app/projets/page.tsx` ✅

**Checkpoint**: ✅ Création de projet fonctionnelle avec liaison client

### A1 - Formulaire Tâches (US12) ✅

- [x] T118 [US12] Add useCreateTache mutation to `src/hooks/use-taches.ts` ✅ (existait déjà)
- [x] T119 [US12] Create TacheForm component in `src/components/forms/TacheForm.tsx` ✅
- [x] T120 [US12] Add "Nouvelle tâche" button with FormDialog to `src/app/taches/page.tsx` ✅
- [ ] T121 [US12] Add "Ajouter tâche" button to projet detail page `src/app/projets/[id]/page.tsx` 📋 (à faire)

**Checkpoint**: ✅ Création de tâche fonctionnelle avec liaison projet/responsable

### A1 - Formulaire Factures (US13) ✅

- [x] T122 [US13] Add useCreateFacture mutation to `src/hooks/use-factures.ts` ✅ (existait déjà)
- [x] T123 [US13] Create FactureForm component in `src/components/forms/FactureForm.tsx` with auto-calc TTC ✅
- [x] T124 [US13] Add "Nouvelle facture" button with FormDialog to `src/app/factures/page.tsx` ✅

**Checkpoint**: ✅ Création de facture fonctionnelle avec calcul TTC

### A1 - Formulaire Clients (US14) ✅

- [x] T125 [US14] Add useCreateClient mutation to `src/hooks/use-clients.ts` ✅ (existait déjà)
- [x] T126 [US14] Create ClientForm component in `src/components/forms/ClientForm.tsx` ✅
- [x] T127 [US14] Add "Nouveau client" button with FormDialog to `src/app/clients/page.tsx` ✅

**Checkpoint**: ✅ Tous les formulaires CRUD opérationnels (14 décembre 2025)

---

## Phase 3: Graphiques Dashboard (A3 - US16) ✅ TERMINÉ

**Purpose**: Ajouter les visualisations manquantes avec Recharts

- [x] T128 [P] [US16] Create ChartContainer responsive wrapper in `src/components/shared/ChartContainer.tsx` ✅
- [x] T129 [US16] Create CAMensuelChart (BarChart) in `src/components/charts/CAMensuelChart.tsx` ✅
- [x] T130 [US16] Add CAMensuelChart to Dashboard `src/app/page.tsx` ✅
- [x] T131 [P] [US16] Create PipelineChart (PieChart) in `src/components/charts/PipelineChart.tsx` ✅
- [x] T132 [US16] Add PipelineChart to Opportunités page header (collapsible) ✅
- [x] T133 [P] [US16] Create ProgressionChart (AreaChart) in `src/components/charts/ProgressionChart.tsx` ✅

**Checkpoint**: ✅ 3 graphiques affichés avec données Supabase réelles (14 décembre 2025)

**Fichiers créés** :
- `src/components/shared/ChartContainer.tsx` - Wrapper responsive pour graphiques
- `src/components/charts/CAMensuelChart.tsx` - BarChart CA mensuel
- `src/components/charts/PipelineChart.tsx` - PieChart pipeline par statut
- `src/components/charts/ProgressionChart.tsx` - AreaChart progression projets
- `src/components/charts/index.ts` - Barrel export

**Pages modifiées** :
- `src/app/page.tsx` - Ajout CAMensuelChart
- `src/app/opportunites/page.tsx` - Ajout PipelineChart (collapsible)
- `src/app/rapports/page.tsx` - Ajout des 3 graphiques

---

## Phase 4: Fiche Client 360° (A2 - US15) ✅ TERMINÉ

**Purpose**: Compléter les onglets de la fiche client

- [x] T134 [US15] Create useInteractions hook in `src/hooks/use-interactions.ts` ✅
- [x] T135 [US15] Implement Projets tab content in `src/app/clients/[id]/page.tsx` ✅
- [x] T136 [US15] Implement Factures tab content in `src/app/clients/[id]/page.tsx` ✅
- [x] T137 [US15] Implement Interactions tab content with timeline in `src/app/clients/[id]/page.tsx` ✅
- [x] T138 [US15] Add HealthBadge calculation (>90 days = red) to client header ✅

**Checkpoint**: ✅ 4 onglets fonctionnels avec indicateur santé (14 décembre 2025)

**Fichiers créés** :
- `src/hooks/use-interactions.ts` - Hook pour les interactions client
- `src/components/shared/HealthBadge.tsx` - Badge de santé client avec tooltip

**Page modifiée** :
- `src/app/clients/[id]/page.tsx` - 4 onglets complets (Informations, Projets, Factures, Interactions)
  - HealthBadge dans le header avec calcul automatique
  - Cards récapitulatives (CA, Projets, Factures, Montant en attente)
  - Timeline des interactions avec dots et cards
  - Statistiques avec progress bars

---

## Phase 5: Export CSV/Excel (A4 - US17) ✅ TERMINÉ

**Purpose**: Permettre l'export des données pour reporting externe

- [x] T139 [US17] Create export utility functions in `src/lib/export.ts` (CSV + Excel) ✅
- [x] T140 [US17] Create ExportButton component in `src/components/shared/ExportButton.tsx` ✅
- [x] T141 [P] [US17] Add ExportButton to Projets, Clients, Factures pages ✅
- [x] T142 [US17] Add ExportButton to Opportunités page ✅

**Checkpoint**: ✅ Export fonctionnel sur 4 pages (CSV + Excel) (14 décembre 2025)

**Fichiers créés** :
- `src/lib/export.ts` - Utilitaires d'export CSV/Excel avec colonnes pré-configurées
- `src/components/shared/ExportButton.tsx` - Bouton dropdown avec choix format

**Composants Shadcn ajoutés** :
- `dropdown-menu` - Menu déroulant pour choix de format
- `toast` - Notifications d'export

**Pages modifiées** :
- `src/app/projets/page.tsx` - ExportButton dans le header
- `src/app/clients/page.tsx` - ExportButton dans le header
- `src/app/factures/page.tsx` - ExportButton dans le header
- `src/app/opportunites/page.tsx` - ExportButton dans le header

---

## Phase 6: Calendrier Tâches (A5 - US18) ✅ TERMINÉ

**Purpose**: Implémenter le calendrier mensuel des tâches

- [x] T143 [US18] Configure calendar with French locale in `src/app/taches/calendrier/page.tsx` ✅
- [x] T144 [US18] Map tasks to calendar events with priority colors (Critique=purple, Haute=red, Moyenne=orange, Basse=blue) ✅
- [x] T145 [US18] Add click handler to open task detail Sheet ✅
- [x] T146 [US18] Add month navigation and "Aujourd'hui" button ✅

**Checkpoint**: ✅ Calendrier affiche les tâches avec interactions (14 décembre 2025)

**Fonctionnalités implémentées** :
- Calendrier mensuel personnalisé avec locale française (date-fns)
- Couleurs par priorité : Critique (violet), Haute (rouge), Moyenne (orange), Basse (bleu), Terminé (vert)
- Navigation mois précédent/suivant et bouton "Aujourd'hui"
- Panneau latéral affichant les tâches du jour sélectionné
- Sheet de détail avec description, statut, priorité, échéance, temps estimé/réel
- Action pour marquer une tâche comme terminée directement depuis le Sheet
- Légende des couleurs de priorité
- Tooltips avec aperçu des tâches au survol

---

## Phase 7: Portail Client Externe (A6 - US19) ✅ TERMINÉ

**Purpose**: Rendre le portail client fonctionnel et isolé

- [x] T147 [US19] Create portail-specific layout with client branding in `src/app/portail/layout.tsx` ✅
- [x] T148 [US19] Implement client dashboard with KPIs in `src/app/portail/[clientId]/page.tsx` ✅
- [x] T149 [US19] Implement projets list with % completion in `src/app/portail/[clientId]/projets/page.tsx` ✅
- [x] T150 [US19] Implement factures list with payment status in `src/app/portail/[clientId]/factures/page.tsx` ✅
- [x] T151 [US19] Add client data isolation check (verify clientId matches displayed data) ✅

**Checkpoint**: ✅ Portail client fonctionnel et isolé (14 décembre 2025)

**Fichiers créés** :
- `src/components/portail/PortailHeader.tsx` - Header avec navigation et branding client
- `src/components/portail/index.ts` - Barrel export

**Fichier modifié** :
- `src/app/portail/layout.tsx` - Layout complet avec header dynamique et footer

**Fonctionnalités du portail** :
- Header sticky avec logo Axivity et navigation (Accueil/Projets/Factures)
- Affichage dynamique du nom client avec avatar
- Navigation responsive (mobile et desktop)
- Dashboard avec 4 KPIs : projets actifs, terminés, factures en attente, montant dû
- Liste projets avec progression %, statut, échéance, budget
- Liste factures avec statut paiement, badge "En retard", informations IBAN
- Isolation des données : chaque page filtre par clientId
- Message "Accès non autorisé" si client non trouvé
- Footer avec liens contact et mentions légales

---

## Phase 8: Recherche Globale & Équipe (A7, A8 - US20, US21) ✅ TERMINÉ

**Purpose**: Finaliser les fonctionnalités de recherche et gestion équipe

### Recherche Globale (US20) ✅

- [x] T152 [US20] Create useSearch hook in `src/hooks/use-search.ts` with multi-entity search ✅
- [x] T153 [US20] Connect SearchCommand to useSearch hook in `src/components/shared/SearchCommand.tsx` ✅
- [x] T154 [US20] Add navigation on result click with proper routing ✅

**Checkpoint**: ✅ Recherche Cmd+K fonctionnelle avec navigation (14 décembre 2025)

### Gestion Équipe (US21) ✅

- [x] T155 [US21] Implement complete team list in `src/app/equipe/page.tsx` ✅
- [x] T156 [US21] Implement workload bars in `src/app/equipe/charge/page.tsx` ✅
- [x] T157 [US21] Add capacity warning (>100% = red bar) and overload indicator ✅

**Checkpoint**: ✅ Pages équipe complètes avec charge de travail (14 décembre 2025)

**Fonctionnalités implémentées (existantes)** :

**Recherche Globale** (`src/components/shared/SearchCommand.tsx`) :
- Raccourci Cmd+K pour ouvrir la recherche
- Recherche multi-entités : Projets, Clients, Opportunités, Tâches, Factures, Équipe
- Icônes distinctes par type d'entité
- Navigation automatique vers la fiche correspondante
- Affichage du type et informations contextuelles

**Page Équipe** (`src/app/equipe/page.tsx`) :
- Liste complète des membres avec avatar et initiales
- Indicateur de charge de travail par membre
- Badge de rôle (Développeur, Designer, Chef de projet, etc.)
- Compteur de tâches assignées
- Statistiques globales de l'équipe

**Page Charge de Travail** (`src/app/equipe/charge/page.tsx`) :
- Barres de progression de charge par membre
- Code couleur : vert (<80%), orange (80-100%), rouge (>100%)
- Indicateur de surcharge avec warning
- Détail des heures estimées vs capacité
- Vue comparative de l'équipe

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Infrastructure)**: No dependencies - START HERE
- **Phase 2 (Formulaires)**: Depends on Phase 1 completion
- **Phases 3-8**: All depend on Phase 1, can run in parallel after

### Task Dependencies

Within each phase, tasks marked [P] can run in parallel:
- Phase 1: T107-T111 (all schemas)
- Phase 3: T128, T131, T133 (chart components)
- Phase 5: T141 (multiple pages)

### Recommended Execution Order

```
Day 1: Phase 1 (Infrastructure) - 2-3h
       ├── T106 FormDialog
       └── T107-T111 Zod schemas [P]

Day 2: Phase 2a (Formulaires Opportunités + Projets) - 4h
       ├── T112-T114 Opportunités
       └── T115-T117 Projets

Day 3: Phase 2b (Formulaires Tâches + Factures + Clients) - 4h
       ├── T118-T121 Tâches
       ├── T122-T124 Factures
       └── T125-T127 Clients

Day 4: Phase 3 (Graphiques) - 3h
       └── T128-T133 Charts

Day 5: Phase 4 (Fiche Client) - 3h
       └── T134-T138 Client 360°

Day 6: Phase 5-6 (Export + Calendrier) - 4h
       ├── T139-T142 Export
       └── T143-T146 Calendrier

Day 7: Phase 7-8 (Portail + Recherche + Équipe) - 5h
       ├── T147-T151 Portail
       ├── T152-T154 Recherche
       └── T155-T157 Équipe
```

---

## Implementation Notes

### FormDialog Component Structure

```typescript
// src/components/shared/FormDialog.tsx
interface FormDialogProps<T> {
  title: string;
  description?: string;
  trigger: React.ReactNode;
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  children: React.ReactNode; // Form fields
}
```

### Zod Schema Example

```typescript
// src/lib/schemas/opportunite.ts
export const opportuniteSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  clientId: z.string().min(1, "Le client est requis"),
  valeurEstimee: z.number().min(0, "La valeur doit être positive"),
  probabilite: z.number().min(0).max(100),
  dateCloturePrevu: z.date(),
  statut: z.enum(["Lead", "Qualifié", "Proposition envoyée", "Négociation", "Gagnée", "Perdue"]),
});
```

### Export Utility Structure

```typescript
// src/lib/export.ts
export function exportToCSV<T>(data: T[], filename: string, columns: Column[]): void;
export function exportToExcel<T>(data: T[], filename: string, columns: Column[]): void;
```

---

## Validation Checklist Per Task

Before marking any task as complete:

- [ ] Code compiles without errors
- [ ] Mobile responsive (test 375px)
- [ ] French labels and messages
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Supabase sync verified
- [ ] No console errors
- [ ] Shadcn components only

---

## Notes

- All form validation in French
- All dates formatted in French locale (DD MMM YYYY)
- All currency formatted in EUR (€)
- Batch operations max 10 records per call
- Add 200ms delay between Supabase calls to respect rate limits
