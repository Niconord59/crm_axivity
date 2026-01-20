# Feature Specification: Refactorisation et Scalabilite

**Feature Branch**: `007-refactorisation`
**Created**: 2025-12-24
**Updated**: 2025-12-24
**Status**: Planned (0%)
**Priority**: P1 - Haute

---

## Contexte

### Analyse de la Codebase

Apres audit de **183 fichiers TypeScript** (~7,162 lignes de code), la codebase obtient un score de **7.5/10**. Elle est prete pour la production mais necessite des ajustements pour garantir une scalabilite optimale.

| Aspect | Score | Evaluation |
|--------|-------|------------|
| Architecture globale | 8/10 | Excellente separation des concerns |
| Type Safety | 9/10 | TypeScript strict, minimal `any` |
| Data Layer | 9/10 | React Query bien implemente |
| Organisation composants | 7/10 | Bonne, quelques composants trop volumineux |
| Couverture tests | 0/10 | **Aucun test** - Point critique |
| Duplication code | 6/10 | Patterns repetitifs identifiables |
| Gestion erreurs | 6/10 | Inconsistante, a standardiser |

### Problemes Identifies

1. **CRITIQUE** : Aucun test (0 fichiers test, pas de framework)
2. **HAUTE** : Duplication des enums entre `types/` et `schemas/`
3. **HAUTE** : `OpportunityMiniSheet.tsx` = 402 lignes (trop volumineux)
4. **MOYENNE** : Query keys hardcodees en strings
5. **MOYENNE** : Mappers dupliques dans chaque hook
6. **MOYENNE** : Gestion d'erreurs API inconsistante
7. **BASSE** : Pas d'optimistic updates
8. **BASSE** : Pas de React.memo sur composants lourds

### Solution Proposee

Refactorisation incrementale en 5 phases :

1. **Phase 1** : Tests (filet de securite)
2. **Phase 2** : Centralisation (enums, query keys, mappers)
3. **Phase 3** : Refactoring composants
4. **Phase 4** : Standardisation erreurs
5. **Phase 5** : Optimisations performance

---

## Architecture Cible

### Structure des Fichiers (Apres Refactorisation)

```
src/
+-- app/                          # Inchange
+-- components/
|   +-- ui/                       # Inchange (Shadcn)
|   +-- layout/                   # Inchange
|   +-- forms/                    # Inchange
|   +-- shared/                   # Inchange
|   +-- opportunites/
|   |   +-- OpportunityCard.tsx
|   |   +-- OpportunityMiniSheet.tsx  # Refactorise (< 100 lignes)
|   |   +-- tabs/
|   |   |   +-- OpportunityInfoTab.tsx
|   |   |   +-- OpportunityHistoryTab.tsx
|   |   +-- widgets/
|   |       +-- AmountSelector.tsx
|   |       +-- ProbabilitySlider.tsx
|   |       +-- ManualNoteForm.tsx
|   |       +-- InteractionTimeline.tsx
+-- hooks/                        # Refactorise (utilise mappers centralises)
+-- lib/
|   +-- errors.ts                 # NOUVEAU - Types d'erreurs
|   +-- api-error-handler.ts      # NOUVEAU - Handler erreurs API
|   +-- queryKeys.ts              # NOUVEAU - Factory query keys
|   +-- mappers/                  # NOUVEAU - Mappers centralises
|   |   +-- index.ts
|   |   +-- base.mapper.ts
|   |   +-- client.mapper.ts
|   |   +-- projet.mapper.ts
|   |   +-- opportunite.mapper.ts
|   |   +-- ...
|   +-- schemas/                  # Refactorise (importe depuis types/)
|   +-- services/                 # Inchange
|   +-- templates/                # Inchange
+-- test/                         # NOUVEAU - Configuration tests
|   +-- setup.ts
|   +-- utils.ts
+-- types/
|   +-- index.ts                  # Inchange
|   +-- constants.ts              # NOUVEAU - Single source of truth enums
```

### Query Keys Factory

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  clients: {
    all: ["clients"] as const,
    list: (filters?: ClientFilters) => ["clients", filters] as const,
    detail: (id: string) => ["client", id] as const,
  },
  opportunites: {
    all: ["opportunites"] as const,
    list: (filters?: OpportuniteFilters) => ["opportunites", filters] as const,
    detail: (id: string) => ["opportunite", id] as const,
    byClient: (clientId: string) => ["opportunites", "client", clientId] as const,
  },
  projets: {
    all: ["projets"] as const,
    list: (filters?: ProjetFilters) => ["projets", filters] as const,
    detail: (id: string) => ["projet", id] as const,
    byClient: (clientId: string) => ["projets", "client", clientId] as const,
  },
  taches: {
    all: ["taches"] as const,
    list: (filters?: TacheFilters) => ["taches", filters] as const,
    detail: (id: string) => ["tache", id] as const,
    byProjet: (projetId: string) => ["taches", "projet", projetId] as const,
    byMembre: (membreId: string) => ["taches", "membre", membreId] as const,
  },
  factures: {
    all: ["factures"] as const,
    list: (filters?: FactureFilters) => ["factures", filters] as const,
    detail: (id: string) => ["facture", id] as const,
  },
  interactions: {
    all: ["interactions"] as const,
    byContact: (contactId: string) => ["interactions", "contact", contactId] as const,
  },
  devis: {
    all: ["devis"] as const,
    byOpportunite: (opportuniteId: string) => ["devis", "opportunite", opportuniteId] as const,
  },
  services: {
    all: ["services"] as const,
  },
  lignesDevis: {
    byOpportunite: (opportuniteId: string) => ["lignes-devis", opportuniteId] as const,
  },
  prospects: {
    all: ["prospects"] as const,
    kpis: ["prospects-kpis"] as const,
  },
  equipe: {
    all: ["equipe"] as const,
  },
} as const;
```

### Types d'Erreurs Standardises

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}
```

---

## User Stories

### US-001: Tests Unitaires (P1-CRITIQUE)

**En tant que** developpeur
**Je veux** avoir des tests unitaires sur les utilitaires et hooks
**Afin de** prevenir les regressions lors des evolutions

#### Acceptance Criteria

1. **Given** Vitest installe, **When** je lance `npm test`, **Then** les tests s'executent
2. **Given** `lib/utils.ts`, **When** je teste `formatCurrency()`, **Then** les formats sont corrects
3. **Given** `hooks/use-clients.ts`, **When** je teste avec mock Supabase, **Then** les mappers fonctionnent
4. **Given** tous les tests, **When** je verifie la couverture, **Then** elle est > 60%

### US-002: Centralisation Enums (P1)

**En tant que** developpeur
**Je veux** avoir une source unique pour les enums de statuts
**Afin de** eviter les desynchronisations

#### Acceptance Criteria

1. **Given** `types/constants.ts`, **Then** tous les enums y sont definis
2. **Given** les schemas Zod, **Then** ils importent depuis `types/constants.ts`
3. **Given** une recherche globale, **Then** aucune duplication de definitions

### US-003: Query Keys Factory (P1)

**En tant que** developpeur
**Je veux** des query keys centralisees et typees
**Afin de** eviter les typos et faciliter l'invalidation

#### Acceptance Criteria

1. **Given** `lib/queryKeys.ts`, **Then** toutes les entites ont leurs keys
2. **Given** les hooks, **Then** ils utilisent la factory
3. **Given** TypeScript, **Then** les keys sont typees avec `as const`

### US-004: Decomposition OpportunityMiniSheet (P2)

**En tant que** developpeur
**Je veux** decomposer le composant en sous-composants
**Afin de** faciliter la maintenance et les tests

#### Acceptance Criteria

1. **Given** `OpportunityMiniSheet.tsx`, **Then** il fait < 100 lignes
2. **Given** les sous-composants extraits, **Then** chacun a une responsabilite unique
3. **Given** le comportement utilisateur, **Then** il reste identique

### US-005: Gestion Erreurs API (P2)

**En tant que** developpeur
**Je veux** une gestion d'erreurs standardisee
**Afin de** faciliter le debug et ameliorer l'UX

#### Acceptance Criteria

1. **Given** `lib/errors.ts`, **Then** les types d'erreurs sont definis
2. **Given** les API routes, **Then** elles utilisent `handleApiError()`
3. **Given** une erreur, **Then** le client recoit un JSON structure

---

## Dependances

### Nouvelles Dependances (dev)

| Package | Version | Usage |
|---------|---------|-------|
| `vitest` | ^1.x | Framework de test |
| `@vitejs/plugin-react` | ^4.x | Plugin React pour Vitest |
| `jsdom` | ^24.x | Environnement DOM pour tests |
| `@testing-library/react` | ^15.x | Tests composants React |
| `@testing-library/jest-dom` | ^6.x | Matchers DOM |
| `@testing-library/user-event` | ^14.x | Simulation interactions |
| `msw` | ^2.x | Mock Service Worker (API mocks) |

### Fichiers de Configuration

| Fichier | Description |
|---------|-------------|
| `vitest.config.ts` | Configuration Vitest |
| `src/test/setup.ts` | Setup global tests |
| `src/test/utils.ts` | Utilitaires de test |
| `src/test/mocks/handlers.ts` | MSW handlers |

---

## Metriques de Succes

| Metrique | Actuel | Cible |
|----------|--------|-------|
| Couverture tests | 0% | > 60% |
| Fichiers avec duplication enums | ~15 | 0 |
| Composants > 300 lignes | 2 | 0 |
| Query keys centralisees | 0% | 100% |
| API routes avec handler erreurs | 0% | 100% |

---

## Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Regressions pendant refactoring | Eleve | Tests avant refactoring |
| Breaking changes query keys | Moyen | Migration progressive |
| Temps de developpement | Moyen | Phases incrementales |

---

## Tests Manuels

### Scenario 1 : Verification non-regression

1. Creer une opportunite dans le pipeline
2. Ouvrir le MiniSheet, modifier montant et probabilite
3. Ajouter une note manuelle
4. Verifier que l'historique affiche les interactions
5. Generer un devis
6. **Resultat attendu** : Comportement identique a l'actuel

### Scenario 2 : Tests automatises

1. Executer `npm test`
2. Verifier que tous les tests passent
3. Executer `npm run test:coverage`
4. Verifier que la couverture > 60%

---

*Specification creee le 24 decembre 2025*
