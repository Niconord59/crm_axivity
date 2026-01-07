-- ============================================
-- FIX: RLS pour projet_membres et notifications
-- CRM Axivity - Supabase
-- ============================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "projet_membres_insert_admin" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_delete_admin" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_update_admin" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_insert_admin_manager" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_delete_admin_manager" ON projet_membres;
DROP POLICY IF EXISTS "projet_membres_update_admin_manager" ON projet_membres;

DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_admin_manager" ON notifications;

-- ============================================
-- PROJET_MEMBRES: Seul admin peut gérer
-- ============================================

CREATE POLICY "projet_membres_insert_admin"
  ON projet_membres FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "projet_membres_delete_admin"
  ON projet_membres FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "projet_membres_update_admin"
  ON projet_membres FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- NOTIFICATIONS: Tous authentifiés peuvent créer
-- (nécessaire pour que les admins créent des notifs pour d'autres)
-- ============================================

CREATE POLICY "notifications_insert_authenticated"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- DEBUG: Vérifier ton rôle avec cette requête:
-- SELECT id, nom, prenom, email, role FROM profiles WHERE id = auth.uid();
-- ============================================
