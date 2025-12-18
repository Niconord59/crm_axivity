# Supabase - CRM Axivity

Configuration Supabase pour CRM Axivity, déployé via Coolify.

**URL** : `https://supabase.axivity.cloud`
**Statut** : ✅ Déployé (18 décembre 2025)

## Déploiement (Coolify)

1. Dans Coolify : **Projects** → **Add New Resource** → **Supabase** (template intégré)
2. Configurer les variables d'environnement (JWT_SECRET, POSTGRES_PASSWORD, etc.)
3. Configurer les domaines (API + Studio)
4. Déployer

## Migrations SQL

Exécuter les migrations dans **Supabase Studio** → **SQL Editor** :

| Ordre | Fichier | Description | Statut |
|-------|---------|-------------|--------|
| 1 | `00_extensions.sql` | Extensions PostgreSQL (uuid-ossp, etc.) | ✅ |
| 2 | `01_schema.sql` | Tables et ENUMs (21 tables) | ✅ |
| 3 | `02_rls.sql` | Row Level Security (5 rôles utilisateur) | ✅ |
| 4 | `03_functions.sql` | Triggers et fonctions | ✅ |
| 5 | `04_equipe_table.sql` | Table équipe + colonnes manquantes + policies dev | ⚠️ À exécuter |

### Migration 04 - Important pour le développement

Le fichier `04_equipe_table.sql` contient :
- **Colonnes manquantes** : `date_rdv_prevu`, `objet`, `priorite`, `date_terminee`
- **Table `equipe`** : Membres de l'équipe avec gestion de charge
- **Policies de développement** : Accès anonyme temporaire (à supprimer en production)

**Alternative simplifiée** (si erreurs avec 04) :
```sql
-- Désactiver RLS pour le développement
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE projets DISABLE ROW LEVEL SECURITY;
ALTER TABLE taches DISABLE ROW LEVEL SECURITY;
ALTER TABLE factures DISABLE ROW LEVEL SECURITY;
ALTER TABLE interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunites DISABLE ROW LEVEL SECURITY;
```

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
NEXT_PUBLIC_SUPABASE_URL=https://supabase.axivity.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

## Mapping Airtable → Supabase

### Différences importantes

| Airtable | Supabase | Notes |
|----------|----------|-------|
| `nom_complet` | `nom` + `prenom` | Champs séparés |
| `secteur_activite` | `secteur` | Renommé |
| `role` (contacts) | `poste` | Poste du contact |
| `notes` (interactions) | `resume` | Résumé de l'interaction |
| `participant_interne_id` | `user_id` | Lien vers profiles |

### Tables créées

| Table Supabase | Équivalent Airtable |
|----------------|---------------------|
| `clients` | T1-Clients |
| `contacts` | T2-Contacts |
| `opportunites` | T3-Opportunités |
| `projets` | T4-Projets |
| `taches` | T5-Tâches |
| `modeles_taches` | T6-Modèles de Tâches |
| `factures` | T7-Factures |
| `interactions` | T8-Interactions |
| `journal_temps` | T9-Journal de Temps |
| `equipe` | T10-Équipe |
| `profiles` | Utilisateurs auth |

## Développement local

```bash
# Vérifier la connexion
npm run dev

# Si erreurs 500 (RLS bloque) → Exécuter 04_equipe_table.sql dans Supabase Studio
```
