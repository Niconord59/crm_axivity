-- ============================================
-- Fix RLS pour la table profiles
-- Permettre l'accès en développement
-- ============================================

-- S'assurer que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "profiles_dev_select" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_update" ON profiles;
DROP POLICY IF EXISTS "profiles_dev_delete" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Créer des policies permissives pour le développement
CREATE POLICY "profiles_dev_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_dev_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_dev_update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_dev_delete" ON profiles FOR DELETE USING (true);

-- Vérifier que la table profiles existe et a les bonnes colonnes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Afficher les policies actives
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
