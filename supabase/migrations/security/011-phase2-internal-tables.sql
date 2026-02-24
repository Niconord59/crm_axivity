-- ============================================================================
-- P1-01 Phase 2 : Migration des tables Internal Only (non utilisées)
-- ============================================================================
-- Tables déplacées (7) : accomplissements, modeles_taches, documents_v2,
--   partenaires, demandes_evolution, scenarios_previsionnels, connaissances
--
-- EXCLUES (utilisées par le frontend) :
--   - notifications    → use-notifications.ts (supabase.from("notifications"))
--   - projet_membres   → use-projet-membres.ts (supabase.from("projet_membres"))
--
-- Risque : FAIBLE - Aucune des 7 tables n'est utilisée par le frontend ni N8N
-- Rollback : 011-rollback-phase2.sql
-- ============================================================================

-- Vérifier que le schéma private existe (créé en phase 1)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'private') THEN
    RAISE EXCEPTION 'Le schéma private n''existe pas. Exécuter 010-phase1 d''abord.';
  END IF;
END;
$$;

-- ============================================================================
-- 1. Déplacer les tables vers private
-- ============================================================================

-- 1.1 Tables "Connaissance & Stratégie" (non utilisées par le frontend)
ALTER TABLE IF EXISTS public.connaissances SET SCHEMA private;
ALTER TABLE IF EXISTS public.accomplissements SET SCHEMA private;

-- 1.2 Tables "Système" (non utilisées)
ALTER TABLE IF EXISTS public.demandes_evolution SET SCHEMA private;
ALTER TABLE IF EXISTS public.scenarios_previsionnels SET SCHEMA private;

-- 1.3 Tables "Projet" annexes (non utilisées par le frontend)
ALTER TABLE IF EXISTS public.modeles_taches SET SCHEMA private;

-- 1.4 Tables "Documents" (non utilisées par le frontend)
ALTER TABLE IF EXISTS public.documents_v2 SET SCHEMA private;

-- 1.5 Tables "Écosystème" (non utilisées par le frontend)
ALTER TABLE IF EXISTS public.partenaires SET SCHEMA private;

-- ============================================================================
-- 2. Accorder les droits service_role sur les nouvelles tables
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA private TO service_role;

-- ============================================================================
-- 3. Vérification
-- ============================================================================

DO $$
DECLARE
  v_count_private INTEGER;
  v_count_public INTEGER;
  v_tables_expected TEXT[] := ARRAY[
    'connaissances', 'accomplissements',
    'demandes_evolution', 'scenarios_previsionnels', 'modeles_taches',
    'documents_v2', 'partenaires'
  ];
  v_tables_excluded TEXT[] := ARRAY['notifications', 'projet_membres'];
  v_table TEXT;
BEGIN
  v_count_private := 0;
  v_count_public := 0;

  -- Vérifier les tables déplacées
  FOREACH v_table IN ARRAY v_tables_expected LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'private' AND table_name = v_table
    ) THEN
      v_count_private := v_count_private + 1;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      v_count_public := v_count_public + 1;
      RAISE WARNING 'Table % est encore dans public!', v_table;
    ELSE
      RAISE WARNING 'Table % introuvable (peut-être pas encore créée)', v_table;
    END IF;
  END LOOP;

  RAISE NOTICE '=== P1-01 Phase 2 : % tables déplacées vers private, % restent dans public ===',
    v_count_private, v_count_public;

  -- Vérifier que les tables exclues sont toujours dans public
  FOREACH v_table IN ARRAY v_tables_excluded LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      RAISE NOTICE 'OK : % reste dans public (utilisée par le frontend)', v_table;
    ELSE
      RAISE NOTICE 'INFO : % n''existe pas encore dans public', v_table;
    END IF;
  END LOOP;

  -- Compter le total de tables dans private (phases 1+2)
  SELECT COUNT(*) INTO v_count_private
  FROM information_schema.tables
  WHERE table_schema = 'private';

  RAISE NOTICE 'Total tables dans le schéma private : %', v_count_private;
END;
$$;
