# Sprint 3 Batch B — Data Layer

## Summary
Deuxième batch du Sprint 3. Cible les hooks React Query de prospection : pagination, stabilité des query keys, validation SIRET, unification des stratégies d'invalidation, et comblement de la couverture de tests sur les hooks pas encore testés.

## Prérequis
- Sprint 3 Batch A **mergé en prod** (M2 fournit `enrichWithClientNames`, M8 centralise les enums).

## Scope — 6 stories

| ID | Titre | Issue GitHub |
|---|---|---|
| **PRO-M1** | Pagination / garde-fou `select("*")` dans `useProspects` | [#38](https://github.com/Niconord59/crm_axivity/issues/38) |
| **PRO-M3** | Stabiliser la key de `useProspectionKPIs` | [#40](https://github.com/Niconord59/crm_axivity/issues/40) |
| **PRO-M4** | Refactorer tests `useProspectionKPIs` en `renderHook` | [#41](https://github.com/Niconord59/crm_axivity/issues/41) |
| **PRO-M5** | SIRET strict 14 chiffres dans le schema | [#42](https://github.com/Niconord59/crm_axivity/issues/42) |
| **PRO-M6** | Unifier `refetch` vs `invalidateQueries` dans les mutations | [#43](https://github.com/Niconord59/crm_axivity/issues/43) |
| **PRO-M7** | Tests hooks manquants (`useUpdateContact`, `useDeleteContact`, `useUpcomingRdvProspects`, `useContactsByClient`) | [#44](https://github.com/Niconord59/crm_axivity/issues/44) |

**Plan maître** pour le détail de chaque story : [`../prospection-remediation-plan.md`](../prospection-remediation-plan.md).

## Branch

```
refactor/pro-sprint3-batch-b
```

Créée depuis `develop` à jour (qui doit inclure le merge de Batch A).

## Ordre d'exécution recommandé

1. **M5 en premier** — isolé (`crm/src/lib/schemas/prospect.ts` + `client.ts`), pas de dépendance. Regex stricte `/^\d{14}$/`.
2. **M1** — limite `.limit(500)` sur `useProspects` + log warning si > 500 contacts. Risque fonctionnel : tenants avec > 500 prospects actuels — vérifier en staging.
3. **M3** — `useMemo` sur `prospects?.map(p => p.id).join(",")` pour la query key. Prerequisite pour M4.
4. **M4** — passage des tests `useProspectionKPIs` en `renderHook`. Dépend de M3 (key stable).
5. **M6** — remplacer les `.refetch()` flottants par `invalidateQueries`. Pattern `use-factures.ts`. **Dépend de M2** (Batch A) — le helper `enrichWithClientNames` n'a plus besoin de forcer un refetch si les invalidations sont correctes.
6. **M7** — 4 blocs `describe` ajoutés dans `use-prospects.test.ts`. Couverture ≥ 60% sur ces hooks.

## Acceptance criteria agrégés

- [ ] `grep "\.limit(" crm/src/hooks/use-prospects.ts` → au moins 1 occurrence (M1)
- [ ] SIRET avec 13 chiffres → erreur, SIRET avec lettres → erreur, 14 chiffres → OK (3 cas test M5)
- [ ] React Query DevTools : `useProspectionKPIs` ne re-run pas à chaque render du parent (M3)
- [ ] `grep "\.refetch()" crm/src/hooks/use-prospects.ts` → 0 résultat dans les mutations (M6)
- [ ] `useUpdateContact`, `useDeleteContact`, `useUpcomingRdvProspects`, `useContactsByClient` chacun avec ≥ 2 tests (happy path + erreur) (M7)
- [ ] Tests : 1289 → ≥ 1310 (+21 minimum, hors nouveaux test cases M3/M4 SIRET)
- [ ] `npm run lint:prospection-gate` → exit 0
- [ ] `npx tsc --noEmit` → 0 nouvelle erreur
- [ ] `npm run build` → pass

## Risques

| Risk | Mitigation |
|---|---|
| **M1 rompt les tenants avec > 500 prospects** | Log warning visible, pas d'erreur. Spec pagination future = follow-up dédié. Vérifier en staging : `SELECT COUNT(*) FROM contacts WHERE statut_prospection IS NOT NULL` → si > 500, poster dans `#crm` avant merge |
| **M3 casse la cache React Query** si la signature du hash dérive entre renders | Pinner le test "same ids → same cache entry" (voir story M3 acceptance criteria) |
| **M6 rend les UI moins réactives** si l'invalidate n'est pas suffisamment ciblé | Vérifier en staging : création → la liste se met à jour sans hard refresh |

## Validation locale

```bash
cd crm
npm run lint
npm run lint:prospection-gate
npx tsc --noEmit
npm test -- --run
npm run build
```

## NOT Building dans ce batch

- Toutes les stories UI (M9-M18) → Sprint 3C
- Agenda (M19-M25) → Sprint 3D
- Pagination complète (UI + état) → spec dédiée post-Sprint 3

## PR strategy

1 PR unique avec 6 commits atomiques (1 par story) pour faciliter la review et un rollback ciblé si besoin.

Body doit référencer `Closes #38`, `Closes #40`, `Closes #41`, `Closes #42`, `Closes #43`, `Closes #44`.

## Next step après merge batch B

Staging 24-48h → prod → lancer Sprint 3C (`sprint3c-ui-plan.md`).
