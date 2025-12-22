# 005 - Migration Supabase

## Résumé

Migration du backend Supabase vers Supabase self-hosted pour améliorer les performances, ajouter l'authentification utilisateur et les permissions basées sur les rôles.

## Statut

- **Date de début** : 17 décembre 2025
- **Date de mise à jour** : 19 décembre 2025
- **Statut global** : ✅ Quasi-complet (95% - Phase 7 terminée)

## Objectifs

1. ✅ Déployer Supabase via Coolify (template intégré)
2. ✅ Créer le schéma de base de données (21 tables)
3. ✅ Migrer les hooks React Query d'Supabase vers Supabase
4. ✅ Activer l'authentification utilisateur
5. ✅ Implémenter les rôles et permissions (RLS)
6. ✅ Adapter les workflows N8N
7. ⏳ Migration des données de production (optionnel)

## Avantages de la migration

| Critère | Supabase | Supabase |
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

## Phases complétées

### Phase 1 : Infrastructure ✅
- Déploiement Supabase via Coolify
- Configuration DNS et SSL
- Variables d'environnement

### Phase 2 : Schéma & Auth ✅
- 21 tables créées avec migrations SQL
- ENUMs pour statuts
- Triggers pour timestamps

### Phase 4 : Refactoring hooks ✅
- 10 hooks React Query migrés
- Mapping colonnes (nom_complet → nom/prenom, etc.)

### Phase 5 : Auth UI ✅
- Pages : `/login`, `/register`, `/forgot-password`, `/reset-password`
- Route groups Next.js : `(auth)` et `(main)`
- SMTP Resend configuré

### Phase 6 : Rôles UI ✅
- Invitation utilisateurs via email
- Callback auth pour nouveaux utilisateurs
- Création automatique record équipe

### Phase 7 : N8N Workflows ✅ (19 déc. 2025)
- 4 workflows adaptés pour Supabase
- Syntaxe expressions corrigée (`={{ }}`)
- Migrations 13 et 14 pour colonnes requises

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

| Fichier | Description | Statut |
|---------|-------------|--------|
| `00_extensions.sql` | Extensions PostgreSQL | ✅ |
| `01_schema.sql` | 21 tables + ENUMs | ✅ |
| `02_rls.sql` | Row Level Security (5 rôles) | ✅ |
| `03_functions.sql` | Triggers et fonctions | ✅ |
| `04_equipe_table.sql` | Table équipe + colonnes | ✅ |
| `05_dev_quick_fix.sql` | Désactiver RLS pour dev | ✅ |
| `06_test_data.sql` | Données de test | ✅ |
| `07_fix_profiles_rls.sql` | Fix RLS profiles | ✅ |
| `08_update_test_dates.sql` | Mise à jour dates test | ✅ |
| `09_factures_relance_columns.sql` | Colonnes relance factures | ✅ |
| `10_contacts_linkedin_column.sql` | Colonne LinkedIn | ✅ |
| `11_update_user_roles.sql` | Mise à jour rôles | ✅ |
| `12_equipe_profile_unique.sql` | Contrainte unique | ✅ |
| `13_projets_feedback_column.sql` | feedback_envoye | ⚠️ |
| `14_invoice_status_en_retard.sql` | Statut "En retard" | ⚠️ |

## Rôles utilisateur

| Rôle | Description |
|------|-------------|
| `admin` | Accès total |
| `manager` | Gestion équipe + clients |
| `commercial` | Pipeline + prospects |
| `membre` | Ses tâches + projets assignés |
| `client` | Portail client (lecture seule) |

## N8N Workflows Supabase

| Workflow | Fichier | Déclencheur |
|----------|---------|-------------|
| Conversion Opportunité | `supabase_conversion_opportunite_projet.json` | Toutes les minutes |
| Feedback Post-Projet | `supabase_feedback_post_projet.json` | Quotidien 9h |
| Alertes Tâches | `supabase_alertes_taches_retard.json` | Lun-Ven 9h |
| Relances Factures | `supabase_relances_factures.json` | Lun-Ven 10h |

### Configuration N8N

1. Créer credential Supabase API (Host + Service Role Key)
2. Importer les workflows depuis `Workflows_n8n/`
3. Mettre à jour les credentials dans chaque node
4. Activer les workflows

### Syntaxe des filtres (IMPORTANT)

```
# CORRECT
"filterString": "={{ 'date_echeance=lt.' + $now.toISODate() + '&statut=neq.Terminé' }}"

# INCORRECT (ne sera pas évalué)
"filterString": "date_echeance=lt.{{ $now.toISODate() }}&statut=neq.Terminé"
```

## Prochaines étapes (optionnelles)

1. [ ] Migrer les données de production depuis Supabase
2. [ ] Activer le temps réel (WebSockets) pour les mises à jour live
3. [ ] Configurer les backups automatiques
