-- ============================================
-- Update user_role enum - ROBUST VERSION
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- First, cleanup any partial state from previous attempts
DROP TYPE IF EXISTS user_role_new CASCADE;

-- Drop functions that depend on user_role BEFORE any changes
DROP FUNCTION IF EXISTS auth.user_role() CASCADE;
DROP FUNCTION IF EXISTS auth.is_admin_or_manager() CASCADE;
DROP FUNCTION IF EXISTS auth.is_developer() CASCADE;

-- Check current state of profiles.role column
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role';

    RAISE NOTICE 'Current role column type: %', col_type;
END $$;

-- Step 1: Create the new enum type
CREATE TYPE user_role_new AS ENUM ('admin', 'developpeur_nocode', 'developpeur_automatisme', 'commercial', 'client');

-- Step 2: Convert role column to text first (handles both enum and text cases)
ALTER TABLE profiles
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE profiles
  ALTER COLUMN role TYPE text USING role::text;

-- Step 3: Update existing role values (map old to new)
UPDATE profiles SET role = 'developpeur_nocode' WHERE role = 'manager';
UPDATE profiles SET role = 'developpeur_automatisme' WHERE role = 'membre';
-- admin, commercial, client remain unchanged

-- Step 4: Convert to new enum type
ALTER TABLE profiles
  ALTER COLUMN role TYPE user_role_new USING role::user_role_new;

ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'developpeur_automatisme'::user_role_new;

-- Step 5: Drop old enum if it exists
DROP TYPE IF EXISTS user_role CASCADE;

-- Step 6: Rename new enum to user_role
ALTER TYPE user_role_new RENAME TO user_role;

-- Step 7: Recreate auth functions
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.is_developer()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() IN ('developpeur_nocode', 'developpeur_automatisme')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Update RLS policies
-- ============================================

-- Clean up old policies (ignore if they don't exist)
DROP POLICY IF EXISTS "clients_select_commercial" ON clients;
DROP POLICY IF EXISTS "clients_select_membre" ON clients;
DROP POLICY IF EXISTS "clients_crud_manager" ON clients;
DROP POLICY IF EXISTS "clients_insert_commercial" ON clients;
DROP POLICY IF EXISTS "clients_update_commercial" ON clients;
DROP POLICY IF EXISTS "clients_select_developers" ON clients;

DROP POLICY IF EXISTS "contacts_select_commercial" ON contacts;
DROP POLICY IF EXISTS "contacts_select_membre" ON contacts;
DROP POLICY IF EXISTS "contacts_all_manager" ON contacts;
DROP POLICY IF EXISTS "contacts_crud_commercial" ON contacts;
DROP POLICY IF EXISTS "contacts_select_developers" ON contacts;

DROP POLICY IF EXISTS "opportunites_select_commercial" ON opportunites;
DROP POLICY IF EXISTS "opportunites_select_membre" ON opportunites;
DROP POLICY IF EXISTS "opportunites_all_manager" ON opportunites;
DROP POLICY IF EXISTS "opportunites_crud_commercial" ON opportunites;
DROP POLICY IF EXISTS "opportunites_select_developers" ON opportunites;

DROP POLICY IF EXISTS "projets_select_membre" ON projets;
DROP POLICY IF EXISTS "projets_select_commercial" ON projets;
DROP POLICY IF EXISTS "projets_all_manager" ON projets;
DROP POLICY IF EXISTS "projets_select_developers" ON projets;

DROP POLICY IF EXISTS "taches_select_membre" ON taches;
DROP POLICY IF EXISTS "taches_all_manager" ON taches;
DROP POLICY IF EXISTS "taches_update_membre" ON taches;
DROP POLICY IF EXISTS "taches_select_developers" ON taches;
DROP POLICY IF EXISTS "taches_update_developers" ON taches;

DROP POLICY IF EXISTS "factures_select_commercial" ON factures;
DROP POLICY IF EXISTS "factures_crud_manager" ON factures;
DROP POLICY IF EXISTS "factures_select_developers" ON factures;

DROP POLICY IF EXISTS "interactions_insert" ON interactions;
DROP POLICY IF EXISTS "interactions_all_admin" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_developers" ON interactions;
DROP POLICY IF EXISTS "interactions_insert_commercial" ON interactions;

-- ============================================
-- Create new RLS policies for developers
-- ============================================

CREATE POLICY "clients_select_developers"
  ON clients FOR SELECT
  USING (auth.is_developer());

CREATE POLICY "contacts_select_developers"
  ON contacts FOR SELECT
  USING (auth.is_developer());

CREATE POLICY "opportunites_select_developers"
  ON opportunites FOR SELECT
  USING (auth.is_developer());

CREATE POLICY "projets_select_developers"
  ON projets FOR SELECT
  USING (
    auth.is_developer() AND (
      chef_projet_id = auth.uid() OR
      id IN (SELECT projet_id FROM taches WHERE assignee_id = auth.uid())
    )
  );

CREATE POLICY "taches_select_developers"
  ON taches FOR SELECT
  USING (
    auth.is_developer() AND (
      assignee_id = auth.uid() OR
      projet_id IN (SELECT id FROM projets WHERE chef_projet_id = auth.uid())
    )
  );

CREATE POLICY "taches_update_developers"
  ON taches FOR UPDATE
  USING (auth.is_developer() AND assignee_id = auth.uid());

CREATE POLICY "factures_select_developers"
  ON factures FOR SELECT
  USING (auth.is_developer());

CREATE POLICY "interactions_insert_developers"
  ON interactions FOR INSERT
  WITH CHECK (auth.is_developer());

-- ============================================
-- Create RLS policies for commercial role
-- ============================================

CREATE POLICY "clients_select_commercial"
  ON clients FOR SELECT
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

CREATE POLICY "clients_insert_commercial"
  ON clients FOR INSERT
  WITH CHECK (auth.user_role() = 'commercial');

CREATE POLICY "clients_update_commercial"
  ON clients FOR UPDATE
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

CREATE POLICY "contacts_select_commercial"
  ON contacts FOR SELECT
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

CREATE POLICY "contacts_crud_commercial"
  ON contacts FOR ALL
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

CREATE POLICY "opportunites_select_commercial"
  ON opportunites FOR SELECT
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

CREATE POLICY "opportunites_crud_commercial"
  ON opportunites FOR ALL
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

CREATE POLICY "projets_select_commercial"
  ON projets FOR SELECT
  USING (auth.user_role() = 'commercial');

CREATE POLICY "factures_select_commercial"
  ON factures FOR SELECT
  USING (auth.user_role() = 'commercial');

CREATE POLICY "interactions_insert_commercial"
  ON interactions FOR INSERT
  WITH CHECK (auth.user_role() = 'commercial');

-- ============================================
-- Verification
-- ============================================
SELECT
  e.enumlabel as role_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- Show current profiles
SELECT id, email, role FROM profiles;
