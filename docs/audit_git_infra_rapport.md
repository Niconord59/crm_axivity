# Audit Complet — Projet CRM Axivity

**Date** : 2026-03-10

---

## Section 1 — État actuel du dépôt Git

| Élément | Statut |
|---------|--------|
| **Nom** | `crm_axivity` |
| **URL** | `https://github.com/Niconord59/crm_axivity.git` |
| **Branche active** | `main` |
| **Branches locales** | `main`, `master`, `011-facturation-acomptes`, `feat/linkedin-field-and-interaction-edit`, `fix/multi-tab-session-sync`, `refactor/project-structure` |
| **Branches remote** | 10 branches (dont plusieurs `fix/` et `feat/` non mergées) |
| **Total commits** | ~219 |

### Fichiers de configuration

| Fichier | Présent ? | Qualité |
|---------|-----------|---------|
| `.gitignore` | **Oui** | Bon — couvre `node_modules`, `.env*`, `.next/`, IDE, logs |
| `README.md` | **Oui** | Présent (basique) |
| `.env.example` | **Oui** (`crm/.env.example`) | Bon — contient les placeholders sans valeurs réelles |
| `.github/` (CI/CD) | **Non** | Aucun workflow GitHub Actions |

### Secrets committés ?

- **`.claude/.mcp.json`** contient la **clé anon Supabase** en clair, mais ce fichier n'est **PAS tracké par git** (pas dans le repo). Pas de fuite.
- **`crm/.env.local`** contient probablement les vraies clés mais est **correctement exclu** par `.gitignore`.
- **Aucun JWT/API key n'a été trouvé dans le code source TypeScript/JSON tracké.** Situation saine.

### Qualité des messages de commit

Les messages suivent déjà une **convention Conventional Commits** (type + scope) :

```
fix(auth): resolve GoTrue lock deadlock causing data loss on F5
feat(prospection): add business card scanner for mobile prospecting
chore: remove debug console.log statements from client-side code
security(P1-02,P2-01): protect business data, auth monitoring
debug(auth): add logging to trace data loading on second F5
```

> Les commits `debug(...)` devraient idéalement être squashés avant merge dans `main`.

---

## Section 2 — État actuel de Coolify

| Élément | Valeur |
|---------|--------|
| **Applications déployées** | **2** : le CRM Next.js (`crm.axivity.cloud`) + Supabase self-hosted (`supabase.axivity.cloud`) |
| **Branche de déploiement prod** | `main` |
| **Environnement staging** | **Non** — aucun environnement staging séparé |
| **URL production** | `https://crm.axivity.cloud` |
| **Health check** | Configuré (`/api/health`, interval 30s) |
| **Watch Paths** | Seuls les changements dans `crm/**` déclenchent un redéploiement |

---

## Section 3 — État actuel de Supabase

| Élément | Valeur |
|---------|--------|
| **Instances Supabase** | **1 seule** (production, self-hosted via Coolify) |
| **URL** | `https://supabase.axivity.cloud` |
| **Variables d'env** | Correctement dans `.env.local` / Coolify, **absentes du code source** |
| **Fichiers de migration** | **Oui** — 30 migrations dans `supabase/migrations/` + 26 scripts de sécurité dans `security/` |
| **Données sensibles** | **Oui** — noms clients, emails, téléphones, SIRET, adresses, données financières (factures, montants) |

> Il existe des doublons de numérotation (deux `11_*.sql`, deux `15_*.sql`, deux `20_*.sql`) ce qui suggère que les migrations ont été créées de manière ad hoc plutôt qu'avec un outil de gestion séquentielle.

---

## Section 4 — Habitudes Git actuelles

| Pratique | État |
|----------|------|
| **Style commits** | Conventional Commits — déjà en place et bien appliqué |
| **Push sur main** | **Mixte** — certains commits sont directement sur `main`, d'autres passent par des branches |
| **Pull Requests** | **Oui, partiellement** — 8 PRs mergées (#2 à #13), mais beaucoup de commits directs sur `main` aussi |
| **Tests automatisés** | **Oui (local)** — 968+ tests Vitest. **Mais aucun CI/CD** (pas de GitHub Actions) |
| **Linter** | **Oui (local)** — ESLint 9 configuré via `npm run lint`, mais pas exécuté en CI |
| **Protection de branche** | **Non** — aucune règle de protection sur `main` |

---

## Plan d'action proposé

### Étape 1 — Stratégie de branches

**Risque : Aucun** (pas d'impact sur la prod)

```bash
# Créer la branche develop à partir de main
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

Convention à adopter :
- `main` → production (déploiement automatique via Coolify)
- `develop` → staging (futur déploiement staging)
- `feature/xxx`, `fix/xxx` → branches de travail, mergées vers `develop` via PR

---

### Étape 2 — Protection de `main` sur GitHub

**Risque : Aucun** (protection bloque, ne casse rien)

**Actions dans GitHub → Settings → Branches → Add rule :**

| Règle | Valeur |
|-------|--------|
| Branch name pattern | `main` |
| Require pull request before merging | **Oui** |
| Required approvals | 1 (ou 0 si tu travailles seul) |
| Require status checks | Oui (à activer après l'étape 8) |
| Include administrators | **Oui** |
| Require linear history | Optionnel |

---

### Étape 3 — Application staging dans Coolify

**Risque : Aucun** (nouvelle app, indépendante de la prod)

**Actions dans Coolify :**

1. **Créer une nouvelle application** (New Resource → Application)
2. Source : même repo GitHub `Niconord59/crm_axivity`
3. **Branche** : `develop`
4. **Domaine** : `staging.axivity.cloud` (ou `crm-staging.axivity.cloud`)
5. **Port** : 3000
6. Variables d'environnement : copier celles de prod, **changer les URLs Supabase** pour pointer vers le staging (étape 4)
7. Watch Paths : `crm/**`

---

### Étape 4 — Instance Supabase staging

**Risque : Moyen** — il faut bien séparer les variables d'env pour ne pas que le staging écrive dans la prod.

**Option A — Nouveau projet Supabase dans Coolify :**

1. Déployer un second template Supabase dans Coolify
2. Domaine : `supabase-staging.axivity.cloud`
3. Appliquer toutes les migrations SQL (`00` à `25` + security) sur cette instance
4. Configurer l'app staging (étape 3) avec les variables de ce nouveau Supabase

**Option B — Supabase Cloud gratuit :**
- Créer un projet sur `supabase.com` (tier gratuit)
- Plus simple, mais données hors de ton infra

**Recommandation : Option A** pour garder le contrôle total.

---

### Étape 5 — Migration des données (prod → staging)

**Risque : Élevé si mal fait** — ne jamais exporter de données sensibles sans anonymisation.

**Approche recommandée :**

1. **Exporter la structure** (déjà versionnée dans les migrations — on les rejoue sur staging)
2. **Données de test** : utiliser `06_test_data.sql` ou créer un script `seed-staging.sql` avec des données fictives
3. **Si copie nécessaire** : exporter avec `pg_dump --data-only` depuis prod, puis anonymiser avec un script SQL :

```sql
-- Exemple d'anonymisation
UPDATE clients SET
  nom = 'Client Test ' || id,
  email = 'test' || id || '@example.com',
  telephone = '0600000000',
  siret = '00000000000000',
  adresse = '1 rue du Test';

UPDATE contacts SET
  nom = 'Contact ' || id,
  prenom = 'Test',
  email = 'contact' || id || '@example.com',
  telephone = '0600000000';
```

**Valider le script d'anonymisation avant exécution.**

---

### Étape 6 — Fichiers de migration SQL versionnés

**Risque : Aucun** (c'est déjà en partie fait)

**Corrections à apporter :**

1. **Renommer les doublons** pour avoir une numérotation strictement séquentielle (ou passer au format timestamp `YYYYMMDDHHMMSS_*.sql`)
2. **Ajouter un README** dans `supabase/migrations/` documentant l'ordre d'exécution
3. **Convention future** : toute modification de schéma = nouveau fichier de migration numéroté, jamais de modification directe via l'UI Supabase

---

### Étape 7 — Convention de commits (déjà en place)

**État : Déjà bon !** Conventional Commits utilisé.

**Améliorations mineures :**

1. Éviter les commits `debug(...)` dans `main` — squasher avant merge
2. Ajouter un outil de validation optionnel :

```bash
cd crm && npm install -D @commitlint/cli @commitlint/config-conventional
```

Fichier `commitlint.config.js` à la racine :
```js
module.exports = { extends: ['@commitlint/config-conventional'] };
```

---

### Étape 8 — Pipeline CI minimal (GitHub Actions)

**Risque : Aucun** (ne touche pas au déploiement actuel)

Créer `.github/workflows/ci.yml` :

```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]
    paths: ['crm/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: crm/package-lock.json

      - name: Install dependencies
        working-directory: crm
        run: npm ci

      - name: Lint
        working-directory: crm
        run: npm run lint

      - name: Test
        working-directory: crm
        run: npm test -- --run

      - name: Build
        working-directory: crm
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://fake.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: fake-key-for-build
```

---

## Résumé des priorités

| # | Étape | Risque | Effort |
|---|-------|--------|--------|
| 1 | Créer branche `develop` | Aucun | 2 min |
| 2 | Protéger `main` sur GitHub | Aucun | 5 min |
| 8 | Pipeline CI (GitHub Actions) | Aucun | 15 min |
| 7 | Commitlint (optionnel) | Aucun | 5 min |
| 3 | App staging Coolify | Aucun | 20 min |
| 4 | Supabase staging | Moyen | 30-60 min |
| 6 | Nettoyer numérotation migrations | Aucun | 15 min |
| 5 | Migration + anonymisation données | Élevé | 30 min |
