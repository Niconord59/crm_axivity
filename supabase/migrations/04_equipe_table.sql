-- ============================================
-- Table équipe manquante + Colonnes manquantes + Policies de développement
-- CRM Axivity - Supabase
-- ============================================

-- ============================================
-- COLONNES MANQUANTES
-- ============================================

-- Ajouter date_rdv_prevu aux contacts (si elle n'existe pas)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS date_rdv_prevu DATE;

-- Ajouter objet aux interactions (titre/sujet de l'interaction)
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS objet TEXT;

-- Ajouter priorite aux projets (champ manquant)
ALTER TABLE projets ADD COLUMN IF NOT EXISTS priorite task_priority;

-- Ajouter date_terminee aux taches (champ manquant)
ALTER TABLE taches ADD COLUMN IF NOT EXISTS date_terminee DATE;

-- ============================================
-- TABLE: equipe (T10)
-- Membres de l'équipe avec gestion de charge
-- ============================================

-- Type de rôle équipe (différent de user_role pour auth)
CREATE TYPE team_role AS ENUM (
  'Direction', 'Chef de Projet', 'Développeur', 'Designer', 'Commercial', 'Support'
);

CREATE TABLE public.equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  email TEXT,
  role team_role,
  capacite_hebdo DECIMAL(5,2) DEFAULT 35, -- Heures par semaine
  -- Champs calculés (mis à jour via triggers ou manuellement)
  charge_prevue_semaine DECIMAL(5,2) DEFAULT 0,
  capacite_atteinte DECIMAL(5,2) DEFAULT 0, -- Pourcentage
  -- Lien optionnel vers profile auth
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipe_role ON equipe(role);
CREATE INDEX idx_equipe_profile ON equipe(profile_id);

-- Activer RLS
ALTER TABLE equipe ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES DE DÉVELOPPEMENT (accès anonyme)
-- À SUPPRIMER EN PRODUCTION !
-- ============================================

-- Lecture pour tous (y compris anonyme)
CREATE POLICY "equipe_select_anon" ON equipe FOR SELECT USING (true);
CREATE POLICY "equipe_insert_anon" ON equipe FOR INSERT WITH CHECK (true);
CREATE POLICY "equipe_update_anon" ON equipe FOR UPDATE USING (true);
CREATE POLICY "equipe_delete_anon" ON equipe FOR DELETE USING (true);

-- ============================================
-- POLICIES TEMPORAIRES POUR LES AUTRES TABLES
-- Permettre l'accès anonyme en développement
-- ============================================

-- clients
DROP POLICY IF EXISTS "clients_dev_select" ON clients;
CREATE POLICY "clients_dev_select" ON clients FOR SELECT USING (true);
DROP POLICY IF EXISTS "clients_dev_insert" ON clients;
CREATE POLICY "clients_dev_insert" ON clients FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clients_dev_update" ON clients;
CREATE POLICY "clients_dev_update" ON clients FOR UPDATE USING (true);
DROP POLICY IF EXISTS "clients_dev_delete" ON clients;
CREATE POLICY "clients_dev_delete" ON clients FOR DELETE USING (true);

-- contacts
DROP POLICY IF EXISTS "contacts_dev_select" ON contacts;
CREATE POLICY "contacts_dev_select" ON contacts FOR SELECT USING (true);
DROP POLICY IF EXISTS "contacts_dev_insert" ON contacts;
CREATE POLICY "contacts_dev_insert" ON contacts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "contacts_dev_update" ON contacts;
CREATE POLICY "contacts_dev_update" ON contacts FOR UPDATE USING (true);
DROP POLICY IF EXISTS "contacts_dev_delete" ON contacts;
CREATE POLICY "contacts_dev_delete" ON contacts FOR DELETE USING (true);

-- projets
DROP POLICY IF EXISTS "projets_dev_select" ON projets;
CREATE POLICY "projets_dev_select" ON projets FOR SELECT USING (true);
DROP POLICY IF EXISTS "projets_dev_insert" ON projets;
CREATE POLICY "projets_dev_insert" ON projets FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "projets_dev_update" ON projets;
CREATE POLICY "projets_dev_update" ON projets FOR UPDATE USING (true);
DROP POLICY IF EXISTS "projets_dev_delete" ON projets;
CREATE POLICY "projets_dev_delete" ON projets FOR DELETE USING (true);

-- opportunites
DROP POLICY IF EXISTS "opportunites_dev_select" ON opportunites;
CREATE POLICY "opportunites_dev_select" ON opportunites FOR SELECT USING (true);
DROP POLICY IF EXISTS "opportunites_dev_insert" ON opportunites;
CREATE POLICY "opportunites_dev_insert" ON opportunites FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "opportunites_dev_update" ON opportunites;
CREATE POLICY "opportunites_dev_update" ON opportunites FOR UPDATE USING (true);
DROP POLICY IF EXISTS "opportunites_dev_delete" ON opportunites;
CREATE POLICY "opportunites_dev_delete" ON opportunites FOR DELETE USING (true);

-- taches
DROP POLICY IF EXISTS "taches_dev_select" ON taches;
CREATE POLICY "taches_dev_select" ON taches FOR SELECT USING (true);
DROP POLICY IF EXISTS "taches_dev_insert" ON taches;
CREATE POLICY "taches_dev_insert" ON taches FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "taches_dev_update" ON taches;
CREATE POLICY "taches_dev_update" ON taches FOR UPDATE USING (true);
DROP POLICY IF EXISTS "taches_dev_delete" ON taches;
CREATE POLICY "taches_dev_delete" ON taches FOR DELETE USING (true);

-- factures
DROP POLICY IF EXISTS "factures_dev_select" ON factures;
CREATE POLICY "factures_dev_select" ON factures FOR SELECT USING (true);
DROP POLICY IF EXISTS "factures_dev_insert" ON factures;
CREATE POLICY "factures_dev_insert" ON factures FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "factures_dev_update" ON factures;
CREATE POLICY "factures_dev_update" ON factures FOR UPDATE USING (true);
DROP POLICY IF EXISTS "factures_dev_delete" ON factures;
CREATE POLICY "factures_dev_delete" ON factures FOR DELETE USING (true);

-- interactions
DROP POLICY IF EXISTS "interactions_dev_select" ON interactions;
CREATE POLICY "interactions_dev_select" ON interactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "interactions_dev_insert" ON interactions;
CREATE POLICY "interactions_dev_insert" ON interactions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "interactions_dev_update" ON interactions;
CREATE POLICY "interactions_dev_update" ON interactions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "interactions_dev_delete" ON interactions;
CREATE POLICY "interactions_dev_delete" ON interactions FOR DELETE USING (true);

-- profiles (lecture seule pour tous en dev)
DROP POLICY IF EXISTS "profiles_dev_select" ON profiles;
CREATE POLICY "profiles_dev_select" ON profiles FOR SELECT USING (true);

-- journal_temps
DROP POLICY IF EXISTS "journal_temps_dev_select" ON journal_temps;
CREATE POLICY "journal_temps_dev_select" ON journal_temps FOR SELECT USING (true);
DROP POLICY IF EXISTS "journal_temps_dev_insert" ON journal_temps;
CREATE POLICY "journal_temps_dev_insert" ON journal_temps FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "journal_temps_dev_update" ON journal_temps;
CREATE POLICY "journal_temps_dev_update" ON journal_temps FOR UPDATE USING (true);

-- catalogue_services
DROP POLICY IF EXISTS "catalogue_dev_select" ON catalogue_services;
CREATE POLICY "catalogue_dev_select" ON catalogue_services FOR SELECT USING (true);

-- lignes_devis
DROP POLICY IF EXISTS "lignes_devis_dev_select" ON lignes_devis;
CREATE POLICY "lignes_devis_dev_select" ON lignes_devis FOR SELECT USING (true);
DROP POLICY IF EXISTS "lignes_devis_dev_insert" ON lignes_devis;
CREATE POLICY "lignes_devis_dev_insert" ON lignes_devis FOR INSERT WITH CHECK (true);

-- modeles_taches
DROP POLICY IF EXISTS "modeles_taches_dev_select" ON modeles_taches;
CREATE POLICY "modeles_taches_dev_select" ON modeles_taches FOR SELECT USING (true);

-- feedback_client
DROP POLICY IF EXISTS "feedback_dev_select" ON feedback_client;
CREATE POLICY "feedback_dev_select" ON feedback_client FOR SELECT USING (true);
DROP POLICY IF EXISTS "feedback_dev_insert" ON feedback_client;
CREATE POLICY "feedback_dev_insert" ON feedback_client FOR INSERT WITH CHECK (true);

-- partenaires
DROP POLICY IF EXISTS "partenaires_dev_select" ON partenaires;
CREATE POLICY "partenaires_dev_select" ON partenaires FOR SELECT USING (true);

-- connaissances
DROP POLICY IF EXISTS "connaissances_dev_select" ON connaissances;
CREATE POLICY "connaissances_dev_select" ON connaissances FOR SELECT USING (true);
DROP POLICY IF EXISTS "connaissances_dev_insert" ON connaissances;
CREATE POLICY "connaissances_dev_insert" ON connaissances FOR INSERT WITH CHECK (true);

-- accomplissements
DROP POLICY IF EXISTS "accomplissements_dev_select" ON accomplissements;
CREATE POLICY "accomplissements_dev_select" ON accomplissements FOR SELECT USING (true);
DROP POLICY IF EXISTS "accomplissements_dev_insert" ON accomplissements;
CREATE POLICY "accomplissements_dev_insert" ON accomplissements FOR INSERT WITH CHECK (true);

-- objectifs
DROP POLICY IF EXISTS "objectifs_dev_select" ON objectifs;
CREATE POLICY "objectifs_dev_select" ON objectifs FOR SELECT USING (true);

-- resultats_cles
DROP POLICY IF EXISTS "resultats_cles_dev_select" ON resultats_cles;
CREATE POLICY "resultats_cles_dev_select" ON resultats_cles FOR SELECT USING (true);

-- changelog
DROP POLICY IF EXISTS "changelog_dev_select" ON changelog;
CREATE POLICY "changelog_dev_select" ON changelog FOR SELECT USING (true);

-- demandes_evolution
DROP POLICY IF EXISTS "demandes_dev_select" ON demandes_evolution;
CREATE POLICY "demandes_dev_select" ON demandes_evolution FOR SELECT USING (true);
DROP POLICY IF EXISTS "demandes_dev_insert" ON demandes_evolution;
CREATE POLICY "demandes_dev_insert" ON demandes_evolution FOR INSERT WITH CHECK (true);

-- scenarios_previsionnels
DROP POLICY IF EXISTS "scenarios_dev_select" ON scenarios_previsionnels;
CREATE POLICY "scenarios_dev_select" ON scenarios_previsionnels FOR SELECT USING (true);

-- ============================================
-- DONNÉES DE TEST ÉQUIPE
-- ============================================

INSERT INTO equipe (nom, email, role, capacite_hebdo) VALUES
  ('Marie Dupont', 'marie@axivity.fr', 'Direction', 40),
  ('Jean Martin', 'jean@axivity.fr', 'Chef de Projet', 35),
  ('Sophie Bernard', 'sophie@axivity.fr', 'Développeur', 35),
  ('Lucas Petit', 'lucas@axivity.fr', 'Designer', 35),
  ('Emma Roux', 'emma@axivity.fr', 'Commercial', 35),
  ('Thomas Leroy', 'thomas@axivity.fr', 'Support', 35);
