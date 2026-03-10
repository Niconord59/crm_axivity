# P0-02 : Créer les politiques RLS restrictives de base

**Priorité :** P0 - Critique
**Finding :** P0-1, P0-2, P0-3, P0-4
**Risque :** Sans politiques, activer RLS bloque tout accès

---

## Prompt

```
Tu es une équipe de spécialistes seniors en sécurité et gestion d'identités, composée de :

1. **Senior Database Security Engineer** (Lead) — Expert en PostgreSQL Row Level Security, conception de politiques d'accès granulaires. Maîtrise des patterns SELECT/INSERT/UPDATE/DELETE séparés.
2. **Senior Identity & Access Management (IAM) Specialist** — Expert en modèles d'autorisation (RBAC, ABAC), gestion des rôles Supabase (`anon`, `authenticated`, `service_role`).
3. **Senior Application Security Engineer** — Expert en sécurisation d'applications SaaS, OWASP Top 10, et protection des données PII/GDPR.

---

### CONTEXTE

Suite à l'activation de RLS sur les 31 tables non protégées du CRM Axivity (voir P0-01), il faut créer des **politiques de base** qui :
- **Bloquent tout accès anonyme** (rôle `anon`)
- **Autorisent l'accès aux utilisateurs authentifiés** (rôle `authenticated`)
- Préparent le terrain pour des politiques granulaires par rôle (P0-04)

**Architecture de l'application :**
- Framework : Next.js avec Supabase Client SDK
- Authentification : Supabase Auth (email uniquement, signup désactivé)
- Rôles utilisateur existants dans la table `profiles` :
  - `admin` (fgratepanche@axivity.fr)
  - `developpeur_automatisme` (nicolascampagne@hotmail.fr)
- Le `service_role` est utilisé par les workflows N8N pour les opérations automatisées

**Tables à protéger (31) :**
accomplissements, catalogue_services, changelog, clients, connaissances, contacts, demandes_evolution, devis, documents_v2, email_templates, equipe, factures, feedback_client, interactions, journal_temps, lignes_devis, modeles_taches, notifications, objectifs, opportunite_contacts, opportunites, parametres_entreprise, partenaires, profiles, projet_membres, projets, record_manager_v2, resultats_cles, scenarios_previsionnels, tabular_document_rows, taches

---

### MISSION

Génère les politiques RLS de base pour les 31 tables avec les règles suivantes :

#### Niveau 1 — Politiques de base (ce prompt)

| Opération | Rôle `anon` | Rôle `authenticated` | Rôle `service_role` |
|-----------|-------------|---------------------|---------------------|
| SELECT    | ❌ DENY     | ✅ ALLOW            | ✅ BYPASS (natif)   |
| INSERT    | ❌ DENY     | ✅ ALLOW            | ✅ BYPASS (natif)   |
| UPDATE    | ❌ DENY     | ✅ ALLOW            | ✅ BYPASS (natif)   |
| DELETE    | ❌ DENY     | ✅ ALLOW            | ✅ BYPASS (natif)   |

### CONTRAINTES

1. **Transaction atomique** — Le script doit être dans une transaction avec le script P0-01 (activation RLS).

2. **Nommage des politiques** — Convention : `{table}_{operation}_{role}`
   Exemple : `clients_select_authenticated`, `clients_insert_authenticated`

3. **Séparer les politiques par opération** — Ne PAS utiliser `FOR ALL`. Créer des politiques séparées pour SELECT, INSERT, UPDATE, DELETE afin de faciliter le contrôle granulaire futur.

4. **Table `profiles` — cas spécial** :
   - SELECT : L'utilisateur authentifié ne peut voir que son propre profil (`auth.uid() = id`)
   - UPDATE : L'utilisateur ne peut modifier que son propre profil
   - INSERT/DELETE : Interdit pour tous (seulement via `service_role`)

5. **Table `parametres_entreprise` — cas spécial** :
   - SELECT : Tous les utilisateurs authentifiés
   - INSERT/UPDATE/DELETE : Uniquement les admins (`EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`)

6. **Service Role** — Rappeler que `service_role` bypass RLS nativement dans Supabase, donc aucune politique spécifique n'est nécessaire pour N8N.

7. **Format de sortie :**
   - Script SQL principal combiné avec P0-01
   - Commentaires expliquant chaque décision
   - Script de test pour valider que l'accès anon est bien bloqué
   - Script de test pour valider que l'accès authenticated fonctionne

### BONNES PRATIQUES À APPLIQUER

- En tant que **Senior Database Security Engineer** : utilise `USING` pour les lectures et `WITH CHECK` pour les écritures. Explique la différence dans les commentaires.
- En tant que **Senior IAM Specialist** : vérifie que le modèle RBAC est cohérent et qu'il n'y a pas de privilege escalation possible.
- En tant que **Senior AppSec Engineer** : vérifie que les politiques protègent les données PII (contacts, profils) conformément au RGPD, et que les données financières (factures, devis) sont correctement isolées.
```

---

## Résultat attendu

- Script SQL `002-enable-rls-and-policies.sql` (combiné avec P0-01)
- Script SQL `003-test-anon-blocked.sql`
- Script SQL `004-test-authenticated-allowed.sql`
- Documentation des cas spéciaux (profiles, parametres_entreprise)
