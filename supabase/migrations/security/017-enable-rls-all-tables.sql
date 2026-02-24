-- ============================================================================
-- 017-enable-rls-all-tables.sql
-- FIX: Enable RLS on all public tables that have policies
-- CRM Axivity - Security Fix
-- ============================================================================
--
-- PROBLEM:
--   Migration 016 created USING(true) policies for authenticated users on all
--   tables, but never ran ALTER TABLE ... ENABLE ROW LEVEL SECURITY.
--   Migration 05 had DISABLED RLS on all tables during development.
--   Result: 57 Supabase linter warnings "policy_exists_rls_disabled"
--   and tables are accessible to the anon role without any restriction.
--
-- SOLUTION:
--   Enable RLS on every public table. The existing policies from migration 016
--   will then be enforced (authenticated-only access).
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Enable RLS on all main tables
-- ============================================================================

-- CRM Core
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS interactions ENABLE ROW LEVEL SECURITY;

-- Sales Pipeline
ALTER TABLE IF EXISTS opportunites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS opportunite_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS catalogue_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lignes_devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS devis ENABLE ROW LEVEL SECURITY;

-- Project Management
ALTER TABLE IF EXISTS projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projet_membres ENABLE ROW LEVEL SECURITY;

-- Finance
ALTER TABLE IF EXISTS factures ENABLE ROW LEVEL SECURITY;

-- Time & Resources
ALTER TABLE IF EXISTS journal_temps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS equipe ENABLE ROW LEVEL SECURITY;

-- Settings & Templates
ALTER TABLE IF EXISTS parametres_entreprise ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Knowledge & Strategy
ALTER TABLE IF EXISTS objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resultats_cles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Enable RLS on conditional tables (may or may not exist)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'connaissances') THEN
        EXECUTE 'ALTER TABLE connaissances ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accomplissements') THEN
        EXECUTE 'ALTER TABLE accomplissements ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feedback_client') THEN
        EXECUTE 'ALTER TABLE feedback_client ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'partenaires') THEN
        EXECUTE 'ALTER TABLE partenaires ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'changelog') THEN
        EXECUTE 'ALTER TABLE changelog ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'demandes_evolution') THEN
        EXECUTE 'ALTER TABLE demandes_evolution ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scenarios_previsionnels') THEN
        EXECUTE 'ALTER TABLE scenarios_previsionnels ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'modeles_taches') THEN
        EXECUTE 'ALTER TABLE modeles_taches ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents_v2') THEN
        EXECUTE 'ALTER TABLE documents_v2 ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'record_manager_v2') THEN
        EXECUTE 'ALTER TABLE record_manager_v2 ENABLE ROW LEVEL SECURITY';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tabular_document_rows') THEN
        EXECUTE 'ALTER TABLE tabular_document_rows ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Catch-all - Enable RLS on ANY remaining public table that has
-- policies but RLS disabled (same condition the Supabase linter checks)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT DISTINCT c.relname AS tablename
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_policy p ON p.polrelid = c.oid
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND NOT c.relrowsecurity
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Enabled RLS on: %', r.tablename;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 4: Create indexes on unindexed foreign keys (performance + linter)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunites_contact_id ON opportunites(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunites_projet_id ON opportunites(projet_id);
CREATE INDEX IF NOT EXISTS idx_lignes_devis_service_id ON lignes_devis(service_id);
CREATE INDEX IF NOT EXISTS idx_factures_contact_id ON factures(contact_id);
CREATE INDEX IF NOT EXISTS idx_journal_temps_tache_id ON journal_temps(tache_id);
CREATE INDEX IF NOT EXISTS idx_objectifs_proprietaire_id ON objectifs(proprietaire_id);
CREATE INDEX IF NOT EXISTS idx_devis_contact_id ON devis(contact_id);
CREATE INDEX IF NOT EXISTS idx_devis_created_by ON devis(created_by);
CREATE INDEX IF NOT EXISTS idx_projet_membres_assigned_by ON projet_membres(assigned_by);

-- ============================================================================
-- STEP 5: Fix function_search_path_mutable (27 functions)
-- Set search_path = '' to prevent search path manipulation attacks
-- ============================================================================

ALTER FUNCTION public.audit_auth_config() SET search_path = '';
ALTER FUNCTION public.calculate_client_health() SET search_path = '';
ALTER FUNCTION public.convert_opportunity_to_project(uuid, date) SET search_path = '';
ALTER FUNCTION public.convert_prospect_to_opportunity(uuid, text, numeric) SET search_path = '';
ALTER FUNCTION public.create_feedback(uuid, uuid, integer, text, text) SET search_path = '';
ALTER FUNCTION public.generate_invoice_number() SET search_path = '';
ALTER FUNCTION public.generer_numero_devis() SET search_path = '';
ALTER FUNCTION public.generer_numero_facture() SET search_path = '';
ALTER FUNCTION public.get_changelog(integer, integer) SET search_path = '';
ALTER FUNCTION public.get_dashboard_kpis() SET search_path = '';
ALTER FUNCTION public.get_pipeline_kpis() SET search_path = '';
ALTER FUNCTION public.get_recent_logins(integer) SET search_path = '';
ALTER FUNCTION public.get_team_profiles() SET search_path = '';
ALTER FUNCTION public.get_user_role() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.is_developer() SET search_path = '';
ALTER FUNCTION public.log_changelog(text, text, uuid) SET search_path = '';
ALTER FUNCTION public.update_client_last_interaction() SET search_path = '';
ALTER FUNCTION public.update_email_templates_updated_at() SET search_path = '';
ALTER FUNCTION public.update_lifecycle_stage_changed_at() SET search_path = '';
ALTER FUNCTION public.update_opportunite_contacts_updated_at() SET search_path = '';
ALTER FUNCTION public.update_parametres_entreprise_updated_at() SET search_path = '';
ALTER FUNCTION public.update_project_hours() SET search_path = '';
ALTER FUNCTION public.update_task_hours() SET search_path = '';
ALTER FUNCTION public.update_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- ============================================================================
-- STEP 6: Move extensions from public to extensions schema
-- ============================================================================

ALTER EXTENSION unaccent SET SCHEMA extensions;
ALTER EXTENSION btree_gist SET SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- ============================================================================
-- STEP 7: Notify PostgREST to reload
-- ============================================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
