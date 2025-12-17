-- ============================================
-- Row Level Security Policies
-- CRM Axivity - Supabase
-- ============================================

-- ============================================
-- FONCTIONS HELPER
-- ============================================

-- Récupérer le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Récupérer le client_id de l'utilisateur (pour rôle 'client')
CREATE OR REPLACE FUNCTION auth.user_client_id()
RETURNS UUID AS $$
  SELECT client_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifier si l'utilisateur est admin ou manager
CREATE OR REPLACE FUNCTION auth.is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() IN ('admin', 'manager')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================

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

-- ============================================
-- POLICIES: profiles
-- ============================================

-- Tout le monde peut voir les profils (pour afficher les noms)
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- Chacun peut modifier son propre profil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Seuls les admins peuvent créer/supprimer des profils
CREATE POLICY "profiles_admin_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "profiles_admin_delete"
  ON profiles FOR DELETE
  USING (auth.user_role() = 'admin');

-- ============================================
-- POLICIES: clients
-- ============================================

-- Admin et manager voient tous les clients
CREATE POLICY "clients_select_admin_manager"
  ON clients FOR SELECT
  USING (auth.is_admin_or_manager());

-- Commerciaux voient leurs propres clients
CREATE POLICY "clients_select_commercial"
  ON clients FOR SELECT
  USING (
    auth.user_role() = 'commercial' AND owner_id = auth.uid()
  );

-- Membres voient tous les clients (lecture seule)
CREATE POLICY "clients_select_membre"
  ON clients FOR SELECT
  USING (auth.user_role() = 'membre');

-- Clients externes voient leur propre fiche
CREATE POLICY "clients_select_client_externe"
  ON clients FOR SELECT
  USING (
    auth.user_role() = 'client' AND id = auth.user_client_id()
  );

-- Admin a tous les droits
CREATE POLICY "clients_all_admin"
  ON clients FOR ALL
  USING (auth.user_role() = 'admin');

-- Manager peut créer/modifier/supprimer
CREATE POLICY "clients_crud_manager"
  ON clients FOR ALL
  USING (auth.user_role() = 'manager');

-- Commercial peut créer et modifier ses clients
CREATE POLICY "clients_insert_commercial"
  ON clients FOR INSERT
  WITH CHECK (auth.user_role() = 'commercial');

CREATE POLICY "clients_update_commercial"
  ON clients FOR UPDATE
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

-- ============================================
-- POLICIES: contacts
-- ============================================

-- Admin et manager voient tous
CREATE POLICY "contacts_select_admin_manager"
  ON contacts FOR SELECT
  USING (auth.is_admin_or_manager());

-- Commerciaux voient leurs contacts
CREATE POLICY "contacts_select_commercial"
  ON contacts FOR SELECT
  USING (
    auth.user_role() = 'commercial' AND owner_id = auth.uid()
  );

-- Membres voient tous (lecture)
CREATE POLICY "contacts_select_membre"
  ON contacts FOR SELECT
  USING (auth.user_role() = 'membre');

-- CRUD admin
CREATE POLICY "contacts_all_admin"
  ON contacts FOR ALL
  USING (auth.user_role() = 'admin');

-- CRUD manager
CREATE POLICY "contacts_all_manager"
  ON contacts FOR ALL
  USING (auth.user_role() = 'manager');

-- Commercial peut gérer ses contacts
CREATE POLICY "contacts_crud_commercial"
  ON contacts FOR ALL
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

-- ============================================
-- POLICIES: opportunites
-- ============================================

-- Admin et manager voient toutes
CREATE POLICY "opportunites_select_admin_manager"
  ON opportunites FOR SELECT
  USING (auth.is_admin_or_manager());

-- Commerciaux voient les leurs
CREATE POLICY "opportunites_select_commercial"
  ON opportunites FOR SELECT
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

-- Membres lecture seule
CREATE POLICY "opportunites_select_membre"
  ON opportunites FOR SELECT
  USING (auth.user_role() = 'membre');

-- CRUD admin/manager
CREATE POLICY "opportunites_all_admin"
  ON opportunites FOR ALL
  USING (auth.user_role() = 'admin');

CREATE POLICY "opportunites_all_manager"
  ON opportunites FOR ALL
  USING (auth.user_role() = 'manager');

-- Commercial CRUD sur ses opportunités
CREATE POLICY "opportunites_crud_commercial"
  ON opportunites FOR ALL
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

-- ============================================
-- POLICIES: projets
-- ============================================

-- Admin et manager voient tous
CREATE POLICY "projets_select_admin_manager"
  ON projets FOR SELECT
  USING (auth.is_admin_or_manager());

-- Membres voient les projets où ils ont des tâches
CREATE POLICY "projets_select_membre"
  ON projets FOR SELECT
  USING (
    auth.user_role() = 'membre' AND (
      chef_projet_id = auth.uid() OR
      id IN (SELECT projet_id FROM taches WHERE assignee_id = auth.uid())
    )
  );

-- Commerciaux lecture seule
CREATE POLICY "projets_select_commercial"
  ON projets FOR SELECT
  USING (auth.user_role() = 'commercial');

-- Clients voient leurs projets
CREATE POLICY "projets_select_client"
  ON projets FOR SELECT
  USING (
    auth.user_role() = 'client' AND client_id = auth.user_client_id()
  );

-- CRUD admin/manager
CREATE POLICY "projets_all_admin"
  ON projets FOR ALL
  USING (auth.user_role() = 'admin');

CREATE POLICY "projets_all_manager"
  ON projets FOR ALL
  USING (auth.user_role() = 'manager');

-- ============================================
-- POLICIES: taches
-- ============================================

-- Admin et manager voient toutes
CREATE POLICY "taches_select_admin_manager"
  ON taches FOR SELECT
  USING (auth.is_admin_or_manager());

-- Membres voient les leurs + celles de leurs projets
CREATE POLICY "taches_select_membre"
  ON taches FOR SELECT
  USING (
    auth.user_role() = 'membre' AND (
      assignee_id = auth.uid() OR
      projet_id IN (SELECT id FROM projets WHERE chef_projet_id = auth.uid())
    )
  );

-- CRUD admin/manager
CREATE POLICY "taches_all_admin"
  ON taches FOR ALL
  USING (auth.user_role() = 'admin');

CREATE POLICY "taches_all_manager"
  ON taches FOR ALL
  USING (auth.user_role() = 'manager');

-- Membre peut modifier ses tâches
CREATE POLICY "taches_update_membre"
  ON taches FOR UPDATE
  USING (auth.user_role() = 'membre' AND assignee_id = auth.uid());

-- ============================================
-- POLICIES: factures
-- ============================================

-- Admin et manager voient toutes
CREATE POLICY "factures_select_admin_manager"
  ON factures FOR SELECT
  USING (auth.is_admin_or_manager());

-- Commerciaux lecture seule
CREATE POLICY "factures_select_commercial"
  ON factures FOR SELECT
  USING (auth.user_role() = 'commercial');

-- Clients voient leurs factures
CREATE POLICY "factures_select_client"
  ON factures FOR SELECT
  USING (
    auth.user_role() = 'client' AND client_id = auth.user_client_id()
  );

-- CRUD admin uniquement
CREATE POLICY "factures_all_admin"
  ON factures FOR ALL
  USING (auth.user_role() = 'admin');

-- Manager peut modifier
CREATE POLICY "factures_crud_manager"
  ON factures FOR ALL
  USING (auth.user_role() = 'manager');

-- ============================================
-- POLICIES: interactions
-- ============================================

-- Tout le monde (sauf client) peut voir les interactions
CREATE POLICY "interactions_select_all"
  ON interactions FOR SELECT
  USING (auth.user_role() != 'client');

-- Admin/manager/commercial peuvent créer
CREATE POLICY "interactions_insert"
  ON interactions FOR INSERT
  WITH CHECK (auth.user_role() IN ('admin', 'manager', 'commercial'));

-- Admin/manager peuvent tout faire
CREATE POLICY "interactions_all_admin"
  ON interactions FOR ALL
  USING (auth.user_role() IN ('admin', 'manager'));

-- ============================================
-- POLICIES: journal_temps
-- ============================================

-- Chacun voit ses propres entrées
CREATE POLICY "journal_temps_select_own"
  ON journal_temps FOR SELECT
  USING (user_id = auth.uid());

-- Admin/manager voient tout
CREATE POLICY "journal_temps_select_admin"
  ON journal_temps FOR SELECT
  USING (auth.is_admin_or_manager());

-- Chacun peut créer/modifier ses entrées
CREATE POLICY "journal_temps_crud_own"
  ON journal_temps FOR ALL
  USING (user_id = auth.uid());

-- Admin peut tout
CREATE POLICY "journal_temps_all_admin"
  ON journal_temps FOR ALL
  USING (auth.user_role() = 'admin');

-- ============================================
-- POLICIES: catalogue_services (lecture pour tous auth)
-- ============================================

CREATE POLICY "catalogue_select_all"
  ON catalogue_services FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "catalogue_all_admin"
  ON catalogue_services FOR ALL
  USING (auth.user_role() IN ('admin', 'manager'));

-- ============================================
-- POLICIES: Tables secondaires (lecture pour tous auth, CRUD admin/manager)
-- ============================================

-- modeles_taches
CREATE POLICY "modeles_taches_select" ON modeles_taches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "modeles_taches_all" ON modeles_taches FOR ALL USING (auth.is_admin_or_manager());

-- objectifs
CREATE POLICY "objectifs_select" ON objectifs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "objectifs_all" ON objectifs FOR ALL USING (auth.is_admin_or_manager());

-- resultats_cles
CREATE POLICY "resultats_cles_select" ON resultats_cles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "resultats_cles_all" ON resultats_cles FOR ALL USING (auth.is_admin_or_manager());

-- connaissances
CREATE POLICY "connaissances_select" ON connaissances FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "connaissances_insert" ON connaissances FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "connaissances_all" ON connaissances FOR ALL USING (auth.is_admin_or_manager());

-- feedback_client
CREATE POLICY "feedback_select" ON feedback_client FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "feedback_all" ON feedback_client FOR ALL USING (auth.is_admin_or_manager());

-- partenaires
CREATE POLICY "partenaires_select" ON partenaires FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "partenaires_all" ON partenaires FOR ALL USING (auth.is_admin_or_manager());

-- changelog
CREATE POLICY "changelog_select" ON changelog FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "changelog_all" ON changelog FOR ALL USING (auth.is_admin_or_manager());

-- scenarios_previsionnels
CREATE POLICY "scenarios_select" ON scenarios_previsionnels FOR SELECT USING (auth.is_admin_or_manager());
CREATE POLICY "scenarios_all" ON scenarios_previsionnels FOR ALL USING (auth.user_role() = 'admin');

-- accomplissements
CREATE POLICY "accomplissements_select_own" ON accomplissements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "accomplissements_select_admin" ON accomplissements FOR SELECT USING (auth.is_admin_or_manager());
CREATE POLICY "accomplissements_crud_own" ON accomplissements FOR ALL USING (user_id = auth.uid());

-- demandes_evolution
CREATE POLICY "demandes_select" ON demandes_evolution FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "demandes_insert" ON demandes_evolution FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "demandes_all" ON demandes_evolution FOR ALL USING (auth.is_admin_or_manager());

-- lignes_devis (suit les opportunités)
CREATE POLICY "lignes_devis_select" ON lignes_devis FOR SELECT USING (
  opportunite_id IN (SELECT id FROM opportunites)
);
CREATE POLICY "lignes_devis_all" ON lignes_devis FOR ALL USING (auth.is_admin_or_manager());
