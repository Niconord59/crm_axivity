# Sprint 4 Batch A — Polish & Tech Debt

## Summary
Premier batch du Sprint 4. 5 petits fix tech debt du plan maître (EPIC 3), rassemblés en une PR unique : try/catch clipboard, edge case "dimanche = semaine vide", suppression des `console.*` en prod, mapping UX "Rappeler" vs "Contact établi", et URL Calendar basée sur un env var au lieu de `window.location.href`.

## Prérequis
- Sprint 3 (tous les batches A + B + C + D) **mergé en prod**
- TRX-2 prod exécuté et stable depuis au moins 1 semaine

## Scope — 5 stories

| ID | Titre | Issue GitHub | Fichier(s) |
|---|---|---|---|
| **PRO-L1** | Try/catch autour de `clipboard.writeText` | [#63](https://github.com/Niconord59/crm_axivity/issues/63) | `app/(main)/prospection/page.tsx` |
| **PRO-L2** | Cas "Dimanche = semaine vide" | [#64](https://github.com/Niconord59/crm_axivity/issues/64) | `hooks/use-prospects.ts` (helper `getEndOfWeek`) |
| **PRO-L3** | `console.*` en prod | [#65](https://github.com/Niconord59/crm_axivity/issues/65) | `ProspectForm.tsx`, `CreateEventDialog.tsx` |
| **PRO-L4** | Mapping UX "Rappeler" vs "Contact établi" | [#66](https://github.com/Niconord59/crm_axivity/issues/66) | `ProspectProgressStepper.tsx` |
| **PRO-L6** | `window.location.href` → URL relative dans Calendar | [#68](https://github.com/Niconord59/crm_axivity/issues/68) | `CreateEventDialog.tsx` |

**Plan maître** pour le détail de chaque story : [`../prospection-remediation-plan.md`](../prospection-remediation-plan.md).

**Note** : PRO-L5 (tests composants manquants) et PRO-L7 (backfill spec 008 coverage) sont traités dans le Sprint 4B parce qu'ils demandent leur propre cycle de review.

## Branch

```
chore/pro-sprint4-batch-a
```

Créée depuis `develop` à jour (post Sprint 3D).

## Prérequis produit — décision à prendre

**PRO-L4 nécessite une décision produit** avant implémentation :

> Le stepper affiche "Rappeler" mais le code interne utilise "Contact établi". Deux options mutuellement exclusives :
>
> - **Option A** : renommer le label UI en "Contact établi" (aligner UI sur code) — cohérence technique
> - **Option B** : renommer le statut interne en "Rappeler" (aligner code sur UI) — cohérence produit
>
> Impact : si Option B, il faut aussi renommer le statut dans la base Supabase (`contacts.statut_prospection` — migration nécessaire) et dans les workflows N8N.

**Recommandation** : **Option A** (renommer UI). Moins de blast radius, pas de migration DB.

Cette décision doit être actée **avant** de lancer ce batch — sans elle, PRO-L4 ne peut pas avancer.

## Ordre d'exécution recommandé

1. **L6** — fix URL Calendar (1 ligne). Définir `APP_BASE_URL` dans `process.env` ou fallback sur `window.location.origin`.
2. **L1** — try/catch clipboard (5 min). Toast error si échec (ex. permission refusée).
3. **L3** — suppression `console.*`. Utiliser un utilitaire `log` du projet si existant, sinon supprimer.
4. **L2** — edge case `getEndOfWeek` (1 if). Décaler d'une semaine si `dayOfWeek === 0`.
5. **L4** — mapping stepper (après décision produit).

## Acceptance criteria agrégés

- [ ] `grep "window.location.href" crm/src/components/prospection/agenda` → 0 résultat hors fallback (L6)
- [ ] `navigator.clipboard.writeText` → wrappé dans try/catch avec toast error (L1)
- [ ] `grep "console\." crm/src/components/prospection` → 0 hors `console.warn` légitime (L3)
- [ ] Dimanche à 23h59 → `getEndOfWeek()` retourne le dimanche suivant, pas le dimanche actuel (L2) — test unitaire obligatoire
- [ ] Stepper affiche un label cohérent avec le statut interne (L4, option A ou B selon décision)
- [ ] Tests : baseline Sprint 3 → ≥ +3 (1 par L1/L2/L4 minimum)
- [ ] `npm run lint:prospection-gate` → exit 0
- [ ] `npx tsc --noEmit` → 0 nouvelle erreur
- [ ] `npm run build` → pass

## Risques

| Risk | Mitigation |
|---|---|
| **L3 supprime un log utilisé pour le debugging** | Vérifier si le projet a un utilitaire `log` structuré avant suppression. Sinon `console.warn` sur les erreurs critiques est acceptable. |
| **L4 Option B casse les workflows N8N** qui matchent sur `"Rappeler"` vs `"Contact établi"` | Ne pas choisir Option B sans audit N8N. Option A est sans risque. |
| **L6 si `APP_BASE_URL` pas défini en prod** | Fallback sur `window.location.origin` (pas `.href` qui inclut le path). Le defaut n'est jamais cassé. |

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

- PRO-L5 (tests composants manquants) → Sprint 4B
- PRO-L7 (backfill spec 008 coverage) → Sprint 4B, plan dédié
- Refonte du stepper au-delà de L4

## PR strategy

1 PR avec 5 commits atomiques. Titre :

> `chore(prospection): sprint 4 batch A — polish & tech debt (L1/L2/L3/L4/L6)`

Body référence `Closes #63 #64 #65 #66 #68`.

## Next step après merge batch A

Staging 24h → prod → lancer Sprint 4B (`sprint4b-coverage-plan.md`).
