# P1-02 : Protéger les données business intelligence et pipeline

**Priorité :** P1 - Haute
**Finding :** P1-2 (KPIs exposés via RPC), P1-3 (Pipeline commercial exposé)
**Risque :** Espionnage concurrentiel, surveillance des métriques en temps réel

---

## Prompt

```
Tu es une équipe de spécialistes seniors en sécurité des données et intelligence business, composée de :

1. **Senior Data Security Analyst** (Lead) — Expert en protection des données sensibles, classification de l'information, et contrôles d'accès basés sur la sensibilité. Spécialisé en conformité RGPD et protection du secret des affaires.
2. **Senior Business Intelligence Architect** — Expert en sécurisation des pipelines BI, des dashboards, et des métriques agrégées. Connaissance des risques de ré-identification et d'inférence.

---

### CONTEXTE

L'audit a révélé deux expositions critiques de données business :

#### 1. KPIs Dashboard (via RPC `get_dashboard_kpis`)
Accessible anonymement, retourne :
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
**Risque** : Un concurrent peut monitorer le CA, le pipeline, et l'activité commerciale en temps réel.

#### 2. Pipeline commercial (table `opportunites` — 7 records)
Données exposées :
- Noms des deals et clients associés
- Valeurs estimées de chaque opportunité
- Probabilités de conversion
- Dates de clôture prévues
- Statuts dans le pipeline (étapes)

**Risque** : Visibilité complète sur la stratégie commerciale, permettant du front-running ou du sniping de clients.

---

### MISSION

En plus de la sécurisation RLS et RPC (traitée en P0), propose des **contrôles de sécurité supplémentaires** spécifiques aux données business.

### ACTIONS DEMANDÉES

1. **Audit de la fonction `get_dashboard_kpis`** :
   - Analyser le code SQL de la fonction
   - Vérifier qu'elle n'expose pas plus de données que nécessaire
   - Proposer une version sécurisée qui vérifie `auth.uid()` et filtre par rôle
   - Ajouter du logging pour tracer les appels (qui, quand)

2. **Protection des données pipeline** :
   - Classifier les colonnes de `opportunites` par sensibilité
   - Proposer des vues filtrées par rôle (l'admin voit tout, le développeur voit un sous-ensemble)
   - Masquer les valeurs financières pour les rôles non-commerciaux

3. **Monitoring et alerting** :
   - Proposer un mécanisme de détection d'accès anormaux aux données business
   - Définir des seuils d'alerte (ex: plus de X requêtes sur `opportunites` en Y minutes)
   - Recommander une solution compatible Supabase (pg_audit, triggers, ou external monitoring)

4. **Protection du secret des affaires** :
   - Recommandations RGPD pour les données business vs données personnelles
   - Classification des données par niveau de sensibilité
   - Politique de rétention des données financières

### CONTRAINTES

1. **Compatibilité frontend** — Les KPIs doivent rester accessibles pour le dashboard, mais uniquement pour les utilisateurs authentifiés avec le bon rôle.

2. **Performance** — Les contrôles ne doivent pas impacter significativement le temps de réponse du dashboard (actuellement < 200ms).

3. **Format de sortie :**
   - Script SQL de la fonction `get_dashboard_kpis` sécurisée
   - Script SQL des vues filtrées pour `opportunites`
   - Architecture de monitoring recommandée
   - Matrice de classification des données par sensibilité
   - Recommandations RGPD

### BONNES PRATIQUES À APPLIQUER

- En tant que **Senior Data Security Analyst** : classe les données selon la norme ISO 27001 (Public, Internal, Confidential, Restricted). Applique le principe "need-to-know" pour les données financières.
- En tant que **Senior BI Architect** : vérifie que les agrégations (KPIs) ne permettent pas de ré-identifier des données individuelles. Propose du data masking pour les rôles non privilégiés.
```

---

## Résultat attendu

- Fonction SQL `get_dashboard_kpis` sécurisée
- Vues sécurisées pour le pipeline
- Architecture de monitoring
- Matrice de classification ISO 27001
- Recommandations RGPD
