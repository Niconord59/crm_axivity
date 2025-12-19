-- ============================================
-- Update user_role enum to match application roles
-- Migration: 11_update_user_roles.sql
-- Date: 2025-12-19
--
-- Old roles: admin, manager, commercial, membre, client
-- New roles: admin, developpeur_nocode, developpeur_automatisme, commercial, client
--
-- Mapping:
--   admin → admin (unchanged)
--   manager → developpeur_nocode
--   commercial → commercial (unchanged, for future use)
--   membre → developpeur_automatisme
--   client → client (unchanged)
-- ============================================

-- Step 1: Create the new enum type
CREATE TYPE user_role_new AS ENUM ('admin', 'developpeur_nocode', 'developpeur_automatisme', 'commercial', 'client');

-- Step 2: Update profiles table to use text temporarily, migrate values, then use new enum
ALTER TABLE profiles
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE text USING role::text;

-- Step 3: Update existing role values
UPDATE profiles SET role = 'developpeur_nocode' WHERE role = 'manager';
UPDATE profiles SET role = 'developpeur_automatisme' WHERE role = 'membre';
-- Note: 'commercial' and 'admin' and 'client' remain unchanged

-- Step 4: Convert to new enum
ALTER TABLE profiles
  ALTER COLUMN role TYPE user_role_new USING role::user_role_new,
  ALTER COLUMN role SET DEFAULT 'developpeur_automatisme';

-- Step 5: Drop old enum and rename new one
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;

-- ============================================
-- Update RLS helper functions
-- ============================================

-- Update is_admin_or_manager to is_admin_or_dev (developpeur_nocode has manager permissions)
CREATE OR REPLACE FUNCTION auth.is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() IN ('admin', 'developpeur_nocode')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Update RLS policies for clients table
-- ============================================

-- Drop old commercial/membre policies
DROP POLICY IF EXISTS "clients_select_commercial" ON clients;
DROP POLICY IF EXISTS "clients_select_membre" ON clients;
DROP POLICY IF EXISTS "clients_crud_manager" ON clients;
DROP POLICY IF EXISTS "clients_insert_commercial" ON clients;
DROP POLICY IF EXISTS "clients_update_commercial" ON clients;

-- Create new policies for developpeur roles
-- developpeur_nocode gets full CRUD (like old manager + commercial)
CREATE POLICY "clients_all_developpeur_nocode"
  ON clients FOR ALL
  USING (auth.user_role() = 'developpeur_nocode');

-- developpeur_automatisme can read all clients
CREATE POLICY "clients_select_developpeur_automatisme"
  ON clients FOR SELECT
  USING (auth.user_role() = 'developpeur_automatisme');

-- ============================================
-- Update RLS policies for contacts table
-- ============================================

DROP POLICY IF EXISTS "contacts_select_commercial" ON contacts;
DROP POLICY IF EXISTS "contacts_select_membre" ON contacts;
DROP POLICY IF EXISTS "contacts_all_manager" ON contacts;
DROP POLICY IF EXISTS "contacts_crud_commercial" ON contacts;

-- developpeur_nocode gets full CRUD
CREATE POLICY "contacts_all_developpeur_nocode"
  ON contacts FOR ALL
  USING (auth.user_role() = 'developpeur_nocode');

-- developpeur_automatisme can read all
CREATE POLICY "contacts_select_developpeur_automatisme"
  ON contacts FOR SELECT
  USING (auth.user_role() = 'developpeur_automatisme');

-- ============================================
-- Update RLS policies for opportunites table
-- ============================================

DROP POLICY IF EXISTS "opportunites_select_commercial" ON opportunites;
DROP POLICY IF EXISTS "opportunites_select_membre" ON opportunites;
DROP POLICY IF EXISTS "opportunites_all_manager" ON opportunites;
DROP POLICY IF EXISTS "opportunites_crud_commercial" ON opportunites;

-- developpeur_nocode gets full CRUD
CREATE POLICY "opportunites_all_developpeur_nocode"
  ON opportunites FOR ALL
  USING (auth.user_role() = 'developpeur_nocode');

-- developpeur_automatisme can read all
CREATE POLICY "opportunites_select_developpeur_automatisme"
  ON opportunites FOR SELECT
  USING (auth.user_role() = 'developpeur_automatisme');

-- ============================================
-- Update RLS policies for projets table
-- ============================================

DROP POLICY IF EXISTS "projets_select_membre" ON projets;
DROP POLICY IF EXISTS "projets_select_commercial" ON projets;
DROP POLICY IF EXISTS "projets_all_manager" ON projets;

-- developpeur_nocode gets full CRUD
CREATE POLICY "projets_all_developpeur_nocode"
  ON projets FOR ALL
  USING (auth.user_role() = 'developpeur_nocode');

-- developpeur_automatisme can read projects where they have tasks or are chef
CREATE POLICY "projets_select_developpeur_automatisme"
  ON projets FOR SELECT
  USING (
    auth.user_role() = 'developpeur_automatisme' AND (
      chef_projet_id = auth.uid() OR
      id IN (SELECT projet_id FROM taches WHERE assignee_id = auth.uid())
    )
  );

-- ============================================
-- Update RLS policies for taches table
-- ============================================

DROP POLICY IF EXISTS "taches_select_membre" ON taches;
DROP POLICY IF EXISTS "taches_all_manager" ON taches;
DROP POLICY IF EXISTS "taches_update_membre" ON taches;

-- developpeur_nocode gets full CRUD
CREATE POLICY "taches_all_developpeur_nocode"
  ON taches FOR ALL
  USING (auth.user_role() = 'developpeur_nocode');

-- developpeur_automatisme can read their own tasks + project tasks
CREATE POLICY "taches_select_developpeur_automatisme"
  ON taches FOR SELECT
  USING (
    auth.user_role() = 'developpeur_automatisme' AND (
      assignee_id = auth.uid() OR
      projet_id IN (SELECT id FROM projets WHERE chef_projet_id = auth.uid())
    )
  );

-- developpeur_automatisme can update their own tasks
CREATE POLICY "taches_update_developpeur_automatisme"
  ON taches FOR UPDATE
  USING (auth.user_role() = 'developpeur_automatisme' AND assignee_id = auth.uid());

-- ============================================
-- Update RLS policies for factures table
-- ============================================

DROP POLICY IF EXISTS "factures_select_commercial" ON factures;
DROP POLICY IF EXISTS "factures_crud_manager" ON factures;

-- developpeur_nocode gets full CRUD
CREATE POLICY "factures_all_developpeur_nocode"
  ON factures FOR ALL
  USING (auth.user_role() = 'developpeur_nocode');

-- developpeur_automatisme can read factures
CREATE POLICY "factures_select_developpeur_automatisme"
  ON factures FOR SELECT
  USING (auth.user_role() = 'developpeur_automatisme');

-- ============================================
-- Update RLS policies for interactions table
-- ============================================

DROP POLICY IF EXISTS "interactions_insert" ON interactions;
DROP POLICY IF EXISTS "interactions_all_admin" ON interactions;

-- Admin and developpeur_nocode can do everything
CREATE POLICY "interactions_all_admin_dev"
  ON interactions FOR ALL
  USING (auth.user_role() IN ('admin', 'developpeur_nocode'));

-- developpeur_automatisme can create interactions
CREATE POLICY "interactions_insert_dev_auto"
  ON interactions FOR INSERT
  WITH CHECK (auth.user_role() = 'developpeur_automatisme');

-- ============================================
-- RLS policies for commercial role
-- Commercial can manage their own clients, contacts, opportunities
-- ============================================

-- Clients: commercial can see/manage their own clients
CREATE POLICY "clients_select_commercial"
  ON clients FOR SELECT
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

CREATE POLICY "clients_insert_commercial"
  ON clients FOR INSERT
  WITH CHECK (auth.user_role() = 'commercial');

CREATE POLICY "clients_update_commercial"
  ON clients FOR UPDATE
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

-- Contacts: commercial can see/manage contacts of their clients
CREATE POLICY "contacts_select_commercial"
  ON contacts FOR SELECT
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

CREATE POLICY "contacts_crud_commercial"
  ON contacts FOR ALL
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

-- Opportunites: commercial can manage their own opportunities
CREATE POLICY "opportunites_select_commercial"
  ON opportunites FOR SELECT
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

CREATE POLICY "opportunites_crud_commercial"
  ON opportunites FOR ALL
  USING (auth.user_role() = 'commercial' AND owner_id = auth.uid());

-- Projets: commercial can view all projects (read-only)
CREATE POLICY "projets_select_commercial"
  ON projets FOR SELECT
  USING (auth.user_role() = 'commercial');

-- Factures: commercial can view invoices (read-only)
CREATE POLICY "factures_select_commercial"
  ON factures FOR SELECT
  USING (auth.user_role() = 'commercial');

-- Interactions: commercial can create interactions
CREATE POLICY "interactions_insert_commercial"
  ON interactions FOR INSERT
  WITH CHECK (auth.user_role() = 'commercial');

-- ============================================
-- Done! Summary of new role permissions:
--
-- admin: Full access to everything
-- developpeur_nocode: Full CRUD on all business entities
-- developpeur_automatisme: Read access + can update own tasks/interactions
-- commercial: Manage own clients/contacts/opportunities, read projects/factures
-- client: Portal access only (their own projects/factures)
-- ============================================
