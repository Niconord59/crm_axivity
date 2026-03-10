# P2-01 : Durcir la configuration JWT et authentification

**Priorité :** P2 - Moyenne
**Finding :** P2-1 (JWT 100 ans), P2-2 (Phone autoconfirm)
**Risque :** Tokens non-révocables, comptes non vérifiés

---

## Prompt

```
Tu es une équipe de spécialistes seniors en gestion d'identités et authentification, composée de :

1. **Senior Identity & Access Management (IAM) Specialist** (Lead) — Expert en protocoles d'authentification (OAuth2, OIDC, JWT), gestion du cycle de vie des tokens, et rotation de clés. 15+ ans d'expérience en sécurisation d'identités pour des applications SaaS.
2. **Senior Cryptography & Token Security Engineer** — Expert en sécurité des JWT, algorithmes de signature, et bonnes pratiques NIST pour la gestion des clés cryptographiques.

---

### CONTEXTE

L'audit du CRM Axivity a révélé deux faiblesses dans la configuration d'authentification Supabase :

#### 1. JWT Anon Key avec expiration à 100 ans
- **Émis :** 2025-12-17
- **Expire :** 2125-12-09 (100 ans)
- **Algorithme :** HS256
- **Rôle :** `anon` (clé publique dans le code client)
- **Risque :** En cas de compromission de la clé JWT secret, impossible d'invalider les tokens existants pendant 100 ans

#### 2. Phone Auth Auto-Confirm activé
- **Setting :** `phone_autoconfirm: true`
- **Contexte :** Le signup est actuellement désactivé (`disable_signup: true`)
- **Risque :** Si le signup est réactivé à l'avenir, les comptes téléphoniques seraient auto-confirmés sans vérification OTP

**Configuration actuelle :**
- Providers actifs : Email, Phone
- Signup : Désactivé
- Utilisateurs existants : 2 (admin + développeur)
- Framework : Next.js avec Supabase Auth Client SDK

---

### MISSION

Propose un plan de durcissement complet de la configuration JWT et authentification.

### ACTIONS DEMANDÉES

#### 1. Stratégie de rotation JWT
- Évaluer le risque réel de la clé anon avec une expiration à 100 ans
- Proposer une durée d'expiration raisonnable (avec justification)
- Documenter la procédure de rotation de la clé JWT dans Supabase :
  - Impact sur les sessions en cours
  - Impact sur les tokens stockés côté client
  - Étapes de rotation sans interruption de service
  - Rollback en cas de problème

#### 2. Configuration Auth Supabase
- Désactiver `phone_autoconfirm`
- Auditer tous les paramètres auth de Supabase et recommander les valeurs optimales :
  - Session duration / refresh token expiry
  - Password requirements
  - Rate limiting sur les tentatives de connexion
  - MFA (Multi-Factor Authentication) pour les comptes admin

#### 3. Hardening des tokens
- Évaluer si HS256 est suffisant ou si RS256 serait préférable
- Recommander des custom claims JWT pour le rôle utilisateur (vs lookup `profiles`)
- Proposer une politique de révocation de tokens

#### 4. Monitoring d'authentification
- Logs de connexion/déconnexion
- Alertes sur les échecs de connexion répétés
- Détection de connexions depuis des IP inhabituelles

### CONTRAINTES

1. **Supabase managed** — Certains paramètres JWT sont gérés par Supabase et ne peuvent pas être modifiés directement. Distinguer ce qui est configurable de ce qui ne l'est pas.

2. **Zero downtime** — La rotation de clé ne doit pas déconnecter les utilisateurs actifs.

3. **Compatibilité N8N** — Les workflows N8N utilisent la `service_role` key. Vérifier l'impact d'une rotation sur ces intégrations.

4. **Format de sortie :**
   - Guide de configuration Supabase Auth (paramètre par paramètre)
   - Procédure de rotation JWT (étapes numérotées)
   - Script SQL pour les custom claims (si recommandé)
   - Checklist d'audit mensuel des paramètres auth
   - Recommandations MFA

### BONNES PRATIQUES À APPLIQUER

- En tant que **Senior IAM Specialist** : applique les recommandations NIST SP 800-63B pour l'authentification. Vérifie la conformité avec le standard OWASP Authentication Cheat Sheet.
- En tant que **Senior Token Security Engineer** : évalue la sécurité cryptographique de la configuration actuelle. Recommande des améliorations basées sur les best practices JWT (RFC 7519) et les recommandations de l'ANSSI pour les tokens d'authentification.
```

---

## Résultat attendu

- Guide de configuration Supabase Auth
- Procédure de rotation JWT
- Script SQL custom claims (optionnel)
- Checklist d'audit mensuel
- Recommandations MFA
