-- ============================================================================
-- 002-rollback-rls.sql
-- ROLLBACK D'URGENCE - Restaure l'etat pre-remediation
-- CRM Axivity - Remediation securite P0-01/P0-02
-- ============================================================================
--
-- ⚠️  ATTENTION : Ce script RESTAURE L'ETAT VULNERABLE
--     N'utiliser qu'en cas de probleme critique post-execution
--     (ex: application completement inaccessible)
--
-- QUOI :
--   1. Supprime les politiques de base creees par 002-enable-rls-and-policies.sql
--   2. Restaure les politiques dev (USING true) pour le fonctionnement de l'app
--   3. NE desactive PAS RLS (pour garder un minimum de structure)
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1 : SUPPRIMER LES POLITIQUES DE BASE (creees par 002)
-- ============================================================================

-- ---- profiles (cas special) ----
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_update_authenticated" ON profiles;

-- ---- parametres_entreprise (cas special) ----
DROP POLICY IF EXISTS "parametres_select_authenticated" ON parametres_entreprise;
DROP POLICY IF EXISTS "parametres_insert_admin" ON parametres_entreprise;
DROP POLICY IF EXISTS "parametres_update_admin" ON parametres_entreprise;
DROP POLICY IF EXISTS "parametres_delete_admin" ON parametres_entreprise;

-- ---- clients ----
DROP POLICY IF EXISTS "clients_select_authenticated" ON clients;
DROP POLICY IF EXISTS "clients_insert_authenticated" ON clients;
DROP POLICY IF EXISTS "clients_update_authenticated" ON clients;
DROP POLICY IF EXISTS "clients_delete_authenticated" ON clients;

-- ---- contacts ----
DROP POLICY IF EXISTS "contacts_select_authenticated" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_authenticated" ON contacts;
DROP POLICY IF EXISTS "contacts_update_authenticated" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_authenticated" ON contacts;

-- ---- interactions ----
DROP POLICY IF EXISTS "interactions_select_authenticated" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_authenticated" ON interactions;
DROP POLICY IF EXISTS "interactions_update_authenticated" ON interactions;
DROP POLICY IF EXISTS "interactions_delete_authenticated" ON interactions;

-- ---- projets ----
DROP POLICY IF EXISTS "projets_select_authenticated" ON projets;
DROP POLICY IF EXISTS "projets_insert_authenticated" ON projets;
DROP POLICY IF EXISTS "projets_update_authenticated" ON projets;
DROP POLICY IF EXISTS "projets_delete_authenticated" ON projets;

-- ---- opportunites ----
DROP POLICY IF EXISTS "opportunites_select_authenticated" ON opportunites;
DROP POLICY IF EXISTS "opportunites_insert_authenticated" ON opportunites;
DROP POLICY IF EXISTS "opportunites_update_authenticated" ON opportunites;
DROP POLICY IF EXISTS "opportunites_delete_authenticated" ON opportunites;

-- ---- taches ----
DROP POLICY IF EXISTS "taches_select_authenticated" ON taches;
DROP POLICY IF EXISTS "taches_insert_authenticated" ON taches;
DROP POLICY IF EXISTS "taches_update_authenticated" ON taches;
DROP POLICY IF EXISTS "taches_delete_authenticated" ON taches;

-- ---- factures ----
DROP POLICY IF EXISTS "factures_select_authenticated" ON factures;
DROP POLICY IF EXISTS "factures_insert_authenticated" ON factures;
DROP POLICY IF EXISTS "factures_update_authenticated" ON factures;
DROP POLICY IF EXISTS "factures_delete_authenticated" ON factures;

-- ---- journal_temps ----
DROP POLICY IF EXISTS "journal_temps_select_authenticated" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_insert_authenticated" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_update_authenticated" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_delete_authenticated" ON journal_temps;

-- ---- catalogue_services ----
DROP POLICY IF EXISTS "catalogue_services_select_authenticated" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_insert_authenticated" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_update_authenticated" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_delete_authenticated" ON catalogue_services;

-- ---- lignes_devis ----
DROP POLICY IF EXISTS "lignes_devis_select_authenticated" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_insert_authenticated" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_update_authenticated" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_delete_authenticated" ON lignes_devis;

-- ---- modeles_taches ----
DROP POLICY IF EXISTS "modeles_taches_select_authenticated" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_insert_authenticated" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_update_authenticated" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_delete_authenticated" ON modeles_taches;

-- ---- objectifs ----
DROP POLICY IF EXISTS "objectifs_select_authenticated" ON objectifs;
DROP POLICY IF EXISTS "objectifs_insert_authenticated" ON objectifs;
DROP POLICY IF EXISTS "objectifs_update_authenticated" ON objectifs;
DROP POLICY IF EXISTS "objectifs_delete_authenticated" ON objectifs;

-- ---- resultats_cles ----
DROP POLICY IF EXISTS "resultats_cles_select_authenticated" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_insert_authenticated" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_update_authenticated" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_delete_authenticated" ON resultats_cles;

-- ---- connaissances ----
DROP POLICY IF EXISTS "connaissances_select_authenticated" ON connaissances;
DROP POLICY IF EXISTS "connaissances_insert_authenticated" ON connaissances;
DROP POLICY IF EXISTS "connaissances_update_authenticated" ON connaissances;
DROP POLICY IF EXISTS "connaissances_delete_authenticated" ON connaissances;

-- ---- feedback_client ----
DROP POLICY IF EXISTS "feedback_client_select_authenticated" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_insert_authenticated" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_update_authenticated" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_delete_authenticated" ON feedback_client;

-- ---- partenaires ----
DROP POLICY IF EXISTS "partenaires_select_authenticated" ON partenaires;
DROP POLICY IF EXISTS "partenaires_insert_authenticated" ON partenaires;
DROP POLICY IF EXISTS "partenaires_update_authenticated" ON partenaires;
DROP POLICY IF EXISTS "partenaires_delete_authenticated" ON partenaires;

-- ---- changelog ----
DROP POLICY IF EXISTS "changelog_select_authenticated" ON changelog;
DROP POLICY IF EXISTS "changelog_insert_authenticated" ON changelog;
DROP POLICY IF EXISTS "changelog_update_authenticated" ON changelog;
DROP POLICY IF EXISTS "changelog_delete_authenticated" ON changelog;

-- ---- scenarios_previsionnels ----
DROP POLICY IF EXISTS "scenarios_previsionnels_select_authenticated" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_insert_authenticated" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_update_authenticated" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_delete_authenticated" ON scenarios_previsionnels;

-- ---- accomplissements ----
DROP POLICY IF EXISTS "accomplissements_select_authenticated" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_insert_authenticated" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_update_authenticated" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_delete_authenticated" ON accomplissements;

-- ---- demandes_evolution ----
DROP POLICY IF EXISTS "demandes_evolution_select_authenticated" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_insert_authenticated" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_update_authenticated" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_delete_authenticated" ON demandes_evolution;

-- ---- equipe ----
DROP POLICY IF EXISTS "equipe_select_authenticated" ON equipe;
DROP POLICY IF EXISTS "equipe_insert_authenticated" ON equipe;
DROP POLICY IF EXISTS "equipe_update_authenticated" ON equipe;
DROP POLICY IF EXISTS "equipe_delete_authenticated" ON equipe;

-- ---- projet_membres ----
DROP POLICY IF EXISTS "projet_membres_select_authenticated" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_insert_authenticated" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_update_authenticated" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_delete_authenticated" ON projet_membres;

-- ---- notifications ----
DROP POLICY IF EXISTS "notifications_select_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_update_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_authenticated" ON notifications;

-- ---- devis ----
DROP POLICY IF EXISTS "devis_select_authenticated" ON devis;
DROP POLICY IF EXISTS "devis_insert_authenticated" ON devis;
DROP POLICY IF EXISTS "devis_update_authenticated" ON devis;
DROP POLICY IF EXISTS "devis_delete_authenticated" ON devis;

-- ---- email_templates ----
DROP POLICY IF EXISTS "email_templates_select_authenticated" ON email_templates;
DROP POLICY IF EXISTS "email_templates_insert_authenticated" ON email_templates;
DROP POLICY IF EXISTS "email_templates_update_authenticated" ON email_templates;
DROP POLICY IF EXISTS "email_templates_delete_authenticated" ON email_templates;

-- ---- opportunite_contacts ----
DROP POLICY IF EXISTS "opportunite_contacts_select_authenticated" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_insert_authenticated" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_update_authenticated" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_delete_authenticated" ON opportunite_contacts;

-- ---- Tables sans migration ----
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents_v2') THEN
        DROP POLICY IF EXISTS "documents_v2_select_authenticated" ON documents_v2;
        DROP POLICY IF EXISTS "documents_v2_insert_authenticated" ON documents_v2;
        DROP POLICY IF EXISTS "documents_v2_update_authenticated" ON documents_v2;
        DROP POLICY IF EXISTS "documents_v2_delete_authenticated" ON documents_v2;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'record_manager_v2') THEN
        DROP POLICY IF EXISTS "record_manager_v2_select_authenticated" ON record_manager_v2;
        DROP POLICY IF EXISTS "record_manager_v2_insert_authenticated" ON record_manager_v2;
        DROP POLICY IF EXISTS "record_manager_v2_update_authenticated" ON record_manager_v2;
        DROP POLICY IF EXISTS "record_manager_v2_delete_authenticated" ON record_manager_v2;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tabular_document_rows') THEN
        DROP POLICY IF EXISTS "tabular_document_rows_select_authenticated" ON tabular_document_rows;
        DROP POLICY IF EXISTS "tabular_document_rows_insert_authenticated" ON tabular_document_rows;
        DROP POLICY IF EXISTS "tabular_document_rows_update_authenticated" ON tabular_document_rows;
        DROP POLICY IF EXISTS "tabular_document_rows_delete_authenticated" ON tabular_document_rows;
    END IF;
END $$;

-- ============================================================================
-- PHASE 2 : RESTAURER LES POLITIQUES DEV (acces anonyme)
-- ============================================================================
-- ⚠️  CECI RESTAURE L'ETAT VULNERABLE - TEMPORAIRE UNIQUEMENT
-- ============================================================================

-- profiles
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_dev_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_dev_update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_dev_delete" ON profiles FOR DELETE USING (true);

-- equipe
CREATE POLICY "equipe_select_anon" ON equipe FOR SELECT USING (true);
CREATE POLICY "equipe_insert_anon" ON equipe FOR INSERT WITH CHECK (true);
CREATE POLICY "equipe_update_anon" ON equipe FOR UPDATE USING (true);
CREATE POLICY "equipe_delete_anon" ON equipe FOR DELETE USING (true);

-- Tables principales (dev policies)
CREATE POLICY "clients_dev_select" ON clients FOR SELECT USING (true);
CREATE POLICY "clients_dev_insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "clients_dev_update" ON clients FOR UPDATE USING (true);
CREATE POLICY "clients_dev_delete" ON clients FOR DELETE USING (true);

CREATE POLICY "contacts_dev_select" ON contacts FOR SELECT USING (true);
CREATE POLICY "contacts_dev_insert" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "contacts_dev_update" ON contacts FOR UPDATE USING (true);
CREATE POLICY "contacts_dev_delete" ON contacts FOR DELETE USING (true);

CREATE POLICY "projets_dev_select" ON projets FOR SELECT USING (true);
CREATE POLICY "projets_dev_insert" ON projets FOR INSERT WITH CHECK (true);
CREATE POLICY "projets_dev_update" ON projets FOR UPDATE USING (true);
CREATE POLICY "projets_dev_delete" ON projets FOR DELETE USING (true);

CREATE POLICY "opportunites_dev_select" ON opportunites FOR SELECT USING (true);
CREATE POLICY "opportunites_dev_insert" ON opportunites FOR INSERT WITH CHECK (true);
CREATE POLICY "opportunites_dev_update" ON opportunites FOR UPDATE USING (true);
CREATE POLICY "opportunites_dev_delete" ON opportunites FOR DELETE USING (true);

CREATE POLICY "taches_dev_select" ON taches FOR SELECT USING (true);
CREATE POLICY "taches_dev_insert" ON taches FOR INSERT WITH CHECK (true);
CREATE POLICY "taches_dev_update" ON taches FOR UPDATE USING (true);
CREATE POLICY "taches_dev_delete" ON taches FOR DELETE USING (true);

CREATE POLICY "factures_dev_select" ON factures FOR SELECT USING (true);
CREATE POLICY "factures_dev_insert" ON factures FOR INSERT WITH CHECK (true);
CREATE POLICY "factures_dev_update" ON factures FOR UPDATE USING (true);
CREATE POLICY "factures_dev_delete" ON factures FOR DELETE USING (true);

CREATE POLICY "interactions_dev_select" ON interactions FOR SELECT USING (true);
CREATE POLICY "interactions_dev_insert" ON interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "interactions_dev_update" ON interactions FOR UPDATE USING (true);
CREATE POLICY "interactions_dev_delete" ON interactions FOR DELETE USING (true);

CREATE POLICY "journal_temps_dev_select" ON journal_temps FOR SELECT USING (true);
CREATE POLICY "journal_temps_dev_insert" ON journal_temps FOR INSERT WITH CHECK (true);
CREATE POLICY "journal_temps_dev_update" ON journal_temps FOR UPDATE USING (true);

CREATE POLICY "catalogue_dev_select" ON catalogue_services FOR SELECT USING (true);
CREATE POLICY "lignes_devis_dev_select" ON lignes_devis FOR SELECT USING (true);
CREATE POLICY "lignes_devis_dev_insert" ON lignes_devis FOR INSERT WITH CHECK (true);
CREATE POLICY "modeles_taches_dev_select" ON modeles_taches FOR SELECT USING (true);
CREATE POLICY "feedback_dev_select" ON feedback_client FOR SELECT USING (true);
CREATE POLICY "feedback_dev_insert" ON feedback_client FOR INSERT WITH CHECK (true);
CREATE POLICY "partenaires_dev_select" ON partenaires FOR SELECT USING (true);
CREATE POLICY "connaissances_dev_select" ON connaissances FOR SELECT USING (true);
CREATE POLICY "connaissances_dev_insert" ON connaissances FOR INSERT WITH CHECK (true);
CREATE POLICY "accomplissements_dev_select" ON accomplissements FOR SELECT USING (true);
CREATE POLICY "accomplissements_dev_insert" ON accomplissements FOR INSERT WITH CHECK (true);
CREATE POLICY "objectifs_dev_select" ON objectifs FOR SELECT USING (true);
CREATE POLICY "resultats_cles_dev_select" ON resultats_cles FOR SELECT USING (true);
CREATE POLICY "changelog_dev_select" ON changelog FOR SELECT USING (true);
CREATE POLICY "demandes_dev_select" ON demandes_evolution FOR SELECT USING (true);
CREATE POLICY "demandes_dev_insert" ON demandes_evolution FOR INSERT WITH CHECK (true);
CREATE POLICY "scenarios_dev_select" ON scenarios_previsionnels FOR SELECT USING (true);

COMMIT;

-- ============================================================================
-- ⚠️  RAPPEL : Ce rollback restaure l'etat VULNERABLE.
--     Planifiez une nouvelle remediation des que possible.
-- ============================================================================
