# Sprint 4 Batch B — Test Coverage (spec 008)

## Summary
Deuxième et dernier batch de la remédiation Prospection. Consolide la couverture de tests en suivant la spec dédiée `008-test-coverage` du projet. Deux stories du plan maître sont regroupées ici : PRO-L5 (tests composants manquants) et PRO-L7 (backfill spec 008 Phase 1-3 sur le périmètre prospection).

⚠️ **Ce batch est le plus gros des deux sprints tech debt** et mérite probablement son propre PRP détaillé si la spec 008 est complexe. Ce plan est un point d'entrée ; le vrai travail vit dans `crm/specs/008-test-coverage/`.

## Prérequis
- Sprint 4A **mergé en prod**
- Lecture préalable de la spec `crm/specs/008-test-coverage/` — phases 1, 2, 3 (voir `crm/CLAUDE.md#008-test-coverage`)
- Baseline coverage prospection mesurée : `npm run test:coverage` filtré sur `components/prospection` + `hooks/use-prospects` + `hooks/use-calendar` + `lib/mappers/contact` + `lib/schemas/prospect`

## Scope — 2 stories (méta)

| ID | Titre | Issue GitHub | Portée |
|---|---|---|---|
| **PRO-L5** | Tests composants manquants | [#67](https://github.com/Niconord59/crm_axivity/issues/67) | `InteractionEditDialog`, `ProspectForm`, `LeadImportDialog`, `CompanySearch` |
| **PRO-L7** | Backfill spec 008-test-coverage Phase 1-3 pour prospection | [#69](https://github.com/Niconord59/crm_axivity/issues/69) | Toutes stories M7 + M25 + L5 regroupées (méta) |

**Plan maître** pour le détail : [`../prospection-remediation-plan.md`](../prospection-remediation-plan.md).

**Spec de référence** : `crm/specs/008-test-coverage/` (plan de couverture progressive par phases).

## Branch

```
test/pro-sprint4-batch-b-coverage
```

Créée depuis `develop` à jour (post Sprint 4A).

## Dépendances

Les prérequis suivants doivent être en place (devraient tous l'être post Sprint 3) :
- **M2** (enrich helper factorisé) — évite de tester la duplication 5 fois
- **M11** (utils extraits) — tests co-localisés dans `utils.test.ts`
- **H1** (contact mapper) — tests déjà présents depuis Sprint 2
- **H2** (query join unique) — tests déjà présents depuis Sprint 2

## Objectifs de couverture

Aligné sur la spec 008 :

| Périmètre | Baseline attendue (post Sprint 3) | Cible après ce batch |
|---|---|---|
| Hooks prospects (`use-prospects.ts`) | ~80% | ≥ 90% |
| Composants prospection | ~30% | ≥ 70% |
| Composants agenda | ≥ 60% (post M25) | ≥ 70% |
| Mappers / schemas | ≥ 90% (post Sprint 2) | ≥ 95% |
| `lib/google-calendar.ts` | ≥ 80% (post H12) | ≥ 90% |

## Ordre d'exécution recommandé

1. **Mesure baseline** — `npm run test:coverage` filtré sur les chemins prospection. Capturer le rapport dans `.claude/PRPs/reports/prospection-coverage-baseline.md`.
2. **Identifier les composants < 50%** — priorité aux mutations business-critical (création lead, import CSV, résultat d'appel).
3. **Backfill par composant** en suivant la spec 008 :
   - `InteractionEditDialog` — test ouverture/remount via key, soumission, cancel
   - `ProspectForm` — test multi-onglet, validation Zod, création lead avec/sans clientId (H9 defensive)
   - `LeadImportDialog` — test validation MIME+size (H10), parse CSV, bulk insert
   - `CompanySearch` — test debounce, sélection, enrichment Google Places
4. **Review finale de coverage** — générer le rapport, comparer avec les cibles, documenter dans `.claude/PRPs/reports/prospection-coverage-final.md`.

## Acceptance criteria agrégés

- [ ] Baseline coverage rapporté et comparé à cible (L7)
- [ ] Composants listés (L5) chacun avec ≥ 5 tests couvrant happy path + edge cases
- [ ] Cibles de couverture atteintes ou justifiées ligne par ligne si en-deçà
- [ ] Spec 008 phases 1-3 fermées sur le périmètre prospection (tracker dans `crm/specs/008-test-coverage/`)
- [ ] `npm run lint:prospection-gate` → exit 0
- [ ] `npm run build` → pass
- [ ] PR merge + spec 008 mise à jour

## Risques

| Risk | Mitigation |
|---|---|
| **Mocks de `CompanySearch`** (API gouv + Google Places) complexes | Utiliser `msw` pour les 2 API externes. Factoriser dans `crm/src/test/mocks/company-search.ts`. |
| **`LeadImportDialog` avec PapaParse** — mock file upload + CSV parsing | Utiliser `File` + `Blob` natifs + fichier CSV fixture dans `crm/src/test/fixtures/`. |
| **Cibles de couverture trop ambitieuses** si le code a des branches mortes | Accepter < cible si branches mortes documentées + TODO marqué pour un futur cleanup (pas de scope creep). |

## Validation locale

```bash
cd crm
npm run lint
npm run lint:prospection-gate
npx tsc --noEmit
npm test -- --run
npm run test:coverage -- src/components/prospection src/hooks/use-prospects.ts
npm run build
```

## NOT Building dans ce batch

- Tests E2E (hors scope spec 008 phases 1-3)
- Couverture hors périmètre prospection (spec 008 est plus large, mais ce batch se limite à prospection)
- Refactor produit pour faciliter les tests → si un composant est testable difficilement, noter en follow-up, **ne pas** le refactorer dans ce batch

## PR strategy

**1 PR par composant** (ou 1 PR par sous-phase de spec 008) pour faciliter la review. Alternative : 1 PR unique par sous-phase si les composants sont tous assez simples.

Chaque PR référence l'issue #67 et #69 dans son body, et incrémente un commentaire de progrès dans l'issue méta #69.

## Next step après merge batch B

- Sprint 5 = plus rien sur la remédiation Prospection. Passer au prochain backlog produit.
- Fermer EPIC 2 (#20) et EPIC 3 (#21) avec un commentaire récap.
- Mettre à jour `prospection-remediation-plan.md` avec un marker `## 🏁 Remediation complete`.
