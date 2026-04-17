# Batches de la remédiation Prospection

Chaque fichier `sprint*-*.md` est un **PRP batch** prêt à être passé à `/ecc:prp-implement`. Ils découpent les Sprints 3 et 4 du plan maître [`../prospection-remediation-plan.md`](../prospection-remediation-plan.md) en morceaux reviewables en 15-30 min.

## Vue d'ensemble

| Batch | Scope | Stories | Issues GitHub | Prérequis |
|---|---|---|---|---|
| [3A](sprint3a-unblockers-plan.md) | Unblockers — extractions qui conditionnent le reste du Sprint 3 | M2, M8, M11 | #39 #45 #48 | Sprint 2 + TRX-1 en prod ✅ |
| [3B](sprint3b-data-layer-plan.md) | Data layer — pagination, query keys, validation, tests hooks | M1, M3, M4, M5, M6, M7 | #38 #40 #41 #42 #43 #44 | 3A en prod |
| [3C](sprint3c-ui-plan.md) | UI cleanup — apostrophes, états morts, a11y mineure, cohérence schema/UI | M9, M10, M12-M18 | #46 #47 #49-#55 | 3A en prod (M11 utils) |
| [3D](sprint3d-agenda-plan.md) | Agenda — pagination calendar, perf, a11y clavier, backfill tests | M19-M25 | #56-#62 | 3A+B+C en prod, H11/H12 déjà en prod ✅ |
| [4A](sprint4a-polish-plan.md) | Polish & tech debt — 5 fix triviaux, 1 PR | L1, L2, L3, L4, L6 | #63-#66 #68 | Sprint 3 complet, TRX-2 prod stable ≥ 1 semaine |
| [4B](sprint4b-coverage-plan.md) | Test coverage — spec 008 phases 1-3 sur le périmètre prospection | L5, L7 (méta) | #67 #69 | Sprint 4A en prod |

## Comment lancer un batch

```
/ecc:prp-implement <batch-name>

Contexte :
- Plan : .claude/PRPs/plans/batches/sprint3a-unblockers-plan.md
- Plan maître (détail des stories) : .claude/PRPs/plans/prospection-remediation-plan.md
- Branche nouvelle depuis develop : <branch du batch>
```

Chaque batch self-contained : dépendances, ordre d'exécution, acceptance criteria, risques, validation commands, PR strategy.

## Ordre chronologique strict

3A → 3B → 3C → 3D → 4A → 4B

Les dépendances inter-stories (plan maître → Graph de dépendances) sont respectées dans cet ordre. Tenter de sauter un batch ou les paralléliser = re-refactor garanti.

## Staging / prod cadence recommandée

- Chaque batch : 24h en staging avant prod (72h pour 3D à cause de l'agenda)
- Smoke test par batch selon la section "Tests manuels critiques en staging" du plan
- PR `develop → main` après chaque merge batch (sauf 3A+3B qui peuvent être groupés si staging est stable)

## État actuel (au 2026-04-17)

- ✅ Sprint 1 en prod
- ✅ Sprint 2 + TRX-1 en prod
- ⏳ TRX-2 prod — fenêtre dimanche 2026-04-19 20h CEST (voir issue [#19](https://github.com/Niconord59/crm_axivity/issues/19))
- ⏸️ Sprint 3A — prêt à démarrer dès lundi 2026-04-20 si TRX-2 OK

## Après Sprint 4B

- Fermer EPIC 2 ([#20](https://github.com/Niconord59/crm_axivity/issues/20)) et EPIC 3 ([#21](https://github.com/Niconord59/crm_axivity/issues/21))
- Ajouter un marker `## 🏁 Remediation complete` en haut du plan maître
- La remédiation Prospection est terminée → backlog produit suivant
