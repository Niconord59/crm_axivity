# Plan d'Implementation : Refactorisation et Scalabilite

**Feature** : 007-refactorisation
**Date** : 2025-12-24
**Duree estimee** : ~42 heures (5-6 semaines a temps partiel)

---

## Vue d'Ensemble

```
┌──────────────────────────────────────────────────────────────────┐
│                    PLAN DE REFACTORISATION                       │
├──────────────────────────────────────────────────────────────────┤
│  Phase 1: Tests (Semaine 1-2)                                    │
│  ├── Installation Vitest + Testing Library                       │
│  ├── Configuration et setup                                      │
│  ├── Tests unitaires utils/export                                │
│  └── Tests hooks + composants                                    │
├──────────────────────────────────────────────────────────────────┤
│  Phase 2: Centralisation (Semaine 2-3)                           │
│  ├── types/constants.ts (enums)                                  │
│  ├── lib/queryKeys.ts (factory)                                  │
│  └── lib/mappers/ (extraction)                                   │
├──────────────────────────────────────────────────────────────────┤
│  Phase 3: Refactoring Composants (Semaine 3-4)                   │
│  ├── Extraction widgets                                          │
│  ├── Decomposition OpportunityMiniSheet                          │
│  └── Tests composants extraits                                   │
├──────────────────────────────────────────────────────────────────┤
│  Phase 4: Gestion Erreurs (Semaine 4)                            │
│  ├── Types d'erreurs standardises                                │
│  ├── Handler API centralise                                      │
│  └── Migration routes API                                        │
├──────────────────────────────────────────────────────────────────┤
│  Phase 5: Optimisations (Semaine 5)                              │
│  ├── React.memo composants lourds                                │
│  ├── Optimistic updates mutations                                │
│  └── Pool Puppeteer PDF                                          │
├──────────────────────────────────────────────────────────────────┤
│  Phase 6: Documentation (Semaine 5-6)                            │
│  └── CLAUDE.md + docs/TESTING.md                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 : Tests (12h)

### Objectif

Etablir un filet de securite avant toute modification de code existant.

### Diagramme de Flux

```
                    ┌─────────────────┐
                    │   npm install   │
                    │  vitest + deps  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ vitest.config   │
                    │    + setup      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │   Utils    │  │   Hooks    │  │ Components │
     │   Tests    │  │   Tests    │  │   Tests    │
     └────────────┘  └────────────┘  └────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Coverage     │
                    │     > 60%       │
                    └─────────────────┘
```

### Fichiers a Creer

| Fichier | Description | Priorite |
|---------|-------------|----------|
| `vitest.config.ts` | Configuration Vitest avec jsdom | P1 |
| `src/test/setup.ts` | Imports globaux, cleanup | P1 |
| `src/test/utils.tsx` | Wrapper render avec providers | P1 |
| `src/test/mocks/supabase.ts` | Mock client Supabase | P1 |
| `src/lib/__tests__/utils.test.ts` | Tests formatters | P1 |
| `src/lib/__tests__/export.test.ts` | Tests export CSV/Excel | P1 |
| `src/hooks/__tests__/use-clients.test.ts` | Tests hook clients | P2 |
| `src/hooks/__tests__/use-opportunites.test.ts` | Tests hook opportunites | P2 |
| `src/components/shared/__tests__/ExportButton.test.tsx` | Tests composant | P2 |

### Dependances a Installer

```bash
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  msw
```

### Scripts npm

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Criteres de Succes

- [ ] `npm test` execute sans erreur
- [ ] Couverture > 60% sur `lib/utils.ts`
- [ ] Couverture > 60% sur `lib/export.ts`
- [ ] Au moins 1 test par hook majeur
- [ ] Au moins 1 test par composant shared

---

## Phase 2 : Centralisation (8h)

### Objectif

Eliminer les duplications et creer des sources uniques de verite.

### Diagramme Avant/Apres

```
AVANT                                 APRES
─────                                 ─────

types/index.ts                        types/constants.ts
├── CLIENT_STATUSES = [...]           ├── CLIENT_STATUSES = [...] as const
└── ...                               ├── OPPORTUNITY_STATUSES = [...]
                                      └── (tous les enums)
schemas/client.ts                           │
├── CLIENT_STATUTS = [...] ← DUP!          │
└── clientSchema                            │
                                            │
                                      types/index.ts
                                      ├── import { * } from './constants'
                                      └── export interfaces
                                            │
                                      schemas/client.ts
                                      ├── import { CLIENT_STATUSES } from '@/types/constants'
                                      └── clientSchema (utilise l'import)
```

### Query Keys Factory

```
AVANT                                 APRES
─────                                 ─────

use-clients.ts                        lib/queryKeys.ts
├── queryKey: ["clients"]             ├── clients.all: ["clients"]
└── queryKey: ["client", id]          ├── clients.list(filters)
                                      └── clients.detail(id)
use-projets.ts                              │
├── queryKey: ["projets"]                   │
└── queryKey: ["projet", id]          use-clients.ts
                                      └── queryKey: queryKeys.clients.all
use-opportunites.ts
├── queryKey: ["opportunites"]        use-projets.ts
└── ...                               └── queryKey: queryKeys.projets.all
```

### Mappers Centralises

```
AVANT                                 APRES
─────                                 ─────

use-clients.ts                        lib/mappers/
├── function mapToClient() {...}      ├── base.mapper.ts
└── ...                               │   ├── parseDate()
                                      │   ├── parseNumber()
use-projets.ts                        │   └── parseLinkedIds()
├── function mapToProjet() {...}      │
└── ...                               ├── client.mapper.ts
                                      │   └── mapToClient()
use-opportunites.ts                   │
├── function mapToOpportunite()       ├── projet.mapper.ts
└── ...                               │   └── mapToProjet()
                                      │
                                      └── index.ts (barrel)

                                      use-clients.ts
                                      └── import { mapToClient } from '@/lib/mappers'
```

### Fichiers a Creer

| Fichier | Contenu |
|---------|---------|
| `src/types/constants.ts` | Tous les enums avec `as const` |
| `src/lib/queryKeys.ts` | Factory pour toutes les entites |
| `src/lib/mappers/base.mapper.ts` | Fonctions utilitaires |
| `src/lib/mappers/client.mapper.ts` | mapToClient |
| `src/lib/mappers/projet.mapper.ts` | mapToProjet |
| `src/lib/mappers/opportunite.mapper.ts` | mapToOpportunite |
| `src/lib/mappers/tache.mapper.ts` | mapToTache |
| `src/lib/mappers/facture.mapper.ts` | mapToFacture |
| `src/lib/mappers/index.ts` | Barrel export |

### Criteres de Succes

- [ ] Aucune duplication d'enum dans la codebase
- [ ] Tous les hooks utilisent `queryKeys`
- [ ] Tous les hooks utilisent les mappers centralises
- [ ] TypeScript compile sans erreur

---

## Phase 3 : Refactoring Composants (8h)

### Objectif

Decomposer `OpportunityMiniSheet.tsx` (402 lignes) en composants < 100 lignes.

### Architecture Cible

```
src/components/opportunites/
│
├── OpportunityCard.tsx                    # Inchange
├── OpportunityMiniSheet.tsx               # REFACTORISE (< 100 lignes)
│
├── tabs/
│   ├── OpportunityInfoTab.tsx             # NOUVEAU
│   │   ├── Uses AmountSelector
│   │   ├── Uses ProbabilitySlider
│   │   ├── Date picker
│   │   └── Notes textarea
│   │
│   └── OpportunityHistoryTab.tsx          # NOUVEAU
│       ├── Uses ManualNoteForm
│       └── Uses InteractionTimeline
│
└── widgets/
    ├── AmountSelector.tsx                 # NOUVEAU
    │   ├── Presets: 5k, 10k, 25k, 50k, 100k, 200k
    │   └── Increments: +1k, +5k, -1k, -5k
    │
    ├── ProbabilitySlider.tsx              # NOUVEAU
    │   ├── Slider 0-100%
    │   └── Valeur ponderee calculee
    │
    ├── ManualNoteForm.tsx                 # NOUVEAU
    │   ├── Textarea
    │   └── Button submit
    │
    └── InteractionTimeline.tsx            # NOUVEAU
        ├── Liste interactions
        ├── Icones par type
        └── Dates relatives
```

### Flux de Donnees

```
OpportunityMiniSheet
│
├── Props: opportuniteId, open, onOpenChange
│
├── State: (minimal - coordination only)
│
├── Queries:
│   ├── useOpportunite(id)
│   └── useClientInfo(clientId)
│
└── Render:
    └── Sheet
        └── Tabs
            ├── TabsContent "infos"
            │   └── OpportunityInfoTab
            │       ├── opportunity (prop)
            │       └── onUpdate (callback)
            │
            └── TabsContent "historique"
                └── OpportunityHistoryTab
                    ├── contactId (prop)
                    └── onNoteAdded (callback)
```

### Criteres de Succes

- [ ] `OpportunityMiniSheet.tsx` < 100 lignes
- [ ] Chaque widget < 80 lignes
- [ ] Chaque tab < 150 lignes
- [ ] Comportement utilisateur identique (non-regression)
- [ ] Tests pour chaque widget

---

## Phase 4 : Gestion Erreurs (6h)

### Objectif

Standardiser la gestion d'erreurs dans les API routes.

### Architecture Erreurs

```
lib/errors.ts
│
├── AppError (base)
│   ├── message: string
│   ├── code: string
│   ├── statusCode: number
│   └── details?: Record<string, unknown>
│
├── ValidationError extends AppError
│   └── statusCode: 400
│
├── NotFoundError extends AppError
│   └── statusCode: 404
│
├── UnauthorizedError extends AppError
│   └── statusCode: 401
│
└── ConflictError extends AppError
    └── statusCode: 409
```

### Handler Centralise

```typescript
// lib/api-error-handler.ts

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.statusCode }
    );
  }
  // ... fallback
}
```

### Avant/Apres API Routes

```typescript
// AVANT
export async function POST(request: NextRequest) {
  try {
    const { opportuniteId } = await request.json();
    if (!opportuniteId) {
      return NextResponse.json(
        { error: "opportuniteId is required" },
        { status: 400 }
      );
    }
    // ...
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// APRES
import { handleApiError } from '@/lib/api-error-handler';
import { ValidationError, NotFoundError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.opportuniteId) {
      throw new ValidationError('opportuniteId is required');
    }

    const opportunity = await fetchOpportunity(body.opportuniteId);
    if (!opportunity) {
      throw new NotFoundError('Opportunity', body.opportuniteId);
    }

    // ...
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Routes a Migrer

| Route | Priorite |
|-------|----------|
| `/api/devis/generate` | P1 |
| `/api/devis/preview` | P1 |
| `/api/devis/send` | P1 |
| `/api/factures/generate` | P1 |
| `/api/calendar/events` | P2 |
| `/api/email/send` | P2 |
| `/api/places/search` | P2 |

### Criteres de Succes

- [ ] Toutes les API routes utilisent `handleApiError`
- [ ] Erreurs clients (4xx) explicites et utiles
- [ ] Logs serveur avec contexte complet
- [ ] Response JSON structure consistante

---

## Phase 5 : Optimisations (5h)

### React.memo

```typescript
// Composants a memoiser
export const OpportunityCard = React.memo(function OpportunityCard({...}) {
  // ...
});

export const LeadCard = React.memo(function LeadCard({...}) {
  // ...
});

export const ProjetCard = React.memo(function ProjetCard({...}) {
  // ...
});
```

### Optimistic Updates

```typescript
// Pattern pour mutations
export function useUpdateOpportunite() {
  return useMutation({
    mutationFn: async (data) => { /* update */ },
    onMutate: async (newData) => {
      // Cancel queries
      // Snapshot previous
      // Update cache optimistically
      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback
    },
    onSettled: () => {
      // Invalidate
    },
  });
}
```

### Pool Puppeteer

```typescript
// lib/pdf/browser-pool.ts
let browserInstance: Browser | null = null;

export async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({...});
  }
  return browserInstance;
}
```

### Criteres de Succes

- [ ] Composants lourds memoises
- [ ] UI reactive pendant les mutations
- [ ] PDF generation plus rapide (reutilisation browser)

---

## Phase 6 : Documentation (3h)

### Fichiers a Mettre a Jour

| Fichier | Ajouts |
|---------|--------|
| `CLAUDE.md` | Section Testing, queryKeys, mappers, errors |
| `docs/TESTING.md` | Guide complet tests (nouveau) |

### Criteres de Succes

- [ ] Nouveau developpeur peut lancer les tests en 5 min
- [ ] Architecture documentee et comprehensible
- [ ] Conventions de code claires

---

## Timeline Recommandee

```
Semaine 1   │░░░░░░░░░░│ Phase 1a: Installation + Config Tests
Semaine 2   │░░░░░░░░░░│ Phase 1b: Tests Utils/Hooks + Phase 2a: Constants
Semaine 3   │░░░░░░░░░░│ Phase 2b: QueryKeys/Mappers + Phase 3a: Widgets
Semaine 4   │░░░░░░░░░░│ Phase 3b: Decomposition + Phase 4: Erreurs
Semaine 5   │░░░░░░░░░░│ Phase 5: Optimisations + Phase 6: Docs
```

---

## Checklist Finale

- [ ] Tous les tests passent
- [ ] Couverture > 60%
- [ ] Aucune duplication enum
- [ ] Query keys centralises
- [ ] Mappers centralises
- [ ] Composants < 150 lignes
- [ ] API errors standardisees
- [ ] Documentation a jour

---

*Plan cree le 24 decembre 2025*
