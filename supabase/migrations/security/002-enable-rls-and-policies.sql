-- ============================================================================
-- 002-enable-rls-and-policies.sql
-- SCRIPT COMBINE P0-01 (activation RLS) + P0-02 (politiques de base)
-- CRM Axivity - Remediation securite critique
-- ============================================================================
--
-- OBJECTIF :
--   1. Supprimer toutes les politiques dev/anon dangereuses
--   2. Activer RLS sur les 31 tables non protegees
--   3. Creer des politiques de base : anon = BLOQUE, authenticated = AUTORISE
--
-- PRE-REQUIS :
--   - Executer 001-verify-rls-status.sql d'abord
--   - Le service_role bypass RLS nativement (aucune politique necessaire pour N8N)
--   - Backup de la base recommande avant execution
--
-- TABLES SPECIALES :
--   - profiles : SELECT/UPDATE propre profil uniquement
--   - parametres_entreprise : SELECT tous auth, ecriture admin uniquement
--
-- CONVENTION NOMMAGE : {table}_{operation}_{role}
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1 : SUPPRESSION DES POLITIQUES DEV/ANON DANGEREUSES
-- ============================================================================
-- Ces politiques utilisent USING(true) / WITH CHECK(true) sans restriction
-- de role, permettant un acces CRUD anonyme complet.
-- Source : migrations 04_equipe_table.sql et 07_fix_profiles_rls.sql
-- ============================================================================

-- ---- equipe (politiques anon) ----
DROP POLICY IF EXISTS "equipe_select_anon" ON equipe;
DROP POLICY IF EXISTS "equipe_insert_anon" ON equipe;
DROP POLICY IF EXISTS "equipe_update_anon" ON equipe;
DROP POLICY IF EXISTS "equipe_delete_anon" ON equipe;

-- ---- clients (politiques dev) ----
DROP POLICY IF EXISTS "clients_dev_select" ON clients;
DROP POLICY IF EXISTS "clients_dev_insert" ON clients;
DROP POLICY IF EXISTS "clients_dev_update" ON clients;
DROP POLICY IF EXISTS "clients_dev_delete" ON clients;

-- ---- contacts (politiques dev) ----
DROP POLICY IF EXISTS "contacts_dev_select" ON contacts;
DROP POLICY IF EXISTS "contacts_dev_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_dev_update" ON contacts;
DROP POLICY IF EXISTS "contacts_dev_delete" ON contacts;

-- ---- projets (politiques dev) ----
DROP POLICY IF EXISTS "projets_dev_select" ON projets;
DROP POLICY IF EXISTS "projets_dev_insert" ON projets;
DROP POLICY IF EXISTS "projets_dev_update" ON projets;
DROP POLICY IF EXISTS "projets_dev_delete" ON projets;

-- ---- opportunites (politiques dev) ----
DROP POLICY IF EXISTS "opportunites_dev_select" ON opportunites;
DROP POLICY IF EXISTS "opportunites_dev_insert" ON opportunites;
DROP POLICY IF EXISTS "opportunites_dev_update" ON opportunites;
DROP POLICY IF EXISTS "opportunites_dev_delete" ON opportunites;

-- ---- taches (politiques dev) ----
DROP POLICY IF EXISTS "taches_dev_select" ON taches;
DROP POLICY IF EXISTS "taches_dev_insert" ON taches;
DROP POLICY IF EXISTS "taches_dev_update" ON taches;
DROP POLICY IF EXISTS "taches_dev_delete" ON taches;

-- ---- factures (politiques dev) ----
DROP POLICY IF EXISTS "factures_dev_select" ON factures;
DROP POLICY IF EXISTS "factures_dev_insert" ON factures;
DROP POLICY IF EXISTS "factures_dev_update" ON factures;
DROP POLICY IF EXISTS "factures_dev_delete" ON factures;

-- ---- interactions (politiques dev) ----
DROP POLICY IF EXISTS "interactions_dev_select" ON interactions;
DROP POLICY IF EXISTS "interactions_dev_insert" ON interactions;
DROP POLICY IF EXISTS "interactions_dev_update" ON interactions;
DROP POLICY IF EXISTS "interactions_dev_delete" ON interactions;

-- ---- profiles (politiques dev - sources: 04 + 07) ----
DROP POLICY IF EXISTS "profiles_dev_select" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_update" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_delete" ON profiles;
-- Cette politique de 02_rls.sql utilise USING(true) sans restriction de role
-- Elle permet aux anonymes de lire TOUS les profils (PII: noms, emails, telephones)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;

-- ---- journal_temps (politiques dev) ----
DROP POLICY IF EXISTS "journal_temps_dev_select" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_dev_insert" ON journal_temps;
DROP POLICY IF EXISTS "journal_temps_dev_update" ON journal_temps;

-- ---- catalogue_services (politique dev) ----
DROP POLICY IF EXISTS "catalogue_dev_select" ON catalogue_services;

-- ---- lignes_devis (politiques dev) ----
DROP POLICY IF EXISTS "lignes_devis_dev_select" ON lignes_devis;
DROP POLICY IF EXISTS "lignes_devis_dev_insert" ON lignes_devis;

-- ---- modeles_taches (politique dev) ----
DROP POLICY IF EXISTS "modeles_taches_dev_select" ON modeles_taches;

-- ---- feedback_client (politiques dev) ----
DROP POLICY IF EXISTS "feedback_dev_select" ON feedback_client;
DROP POLICY IF EXISTS "feedback_dev_insert" ON feedback_client;

-- ---- partenaires (politique dev) ----
DROP POLICY IF EXISTS "partenaires_dev_select" ON partenaires;

-- ---- connaissances (politiques dev) ----
DROP POLICY IF EXISTS "connaissances_dev_select" ON connaissances;
DROP POLICY IF EXISTS "connaissances_dev_insert" ON connaissances;

-- ---- accomplissements (politiques dev) ----
DROP POLICY IF EXISTS "accomplissements_dev_select" ON accomplissements;
DROP POLICY IF EXISTS "accomplissements_dev_insert" ON accomplissements;

-- ---- objectifs (politique dev) ----
DROP POLICY IF EXISTS "objectifs_dev_select" ON objectifs;

-- ---- resultats_cles (politique dev) ----
DROP POLICY IF EXISTS "resultats_cles_dev_select" ON resultats_cles;

-- ---- changelog (politique dev) ----
DROP POLICY IF EXISTS "changelog_dev_select" ON changelog;

-- ---- demandes_evolution (politiques dev) ----
DROP POLICY IF EXISTS "demandes_dev_select" ON demandes_evolution;
DROP POLICY IF EXISTS "demandes_dev_insert" ON demandes_evolution;

-- ---- scenarios_previsionnels (politique dev) ----
DROP POLICY IF EXISTS "scenarios_dev_select" ON scenarios_previsionnels;

-- ============================================================================
-- PHASE 2 : ACTIVATION RLS SUR LES 31 TABLES
-- ============================================================================
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY est idempotent :
-- si RLS est deja active, la commande ne fait rien.
-- ============================================================================

-- Tables du schema initial (01_schema.sql)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunites ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_temps ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE modeles_taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultats_cles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connaissances ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_client ENABLE ROW LEVEL SECURITY;
ALTER TABLE partenaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios_previsionnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomplissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_evolution ENABLE ROW LEVEL SECURITY;

-- Tables ajoutees par migrations ulterieures
ALTER TABLE equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE projet_membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunite_contacts ENABLE ROW LEVEL SECURITY;

-- Tables sans migration (creees directement dans Supabase)
-- IF EXISTS pour la portabilite entre environnements
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents_v2') THEN
        ALTER TABLE documents_v2 ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS active sur documents_v2';
    ELSE
        RAISE WARNING 'Table documents_v2 introuvable - verifiez manuellement';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'record_manager_v2') THEN
        ALTER TABLE record_manager_v2 ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS active sur record_manager_v2';
    ELSE
        RAISE WARNING 'Table record_manager_v2 introuvable - verifiez manuellement';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tabular_document_rows') THEN
        ALTER TABLE tabular_document_rows ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS active sur tabular_document_rows';
    ELSE
        RAISE WARNING 'Table tabular_document_rows introuvable - verifiez manuellement';
    END IF;
END $$;

-- ============================================================================
-- PHASE 3 : POLITIQUES DE BASE
-- ============================================================================
-- Strategie :
--   - TO authenticated : la politique ne s'applique qu'au role authenticated
--   - Le role anon n'a AUCUNE politique => acces refuse par defaut
--   - Le role service_role bypass RLS nativement (N8N continue de fonctionner)
--
-- USING : filtre les lignes visibles (SELECT, UPDATE, DELETE)
-- WITH CHECK : filtre les lignes qui peuvent etre ecrites (INSERT, UPDATE)
-- ============================================================================

-- ============================================================================
-- 3.1 TABLE profiles - CAS SPECIAL
-- ============================================================================
-- Donnees PII sensibles (noms, emails, telephones, roles)
-- Restriction : chaque utilisateur ne voit/modifie que son propre profil
-- INSERT/DELETE reserves au service_role (gestion via Supabase Auth)
-- ============================================================================

-- SELECT : un utilisateur authentifie ne voit que son propre profil
-- Note : Ceci est plus restrictif que l'ancien profiles_select_all.
-- Les composants qui affichent des noms d'autres utilisateurs (avatars, assignations)
-- devront passer par une fonction RPC SECURITY DEFINER ou etre adaptes en P0-04.
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- UPDATE : un utilisateur ne peut modifier que son propre profil
DROP POLICY IF EXISTS "profiles_update_authenticated" ON profiles;
CREATE POLICY "profiles_update_authenticated"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSERT : interdit pour les utilisateurs (seulement via service_role / triggers auth)
-- Aucune politique INSERT = acces refuse pour authenticated
-- Le service_role bypass RLS et peut toujours inserer

-- DELETE : interdit pour les utilisateurs (seulement via service_role)
-- Aucune politique DELETE = acces refuse pour authenticated

-- ============================================================================
-- 3.2 TABLE parametres_entreprise - CAS SPECIAL
-- ============================================================================
-- Donnees legales de l'entreprise (SIRET, RCS, TVA, adresse)
-- SELECT : tous les authentifies (necessaire pour generation devis/factures)
-- INSERT/UPDATE/DELETE : admin uniquement
-- ============================================================================

DROP POLICY IF EXISTS "parametres_select_authenticated" ON parametres_entreprise;
CREATE POLICY "parametres_select_authenticated"
    ON parametres_entreprise FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "parametres_insert_admin" ON parametres_entreprise;
CREATE POLICY "parametres_insert_admin"
    ON parametres_entreprise FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "parametres_update_admin" ON parametres_entreprise;
CREATE POLICY "parametres_update_admin"
    ON parametres_entreprise FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "parametres_delete_admin" ON parametres_entreprise;
CREATE POLICY "parametres_delete_admin"
    ON parametres_entreprise FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 3.3 TABLES STANDARD - Politiques de base authenticated
-- ============================================================================
-- Regle : tout utilisateur authentifie a acces CRUD complet
-- Le role anon est implicitement bloque (aucune politique TO anon/public)
-- Ces politiques seront remplacees par des politiques granulaires en P0-04
-- ============================================================================

-- ---- clients ----
DROP POLICY IF EXISTS "clients_select_authenticated" ON clients;
CREATE POLICY "clients_select_authenticated"
    ON clients FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "clients_insert_authenticated" ON clients;
CREATE POLICY "clients_insert_authenticated"
    ON clients FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "clients_update_authenticated" ON clients;
CREATE POLICY "clients_update_authenticated"
    ON clients FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "clients_delete_authenticated" ON clients;
CREATE POLICY "clients_delete_authenticated"
    ON clients FOR DELETE TO authenticated USING (true);

-- ---- contacts ----
DROP POLICY IF EXISTS "contacts_select_authenticated" ON contacts;
CREATE POLICY "contacts_select_authenticated"
    ON contacts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "contacts_insert_authenticated" ON contacts;
CREATE POLICY "contacts_insert_authenticated"
    ON contacts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "contacts_update_authenticated" ON contacts;
CREATE POLICY "contacts_update_authenticated"
    ON contacts FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "contacts_delete_authenticated" ON contacts;
CREATE POLICY "contacts_delete_authenticated"
    ON contacts FOR DELETE TO authenticated USING (true);

-- ---- interactions ----
DROP POLICY IF EXISTS "interactions_select_authenticated" ON interactions;
CREATE POLICY "interactions_select_authenticated"
    ON interactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "interactions_insert_authenticated" ON interactions;
CREATE POLICY "interactions_insert_authenticated"
    ON interactions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "interactions_update_authenticated" ON interactions;
CREATE POLICY "interactions_update_authenticated"
    ON interactions FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "interactions_delete_authenticated" ON interactions;
CREATE POLICY "interactions_delete_authenticated"
    ON interactions FOR DELETE TO authenticated USING (true);

-- ---- projets ----
DROP POLICY IF EXISTS "projets_select_authenticated" ON projets;
CREATE POLICY "projets_select_authenticated"
    ON projets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "projets_insert_authenticated" ON projets;
CREATE POLICY "projets_insert_authenticated"
    ON projets FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projets_update_authenticated" ON projets;
CREATE POLICY "projets_update_authenticated"
    ON projets FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "projets_delete_authenticated" ON projets;
CREATE POLICY "projets_delete_authenticated"
    ON projets FOR DELETE TO authenticated USING (true);

-- ---- opportunites ----
DROP POLICY IF EXISTS "opportunites_select_authenticated" ON opportunites;
CREATE POLICY "opportunites_select_authenticated"
    ON opportunites FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "opportunites_insert_authenticated" ON opportunites;
CREATE POLICY "opportunites_insert_authenticated"
    ON opportunites FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "opportunites_update_authenticated" ON opportunites;
CREATE POLICY "opportunites_update_authenticated"
    ON opportunites FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "opportunites_delete_authenticated" ON opportunites;
CREATE POLICY "opportunites_delete_authenticated"
    ON opportunites FOR DELETE TO authenticated USING (true);

-- ---- taches ----
DROP POLICY IF EXISTS "taches_select_authenticated" ON taches;
CREATE POLICY "taches_select_authenticated"
    ON taches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "taches_insert_authenticated" ON taches;
CREATE POLICY "taches_insert_authenticated"
    ON taches FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "taches_update_authenticated" ON taches;
CREATE POLICY "taches_update_authenticated"
    ON taches FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "taches_delete_authenticated" ON taches;
CREATE POLICY "taches_delete_authenticated"
    ON taches FOR DELETE TO authenticated USING (true);

-- ---- factures ----
DROP POLICY IF EXISTS "factures_select_authenticated" ON factures;
CREATE POLICY "factures_select_authenticated"
    ON factures FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "factures_insert_authenticated" ON factures;
CREATE POLICY "factures_insert_authenticated"
    ON factures FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "factures_update_authenticated" ON factures;
CREATE POLICY "factures_update_authenticated"
    ON factures FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "factures_delete_authenticated" ON factures;
CREATE POLICY "factures_delete_authenticated"
    ON factures FOR DELETE TO authenticated USING (true);

-- ---- journal_temps ----
DROP POLICY IF EXISTS "journal_temps_select_authenticated" ON journal_temps;
CREATE POLICY "journal_temps_select_authenticated"
    ON journal_temps FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "journal_temps_insert_authenticated" ON journal_temps;
CREATE POLICY "journal_temps_insert_authenticated"
    ON journal_temps FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "journal_temps_update_authenticated" ON journal_temps;
CREATE POLICY "journal_temps_update_authenticated"
    ON journal_temps FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "journal_temps_delete_authenticated" ON journal_temps;
CREATE POLICY "journal_temps_delete_authenticated"
    ON journal_temps FOR DELETE TO authenticated USING (true);

-- ---- catalogue_services ----
DROP POLICY IF EXISTS "catalogue_services_select_authenticated" ON catalogue_services;
CREATE POLICY "catalogue_services_select_authenticated"
    ON catalogue_services FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "catalogue_services_insert_authenticated" ON catalogue_services;
CREATE POLICY "catalogue_services_insert_authenticated"
    ON catalogue_services FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "catalogue_services_update_authenticated" ON catalogue_services;
CREATE POLICY "catalogue_services_update_authenticated"
    ON catalogue_services FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "catalogue_services_delete_authenticated" ON catalogue_services;
CREATE POLICY "catalogue_services_delete_authenticated"
    ON catalogue_services FOR DELETE TO authenticated USING (true);

-- ---- lignes_devis ----
DROP POLICY IF EXISTS "lignes_devis_select_authenticated" ON lignes_devis;
CREATE POLICY "lignes_devis_select_authenticated"
    ON lignes_devis FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lignes_devis_insert_authenticated" ON lignes_devis;
CREATE POLICY "lignes_devis_insert_authenticated"
    ON lignes_devis FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "lignes_devis_update_authenticated" ON lignes_devis;
CREATE POLICY "lignes_devis_update_authenticated"
    ON lignes_devis FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "lignes_devis_delete_authenticated" ON lignes_devis;
CREATE POLICY "lignes_devis_delete_authenticated"
    ON lignes_devis FOR DELETE TO authenticated USING (true);

-- ---- modeles_taches ----
DROP POLICY IF EXISTS "modeles_taches_select_authenticated" ON modeles_taches;
CREATE POLICY "modeles_taches_select_authenticated"
    ON modeles_taches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "modeles_taches_insert_authenticated" ON modeles_taches;
CREATE POLICY "modeles_taches_insert_authenticated"
    ON modeles_taches FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "modeles_taches_update_authenticated" ON modeles_taches;
CREATE POLICY "modeles_taches_update_authenticated"
    ON modeles_taches FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "modeles_taches_delete_authenticated" ON modeles_taches;
CREATE POLICY "modeles_taches_delete_authenticated"
    ON modeles_taches FOR DELETE TO authenticated USING (true);

-- ---- objectifs ----
DROP POLICY IF EXISTS "objectifs_select_authenticated" ON objectifs;
CREATE POLICY "objectifs_select_authenticated"
    ON objectifs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "objectifs_insert_authenticated" ON objectifs;
CREATE POLICY "objectifs_insert_authenticated"
    ON objectifs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "objectifs_update_authenticated" ON objectifs;
CREATE POLICY "objectifs_update_authenticated"
    ON objectifs FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "objectifs_delete_authenticated" ON objectifs;
CREATE POLICY "objectifs_delete_authenticated"
    ON objectifs FOR DELETE TO authenticated USING (true);

-- ---- resultats_cles ----
DROP POLICY IF EXISTS "resultats_cles_select_authenticated" ON resultats_cles;
CREATE POLICY "resultats_cles_select_authenticated"
    ON resultats_cles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "resultats_cles_insert_authenticated" ON resultats_cles;
CREATE POLICY "resultats_cles_insert_authenticated"
    ON resultats_cles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "resultats_cles_update_authenticated" ON resultats_cles;
CREATE POLICY "resultats_cles_update_authenticated"
    ON resultats_cles FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "resultats_cles_delete_authenticated" ON resultats_cles;
CREATE POLICY "resultats_cles_delete_authenticated"
    ON resultats_cles FOR DELETE TO authenticated USING (true);

-- ---- connaissances ----
DROP POLICY IF EXISTS "connaissances_select_authenticated" ON connaissances;
CREATE POLICY "connaissances_select_authenticated"
    ON connaissances FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "connaissances_insert_authenticated" ON connaissances;
CREATE POLICY "connaissances_insert_authenticated"
    ON connaissances FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "connaissances_update_authenticated" ON connaissances;
CREATE POLICY "connaissances_update_authenticated"
    ON connaissances FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "connaissances_delete_authenticated" ON connaissances;
CREATE POLICY "connaissances_delete_authenticated"
    ON connaissances FOR DELETE TO authenticated USING (true);

-- ---- feedback_client ----
DROP POLICY IF EXISTS "feedback_client_select_authenticated" ON feedback_client;
CREATE POLICY "feedback_client_select_authenticated"
    ON feedback_client FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "feedback_client_insert_authenticated" ON feedback_client;
CREATE POLICY "feedback_client_insert_authenticated"
    ON feedback_client FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "feedback_client_update_authenticated" ON feedback_client;
CREATE POLICY "feedback_client_update_authenticated"
    ON feedback_client FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "feedback_client_delete_authenticated" ON feedback_client;
CREATE POLICY "feedback_client_delete_authenticated"
    ON feedback_client FOR DELETE TO authenticated USING (true);

-- ---- partenaires ----
DROP POLICY IF EXISTS "partenaires_select_authenticated" ON partenaires;
CREATE POLICY "partenaires_select_authenticated"
    ON partenaires FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "partenaires_insert_authenticated" ON partenaires;
CREATE POLICY "partenaires_insert_authenticated"
    ON partenaires FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "partenaires_update_authenticated" ON partenaires;
CREATE POLICY "partenaires_update_authenticated"
    ON partenaires FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "partenaires_delete_authenticated" ON partenaires;
CREATE POLICY "partenaires_delete_authenticated"
    ON partenaires FOR DELETE TO authenticated USING (true);

-- ---- changelog ----
DROP POLICY IF EXISTS "changelog_select_authenticated" ON changelog;
CREATE POLICY "changelog_select_authenticated"
    ON changelog FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "changelog_insert_authenticated" ON changelog;
CREATE POLICY "changelog_insert_authenticated"
    ON changelog FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "changelog_update_authenticated" ON changelog;
CREATE POLICY "changelog_update_authenticated"
    ON changelog FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "changelog_delete_authenticated" ON changelog;
CREATE POLICY "changelog_delete_authenticated"
    ON changelog FOR DELETE TO authenticated USING (true);

-- ---- scenarios_previsionnels ----
DROP POLICY IF EXISTS "scenarios_previsionnels_select_authenticated" ON scenarios_previsionnels;
CREATE POLICY "scenarios_previsionnels_select_authenticated"
    ON scenarios_previsionnels FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "scenarios_previsionnels_insert_authenticated" ON scenarios_previsionnels;
CREATE POLICY "scenarios_previsionnels_insert_authenticated"
    ON scenarios_previsionnels FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "scenarios_previsionnels_update_authenticated" ON scenarios_previsionnels;
CREATE POLICY "scenarios_previsionnels_update_authenticated"
    ON scenarios_previsionnels FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "scenarios_previsionnels_delete_authenticated" ON scenarios_previsionnels;
CREATE POLICY "scenarios_previsionnels_delete_authenticated"
    ON scenarios_previsionnels FOR DELETE TO authenticated USING (true);

-- ---- accomplissements ----
DROP POLICY IF EXISTS "accomplissements_select_authenticated" ON accomplissements;
CREATE POLICY "accomplissements_select_authenticated"
    ON accomplissements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "accomplissements_insert_authenticated" ON accomplissements;
CREATE POLICY "accomplissements_insert_authenticated"
    ON accomplissements FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "accomplissements_update_authenticated" ON accomplissements;
CREATE POLICY "accomplissements_update_authenticated"
    ON accomplissements FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "accomplissements_delete_authenticated" ON accomplissements;
CREATE POLICY "accomplissements_delete_authenticated"
    ON accomplissements FOR DELETE TO authenticated USING (true);

-- ---- demandes_evolution ----
DROP POLICY IF EXISTS "demandes_evolution_select_authenticated" ON demandes_evolution;
CREATE POLICY "demandes_evolution_select_authenticated"
    ON demandes_evolution FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "demandes_evolution_insert_authenticated" ON demandes_evolution;
CREATE POLICY "demandes_evolution_insert_authenticated"
    ON demandes_evolution FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "demandes_evolution_update_authenticated" ON demandes_evolution;
CREATE POLICY "demandes_evolution_update_authenticated"
    ON demandes_evolution FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "demandes_evolution_delete_authenticated" ON demandes_evolution;
CREATE POLICY "demandes_evolution_delete_authenticated"
    ON demandes_evolution FOR DELETE TO authenticated USING (true);

-- ---- equipe ----
DROP POLICY IF EXISTS "equipe_select_authenticated" ON equipe;
CREATE POLICY "equipe_select_authenticated"
    ON equipe FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "equipe_insert_authenticated" ON equipe;
CREATE POLICY "equipe_insert_authenticated"
    ON equipe FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "equipe_update_authenticated" ON equipe;
CREATE POLICY "equipe_update_authenticated"
    ON equipe FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "equipe_delete_authenticated" ON equipe;
CREATE POLICY "equipe_delete_authenticated"
    ON equipe FOR DELETE TO authenticated USING (true);

-- ---- projet_membres ----
DROP POLICY IF EXISTS "projet_membres_select_authenticated" ON projet_membres;
CREATE POLICY "projet_membres_select_authenticated"
    ON projet_membres FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "projet_membres_insert_authenticated" ON projet_membres;
CREATE POLICY "projet_membres_insert_authenticated"
    ON projet_membres FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projet_membres_update_authenticated" ON projet_membres;
CREATE POLICY "projet_membres_update_authenticated"
    ON projet_membres FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "projet_membres_delete_authenticated" ON projet_membres;
CREATE POLICY "projet_membres_delete_authenticated"
    ON projet_membres FOR DELETE TO authenticated USING (true);

-- ---- notifications ----
DROP POLICY IF EXISTS "notifications_select_authenticated" ON notifications;
CREATE POLICY "notifications_select_authenticated"
    ON notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;
CREATE POLICY "notifications_insert_authenticated"
    ON notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update_authenticated" ON notifications;
CREATE POLICY "notifications_update_authenticated"
    ON notifications FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "notifications_delete_authenticated" ON notifications;
CREATE POLICY "notifications_delete_authenticated"
    ON notifications FOR DELETE TO authenticated USING (true);

-- ---- devis ----
DROP POLICY IF EXISTS "devis_select_authenticated" ON devis;
CREATE POLICY "devis_select_authenticated"
    ON devis FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "devis_insert_authenticated" ON devis;
CREATE POLICY "devis_insert_authenticated"
    ON devis FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "devis_update_authenticated" ON devis;
CREATE POLICY "devis_update_authenticated"
    ON devis FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "devis_delete_authenticated" ON devis;
CREATE POLICY "devis_delete_authenticated"
    ON devis FOR DELETE TO authenticated USING (true);

-- ---- email_templates ----
DROP POLICY IF EXISTS "email_templates_select_authenticated" ON email_templates;
CREATE POLICY "email_templates_select_authenticated"
    ON email_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "email_templates_insert_authenticated" ON email_templates;
CREATE POLICY "email_templates_insert_authenticated"
    ON email_templates FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "email_templates_update_authenticated" ON email_templates;
CREATE POLICY "email_templates_update_authenticated"
    ON email_templates FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "email_templates_delete_authenticated" ON email_templates;
CREATE POLICY "email_templates_delete_authenticated"
    ON email_templates FOR DELETE TO authenticated USING (true);

-- ---- opportunite_contacts ----
DROP POLICY IF EXISTS "opportunite_contacts_select_authenticated" ON opportunite_contacts;
CREATE POLICY "opportunite_contacts_select_authenticated"
    ON opportunite_contacts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "opportunite_contacts_insert_authenticated" ON opportunite_contacts;
CREATE POLICY "opportunite_contacts_insert_authenticated"
    ON opportunite_contacts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "opportunite_contacts_update_authenticated" ON opportunite_contacts;
CREATE POLICY "opportunite_contacts_update_authenticated"
    ON opportunite_contacts FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "opportunite_contacts_delete_authenticated" ON opportunite_contacts;
CREATE POLICY "opportunite_contacts_delete_authenticated"
    ON opportunite_contacts FOR DELETE TO authenticated USING (true);

-- ---- documents_v2 (table sans migration, creee dans Supabase) ----
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents_v2') THEN
        DROP POLICY IF EXISTS "documents_v2_select_authenticated" ON documents_v2;
        CREATE POLICY "documents_v2_select_authenticated"
            ON documents_v2 FOR SELECT TO authenticated USING (true);

        DROP POLICY IF EXISTS "documents_v2_insert_authenticated" ON documents_v2;
        CREATE POLICY "documents_v2_insert_authenticated"
            ON documents_v2 FOR INSERT TO authenticated WITH CHECK (true);

        DROP POLICY IF EXISTS "documents_v2_update_authenticated" ON documents_v2;
        CREATE POLICY "documents_v2_update_authenticated"
            ON documents_v2 FOR UPDATE TO authenticated USING (true);

        DROP POLICY IF EXISTS "documents_v2_delete_authenticated" ON documents_v2;
        CREATE POLICY "documents_v2_delete_authenticated"
            ON documents_v2 FOR DELETE TO authenticated USING (true);

        RAISE NOTICE 'Politiques creees pour documents_v2';
    END IF;
END $$;

-- ---- record_manager_v2 (table sans migration, creee dans Supabase) ----
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'record_manager_v2') THEN
        DROP POLICY IF EXISTS "record_manager_v2_select_authenticated" ON record_manager_v2;
        CREATE POLICY "record_manager_v2_select_authenticated"
            ON record_manager_v2 FOR SELECT TO authenticated USING (true);

        DROP POLICY IF EXISTS "record_manager_v2_insert_authenticated" ON record_manager_v2;
        CREATE POLICY "record_manager_v2_insert_authenticated"
            ON record_manager_v2 FOR INSERT TO authenticated WITH CHECK (true);

        DROP POLICY IF EXISTS "record_manager_v2_update_authenticated" ON record_manager_v2;
        CREATE POLICY "record_manager_v2_update_authenticated"
            ON record_manager_v2 FOR UPDATE TO authenticated USING (true);

        DROP POLICY IF EXISTS "record_manager_v2_delete_authenticated" ON record_manager_v2;
        CREATE POLICY "record_manager_v2_delete_authenticated"
            ON record_manager_v2 FOR DELETE TO authenticated USING (true);

        RAISE NOTICE 'Politiques creees pour record_manager_v2';
    END IF;
END $$;

-- ---- tabular_document_rows (table sans migration, creee dans Supabase) ----
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tabular_document_rows') THEN
        DROP POLICY IF EXISTS "tabular_document_rows_select_authenticated" ON tabular_document_rows;
        CREATE POLICY "tabular_document_rows_select_authenticated"
            ON tabular_document_rows FOR SELECT TO authenticated USING (true);

        DROP POLICY IF EXISTS "tabular_document_rows_insert_authenticated" ON tabular_document_rows;
        CREATE POLICY "tabular_document_rows_insert_authenticated"
            ON tabular_document_rows FOR INSERT TO authenticated WITH CHECK (true);

        DROP POLICY IF EXISTS "tabular_document_rows_update_authenticated" ON tabular_document_rows;
        CREATE POLICY "tabular_document_rows_update_authenticated"
            ON tabular_document_rows FOR UPDATE TO authenticated USING (true);

        DROP POLICY IF EXISTS "tabular_document_rows_delete_authenticated" ON tabular_document_rows;
        CREATE POLICY "tabular_document_rows_delete_authenticated"
            ON tabular_document_rows FOR DELETE TO authenticated USING (true);

        RAISE NOTICE 'Politiques creees pour tabular_document_rows';
    END IF;
END $$;

-- ============================================================================
-- PHASE 4 : VERIFICATION POST-EXECUTION
-- ============================================================================

-- Compter les tables avec RLS active
DO $$
DECLARE
    rls_count INTEGER;
    total_count INTEGER;
    dev_policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

    SELECT COUNT(*) INTO total_count
    FROM pg_tables WHERE schemaname = 'public';

    SELECT COUNT(*) INTO dev_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (policyname LIKE '%_dev_%' OR policyname LIKE '%_anon%');

    RAISE NOTICE '============================================';
    RAISE NOTICE 'VERIFICATION POST-EXECUTION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tables avec RLS: % / %', rls_count, total_count;
    RAISE NOTICE 'Politiques dev restantes: % (devrait etre 0)', dev_policy_count;

    IF dev_policy_count > 0 THEN
        RAISE WARNING 'ATTENTION: % politiques dev/anon restent actives!', dev_policy_count;
    END IF;

    IF rls_count < total_count THEN
        RAISE WARNING 'ATTENTION: % tables sans RLS!', total_count - rls_count;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- RAPPELS IMPORTANTS
-- ============================================================================
-- 1. Le service_role (N8N) bypass RLS nativement - aucun impact sur les workflows
-- 2. Les politiques existantes granulaires (02_rls.sql) coexistent avec les
--    politiques de base. Elles seront nettoyees/remplacees en P0-04.
-- 3. La table profiles est maintenant restrictive (propre profil uniquement).
--    Si l'app affiche des noms d'autres utilisateurs, une fonction RPC
--    SECURITY DEFINER sera necessaire (a creer en P0-04).
-- 4. Prochaine etape : P0-03 (securiser fonctions RPC) puis P0-04 (granulaire)
-- ============================================================================
