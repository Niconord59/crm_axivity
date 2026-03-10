-- ============================================
-- Migration: Projet Membres & Notifications
-- CRM Axivity - Supabase
-- ============================================

-- ============================================
-- TABLE: projet_membres (many-to-many)
-- ============================================

CREATE TABLE projet_membres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(projet_id, profile_id)
);

-- Index pour les requetes frequentes
CREATE INDEX idx_projet_membres_projet ON projet_membres(projet_id);
CREATE INDEX idx_projet_membres_profile ON projet_membres(profile_id);

-- ============================================
-- TABLE: notifications
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'project_assigned', 'task_assigned', etc.
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- ex: '/projets/xxx'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requetes frequentes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- RLS: projet_membres
-- ============================================

ALTER TABLE projet_membres ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les membres des projets (pour afficher les avatars)
CREATE POLICY "projet_membres_select_all"
  ON projet_membres FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seul l'admin peut ajouter/retirer des membres
CREATE POLICY "projet_membres_insert_admin"
  ON projet_membres FOR INSERT
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "projet_membres_delete_admin"
  ON projet_membres FOR DELETE
  USING (auth.user_role() = 'admin');

CREATE POLICY "projet_membres_update_admin"
  ON projet_membres FOR UPDATE
  USING (auth.user_role() = 'admin');

-- ============================================
-- RLS: notifications
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Chacun ne voit que ses propres notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Chacun peut modifier ses propres notifications (marquer comme lue)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Admin peut creer des notifications pour tout le monde
CREATE POLICY "notifications_insert_admin"
  ON notifications FOR INSERT
  WITH CHECK (auth.user_role() = 'admin');

-- Admin peut supprimer des notifications
CREATE POLICY "notifications_delete_admin"
  ON notifications FOR DELETE
  USING (auth.user_role() = 'admin');

-- ============================================
-- UPDATE RLS: projets (membres assignes)
-- ============================================

-- Ajouter des policies pour que les developpeurs assignes voient leurs projets
DROP POLICY IF EXISTS "projets_select_developpeur_nocode" ON projets;
DROP POLICY IF EXISTS "projets_select_developpeur_automatisme" ON projets;

CREATE POLICY "projets_select_developpeur_nocode"
  ON projets FOR SELECT
  USING (
    auth.user_role() = 'developpeur_nocode' AND (
      chef_projet_id = auth.uid() OR
      id IN (SELECT projet_id FROM taches WHERE assignee_id = auth.uid()) OR
      id IN (SELECT projet_id FROM projet_membres WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "projets_select_developpeur_automatisme"
  ON projets FOR SELECT
  USING (
    auth.user_role() = 'developpeur_automatisme' AND (
      chef_projet_id = auth.uid() OR
      id IN (SELECT projet_id FROM taches WHERE assignee_id = auth.uid()) OR
      id IN (SELECT projet_id FROM projet_membres WHERE profile_id = auth.uid())
    )
  );
