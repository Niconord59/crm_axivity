# Plan : Remédiation Code Review Prospection

## Summary
Plan de remédiation des **45 findings** (1 CRITICAL + 13 HIGH + 25 MEDIUM + 6 LOW) issus du code review du module Prospection du 2026-04-16. Découpé en 3 epics et 3 sprints pour débloquer le merge vers `main`, puis améliorer durablement la qualité et la dette technique.

## User Story
En tant qu'**équipe tech CRM Axivity**,
je veux **corriger les failles de sécurité et de qualité identifiées dans la feature Prospection**,
afin de **pouvoir merger `feature/mcp-server` vers `main` sans exposer de token OAuth, sans bugs ESLint bloquants, et avec une base solide pour la suite**.

## Problem → Solution
**Current state**: 1 fuite token OAuth côté client, 3 erreurs ESLint `react-hooks/set-state-in-effect` (même classe de bug qu'un récent hotfix `8e1405f7`), validation CSV absente, plusieurs mutations non gérées, helpers timezone faux, duplications x5, zéro test agenda.
**Desired state**: Token OAuth server-only, zéro erreur lint, imports CSV validés (MIME + taille), helpers timezone corrects, utils partagés extraits, tests agenda présents, CI gate sur `set-state-in-effect`.

## Metadata
- **Complexity**: XL (couverture large — 25 fichiers + CI + tests)
- **Source Review**: `.claude/PRPs/reviews/prospection-review-2026-04-16.md`
- **Epics**: 3
- **Stories**: 47 (14 P0/P1 + 25 P2 + 6 P3 + 2 transverses)
- **Sprints**: 3+
- **Branche de base**: `develop` (jamais `main` — voir `CLAUDE.md#Git-Workflow`)

---

## Status — dernière mise à jour 2026-04-17 ~07:35 UTC

### Vue d'ensemble
**Sprint 1 = DONE en `main`, déployé en prod, TRX-2 exécuté en staging.**
PR #73 (`develop → main`) mergée le 2026-04-17 à 07:09 UTC (commit `4ccd3c54`). Coolify a redéployé `crm.axivity.cloud` avec succès. Les 8 issues Sprint 1 (#22-#28 + #37) se sont auto-fermées via les `Fixes` du body. TRX-2 a été exécuté en staging (rotation `AUTH_SECRET`) et validé : OAuth Google reconnecté, `hasCalendarAccess: true`, pas d'`accessToken` dans `/api/auth/session`. **Reste uniquement TRX-2 prod** (planifié dimanche soir CEST).

### Sprint 1 — stories mergées dans `develop`

| Story | Issue | Commit | PR | Smoke staging |
|---|---|---|---|---|
| PRO-C1 (OAuth token server-side) | [#22](https://github.com/Niconord59/crm_axivity/issues/22) | `d475c005` | #70 | ✅ `hasCalendarAccess: true`, pas d'`accessToken` |
| PRO-H7 (InteractionEditDialog setState) | [#24](https://github.com/Niconord59/crm_axivity/issues/24) | `945e5cb8` | #70 | ✅ |
| PRO-H8 (EmailComposer setState) | [#25](https://github.com/Niconord59/crm_axivity/issues/25) | `a1aa1af4` | #70 | ✅ |
| PRO-H5 (page.tsx cast + effect) | [#23](https://github.com/Niconord59/crm_axivity/issues/23) | `22f52891` | #70 | ✅ |
| PRO-H10 (CSV MIME + size) | [#26](https://github.com/Niconord59/crm_axivity/issues/26) | `116279cd` | #70 | ⚠️ à retester (non bloquant) |
| PRO-H11 (CreateEventDialog mutation) | [#27](https://github.com/Niconord59/crm_axivity/issues/27) | `c8386310` | #70 | ✅ |
| PRO-H12 (timezone helper supprimé) | [#28](https://github.com/Niconord59/crm_axivity/issues/28) | `cfd58344` | #70 | ✅ (helper mort, pas de régression) |
| PRO-TRX-2 (runbook rotation tokens) | [#37](https://github.com/Niconord59/crm_axivity/issues/37) | `1bb3ef59` | #70 | N/A (doc) |

PR #70 = `Prospection Hardening Sprint 1` — **mergée**, branche supprimée. Issues restent **OPEN** jusqu'au merge `develop → main` (GitHub auto-close seulement sur branche par défaut).

### Hotfixes post-merge — deux bugs latents dans PRO-C1 découverts en staging

| # | PR | Commit | Root cause | Fix |
|---|---|---|---|---|
| 1 | [#71](https://github.com/Niconord59/crm_axivity/pull/71) | `909d5df6` | `getToken({ req })` sans `secureCookie` → cherchait `authjs.session-token` alors que le cookie prod est `__Secure-authjs.session-token` derrière le reverse proxy Coolify | Pass explicit `secureCookie: NODE_ENV === "production"` |
| 2 | [#72](https://github.com/Niconord59/crm_axivity/pull/72) | `8f644907` | `getToken` throw `MissingSecret` car `secret` param requis à runtime mais pas au typing — test gap : `vi.mock("next-auth/jwt")` stubbait la fonction entièrement donc la branche throw n'était jamais exercée | Pass `secret: process.env.AUTH_SECRET` |

Les deux fixes sont dans `crm/src/lib/auth-helpers.ts` — voir `getServerAccessToken`. Tests `crm/src/lib/__tests__/auth-session.test.ts` pinent les deux params dans l'appel à `getToken`.

### Artefacts de travail

- Plan (ce fichier) : `.claude/PRPs/plans/prospection-remediation-plan.md`
- Review initiale : `.claude/PRPs/reviews/prospection-review-2026-04-16.md`
- Review PRO-C1 (a catché la régression refresh-token avant merge) : `.claude/PRPs/reviews/pro-c1-review-2026-04-16.md`
- Rapport PRO-C1 : `.claude/PRPs/reports/pro-c1-oauth-token-leak-report.md`
- Rapport PRO-H7 : `.claude/PRPs/reports/pro-h7-interaction-edit-setstate-report.md`
- Rapport PRO-H5 + H8 : `.claude/PRPs/reports/pro-h5-h8-setstate-report.md`
- Runbook rotation : `docs/runbooks/rotate-oauth-tokens-2026-04.md`

### État des métriques CI

| Métrique | Avant Sprint 1 | Après Sprint 1 + hotfixes |
|---|---|---|
| Tests | 1207 | **1252** (+45) |
| Lint errors | 88 | **85** (-3 `react-hooks/set-state-in-effect`) |
| Lint warnings | 112 | 108 |
| `grep "session\.accessToken" crm/src` | 9 | **0** |
| Build | pass | pass |

### Next steps — dans l'ordre, reprendre ici

1. ~~**PR `develop → main`**~~ ✅ DONE — PR #73 mergée `4ccd3c54` le 2026-04-17 07:09 UTC. Issues #22-#28 + #37 auto-fermées.
2. **PRO-TRX-2 staging** ✅ DONE — `AUTH_SECRET` rotaté sur `crm-staging.axivity.cloud`, redeploy Coolify OK, OAuth Google reconnecté, shape session validé (`hasCalendarAccess: true`, pas d'`accessToken`).
3. **PRO-TRX-2 prod** ⏳ À PLANIFIER — reproduire la même procédure sur `crm.axivity.cloud`.
   - Fenêtre recommandée : **dimanche 20h CEST** (trafic proche de zéro).
   - Comm Slack `#crm` 1h avant : template dans le runbook §Production → 2.
   - **Ne pas** réutiliser le secret staging — en générer un nouveau.
   - Post-exécution : remplir la checklist post-mortem à la fin du runbook (date, nb de reconnexions, tickets support, anomalies).
4. **Sprint 2** — data-layer + Zod tightening (peut démarrer dès maintenant, indépendant de TRX-2 prod).
   - Stories : H1, H2, H3, H4, H6, H9, H13 (voir sections ci-dessous).
   - Nouvelle branche : `fix/prospection-hardening-sprint2` depuis `develop` (à jour avec `main` post-merge #73).
   - Dépendances : H1 avant M2 ; H4 avant H5 (H5 déjà fait → H4 standalone).
5. **PRO-TRX-1 (CI gate `react-hooks/set-state-in-effect: error`)** — parallélisable avec Sprint 2.
   - Bloqué par les **85 erreurs lint pré-existantes** dans d'autres modules (hors prospection).
   - Deux options : (a) fixer toutes les erreurs (gros scope), (b) limiter la règle aux fichiers de prospection via `eslint.config.mjs` `overrides`.
   - Option (b) recommandée pour débloquer TRX-1 sans dépendance sur un clean-up pré-existant.

### Ce qu'il NE FAUT PAS refaire en reprise

- Ne pas refaire les stories C1 / H5 / H7 / H8 / H10 / H11 / H12 (déjà mergées).
- Ne pas rouvrir le runbook TRX-2 (déjà écrit dans `docs/runbooks/`).
- Ne pas toucher à `crm/src/lib/auth-helpers.ts` sans lire en premier :
  - le docstring de `getServerAccessToken` qui explique les deux paramètres fragiles (`secret`, `secureCookie`) ;
  - les 4 tests de régression dans `auth-session.test.ts` qui pinnent ces paramètres.

### Gotchas capturés pour référence future

- **NextAuth v5 `getToken`** : exige explicitement `secret` ET `secureCookie`. L'auto-détection derrière un reverse proxy (Coolify, Traefik, nginx…) échoue silencieusement → 401. Pattern utilisé dans `auth-helpers.ts` à reproduire partout où on réutilise `getToken` en dehors de `auth()`.
- **Test gap `vi.mock("next-auth/jwt")`** : mocker un package entier peut cacher des runtime throws dans le code appelant. Parallèle : quand on mocke du tiers, pinner le shape EXACT des args qu'on lui passe (voir le test `getToken called with secureCookie + secret`).
- **Auto-close GitHub issues** : les `Closes #N` dans les commits ne ferment les issues qu'au merge dans la **branche par défaut** (`main` ici), pas `develop`. Les 8 issues Sprint 1 se fermeront toutes seules à la PR `develop → main`.

---

## Règles projet (non négociables)

Extraites de `CLAUDE.md` et `crm/CLAUDE.md` :

1. **Git workflow**
   - Toute branche créée depuis `develop` (jamais `main` — branch protection active)
   - Nom : `fix/pro-<ID>-<slug>` ou `refactor/pro-<epic>-<slug>`
   - Commits en **Conventional Commits** (`fix:`, `refactor:`, `chore:`, `test:`, `security:`)
   - CI : `.github/workflows/ci.yml` doit être vert avant review
2. **UI**
   - **Shadcn/UI exclusivement** (pas d'autre framework UI)
   - Mobile-first responsive (375 / 768 / 1024)
   - Libellés en français
3. **Tests**
   - **Vitest + Testing Library** co-localisés dans `__tests__/` (ex. `crm/src/hooks/__tests__/use-prospects.test.ts`)
   - Render wrapper React Query : `crm/src/test/utils.tsx`
   - Mocks Supabase : `crm/src/test/mocks/supabase.ts`
4. **Commandes de validation locale** (exécuter depuis `crm/`)
   ```bash
   npm run lint
   npm run typecheck      # si script présent, sinon `npx tsc --noEmit`
   npm test
   npm run build          # pour valider que Next.js compile en prod
   ```
5. **Pattern data layer** : React Query + Supabase + Zod + mappers dédiés (`lib/mappers/`), query keys centralisés (`lib/queryKeys.ts`), erreurs via `lib/errors.ts` + `lib/api-error-handler.ts`.

---

## Patterns à respecter (discovered in codebase)

### NAMING_CONVENTION (hook React Query)
```ts
// SOURCE: crm/src/hooks/use-prospects.ts:76-86
export function useProspects(filters?: ProspectFilters) {
  return useQuery({
    queryKey: queryKeys.prospects.list(filters),
    placeholderData: keepPreviousData,
    queryFn: async () => { /* ... */ },
  });
}
```

### MAPPER_PATTERN (Zod-parse au boundary — pattern cible pour H1)
```ts
// SOURCE: crm/src/lib/mappers/opportunite.mapper.ts (pattern existant)
// Valider le DB record via Zod, puis mapper vers le type domaine.
export function mapToContact(record: Record<string, unknown>): Contact {
  const parsed = contactDbRecordSchema.parse(record); // ← à introduire
  return { id: parsed.id, nom: parsed.nom ?? "", /* ... */ };
}
```

### NEXTAUTH_SESSION (pattern cible pour C1)
```ts
// SOURCE: crm/src/lib/auth.ts:8-14 (type à amender)
declare module "next-auth" {
  interface Session {
    hasCalendarAccess?: boolean;  // ← remplace accessToken côté client
    error?: string;
    provider?: OAuthProvider;
  }
}
// Côté serveur uniquement : lire le token via `const { token } = await auth()` ou via JWT.
```

### RESET_PATTERN (remplace setState-in-useEffect — H5/H7/H8)
```tsx
// Pattern 1 — key prop : force le remount avec l'état initial correct
<InteractionEditDialog key={interaction.id} interaction={interaction} />

// Pattern 2 — useMemo + lazy useState
const derived = useMemo(() => computeInitial(interaction), [interaction]);
const [body, setBody] = useState(() => derived);
```

### ERROR_HANDLING (mutation async)
```tsx
// SOURCE: pattern projet (use-factures.ts, use-opportunites.ts)
async function handleEmailSent() {
  try {
    await createInteraction.mutateAsync({ /* ... */ });
    toast.success("Email consigné");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Erreur inconnue");
  }
}
```

### TEST_STRUCTURE
```ts
// SOURCE: crm/src/hooks/__tests__/use-prospects.test.ts (existant)
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "@/test/utils";
import { supabaseMock } from "@/test/mocks/supabase";
// ... arrange / act / assert
```

---

# EPIC 1 — Prospection Hardening P0
**Objectif** : débloquer le merge vers `main`.
**Scope** : C1 + H1→H13 + transverse TRX-1.
**Sprint 1 (critique) → Sprint 2 (lot data/UI restant)**.

## Sprint 1 — Bloquants merge `main`

> **État global Sprint 1 : DONE en `develop`, staging validé, en attente PR `develop → main`.** Voir la section *Status* en haut du document pour le détail.

### PRO-C1 — Empêcher la fuite du token OAuth côté client ✅ DONE (merged, 2 hotfixes post-deploy)
- **Severity** : CRITICAL · **Taille** : M · **Branch** : `security/pro-c1-oauth-token-leak`
- **Fichiers** : `crm/src/lib/auth.ts:8-14, 125-131` + tous les call-sites client de `session.accessToken`
- **Problème** : `accessToken` (scopes Calendar + Gmail) est sérialisé dans la session NextAuth, lu côté navigateur via `useSession()` / `GET /api/auth/session`. Toute XSS l'exfiltre.
- **Fix** :
  1. Amender le `declare module "next-auth"` pour remplacer `accessToken?: string` par `hasCalendarAccess?: boolean`.
  2. Dans le callback `session(...)` : `session.hasCalendarAccess = !!extendedToken.accessToken;` (ne plus exposer le token brut).
  3. Serveur : récupérer le token via le JWT (`getToken` de `next-auth/jwt`) dans les routes API (`app/api/calendar/**`, `app/api/email/**`).
  4. Client : remplacer toutes les lectures `session.accessToken` par `session.hasCalendarAccess` (feature flag) ou laisser la route API décider.
- **Acceptance criteria**
  - GIVEN un utilisateur connecté en Google OAuth WHEN il exécute `fetch("/api/auth/session").then(r => r.json())` THEN `accessToken` est absent et `hasCalendarAccess === true`.
  - GIVEN une route API serveur WHEN elle appelle `getToken({ req })` THEN elle récupère `accessToken` pour appeler Google/Microsoft Graph.
  - GIVEN un code client (composants, hooks) WHEN on cherche `session.accessToken` THEN `grep -r "session\.accessToken" crm/src` ne retourne aucune occurrence hors `lib/auth.ts` et routes API serveur.
- **Tests à ajouter**
  - `crm/src/lib/__tests__/auth-session.test.ts` — mock des callbacks NextAuth, asserter l'absence de `accessToken` dans la session retournée.
  - `crm/src/app/api/calendar/events/__tests__/route.test.ts` — vérifier que la route obtient le token via JWT.
- **Validation locale**
  ```bash
  cd crm
  npm run lint
  npm run typecheck
  npm test -- auth-session route.test
  npm run build
  ```
- **Dépendances** : aucune (prérequis de tout le reste pour merge).
- **Risque transverse** : après déploiement, **considérer une rotation / révocation des tokens existants** (Supabase sessions + Google/MS refresh tokens) — documenter l'action ops dans le PR. Voir **TRX-2**.

### PRO-H7 — `setState` dans `useEffect` dans `InteractionEditDialog` ✅ DONE (merged)
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h7-interaction-edit-setstate`
- **Fichiers** : `crm/src/components/prospection/InteractionEditDialog.tsx:73-87`
- **Problème** : Même anti-pattern que le hotfix `8e1405f7` — `useEffect` qui appelle `setState` sur changement de prop déclenche un render supplémentaire et peut bloquer les soumissions.
- **Fix** : Remonter via `key={interaction.id}` depuis le parent OU dériver l'initial state via `useMemo` + `useState(() => memo)` (voir `RESET_PATTERN`).
- **Acceptance criteria**
  - GIVEN la page ouverte WHEN on ouvre le dialogue pour une interaction X THEN les champs s'initialisent correctement sans `useEffect` de sync.
  - GIVEN un switch vers une autre interaction Y WHEN on rouvre THEN les valeurs Y s'affichent (pas celles de X).
  - `npm run lint` → 0 erreur `react-hooks/set-state-in-effect` sur ce fichier.
- **Tests** : étendre / créer `crm/src/components/prospection/__tests__/InteractionEditDialog.test.tsx` avec un test "remount on id change" (render avec key différente, vérifier les valeurs).
- **Validation** : `npm run lint` + `npm test -- InteractionEditDialog`.
- **Dépendances** : **H7, H8, H5 partagent le même anti-pattern** → implémenter en une même PR cohérente ou traiter séquentiellement (cf. **TRX-1**).

### PRO-H8 — `setState` dans `useEffect` dans `EmailComposer` ✅ DONE (merged)
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h8-email-composer-setstate`
- **Fichiers** : `crm/src/components/prospection/EmailComposer.tsx:73, 77-85`
- **Problème** : Cascade de re-renders via `setState` dans un `useEffect` ; plus un état `isPreviewMode` non utilisé (L17).
- **Fix** :
  1. Calculer le corps dérivé avec `useMemo` à partir des props (template + prospect).
  2. Initialiser le state `body` via `useState(() => memo)`.
  3. Supprimer `isPreviewMode` et toute référence.
- **Acceptance criteria**
  - GIVEN un prospect avec un template WHEN `<EmailComposer>` monte THEN le corps est pré-rempli sans `useEffect`.
  - GIVEN l'utilisateur édite le corps WHEN la prop change (autre prospect via `key`) THEN le nouveau corps initial est affiché.
  - Lint : 0 erreur `react-hooks/set-state-in-effect` ni `no-unused-vars` sur ce fichier.
- **Tests** : ajouter `crm/src/components/prospection/__tests__/EmailComposer.test.tsx` (rendu initial + update via key).
- **Validation** : `npm run lint` + `npm test -- EmailComposer`.
- **Dépendances** : partage pattern avec H7/H5 (TRX-1).

### PRO-H5 — Unsafe cast `as Prospect` sur `Contact` + setState-in-effect ✅ DONE (merged)
- **Severity** : HIGH · **Taille** : M · **Branch** : `fix/pro-h5-prospect-cast`
- **Fichiers** : `crm/src/app/(main)/prospection/page.tsx:65`
- **Problème** : Cast non-sûr `contact as Prospect` alors que `Contact` n'a pas `clientNom`/`opportuniteCount` → lecture `undefined`. De plus, le `useEffect` associé rentre dans la même classe de bug (H7/H8).
- **Fix** :
  1. Soit utiliser `useProspectsWithClients` pour l'ID sélectionné (fetch enrichi).
  2. Soit construire explicitement un objet `Prospect` avec `clientNom: undefined, opportuniteCount: 0` (typage strict).
  3. Remplacer le `useEffect` par un `useMemo` ou une dérivation inline.
- **Acceptance criteria**
  - GIVEN un contact sélectionné WHEN la page rend THEN aucun champ `undefined.xxx` n'est lu (TypeScript strict passe).
  - Lint : 0 erreur `react-hooks/set-state-in-effect` sur `page.tsx`.
- **Tests** : étendre `crm/src/app/(main)/prospection/__tests__/page.test.tsx` (si inexistant, créer) — test de sélection prospect → enrichissement.
- **Validation** : `npm run lint` + `npm run typecheck` + `npm test -- prospection/page`.
- **Dépendances** : TRX-1 (pattern commun).

### PRO-H10 — Validation MIME + taille pour l'import CSV ✅ DONE (merged)
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h10-csv-validation`
- **Fichiers** : `crm/src/components/prospection/LeadImportDialog.tsx:109-128, 131`
- **Problème** : seul `file.name.endsWith(".csv")` est vérifié ; `handleFileSelect` n'a aucune garde ; un CSV > plusieurs Mo bloque le thread via PapaParse.
- **Fix** :
  ```ts
  const MAX_CSV_BYTES = 5 * 1024 * 1024;
  const isValidCsv = (file: File) =>
    (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) &&
    file.size <= MAX_CSV_BYTES;

  if (!isValidCsv(file)) {
    toast.error("Fichier invalide : CSV uniquement, max 5 Mo.");
    return;
  }
  ```
  Appliquer dans `handleFileChange` **et** `handleFileSelect`.
- **Acceptance criteria**
  - GIVEN un `.xlsx` WHEN on upload THEN toast d'erreur + abandon.
  - GIVEN un CSV de 6 Mo WHEN on upload THEN toast d'erreur + abandon.
  - GIVEN un CSV valide < 5 Mo WHEN on upload THEN le parsing PapaParse se lance.
- **Tests** : `crm/src/components/prospection/__tests__/LeadImportDialog.test.tsx` — 3 cas (ext invalide, taille > limite, cas valide).
- **Validation** : `npm run lint` + `npm test -- LeadImportDialog`.
- **Dépendances** : aucune.

### PRO-H11 — Mutation de prop dans `CreateEventDialog` ✅ DONE (merged)
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h11-create-event-prop-mutation`
- **Fichiers** : `crm/src/components/prospection/agenda/CreateEventDialog.tsx:62-66`
- **Problème** : `initialDate.setMinutes(0,0,0,0)` mute la `Date` passée en prop → altère le state parent par référence.
- **Fix** : Cloner avant mutation :
  ```ts
  const base = new Date(initialDate ?? Date.now());
  base.setMinutes(0, 0, 0, 0);
  ```
- **Acceptance criteria**
  - GIVEN un parent qui passe `initialDate` (nouvel objet Date) WHEN le dialogue ouvre THEN l'objet parent garde ses minutes d'origine.
- **Tests** : `crm/src/components/prospection/agenda/__tests__/CreateEventDialog.test.tsx` — assert `initialDate.getMinutes()` inchangé après mount.
- **Validation** : `npm run lint` + `npm test -- CreateEventDialog`.
- **Dépendances** : aucune. Corrige aussi une partie de M25 (intro de tests agenda).

### PRO-H12 — `toISOStringWithTimezone` ignore son paramètre `timeZone` ✅ DONE (merged — dead helper removed instead of renamed)
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h12-timezone-helper`
- **Fichiers** : `crm/src/lib/google-calendar.ts:80-82` + call-sites.
- **Problème** : Retourne UTC malgré la promesse d'un ISO string local. Incohérent avec `DEFAULT_TIMEZONE = "Europe/Paris"`.
- **Fix (au choix)**
  - **Option A** : implémenter un vrai formatage avec `Intl.DateTimeFormat` + offset (recommandé si Google Calendar attend un offset local).
  - **Option B** : renommer en `toUTCISOString`, supprimer le paramètre, adapter les appelants.
- **Acceptance criteria**
  - GIVEN `new Date("2026-04-16T10:00:00Z"), "Europe/Paris"` WHEN on appelle la fonction THEN option A renvoie `"2026-04-16T12:00:00+02:00"` (été) ; option B renvoie `"2026-04-16T10:00:00.000Z"` sans param.
  - Google Calendar API accepte le format retourné (test d'intégration manuel ou mocké).
- **Tests** : `crm/src/lib/__tests__/google-calendar.test.ts` — fixture date UTC + timezone → vérif string attendue (summer/winter DST).
- **Validation** : `npm run lint` + `npm test -- google-calendar`.
- **Dépendances** : CreateEventDialog + routes calendar consomment ce helper ; ajuster si option B choisie.

---

## Sprint 2 — Lot data-layer + UI correctness

### PRO-H1 — `mapToContact` validé par Zod
- **Severity** : HIGH · **Taille** : M · **Branch** : `refactor/pro-h1-contact-mapper-zod`
- **Fichiers** : `crm/src/hooks/use-prospects.ts:34-56`, nouveau `crm/src/lib/schemas/contact-db.ts`, nouveau `crm/src/lib/mappers/contact.mapper.ts`.
- **Problème** : Chaque champ est `as X` sans validation → drift silencieux du schéma DB vs type domaine.
- **Fix** :
  1. Créer un schéma `contactDbRecordSchema` (Zod) reflétant les colonnes Supabase (enums = `z.enum([...])`).
  2. Déplacer `mapToContact` dans `lib/mappers/contact.mapper.ts` avec un `parse()` au boundary.
  3. Gérer l'erreur Zod → `console.warn` + skip record (ne pas crasher la liste).
- **Acceptance criteria**
  - GIVEN un record DB conforme WHEN le mapper tourne THEN retourne un `Contact` valide.
  - GIVEN un record avec `statut_prospection = "INVALIDE"` WHEN le mapper tourne THEN il log un warning et écarte le record au lieu de produire un type corrompu.
  - Tests mapper passent à 100%.
- **Tests** : `crm/src/lib/mappers/__tests__/contact.mapper.test.ts` avec cas valides + invalides + null handling.
- **Validation** : `npm run lint` + `npm run typecheck` + `npm test -- contact.mapper`.
- **Dépendances** : débloque M2 (extraction enrichment).

### PRO-H2 — Stabiliser la query key de `useProspectsWithClients`
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h2-prospects-with-clients-cache`
- **Fichiers** : `crm/src/hooks/use-prospects.ts:165-241`.
- **Problème** : La query interne n'inclut pas la liste d'IDs prospects dans sa key → refetch du parent laisse l'enrichi obsolète.
- **Fix (recommandé)** : remplacer les 2 queries par une seule `supabase.from("contacts").select("*, clients(id, nom)")` et mapper le résultat.
- **Acceptance criteria**
  - GIVEN création d'un nouveau prospect WHEN parent se re-fetch THEN `useProspectsWithClients` affiche le nouveau prospect enrichi.
  - Query unique visible dans Network (1 call au lieu de 2).
- **Tests** : `crm/src/hooks/__tests__/use-prospects.test.ts` — cas "enrichment refresh after parent refetch".
- **Validation** : `npm run lint` + `npm test -- use-prospects`.
- **Dépendances** : peut se faire en parallèle de H1, mais H1 fournit le mapper.

### PRO-H3 — `importedLeadSchema` : email ou téléphone
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h3-imported-lead-schema`
- **Fichiers** : `crm/src/lib/schemas/prospect.ts:282`.
- **Problème** : `email: z.string().email()` est obligatoire, contredit `prospectSchema` (refine "email OR phone"). CSV phone-only échoue silencieusement.
- **Fix** :
  ```ts
  email: z.string().email().optional().or(z.literal("")),
  // + refine "email OR telephone" aligné sur prospectSchema
  ```
- **Acceptance criteria**
  - GIVEN un CSV avec un lead phone-only WHEN import THEN parse réussit et insertion OK.
  - GIVEN un lead sans email ni téléphone WHEN import THEN erreur validation claire.
- **Tests** : `crm/src/lib/schemas/__tests__/prospect.test.ts` — 3 cas (email only, phone only, ni l'un ni l'autre).
- **Validation** : `npm run lint` + `npm test -- prospect.test`.
- **Dépendances** : aucune.

### PRO-H4 — Supprimer `updateStatus` non utilisé
- **Severity** : HIGH (dead code / maintenance) · **Taille** : S · **Branch** : `chore/pro-h4-remove-dead-code`
- **Fichiers** : `crm/src/app/(main)/prospection/page.tsx:71`.
- **Fix** : Supprimer `const updateStatus = useUpdateProspectStatus();` + import inutile si non utilisé ailleurs.
- **Acceptance criteria** : `npm run lint` passe sans warning `no-unused-vars` sur la page.
- **Tests** : aucun (suppression pure).
- **Validation** : `npm run lint`.
- **Dépendances** : aucune. À faire avant H5 pour éviter conflit de merge sur même fichier.

### PRO-H6 — Mutation `createInteraction` awaited
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h6-floating-promise`
- **Fichiers** : `crm/src/components/prospection/CallResultDialog.tsx:1382-1390`.
- **Problème** : `.mutate(...)` flottant dans `onEmailSent` — les erreurs sont avalées.
- **Fix** : handler `async` + `mutateAsync` + `try/catch` avec toast d'erreur (pattern `ERROR_HANDLING`).
- **Acceptance criteria**
  - GIVEN envoi email OK WHEN Supabase insert échoue THEN toast error affiché (pas de silence).
  - GIVEN envoi email OK + insert OK WHEN le flux se termine THEN toast success.
- **Tests** : `crm/src/components/prospection/__tests__/CallResultDialog.test.tsx` — mock de `createInteraction.mutateAsync` rejet → assert toast error.
- **Validation** : `npm run lint` + `npm test -- CallResultDialog`.
- **Dépendances** : aucune.

### PRO-H9 — Non-null assertions → guards explicites
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h9-nonnull-guards`
- **Fichiers** : `crm/src/components/prospection/ProspectForm.tsx:541`, `crm/src/components/prospection/CallResultDialog.tsx:283, 414`.
- **Fix** :
  ```ts
  if (!result.clientId) {
    toast.error("Client non créé");
    return;
  }
  const clientId = result.clientId;
  ```
  Idem pour `prospect?.client?.[0]`.
- **Acceptance criteria** : Aucun `!` sur un ID possiblement undefined ; grep `grep -n "\!\.*clientId\|client\[0\]\!" crm/src/components/prospection` retourne 0.
- **Tests** : `crm/src/components/prospection/__tests__/ProspectForm.test.tsx` + `CallResultDialog.test.tsx` — cas `clientId` undefined → comportement gracieux.
- **Validation** : `npm run lint` + `npm run typecheck` + `npm test`.
- **Dépendances** : aucune.

### PRO-H13 — Parsing sûr des réponses d'erreur calendar
- **Severity** : HIGH · **Taille** : S · **Branch** : `fix/pro-h13-calendar-error-parsing`
- **Fichiers** : `crm/src/hooks/use-calendar.ts:24, 44`.
- **Problème** : `response.json()` sans guard casse sur 502/504 HTML → `"Unexpected token '<'"`.
- **Fix** :
  ```ts
  async function parseApiError(response: Response): Promise<string> {
    const ct = response.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      return `Erreur serveur (${response.status})`;
    }
    try {
      const payload = await response.json();
      return payload.error ?? payload.message ?? `Erreur ${response.status}`;
    } catch {
      return `Erreur ${response.status}`;
    }
  }
  ```
- **Acceptance criteria**
  - GIVEN réponse 502 HTML WHEN hook reçoit l'erreur THEN message humain propre (pas de stack parse).
  - GIVEN réponse 400 JSON `{error: "..."}` THEN le message est bien propagé.
- **Tests** : `crm/src/hooks/__tests__/use-calendar.test.ts` — 2 fixtures (HTML 502 vs JSON 400).
- **Validation** : `npm run lint` + `npm test -- use-calendar`.
- **Dépendances** : aucune.

### PRO-TRX-1 — CI gate `react-hooks/set-state-in-effect` ⏳ NOT STARTED (bloqué sur 85 erreurs lint pré-existantes — envisager overrides scopés à `crm/src/components/prospection/**`)
- **Severity** : HIGH (transverse) · **Taille** : S · **Branch** : `chore/pro-trx1-lint-ci-gate`
- **Fichiers** : `crm/eslint.config.mjs` (ou `.eslintrc.json`), `.github/workflows/ci.yml`.
- **Problème** : Le même anti-pattern (H5/H7/H8) est apparu 3 fois de suite ; un hotfix `8e1405f7` avait déjà corrigé une occurrence.
- **Fix** :
  1. S'assurer que la règle `react-hooks/set-state-in-effect` est au niveau `error` dans la config ESLint du package `crm/`.
  2. Ajouter un step CI dédié qui fait échouer la build sur n'importe quelle erreur ESLint (`npm run lint -- --max-warnings 0`).
  3. Documenter dans `crm/CLAUDE.md` sous "Code Style" la règle et le pattern de remplacement (key prop / useMemo).
- **Acceptance criteria**
  - GIVEN un PR réintroduisant `setState` dans `useEffect` WHEN CI tourne THEN pipeline échoue avec l'erreur ESLint explicite.
  - `npm run lint` local reporte 0 erreur sur `crm/src/` après H5/H7/H8 résolus.
- **Tests** : test manuel via PR d'exemple (créer une branche "canary", vérifier l'échec CI, puis la supprimer).
- **Validation** : `npm run lint` + push sur feature et vérifier CI GitHub Actions.
- **Dépendances** : **doit être merged APRÈS H5/H7/H8** pour ne pas casser `develop`.

### PRO-TRX-2 — Rotation des tokens OAuth existants après déploiement C1 ⏳ STAGING DONE (2026-04-17), PROD PENDING (fenêtre dimanche 20h CEST)
- **Severity** : HIGH (ops — transverse) · **Taille** : S · **Branch** : N/A (runbook)
- **Fichiers** : nouveau `docs/runbooks/rotate-oauth-tokens-2026-04.md`.
- **Problème** : Tant que C1 n'est pas déployé, les tokens déjà distribués à des sessions client restent exploitables (copiés par XSS éventuelle, loggés dans proxies, etc.).
- **Fix / Runbook** :
  1. Vider la table des sessions NextAuth si stockage DB (non applicable ici — JWT only).
  2. Documenter la procédure de révocation Google (`https://security.google.com/settings/security/permissions`) et Microsoft (`https://myapps.microsoft.com`) pour les comptes admin.
  3. Invalider `AUTH_SECRET` pour forcer re-signature JWT (coupe toutes les sessions en cours).
  4. Communiquer aux utilisateurs actifs qu'ils devront se reconnecter.
- **Acceptance criteria**
  - Runbook validé par l'équipe ops.
  - Procédure testée en staging avant d'appliquer en prod.
- **Dépendances** : dépend de **C1** mergé + déployé.

---

# EPIC 2 — Prospection Code Quality
**Objectif** : durabilité et cohérence.
**Scope** : M1 → M25.
**Sprint 3 (et +)**. Prioriser dans l'ordre indiqué pour éviter les re-refactors.

### Ordre d'exécution recommandé dans l'epic
1. **M2** (duplication x5) **avant** M3/M6 — sinon on refactore 5 fois.
2. **M8** (constants dédoublonnées) **avant** tout travail sur `prospect.ts`.
3. **M11** (utils partagés Lead) **avant** M13, M22.
4. M5, M1, M4, M9, M10, M12, M14, M15, M16, M17, M18 — indépendants.
5. Agenda : M19 → M20 → M21 → M22 → M23 → M24 → M25.

## Data layer

### PRO-M1 — Pagination / garde-fou `select("*")`
- **Taille** : S · **Fichier** : `crm/src/hooks/use-prospects.ts:82`.
- **Fix** : ajouter `.limit(500)` + TODO pour pagination future (spec à créer si besoin).
- **AC** : GIVEN > 500 contacts WHEN on liste THEN la query s'arrête à 500 et logue un warning.
- **Tests** : étendre `use-prospects.test.ts` — mock Supabase renvoie 600, assert 500.
- **Dépendances** : aucune.

### PRO-M2 — Extraire `enrichWithClientNames()`
- **Taille** : M · **Fichiers** : `crm/src/hooks/use-prospects.ts:183, 635, 692, 740, 797`.
- **Fix** : créer `crm/src/hooks/helpers/enrich-with-clients.ts`, factoriser les 5 call-sites.
- **AC** : grep pour les 5 patterns retourne 1 seul emplacement ; comportement identique (couverture de tests).
- **Tests** : co-loc `helpers/__tests__/enrich-with-clients.test.ts` + ne pas casser les tests existants de `use-prospects`.
- **Dépendances** : **doit précéder M3 et M6** (mêmes fichiers).

### PRO-M3 — Stabiliser la key de `useProspectionKPIs`
- **Taille** : S · **Fichier** : `crm/src/hooks/use-prospects.ts:565`.
- **Fix** : `useMemo` sur un hash stable d'IDs (`prospects?.map(p => p.id).join(",")`) pour la query key.
- **AC** : dev tools React Query — la query ne re-run pas à chaque render parent.
- **Tests** : test "same ids → same cache entry".
- **Dépendances** : M2.

### PRO-M4 — Refactorer tests `useProspectionKPIs` en renderHook
- **Taille** : M · **Fichier** : `crm/src/hooks/__tests__/use-prospects.test.ts:1027-1128`.
- **Fix** : remplacer la ré-implémentation de la logique par `renderHook(() => useProspectionKPIs(), { wrapper })` avec données mockées.
- **AC** : tests vérifient le comportement du hook (pas le calcul dupliqué).
- **Dépendances** : M3 (hook stabilisé).

### PRO-M5 — SIRET strict 14 chiffres
- **Taille** : S · **Fichier** : `crm/src/lib/schemas/prospect.ts:92`.
- **Fix** : `z.string().regex(/^\d{14}$/, "SIRET invalide").optional()`.
- **AC** : 3 cas test (13 chiffres → erreur, 14 avec lettres → erreur, 14 OK).
- **Tests** : `prospect.test.ts`.

### PRO-M6 — Unifier `refetch` vs `invalidate` dans mutations
- **Taille** : S · **Fichier** : `crm/src/hooks/use-prospects.ts:302-306 vs 389`.
- **Fix** : adopter `invalidateQueries` partout (pattern projet — voir `use-factures`).
- **AC** : grep `refetch()` → aucun résultat dans mutations `use-prospects.ts`.
- **Dépendances** : M2.

### PRO-M7 — Tests hooks manquants
- **Taille** : M · **Fichier** : `crm/src/hooks/__tests__/use-prospects.test.ts` (extension).
- **Fix** : ajouter tests pour `useUpdateContact`, `useDeleteContact`, `useUpcomingRdvProspects`, `useContactsByClient`.
- **AC** : 4 blocs `describe` ajoutés, couverture ≥ 60 % sur ces hooks.

### PRO-M8 — Dédupliquer `PROSPECT_SOURCES` / `PROSPECT_STATUTS`
- **Taille** : S · **Fichiers** : `crm/src/lib/schemas/prospect.ts:18-26`, `crm/src/types/constants.ts`.
- **Fix** : importer depuis `types/constants.ts` dans le schéma (single source of truth).
- **AC** : grep `PROSPECT_SOURCES` → 1 seule déclaration.

## UI

### PRO-M9 — Virer `useEffect` de navigation d'onglet
- **Taille** : S · **Fichier** : `crm/src/components/prospection/ProspectForm.tsx:177-181, 327`.
- **Fix** : appeler `setActiveTab` directement dans `handleSubmit`.

### PRO-M10 — Escape conditionnel dans dialogues
- **Taille** : S · **Fichiers** : `ProspectForm.tsx:647-648`, `CallResultDialog.tsx:554-555`.
- **Fix** : ne bloquer `onKeyDownCapture` que si `isSubmitting`.

### PRO-M11 — Extraire `prospection/utils.ts`
- **Taille** : M · **Fichiers** : `LeadCard.tsx`, `LeadListTable.tsx`.
- **Fix** : créer `crm/src/components/prospection/utils.ts` avec `isToday`, `isOverdue`, badge helpers ; dédupliquer.
- **Dépendances** : **doit précéder M13, M22**.

### PRO-M12 — Supprimer index keys dans preview import
- **Taille** : S · **Fichier** : `LeadImportDialog.tsx:437`. Utiliser un identifiant stable (hash ligne).

### PRO-M13 — Error state dans `ProspectionKPIs`
- **Taille** : S · **Fichier** : `ProspectionKPIs.tsx:9`. Gérer `isError` + fallback toast.

### PRO-M14 — Nesting `DialogTitle` — fix aria
- **Taille** : S · **Fichier** : `CallResultDialog.tsx:550`.

### PRO-M15 — Échapper les apostrophes
- **Taille** : S · **Fichier** : `LeadCard.tsx:504,534,565`. `&apos;` ou `{"'"}`.

### PRO-M16 — Exporter `ProspectionKPIData`
- **Taille** : S · **Fichier** : `ProspectionKPIs.tsx` + test `__tests__/ProspectionKPIs.test.tsx:17`.

### PRO-M17 — Nettoyer imports / states morts
- **Taille** : S · **Fichiers** : `ProspectForm.tsx:55,122`, `CallResultDialog.tsx:47,890`, `PastRdvNotifications.tsx:8`, `EmailComposer.tsx:73`.

### PRO-M18 — Sync `resultOptions` ↔ `callResultSchema`
- **Taille** : S · **Fichier** : `CallResultDialog.tsx:325-328, 1291`. Dériver `resultOptions` depuis le schéma Zod (`schema.options`).

## Agenda

### PRO-M19 — Supprimer le double toast
- **Taille** : S · **Fichier** : `CreateEventDialog.tsx:228, 244`.

### PRO-M20 — Pagination events calendar
- **Taille** : M · **Fichier** : `app/api/calendar/events/route.ts:34`. Propager `pageToken` / `nextPageToken` de Google/MS Graph.

### PRO-M21 — Pré-bucket events par jour (useMemo)
- **Taille** : S · **Fichier** : `WeekCalendar.tsx:138-141`. Remplacer `filter()` x91 par un `Map<dateKey, Event[]>`.

### PRO-M22 — Keys stables pour attendees
- **Taille** : S · **Fichier** : `EventCard.tsx:66`. Utiliser l'email ou un `crypto.randomUUID()`.
- **Dépendances** : M11 (utilisation utils).

### PRO-M23 — Titre RDV vide si pas de prospect
- **Taille** : S · **Fichier** : `ProspectionAgendaView.tsx:94`. Désactiver ou pré-remplir titre par défaut.

### PRO-M24 — Keyboard nav / ARIA sur calendrier
- **Taille** : M · **Fichier** : `WeekCalendar.tsx:144-162`. `role="grid"`, `tabIndex`, `aria-label`, flèches clavier.

### PRO-M25 — Backfill tests `agenda/*` + `google-calendar.ts`
- **Taille** : L · **Fichiers** : nouveaux `__tests__/` dans `components/prospection/agenda/` + `lib/__tests__/google-calendar.test.ts`.
- **Dépendances** : H11, H12 (helpers stables à tester), M20, M21.
- **Lien spec** : **spec 008-test-coverage** (Phase 3 Composants — cf. `crm/CLAUDE.md#008-test-coverage`).

---

# EPIC 3 — Prospection Tech Debt
**Objectif** : dette technique / polish.
**Scope** : L1 → L6 + backfill global tests (spec 008).

### PRO-L1 — Try/catch autour de `clipboard.writeText`
- **Taille** : S · **Fichier** : `page.tsx:89`.

### PRO-L2 — Cas "Dimanche = semaine vide"
- **Taille** : S · **Fichier** : `use-prospects.ts:64-71`. Décaler `endOfWeek` d'une semaine si aujourd'hui = dimanche.

### PRO-L3 — `console.*` en prod
- **Taille** : S · **Fichiers** : `ProspectForm.tsx:299`, `CreateEventDialog.tsx:236`. Remplacer par `log` structurée (si utilitaire projet) ou supprimer.

### PRO-L4 — Mapping UX "Rappeler" vs "Contact établi"
- **Taille** : S · **Fichier** : `ProspectProgressStepper.tsx:56`. Décision produit requise : renommer ou re-mapper.

### PRO-L5 — Tests composants manquants
- **Taille** : L · **Fichiers** : nouveaux `__tests__/` pour `InteractionEditDialog`, `ProspectForm`, `LeadImportDialog`, `CompanySearch`.
- **Lien** : spec 008.

### PRO-L6 — `window.location.href` fuite dans description Calendar
- **Taille** : S · **Fichier** : `CreateEventDialog.tsx:96, 118`. Utiliser une URL relative explicite (`/prospection/${id}`) ou un base URL env.

### PRO-L7 (nouvelle) — Backfill spec 008-test-coverage Phase 1-3 pour prospection
- **Taille** : XL · **Spec** : `crm/specs/008-test-coverage/`.
- **Scope** : toutes les stories M7, M25, L5 regroupées.
- **Dépendances** : M2, M11, H1, H2 (mappers + utils stabilisés).

---

## Graph de dépendances

```
                                   TRX-1 (CI gate)
                                      ▲
                                      │ AFTER
            ┌────────┬────────┬───────┴──────┐
            │        │        │              │
          H5/H7/H8 ──┘        │              │
              │                │              │
              │   C1 ◄────────── TRX-2 (runbook post-deploy)
              │
              ▼
Sprint 1  [C1][H5][H7][H8][H10][H11][H12]  ──────► bloquant merge main

Sprint 2  H1 ──► H2
          │
          ▼
          M2 ──► M3 ──► M4
             ╲      ╲
              ╲      ╲──► M6
               ╲
                ╲────► L7 (008-test-coverage)
          H3, H4, H6, H9, H13 (parallèles)

Sprint 3  M8 ──► (toutes les stories qui lisent les enums)
          M11 ──► M13, M22
          H11, H12 ──► M19→M25 (agenda)
          M5, M1, M4, M9, M10, M12, M14, M15, M16, M17, M18 (parallèles)

Sprint 4+ L1–L6, L7
```

---

## Checklist de validation par sprint

### Sprint 1 (bloquant merge `main`)
- [x] **C1** mergé — grep `session\.accessToken` : 0 résultat hors serveur ✅
- [x] **H5, H7, H8** mergés — 0 erreur `react-hooks/set-state-in-effect` sur ces 3 fichiers ✅
- [x] **H10** mergé — 8 tests CSV (ext, taille limite, vide, xlsx, no-extension, MIME-spoofed, case-insensitive) ✅
- [x] **H11** mergé — test mutation de prop `initialDate` passe (defensive clone) ✅
- [x] **H12** mergé — helper supprimé (zéro caller), 15 tests pinnent le vrai contrat timezone de `createEventPayload` ✅
- [x] `cd crm && npm run lint && npm test && npm run build` → 0 NOUVELLE erreur (85 pré-existantes hors scope) ✅
- [x] PR #70 `fix/prospection-hardening-sprint1` → `develop` mergée ✅
- [x] Hotfix #71 + #72 (`getToken` cookie + secret) mergés ✅
- [x] Smoke test staging validé (OAuth Google + hasCalendarAccess + pas d'accessToken) ✅
- [x] **PR `develop` → `main`** mergée (PR #73, commit `4ccd3c54`, 2026-04-17 07:09 UTC) ✅
- [x] **TRX-2 runbook** exécuté en staging (rotation `AUTH_SECRET` + validation session shape) ✅
- [ ] **TRX-2 runbook** exécuté en prod — planifié dimanche 20h CEST
- [x] Issues GitHub #22-#28 + #37 fermées automatiquement par le merge main ✅

### Sprint 2
- [ ] **H1, H2, H3, H4, H6, H9, H13** mergés.
- [ ] Tests mappers + Zod passent (nouveaux fichiers `contact.mapper.test.ts`).
- [ ] **TRX-1** actif — un PR de régression d'essai échoue en CI.
- [ ] `npm run build` < 60 s, bundle inchangé (à vérifier).

### Sprint 3
- [ ] **M2 mergé AVANT M3/M6** — vérifier l'ordre de commit dans `git log`.
- [ ] **M8 mergé AVANT tout travail** touchant `prospect.ts`.
- [ ] **M11 mergé AVANT M13/M22**.
- [ ] Lot agenda (M19→M25) complet + fichier `__tests__/agenda/` présent.
- [ ] Coverage Vitest prospection ≥ 50 % (baseline vers spec 008).

### Sprint 4+ (tech debt)
- [ ] L1–L6 traités ou tracked en issue GitHub.
- [ ] L7 — spec 008 Phase 1 à 3 close pour le périmètre prospection.
- [ ] Rétrospective : vérifier qu'aucune occurrence de `react-hooks/set-state-in-effect` n'a été réintroduite (confirmation TRX-1).

---

## NOT Building

- Refonte du module Calendar au-delà de H11/H12 (pagination full M20 ok, mais pas d'ajout de provider).
- Migration vers un autre provider OAuth (Azure B2C, Auth0…).
- Refactor global du dossier `agenda/` au-delà des findings listés.
- Nouvelle feature produit (ex. récurrence RDV) — hors scope review.
- Réécriture des tests 007-refactorisation — seul le backfill ciblé prospection/agenda est inclus.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| C1 casse des intégrations tierces lisant `session.accessToken` côté client | M | H | Grep exhaustif, migration via `hasCalendarAccess`, tests e2e calendar/email |
| TRX-1 bloque tous les PRs tant que H5/H7/H8 ne sont pas mergés | H | M | Mettre TRX-1 en dernière étape du sprint 1 |
| H2 (join Supabase) dépasse la limite de colonnes PostgREST | L | M | Valider en staging, fallback vers 2 queries optimisées |
| M2 casse silencieusement une des 5 duplications si leurs signatures divergent | M | M | Tests caractérisation AVANT refactor, snapshot des payloads |
| Agenda tests (M25) nécessitent mocks Google/MS Graph complexes | M | M | Utiliser `msw` ou factoriser mocks dans `test/mocks/calendar.ts` |
| Déploiement C1 invalide toutes les sessions actives | H | L | Communiquer via TRX-2 runbook + choisir une fenêtre creuse |

---

## Notes

- Convention de commit suggérée pour chaque story :
  - `security: pro-c1 move oauth token server-side`
  - `fix(prospection): pro-h7 replace setState-in-effect with key pattern in InteractionEditDialog`
  - `refactor(prospection): pro-m2 extract enrichWithClientNames helper`
  - `test(prospection): pro-m25 add agenda component coverage`
  - `chore(ci): pro-trx1 fail build on react-hooks/set-state-in-effect`
- Un PR par story recommandé (ou par petit lot cohérent — e.g. H4+H5 sur même fichier) pour faciliter la review et la rollback.
- Après chaque sprint : régénérer coverage (`npm run test:coverage`) et logger la variation dans le PR description.

## Next Steps

**Sprint 1 = DONE en `main` + prod. TRX-2 staging DONE. Reprendre ici dans une nouvelle conversation :**

1. ~~Ouvrir la PR `develop → main`~~ ✅ PR #73 mergée
2. ~~TRX-2 staging~~ ✅ exécuté 2026-04-17
3. **TRX-2 prod** — planifier fenêtre dimanche 20h CEST, suivre la §Production du runbook (comm Slack 1h avant, nouveau secret, Coolify redeploy, validation post-rotation).
4. **Sprint 2** (indépendant de TRX-2 prod) : `/ecc:prp-implement --stories PRO-H1,PRO-H2,PRO-H3,PRO-H4,PRO-H6,PRO-H9,PRO-H13` depuis une branche `fix/prospection-hardening-sprint2` créée depuis `develop`.
5. **PRO-TRX-1** (CI gate lint) — parallèle Sprint 2, scope règle à `crm/src/components/prospection/**` via `overrides` ESLint pour éviter les 85 erreurs pré-existantes.

**Pour une continuation en nouvelle conversation** : lire dans l'ordre
- Status block en haut de ce fichier → état courant
- `.claude/PRPs/reports/pro-c1-oauth-token-leak-report.md` + `pro-h5-h8-setstate-report.md` + `pro-h7-interaction-edit-setstate-report.md` → détail des implémentations
- `.claude/PRPs/reviews/pro-c1-review-2026-04-16.md` → pour comprendre pourquoi le fix PRO-C1 a été révisé avant merge
- `crm/src/lib/auth-helpers.ts` (surtout le docstring de `getServerAccessToken`) → les deux gotchas runtime à préserver (`secret` + `secureCookie`)
