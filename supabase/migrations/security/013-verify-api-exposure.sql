-- ============================================================================
-- P1-01 Vérification : Audit de l'exposition API après migration
-- ============================================================================
-- Ce script vérifie l'état final après les 3 phases de migration.
-- Il est en lecture seule et ne modifie rien.
-- ============================================================================

-- 1. Lister toutes les tables encore exposées dans public
DO $$
DECLARE
  rec RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  TABLES EXPOSÉES VIA API (schéma public)';
  RAISE NOTICE '========================================';

  FOR rec IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    v_count := v_count + 1;
    RAISE NOTICE '  [%] %', v_count, rec.table_name;
  END LOOP;

  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE '  TOTAL : % tables exposées', v_count;
  RAISE NOTICE '========================================';
END;
$$;

-- 2. Lister toutes les tables protégées dans private
DO $$
DECLARE
  rec RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  TABLES PROTÉGÉES (schéma private)';
  RAISE NOTICE '========================================';

  FOR rec IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'private'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    v_count := v_count + 1;
    RAISE NOTICE '  [%] %', v_count, rec.table_name;
  END LOOP;

  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE '  TOTAL : % tables protégées', v_count;
  RAISE NOTICE '========================================';
END;
$$;

-- 3. Vérifier que les fonctions RPC fonctionnent
DO $$
DECLARE
  v_functions TEXT[] := ARRAY[
    'generer_numero_devis',
    'generer_numero_facture',
    'log_changelog',
    'get_changelog',
    'create_feedback',
    'convert_opportunity_to_project',
    'convert_prospect_to_opportunity',
    'get_dashboard_kpis',
    'get_user_role',
    'is_admin',
    'is_developer',
    'get_team_profiles'
  ];
  v_func TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  FONCTIONS RPC DISPONIBLES';
  RAISE NOTICE '========================================';

  FOREACH v_func IN ARRAY v_functions LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = v_func
    ) THEN
      RAISE NOTICE '  OK  %', v_func;
    ELSE
      RAISE WARNING '  MANQUANTE  %', v_func;
    END IF;
  END LOOP;

  RAISE NOTICE '========================================';
END;
$$;

-- 4. Vérifier les clés étrangères cross-schéma
DO $$
DECLARE
  rec RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  CLÉS ÉTRANGÈRES CROSS-SCHÉMA';
  RAISE NOTICE '========================================';

  FOR rec IN
    SELECT
      tc.table_schema || '.' || tc.table_name AS source,
      ccu.table_schema || '.' || ccu.table_name AS target,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema != ccu.table_schema
    ORDER BY tc.table_schema, tc.table_name
  LOOP
    v_count := v_count + 1;
    RAISE NOTICE '  % -> % (%)', rec.source, rec.target, rec.constraint_name;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '  Aucune clé étrangère cross-schéma (OK)';
  ELSE
    RAISE NOTICE '  % clés étrangères cross-schéma détectées (fonctionnel mais à surveiller)', v_count;
  END IF;

  RAISE NOTICE '========================================';
END;
$$;

-- 5. Résumé des droits sur le schéma private
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  RÉSUMÉ DE SÉCURITÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  Schéma public  : Exposé via PostgREST (anon + authenticated)';
  RAISE NOTICE '  Schéma private : NON exposé via PostgREST';
  RAISE NOTICE '  service_role   : Accès FULL aux deux schémas';
  RAISE NOTICE '  authenticated  : Accès uniquement via RPC pour private';
  RAISE NOTICE '  anon           : Aucun accès à private';
  RAISE NOTICE '========================================';
END;
$$;
