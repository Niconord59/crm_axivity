-- ============================================================================
-- 009-granular-rls-policies.sql
-- POLITIQUES RLS GRANULAIRES PAR ROLE - P0-04
-- CRM Axivity - Securite
-- ============================================================================
--
-- OBJECTIF :
--   Remplacer les politiques blanket (USING(true)) par des politiques
--   granulaires basees sur le role de l'utilisateur :
--     - admin : acces CRUD complet sur toutes les tables
--     - developpeur_nocode / developpeur_automatisme : acces restreint
--     - commercial / client : bloques par defaut (extensible plus tard)
--
-- PRE-REQUIS :
--   - 008-helper-function-and-indexes.sql (fonctions helper + index)
--   - 002-enable-rls-and-policies.sql (RLS active)
--
-- CONVENTION NOMMAGE : {table}_{operation}_{role}
--   ex: clients_select_admin, taches_update_developer
--
-- ROLLBACK : 009-rollback-to-base-policies.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1 : SUPPRESSION DE TOUTES LES POLITIQUES EXISTANTES
-- ============================================================================
-- On supprime TOUT (P0-02 base, residus 02_rls.sql, residus migration 11,
-- residus migration 18, residus migration 20) pour repartir proprement.
-- ============================================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_update_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_select" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_update" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_delete" ON profiles;

-- ---- clients ----
DROP POLICY IF EXISTS "clients_select_authenticated" ON clients;
DROP POLICY IF EXISTS "clients_insert_authenticated" ON clients;
DROP POLICY IF EXISTS "clients_update_authenticated" ON clients;
DROP POLICY IF EXISTS "clients_delete_authenticated" ON clients;
DROP POLICY IF EXISTS "clients_select_developers" ON clients;
DROP POLICY IF EXISTS "clients_select_commercial" ON clients;
DROP POLICY IF EXISTS "clients_insert_commercial" ON clients;
DROP POLICY IF EXISTS "clients_update_commercial" ON clients;
DROP POLICY IF EXISTS "clients_dev_select" ON clients;
DROP POLICY IF EXISTS "clients_dev_insert" ON clients;
DROP POLICY IF EXISTS "clients_dev_update" ON clients;
DROP POLICY IF EXISTS "clients_dev_delete" ON clients;

-- ---- contacts ----
DROP POLICY IF EXISTS "contacts_select_authenticated" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_authenticated" ON contacts;
DROP POLICY IF EXISTS "contacts_update_authenticated" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_authenticated" ON contacts;
DROP POLICY IF EXISTS "contacts_select_developers" ON contacts;
DROP POLICY IF EXISTS "contacts_select_commercial" ON contacts;
DROP POLICY IF EXISTS "contacts_crud_commercial" ON contacts;
DROP POLICY IF EXISTS "contacts_dev_select" ON contacts;
DROP POLICY IF EXISTS "contacts_dev_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_dev_update" ON contacts;
DROP POLICY IF EXISTS "contacts_dev_delete" ON contacts;

-- ---- interactions ----
DROP POLICY IF EXISTS "interactions_select_authenticated" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_authenticated" ON interactions;
DROP POLICY IF EXISTS "interactions_update_authenticated" ON interactions;
DROP POLICY IF EXISTS "interactions_delete_authenticated" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_developers" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_commercial" ON interactions;
DROP POLICY IF EXISTS "interactions_insert" ON interactions;
DROP POLICY IF EXISTS "interactions_all_admin" ON interactions;
DROP POLICY IF EXISTS "interactions_dev_select" ON interactions;
DROP POLICY IF EXISTS "interactions_dev_insert" ON interactions;
DROP POLICY IF EXISTS "interactions_dev_update" ON interactions;
DROP POLICY IF EXISTS "interactions_dev_delete" ON interactions;

-- ---- opportunites ----
DROP POLICY IF EXISTS "opportunites_select_authenticated" ON opportunites;
DROP POLICY IF EXISTS "opportunites_insert_authenticated" ON opportunites;
DROP POLICY IF EXISTS "opportunites_update_authenticated" ON opportunites;
DROP POLICY IF EXISTS "opportunites_delete_authenticated" ON opportunites;
DROP POLICY IF EXISTS "opportunites_select_developers" ON opportunites;
DROP POLICY IF EXISTS "opportunites_select_commercial" ON opportunites;
DROP POLICY IF EXISTS "opportunites_crud_commercial" ON opportunites;
DROP POLICY IF EXISTS "opportunites_dev_select" ON opportunites;
DROP POLICY IF EXISTS "opportunites_dev_insert" ON opportunites;
DROP POLICY IF EXISTS "opportunites_dev_update" ON opportunites;
DROP POLICY IF EXISTS "opportunites_dev_delete" ON opportunites;

-- ---- opportunite_contacts ----
DROP POLICY IF EXISTS "opportunite_contacts_select_authenticated" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_insert_authenticated" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_update_authenticated" ON opportunite_contacts;
DROP POLICY IF EXISTS "opportunite_contacts_delete_authenticated" ON opportunite_contacts;

-- ---- catalogue_services ----
DROP POLICY IF EXISTS "catalogue_services_select_authenticated" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_insert_authenticated" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_update_authenticated" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_services_delete_authenticated" ON catalogue_services;
DROP POLICY IF EXISTS "catalogue_dev_select" ON catalogue_services;

-- ---- lignes_devis ----
DROP POLICY IF EXISTS "lignes_devis_select_authenticated" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_insert_authenticated" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_update_authenticated" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_delete_authenticated" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_dev_select" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_dev_insert" ON lignes_devis;

-- ---- projets ----
DROP POLICY IF EXISTS "projets_select_authenticated" ON projets;
DROP POLICY IF EXISTS "projets_insert_authenticated" ON projets;
DROP POLICY IF EXISTS "projets_update_authenticated" ON projets;
DROP POLICY IF EXISTS "projets_delete_authenticated" ON projets;
DROP POLICY IF EXISTS "projets_select_developers" ON projets;
DROP POLICY IF EXISTS "projets_select_commercial" ON projets;
DROP POLICY IF EXISTS "projets_select_developpeur_nocode" ON projets;
DROP POLICY IF EXISTS "projets_select_developpeur_automatisme" ON projets;
DROP POLICY IF EXISTS "projets_dev_select" ON projets;
DROP POLICY IF EXISTS "projets_dev_insert" ON projets;
DROP POLICY IF EXISTS "projets_dev_update" ON projets;
DROP POLICY IF EXISTS "projets_dev_delete" ON projets;

-- ---- projet_membres ----
DROP POLICY IF EXISTS "projet_membres_select_authenticated" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_insert_authenticated" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_update_authenticated" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_delete_authenticated" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_select_all" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_insert_admin" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_update_admin" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_delete_admin" ON projet_membres;

-- ---- modeles_taches ----
DROP POLICY IF EXISTS "modeles_taches_select_authenticated" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_insert_authenticated" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_update_authenticated" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_delete_authenticated" ON modeles_taches;
DROP POLICY IF EXISTS "modeles_taches_dev_select" ON modeles_taches;

-- ---- taches ----
DROP POLICY IF EXISTS "taches_select_authenticated" ON taches;
DROP POLICY IF EXISTS "taches_insert_authenticated" ON taches;
DROP POLICY IF EXISTS "taches_update_authenticated" ON taches;
DROP POLICY IF EXISTS "taches_delete_authenticated" ON taches;
DROP POLICY IF EXISTS "taches_select_developers" ON taches;
DROP POLICY IF EXISTS "taches_update_developers" ON taches;
DROP POLICY IF EXISTS "taches_dev_select" ON taches;
DROP POLICY IF EXISTS "taches_dev_insert" ON taches;
DROP POLICY IF EXISTS "taches_dev_update" ON taches;
DROP POLICY IF EXISTS "taches_dev_delete" ON taches;

-- ---- factures ----
DROP POLICY IF EXISTS "factures_select_authenticated" ON factures;
DROP POLICY IF EXISTS "factures_insert_authenticated" ON factures;
DROP POLICY IF EXISTS "factures_update_authenticated" ON factures;
DROP POLICY IF EXISTS "factures_delete_authenticated" ON factures;
DROP POLICY IF EXISTS "factures_select_developers" ON factures;
DROP POLICY IF EXISTS "factures_select_commercial" ON factures;
DROP POLICY IF EXISTS "factures_dev_select" ON factures;
DROP POLICY IF EXISTS "factures_dev_insert" ON factures;
DROP POLICY IF EXISTS "factures_dev_update" ON factures;
DROP POLICY IF EXISTS "factures_dev_delete" ON factures;

-- ---- devis ----
DROP POLICY IF EXISTS "devis_select_authenticated" ON devis;
DROP POLICY IF EXISTS "devis_insert_authenticated" ON devis;
DROP POLICY IF EXISTS "devis_update_authenticated" ON devis;
DROP POLICY IF EXISTS "devis_delete_authenticated" ON devis;
DROP POLICY IF EXISTS "Users can view all devis" ON devis;
DROP POLICY IF EXISTS "Users can create devis" ON devis;
DROP POLICY IF EXISTS "Users can update devis" ON devis;
DROP POLICY IF EXISTS "Only admins can delete devis" ON devis;

-- ---- parametres_entreprise ----
DROP POLICY IF EXISTS "parametres_select_authenticated" ON parametres_entreprise;
DROP POLICY IF EXISTS "parametres_insert_admin" ON parametres_entreprise;
DROP POLICY IF EXISTS "parametres_update_admin" ON parametres_entreprise;
DROP POLICY IF EXISTS "parametres_delete_admin" ON parametres_entreprise;

-- ---- journal_temps ----
DROP POLICY IF EXISTS "journal_temps_select_authenticated" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_insert_authenticated" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_update_authenticated" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_delete_authenticated" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_dev_select" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_dev_insert" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_dev_update" ON journal_temps;

-- ---- equipe ----
DROP POLICY IF EXISTS "equipe_select_authenticated" ON equipe;
DROP POLICY IF EXISTS "equipe_insert_authenticated" ON equipe;
DROP POLICY IF EXISTS "equipe_update_authenticated" ON equipe;
DROP POLICY IF EXISTS "equipe_delete_authenticated" ON equipe;
DROP POLICY IF EXISTS "equipe_select_anon" ON equipe;
DROP POLICY IF EXISTS "equipe_insert_anon" ON equipe;
DROP POLICY IF EXISTS "equipe_update_anon" ON equipe;
DROP POLICY IF EXISTS "equipe_delete_anon" ON equipe;

-- ---- connaissances ----
DROP POLICY IF EXISTS "connaissances_select_authenticated" ON connaissances;
DROP POLICY IF EXISTS "connaissances_insert_authenticated" ON connaissances;
DROP POLICY IF EXISTS "connaissances_update_authenticated" ON connaissances;
DROP POLICY IF EXISTS "connaissances_delete_authenticated" ON connaissances;
DROP POLICY IF EXISTS "connaissances_dev_select" ON connaissances;
DROP POLICY IF EXISTS "connaissances_dev_insert" ON connaissances;

-- ---- objectifs ----
DROP POLICY IF EXISTS "objectifs_select_authenticated" ON objectifs;
DROP POLICY IF EXISTS "objectifs_insert_authenticated" ON objectifs;
DROP POLICY IF EXISTS "objectifs_update_authenticated" ON objectifs;
DROP POLICY IF EXISTS "objectifs_delete_authenticated" ON objectifs;
DROP POLICY IF EXISTS "objectifs_dev_select" ON objectifs;

-- ---- resultats_cles ----
DROP POLICY IF EXISTS "resultats_cles_select_authenticated" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_insert_authenticated" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_update_authenticated" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_delete_authenticated" ON resultats_cles;
DROP POLICY IF EXISTS "resultats_cles_dev_select" ON resultats_cles;

-- ---- accomplissements ----
DROP POLICY IF EXISTS "accomplissements_select_authenticated" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_insert_authenticated" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_update_authenticated" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_delete_authenticated" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_dev_select" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_dev_insert" ON accomplissements;

-- ---- feedback_client ----
DROP POLICY IF EXISTS "feedback_client_select_authenticated" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_insert_authenticated" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_update_authenticated" ON feedback_client;
DROP POLICY IF EXISTS "feedback_client_delete_authenticated" ON feedback_client;
DROP POLICY IF EXISTS "feedback_dev_select" ON feedback_client;
DROP POLICY IF EXISTS "feedback_dev_insert" ON feedback_client;

-- ---- partenaires ----
DROP POLICY IF EXISTS "partenaires_select_authenticated" ON partenaires;
DROP POLICY IF EXISTS "partenaires_insert_authenticated" ON partenaires;
DROP POLICY IF EXISTS "partenaires_update_authenticated" ON partenaires;
DROP POLICY IF EXISTS "partenaires_delete_authenticated" ON partenaires;
DROP POLICY IF EXISTS "partenaires_dev_select" ON partenaires;

-- ---- changelog ----
DROP POLICY IF EXISTS "changelog_select_authenticated" ON changelog;
DROP POLICY IF EXISTS "changelog_insert_authenticated" ON changelog;
DROP POLICY IF EXISTS "changelog_update_authenticated" ON changelog;
DROP POLICY IF EXISTS "changelog_delete_authenticated" ON changelog;
DROP POLICY IF EXISTS "changelog_dev_select" ON changelog;

-- ---- notifications ----
DROP POLICY IF EXISTS "notifications_select_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_update_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_admin" ON notifications;

-- ---- demandes_evolution ----
DROP POLICY IF EXISTS "demandes_evolution_select_authenticated" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_insert_authenticated" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_update_authenticated" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_evolution_delete_authenticated" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_dev_select" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_dev_insert" ON demandes_evolution;

-- ---- scenarios_previsionnels ----
DROP POLICY IF EXISTS "scenarios_previsionnels_select_authenticated" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_insert_authenticated" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_update_authenticated" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_previsionnels_delete_authenticated" ON scenarios_previsionnels;
DROP POLICY IF EXISTS "scenarios_dev_select" ON scenarios_previsionnels;

-- ---- email_templates ----
DROP POLICY IF EXISTS "email_templates_select_authenticated" ON email_templates;
DROP POLICY IF EXISTS "email_templates_insert_authenticated" ON email_templates;
DROP POLICY IF EXISTS "email_templates_update_authenticated" ON email_templates;
DROP POLICY IF EXISTS "email_templates_delete_authenticated" ON email_templates;

-- ---- documents_v2 (tables sans migration) ----
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
-- PHASE 2 : POLITIQUES GRANULAIRES
-- ============================================================================
-- Rappel : PostgreSQL fait un OR entre les politiques du meme type (SELECT, etc.)
-- => si l'admin a USING(true) et le dev a USING(condition), un admin voit tout.
--
-- Roles couverts :
--   - admin : CRUD complet
--   - developpeur_nocode / developpeur_automatisme : acces restreint (via is_developer())
--   - commercial / client : pas de politique = pas d'acces (extensible plus tard)
-- ============================================================================

-- ============================================================================
-- 2.1 PROFILES
-- ============================================================================
-- Admin : SELECT all, UPDATE own
-- Developer : SELECT own, UPDATE own
-- INSERT/DELETE : service_role uniquement (gestion via Supabase Auth)

-- Admin peut voir tous les profils
CREATE POLICY "profiles_select_admin"
    ON profiles FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Developer ne voit que son propre profil
-- (pour les noms d'equipe, utiliser get_team_profiles() RPC)
CREATE POLICY "profiles_select_developer"
    ON profiles FOR SELECT
    TO authenticated
    USING (public.is_developer() AND id = auth.uid());

-- Tout le monde peut modifier son propre profil
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());


-- ============================================================================
-- 2.2 CRM CORE : clients, contacts, interactions
-- ============================================================================
-- Admin : CRUD
-- Developer : Read-only
-- DELETE clients/contacts : admin uniquement (donnees critiques)

-- ---- clients ----
CREATE POLICY "clients_select_admin"
    ON clients FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "clients_insert_admin"
    ON clients FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "clients_update_admin"
    ON clients FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "clients_delete_admin"
    ON clients FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "clients_select_developer"
    ON clients FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- contacts ----
CREATE POLICY "contacts_select_admin"
    ON contacts FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "contacts_insert_admin"
    ON contacts FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "contacts_update_admin"
    ON contacts FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "contacts_delete_admin"
    ON contacts FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "contacts_select_developer"
    ON contacts FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- interactions ----
CREATE POLICY "interactions_select_admin"
    ON interactions FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "interactions_insert_admin"
    ON interactions FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "interactions_update_admin"
    ON interactions FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "interactions_delete_admin"
    ON interactions FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "interactions_select_developer"
    ON interactions FOR SELECT TO authenticated
    USING (public.is_developer());


-- ============================================================================
-- 2.3 PIPELINE : opportunites, opportunite_contacts, catalogue_services, lignes_devis
-- ============================================================================
-- Admin : CRUD
-- Developer : Read-only

-- ---- opportunites ----
CREATE POLICY "opportunites_select_admin"
    ON opportunites FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "opportunites_insert_admin"
    ON opportunites FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "opportunites_update_admin"
    ON opportunites FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "opportunites_delete_admin"
    ON opportunites FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "opportunites_select_developer"
    ON opportunites FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- opportunite_contacts ----
CREATE POLICY "opportunite_contacts_select_admin"
    ON opportunite_contacts FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "opportunite_contacts_insert_admin"
    ON opportunite_contacts FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "opportunite_contacts_update_admin"
    ON opportunite_contacts FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "opportunite_contacts_delete_admin"
    ON opportunite_contacts FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "opportunite_contacts_select_developer"
    ON opportunite_contacts FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- catalogue_services ----
CREATE POLICY "catalogue_services_select_admin"
    ON catalogue_services FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "catalogue_services_insert_admin"
    ON catalogue_services FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "catalogue_services_update_admin"
    ON catalogue_services FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "catalogue_services_delete_admin"
    ON catalogue_services FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "catalogue_services_select_developer"
    ON catalogue_services FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- lignes_devis ----
CREATE POLICY "lignes_devis_select_admin"
    ON lignes_devis FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "lignes_devis_insert_admin"
    ON lignes_devis FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "lignes_devis_update_admin"
    ON lignes_devis FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "lignes_devis_delete_admin"
    ON lignes_devis FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "lignes_devis_select_developer"
    ON lignes_devis FOR SELECT TO authenticated
    USING (public.is_developer());


-- ============================================================================
-- 2.4 PROJETS : projets, projet_membres, modeles_taches
-- ============================================================================
-- Admin : CRUD
-- Developer : Read all, Update si membre du projet

-- ---- projets ----
CREATE POLICY "projets_select_admin"
    ON projets FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "projets_insert_admin"
    ON projets FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "projets_update_admin"
    ON projets FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "projets_delete_admin"
    ON projets FOR DELETE TO authenticated
    USING (public.is_admin());

-- Developer : lire tous les projets
CREATE POLICY "projets_select_developer"
    ON projets FOR SELECT TO authenticated
    USING (public.is_developer());

-- Developer : modifier si chef de projet ou membre
CREATE POLICY "projets_update_developer"
    ON projets FOR UPDATE TO authenticated
    USING (
        public.is_developer() AND (
            chef_projet_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM projet_membres
                WHERE projet_id = projets.id AND profile_id = auth.uid()
            )
        )
    );

-- ---- projet_membres ----
CREATE POLICY "projet_membres_select_admin"
    ON projet_membres FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "projet_membres_insert_admin"
    ON projet_membres FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "projet_membres_update_admin"
    ON projet_membres FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "projet_membres_delete_admin"
    ON projet_membres FOR DELETE TO authenticated
    USING (public.is_admin());

-- Developer : lire les membres (pour afficher les avatars dans les projets)
CREATE POLICY "projet_membres_select_developer"
    ON projet_membres FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- modeles_taches ----
CREATE POLICY "modeles_taches_select_admin"
    ON modeles_taches FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "modeles_taches_insert_admin"
    ON modeles_taches FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "modeles_taches_update_admin"
    ON modeles_taches FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "modeles_taches_delete_admin"
    ON modeles_taches FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "modeles_taches_select_developer"
    ON modeles_taches FOR SELECT TO authenticated
    USING (public.is_developer());


-- ============================================================================
-- 2.5 TACHES
-- ============================================================================
-- Admin : CRUD
-- Developer : Read toutes, CRUD sur taches assignees

-- ---- taches ----
CREATE POLICY "taches_select_admin"
    ON taches FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "taches_insert_admin"
    ON taches FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "taches_update_admin"
    ON taches FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "taches_delete_admin"
    ON taches FOR DELETE TO authenticated
    USING (public.is_admin());

-- Developer : lire toutes les taches (visibilite equipe)
CREATE POLICY "taches_select_developer"
    ON taches FOR SELECT TO authenticated
    USING (public.is_developer());

-- Developer : creer des taches sur les projets dont il est membre
CREATE POLICY "taches_insert_developer"
    ON taches FOR INSERT TO authenticated
    WITH CHECK (
        public.is_developer() AND (
            -- Tache sur un projet dont le dev est chef ou membre
            EXISTS (
                SELECT 1 FROM projets
                WHERE id = projet_id AND chef_projet_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM projet_membres
                WHERE projet_id = taches.projet_id AND profile_id = auth.uid()
            )
        )
    );

-- Developer : modifier les taches qui lui sont assignees
CREATE POLICY "taches_update_developer"
    ON taches FOR UPDATE TO authenticated
    USING (public.is_developer() AND assignee_id = auth.uid());

-- Developer : supprimer ses propres taches
CREATE POLICY "taches_delete_developer"
    ON taches FOR DELETE TO authenticated
    USING (public.is_developer() AND assignee_id = auth.uid());


-- ============================================================================
-- 2.6 FINANCE : factures, devis, parametres_entreprise
-- ============================================================================
-- Admin : CRUD
-- Developer : Read-only (factures/devis), pas d'acces ecriture
-- DELETE factures/devis : admin uniquement

-- ---- factures ----
CREATE POLICY "factures_select_admin"
    ON factures FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "factures_insert_admin"
    ON factures FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "factures_update_admin"
    ON factures FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "factures_delete_admin"
    ON factures FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "factures_select_developer"
    ON factures FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- devis ----
CREATE POLICY "devis_select_admin"
    ON devis FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "devis_insert_admin"
    ON devis FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "devis_update_admin"
    ON devis FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "devis_delete_admin"
    ON devis FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "devis_select_developer"
    ON devis FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- parametres_entreprise ----
-- SELECT : tous les authentifies (necessaire pour generation devis/factures)
CREATE POLICY "parametres_select_authenticated"
    ON parametres_entreprise FOR SELECT TO authenticated
    USING (true);

-- INSERT/UPDATE/DELETE : admin uniquement
CREATE POLICY "parametres_insert_admin"
    ON parametres_entreprise FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "parametres_update_admin"
    ON parametres_entreprise FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
CREATE POLICY "parametres_delete_admin"
    ON parametres_entreprise FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================================
-- 2.7 TEMPS & RESSOURCES : journal_temps, equipe
-- ============================================================================
-- journal_temps : Admin CRUD, Developer CRUD propre
-- equipe : Admin CRUD, Developer Read-only

-- ---- journal_temps ----
CREATE POLICY "journal_temps_select_admin"
    ON journal_temps FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "journal_temps_insert_admin"
    ON journal_temps FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "journal_temps_update_admin"
    ON journal_temps FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "journal_temps_delete_admin"
    ON journal_temps FOR DELETE TO authenticated
    USING (public.is_admin());

-- Developer : lire toutes les entrees (visibilite charge equipe)
CREATE POLICY "journal_temps_select_developer"
    ON journal_temps FOR SELECT TO authenticated
    USING (public.is_developer());

-- Developer : creer ses propres entrees
CREATE POLICY "journal_temps_insert_developer"
    ON journal_temps FOR INSERT TO authenticated
    WITH CHECK (public.is_developer() AND user_id = auth.uid());

-- Developer : modifier ses propres entrees
CREATE POLICY "journal_temps_update_developer"
    ON journal_temps FOR UPDATE TO authenticated
    USING (public.is_developer() AND user_id = auth.uid());

-- Developer : supprimer ses propres entrees
CREATE POLICY "journal_temps_delete_developer"
    ON journal_temps FOR DELETE TO authenticated
    USING (public.is_developer() AND user_id = auth.uid());

-- ---- equipe ----
CREATE POLICY "equipe_select_admin"
    ON equipe FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "equipe_insert_admin"
    ON equipe FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "equipe_update_admin"
    ON equipe FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "equipe_delete_admin"
    ON equipe FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "equipe_select_developer"
    ON equipe FOR SELECT TO authenticated
    USING (public.is_developer());


-- ============================================================================
-- 2.8 CONNAISSANCE & STRATEGIE : connaissances, objectifs, resultats_cles, accomplissements
-- ============================================================================
-- Admin : CRUD
-- Developer : CRUD (base de connaissances collaborative)
-- DELETE : developer sur ses propres entrees + admin sur tout

-- ---- connaissances ----
CREATE POLICY "connaissances_select_admin"
    ON connaissances FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "connaissances_insert_admin"
    ON connaissances FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "connaissances_update_admin"
    ON connaissances FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "connaissances_delete_admin"
    ON connaissances FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "connaissances_select_developer"
    ON connaissances FOR SELECT TO authenticated
    USING (public.is_developer());
CREATE POLICY "connaissances_insert_developer"
    ON connaissances FOR INSERT TO authenticated
    WITH CHECK (public.is_developer());
CREATE POLICY "connaissances_update_developer"
    ON connaissances FOR UPDATE TO authenticated
    USING (public.is_developer());
CREATE POLICY "connaissances_delete_developer"
    ON connaissances FOR DELETE TO authenticated
    USING (public.is_developer() AND auteur_id = auth.uid());

-- ---- objectifs ----
CREATE POLICY "objectifs_select_admin"
    ON objectifs FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "objectifs_insert_admin"
    ON objectifs FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "objectifs_update_admin"
    ON objectifs FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "objectifs_delete_admin"
    ON objectifs FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "objectifs_select_developer"
    ON objectifs FOR SELECT TO authenticated
    USING (public.is_developer());
CREATE POLICY "objectifs_insert_developer"
    ON objectifs FOR INSERT TO authenticated
    WITH CHECK (public.is_developer());
CREATE POLICY "objectifs_update_developer"
    ON objectifs FOR UPDATE TO authenticated
    USING (public.is_developer());
CREATE POLICY "objectifs_delete_developer"
    ON objectifs FOR DELETE TO authenticated
    USING (public.is_developer());

-- ---- resultats_cles ----
CREATE POLICY "resultats_cles_select_admin"
    ON resultats_cles FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "resultats_cles_insert_admin"
    ON resultats_cles FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "resultats_cles_update_admin"
    ON resultats_cles FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "resultats_cles_delete_admin"
    ON resultats_cles FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "resultats_cles_select_developer"
    ON resultats_cles FOR SELECT TO authenticated
    USING (public.is_developer());
CREATE POLICY "resultats_cles_insert_developer"
    ON resultats_cles FOR INSERT TO authenticated
    WITH CHECK (public.is_developer());
CREATE POLICY "resultats_cles_update_developer"
    ON resultats_cles FOR UPDATE TO authenticated
    USING (public.is_developer());
CREATE POLICY "resultats_cles_delete_developer"
    ON resultats_cles FOR DELETE TO authenticated
    USING (public.is_developer());

-- ---- accomplissements ----
CREATE POLICY "accomplissements_select_admin"
    ON accomplissements FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "accomplissements_insert_admin"
    ON accomplissements FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "accomplissements_update_admin"
    ON accomplissements FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "accomplissements_delete_admin"
    ON accomplissements FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "accomplissements_select_developer"
    ON accomplissements FOR SELECT TO authenticated
    USING (public.is_developer());
CREATE POLICY "accomplissements_insert_developer"
    ON accomplissements FOR INSERT TO authenticated
    WITH CHECK (public.is_developer());
CREATE POLICY "accomplissements_update_developer"
    ON accomplissements FOR UPDATE TO authenticated
    USING (public.is_developer());
CREATE POLICY "accomplissements_delete_developer"
    ON accomplissements FOR DELETE TO authenticated
    USING (public.is_developer() AND user_id = auth.uid());


-- ============================================================================
-- 2.9 ECOSYSTEME : feedback_client, partenaires
-- ============================================================================
-- Admin : CRUD
-- Developer : Read-only

-- ---- feedback_client ----
CREATE POLICY "feedback_client_select_admin"
    ON feedback_client FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "feedback_client_insert_admin"
    ON feedback_client FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "feedback_client_update_admin"
    ON feedback_client FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "feedback_client_delete_admin"
    ON feedback_client FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "feedback_client_select_developer"
    ON feedback_client FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- partenaires ----
CREATE POLICY "partenaires_select_admin"
    ON partenaires FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "partenaires_insert_admin"
    ON partenaires FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "partenaires_update_admin"
    ON partenaires FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "partenaires_delete_admin"
    ON partenaires FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "partenaires_select_developer"
    ON partenaires FOR SELECT TO authenticated
    USING (public.is_developer());


-- ============================================================================
-- 2.10 SYSTEME : changelog, notifications, demandes_evolution, scenarios_previsionnels
-- ============================================================================
-- Admin : CRUD
-- Developer : Read + Create (notifications: CRUD propre)

-- ---- changelog ----
CREATE POLICY "changelog_select_admin"
    ON changelog FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "changelog_insert_admin"
    ON changelog FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "changelog_update_admin"
    ON changelog FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "changelog_delete_admin"
    ON changelog FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "changelog_select_developer"
    ON changelog FOR SELECT TO authenticated
    USING (public.is_developer());
CREATE POLICY "changelog_insert_developer"
    ON changelog FOR INSERT TO authenticated
    WITH CHECK (public.is_developer());

-- ---- notifications ----
-- Cas special : chaque utilisateur gere ses propres notifications
CREATE POLICY "notifications_select_admin"
    ON notifications FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "notifications_insert_admin"
    ON notifications FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "notifications_update_admin"
    ON notifications FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "notifications_delete_admin"
    ON notifications FOR DELETE TO authenticated
    USING (public.is_admin());

-- Developer : voir/modifier/supprimer ses propres notifications
CREATE POLICY "notifications_select_developer"
    ON notifications FOR SELECT TO authenticated
    USING (public.is_developer() AND user_id = auth.uid());
CREATE POLICY "notifications_insert_developer"
    ON notifications FOR INSERT TO authenticated
    WITH CHECK (public.is_developer());
CREATE POLICY "notifications_update_developer"
    ON notifications FOR UPDATE TO authenticated
    USING (public.is_developer() AND user_id = auth.uid());
CREATE POLICY "notifications_delete_developer"
    ON notifications FOR DELETE TO authenticated
    USING (public.is_developer() AND user_id = auth.uid());

-- ---- demandes_evolution ----
CREATE POLICY "demandes_evolution_select_admin"
    ON demandes_evolution FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "demandes_evolution_insert_admin"
    ON demandes_evolution FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "demandes_evolution_update_admin"
    ON demandes_evolution FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "demandes_evolution_delete_admin"
    ON demandes_evolution FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "demandes_evolution_select_developer"
    ON demandes_evolution FOR SELECT TO authenticated
    USING (public.is_developer());
CREATE POLICY "demandes_evolution_insert_developer"
    ON demandes_evolution FOR INSERT TO authenticated
    WITH CHECK (public.is_developer());
CREATE POLICY "demandes_evolution_update_developer"
    ON demandes_evolution FOR UPDATE TO authenticated
    USING (public.is_developer() AND demandeur_id = auth.uid());
CREATE POLICY "demandes_evolution_delete_developer"
    ON demandes_evolution FOR DELETE TO authenticated
    USING (public.is_developer() AND demandeur_id = auth.uid());

-- ---- scenarios_previsionnels ----
CREATE POLICY "scenarios_previsionnels_select_admin"
    ON scenarios_previsionnels FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "scenarios_previsionnels_insert_admin"
    ON scenarios_previsionnels FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "scenarios_previsionnels_update_admin"
    ON scenarios_previsionnels FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "scenarios_previsionnels_delete_admin"
    ON scenarios_previsionnels FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "scenarios_previsionnels_select_developer"
    ON scenarios_previsionnels FOR SELECT TO authenticated
    USING (public.is_developer());
CREATE POLICY "scenarios_previsionnels_insert_developer"
    ON scenarios_previsionnels FOR INSERT TO authenticated
    WITH CHECK (public.is_developer());


-- ============================================================================
-- 2.11 DOCUMENTS : documents_v2, record_manager_v2, tabular_document_rows, email_templates
-- ============================================================================
-- Admin : CRUD
-- Developer : Read-only

-- ---- email_templates ----
CREATE POLICY "email_templates_select_admin"
    ON email_templates FOR SELECT TO authenticated
    USING (public.is_admin());
CREATE POLICY "email_templates_insert_admin"
    ON email_templates FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());
CREATE POLICY "email_templates_update_admin"
    ON email_templates FOR UPDATE TO authenticated
    USING (public.is_admin());
CREATE POLICY "email_templates_delete_admin"
    ON email_templates FOR DELETE TO authenticated
    USING (public.is_admin());

CREATE POLICY "email_templates_select_developer"
    ON email_templates FOR SELECT TO authenticated
    USING (public.is_developer());

-- ---- documents_v2, record_manager_v2, tabular_document_rows (tables sans migration) ----
DO $$
BEGIN
    -- ---- documents_v2 ----
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents_v2') THEN
        CREATE POLICY "documents_v2_select_admin"
            ON documents_v2 FOR SELECT TO authenticated
            USING (public.is_admin());
        CREATE POLICY "documents_v2_insert_admin"
            ON documents_v2 FOR INSERT TO authenticated
            WITH CHECK (public.is_admin());
        CREATE POLICY "documents_v2_update_admin"
            ON documents_v2 FOR UPDATE TO authenticated
            USING (public.is_admin());
        CREATE POLICY "documents_v2_delete_admin"
            ON documents_v2 FOR DELETE TO authenticated
            USING (public.is_admin());
        CREATE POLICY "documents_v2_select_developer"
            ON documents_v2 FOR SELECT TO authenticated
            USING (public.is_developer());
        RAISE NOTICE 'Politiques granulaires creees pour documents_v2';
    END IF;

    -- ---- record_manager_v2 ----
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'record_manager_v2') THEN
        CREATE POLICY "record_manager_v2_select_admin"
            ON record_manager_v2 FOR SELECT TO authenticated
            USING (public.is_admin());
        CREATE POLICY "record_manager_v2_insert_admin"
            ON record_manager_v2 FOR INSERT TO authenticated
            WITH CHECK (public.is_admin());
        CREATE POLICY "record_manager_v2_update_admin"
            ON record_manager_v2 FOR UPDATE TO authenticated
            USING (public.is_admin());
        CREATE POLICY "record_manager_v2_delete_admin"
            ON record_manager_v2 FOR DELETE TO authenticated
            USING (public.is_admin());
        CREATE POLICY "record_manager_v2_select_developer"
            ON record_manager_v2 FOR SELECT TO authenticated
            USING (public.is_developer());
        RAISE NOTICE 'Politiques granulaires creees pour record_manager_v2';
    END IF;

    -- ---- tabular_document_rows ----
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tabular_document_rows') THEN
        CREATE POLICY "tabular_document_rows_select_admin"
            ON tabular_document_rows FOR SELECT TO authenticated
            USING (public.is_admin());
        CREATE POLICY "tabular_document_rows_insert_admin"
            ON tabular_document_rows FOR INSERT TO authenticated
            WITH CHECK (public.is_admin());
        CREATE POLICY "tabular_document_rows_update_admin"
            ON tabular_document_rows FOR UPDATE TO authenticated
            USING (public.is_admin());
        CREATE POLICY "tabular_document_rows_delete_admin"
            ON tabular_document_rows FOR DELETE TO authenticated
            USING (public.is_admin());
        CREATE POLICY "tabular_document_rows_select_developer"
            ON tabular_document_rows FOR SELECT TO authenticated
            USING (public.is_developer());
        RAISE NOTICE 'Politiques granulaires creees pour tabular_document_rows';
    END IF;
END $$;


-- ============================================================================
-- PHASE 3 : VERIFICATION POST-EXECUTION
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    admin_count INTEGER;
    dev_count INTEGER;
    table_record RECORD;
BEGIN
    -- Compter le total de politiques
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies WHERE schemaname = 'public';

    -- Compter les politiques admin
    SELECT COUNT(*) INTO admin_count
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname LIKE '%_admin%';

    -- Compter les politiques developer
    SELECT COUNT(*) INTO dev_count
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname LIKE '%_developer%';

    RAISE NOTICE '============================================';
    RAISE NOTICE 'VERIFICATION 009-granular-rls-policies';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total politiques: %', policy_count;
    RAISE NOTICE 'Politiques admin: %', admin_count;
    RAISE NOTICE 'Politiques developer: %', dev_count;
    RAISE NOTICE '--------------------------------------------';

    -- Verifier qu'aucune politique blanket n'existe plus
    -- (politiques avec USING(true) sauf parametres_entreprise SELECT)
    RAISE NOTICE 'Politiques par table:';
    FOR table_record IN
        SELECT tablename, COUNT(*) as cnt
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
        ORDER BY tablename
    LOOP
        RAISE NOTICE '  %-30s : % politiques', table_record.tablename, table_record.cnt;
    END LOOP;

    RAISE NOTICE '============================================';
END $$;

COMMIT;

-- ============================================================================
-- MATRICE DE VERIFICATION (a tester manuellement)
-- ============================================================================
-- Connectez-vous en tant que chaque role et verifiez :
--
-- | Table               | Admin SELECT | Admin INSERT | Admin DELETE | Dev SELECT | Dev INSERT | Dev DELETE |
-- |---------------------|-------------|-------------|-------------|-----------|-----------|-----------|
-- | profiles            | all         | (service)   | (service)   | own       | (service) | (service) |
-- | clients             | all         | yes         | yes         | all       | NO        | NO        |
-- | contacts            | all         | yes         | yes         | all       | NO        | NO        |
-- | interactions        | all         | yes         | yes         | all       | NO        | NO        |
-- | opportunites        | all         | yes         | yes         | all       | NO        | NO        |
-- | projets             | all         | yes         | yes         | all       | NO        | member    |
-- | taches              | all         | yes         | yes         | all       | member    | own       |
-- | factures            | all         | yes         | yes         | all       | NO        | NO        |
-- | devis               | all         | yes         | yes         | all       | NO        | NO        |
-- | journal_temps       | all         | yes         | yes         | all       | own       | own       |
-- | equipe              | all         | yes         | yes         | all       | NO        | NO        |
-- | connaissances       | all         | yes         | yes         | all       | yes       | own       |
-- | objectifs           | all         | yes         | yes         | all       | yes       | yes       |
-- | resultats_cles      | all         | yes         | yes         | all       | yes       | yes       |
-- | accomplissements    | all         | yes         | yes         | all       | yes       | own       |
-- | feedback_client     | all         | yes         | yes         | all       | NO        | NO        |
-- | partenaires         | all         | yes         | yes         | all       | NO        | NO        |
-- | changelog           | all         | yes         | yes         | all       | yes       | NO        |
-- | notifications       | all         | yes         | yes         | own       | yes       | own       |
-- | demandes_evolution  | all         | yes         | yes         | all       | yes       | own       |
-- | scenarios_prev.     | all         | yes         | yes         | all       | yes       | NO        |
-- | email_templates     | all         | yes         | yes         | all       | NO        | NO        |
-- | parametres_entrep.  | all         | admin       | admin       | all       | NO        | NO        |
-- | projet_membres      | all         | yes         | yes         | all       | NO        | NO        |
-- | modeles_taches      | all         | yes         | yes         | all       | NO        | NO        |
-- | documents_v2*       | all         | yes         | yes         | all       | NO        | NO        |
-- | record_manager_v2*  | all         | yes         | yes         | all       | NO        | NO        |
-- | tabular_doc_rows*   | all         | yes         | yes         | all       | NO        | NO        |
--
-- * = tables conditionnelles (IF EXISTS)
-- commercial/client : aucune politique = aucun acces (extensible P0-05)
-- ============================================================================
