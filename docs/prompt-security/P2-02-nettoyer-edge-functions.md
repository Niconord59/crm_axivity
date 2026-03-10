# P2-02 : Nettoyer et sécuriser les Edge Functions

**Priorité :** P2 - Moyenne
**Finding :** P2-3 (Error disclosure), P3-1 (Default function), P3-2 (Broken endpoints)
**Risque :** Divulgation d'informations internes, surface d'attaque inutile

---

## Prompt

```
Tu es une équipe de spécialistes seniors en sécurité cloud et DevOps, composée de :

1. **Senior Cloud Security Engineer** (Lead) — Expert en sécurisation de fonctions serverless (Deno, AWS Lambda, Cloudflare Workers), gestion des erreurs, et réduction de surface d'attaque. 12+ ans d'expérience.
2. **Senior DevOps / Platform Engineer** — Expert en CI/CD, gestion du cycle de vie des fonctions serverless, et monitoring de production. Spécialisé dans les déploiements Supabase Edge Functions.

---

### CONTEXTE

L'audit a identifié plusieurs problèmes avec les Edge Functions Supabase du CRM Axivity :

#### 1. Divulgation d'erreur — `send-email`
```
POST /functions/v1/send-email
→ InvalidWorkerCreation: worker boot error: failed to read path:
  No such file or directory (os error 2)
```
**Risque :** Révèle l'architecture interne (Deno workers, structure de fichiers).

#### 2. Fonction de test en production — `hello`
```
GET /functions/v1/hello
→ "Hello from Edge Functions!"
```
**Risque :** Artefact de développement, indique un manque de rigueur dans le processus de déploiement.

#### 3. Fonctions cassées — HTTP 500
| Endpoint | Status |
|----------|--------|
| `/functions/v1/webhook` | 500 |
| `/functions/v1/process` | 500 |
| `/functions/v1/generate` | 500 |
| `/functions/v1/notify` | 500 |
**Risque :** Surface d'attaque inutile, endpoints qui pourraient être exploités si un bug est découvert dans le runtime Deno.

---

### MISSION

Propose un plan complet de nettoyage et sécurisation des Edge Functions.

### ACTIONS DEMANDÉES

#### 1. Inventaire et décision
Pour chaque fonction, décider : **Supprimer**, **Réparer**, ou **Conserver** :

| Fonction | Décision proposée | Justification |
|----------|-------------------|---------------|
| `hello` | ? | |
| `send-email` | ? | |
| `webhook` | ? | |
| `process` | ? | |
| `generate` | ? | |
| `notify` | ? | |

#### 2. Suppression des fonctions inutiles
- Commandes Supabase CLI pour supprimer les fonctions
- Vérifier qu'aucun webhook ou intégration ne pointe vers ces endpoints
- Documenter les fonctions supprimées dans le changelog

#### 3. Sécurisation de `send-email` (si conservée)
- Corriger le bug de déploiement (fichier manquant)
- Ajouter un middleware d'authentification (vérifier le JWT)
- Implémenter un error handler qui ne divulgue pas les détails internes :
  ```typescript
  // Au lieu de laisser passer l'erreur brute
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
  ```
- Ajouter du rate limiting
- Valider les inputs (destinataire, sujet, corps)

#### 4. Bonnes pratiques pour les futures Edge Functions
- Template de base sécurisé (auth, error handling, CORS, rate limiting)
- Pipeline CI/CD pour déployer uniquement les fonctions testées
- Monitoring et alerting sur les erreurs 500

### CONTRAINTES

1. **Supabase CLI** — Utiliser `supabase functions delete <name>` pour supprimer.

2. **Vérifier les dépendances** — Avant de supprimer, vérifier si le frontend ou N8N appelle ces fonctions :
   ```bash
   grep -r "functions/v1/" crm/src/
   grep -r "send-email\|webhook\|process\|generate\|notify\|hello" crm/src/
   ```

3. **Environnement** — Les Edge Functions tournent sur Deno Deploy. Les variables d'environnement sensibles doivent être dans les Supabase Secrets, pas dans le code.

4. **Format de sortie :**
   - Tableau de décision (supprimer/réparer/conserver)
   - Commandes CLI de suppression
   - Template TypeScript sécurisé pour Edge Functions
   - Code corrigé pour `send-email` (si conservée)
   - Checklist de déploiement sécurisé
   - Configuration monitoring

### BONNES PRATIQUES À APPLIQUER

- En tant que **Senior Cloud Security Engineer** : applique le principe de surface d'attaque minimale. Chaque endpoint exposé est un risque potentiel — n'expose que ce qui est strictement nécessaire. Vérifie les headers de sécurité (CORS, CSP, X-Content-Type-Options).
- En tant que **Senior DevOps Engineer** : propose un workflow CI/CD qui empêche le déploiement de fonctions sans tests et sans review. Recommande un environnement de staging pour les Edge Functions.
```

---

## Résultat attendu

- Tableau de décision par fonction
- Commandes CLI de nettoyage
- Template Edge Function sécurisé
- Code `send-email` corrigé
- Pipeline CI/CD recommandé
