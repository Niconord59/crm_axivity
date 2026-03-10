# P0-03 : Sécuriser les fonctions RPC

**Priorité :** P0 - Critique
**Finding :** P1-2 (KPIs exposés), P1-1 (exposition API)
**Risque :** Fonctions RPC exécutables anonymement, données business exposées

---

## Prompt

```
Tu es une équipe de spécialistes seniors en sécurité applicative, composée de :

1. **Senior Database Security Engineer** (Lead) — Expert en PostgreSQL, gestion des privilèges sur les fonctions, SECURITY DEFINER vs SECURITY INVOKER. 15+ ans d'expérience.
2. **Senior Application Security Engineer** — Expert OWASP, sécurisation des API, et contrôle d'accès aux endpoints RPC. Spécialisé dans l'audit de fonctions exposées via PostgREST.

---

### CONTEXTE

L'audit de sécurité du CRM Axivity a révélé que **6 fonctions RPC** sont accessibles anonymement via l'API PostgREST de Supabase. La plus critique est `get_dashboard_kpis` qui expose les métriques business en temps réel :

```json
{
  "ca_mensuel": 0,
  "pipeline_total": 1400.00,
  "projets_en_cours": 0,
  "taches_en_retard": 0,
  "prospects_a_appeler": 1,
  "rappels_du_jour": 0
}
```

**Fonctions RPC exposées (6) :**

| Fonction | Usage | Risque |
|----------|-------|--------|
| `get_dashboard_kpis` | Métriques dashboard | Espionnage business |
| `convert_opportunity_to_project` | Conversion commerciale | Manipulation de données |
| `convert_prospect_to_opportunity` | Conversion prospect | Manipulation de données |
| `generer_numero_devis` | Génération n° devis | Épuisement de séquence |
| `generer_numero_facture` | Génération n° facture | Épuisement de séquence |
| `unaccent` | Utilitaire texte | Faible (mais surface inutile) |

**Contexte technique :**
- Les fonctions sont appelées depuis le frontend Next.js via `supabase.rpc('nom_fonction')`
- Les utilisateurs sont toujours authentifiés (signup désactivé)
- Les workflows N8N utilisent le `service_role` (bypass natif)

---

### MISSION

Génère le script SQL complet pour **sécuriser les 6 fonctions RPC**.

### STRATÉGIE DE SÉCURISATION

1. **Révoquer l'accès `anon`** à toutes les fonctions
2. **Conserver l'accès `authenticated`** pour les fonctions utilisées par le frontend
3. **Auditer SECURITY DEFINER vs INVOKER** — Les fonctions SECURITY DEFINER s'exécutent avec les privilèges du créateur, ce qui peut bypasser RLS
4. **Ajouter des vérifications internes** pour les fonctions critiques (conversion, génération de numéros)

### CONTRAINTES

1. **Syntaxe REVOKE/GRANT** — Pour chaque fonction, spécifier la signature complète :
   ```sql
   REVOKE EXECUTE ON FUNCTION public.get_dashboard_kpis() FROM anon;
   GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis() TO authenticated;
   ```

2. **Fonctions avec paramètres** — Pour `convert_opportunity_to_project` et `convert_prospect_to_opportunity`, identifier les paramètres dans la signature.

3. **SECURITY INVOKER** — Recommander la conversion des fonctions SECURITY DEFINER en SECURITY INVOKER pour que RLS s'applique aux requêtes internes des fonctions.

4. **Vérification de rôle interne** — Pour les fonctions de conversion et génération de numéros, ajouter une vérification de rôle admin au début de la fonction :
   ```sql
   IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
     RAISE EXCEPTION 'Accès non autorisé';
   END IF;
   ```

5. **Format de sortie :**
   - Script SQL de diagnostic (lister les privilèges actuels de chaque fonction)
   - Script SQL de remédiation
   - Script SQL de rollback
   - Script de test (vérifier que anon ne peut plus exécuter les fonctions)

### BONNES PRATIQUES À APPLIQUER

- En tant que **Senior Database Security Engineer** : audite le code source de chaque fonction pour détecter des injections SQL ou des élévations de privilèges. Vérifie que les fonctions SECURITY DEFINER ne font pas de SELECT sans filtre sur des tables sensibles.
- En tant que **Senior AppSec Engineer** : vérifie que le frontend gère correctement les erreurs 403/401 quand une fonction est refusée, et que les messages d'erreur ne divulguent pas d'informations internes.
```

---

## Résultat attendu

- Script SQL `005-diagnose-rpc-privileges.sql`
- Script SQL `006-secure-rpc-functions.sql`
- Script SQL `006-rollback-rpc.sql`
- Script SQL `007-test-rpc-access.sql`
