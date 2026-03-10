# P1-01 : Réduire l'exposition des tables via PostgREST API

**Priorité :** P1 - Haute
**Finding :** P1-1 (33 tables exposées via PostgREST)
**Risque :** Surface d'attaque excessive, même avec RLS activé

---

## Prompt

```
Tu es une équipe de spécialistes seniors en sécurité API et architecture backend, composée de :

1. **Senior API Security Specialist** (Lead) — Expert en sécurisation d'API REST, PostgREST, et réduction de surface d'attaque. Spécialisé dans les architectures Zero Trust. 15+ ans d'expérience.
2. **Senior Backend Engineer** — Expert PostgreSQL, gestion de schémas, et architecture multi-couches. Connaissance approfondie de PostgREST et de l'exposition automatique des schémas.
3. **Senior Supabase Platform Architect** — Expert des mécanismes d'exposition Supabase, des schémas `public` vs `private`, et des vues sécurisées.

---

### CONTEXTE

L'audit a révélé que **33 tables** sont exposées via l'API PostgREST à l'URL :
`https://supabase.axivity.cloud/rest/v1/`

Même avec RLS activé (P0-01/02), l'exposition de toutes les tables via l'API présente des risques :
- **Enumération de schéma** : Le endpoint OpenAPI (`/rest/v1/`) révèle la structure complète de la base
- **Surface d'attaque** : Chaque table exposée est un vecteur potentiel (injection, DoS, bypass RLS)
- **Tables internes** : Certaines tables ne devraient jamais être accessibles via l'API client

**Tables actuellement exposées (33) :**
accomplissements, catalogue_services, changelog, clients, connaissances, contacts, demandes_evolution, devis, devis_compteur, documents_v2, email_templates, equipe, factures, factures_compteur, feedback_client, interactions, journal_temps, lignes_devis, modeles_taches, notifications, objectifs, opportunite_contacts, opportunites, parametres_entreprise, partenaires, profiles, projet_membres, projets, record_manager_v2, resultats_cles, scenarios_previsionnels, tabular_document_rows, taches

---

### MISSION

Analyse les 33 tables et propose une stratégie de réduction de l'exposition API.

### ÉTAPE 1 : Classification des tables

Classe chaque table dans une des catégories :

| Catégorie | Action | Raison |
|-----------|--------|--------|
| **API Required** | Conserver dans `public` | Nécessaire pour le frontend Next.js |
| **Internal Only** | Déplacer vers schéma `private` | Uniquement utilisé par les fonctions RPC ou N8N |
| **System** | Déplacer vers schéma `private` | Tables système/compteurs, ne jamais exposer |

### ÉTAPE 2 : Stratégie de migration vers schéma privé

Pour les tables classées "Internal Only" et "System" :

1. Créer un schéma `private` (non exposé par PostgREST)
2. Migrer les tables vers ce schéma
3. Créer des vues sécurisées dans `public` si le frontend en a besoin en lecture seule
4. Mettre à jour les fonctions RPC qui référencent ces tables

### CONTRAINTES

1. **Impact sur le frontend** — Identifier précisément quelles tables sont appelées depuis le code Next.js (`supabase.from('table_name')`) avant de les retirer du schéma public. Fournir une commande grep pour vérifier.

2. **Impact sur N8N** — Les workflows N8N utilisent `service_role` via l'API PostgREST. Si une table est déplacée vers `private`, le `service_role` peut toujours y accéder via des fonctions RPC SECURITY DEFINER, mais pas directement via l'API REST. Proposer une solution.

3. **Schéma OpenAPI** — Désactiver ou restreindre l'accès au endpoint OpenAPI (`/rest/v1/`) qui expose le schéma complet de la base.

4. **Migration progressive** — Proposer un plan de migration en 3 phases pour éviter les interruptions de service.

5. **Format de sortie :**
   - Tableau de classification des 33 tables
   - Script SQL de création du schéma `private`
   - Script SQL de migration (par phase)
   - Commandes de vérification frontend (grep)
   - Recommandations pour N8N
   - Configuration Supabase pour restreindre le schéma OpenAPI

### BONNES PRATIQUES À APPLIQUER

- En tant que **Senior API Security Specialist** : applique le principe du moindre privilège — n'expose que ce qui est strictement nécessaire. Recommande des rate limits par table/endpoint.
- En tant que **Senior Backend Engineer** : vérifie que les contraintes de clés étrangères, triggers, et index fonctionnent toujours après la migration de schéma. Propose des vues matérialisées si nécessaire.
- En tant que **Senior Supabase Architect** : explique comment Supabase gère les schémas exposés via `db.schemas` dans la configuration et comment restreindre PostgREST.
```

---

## Résultat attendu

- Tableau de classification des 33 tables
- Scripts SQL de migration en 3 phases
- Guide de configuration Supabase
- Checklist de vérification frontend et N8N
