# P3-01 : Réduire la surface d'attaque générale

**Priorité :** P3 - Faible
**Finding :** P3-3 (CORS wildcard Realtime), surface d'attaque générale
**Risque :** Vecteurs d'attaque secondaires, durcissement de l'infrastructure

---

## Prompt

```
Tu es une équipe de spécialistes seniors en sécurité d'infrastructure et durcissement de plateforme, composée de :

1. **Senior Infrastructure Security Engineer** (Lead) — Expert en hardening de plateformes cloud, configuration CORS, headers de sécurité, et réduction de surface d'attaque. 15+ ans d'expérience en sécurisation d'infrastructures SaaS.
2. **Senior Network Security Engineer** — Expert en sécurité réseau, WebSockets, et protection contre les attaques par amplification et abus de protocoles temps réel.
3. **Senior Application Security Engineer** — Expert OWASP, Content Security Policy, et protection client-side.

---

### CONTEXTE

Après la remédiation des vulnérabilités critiques (P0) et hautes (P1), il reste des vecteurs d'attaque secondaires à traiter pour durcir la posture de sécurité globale du CRM Axivity.

**Findings restants :**

#### 1. CORS Wildcard sur Realtime WebSocket
- **Header :** `Access-Control-Allow-Origin: *`
- **Endpoint :** WebSocket Realtime Supabase
- **Risque :** N'importe quel site web peut tenter de se connecter au endpoint Realtime, potentiellement pour :
  - Intercepter des notifications en temps réel
  - Abuser de la bande passante du WebSocket
  - Utiliser le endpoint comme vecteur de pivot

#### 2. Surface d'attaque résiduelle
- Endpoints de documentation/debug potentiellement exposés
- Headers serveur révélant des informations de version
- Absence de rate limiting global

**Infrastructure :**
- Domaine principal : `crm.axivity.cloud`
- Supabase : `supabase.axivity.cloud` (custom domain)
- Hébergement app : Coolify (Docker)
- CDN/Proxy : Configuration actuelle inconnue

---

### MISSION

Propose un plan de durcissement complet de l'infrastructure pour réduire la surface d'attaque résiduelle.

### ACTIONS DEMANDÉES

#### 1. Configuration CORS Realtime
- Restreindre `Access-Control-Allow-Origin` à `https://crm.axivity.cloud`
- Vérifier si Supabase permet de configurer CORS pour le Realtime
- Si non configurable via Supabase, proposer un reverse proxy (Caddy/Nginx) comme solution
- Documenter l'impact sur les WebSocket connections

#### 2. Headers de sécurité HTTP
Configurer les headers suivants sur l'application Next.js (`next.config.js`) :

| Header | Valeur recommandée | Raison |
|--------|-------------------|--------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forcer HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prévenir MIME sniffing |
| `X-Frame-Options` | `DENY` | Prévenir clickjacking |
| `X-XSS-Protection` | `0` | Désactivé (CSP plus efficace) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limiter les fuites de referrer |
| `Content-Security-Policy` | À définir | Prévenir XSS, injection |
| `Permissions-Policy` | À définir | Limiter les API navigateur |

#### 3. Content Security Policy (CSP)
- Définir une CSP stricte adaptée à Next.js + Supabase :
  - `default-src 'self'`
  - `connect-src` pour Supabase (REST, Realtime, Auth)
  - `script-src` avec nonces pour Next.js
  - `style-src` pour Tailwind CSS
  - `img-src` pour les avatars et assets

#### 4. Rate Limiting
- Rate limiting global sur l'API Supabase (si configurable)
- Rate limiting sur l'application Next.js (via middleware)
- Protection contre le brute-force sur l'authentification
- Protection contre l'abus des fonctions RPC

#### 5. Monitoring et alerting
- Mettre en place un monitoring des accès anormaux
- Alertes sur les patterns suspects (enumeration, scanning)
- Dashboard de sécurité avec les métriques clés

### CONTRAINTES

1. **Supabase managed** — Certains headers et CORS sont gérés par Supabase. Distinguer ce qui est configurable sur l'app Next.js vs sur Supabase.

2. **Coolify** — L'application est déployée via Coolify/Docker. La configuration des headers peut se faire au niveau Next.js ou au niveau du reverse proxy Coolify.

3. **Performance** — Le rate limiting et les headers ne doivent pas impacter les performances de l'application.

4. **Format de sortie :**
   - Configuration `next.config.js` avec les headers de sécurité
   - Middleware Next.js pour le rate limiting
   - Guide de configuration CORS Supabase
   - CSP complète et testée
   - Architecture de monitoring recommandée
   - Checklist de durcissement (à vérifier trimestriellement)

### BONNES PRATIQUES À APPLIQUER

- En tant que **Senior Infrastructure Security Engineer** : applique les benchmarks CIS pour le durcissement. Vérifie la configuration avec des outils comme `securityheaders.com` et `observatory.mozilla.org`.
- En tant que **Senior Network Security Engineer** : évalue les risques liés au WebSocket Realtime et propose des contrôles adaptés (connection limits, message rate, payload size).
- En tant que **Senior AppSec Engineer** : conçois la CSP pour qu'elle soit stricte mais compatible avec Next.js et Supabase. Teste avec le CSP Evaluator de Google.
```

---

## Résultat attendu

- Configuration `next.config.js` complète
- Middleware rate limiting
- CSP optimisée Next.js + Supabase
- Guide CORS Realtime
- Checklist de durcissement trimestriel
