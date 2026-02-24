# P2-01 : Guide de durcissement Auth - Variables Coolify

## Actions requises dans Coolify (Supabase → Variables)

### 1. JWT Expiration (CRITIQUE)

```env
# Réduire l'expiration JWT de 100 ans à 1 heure
GOTRUE_JWT_EXP=3600
```

**Impact :**
- Les tokens d'accès expirent après 1h (au lieu de 100 ans)
- Le refresh token est automatiquement utilisé par le SDK Supabase
- Aucun impact sur l'expérience utilisateur (le SDK gère le refresh)
- Les sessions N8N (service_role) ne sont pas affectées

**Procédure de rotation JWT :**
1. Générer un nouveau JWT secret : `openssl rand -base64 32`
2. Mettre à jour `GOTRUE_JWT_SECRET` dans Coolify
3. Mettre à jour `SUPABASE_JWT_SECRET` (même valeur)
4. Redémarrer les services GoTrue et Kong
5. Les utilisateurs devront se reconnecter (les anciens tokens deviennent invalides)

**ATTENTION :** Mettre à jour `NEXT_PUBLIC_SUPABASE_ANON_KEY` avec un nouveau token signé avec le nouveau secret. Sinon le frontend ne pourra plus se connecter.

### 2. Désactiver Phone Auth (RECOMMANDÉ)

```env
# Désactiver l'authentification téléphonique
GOTRUE_EXTERNAL_PHONE_ENABLED=false
GOTRUE_SMS_AUTOCONFIRM=false
```

**Justification :** Le CRM n'utilise pas l'auth téléphonique. La désactiver réduit la surface d'attaque.

### 3. Durcissement des mots de passe

```env
# Longueur minimum 12 caractères (NIST SP 800-63B)
GOTRUE_PASSWORD_MIN_LENGTH=12
```

### 4. Rate limiting email

```env
# Maximum 3 emails par heure par utilisateur (reset password, etc.)
GOTRUE_RATE_LIMIT_EMAIL_SENT=3
```

### 5. Sessions

```env
# Durée du refresh token : 7 jours (défaut : 7j, max raisonnable)
GOTRUE_SESSION_DURATION=604800
```

---

## Checklist d'audit mensuel

- [ ] Vérifier le nombre d'utilisateurs : `SELECT audit_auth_config()` (RPC)
- [ ] Vérifier les connexions récentes : `SELECT * FROM get_recent_logins(20)`
- [ ] Vérifier qu'aucun compte non confirmé n'existe
- [ ] Vérifier que `GOTRUE_JWT_EXP` est bien configuré (pas 100 ans)
- [ ] Vérifier que le signup est toujours désactivé (`DISABLE_SIGNUP=true`)
- [ ] Vérifier les variables N8N après rotation de clés

---

## MFA (Recommandation future)

Supabase supporte TOTP MFA (Google Authenticator, Authy). Pour l'activer :

```env
GOTRUE_MFA_ENABLED=true
```

**Note :** Le SDK Supabase JS gère déjà le flow MFA. Il faut ajouter un composant dans l'UI pour l'enrollment (QR code) et la vérification (code TOTP).

Recommandé pour les comptes admin en priorité.

---

## HS256 vs RS256

**Configuration actuelle :** HS256 (symétrique)
**Recommandation :** Conserver HS256 pour une instance self-hosted avec peu d'utilisateurs.

RS256 (asymétrique) est préférable quand :
- Plusieurs services doivent vérifier les tokens sans partager le secret
- L'infrastructure est distribuée

Pour 2 utilisateurs sur une instance self-hosted, HS256 est suffisant et plus simple.
