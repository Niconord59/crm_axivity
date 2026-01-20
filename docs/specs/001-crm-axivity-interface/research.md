# Research: Interface Web CRM Axivity

**Feature**: 001-crm-axivity-interface
**Date**: 2025-12-14

## 1. Framework Frontend

### Decision: Next.js 14 avec App Router

**Rationale**:
- App Router est le standard moderne Next.js avec Server Components
- Routing basé sur les dossiers simplifie l'architecture des pages
- Layouts imbriqués permettent le layout dashboard avec sidebar
- Support natif TypeScript
- Hot reload rapide pour le développement

**Alternatives considérées**:
- **Vite + React Router**: Plus léger mais nécessite plus de configuration manuelle
- **Create React App**: Déprécié, ne supporte pas les Server Components
- **Remix**: Excellent mais moins de composants Shadcn prêts à l'emploi

## 2. Bibliothèque Drag-and-Drop

### Decision: @hello-pangea/dnd

**Rationale**:
- Fork maintenu de react-beautiful-dnd (abandonné par Atlassian)
- API déclarative simple (DragDropContext, Droppable, Draggable)
- Support excellent des Kanban boards
- Animations fluides incluses
- Accessible (clavier et screen reader)

**Alternatives considérées**:
- **dnd-kit**: Plus moderne mais API plus complexe pour un Kanban simple
- **react-dnd**: Bas niveau, nécessite beaucoup de code custom
- **react-beautiful-dnd**: Abandonné, bugs non corrigés

## 3. Client API Supabase

### Decision: Fetch natif avec wrapper TypeScript custom

**Rationale**:
- SDK officiel Supabase.js trop lourd (inclut Node.js dependencies)
- Fetch natif suffit pour REST API simple
- Wrapper custom permet typage TypeScript strict
- Contrôle total sur les retries et error handling
- Pas de dépendance externe supplémentaire

**Alternatives considérées**:
- **supabase.js**: SDK officiel mais conçu pour Node.js, bundles inutiles
- **axios**: Overkill pour des requêtes simples, ajoute une dépendance

### Pattern recommandé:

```typescript
// lib/supabase.ts
const SUPABASE_URL = 'https://supabase.axivity.cloud';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

async function fetchTable<T>(tableId: string, options?: RequestInit): Promise<T[]> {
  const response = await fetch(
    `https://api.supabase.com/v0/${SUPABASE_URL}/${tableId}`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      ...options,
    }
  );
  if (!response.ok) throw new SupabaseError(response);
  const data = await response.json();
  return data.records;
}
```

## 4. Gestion d'État

### Decision: React Query (TanStack Query) + Context API

**Rationale**:
- React Query gère automatiquement le cache, refetch, loading states
- Parfait pour les données serveur (Supabase)
- Mutations optimistes pour UX fluide (drag-drop)
- Context API suffit pour l'état UI local (sidebar ouverte, filtres actifs)
- Évite la complexité de Redux pour une app de cette taille

**Alternatives considérées**:
- **Redux Toolkit**: Trop complexe pour des données principalement serveur
- **Zustand**: Bon mais React Query couvre 90% des besoins
- **SWR**: Similaire à React Query mais moins de features

## 5. Graphiques et Visualisations

### Decision: Recharts

**Rationale**:
- Bibliothèque React native la plus populaire
- Composants déclaratifs (LineChart, BarChart, PieChart)
- Responsive par défaut
- Bonne documentation et communauté active
- Intégration facile avec Tailwind pour le styling

**Alternatives considérées**:
- **Chart.js + react-chartjs-2**: Bon mais moins "React native"
- **Victory**: API plus complexe
- **Nivo**: Très beau mais bundle plus lourd

## 6. Calendrier

### Decision: Shadcn Calendar + react-big-calendar

**Rationale**:
- Shadcn Calendar pour les date pickers simples
- react-big-calendar pour la vue calendrier des tâches (mois/semaine)
- Les deux s'intègrent bien avec Tailwind
- Support des événements drag-and-drop

**Alternatives considérées**:
- **FullCalendar**: Très complet mais licence commerciale pour certaines features
- **@schedule-x/react**: Plus récent, moins testé en production

## 7. Authentification

### Decision: Hors scope initial (assumption de la spec)

**Rationale**:
- La spec indique que l'authentification est gérée séparément
- Le portail client nécessitera une solution d'auth basique
- Recommandation pour le futur: NextAuth.js ou Clerk

## 8. Internationalisation

### Decision: Pas de bibliothèque i18n - textes en dur en français

**Rationale**:
- Application 100% francophone selon la spec
- Évite la complexité d'une bibliothèque i18n
- Les textes sont définis dans les composants directement

## 9. Composants Shadcn requis

### Decision: Liste des composants à installer

```bash
npx shadcn@latest add button card input select checkbox
npx shadcn@latest add table badge avatar progress skeleton
npx shadcn@latest add dialog alert-dialog sheet tabs
npx shadcn@latest add toast tooltip dropdown-menu
npx shadcn@latest add command breadcrumb calendar
npx shadcn@latest add form textarea separator scroll-area
npx shadcn@latest add navigation-menu toggle switch
```

**Rationale**:
- Tous les composants listés dans la Constitution (Principe II)
- Installation via CLI Shadcn pour code source local modifiable

## 10. Structure des Hooks API

### Decision: Un hook par domaine métier

**Rationale**:
- Séparation claire des responsabilités
- Réutilisabilité dans différentes pages
- Facilite les tests unitaires
- Pattern cohérent avec React Query

**Hooks prévus**:
- `useProjects()`: CRUD projets + calculs KPI
- `useTasks()`: CRUD tâches + filtres
- `useOpportunities()`: CRUD opportunités + mutations drag-drop
- `useClients()`: CRUD clients + contacts
- `useInvoices()`: CRUD factures + calculs relances
- `useTeam()`: Liste équipe + charge de travail
- `useDashboard()`: Agrégation KPIs dashboard

## 11. Gestion des Erreurs API

### Decision: Error Boundary + Toast notifications

**Rationale**:
- Error Boundary React pour les erreurs fatales
- Toast Shadcn pour les erreurs récupérables
- Messages en français, conviviaux, avec action de retry
- Logging côté client pour debugging

**Pattern**:
```typescript
// Erreur réseau -> Toast avec retry
// Erreur 401 -> Redirect login
// Erreur 429 (rate limit) -> Toast avec countdown
// Erreur 500 -> Error Boundary
```

## 12. Performance et Rate Limits Supabase

### Decision: Batching + Debouncing

**Rationale**:
- Supabase limite à 5 requêtes/seconde
- Batch les lectures lors du chargement initial
- Debounce les recherches (300ms)
- Optimistic updates pour les mutations fréquentes

**Stratégies**:
- Dashboard: 1 requête batch pour les 4 KPIs
- Kanban: Prefetch des colonnes adjacentes
- Recherche: Debounce 300ms

## Résumé des Dépendances

| Catégorie | Package | Version |
|-----------|---------|---------|
| Framework | next | 14.x |
| UI | @shadcn/ui | latest |
| Styling | tailwindcss | 3.x |
| State | @tanstack/react-query | 5.x |
| Drag & Drop | @hello-pangea/dnd | 16.x |
| Charts | recharts | 2.x |
| Calendar | react-big-calendar | 1.x |
| Forms | react-hook-form + zod | latest |
| Utils | date-fns | 3.x |
| Testing | vitest, @testing-library/react, playwright | latest |
