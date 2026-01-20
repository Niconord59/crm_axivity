# Plan de Refactorisation et Scalabilite

**Projet** : CRM Axivity Interface
**Date** : 2025-12-24
**Version** : 1.0
**Auteur** : Analyse automatisee Claude Code

---

## Resume Executif

Apres analyse approfondie de la codebase (183 fichiers TypeScript, ~7,162 lignes de code), le projet CRM Axivity presente une **architecture solide** avec un score de **7.5/10**. La codebase est prete pour la production mais necessite des ajustements pour garantir une scalabilite optimale.

### Verdict

| Aspect | Score | Evaluation |
|--------|-------|------------|
| Architecture globale | 8/10 | Excellente separation des concerns |
| Type Safety | 9/10 | TypeScript strict, minimal `any` |
| Data Layer | 9/10 | React Query bien implemente |
| Organisation composants | 7/10 | Bonne, quelques composants trop volumineux |
| Couverture tests | 0/10 | **Aucun test** - Point critique |
| Duplication code | 6/10 | Patterns repetitifs identifiables |
| Gestion erreurs | 6/10 | Inconsistante, a standardiser |

**Conclusion** : Pas de refonte majeure necessaire. Des ajustements incrementaux suffiront pour ameliorer la maintenabilite.

---

## Points Forts de l'Architecture Actuelle

### 1. Stack Technique Moderne

```
Next.js 16.0.10 + React 19.2.3 + Turbopack
     |
     +-- Shadcn/UI (29 composants installes)
     +-- Tailwind CSS 3.x
     +-- @tanstack/react-query 5.x
     +-- Zod 3.x (validation)
     +-- Supabase (backend)
```

### 2. Organisation des Fichiers

```
src/
+-- app/                    # App Router bien structure
|   +-- (auth)/             # Route group auth isolee
|   +-- (main)/             # Route group principale
+-- components/
|   +-- ui/                 # Shadcn - 29 composants
|   +-- layout/             # AppLayout, Sidebar, Header
|   +-- forms/              # Formulaires CRUD
|   +-- shared/             # Composants reutilisables
|   +-- [feature]/          # Par domaine metier
+-- hooks/                  # 23 hooks React Query
+-- lib/
|   +-- schemas/            # 6 schemas Zod
|   +-- services/           # Calendar, Email (multi-provider)
|   +-- templates/          # PDF (devis, facture)
+-- types/                  # Types centralises
```

### 3. Patterns React Query Consistants

Chaque hook suit le meme pattern :

```typescript
// 1. Mapper function (separation Supabase <-> App types)
function mapToEntity(record: Record<string, unknown>): Entity { }

// 2. Query hook avec query key parametree
export function useEntities(filters?: FilterOptions) {
  return useQuery({
    queryKey: ["entities", filters],
    queryFn: async () => { /* fetch + map */ },
  });
}

// 3. Mutation hook avec invalidation
export function useCreateEntity() {
  return useMutation({
    mutationFn: async (data) => { /* insert */ },
    onSuccess: () => queryClient.refetchQueries({ queryKey: ["entities"] }),
  });
}
```

### 4. Type Safety Rigoureuse

- `tsconfig.json` : `"strict": true`
- Un seul `any` dans toute la codebase (justifie et documente)
- Enums avec `as const` pour les statuts
- Interfaces bien definies dans `src/types/index.ts`

---

## Problemes Identifies

### CRITIQUE : Absence de Tests

| Constat | Impact |
|---------|--------|
| 0 fichiers `*.test.ts` ou `*.spec.ts` | Risque eleve de regressions |
| Pas de Jest/Vitest installe | Aucune CI possible |
| Pas de tests E2E | Flux critiques non valides |

**Risques** :
- Regressions silencieuses lors des evolutions
- Refactoring difficile sans filet de securite
- Bugs decouverts en production

### HAUTE : Duplication des Enums

Meme definition presente dans deux endroits :

```typescript
// src/types/index.ts
export const CLIENT_STATUSES = ["Prospect", "Actif", "Inactif", "Ancien"];

// src/lib/schemas/client.ts (DUPLIQUE)
export const CLIENT_STATUTS = ["Prospect", "Actif", "Inactif", "Ancien"];
```

**Impact** : Risque de desynchronisation, maintenance double.

### HAUTE : Composant OpportunityMiniSheet Trop Volumineux

```
OpportunityMiniSheet.tsx : 402 lignes
+-- Gestion des montants (presets, increments)
+-- Slider probabilite
+-- Formulaire de notes manuelles
+-- Timeline des interactions
+-- Logique de sauvegarde
```

**Impact** : Difficile a tester, a maintenir, et a faire evoluer.

### MOYENNE : Query Keys Non Centralisees

```typescript
// Actuellement : strings hardcodes partout
queryKey: ["clients", options]
queryKey: ["client", id]
queryKey: ["opportunity-client", id]
queryKey: ["opportunites"]
```

**Impact** : Risque de typos, invalidation manuelle difficile.

### MOYENNE : Mappers Dupliques

Chaque fichier hook contient sa propre fonction mapper :

```typescript
// use-clients.ts
function mapToClient(record: Record<string, unknown>): Client { }

// use-projets.ts
function mapToProjet(record: Record<string, unknown>): Projet { }

// use-opportunites.ts
function mapToOpportunite(record: Record<string, unknown>): Opportunite { }
```

**Impact** : Code duplique, logique de mapping eparpillee.

### MOYENNE : Gestion d'Erreurs Inconsistante

```typescript
// Pattern actuel dans les API routes
try {
  // ... logique
} catch (error) {
  console.error("Error:", error);
  return NextResponse.json(
    { error: "Error message", details: String(error) },
    { status: 500 }
  );
}
```

**Impact** : Perte de contexte d'erreur, debug difficile.

### BASSE : Optimisation Performance

- Pas de `React.memo()` sur les composants lourds
- Pas d'optimistic updates sur les mutations
- PDF : nouveau browser Puppeteer a chaque requete

---

## Plan d'Action Detaille

### Phase 1 : Tests (Priorite CRITIQUE)

**Objectif** : Etablir un filet de securite avant toute refactorisation.

#### 1.1 Installation Framework de Test

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

#### 1.2 Configuration

Creer `vitest.config.ts` :

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### 1.3 Tests Prioritaires

| Fichier | Type | Priorite |
|---------|------|----------|
| `lib/utils.ts` | Unit | P1 |
| `lib/export.ts` | Unit | P1 |
| `hooks/use-clients.ts` | Integration | P1 |
| `components/shared/ExportButton.tsx` | Component | P2 |
| `components/forms/ClientForm.tsx` | Component | P2 |
| Flux Login -> Dashboard | E2E | P2 |
| Flux Creation Opportunite -> Devis | E2E | P3 |

---

### Phase 2 : Centralisation (Priorite HAUTE)

#### 2.1 Single Source of Truth pour Enums

Supprimer les duplications :

```typescript
// src/types/constants.ts (NOUVEAU)
export const CLIENT_STATUSES = ["Prospect", "Actif", "Inactif", "Ancien"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const OPPORTUNITY_STATUSES = [...] as const;
export const PROJET_STATUSES = [...] as const;
// etc.
```

Modifier les schemas pour importer :

```typescript
// src/lib/schemas/client.ts
import { CLIENT_STATUSES } from '@/types/constants';

export const clientSchema = z.object({
  statut: z.enum(CLIENT_STATUSES),
  // ...
});
```

#### 2.2 Query Keys Factory

Creer `src/lib/queryKeys.ts` :

```typescript
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
  // ... autres entites
} as const;
```

Utilisation :

```typescript
// Avant
queryKey: ["clients", options]

// Apres
import { queryKeys } from '@/lib/queryKeys';
queryKey: queryKeys.clients.list(options)
```

#### 2.3 Mappers Centralises

Creer `src/lib/mappers/` :

```
src/lib/mappers/
+-- index.ts           # Barrel export
+-- client.mapper.ts
+-- projet.mapper.ts
+-- opportunite.mapper.ts
+-- base.mapper.ts     # Fonctions utilitaires communes
```

Exemple :

```typescript
// src/lib/mappers/base.mapper.ts
export function parseDate(value: unknown): string | undefined {
  if (!value) return undefined;
  return String(value);
}

export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

export function parseLinkedIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}
```

```typescript
// src/lib/mappers/client.mapper.ts
import { Client } from '@/types';
import { parseDate, parseLinkedIds } from './base.mapper';

export function mapToClient(record: Record<string, unknown>): Client {
  return {
    id: String(record.id),
    nom: String(record.nom || ''),
    secteurActivite: record.secteur_activite ? String(record.secteur_activite) : undefined,
    statut: record.statut as ClientStatus,
    contacts: parseLinkedIds(record.contacts),
    createdAt: parseDate(record.created_at),
    updatedAt: parseDate(record.updated_at),
  };
}
```

---

### Phase 3 : Refactoring Composants (Priorite HAUTE)

#### 3.1 Decomposition OpportunityMiniSheet

Structure cible :

```
src/components/opportunites/
+-- OpportunityMiniSheet.tsx      # Orchestrateur (< 100 lignes)
+-- tabs/
|   +-- OpportunityInfoTab.tsx    # Onglet Infos
|   +-- OpportunityHistoryTab.tsx # Onglet Historique
+-- widgets/
|   +-- AmountSelector.tsx        # Presets + increments montant
|   +-- ProbabilitySlider.tsx     # Slider probabilite
|   +-- ManualNoteForm.tsx        # Formulaire notes
|   +-- InteractionTimeline.tsx   # Timeline interactions
```

Exemple de decomposition :

```typescript
// OpportunityMiniSheet.tsx (< 100 lignes)
export function OpportunityMiniSheet({ opportuniteId, open, onOpenChange }) {
  const { data: opportunity } = useOpportunite(opportuniteId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <Tabs defaultValue="infos">
          <TabsList>
            <TabsTrigger value="infos">Infos</TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>
          <TabsContent value="infos">
            <OpportunityInfoTab opportunity={opportunity} />
          </TabsContent>
          <TabsContent value="historique">
            <OpportunityHistoryTab opportuniteId={opportuniteId} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

```typescript
// widgets/AmountSelector.tsx
interface AmountSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const PRESETS = [5000, 10000, 25000, 50000, 100000, 200000];

export function AmountSelector({ value, onChange }: AmountSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            variant={value === preset ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(preset)}
          >
            {formatCurrency(preset)}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onChange(value - 5000)}>-5k</Button>
        <Button size="sm" onClick={() => onChange(value - 1000)}>-1k</Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <Button size="sm" onClick={() => onChange(value + 1000)}>+1k</Button>
        <Button size="sm" onClick={() => onChange(value + 5000)}>+5k</Button>
      </div>
    </div>
  );
}
```

---

### Phase 4 : Gestion d'Erreurs (Priorite MOYENNE)

#### 4.1 Types d'Erreurs Standardises

Creer `src/lib/errors.ts` :

```typescript
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
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}
```

#### 4.2 Handler d'Erreurs API

Creer `src/lib/api-error-handler.ts` :

```typescript
import { NextResponse } from 'next/server';
import { AppError } from './errors';

export function handleApiError(error: unknown) {
  console.error('[API Error]', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: 'Unknown error',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}
```

Utilisation dans les API routes :

```typescript
// Avant
export async function POST(request: NextRequest) {
  try {
    // ... logique
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Apres
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

    // ... logique
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### Phase 5 : Optimisations Performance (Priorite BASSE)

#### 5.1 React.memo pour Composants Lourds

```typescript
// components/opportunites/OpportunityCard.tsx
export const OpportunityCard = React.memo(function OpportunityCard({
  opportunity,
  onDragStart,
}: OpportunityCardProps) {
  // ...
});
```

#### 5.2 Optimistic Updates

```typescript
// hooks/use-opportunites.ts
export function useUpdateOpportunite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateOpportuniteParams) => {
      // ... update
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.opportunites.all });

      const previousData = queryClient.getQueryData(
        queryKeys.opportunites.detail(newData.id)
      );

      queryClient.setQueryData(
        queryKeys.opportunites.detail(newData.id),
        (old) => ({ ...old, ...newData })
      );

      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(
        queryKeys.opportunites.detail(newData.id),
        context?.previousData
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunites.all });
    },
  });
}
```

#### 5.3 Pool de Connexions Puppeteer

```typescript
// lib/pdf/browser-pool.ts
let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
```

---

## Calendrier Recommande

| Semaine | Phase | Taches | Effort |
|---------|-------|--------|--------|
| S1 | Tests | Installation Vitest + Tests unitaires utils | 8h |
| S1-S2 | Tests | Tests hooks + composants | 12h |
| S2 | Centralisation | Query keys factory | 3h |
| S2 | Centralisation | Enums single source | 2h |
| S3 | Centralisation | Mappers extraits | 4h |
| S3-S4 | Refactoring | Decomposition OpportunityMiniSheet | 6h |
| S4 | Erreurs | Types d'erreurs + handler API | 4h |
| S5 | Performance | React.memo + optimistic updates | 4h |
| **Total** | | | **~43h** |

---

## Metriques de Succes

| Metrique | Actuel | Cible |
|----------|--------|-------|
| Couverture tests | 0% | > 60% |
| Fichiers avec duplication | ~15 | 0 |
| Composants > 300 lignes | 2 | 0 |
| `any` types | 1 | 1 (justifie) |
| Query keys centralises | 0% | 100% |

---

## Conclusion

La codebase CRM Axivity est **solide et bien architecturee**. Les recommandations ci-dessus sont des **optimisations incrementales**, pas une refonte.

**Priorites immediates** :
1. Ajouter des tests (filet de securite)
2. Centraliser enums et query keys
3. Decomposer les gros composants

Ces actions permettront de scaler sereinement le projet sans dette technique majeure.

---

*Document genere le 24 decembre 2025*
*Prochaine revision recommandee : Apres implementation Phase 1 (Tests)*
