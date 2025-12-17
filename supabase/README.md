# Supabase - CRM Axivity

Configuration Supabase pour CRM Axivity, déployé via Coolify.

## Déploiement (Coolify)

1. Dans Coolify : **Projects** → **Add New Resource** → **Supabase**
2. Configurer les variables d'environnement (JWT_SECRET, POSTGRES_PASSWORD, etc.)
3. Configurer les domaines (API + Studio)
4. Déployer

## Migrations SQL

Après le déploiement, exécuter les migrations dans **Supabase Studio** → **SQL Editor** :

| Ordre | Fichier | Description |
|-------|---------|-------------|
| 1 | `00_extensions.sql` | Extensions PostgreSQL (uuid-ossp, etc.) |
| 2 | `01_schema.sql` | Tables et ENUMs (21 tables) |
| 3 | `02_rls.sql` | Row Level Security (5 rôles utilisateur) |
| 4 | `03_functions.sql` | Triggers et fonctions |

## Rôles utilisateur

| Rôle | Description |
|------|-------------|
| `admin` | Accès total |
| `manager` | Gestion équipe + clients |
| `commercial` | Pipeline + prospects |
| `membre` | Ses tâches + projets assignés |
| `client` | Portail client (lecture seule) |

## Structure des tables

- **profiles** : Utilisateurs (lié à auth.users)
- **clients** : Entreprises clientes
- **contacts** : Contacts des clients
- **interactions** : Historique des échanges
- **opportunites** : Pipeline commercial
- **projets** : Projets en cours
- **taches** : Tâches des projets
- **factures** : Facturation
- **journal_temps** : Suivi du temps
- **connaissances** : Base de connaissances

## Variables d'environnement Frontend

```env
NEXT_PUBLIC_SUPABASE_URL=https://api.crm1.axivity.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```
