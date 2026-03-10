-- ============================================================================
-- 007-test-rpc-access.sql
-- TEST - Verifier que les fonctions RPC sont correctement securisees
-- CRM Axivity - Remediation securite P0-03
-- ============================================================================
--
-- OBJECTIF : Valider que 006-secure-rpc-functions.sql a ete applique
-- RISQUE   : Aucun (lecture seule + tests non-destructifs)
-- QUAND    : Executer APRES 006-secure-rpc-functions.sql
--
-- TESTS :
--   1. Verifier que anon ne peut pas executer les fonctions
--   2. Verifier que authenticated peut executer les fonctions
--   3. Verifier que les fonctions sont en SECURITY INVOKER
--   4. Verifier que les verifications auth internes fonctionnent
-- ============================================================================

-- ============================================================================
-- TEST 1 : PRIVILEGES - anon ne peut pas executer
-- ============================================================================
-- Resultat attendu : toutes les fonctions retournent FALSE pour anon

SELECT
    p.proname AS "Fonction",
    has_function_privilege('anon', p.oid, 'EXECUTE') AS "anon EXECUTE",
    CASE
        WHEN has_function_privilege('anon', p.oid, 'EXECUTE')
        THEN '❌ ECHEC: anon peut encore executer'
        ELSE '✅ PASSE: anon bloque'
    END AS "Test anon bloque"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_dashboard_kpis',
    'convert_opportunity_to_project',
    'convert_prospect_to_opportunity',
    'generer_numero_devis',
    'generer_numero_facture',
    'unaccent'
  )
ORDER BY p.proname;

-- ============================================================================
-- TEST 2 : PRIVILEGES - authenticated peut executer
-- ============================================================================
-- Resultat attendu : toutes les fonctions retournent TRUE pour authenticated

SELECT
    p.proname AS "Fonction",
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS "authenticated EXECUTE",
    CASE
        WHEN has_function_privilege('authenticated', p.oid, 'EXECUTE')
        THEN '✅ PASSE: authenticated autorise'
        ELSE '❌ ECHEC: authenticated bloque!'
    END AS "Test authenticated autorise"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_dashboard_kpis',
    'convert_opportunity_to_project',
    'convert_prospect_to_opportunity',
    'generer_numero_devis',
    'generer_numero_facture',
    'unaccent'
  )
ORDER BY p.proname;

-- ============================================================================
-- TEST 3 : SECURITY MODE - Toutes les fonctions cibles sont INVOKER
-- ============================================================================
-- Resultat attendu : aucune des 5 fonctions custom ne doit etre DEFINER
-- Note : handle_new_user() reste DEFINER intentionnellement (trigger auth)

SELECT
    p.proname AS "Fonction",
    CASE p.prosecdef
        WHEN true THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END AS "Mode",
    CASE p.prosecdef
        WHEN true THEN '❌ ECHEC: encore DEFINER'
        ELSE '✅ PASSE: INVOKER'
    END AS "Test INVOKER"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_dashboard_kpis',
    'convert_opportunity_to_project',
    'convert_prospect_to_opportunity',
    'generer_numero_devis',
    'generer_numero_facture'
  )
ORDER BY p.proname;

-- ============================================================================
-- TEST 4 : VERIFICATION AUTH INTERNE - Les fonctions contiennent auth.uid()
-- ============================================================================
-- Verifie que le code source des fonctions contient une verification auth.uid()

SELECT
    p.proname AS "Fonction",
    CASE
        WHEN pg_get_functiondef(p.oid) LIKE '%auth.uid()%'
        THEN '✅ PASSE: verification auth.uid() presente'
        ELSE '⚠️ ATTENTION: pas de verification auth.uid() dans le corps'
    END AS "Test auth check interne"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'convert_opportunity_to_project',
    'convert_prospect_to_opportunity',
    'generer_numero_devis',
    'generer_numero_facture'
  )
ORDER BY p.proname;

-- ============================================================================
-- TEST 5 : VERIFICATION ROLE CHECK - Les fonctions de conversion ont un check role
-- ============================================================================

SELECT
    p.proname AS "Fonction",
    CASE
        WHEN pg_get_functiondef(p.oid) LIKE '%profiles%' AND pg_get_functiondef(p.oid) LIKE '%role%'
        THEN '✅ PASSE: verification de role presente'
        ELSE '⚠️ INFO: pas de verification de role (peut etre intentionnel)'
    END AS "Test role check"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'convert_opportunity_to_project',
    'convert_prospect_to_opportunity'
  )
ORDER BY p.proname;

-- ============================================================================
-- TEST 6 : AUCUNE FONCTION PUBLIC N'EST ENCORE ACCESSIBLE A ANON
-- ============================================================================
-- Scan complet : verifie qu'aucune autre fonction custom n'est expose a anon
-- (au-dela des 6 cibles de P0-03)

SELECT
    p.proname AS "Fonction exposee a anon",
    pg_get_function_identity_arguments(p.oid) AS "Signature",
    CASE p.prosecdef
        WHEN true THEN '🔴 DEFINER'
        ELSE 'INVOKER'
    END AS "Mode"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND has_function_privilege('anon', p.oid, 'EXECUTE')
  -- Exclure les fonctions systeme/trigger qui ne sont pas appelables via API
  AND p.proname NOT IN (
    'update_updated_at',
    'update_updated_at_column',
    'handle_new_user',
    'calculate_client_health',
    'update_client_last_interaction',
    'update_project_hours',
    'update_task_hours',
    'generate_invoice_number'
  )
ORDER BY p.proname;

-- ============================================================================
-- TEST 7 : RESUME GLOBAL
-- ============================================================================

DO $$
DECLARE
    anon_exposed INTEGER;
    not_invoker INTEGER;
    no_auth_check INTEGER;
BEGIN
    -- Compter les fonctions encore accessibles a anon
    SELECT COUNT(*) INTO anon_exposed
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_dashboard_kpis',
        'convert_opportunity_to_project',
        'convert_prospect_to_opportunity',
        'generer_numero_devis',
        'generer_numero_facture',
        'unaccent'
      )
      AND has_function_privilege('anon', p.oid, 'EXECUTE');

    -- Compter les fonctions encore en SECURITY DEFINER
    SELECT COUNT(*) INTO not_invoker
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_dashboard_kpis',
        'convert_opportunity_to_project',
        'convert_prospect_to_opportunity',
        'generer_numero_devis',
        'generer_numero_facture'
      )
      AND p.prosecdef = true;

    -- Compter les fonctions sans auth.uid() check
    SELECT COUNT(*) INTO no_auth_check
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'convert_opportunity_to_project',
        'convert_prospect_to_opportunity',
        'generer_numero_devis',
        'generer_numero_facture'
      )
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%';

    RAISE NOTICE '============================================';
    RAISE NOTICE 'RESUME DES TESTS P0-03';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Fonctions encore exposees a anon: % (attendu: 0)', anon_exposed;
    RAISE NOTICE 'Fonctions encore SECURITY DEFINER: % (attendu: 0)', not_invoker;
    RAISE NOTICE 'Fonctions sans auth check interne: % (attendu: 0)', no_auth_check;

    IF anon_exposed = 0 AND not_invoker = 0 AND no_auth_check = 0 THEN
        RAISE NOTICE '============================================';
        RAISE NOTICE '✅ TOUS LES TESTS PASSENT - P0-03 REMEDIE';
        RAISE NOTICE '============================================';
    ELSE
        RAISE WARNING '============================================';
        RAISE WARNING '❌ DES TESTS ECHOUENT - VERIFIEZ LES DETAILS';
        RAISE WARNING '============================================';
    END IF;
END $$;

-- ============================================================================
-- FIN DES TESTS
-- Si tous les tests passent, P0-03 est considere comme remedie.
-- Prochaine etape : P0-04 (politiques RLS granulaires)
-- ============================================================================
