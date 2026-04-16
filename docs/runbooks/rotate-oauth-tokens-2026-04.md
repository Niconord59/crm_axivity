# Runbook — Rotation des tokens OAuth après déploiement PRO-C1

**ID** : PRO-TRX-2
**Créé** : 2026-04-16
**Dernière révision** : 2026-04-16
**Severity** : HIGH
**Durée estimée** : 20-30 min (staging), 30-45 min (prod + comm)
**Impact** : déconnexion de **tous** les utilisateurs actifs (comptes Google + Microsoft). Ils devront se reconnecter une fois.

---

## Contexte

La correction [PRO-C1](https://github.com/Niconord59/crm_axivity/issues/22) déplace le `accessToken` OAuth côté serveur uniquement. Mais **tant que ce runbook n'est pas exécuté**, les JWT déjà distribués aux navigateurs continuent de véhiculer le token au format exposé (`session.accessToken`). Ce runbook coupe court à cette fenêtre résiduelle.

Le token concerne deux providers :

| Provider | Scopes exposés |
|---|---|
| Google | `openid email profile`, `calendar`, `calendar.events`, `gmail.send` |
| Microsoft Entra ID | `openid email profile`, `User.Read`, `Calendars.ReadWrite`, `Mail.Send`, `offline_access` |

Ce sont des scopes **en lecture + envoi** (pas d'accès en écriture au Drive ni à la boîte de réception en lecture, mais envoi d'email et écriture de calendrier — suffisant pour du phishing sortant si compromis).

---

## Préambule — vérifications

Avant d'exécuter la rotation :

- [ ] Le commit [PRO-C1](../../crm/src/lib/auth.ts) est **mergé en `develop`** et **déployé sur `crm-staging.axivity.cloud`**.
- [ ] Le commit est **mergé en `main`** et **déployé sur `crm.axivity.cloud`**.
- [ ] Vérifier en staging que `fetch("/api/auth/session").then(r => r.json())` **ne retourne plus** de champ `accessToken` et retourne `hasCalendarAccess: true` pour une session connectée.
- [ ] Vérifier en prod la même chose.
- [ ] Prévenir l'équipe (Slack `#crm`) 15 min avant la fenêtre : "Reconnexion OAuth requise dans 15 min sur crm.axivity.cloud".

Si l'une de ces cases n'est pas cochée, **ne pas démarrer ce runbook** — la rotation serait inefficace ou causerait un incident inutile.

---

## Procédure — Staging d'abord

### 1. Invalider `AUTH_SECRET` sur staging

**Effet** : tous les JWT signés avec l'ancien secret deviennent indéchiffrables. Les sessions actives renverront une `RefreshTokenError` au prochain poll `/api/auth/session` et les utilisateurs seront redirigés vers `/login`.

```bash
# Générer un nouveau secret (Node)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# ou openssl
openssl rand -base64 32
```

Dans Coolify → projet `crm-staging.axivity.cloud` → Environment variables :
- [ ] Remplacer `AUTH_SECRET` par la nouvelle valeur.
- [ ] **Redeploy** le service (pas juste restart — pour que Next.js reload les vars).

Vérifier :
- [ ] `curl -s https://crm-staging.axivity.cloud/api/health` renvoie `{ "status": "ok" }`.
- [ ] Ouvrir un onglet incognito → `/login` est servi.
- [ ] Se connecter avec un compte Google test → arrive sur `/` connecté.
- [ ] `fetch("/api/auth/session")` → `hasCalendarAccess: true`, pas d'`accessToken`.
- [ ] Créer un RDV Calendar → succès.
- [ ] Envoyer un email test → succès.

Si un des tests échoue, **stopper** et investiguer avant de toucher la prod.

### 2. Révoquer les sessions OAuth actives (optionnel — côté user)

Cette étape n'est **pas obligatoire** : l'invalidation du secret suffit à couper les sessions. Elle est utile seulement si on a une raison spécifique de croire qu'un token a déjà été exfiltré (ex. incident XSS avéré).

#### Google (admin Workspace)

URL : https://admin.google.com → Security → Access and data control → API controls → **Manage Third-Party App Access**.

- [ ] Rechercher l'app `CRM Axivity` (client ID : `AUTH_GOOGLE_ID`).
- [ ] Pour chaque utilisateur concerné → Révoquer l'access.
- Documenter la liste des comptes révoqués dans l'incident log.

Pour un utilisateur individuel (auto-service) : https://myaccount.google.com/permissions → CRM Axivity → Supprimer l'accès.

#### Microsoft (admin Entra ID)

URL : https://entra.microsoft.com → Identity → Applications → Enterprise applications → `CRM Axivity`.

- [ ] Onglet **Users and groups** → identifier les comptes ciblés.
- [ ] Onglet **Permissions** → révoquer les consentements admin si besoin.

Pour un utilisateur individuel (auto-service) : https://myapps.microsoft.com → My Account → Organizations → CRM Axivity → Leave.

### 3. Validation staging

- [ ] Un utilisateur qui avait une session active voit un redirect `/login` à son prochain chargement.
- [ ] Après reconnexion, il peut créer un RDV + envoyer un email.
- [ ] Console navigateur : pas de `RefreshTokenError` persistante.
- [ ] Supabase `pg_stat_activity` : pas d'erreurs de session dans les logs Kong.

Si tout est vert → passer à la prod. Sinon → bloquer.

---

## Procédure — Production

### 1. Fenêtre de maintenance

Choisir une **fenêtre creuse** (weekend, soir). Recommandé :
- Dimanche 20h-21h CEST (trafic proche de zéro).
- **Éviter** les lundi matin et vendredi après-midi (charge commerciale).

### 2. Comm préalable

Poster dans Slack `#crm` **1h avant** :

> 🔐 **Maintenance sécurité — reconnexion OAuth requise**
>
> À **[HEURE]**, nous allons invalider toutes les sessions OAuth actives sur crm.axivity.cloud dans le cadre de la correction d'une faille de sécurité ([PRO-C1](https://github.com/Niconord59/crm_axivity/issues/22) — token OAuth exposé côté client).
>
> Après la maintenance (durée ~5 min), vous devrez **vous reconnecter une seule fois** via le bouton "Se connecter avec Google" ou "Se connecter avec Microsoft".
>
> Aucune donnée n'est perdue. Vos RDV calendrier et emails envoyés restent intacts.

Si un utilisateur est en plein envoi d'email ou création de RDV à la bascule, son action échouera — il reçoit un toast d'erreur et refait l'action après reconnexion. Pas de perte de données.

### 3. Appliquer la rotation en prod

Reproduire **exactement** l'étape "Staging d'abord — 1" sur Coolify → `crm.axivity.cloud` :

- [ ] Générer un nouveau `AUTH_SECRET` (différent de celui de staging).
- [ ] Remplacer la variable.
- [ ] **Redeploy** (pas restart).
- [ ] Health check OK : `curl -s https://crm.axivity.cloud/api/health`.

### 4. Validation prod

- [ ] Un utilisateur test (`axivity.cloud@gmail.com` ou compte QA) doit :
  - être déconnecté automatiquement,
  - pouvoir se reconnecter,
  - tester `fetch("/api/auth/session")` → pas d'`accessToken`,
  - créer un RDV + envoyer un email → OK.
- [ ] Pas de pic d'erreur `RefreshTokenError` > 5 min dans les logs Next.js.

### 5. Comm post-maintenance

Poster dans Slack `#crm` :

> ✅ Maintenance terminée. Reconnectez-vous sur crm.axivity.cloud avec Google ou Microsoft. Support : @nico si problème.

---

## Rollback

Si un problème bloquant apparaît après la rotation (ex. le nouveau secret empêche le redéploiement) :

1. Dans Coolify → restaurer l'ancienne valeur `AUTH_SECRET` depuis l'historique des variables (Coolify garde un historique).
2. Redéployer.
3. Les sessions pré-bascule redeviennent valides **mais la vulnérabilité PRO-C1 résiduelle revient** — flaguer comme incident et replanifier.

**Ne pas** stocker l'ancien secret en dehors de Coolify. Ne pas le commiter. Ne pas le partager par Slack ou email.

---

## Post-mortem checklist

À remplir dans les 48h après l'exécution :

- [ ] Date + heure d'exécution staging : ________
- [ ] Date + heure d'exécution prod : ________
- [ ] Nombre d'utilisateurs reconnectés dans les 24h : ________
- [ ] Tickets support reçus : ________
- [ ] Anomalies détectées : ________
- [ ] Fermer l'issue [#37 PRO-TRX-2](https://github.com/Niconord59/crm_axivity/issues/37).
- [ ] Fermer l'issue [#22 PRO-C1](https://github.com/Niconord59/crm_axivity/issues/22) si pas déjà fermée par la merge en `main`.

---

## Références

- Issue PRO-C1 : https://github.com/Niconord59/crm_axivity/issues/22
- Issue PRO-TRX-2 : https://github.com/Niconord59/crm_axivity/issues/37
- Code review PRO-C1 : `.claude/PRPs/reviews/pro-c1-review-2026-04-16.md`
- Rapport d'implémentation : `.claude/PRPs/reports/pro-c1-oauth-token-leak-report.md`
- Plan de remédiation : `.claude/PRPs/plans/prospection-remediation-plan.md`
- Documentation NextAuth v5 JWT : https://authjs.dev/concepts/session-strategies#jwt
