# Sprint 3 Batch C — UI Cleanup

## Summary
Troisième batch du Sprint 3. Cible les anomalies UI et micro-bugs des formulaires/dialogues de prospection : apostrophes échappées, gestion de l'Escape, states morts, aria-labelledby, pagination preview import, cohérence entre schema Zod et options UI.

## Prérequis
- Sprint 3 Batch A **mergé en prod** (M11 fournit `utils.ts` consommé par M13).

## Scope — 9 stories

| ID | Titre | Issue GitHub | Fichier(s) |
|---|---|---|---|
| **PRO-M9** | Retirer `useEffect` de navigation d'onglet | [#46](https://github.com/Niconord59/crm_axivity/issues/46) | `ProspectForm.tsx` |
| **PRO-M10** | Escape conditionnel dans dialogues | [#47](https://github.com/Niconord59/crm_axivity/issues/47) | `ProspectForm.tsx`, `CallResultDialog.tsx` |
| **PRO-M12** | Supprimer index keys dans preview import | [#49](https://github.com/Niconord59/crm_axivity/issues/49) | `LeadImportDialog.tsx` |
| **PRO-M13** | Error state dans `ProspectionKPIs` | [#50](https://github.com/Niconord59/crm_axivity/issues/50) | `ProspectionKPIs.tsx` |
| **PRO-M14** | Nesting `DialogTitle` — fix aria-labelledby | [#51](https://github.com/Niconord59/crm_axivity/issues/51) | `CallResultDialog.tsx` |
| **PRO-M15** | Échapper les apostrophes | [#52](https://github.com/Niconord59/crm_axivity/issues/52) | `LeadCard.tsx` |
| **PRO-M16** | Exporter `ProspectionKPIData` | [#53](https://github.com/Niconord59/crm_axivity/issues/53) | `use-prospects.ts` + test |
| **PRO-M17** | Nettoyer imports / states morts | [#54](https://github.com/Niconord59/crm_axivity/issues/54) | 4 fichiers (voir détail plan maître) |
| **PRO-M18** | Sync `resultOptions` ↔ `callResultSchema` | [#55](https://github.com/Niconord59/crm_axivity/issues/55) | `CallResultDialog.tsx` |

**Plan maître** pour le détail de chaque story : [`../prospection-remediation-plan.md`](../prospection-remediation-plan.md).

## Branch

```
refactor/pro-sprint3-batch-c
```

Créée depuis `develop` à jour (qui doit inclure les merges de Batch A + B).

## Ordre d'exécution recommandé

Toutes les stories sont **indépendantes entre elles**. Ordre conseillé par volume :

1. **Triviaux en premier** (5 min chacun) : M15 (échapper apostrophes) → M16 (export type) → M17 (cleanup imports) → M12 (stable keys)
2. **Fix comportement** : M9 (setTab direct), M10 (Escape conditionnel), M18 (options dérivées du schema)
3. **Fix UX/a11y** : M13 (error state KPIs), M14 (aria-labelledby)

Chaque story en son propre commit — ce batch est un **nettoyage progressif**, pas un refactor cohérent.

## Acceptance criteria agrégés

- [ ] `npm run lint` → 0 erreur `react/no-unescaped-entities` (M15)
- [ ] Type `ProspectionKPIData` importable depuis `@/hooks/use-prospects` (M16)
- [ ] `grep "isPreviewMode\|searchValue" crm/src/components/prospection` → 0 résultat dans les usages (M17)
- [ ] Preview import : keys stables (hash ligne ou `crypto.randomUUID()`, pas d'index) (M12)
- [ ] `ProspectForm` : pas de `useEffect` qui appelle `setActiveTab` (M9)
- [ ] `Escape` bloqué uniquement pendant `isSubmitting`, pas en permanence (M10)
- [ ] `resultOptions` dans `CallResultDialog` dérivé de `callResultSchema.shape.resultat.options` (M18)
- [ ] `ProspectionKPIs` affiche un toast error + fallback UI si `isError` (M13)
- [ ] Aucun nesting `DialogTitle` dans `CallResultDialog` — aria-labelledby propre (M14)
- [ ] Tests : 1289+Batch B → ≥ +5 (tests de régression UI/a11y minimum)
- [ ] `npm run lint:prospection-gate` → exit 0
- [ ] `npx tsc --noEmit` → 0 nouvelle erreur
- [ ] `npm run build` → pass

## Risques

| Risk | Mitigation |
|---|---|
| **M14 casse le focus trap** si la hiérarchie aria change | Test manuel en staging : navigation clavier dans le dialogue (`Tab` → `Shift+Tab`), vérifier que VoiceOver/NVDA annonce le bon titre |
| **M18 désaligne les labels UI** si le schema a changé sans que l'UI suive | Snapshot des options affichées avant/après refactor |
| **M17 supprime un import encore utilisé** (faux positif lint) | `npm run build` obligatoire avant push — trouve les imports effectivement manquants |

## Validation locale

```bash
cd crm
npm run lint
npm run lint:prospection-gate
npx tsc --noEmit
npm test -- --run
npm run build
```

## Tests manuels critiques en staging

- [ ] Ouvrir `ProspectForm`, passer d'un onglet à l'autre — pas de double render visible
- [ ] Appuyer Escape pendant la soumission → dialogue ne se ferme pas
- [ ] Appuyer Escape hors soumission → dialogue se ferme
- [ ] `ProspectionKPIs` : couper la connexion Supabase → l'UI doit afficher l'erreur propre, pas planter
- [ ] Lecteur d'écran (VoiceOver / NVDA) : ouvrir `CallResultDialog`, le titre doit être annoncé une seule fois

## NOT Building dans ce batch

- Agenda (M19-M25) → Sprint 3D
- Tech debt L1-L7 → Sprint 4
- Nouveaux composants UI → hors scope

## PR strategy

1 PR avec 9 commits atomiques (1 par story). Titre :

> `refactor(prospection): sprint 3 batch C — UI cleanup (M9, M10, M12-M18)`

Body référence `Closes #46 #47 #49 #50 #51 #52 #53 #54 #55`.

## Next step après merge batch C

Staging 24-48h → prod → lancer Sprint 3D (`sprint3d-agenda-plan.md`).
