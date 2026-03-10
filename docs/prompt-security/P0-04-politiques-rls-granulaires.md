# P0-04 : Implémenter des politiques RLS granulaires par rôle

**Priorité :** P0 - Critique (Phase 2)
**Finding :** Recommandation du rapport — Remédiation moyen terme point 8
**Risque :** Accès trop large pour tous les utilisateurs authentifiés

---

## Prompt

```
Tu es une équipe de spécialistes seniors en architecture de sécurité, composée de :

1. **Senior Database Security Engineer** (Lead) — Expert en PostgreSQL RLS, conception de politiques multi-niveaux, optimisation des performances des politiques. 15+ ans d'expérience.
2. **Senior Identity & Access Management (IAM) Architect** — Expert en modèles RBAC/ABAC, conception de matrices de permissions, et gouvernance des accès. Expérience en conformité RGPD.
3. **Senior Supabase Platform Architect** — Expert des patterns avancés Supabase : RLS avec JWT claims, helper functions, et optimisation des requêtes avec politiques.

---

### CONTEXTE

Les politiques RLS de base (P0-02) sont en place : tout accès anonyme est bloqué, tous les utilisateurs authentifiés ont un accès complet. Il faut maintenant implémenter un contrôle **granulaire par rôle**.

**Rôles existants dans `profiles.role` :**
- `admin` — Accès complet à toutes les données et fonctions d'administration
- `developpeur_automatisme` — Accès aux projets, tâches, et temps, mais pas aux données financières sensibles

**Architecture des tables par catégorie fonctionnelle :**

| Catégorie | Tables | Admin | Développeur |
|-----------|--------|-------|-------------|
| **CRM Core** | clients, contacts, interactions | CRUD | Read-only |
| **Pipeline** | opportunites, opportunite_contacts, catalogue_services, lignes_devis | CRUD | Read-only |
| **Projets** | projets, projet_membres, taches, modeles_taches | CRUD | CRUD (assigné) |
| **Finance** | factures, devis, parametres_entreprise | CRUD | Read-only (limité) |
| **Temps** | journal_temps, equipe | CRUD | CRUD (propre) |
| **Connaissance** | connaissances, objectifs, resultats_cles, accomplissements | CRUD | CRUD |
| **Écosystème** | feedback_client, partenaires | CRUD | Read-only |
| **Système** | changelog, notifications, demandes_evolution, scenarios_previsionnels | CRUD | Read + Create |
| **Documents** | documents_v2, email_templates, record_manager_v2, tabular_document_rows | CRUD | Read-only |

---

### MISSION

Génère le script SQL complet pour **remplacer les politiques de base par des politiques granulaires** selon la matrice ci-dessus.

### CONTRAINTES

1. **Helper function** — Créer une fonction helper pour éviter les requêtes répétitives :
   ```sql
   CREATE OR REPLACE FUNCTION public.get_user_role()
   RETURNS TEXT AS $$
     SELECT role FROM public.profiles WHERE id = auth.uid()
   $$ LANGUAGE sql SECURITY DEFINER STABLE;
   ```
   Justifier le choix SECURITY DEFINER (nécessaire car `profiles` a RLS) et STABLE (cache dans la transaction).

2. **Politiques par rôle "développeur"** :
   - `journal_temps` : CRUD uniquement sur ses propres entrées (`membre_id = auth.uid()` ou via lookup)
   - `taches` : CRUD sur les tâches qui lui sont assignées, Read sur les autres
   - `projets` : Read sur tous, Update uniquement si membre du projet (via `projet_membres`)
   - `notifications` : CRUD uniquement sur ses propres notifications

3. **Suppression sécurisée** — Seul l'admin peut DELETE sur les tables critiques (clients, contacts, factures, devis). Le développeur ne peut supprimer que ses propres entrées dans journal_temps et notifications.

4. **Performance** — Les politiques RLS sont évaluées à chaque ligne. Utiliser des index sur les colonnes utilisées dans les politiques (ex: `profiles.id`, `taches.responsable_id`, `journal_temps.membre_id`).

5. **Migration progressive** — Le script doit :
   - DROP les anciennes politiques de base (P0-02)
   - CREATE les nouvelles politiques granulaires
   - Être dans une transaction atomique
   - Inclure un rollback vers les politiques de base

6. **Extensibilité** — Prévoir l'ajout futur de rôles (ex: `commercial`, `manager`) avec des commentaires indiquant où ajouter les conditions.

7. **Format de sortie :**
   - Script SQL de la helper function + index
   - Script SQL des politiques granulaires (par catégorie)
   - Script de rollback (retour aux politiques de base)
   - Matrice de test (tableau des accès à vérifier par rôle)
   - Recommandations de performance

### BONNES PRATIQUES À APPLIQUER

- En tant que **Senior Database Security Engineer** : optimise les politiques pour minimiser les subqueries. Utilise `EXISTS` plutôt que `IN` pour les lookups. Vérifie que les politiques ne créent pas de deadlocks.
- En tant que **Senior IAM Architect** : valide que la matrice de permissions suit le principe du moindre privilège. Identifie les risques d'escalade de privilèges entre rôles.
- En tant que **Senior Supabase Architect** : recommande si les JWT custom claims seraient plus performants que les lookups `profiles` pour les vérifications de rôle fréquentes. Explique les trade-offs.
```

---

## Résultat attendu

- Script SQL `008-helper-function-and-indexes.sql`
- Script SQL `009-granular-rls-policies.sql`
- Script SQL `009-rollback-to-base-policies.sql`
- Matrice de test par rôle (tableau)
- Recommandations JWT custom claims
