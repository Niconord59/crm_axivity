# Epic 008 : Couverture de Tests Progressive

**Feature** : 008-test-coverage
**Status** : PLANNED
**Priority** : HIGH
**Estimated Effort** : 8-10 sprints (progressive)

---

## 1. Contexte

Suite au code review du 6 janvier 2026, un probleme majeur de couverture de tests a ete identifie :

### Etat Actuel (Baseline)

| Categorie | Total | Testees | Couverture |
|-----------|-------|---------|------------|
| **Hooks** | 16 | 1 | 6.25% |
| **API Routes** | 8 | 0 | 0% |
| **Components** | 100+ | 3 | ~3% |
| **Utilitaires** | 10+ | 2 | ~20% |
| **Mappers** | 6 | 0 | 0% |
| **Total Fichiers** | ~215 | ~3 | ~1.4% |

**Tests existants** : 125 tests (Phase 007-refactorisation)

### Risques Identifies

1. **Regressions silencieuses** : Modifications qui cassent le comportement sans detection
2. **Refactoring risque** : Impossible d'ameliorer le code en securite
3. **Dette technique** : Accumulation de bugs non detectes
4. **Onboarding difficile** : Nouveaux developpeurs sans filet de securite

---

## 2. Objectifs

### Objectif Global

Atteindre une couverture de tests **significative et maintenable** :
- **Phase 1** : 20% couverture (fonctions critiques)
- **Phase 2** : 40% couverture (hooks principaux)
- **Phase 3** : 60% couverture (composants metier)
- **Phase 4** : 80% couverture (APIs et edge cases)

### Metriques de Succes

| Metrique | Actuel | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|----------|--------|---------|---------|---------|---------|
| Hooks testes | 1/16 | 6/16 | 12/16 | 16/16 | 16/16 |
| API routes testees | 0/8 | 4/8 | 8/8 | 8/8 | 8/8 |
| Composants testes | 3 | 10 | 25 | 50 | 75+ |
| Nombre total tests | 125 | 200 | 350 | 500 | 700+ |

---

## 3. Strategie Progressive

### Priorite 1 : Code Critique (Business Logic)

Tests sur le code qui impacte directement les donnees et les operations metier.

**Hooks prioritaires** :
1. `use-opportunites.ts` - Pipeline commercial (CA)
2. `use-factures.ts` - Facturation (argent)
3. `use-devis.ts` - Devis (CA potentiel)
4. `use-projets.ts` - Projets (operations)
5. `use-prospects.ts` - Prospection (leads)

**API routes prioritaires** :
1. `/api/devis/generate` - Generation PDF critique
2. `/api/factures/generate` - Facturation
3. `/api/devis/send` - Envoi emails
4. `/api/factures/relance` - Relances automatiques

### Priorite 2 : Mappers et Transformations

Code qui transforme les donnees entre couches (erreurs difficiles a debugger).

**Mappers** :
- `client.mapper.ts`
- `opportunite.mapper.ts`
- `facture.mapper.ts`
- `projet.mapper.ts`
- `tache.mapper.ts`
- `base.mapper.ts` (fonctions utilitaires)

### Priorite 3 : Composants Metier

Composants qui encapsulent de la logique complexe.

**Composants prioritaires** :
- `OpportunityCard.tsx` - Drag & drop, calculs
- `OpportunityMiniSheet.tsx` - Edition complete
- `LeadCard.tsx` - Logique prospection
- `QuoteLinesTable.tsx` - Calculs devis
- `ProspectionKPIs.tsx` - Aggregations

### Priorite 4 : Integration et E2E

Tests qui verifient le flux complet.

---

## 4. Stack de Test

### Outils Existants

| Outil | Usage | Status |
|-------|-------|--------|
| **Vitest** | Test runner | Installe |
| **@testing-library/react** | Tests composants | Installe |
| **@testing-library/jest-dom** | Matchers DOM | Installe |
| **MSW** | Mock HTTP | Installe (non utilise) |

### Outils a Ajouter (Optionnel)

| Outil | Usage | Phase |
|-------|-------|-------|
| **@testing-library/user-event** | Interactions realistes | Phase 3 |
| **vitest-coverage-report-action** | CI/CD | Phase 4 |

---

## 5. Conventions de Test

### Nomenclature

```
src/
  hooks/
    use-clients.ts
    __tests__/
      use-clients.test.ts
  components/
    opportunites/
      OpportunityCard.tsx
      __tests__/
        OpportunityCard.test.tsx
  lib/
    mappers/
      client.mapper.ts
      __tests__/
        client.mapper.test.ts
  app/
    api/
      devis/
        generate/
          route.ts
          __tests__/
            route.test.ts
```

### Structure des Tests

```typescript
// Describe blocks par fonctionnalite
describe('useOpportunites', () => {
  describe('useOpportunites()', () => {
    it('should fetch all opportunities', async () => {});
    it('should handle loading state', async () => {});
    it('should handle error state', async () => {});
  });

  describe('useUpdateOpportunite()', () => {
    it('should update opportunity optimistically', async () => {});
    it('should rollback on error', async () => {});
  });
});
```

### Patterns de Mock

```typescript
// Mock Supabase (existant)
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Mock API routes (a ajouter)
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({ ...data, status: init?.status })),
  },
}));
```

---

## 6. Definition of Done

Un fichier est considere "teste" quand :

1. **Couverture minimum** : 80% des lignes executables
2. **Happy path** : Tous les cas nominaux couverts
3. **Error handling** : Gestion des erreurs testee
4. **Edge cases** : Cas limites identifies et testes
5. **Pas de skips** : Aucun `it.skip()` ou `describe.skip()`

---

## 7. Exclusions

Ces fichiers ne necessitent PAS de tests unitaires :

| Categorie | Raison |
|-----------|--------|
| `src/components/ui/*` | Composants Shadcn/UI (testes par la lib) |
| `src/app/**/page.tsx` | Pages (tests E2E plutot) |
| `src/app/**/layout.tsx` | Layouts (configuration) |
| `src/types/*.ts` | Types purs (pas de logique) |
| `src/lib/supabase.ts` | Configuration client |

---

## 8. Dependances

| Feature | Status | Impact |
|---------|--------|--------|
| 007-refactorisation | COMPLETE | Fournit le framework de test |
| queryKeys.ts | COMPLETE | Facilite le mock des queries |
| mappers/ | COMPLETE | Isole la transformation |

---

## 9. Risques

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Tests flaky | Medium | High | Utiliser `waitFor`, eviter `setTimeout` |
| Mocks complexes | High | Medium | Isoler les mocks dans `test/mocks/` |
| Temps de build | Low | Medium | Paralleliser avec `--threads` |
| Maintenance | Medium | Medium | Conventions strictes |

---

## 10. Timeline Estimee

| Phase | Duration | Objectif |
|-------|----------|----------|
| Phase 1 | 2 sprints | Hooks critiques + mappers |
| Phase 2 | 2 sprints | APIs + hooks restants |
| Phase 3 | 3 sprints | Composants metier |
| Phase 4 | 2 sprints | Integration + CI/CD |

**Total** : 8-10 sprints (adaptable selon capacite)

---

*Spec creee le 6 janvier 2026*
*Issue identifiee lors du code review BMAD*
