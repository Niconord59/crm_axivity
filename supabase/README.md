# Déploiement Supabase sur Coolify

Guide de déploiement de Supabase self-hosted pour CRM Axivity.

## Prérequis

- Serveur avec Coolify installé
- Minimum 4GB RAM, 2 vCPU
- Domaine configuré (ex: `api.crm.ton-domaine.com`)

## Étape 1 : Générer les clés

### 1.1 Générer les secrets

```bash
# JWT Secret (32 caractères)
openssl rand -base64 32

# Secret Key Base (64 caractères)
openssl rand -base64 64

# Mot de passe PostgreSQL
openssl rand -base64 24
```

### 1.2 Générer les clés API Supabase

Utiliser le générateur officiel : https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

Ou générer manuellement sur https://jwt.io/ avec le `JWT_SECRET` :

**ANON_KEY payload :**
```json
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 1900000000
}
```

**SERVICE_ROLE_KEY payload :**
```json
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 1900000000
}
```

## Étape 2 : Déployer sur Coolify

### 2.1 Créer le service

1. Dans Coolify, aller dans **Projects** → **Add New Resource**
2. Sélectionner **Docker Compose**
3. Source : **Git Repository**
4. URL : `https://github.com/Niconord59/crm_axivity.git`
5. Branch : `001-crm-axivity-interface`
6. Base Directory : `supabase`
7. Docker Compose File : `docker-compose.yml`

### 2.2 Configurer les variables d'environnement

Dans l'onglet **Environment Variables**, ajouter toutes les variables du fichier `.env.example` :

```env
# URLs (adapter selon ton domaine)
API_EXTERNAL_URL=https://api.crm.ton-domaine.com
SITE_URL=https://crm.ton-domaine.com
ADDITIONAL_REDIRECT_URLS=https://crm.ton-domaine.com/**

# PostgreSQL
POSTGRES_PASSWORD=<généré étape 1>
POSTGRES_DB=postgres

# JWT
JWT_SECRET=<généré étape 1>
JWT_EXP=3600
SECRET_KEY_BASE=<généré étape 1>

# Clés API
ANON_KEY=<généré étape 1.2>
SERVICE_ROLE_KEY=<généré étape 1.2>

# Studio
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=<mot de passe sécurisé>

# Google OAuth (optionnel)
ENABLE_GOOGLE_AUTH=true
GOOGLE_CLIENT_ID=<depuis Google Console>
GOOGLE_CLIENT_SECRET=<depuis Google Console>
```

### 2.3 Configurer les domaines

Dans l'onglet **Settings** → **Domains** :

| Service | Domaine | Port |
|---------|---------|------|
| kong | api.crm.ton-domaine.com | 8000 |
| studio | studio.crm.ton-domaine.com | 3001 |

Activer **HTTPS** pour les deux.

### 2.4 Déployer

Cliquer sur **Deploy** et attendre que tous les services soient up.

## Étape 3 : Initialiser la base de données

### 3.1 Accéder à Supabase Studio

1. Aller sur `https://studio.crm.ton-domaine.com`
2. Se connecter avec les identifiants `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`

### 3.2 Exécuter les migrations

Dans **SQL Editor**, exécuter dans l'ordre :

1. `migrations/00_extensions.sql`
2. `migrations/01_schema.sql`
3. `migrations/02_rls.sql`
4. `migrations/03_functions.sql`

### 3.3 Créer le premier utilisateur admin

```sql
-- Dans SQL Editor après avoir créé un compte via l'auth
UPDATE profiles
SET role = 'admin'
WHERE email = 'ton-email@exemple.com';
```

## Étape 4 : Configurer Google OAuth

### 4.1 Google Cloud Console

1. Aller sur https://console.cloud.google.com/
2. Créer un projet ou sélectionner existant
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Type : **Web application**
5. Authorized redirect URIs :
   ```
   https://api.crm.ton-domaine.com/auth/v1/callback
   ```

### 4.2 Mettre à jour les variables

Ajouter `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans Coolify et redéployer.

## Étape 5 : Configurer le frontend Next.js

Mettre à jour les variables d'environnement du frontend :

```env
# Remplacer Airtable par Supabase
NEXT_PUBLIC_SUPABASE_URL=https://api.crm.ton-domaine.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>

# Supprimer les anciennes variables Airtable
# NEXT_PUBLIC_AIRTABLE_API_KEY=...
# NEXT_PUBLIC_AIRTABLE_BASE_ID=...
```

## Architecture finale

```
┌─────────────────────────────────────────────────────────┐
│                    COOLIFY SERVER                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐     ┌─────────────────────────┐   │
│  │   Next.js CRM   │────▶│   Kong API Gateway     │   │
│  │   :3000         │     │   :8000                │   │
│  └─────────────────┘     └──────────┬──────────────┘   │
│                                     │                   │
│          ┌──────────────────────────┼──────────────┐   │
│          │           │              │              │   │
│          ▼           ▼              ▼              ▼   │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │   Auth    │ │   REST   │ │ Realtime │ │ Storage  │ │
│  │  :9999    │ │  :3000   │ │  :4000   │ │  :5000   │ │
│  └─────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│        │            │            │            │       │
│        └────────────┴────────────┴────────────┘       │
│                          │                             │
│                          ▼                             │
│                 ┌────────────────┐                     │
│                 │   PostgreSQL   │                     │
│                 │     :5432      │                     │
│                 └────────────────┘                     │
│                                                         │
│  ┌─────────────────┐                                   │
│  │ Supabase Studio │ (admin uniquement)                │
│  │     :3001       │                                   │
│  └─────────────────┘                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Commandes utiles

### Vérifier les services
```bash
docker ps | grep supabase
```

### Voir les logs
```bash
docker logs supabase-kong -f
docker logs supabase-db -f
docker logs supabase-auth -f
```

### Backup de la base
```bash
docker exec supabase-db pg_dump -U postgres postgres > backup.sql
```

### Restore
```bash
docker exec -i supabase-db psql -U postgres postgres < backup.sql
```

## Troubleshooting

### Kong ne démarre pas
- Vérifier que `kong.yml` est bien monté
- Vérifier les clés `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_KEY`

### Auth échoue
- Vérifier `API_EXTERNAL_URL` et `SITE_URL`
- Vérifier les redirect URLs dans Google Console

### Realtime ne fonctionne pas
- Vérifier que les tables sont ajoutées à `supabase_realtime` publication
- Vérifier `SECRET_KEY_BASE`

## Prochaines étapes

Une fois Supabase déployé :
1. Migrer les données Airtable (voir `scripts/migrate-airtable.ts`)
2. Adapter les hooks React (Phase 4)
3. Ajouter les pages d'authentification (Phase 5)
