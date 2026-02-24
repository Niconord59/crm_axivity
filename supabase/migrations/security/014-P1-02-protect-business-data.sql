-- ============================================================================
-- P1-02 : Protéger les données business intelligence et pipeline
-- ============================================================================
-- OBJECTIF :
--   1. Renforcer get_dashboard_kpis() avec vérification auth.uid() interne
--   2. Créer get_pipeline_kpis() qui retourne des données filtrées par rôle
--   3. Logging d'accès aux données business sensibles
--
-- PRE-REQUIS :
--   - 006-secure-rpc-functions.sql (get_dashboard_kpis INVOKER, anon révoqué)
--   - 008-helper-function-and-indexes.sql (is_admin, is_developer, get_user_role)
--   - 009-granular-rls-policies.sql (politiques granulaires actives)
--
-- ROLLBACK : 014-rollback-P1-02.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RENFORCER get_dashboard_kpis() : Défense en profondeur
-- ============================================================================
-- L'accès anon est déjà révoqué (006) et la fonction est SECURITY INVOKER.
-- On ajoute un check auth.uid() IS NOT NULL comme couche supplémentaire.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Défense en profondeur : vérifier l'authentification même si
  -- les privileges EXECUTE sont déjà restreints à authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour accéder aux KPIs';
  END IF;

  SELECT json_build_object(
    'ca_mensuel', (
      SELECT COALESCE(SUM(montant_ht), 0)
      FROM factures
      WHERE statut = 'Payé'
        AND date_paiement >= date_trunc('month', CURRENT_DATE)
    ),
    'pipeline_total', (
      SELECT COALESCE(SUM(valeur_ponderee), 0)
      FROM opportunites
      WHERE statut NOT IN ('Gagné', 'Perdu')
    ),
    'projets_en_cours', (
      SELECT COUNT(*)
      FROM projets
      WHERE statut = 'En cours'
    ),
    'taches_en_retard', (
      SELECT COUNT(*)
      FROM taches
      WHERE statut != 'Terminé'
        AND date_echeance < CURRENT_DATE
    ),
    'prospects_a_appeler', (
      SELECT COUNT(*)
      FROM contacts
      WHERE statut_prospection = 'À appeler'
    ),
    'rappels_du_jour', (
      SELECT COUNT(*)
      FROM contacts
      WHERE statut_prospection = 'Rappeler'
        AND date_rappel = CURRENT_DATE
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Confirmer les privilèges (idempotent)
REVOKE EXECUTE ON FUNCTION public.get_dashboard_kpis() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_kpis() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis() TO authenticated;

-- ============================================================================
-- 2. CRÉER get_pipeline_kpis() : Résumé pipeline filtré par rôle
-- ============================================================================
-- Admin : voit les données complètes (valeurs, noms de deals)
-- Developer : voit uniquement les agrégats (pas de noms, pas de valeurs unitaires)
-- Empêche l'inférence de données commerciales individuelles
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pipeline_kpis()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  v_role := public.get_user_role()::TEXT;

  IF v_role = 'admin' THEN
    -- Admin : données complètes avec détails par étape
    SELECT json_build_object(
      'total_pipeline', (
        SELECT COALESCE(SUM(valeur_ponderee), 0)
        FROM opportunites WHERE statut NOT IN ('Gagné', 'Perdu')
      ),
      'nb_opportunites', (
        SELECT COUNT(*)
        FROM opportunites WHERE statut NOT IN ('Gagné', 'Perdu')
      ),
      'par_etape', (
        SELECT json_agg(json_build_object(
          'statut', statut,
          'count', cnt,
          'valeur_totale', val_total,
          'valeur_ponderee', val_pond
        ))
        FROM (
          SELECT statut, COUNT(*) as cnt,
                 COALESCE(SUM(valeur_estimee), 0) as val_total,
                 COALESCE(SUM(valeur_ponderee), 0) as val_pond
          FROM opportunites
          WHERE statut NOT IN ('Gagné', 'Perdu')
          GROUP BY statut
          ORDER BY statut
        ) sub
      ),
      'taux_conversion', (
        SELECT CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(
            COUNT(*) FILTER (WHERE statut = 'Gagné')::NUMERIC
            / COUNT(*)::NUMERIC * 100, 1
          )
        END
        FROM opportunites
        WHERE statut IN ('Gagné', 'Perdu')
      ),
      'cycle_moyen_jours', (
        SELECT COALESCE(
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::INTEGER,
          0
        )
        FROM opportunites
        WHERE statut = 'Gagné'
      )
    ) INTO result;
  ELSE
    -- Developer/autre : agrégats uniquement, pas de valeurs financières unitaires
    SELECT json_build_object(
      'nb_opportunites', (
        SELECT COUNT(*)
        FROM opportunites WHERE statut NOT IN ('Gagné', 'Perdu')
      ),
      'par_etape', (
        SELECT json_agg(json_build_object(
          'statut', statut,
          'count', cnt
        ))
        FROM (
          SELECT statut, COUNT(*) as cnt
          FROM opportunites
          WHERE statut NOT IN ('Gagné', 'Perdu')
          GROUP BY statut
          ORDER BY statut
        ) sub
      ),
      'taux_conversion', (
        SELECT CASE
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(
            COUNT(*) FILTER (WHERE statut = 'Gagné')::NUMERIC
            / COUNT(*)::NUMERIC * 100, 1
          )
        END
        FROM opportunites
        WHERE statut IN ('Gagné', 'Perdu')
      )
    ) INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

REVOKE EXECUTE ON FUNCTION public.get_pipeline_kpis() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_pipeline_kpis() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_pipeline_kpis() TO authenticated;

COMMENT ON FUNCTION public.get_pipeline_kpis() IS
  'Retourne les KPIs du pipeline commercial, filtrés par rôle. '
  'Admin : détails complets avec valeurs financières. '
  'Développeur : agrégats uniquement (nombre par étape, taux conversion).';

-- ============================================================================
-- 3. VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  fn_name TEXT;
  fn_oid OID;
  anon_can BOOLEAN;
  auth_can BOOLEAN;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VERIFICATION P1-02 : Protection données business';
  RAISE NOTICE '============================================';

  FOR fn_name IN VALUES ('get_dashboard_kpis'), ('get_pipeline_kpis')
  LOOP
    SELECT p.oid INTO fn_oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = fn_name
    LIMIT 1;

    IF fn_oid IS NULL THEN
      RAISE WARNING 'MANQUANTE : %', fn_name;
      CONTINUE;
    END IF;

    anon_can := has_function_privilege('anon', fn_oid, 'EXECUTE');
    auth_can := has_function_privilege('authenticated', fn_oid, 'EXECUTE');

    IF anon_can THEN
      RAISE WARNING '  %: anon peut exécuter!', fn_name;
    ELSE
      RAISE NOTICE '  OK %: anon bloqué', fn_name;
    END IF;

    IF auth_can THEN
      RAISE NOTICE '  OK %: authenticated autorisé', fn_name;
    ELSE
      RAISE WARNING '  %: authenticated bloqué!', fn_name;
    END IF;
  END LOOP;

  RAISE NOTICE '============================================';
END $$;

COMMIT;

-- ============================================================================
-- MATRICE DE CLASSIFICATION ISO 27001 - Données CRM Axivity
-- ============================================================================
--
-- | Niveau        | Tables/Données                        | Accès                  |
-- |---------------|---------------------------------------|------------------------|
-- | RESTRICTED    | factures (montant_ht, montant_ttc)    | Admin only             |
-- |               | opportunites (valeur_estimee, prob.)   | Admin only (via RPC)   |
-- |               | parametres_entreprise (SIRET, RIB...)  | Admin only (sauf READ) |
-- |               | devis (montants, conditions)           | Admin only             |
-- |---------------|---------------------------------------|------------------------|
-- | CONFIDENTIAL  | contacts (email, tel, LinkedIn)        | Admin + Developer      |
-- |               | clients (SIRET, adresse)               | Admin + Developer      |
-- |               | journal_temps (heures, taux)            | Admin + Dev (own)      |
-- |               | profiles (email, nom)                  | Admin + Own profile    |
-- |---------------|---------------------------------------|------------------------|
-- | INTERNAL      | projets, taches, interactions           | Admin + Developer      |
-- |               | connaissances, objectifs, resultats     | Admin + Developer      |
-- |               | equipe, catalogue_services              | Admin + Developer      |
-- |---------------|---------------------------------------|------------------------|
-- | PUBLIC        | Aucune table exposée sans auth          | -                      |
-- ============================================================================
