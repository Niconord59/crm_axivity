# Sprint 3 Batch A — Unblockers

## Summary
Premier batch du Sprint 3 de la remédiation Prospection. Les 3 stories ci-dessous **doivent être mergées avant** tout autre travail du Sprint 3 : ce sont des extractions de helpers et une déduplication qui, sans elles, forceraient à refactorer 5 call-sites au lieu d'un pour les stories suivantes.

## Scope — 3 stories

| ID | Titre | Issue GitHub |
|---|---|---|
| **PRO-M2** | Extraire `enrichWithClientNames()` helper | [#39](https://github.com/Niconord59/crm_axivity/issues/39) |
| **PRO-M8** | Dédupliquer `PROSPECT_SOURCES` / `PROSPECT_STATUTS` | [#45](https://github.com/Niconord59/crm_axivity/issues/45) |
| **PRO-M11** | Extraire `prospection/utils.ts` | [#48](https://github.com/Niconord59/crm_axivity/issues/48) |

**Plan maître** pour le détail de chaque story : [`../prospection-remediation-plan.md`](../prospection-remediation-plan.md).

## Pourquoi ce batch en premier

- **M2** touche `crm/src/hooks/use-prospects.ts` à 5 endroits (lignes 183, 635, 692, 740, 797). Sans M2, les stories M3 et M6 devraient modifier le code 5 fois chacune.
- **M8** centralise les enums. Toute story qui touche `crm/src/lib/schemas/prospect.ts` (M5, M15, …) doit attendre M8 pour éviter un conflit de source of truth.
- **M11** extrait `isToday`, `isOverdue` et les badge helpers dupliqués entre `LeadCard.tsx` et `LeadListTable.tsx`. M13 et M22 consomment ces utils.

## Branch

```
refactor/pro-sprint3-batch-a
```

Créée depuis `develop` à jour (qui doit inclure PRs #74, #75, #77).

## Ordre d'exécution recommandé au sein du batch

1. **M8 en premier** — le plus isolé (seul `crm/src/lib/schemas/prospect.ts` + import depuis `types/constants.ts`). Débloque les revues suivantes.
2. **M11 ensuite** — nouveau fichier `crm/src/components/prospection/utils.ts`, mises à jour de `LeadCard.tsx` + `LeadListTable.tsx`.
3. **M2 en dernier** — plus gros (5 call-sites + nouveau `crm/src/hooks/helpers/enrich-with-clients.ts`). Les tests doivent être verts sur les 4 hooks touchés (`useRappelsAujourdhui`, `useRdvAujourdhui`, `usePastRdvProspects`, `useUpcomingRdvProspects` + `useProspectsWithClients` déjà refactorée en Sprint 2).

## Acceptance criteria agrégés

- [ ] `grep "PROSPECT_SOURCES" crm/src` → 1 seule déclaration (dans `types/constants.ts`)
- [ ] `grep "isToday\|isOverdue" crm/src/components/prospection` → 1 seule définition (dans `utils.ts`)
- [ ] `grep -l "fetchClientsForProspects\|clientMap\.set" crm/src/hooks` → usage centralisé via `enrich-with-clients.ts`
- [ ] Tests verts : `useRappelsAujourdhui`, `useRdvAujourdhui`, `usePastRdvProspects`, `useUpcomingRdvProspects` — comportement identique avant/après (tests caractérisation AVANT refactor)
- [ ] Nouveau test `crm/src/hooks/helpers/__tests__/enrich-with-clients.test.ts` avec ≥ 3 cas (aucun client, 1 client, plusieurs clients dont 1 introuvable)
- [ ] Nouveau test `crm/src/components/prospection/__tests__/utils.test.ts` pour `isToday` + `isOverdue`
- [ ] Tests existants : 1289 → ≥ 1289 (pas de régression, gain de couverture)
- [ ] `npm run lint:prospection-gate` → exit 0
- [ ] `npx tsc --noEmit` → 0 nouvelle erreur
- [ ] `npm run build` → pass

## Risques

| Risk | Mitigation |
|---|---|
| **M2 casse silencieusement une des 5 duplications** si leurs signatures divergent | Tests caractérisation AVANT refactor : snapshot des payloads retournés par chacun des 5 hooks, comparer après. Les 4 autres hooks (hors `useProspectsWithClients` déjà refactorée) partagent 95% de logique mais pas à 100%. |
| **M8 casse une importation cassée** si un fichier importe un enum depuis `schemas/prospect.ts` au lieu de `types/constants.ts` | `grep "from.*schemas/prospect" crm/src` avant la suppression dans `schemas/prospect.ts`. Rediriger les imports vers `types/constants.ts`. |
| **M11 introduit un bug de parité** (valeur `isToday` différente entre les 2 call-sites) | Sauvegarder les implémentations actuelles, les unifier dans `utils.ts`, puis compiler. TS pointera toute divergence de signature. |

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

- Toutes les autres stories Mx ou Lx → Sprint 3B / 3C / 3D / Sprint 4
- Refactor de `useProspects` (hors périmètre)
- Ajout de nouveaux filtres produit

## PR strategy

1 PR `refactor/pro-sprint3-batch-a → develop`. Titre suggéré :

> `refactor(prospection): sprint 3 batch A — PRO-M2 + M8 + M11 (unblockers)`

Body doit référencer les 3 issues GitHub avec `Closes #39`, `Closes #45`, `Closes #48` pour déclencher l'auto-close au merge dans `main`.

## Next step après merge batch A

Staging 24-48h → prod via PR `develop → main` → lancer Sprint 3B (`sprint3b-data-layer-plan.md`).
