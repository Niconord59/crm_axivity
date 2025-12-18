# 005 - Migration Supabase

## Résumé

Migration du backend Airtable vers Supabase self-hosted pour améliorer les performances, ajouter l'authentification utilisateur et les permissions basées sur les rôles.

## Statut

- **Date de début** : 17 décembre 2025
- **Date de mise à jour** : 18 décembre 2025
- **Statut global** : 🔄 En cours (Phase 4 complète)

## Objectifs

1. ✅ Déployer Supabase via Coolify (template intégré)
2. ✅ Créer le schéma de base de données (21 tables)
3. ✅ Migrer les hooks React Query d'Airtable vers Supabase
4. ⏳ Activer l'authentification utilisateur
5. ⏳ Implémenter les rôles et permissions (RLS)
6. ⏳ Adapter les workflows N8N

## Avantages de la migration

| Critère | Airtable | Supabase |
|---------|----------|----------|
| Latence | 200-500ms | 10-50ms |
| Temps réel | ❌ Polling | ✅ WebSockets |
| Authentification | ❌ Non | ✅ Intégrée |
| Permissions | ❌ Non | ✅ Row Level Security |
| Rate limit | 5 req/sec | Illimité (self-hosted) |
| Coût | ~20$/mois | 0$ (self-hosted) |

## Stack technique

- **Supabase** : PostgreSQL + Auth + Realtime
- **Déploiement** : Coolify (VPS)
- **URL** : `https://supabase.axivity.cloud`

## Hooks migrés

| Fichier | Statut | Changements |
|---------|--------|-------------|
| `use-clients.ts` | ✅ | `secteur` au lieu de `secteur_activite` |
| `use-projets.ts` | ✅ | - |
| `use-taches.ts` | ✅ | - |
| `use-opportunites.ts` | ✅ | - |
| `use-factures.ts` | ✅ | - |
| `use-prospects.ts` | ✅ | `nom`/`prenom` au lieu de `nom_complet` |
| `use-equipe.ts` | ✅ | Nouvelle table `equipe` |
| `use-interactions.ts` | ✅ | `resume`/`user_id` |
| `use-convert-opportunity.ts` | ✅ | - |
| `use-import-leads.ts` | ✅ | Mapping colonnes corrigé |

## Migrations SQL

| Fichier | Description |
|---------|-------------|
| `00_extensions.sql` | Extensions PostgreSQL |
| `01_schema.sql` | 21 tables + ENUMs |
| `02_rls.sql` | Row Level Security (5 rôles) |
| `03_functions.sql` | Triggers et fonctions |
| `04_equipe_table.sql` | Table équipe + colonnes manquantes |
| `05_dev_quick_fix.sql` | Désactiver RLS pour dev |

## Rôles utilisateur

| Rôle | Description |
|------|-------------|
| `admin` | Accès total |
| `manager` | Gestion équipe + clients |
| `commercial` | Pipeline + prospects |
| `membre` | Ses tâches + projets assignés |
| `client` | Portail client (lecture seule) |

## Prochaines étapes

1. [ ] Exécuter `05_dev_quick_fix.sql` dans Supabase Studio
2. [ ] Tester toutes les pages de l'application
3. [ ] Implémenter les pages d'authentification (login/register)
4. [ ] Réactiver RLS avec les bonnes policies
5. [ ] Adapter les workflows N8N
