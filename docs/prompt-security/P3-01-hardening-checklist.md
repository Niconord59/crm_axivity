# P3-01 : Checklist de durcissement infrastructure

## Actions effectuées (code)

### Security Headers Next.js (`next.config.mjs`)

| Header | Valeur | Status |
|--------|--------|--------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | OK |
| `X-Content-Type-Options` | `nosniff` | OK |
| `X-Frame-Options` | `DENY` | OK |
| `X-XSS-Protection` | `0` (désactivé, CSP est plus efficace) | OK |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | OK |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | OK |
| `Content-Security-Policy` | Stricte, voir détails ci-dessous | OK |

### CSP Détaillée

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://supabase.axivity.cloud;
font-src 'self' data:;
connect-src 'self' https://supabase.axivity.cloud wss://supabase.axivity.cloud https://recherche-entreprises.api.gouv.fr https://places.googleapis.com https://maps.googleapis.com;
frame-src 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

**Notes CSP :**
- `'unsafe-inline'` requis par Next.js pour l'hydration et les styles Tailwind inline
- `'unsafe-eval'` requis par Next.js en mode développement et certaines bibliothèques
- Pour renforcer ultérieurement : migrer vers des nonces CSP (`experimental.nextScriptWorkers`)

---

## Actions manuelles requises

### 1. CORS Realtime Supabase

**Problème :** `Access-Control-Allow-Origin: *` sur le WebSocket Realtime.

**Solution Coolify :**
1. Ajouter la variable d'environnement dans Supabase Kong/Realtime :
   ```env
   REALTIME_CORS_ALLOWED_ORIGINS=https://crm.axivity.cloud
   ```
2. Si non supporté, configurer via le reverse proxy Caddy/Nginx de Coolify.

**Alternative :** Ajouter un bloc Caddy personnalisé :
```caddyfile
supabase.axivity.cloud {
    @realtime path /realtime/*
    handle @realtime {
        header Access-Control-Allow-Origin "https://crm.axivity.cloud"
        reverse_proxy realtime:4000
    }
}
```

### 2. Rate Limiting API Supabase

**Option A - PostgREST (recommandé) :**
```env
# Limiter à 1000 requêtes par seconde par IP
PGRST_MAX_ROWS=1000
```

**Option B - Kong Rate Limiting :**
Configurer le plugin rate-limiting dans Kong (inclus dans Supabase self-hosted).

### 3. Désactiver l'énumération de schéma

```env
# Dans les variables Coolify pour PostgREST
PGRST_OPENAPI_MODE=disabled
```

### 4. Masquer les headers serveur

```env
# PostgREST
PGRST_SERVER_PROXY_URI=https://supabase.axivity.cloud
```

---

## Vérification post-déploiement

### Test des headers (après build et déploiement)

```bash
# Vérifier les headers de sécurité
curl -I https://crm.axivity.cloud 2>/dev/null | grep -E "^(strict|x-content|x-frame|x-xss|referrer|permissions|content-security)"

# Ou utiliser un outil en ligne :
# https://securityheaders.com/?q=https://crm.axivity.cloud
# https://observatory.mozilla.org/analyze/crm.axivity.cloud
```

### Test CSP

```bash
# Vérifier qu'aucune ressource n'est bloquée par la CSP
# Ouvrir la console du navigateur sur crm.axivity.cloud
# Aucune erreur "Refused to..." ne doit apparaître
```

### Test CORS Realtime

```bash
# Tester la réponse CORS du WebSocket
curl -H "Origin: https://evil.com" -I https://supabase.axivity.cloud/realtime/v1/websocket
# Le header Access-Control-Allow-Origin ne doit PAS contenir "evil.com"
```

---

## Checklist trimestrielle

- [ ] Scanner les headers : `securityheaders.com`
- [ ] Scanner Mozilla Observatory
- [ ] Vérifier la CSP avec Google CSP Evaluator
- [ ] Vérifier que CORS Realtime n'est pas `*`
- [ ] Vérifier les logs d'erreurs 4xx/5xx anormaux
- [ ] Vérifier que `PGRST_OPENAPI_MODE=disabled`
- [ ] Revoir les Edge Functions (aucune ne doit exister inutilement)
- [ ] Revoir les variables d'environnement sensibles dans Coolify
- [ ] Tester les accès anonymes sur les endpoints critiques
