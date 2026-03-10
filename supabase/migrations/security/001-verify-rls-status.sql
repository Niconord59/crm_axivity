-- ============================================================================
-- 001-verify-rls-status.sql
-- LECTURE SEULE - Script de verification pre-execution
-- CRM Axivity - Remediation securite P0-01
-- ============================================================================
-- OBJECTIF : Verifier l'etat actuel de RLS sur toutes les tables publiques
-- RISQUE   : Aucun (lecture seule)
-- QUAND    : Executer AVANT le script 002-enable-rls-and-policies.sql
-- ============================================================================

-- ============================================================================
-- 1. ETAT RLS PAR TABLE
-- Affiche si RLS est active (true) ou desactive (false) pour chaque table
-- ============================================================================

SELECT
    tablename AS "Table",
    rowsecurity AS "RLS Active",
    CASE
        WHEN rowsecurity THEN '✅ Protegee'
        ELSE '❌ NON PROTEGEE'
    END AS "Statut"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;

-- ============================================================================
-- 2. COMPTAGE RESUME
-- ============================================================================

SELECT
    COUNT(*) FILTER (WHERE rowsecurity = true) AS "Tables avec RLS",
    COUNT(*) FILTER (WHERE rowsecurity = false) AS "Tables SANS RLS",
    COUNT(*) AS "Total tables"
FROM pg_tables
WHERE schemaname = 'public';

-- ============================================================================
-- 3. POLITIQUES EXISTANTES PAR TABLE
-- Identifie les politiques dangereuses (dev/anon) avec USING (true)
-- ============================================================================

SELECT
    schemaname AS "Schema",
    tablename AS "Table",
    policyname AS "Politique",
    permissive AS "Permissive",
    roles AS "Roles",
    cmd AS "Operation",
    qual AS "USING (condition)",
    with_check AS "WITH CHECK",
    CASE
        WHEN qual = 'true' AND (roles = '{public}' OR roles @> ARRAY['anon']::name[])
        THEN '🚨 DANGER: Acces anonyme!'
        WHEN qual = 'true'
        THEN '⚠️ Permissif (true)'
        ELSE '✅ Restreint'
    END AS "Evaluation"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. TABLES SANS AUCUNE POLITIQUE
-- Ces tables auraient RLS active mais aucun acces possible (lockout)
-- ============================================================================

SELECT t.tablename AS "Table SANS politique"
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- ============================================================================
-- 5. POLITIQUES DEV/ANON A SUPPRIMER
-- Liste exhaustive des politiques dangereuses qui seront supprimees
-- ============================================================================

SELECT
    tablename AS "Table",
    policyname AS "Politique a supprimer",
    cmd AS "Operation",
    qual AS "Condition (devrait etre restrictive)"
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    -- Politiques dev explicites
    policyname LIKE '%_dev_%'
    OR policyname LIKE '%_anon%'
    -- Politiques trop permissives sans restriction de role
    OR (qual = 'true' AND roles = '{public}')
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. FONCTIONS RPC EXPOSEES
-- Verifie que les fonctions helper RLS existent
-- ============================================================================

SELECT
    routine_name AS "Fonction",
    routine_schema AS "Schema",
    data_type AS "Type retour"
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name IN ('user_role', 'user_client_id', 'is_admin_or_manager')
ORDER BY routine_name;

-- ============================================================================
-- FIN DU SCRIPT DE VERIFICATION
-- Si des tables apparaissent dans la section 4 (SANS politique),
-- verifiez qu'elles seront couvertes par le script 002.
-- ============================================================================
