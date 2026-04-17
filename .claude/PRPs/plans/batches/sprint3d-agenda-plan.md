# Sprint 3 Batch D — Agenda

## Summary
Quatrième batch du Sprint 3, et le plus gros. Concentré sur le module agenda de prospection : pagination des événements Google/MS Graph, optimisation perf (pré-bucket par jour), a11y clavier sur le calendrier, titre par défaut pour RDV sans prospect, keys stables, et backfill de tests sur `agenda/*` + `google-calendar.ts`.

## Prérequis
- Sprint 3 Batches A + B + C **mergés en prod**
- PRO-H11 et H12 (Sprint 1) : helpers agenda stables à tester — ✅ déjà en prod

## Scope — 7 stories

| ID | Titre | Issue GitHub | Fichier(s) |
|---|---|---|---|
| **PRO-M19** | Supprimer le double toast | [#56](https://github.com/Niconord59/crm_axivity/issues/56) | `CreateEventDialog.tsx` |
| **PRO-M20** | Pagination events calendar | [#57](https://github.com/Niconord59/crm_axivity/issues/57) | `app/api/calendar/events/route.ts` |
| **PRO-M21** | Pré-bucket events par jour (`useMemo`) | [#58](https://github.com/Niconord59/crm_axivity/issues/58) | `WeekCalendar.tsx` |
| **PRO-M22** | Keys stables pour attendees | [#59](https://github.com/Niconord59/crm_axivity/issues/59) | `EventCard.tsx` |
| **PRO-M23** | Titre RDV vide si pas de prospect | [#60](https://github.com/Niconord59/crm_axivity/issues/60) | `ProspectionAgendaView.tsx` |
| **PRO-M24** | Keyboard nav / ARIA sur calendrier | [#61](https://github.com/Niconord59/crm_axivity/issues/61) | `WeekCalendar.tsx` |
| **PRO-M25** | Backfill tests `agenda/*` + `google-calendar.ts` | [#62](https://github.com/Niconord59/crm_axivity/issues/62) | Nouveaux `__tests__/` |

**Plan maître** pour le détail de chaque story : [`../prospection-remediation-plan.md`](../prospection-remediation-plan.md).

## Branch

```
refactor/pro-sprint3-batch-d
```

Créée depuis `develop` à jour (post merges Batches A + B + C).

## Ordre d'exécution recommandé

1. **M19 + M22 + M23** — triviaux (double toast, keys stables, titre par défaut). 5 min chacun.
2. **M21** — optimisation perf `WeekCalendar`. Remplace 7 × `filter()` par un `Map<dateKey, Event[]>`. Snapshot du rendu avant/après.
3. **M20** — pagination API calendar. **Gros morceau** : ajouter `pageToken` / `nextPageToken` au round-trip Google/MS Graph. Impact staging OAuth nécessaire.
4. **M24** — keyboard nav + ARIA sur le calendrier. `role="grid"`, `tabIndex`, `aria-label`, gestion des flèches clavier. Nécessite des tests manuels avec VoiceOver/NVDA.
5. **M25 en dernier** — backfill tests. Dépend de la forme finale de M19-M24.

## Acceptance criteria agrégés

- [ ] `CreateEventDialog` émet 1 seul toast par action (M19)
- [ ] `/api/calendar/events` propage `pageToken` ; si Google/MS renvoie `nextPageToken`, on le rend accessible côté client (M20)
- [ ] `WeekCalendar` : 1 seul calcul de bucket par `events` change, pas 1 par jour (M21)
- [ ] `EventCard` : keys sur les attendees basées sur `email` ou `crypto.randomUUID()`, pas `index` (M22)
- [ ] Créer un RDV sans prospect associé → titre par défaut "Nouveau RDV" (ou à ajuster) au lieu de vide (M23)
- [ ] `WeekCalendar` : `role="grid"` + navigation ← ↑ → ↓ fonctionnelle (M24)
- [ ] Nouveau dossier `crm/src/components/prospection/agenda/__tests__/` avec ≥ 5 fichiers (CreateEventDialog, WeekCalendar, EventCard, AgendaTab, ProspectionAgendaView) — couverture ≥ 60% (M25)
- [ ] Nouveau `crm/src/lib/__tests__/google-calendar.test.ts` (sauf si déjà créé en Sprint 1 H12)
- [ ] Tests : baseline post-Batch C → ≥ +40 (M25 à lui seul)
- [ ] `npm run lint:prospection-gate` → exit 0
- [ ] `npx tsc --noEmit` → 0 nouvelle erreur
- [ ] `npm run build` → pass

## Risques

| Risk | Mitigation |
|---|---|
| **M20 double le volume de requêtes API** si la pagination force un 2ᵉ call pour chaque vue | Toujours renvoyer `nextPageToken` dans la réponse, laisser le client décider de paginer. Fetch unique par défaut. |
| **M24 casse le focus trap** existant | Tests manuels en staging avec VoiceOver (macOS) et NVDA (Windows). Un dev + un user avec lecteur d'écran idéalement. |
| **M25 mocks Google/MS Graph complexes** | Utiliser `msw` (déjà dans devDependencies). Factoriser dans `crm/src/test/mocks/calendar.ts` pour partager entre tests. |
| **Impact OAuth staging** pour M20 — le token doit être valide pour tester la pagination | Valider en staging avec un compte test Google avant merge |

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

- [ ] Créer 30+ événements Google Calendar → la liste paginée affiche au-delà de 10 events (M20)
- [ ] Naviguer au calendrier avec flèches clavier, Tab, Shift+Tab (M24)
- [ ] Lecteur d'écran : chaque cellule du calendrier est annoncée avec la date + nombre d'events (M24)
- [ ] Créer RDV sans prospect → titre par défaut visible (M23)
- [ ] Duplicats : créer 2 événements avec les mêmes attendees → keys uniques dans le DOM (M22)

## NOT Building dans ce batch

- Refonte du composant Calendar au-delà de ces findings (pas de drag-and-drop, pas de récurrence RDV)
- Migration d'un provider OAuth vers un autre
- Pagination UI côté client (si ajoutée plus tard, spec dédiée)

## PR strategy

**Une PR par story** — à la différence des batches précédents, les changements d'agenda touchent différents fichiers et ont des blast radius distincts. Une PR par story permet :
- Rollback ciblé si M20 ou M24 pose souci en staging
- Review plus facile (M20 et M24 sont les 2 plus complexes)

Alternative si on veut minimiser le overhead : 3 PRs (triviaux / perf / a11y+tests).

Body de chaque PR doit référencer `Closes #N` pour l'issue correspondante.

## Next step après merge batch D

Staging **72h minimum** (agenda impacte l'UX quotidienne, vérifier en conditions réelles) → prod → lancer Sprint 4A (`sprint4a-polish-plan.md`).
