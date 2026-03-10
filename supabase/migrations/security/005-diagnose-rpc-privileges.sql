-- ============================================================================
-- 005-diagnose-rpc-privileges.sql
-- LECTURE SEULE - Diagnostic des privileges sur les fonctions RPC
-- CRM Axivity - Remediation securite P0-03
-- ============================================================================
-- OBJECTIF : Auditer les 6 fonctions RPC exposees avant remediation
-- RISQUE   : Aucun (lecture seule)
-- QUAND    : Executer AVANT le script 006-secure-rpc-functions.sql
-- ============================================================================

-- ============================================================================
-- 1. INVENTAIRE DES FONCTIONS RPC DANS LE SCHEMA PUBLIC
-- Liste toutes les fonctions avec leur type de securite et proprietaire
-- ============================================================================

SELECT
    p.proname AS "Fonction",
    pg_get_function_identity_arguments(p.oid) AS "Parametres",
    CASE p.prosecdef
        WHEN true THEN '🔴 SECURITY DEFINER'
        ELSE '✅ SECURITY INVOKER'
    END AS "Mode securite",
    r.rolname AS "Proprietaire",
    l.lanname AS "Langage",
    p.provolatile AS "Volatilite"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON p.proowner = r.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- fonctions uniquement (pas triggers)
ORDER BY p.prosecdef DESC, p.proname;

-- ============================================================================
-- 2. PRIVILEGES EXECUTE PAR ROLE POUR LES 6 FONCTIONS CIBLES
-- Verifie si anon et authenticated ont EXECUTE
-- ============================================================================

SELECT
    p.proname AS "Fonction",
    pg_get_function_identity_arguments(p.oid) AS "Signature",
    has_function_privilege('anon', p.oid, 'EXECUTE') AS "anon peut executer",
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS "authenticated peut executer",
    CASE
        WHEN has_function_privilege('anon', p.oid, 'EXECUTE')
        THEN '🚨 EXPOSE ANONYMEMENT'
        ELSE '✅ Protege'
    END AS "Evaluation"
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
-- 3. ANALYSE SECURITY DEFINER - Fonctions executees avec privileges du createur
-- Ces fonctions bypassent RLS quel que soit l'appelant
-- ============================================================================

SELECT
    p.proname AS "Fonction SECURITY DEFINER",
    pg_get_function_identity_arguments(p.oid) AS "Signature",
    r.rolname AS "S'execute en tant que",
    CASE
        WHEN r.rolsuper THEN '🔴 SUPERUSER - bypass total'
        ELSE '⚠️ Privileges du role ' || r.rolname
    END AS "Impact",
    pg_get_functiondef(p.oid) AS "Code source"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON p.proowner = r.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================================================
-- 4. PRIVILEGES PUBLICS PAR DEFAUT
-- En PostgreSQL, EXECUTE est accorde a PUBLIC par defaut sur les nouvelles
-- fonctions. Cela signifie que le role anon herite de ce privilege.
-- ============================================================================

SELECT
    p.proname AS "Fonction",
    pg_get_function_identity_arguments(p.oid) AS "Signature",
    has_function_privilege('public', p.oid, 'EXECUTE') AS "PUBLIC a EXECUTE",
    has_function_privilege('anon', p.oid, 'EXECUTE') AS "anon a EXECUTE",
    CASE
        WHEN has_function_privilege('public', p.oid, 'EXECUTE')
        THEN '⚠️ EXECUTE via PUBLIC (defaut PostgreSQL)'
        ELSE '✅ PUBLIC revoque'
    END AS "Source du privilege"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.proname IN (
    'get_dashboard_kpis',
    'convert_opportunity_to_project',
    'convert_prospect_to_opportunity',
    'generer_numero_devis',
    'generer_numero_facture'
  )
ORDER BY p.proname;

-- ============================================================================
-- 5. RESUME DES RISQUES
-- ============================================================================

SELECT
    p.proname AS "Fonction",
    CASE
        WHEN has_function_privilege('anon', p.oid, 'EXECUTE') AND p.prosecdef
        THEN '🔴 CRITIQUE: Anonyme + DEFINER (bypass RLS complet)'
        WHEN has_function_privilege('anon', p.oid, 'EXECUTE')
        THEN '🟠 ELEVE: Executable anonymement'
        WHEN p.prosecdef
        THEN '🟡 MOYEN: SECURITY DEFINER (bypass RLS si appele)'
        ELSE '✅ OK'
    END AS "Niveau de risque",
    CASE p.proname
        WHEN 'get_dashboard_kpis' THEN 'Espionnage: CA, pipeline, metriques'
        WHEN 'convert_opportunity_to_project' THEN 'Manipulation: creation projets frauduleux'
        WHEN 'convert_prospect_to_opportunity' THEN 'Manipulation: creation opportunites'
        WHEN 'generer_numero_devis' THEN 'DoS: epuisement sequence devis'
        WHEN 'generer_numero_facture' THEN 'DoS: epuisement sequence factures'
        WHEN 'unaccent' THEN 'Faible: surface d''attaque inutile'
        ELSE 'A evaluer'
    END AS "Impact potentiel"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.proname IN (
    'get_dashboard_kpis',
    'convert_opportunity_to_project',
    'convert_prospect_to_opportunity',
    'generer_numero_devis',
    'generer_numero_facture',
    'unaccent'
  )
ORDER BY
    CASE
        WHEN has_function_privilege('anon', p.oid, 'EXECUTE') AND p.prosecdef THEN 1
        WHEN has_function_privilege('anon', p.oid, 'EXECUTE') THEN 2
        WHEN p.prosecdef THEN 3
        ELSE 4
    END;

-- ============================================================================
-- FIN DU DIAGNOSTIC
-- Executez 006-secure-rpc-functions.sql pour remedier aux problemes trouves.
-- ============================================================================
