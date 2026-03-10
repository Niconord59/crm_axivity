-- ============================================================================
-- 009-rollback-to-base-policies.sql
-- ROLLBACK : Retour aux politiques de base P0-02
-- CRM Axivity - Securite
-- ============================================================================
--
-- OBJECTIF :
--   En cas de probleme avec les politiques granulaires (009),
--   ce script :
--     1. Supprime TOUTES les politiques granulaires
--     2. Recree les politiques de base P0-02 (authenticated USING(true))
--     3. Restaure les politiques speciales profiles et parametres_entreprise
--
-- ATTENTION :
--   Ce script NE supprime PAS les fonctions helper (008).
--   Elles restent disponibles pour un re-deploiement de 009.
--
-- UTILISATION :
--   Executer ce script dans Supabase SQL Editor si les politiques
--   granulaires causent des problemes d'acces.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1 : SUPPRESSION DE TOUTES LES POLITIQUES GRANULAIRES
-- ============================================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_developer" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- ---- clients ----
DROP POLICY IF EXISTS "clients_select_admin" ON clients;
DROP POLICY IF EXISTS "clients_insert_admin" ON clients;
DROP POLICY IF EXISTS "clients_update_admin" ON clients;
DROP POLICY IF EXISTS "clients_delete_admin" ON clients;
DROP POLICY IF EXISTS "clients_select_developer" ON clients;

-- ---- contacts ----
DROP POLICY IF EXISTS "contacts_select_admin" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_admin" ON contacts;
DROP POLICY IF EXISTS "contacts_update_admin" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_admin" ON contacts;
DROP POLICY IF EXISTS "contacts_select_developer" ON contacts;

-- ---- interactions ----
DROP POLICY IF EXISTS "interactions_select_admin" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_admin" ON interactions;
DROP POLICY IF EXISTS "interactions_update_admin" ON interactions;
DROP POLICY IF EXISTS "interactions_delete_admin" ON interactions;
DROP POLICY IF EXISTS "interactions_select_developer" ON interactions;

-- ---- opportunites ----
DROP POLICY IF EXISTS "opportunites_select_admin" ON opportunites;
DROP POLICY IF EXISTS "opportunites_insert_admin" ON opportunites;
DROP POLICY IF EXISTS "opportunites_update_admin" ON opportunites;
DROP POLICY IF EXISTS "opportunites_delete_admin" ON opportunites;
DROP POLICY IF EXISTS "opportunites_select_developer" ON opportunites;

-- ---- opportunite_contacts ----
DROP POLICY IF EXISTS "opportunite_contacts_select_admin" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_insert_admin" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_update_admin" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_delete_admin" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_select_developer" ON opportunite_contacts;

-- ---- catalogue_services ----
DROP POLICY IF EXISTS "catalogue_services_select_admin" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_insert_admin" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_update_admin" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_delete_admin" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_select_developer" ON catalogue_services;

-- ---- lignes_devis ----
DROP POLICY IF EXISTS "lignes_devis_select_admin" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_insert_admin" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_update_admin" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_delete_admin" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_select_developer" ON lignes_devis;

-- ---- projets ----
DROP POLICY IF EXISTS "projets_select_admin" ON projets;
DROP POLICY IF EXISTS "projets_insert_admin" ON projets;
DROP POLICY IF EXISTS "projets_update_admin" ON projets;
DROP POLICY IF EXISTS "projets_delete_admin" ON projets;
DROP POLICY IF EXISTS "projets_select_developer" ON projets;
DROP POLICY IF EXISTS "projets_update_developer" ON projets;

-- ---- projet_membres ----
DROP POLICY IF EXISTS "projet_membres_select_admin" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_insert_admin" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_update_admin" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_delete_admin" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_select_developer" ON projet_membres;

-- ---- modeles_taches ----
DROP POLICY IF EXISTS "modeles_taches_select_admin" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_insert_admin" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_update_admin" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_delete_admin" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_select_developer" ON modeles_taches;

-- ---- taches ----
DROP POLICY IF EXISTS "taches_select_admin" ON taches;
DROP POLICY IF EXISTS "taches_insert_admin" ON taches;
DROP POLICY IF EXISTS "taches_update_admin" ON taches;
DROP POLICY IF EXISTS "taches_delete_admin" ON taches;
DROP POLICY IF EXISTS "taches_select_developer" ON taches;
DROP POLICY IF EXISTS "taches_insert_developer" ON taches;
DROP POLICY IF EXISTS "taches_update_developer" ON taches;
DROP POLICY IF EXISTS "taches_delete_developer" ON taches;

-- ---- factures ----
DROP POLICY IF EXISTS "factures_select_admin" ON factures;
DROP POLICY IF EXISTS "factures_insert_admin" ON factures;
DROP POLICY IF EXISTS "factures_update_admin" ON factures;
DROP POLICY IF EXISTS "factures_delete_admin" ON factures;
DROP POLICY IF EXISTS "factures_select_developer" ON factures;

-- ---- devis ----
DROP POLICY IF EXISTS "devis_select_admin" ON devis;
DROP POLICY IF EXISTS "devis_insert_admin" ON devis;
DROP POLICY IF EXISTS "devis_update_admin" ON devis;
DROP POLICY IF EXISTS "devis_delete_admin" ON devis;
DROP POLICY IF EXISTS "devis_select_developer" ON devis;

-- ---- parametres_entreprise ----
DROP POLICY IF EXISTS "parametres_select_authenticated" ON parametres_entreprise;
DROP POLICY IF EXISTS "parametres_insert_admin" ON parametres_entreprise;
DROP POLICY IF EXISTS "parametres_update_admin" ON parametres_entreprise;
DROP POLICY IF EXISTS "parametres_delete_admin" ON parametres_entreprise;

-- ---- journal_temps ----
DROP POLICY IF EXISTS "journal_temps_select_admin" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_insert_admin" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_update_admin" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_delete_admin" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_select_developer" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_insert_developer" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_update_developer" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_delete_developer" ON journal_temps;

-- ---- equipe ----
DROP POLICY IF EXISTS "equipe_select_admin" ON equipe;
DROP POLICY IF EXISTS "equipe_insert_admin" ON equipe;
DROP POLICY IF EXISTS "equipe_update_admin" ON equipe;
DROP POLICY IF EXISTS "equipe_delete_admin" ON equipe;
DROP POLICY IF EXISTS "equipe_select_developer" ON equipe;

-- ---- connaissances ----
DROP POLICY IF EXISTS "connaissances_select_admin" ON connaissances;
DROP POLICY IF EXISTS "connaissances_insert_admin" ON connaissances;
DROP POLICY IF EXISTS "connaissances_update_admin" ON connaissances;
DROP POLICY IF EXISTS "connaissances_delete_admin" ON connaissances;
DROP POLICY IF EXISTS "connaissances_select_developer" ON connaissances;
DROP POLICY IF EXISTS "connaissances_insert_developer" ON connaissances;
DROP POLICY IF EXISTS "connaissances_update_developer" ON connaissances;
DROP POLICY IF EXISTS "connaissances_delete_developer" ON connaissances;

-- ---- objectifs ----
DROP POLICY IF EXISTS "objectifs_select_admin" ON objectifs;
DROP POLICY IF EXISTS "objectifs_insert_admin" ON objectifs;
DROP POLICY IF EXISTS "objectifs_update_admin" ON objectifs;
DROP POLICY IF EXISTS "objectifs_delete_admin" ON objectifs;
DROP POLICY IF EXISTS "objectifs_select_developer" ON objectifs;
DROP POLICY IF EXISTS "objectifs_insert_developer" ON objectifs;
DROP POLICY IF EXISTS "objectifs_update_developer" ON objectifs;
DROP POLICY IF EXISTS "objectifs_delete_developer" ON objectifs;

-- ---- resultats_cles ----
DROP POLICY IF EXISTS "resultats_cles_select_admin" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_insert_admin" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_update_admin" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_delete_admin" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_select_developer" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_insert_developer" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_update_developer" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_delete_developer" ON resultats_cles;

-- ---- accomplissements ----
DROP POLICY IF EXISTS "accomplissements_select_admin" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_insert_admin" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_update_admin" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_delete_admin" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_select_developer" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_insert_developer" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_update_developer" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_delete_developer" ON accomplissements;

-- ---- feedback_client ----
DROP POLICY IF EXISTS "feedback_client_select_admin" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_insert_admin" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_update_admin" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_delete_admin" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_select_developer" ON feedback_client;

-- ---- partenaires ----
DROP POLICY IF EXISTS "partenaires_select_admin" ON partenaires;
DROP POLICY IF EXISTS "partenaires_insert_admin" ON partenaires;
DROP POLICY IF EXISTS "partenaires_update_admin" ON partenaires;
DROP POLICY IF EXISTS "partenaires_delete_admin" ON partenaires;
DROP POLICY IF EXISTS "partenaires_select_developer" ON partenaires;

-- ---- changelog ----
DROP POLICY IF EXISTS "changelog_select_admin" ON changelog;
DROP POLICY IF EXISTS "changelog_insert_admin" ON changelog;
DROP POLICY IF EXISTS "changelog_update_admin" ON changelog;
DROP POLICY IF EXISTS "changelog_delete_admin" ON changelog;
DROP POLICY IF EXISTS "changelog_select_developer" ON changelog;
DROP POLICY IF EXISTS "changelog_insert_developer" ON changelog;

-- ---- notifications ----
DROP POLICY IF EXISTS "notifications_select_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_update_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_select_developer" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_developer" ON notifications;
DROP POLICY IF EXISTS "notifications_update_developer" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_developer" ON notifications;

-- ---- demandes_evolution ----
DROP POLICY IF EXISTS "demandes_evolution_select_admin" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_insert_admin" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_update_admin" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_delete_admin" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_select_developer" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_insert_developer" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_update_developer" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_delete_developer" ON demandes_evolution;

-- ---- scenarios_previsionnels ----
DROP POLICY IF EXISTS "scenarios_previsionnels_select_admin" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_insert_admin" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_update_admin" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_delete_admin" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_select_developer" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_insert_developer" ON scenarios_previsionnels;

-- ---- email_templates ----
DROP POLICY IF EXISTS "email_templates_select_admin" ON email_templates;
DROP POLICY IF EXISTS "email_templates_insert_admin" ON email_templates;
DROP POLICY IF EXISTS "email_templates_update_admin" ON email_templates;
DROP POLICY IF EXISTS "email_templates_delete_admin" ON email_templates;
DROP POLICY IF EXISTS "email_templates_select_developer" ON email_templates;

-- ---- documents_v2, record_manager_v2, tabular_document_rows ----
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents_v2') THEN
        DROP POLICY IF EXISTS "documents_v2_select_admin" ON documents_v2;
        DROP POLICY IF EXISTS "documents_v2_insert_admin" ON documents_v2;
        DROP POLICY IF EXISTS "documents_v2_update_admin" ON documents_v2;
        DROP POLICY IF EXISTS "documents_v2_delete_admin" ON documents_v2;
        DROP POLICY IF EXISTS "documents_v2_select_developer" ON documents_v2;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'record_manager_v2') THEN
        DROP POLICY IF EXISTS "record_manager_v2_select_admin" ON record_manager_v2;
        DROP POLICY IF EXISTS "record_manager_v2_insert_admin" ON record_manager_v2;
        DROP POLICY IF EXISTS "record_manager_v2_update_admin" ON record_manager_v2;
        DROP POLICY IF EXISTS "record_manager_v2_delete_admin" ON record_manager_v2;
        DROP POLICY IF EXISTS "record_manager_v2_select_developer" ON record_manager_v2;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tabular_document_rows') THEN
        DROP POLICY IF EXISTS "tabular_document_rows_select_admin" ON tabular_document_rows;
        DROP POLICY IF EXISTS "tabular_document_rows_insert_admin" ON tabular_document_rows;
        DROP POLICY IF EXISTS "tabular_document_rows_update_admin" ON tabular_document_rows;
        DROP POLICY IF EXISTS "tabular_document_rows_delete_admin" ON tabular_document_rows;
        DROP POLICY IF EXISTS "tabular_document_rows_select_developer" ON tabular_document_rows;
    END IF;
END $$;


-- ============================================================================
-- PHASE 2 : RESTAURATION DES POLITIQUES DE BASE P0-02
-- ============================================================================

-- ---- profiles (cas special : propre profil uniquement) ----
CREATE POLICY "profiles_select_authenticated"
    ON profiles FOR SELECT TO authenticated
    USING (auth.uid() = id);
CREATE POLICY "profiles_update_authenticated"
    ON profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ---- parametres_entreprise (cas special) ----
CREATE POLICY "parametres_select_authenticated"
    ON parametres_entreprise FOR SELECT TO authenticated
    USING (true);
CREATE POLICY "parametres_insert_admin"
    ON parametres_entreprise FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "parametres_update_admin"
    ON parametres_entreprise FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "parametres_delete_admin"
    ON parametres_entreprise FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ---- Tables standard : authenticated CRUD complet ----

-- clients
CREATE POLICY "clients_select_authenticated"
    ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert_authenticated"
    ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update_authenticated"
    ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clients_delete_authenticated"
    ON clients FOR DELETE TO authenticated USING (true);

-- contacts
CREATE POLICY "contacts_select_authenticated"
    ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contacts_insert_authenticated"
    ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contacts_update_authenticated"
    ON contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "contacts_delete_authenticated"
    ON contacts FOR DELETE TO authenticated USING (true);

-- interactions
CREATE POLICY "interactions_select_authenticated"
    ON interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "interactions_insert_authenticated"
    ON interactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "interactions_update_authenticated"
    ON interactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "interactions_delete_authenticated"
    ON interactions FOR DELETE TO authenticated USING (true);

-- projets
CREATE POLICY "projets_select_authenticated"
    ON projets FOR SELECT TO authenticated USING (true);
CREATE POLICY "projets_insert_authenticated"
    ON projets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projets_update_authenticated"
    ON projets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projets_delete_authenticated"
    ON projets FOR DELETE TO authenticated USING (true);

-- opportunites
CREATE POLICY "opportunites_select_authenticated"
    ON opportunites FOR SELECT TO authenticated USING (true);
CREATE POLICY "opportunites_insert_authenticated"
    ON opportunites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "opportunites_update_authenticated"
    ON opportunites FOR UPDATE TO authenticated USING (true);
CREATE POLICY "opportunites_delete_authenticated"
    ON opportunites FOR DELETE TO authenticated USING (true);

-- opportunite_contacts
CREATE POLICY "opportunite_contacts_select_authenticated"
    ON opportunite_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "opportunite_contacts_insert_authenticated"
    ON opportunite_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "opportunite_contacts_update_authenticated"
    ON opportunite_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "opportunite_contacts_delete_authenticated"
    ON opportunite_contacts FOR DELETE TO authenticated USING (true);

-- taches
CREATE POLICY "taches_select_authenticated"
    ON taches FOR SELECT TO authenticated USING (true);
CREATE POLICY "taches_insert_authenticated"
    ON taches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "taches_update_authenticated"
    ON taches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "taches_delete_authenticated"
    ON taches FOR DELETE TO authenticated USING (true);

-- factures
CREATE POLICY "factures_select_authenticated"
    ON factures FOR SELECT TO authenticated USING (true);
CREATE POLICY "factures_insert_authenticated"
    ON factures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "factures_update_authenticated"
    ON factures FOR UPDATE TO authenticated USING (true);
CREATE POLICY "factures_delete_authenticated"
    ON factures FOR DELETE TO authenticated USING (true);

-- devis
CREATE POLICY "devis_select_authenticated"
    ON devis FOR SELECT TO authenticated USING (true);
CREATE POLICY "devis_insert_authenticated"
    ON devis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "devis_update_authenticated"
    ON devis FOR UPDATE TO authenticated USING (true);
CREATE POLICY "devis_delete_authenticated"
    ON devis FOR DELETE TO authenticated USING (true);

-- journal_temps
CREATE POLICY "journal_temps_select_authenticated"
    ON journal_temps FOR SELECT TO authenticated USING (true);
CREATE POLICY "journal_temps_insert_authenticated"
    ON journal_temps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "journal_temps_update_authenticated"
    ON journal_temps FOR UPDATE TO authenticated USING (true);
CREATE POLICY "journal_temps_delete_authenticated"
    ON journal_temps FOR DELETE TO authenticated USING (true);

-- catalogue_services
CREATE POLICY "catalogue_services_select_authenticated"
    ON catalogue_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalogue_services_insert_authenticated"
    ON catalogue_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "catalogue_services_update_authenticated"
    ON catalogue_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "catalogue_services_delete_authenticated"
    ON catalogue_services FOR DELETE TO authenticated USING (true);

-- lignes_devis
CREATE POLICY "lignes_devis_select_authenticated"
    ON lignes_devis FOR SELECT TO authenticated USING (true);
CREATE POLICY "lignes_devis_insert_authenticated"
    ON lignes_devis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lignes_devis_update_authenticated"
    ON lignes_devis FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lignes_devis_delete_authenticated"
    ON lignes_devis FOR DELETE TO authenticated USING (true);

-- modeles_taches
CREATE POLICY "modeles_taches_select_authenticated"
    ON modeles_taches FOR SELECT TO authenticated USING (true);
CREATE POLICY "modeles_taches_insert_authenticated"
    ON modeles_taches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "modeles_taches_update_authenticated"
    ON modeles_taches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "modeles_taches_delete_authenticated"
    ON modeles_taches FOR DELETE TO authenticated USING (true);

-- objectifs
CREATE POLICY "objectifs_select_authenticated"
    ON objectifs FOR SELECT TO authenticated USING (true);
CREATE POLICY "objectifs_insert_authenticated"
    ON objectifs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "objectifs_update_authenticated"
    ON objectifs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "objectifs_delete_authenticated"
    ON objectifs FOR DELETE TO authenticated USING (true);

-- resultats_cles
CREATE POLICY "resultats_cles_select_authenticated"
    ON resultats_cles FOR SELECT TO authenticated USING (true);
CREATE POLICY "resultats_cles_insert_authenticated"
    ON resultats_cles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "resultats_cles_update_authenticated"
    ON resultats_cles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "resultats_cles_delete_authenticated"
    ON resultats_cles FOR DELETE TO authenticated USING (true);

-- connaissances
CREATE POLICY "connaissances_select_authenticated"
    ON connaissances FOR SELECT TO authenticated USING (true);
CREATE POLICY "connaissances_insert_authenticated"
    ON connaissances FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "connaissances_update_authenticated"
    ON connaissances FOR UPDATE TO authenticated USING (true);
CREATE POLICY "connaissances_delete_authenticated"
    ON connaissances FOR DELETE TO authenticated USING (true);

-- feedback_client
CREATE POLICY "feedback_client_select_authenticated"
    ON feedback_client FOR SELECT TO authenticated USING (true);
CREATE POLICY "feedback_client_insert_authenticated"
    ON feedback_client FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "feedback_client_update_authenticated"
    ON feedback_client FOR UPDATE TO authenticated USING (true);
CREATE POLICY "feedback_client_delete_authenticated"
    ON feedback_client FOR DELETE TO authenticated USING (true);

-- partenaires
CREATE POLICY "partenaires_select_authenticated"
    ON partenaires FOR SELECT TO authenticated USING (true);
CREATE POLICY "partenaires_insert_authenticated"
    ON partenaires FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "partenaires_update_authenticated"
    ON partenaires FOR UPDATE TO authenticated USING (true);
CREATE POLICY "partenaires_delete_authenticated"
    ON partenaires FOR DELETE TO authenticated USING (true);

-- changelog
CREATE POLICY "changelog_select_authenticated"
    ON changelog FOR SELECT TO authenticated USING (true);
CREATE POLICY "changelog_insert_authenticated"
    ON changelog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "changelog_update_authenticated"
    ON changelog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "changelog_delete_authenticated"
    ON changelog FOR DELETE TO authenticated USING (true);

-- scenarios_previsionnels
CREATE POLICY "scenarios_previsionnels_select_authenticated"
    ON scenarios_previsionnels FOR SELECT TO authenticated USING (true);
CREATE POLICY "scenarios_previsionnels_insert_authenticated"
    ON scenarios_previsionnels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scenarios_previsionnels_update_authenticated"
    ON scenarios_previsionnels FOR UPDATE TO authenticated USING (true);
CREATE POLICY "scenarios_previsionnels_delete_authenticated"
    ON scenarios_previsionnels FOR DELETE TO authenticated USING (true);

-- accomplissements
CREATE POLICY "accomplissements_select_authenticated"
    ON accomplissements FOR SELECT TO authenticated USING (true);
CREATE POLICY "accomplissements_insert_authenticated"
    ON accomplissements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "accomplissements_update_authenticated"
    ON accomplissements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "accomplissements_delete_authenticated"
    ON accomplissements FOR DELETE TO authenticated USING (true);

-- demandes_evolution
CREATE POLICY "demandes_evolution_select_authenticated"
    ON demandes_evolution FOR SELECT TO authenticated USING (true);
CREATE POLICY "demandes_evolution_insert_authenticated"
    ON demandes_evolution FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "demandes_evolution_update_authenticated"
    ON demandes_evolution FOR UPDATE TO authenticated USING (true);
CREATE POLICY "demandes_evolution_delete_authenticated"
    ON demandes_evolution FOR DELETE TO authenticated USING (true);

-- equipe
CREATE POLICY "equipe_select_authenticated"
    ON equipe FOR SELECT TO authenticated USING (true);
CREATE POLICY "equipe_insert_authenticated"
    ON equipe FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "equipe_update_authenticated"
    ON equipe FOR UPDATE TO authenticated USING (true);
CREATE POLICY "equipe_delete_authenticated"
    ON equipe FOR DELETE TO authenticated USING (true);

-- projet_membres
CREATE POLICY "projet_membres_select_authenticated"
    ON projet_membres FOR SELECT TO authenticated USING (true);
CREATE POLICY "projet_membres_insert_authenticated"
    ON projet_membres FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projet_membres_update_authenticated"
    ON projet_membres FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projet_membres_delete_authenticated"
    ON projet_membres FOR DELETE TO authenticated USING (true);

-- notifications
CREATE POLICY "notifications_select_authenticated"
    ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "notifications_insert_authenticated"
    ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update_authenticated"
    ON notifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "notifications_delete_authenticated"
    ON notifications FOR DELETE TO authenticated USING (true);

-- email_templates
CREATE POLICY "email_templates_select_authenticated"
    ON email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "email_templates_insert_authenticated"
    ON email_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "email_templates_update_authenticated"
    ON email_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "email_templates_delete_authenticated"
    ON email_templates FOR DELETE TO authenticated USING (true);

-- documents_v2, record_manager_v2, tabular_document_rows (tables sans migration)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents_v2') THEN
        CREATE POLICY "documents_v2_select_authenticated"
            ON documents_v2 FOR SELECT TO authenticated USING (true);
        CREATE POLICY "documents_v2_insert_authenticated"
            ON documents_v2 FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "documents_v2_update_authenticated"
            ON documents_v2 FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "documents_v2_delete_authenticated"
            ON documents_v2 FOR DELETE TO authenticated USING (true);
        RAISE NOTICE 'Politiques base restaurees pour documents_v2';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'record_manager_v2') THEN
        CREATE POLICY "record_manager_v2_select_authenticated"
            ON record_manager_v2 FOR SELECT TO authenticated USING (true);
        CREATE POLICY "record_manager_v2_insert_authenticated"
            ON record_manager_v2 FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "record_manager_v2_update_authenticated"
            ON record_manager_v2 FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "record_manager_v2_delete_authenticated"
            ON record_manager_v2 FOR DELETE TO authenticated USING (true);
        RAISE NOTICE 'Politiques base restaurees pour record_manager_v2';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tabular_document_rows') THEN
        CREATE POLICY "tabular_document_rows_select_authenticated"
            ON tabular_document_rows FOR SELECT TO authenticated USING (true);
        CREATE POLICY "tabular_document_rows_insert_authenticated"
            ON tabular_document_rows FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "tabular_document_rows_update_authenticated"
            ON tabular_document_rows FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "tabular_document_rows_delete_authenticated"
            ON tabular_document_rows FOR DELETE TO authenticated USING (true);
        RAISE NOTICE 'Politiques base restaurees pour tabular_document_rows';
    END IF;
END $$;


-- ============================================================================
-- PHASE 3 : VERIFICATION
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    blanket_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies WHERE schemaname = 'public';

    SELECT COUNT(*) INTO blanket_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE '%_authenticated';

    RAISE NOTICE '============================================';
    RAISE NOTICE 'ROLLBACK VERIFICATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total politiques: %', policy_count;
    RAISE NOTICE 'Politiques base (authenticated): %', blanket_count;
    RAISE NOTICE 'Rollback vers P0-02 termine avec succes';
    RAISE NOTICE '============================================';
END $$;

COMMIT;
