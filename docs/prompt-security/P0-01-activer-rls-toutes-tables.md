# P0-01 : Activer Row Level Security sur toutes les tables

**Priorité :** P0 - Critique
**Finding :** P0-1, P0-2, P0-3, P0-4, P1-1
**Risque :** Accès CRUD anonyme complet à toutes les données business

---

## Prompt

```
Tu es une équipe de spécialistes seniors en sécurité base de données, composée de :

1. **Senior Database Security Engineer** (Lead) — Expert en PostgreSQL Row Level Security, hardening de bases de données, et politiques d'accès. 15+ ans d'expérience en sécurisation d'infrastructures critiques.
2. **Senior Supabase Platform Architect** — Expert de l'écosystème Supabase, des interactions entre PostgREST, Auth, et RLS. Connaissance approfondie des edge cases Supabase.

---

### CONTEXTE

Un audit de sécurité a révélé que l'instance Supabase du CRM Axivity (https://supabase.axivity.cloud) expose **33 tables** sans Row Level Security (RLS). Cela permet à tout utilisateur anonyme (avec la clé `anon` publique) d'effectuer des opérations CRUD complètes sur toutes les données, incluant :
- Données clients (PII, SIRET, adresses)
- Contacts personnels (noms, emails, téléphones, LinkedIn)
- Profils utilisateurs et rôles admin
- Données financières (factures, devis, opportunités)
- Paramètres entreprise (identité légale complète)

**Tables concernées (33) :**
accomplissements, catalogue_services, changelog, clients, connaissances, contacts, demandes_evolution, devis, devis_compteur, documents_v2, email_templates, equipe, factures, factures_compteur, feedback_client, interactions, journal_temps, lignes_devis, modeles_taches, notifications, objectifs, opportunite_contacts, opportunites, parametres_entreprise, partenaires, profiles, projet_membres, projets, record_manager_v2, resultats_cles, scenarios_previsionnels, tabular_document_rows, taches

**Tables déjà protégées (RLS activé) :**
- devis_compteur
- factures_compteur

---

### MISSION

Génère le script SQL complet pour **activer RLS sur les 31 tables non protégées**.

### CONTRAINTES

1. **Ne PAS activer RLS sans politiques** — Cela bloquerait immédiatement tout accès, y compris pour les utilisateurs authentifiés. Ce script doit être exécuté EN MÊME TEMPS que le script P0-02 (politiques de base).

2. **Ordre d'exécution** — Utilise une transaction SQL (`BEGIN; ... COMMIT;`) pour que l'activation RLS et la création des politiques soient atomiques.

3. **Vérification préalable** — Inclus une requête de vérification pour lister les tables où RLS est déjà activé vs désactivé AVANT d'exécuter.

4. **Rollback** — Fournis un script de rollback complet en cas de problème.

5. **Format de sortie :**
   - Script SQL de vérification (à exécuter d'abord, lecture seule)
   - Script SQL d'activation (à exécuter avec P0-02)
   - Script SQL de rollback
   - Checklist de validation post-exécution

### BONNES PRATIQUES À APPLIQUER

- En tant que **Senior Database Security Engineer**, vérifie qu'aucune table système n'est impactée
- En tant que **Senior Supabase Architect**, vérifie les implications sur les fonctions RPC, les triggers, et les vues matérialisées existantes
- Documente chaque décision avec un commentaire SQL expliquant le "pourquoi"
```

---

## Résultat attendu

- Script SQL `001-verify-rls-status.sql` (lecture seule)
- Script SQL `002-enable-rls-all-tables.sql` (à combiner avec P0-02)
- Script SQL `002-rollback-rls.sql`
- Checklist de validation
