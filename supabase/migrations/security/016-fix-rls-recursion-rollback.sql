-- ============================================================================
-- 016-fix-rls-recursion-rollback.sql
-- FIX: Rollback granular RLS policies to simple authenticated policies
-- CRM Axivity - Security Fix
-- ============================================================================
--
-- PROBLEM:
--   Migration 009 created granular RLS policies that use helper functions
--   (public.is_admin(), public.is_developer(), public.get_user_role())
--   which read from the `profiles` table. But `profiles` table policies
--   also called these same functions, creating an infinite recursion
--   detected by PostgreSQL's planner (ERROR 42P17).
--
--   This broke ALL PostgREST API queries with HTTP 500 errors.
--
-- SOLUTION:
--   Replace all function-based policies with simple USING(true) policies
--   for authenticated users. This is acceptable for a 2-user internal CRM.
--
-- FUTURE:
--   To re-implement granular security without recursion:
--   1. Use JWT claims (app_metadata.role) for role checks instead of
--      reading from profiles table
--   2. Or make profiles SELECT policy use USING(true) so the function
--      chain terminates without recursion
--   3. Or use session variables set by a login hook
--
-- PRE-REQUIS: Migration 009 must have been applied (or partial state)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Drop ALL existing policies on all public tables
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
    RAISE NOTICE 'All public schema policies dropped';
END $$;

-- ============================================================================
-- STEP 2: Recreate simple safe policies for all tables
-- Rule: authenticated users get full CRUD (2-user internal CRM)
-- No function calls, no subqueries => no recursion possible
-- ============================================================================

-- ---- profiles ----
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ---- clients ----
CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clients_delete" ON clients FOR DELETE TO authenticated USING (true);

-- ---- contacts ----
CREATE POLICY "contacts_select" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contacts_insert" ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contacts_update" ON contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "contacts_delete" ON contacts FOR DELETE TO authenticated USING (true);

-- ---- interactions ----
CREATE POLICY "interactions_select" ON interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "interactions_insert" ON interactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "interactions_update" ON interactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "interactions_delete" ON interactions FOR DELETE TO authenticated USING (true);

-- ---- opportunites ----
CREATE POLICY "opportunites_select" ON opportunites FOR SELECT TO authenticated USING (true);
CREATE POLICY "opportunites_insert" ON opportunites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "opportunites_update" ON opportunites FOR UPDATE TO authenticated USING (true);
CREATE POLICY "opportunites_delete" ON opportunites FOR DELETE TO authenticated USING (true);

-- ---- opportunite_contacts ----
CREATE POLICY "opp_contacts_select" ON opportunite_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "opp_contacts_insert" ON opportunite_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "opp_contacts_update" ON opportunite_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "opp_contacts_delete" ON opportunite_contacts FOR DELETE TO authenticated USING (true);

-- ---- catalogue_services ----
CREATE POLICY "catalogue_select" ON catalogue_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalogue_insert" ON catalogue_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "catalogue_update" ON catalogue_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "catalogue_delete" ON catalogue_services FOR DELETE TO authenticated USING (true);

-- ---- lignes_devis ----
CREATE POLICY "lignes_devis_select" ON lignes_devis FOR SELECT TO authenticated USING (true);
CREATE POLICY "lignes_devis_insert" ON lignes_devis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lignes_devis_update" ON lignes_devis FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lignes_devis_delete" ON lignes_devis FOR DELETE TO authenticated USING (true);

-- ---- projets ----
CREATE POLICY "projets_select" ON projets FOR SELECT TO authenticated USING (true);
CREATE POLICY "projets_insert" ON projets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projets_update" ON projets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projets_delete" ON projets FOR DELETE TO authenticated USING (true);

-- ---- taches ----
CREATE POLICY "taches_select" ON taches FOR SELECT TO authenticated USING (true);
CREATE POLICY "taches_insert" ON taches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "taches_update" ON taches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "taches_delete" ON taches FOR DELETE TO authenticated USING (true);

-- ---- factures ----
CREATE POLICY "factures_select" ON factures FOR SELECT TO authenticated USING (true);
CREATE POLICY "factures_insert" ON factures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "factures_update" ON factures FOR UPDATE TO authenticated USING (true);
CREATE POLICY "factures_delete" ON factures FOR DELETE TO authenticated USING (true);

-- ---- devis ----
CREATE POLICY "devis_select" ON devis FOR SELECT TO authenticated USING (true);
CREATE POLICY "devis_insert" ON devis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "devis_update" ON devis FOR UPDATE TO authenticated USING (true);
CREATE POLICY "devis_delete" ON devis FOR DELETE TO authenticated USING (true);

-- ---- parametres_entreprise ----
CREATE POLICY "parametres_select" ON parametres_entreprise FOR SELECT TO authenticated USING (true);
CREATE POLICY "parametres_insert" ON parametres_entreprise FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "parametres_update" ON parametres_entreprise FOR UPDATE TO authenticated USING (true);
CREATE POLICY "parametres_delete" ON parametres_entreprise FOR DELETE TO authenticated USING (true);

-- ---- journal_temps ----
CREATE POLICY "journal_temps_select" ON journal_temps FOR SELECT TO authenticated USING (true);
CREATE POLICY "journal_temps_insert" ON journal_temps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "journal_temps_update" ON journal_temps FOR UPDATE TO authenticated USING (true);
CREATE POLICY "journal_temps_delete" ON journal_temps FOR DELETE TO authenticated USING (true);

-- ---- equipe ----
CREATE POLICY "equipe_select" ON equipe FOR SELECT TO authenticated USING (true);
CREATE POLICY "equipe_insert" ON equipe FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "equipe_update" ON equipe FOR UPDATE TO authenticated USING (true);
CREATE POLICY "equipe_delete" ON equipe FOR DELETE TO authenticated USING (true);

-- ---- email_templates ----
CREATE POLICY "email_templates_select" ON email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "email_templates_insert" ON email_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "email_templates_update" ON email_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "email_templates_delete" ON email_templates FOR DELETE TO authenticated USING (true);

-- ---- notifications ----
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated USING (true);

-- ---- objectifs ----
CREATE POLICY "objectifs_select" ON objectifs FOR SELECT TO authenticated USING (true);
CREATE POLICY "objectifs_insert" ON objectifs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "objectifs_update" ON objectifs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "objectifs_delete" ON objectifs FOR DELETE TO authenticated USING (true);

-- ---- resultats_cles ----
CREATE POLICY "resultats_cles_select" ON resultats_cles FOR SELECT TO authenticated USING (true);
CREATE POLICY "resultats_cles_insert" ON resultats_cles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "resultats_cles_update" ON resultats_cles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "resultats_cles_delete" ON resultats_cles FOR DELETE TO authenticated USING (true);

-- ---- projet_membres ----
CREATE POLICY "projet_membres_select" ON projet_membres FOR SELECT TO authenticated USING (true);
CREATE POLICY "projet_membres_insert" ON projet_membres FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projet_membres_update" ON projet_membres FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projet_membres_delete" ON projet_membres FOR DELETE TO authenticated USING (true);

-- ---- Conditional tables (may be in private schema or not exist) ----
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'connaissances') THEN
        CREATE POLICY "connaissances_select" ON connaissances FOR SELECT TO authenticated USING (true);
        CREATE POLICY "connaissances_insert" ON connaissances FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "connaissances_update" ON connaissances FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "connaissances_delete" ON connaissances FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accomplissements') THEN
        CREATE POLICY "accomplissements_select" ON accomplissements FOR SELECT TO authenticated USING (true);
        CREATE POLICY "accomplissements_insert" ON accomplissements FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "accomplissements_update" ON accomplissements FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "accomplissements_delete" ON accomplissements FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feedback_client') THEN
        CREATE POLICY "feedback_client_select" ON feedback_client FOR SELECT TO authenticated USING (true);
        CREATE POLICY "feedback_client_insert" ON feedback_client FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "feedback_client_update" ON feedback_client FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "feedback_client_delete" ON feedback_client FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partenaires') THEN
        CREATE POLICY "partenaires_select" ON partenaires FOR SELECT TO authenticated USING (true);
        CREATE POLICY "partenaires_insert" ON partenaires FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "partenaires_update" ON partenaires FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "partenaires_delete" ON partenaires FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'changelog') THEN
        CREATE POLICY "changelog_select" ON changelog FOR SELECT TO authenticated USING (true);
        CREATE POLICY "changelog_insert" ON changelog FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "changelog_update" ON changelog FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "changelog_delete" ON changelog FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'demandes_evolution') THEN
        CREATE POLICY "demandes_evolution_select" ON demandes_evolution FOR SELECT TO authenticated USING (true);
        CREATE POLICY "demandes_evolution_insert" ON demandes_evolution FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "demandes_evolution_update" ON demandes_evolution FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "demandes_evolution_delete" ON demandes_evolution FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scenarios_previsionnels') THEN
        CREATE POLICY "scenarios_select" ON scenarios_previsionnels FOR SELECT TO authenticated USING (true);
        CREATE POLICY "scenarios_insert" ON scenarios_previsionnels FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "scenarios_update" ON scenarios_previsionnels FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "scenarios_delete" ON scenarios_previsionnels FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'modeles_taches') THEN
        CREATE POLICY "modeles_taches_select" ON modeles_taches FOR SELECT TO authenticated USING (true);
        CREATE POLICY "modeles_taches_insert" ON modeles_taches FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "modeles_taches_update" ON modeles_taches FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "modeles_taches_delete" ON modeles_taches FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents_v2') THEN
        CREATE POLICY "documents_v2_select" ON documents_v2 FOR SELECT TO authenticated USING (true);
        CREATE POLICY "documents_v2_insert" ON documents_v2 FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "documents_v2_update" ON documents_v2 FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "documents_v2_delete" ON documents_v2 FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'record_manager_v2') THEN
        CREATE POLICY "record_manager_v2_select" ON record_manager_v2 FOR SELECT TO authenticated USING (true);
        CREATE POLICY "record_manager_v2_insert" ON record_manager_v2 FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "record_manager_v2_update" ON record_manager_v2 FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "record_manager_v2_delete" ON record_manager_v2 FOR DELETE TO authenticated USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tabular_document_rows') THEN
        CREATE POLICY "tabular_rows_select" ON tabular_document_rows FOR SELECT TO authenticated USING (true);
        CREATE POLICY "tabular_rows_insert" ON tabular_document_rows FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "tabular_rows_update" ON tabular_document_rows FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "tabular_rows_delete" ON tabular_document_rows FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Notify PostgREST to reload
-- ============================================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
