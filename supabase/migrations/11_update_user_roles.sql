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
--
-- Permissions:
--   admin: Full access
--   developpeur_nocode: Read + update own tasks (same as automatisme)
--   developpeur_automatisme: Read + update own tasks
--   commercial: Manage own clients/contacts/opportunities
--   client: Portal access only
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

-- Helper: check if user is a developer (nocode or automatisme)
CREATE OR REPLACE FUNCTION auth.is_developer()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() IN ('developpeur_nocode', 'developpeur_automatisme')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update is_admin_or_manager to only check admin (developers don't have manager powers)
CREATE OR REPLACE FUNCTION auth.is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Update RLS policies for clients table
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "clients_select_commercial" ON clients;
DROP POLICY IF EXISTS "clients_select_membre" ON clients;
DROP POLICY IF EXISTS "clients_crud_manager" ON clients;
DROP POLICY IF EXISTS "clients_insert_commercial" ON clients;
DROP POLICY IF EXISTS "clients_update_commercial" ON clients;

-- Developers (nocode + automatisme) can read all clients
CREATE POLICY "clients_select_developers"
  ON clients FOR SELECT
  USING (auth.is_developer());

-- ============================================
-- Update RLS policies for contacts table
-- ============================================

DROP POLICY IF EXISTS "contacts_select_commercial" ON contacts;
DROP POLICY IF EXISTS "contacts_select_membre" ON contacts;
DROP POLICY IF EXISTS "contacts_all_manager" ON contacts;
DROP POLICY IF EXISTS "contacts_crud_commercial" ON contacts;

-- Developers can read all contacts
CREATE POLICY "contacts_select_developers"
  ON contacts FOR SELECT
  USING (auth.is_developer());

-- ============================================
-- Update RLS policies for opportunites table
-- ============================================

DROP POLICY IF EXISTS "opportunites_select_commercial" ON opportunites;
DROP POLICY IF EXISTS "opportunites_select_membre" ON opportunites;
DROP POLICY IF EXISTS "opportunites_all_manager" ON opportunites;
DROP POLICY IF EXISTS "opportunites_crud_commercial" ON opportunites;

-- Developers can read all opportunities
CREATE POLICY "opportunites_select_developers"
  ON opportunites FOR SELECT
  USING (auth.is_developer());

-- ============================================
-- Update RLS policies for projets table
-- ============================================

DROP POLICY IF EXISTS "projets_select_membre" ON projets;
DROP POLICY IF EXISTS "projets_select_commercial" ON projets;
DROP POLICY IF EXISTS "projets_all_manager" ON projets;

-- Developers can read projects where they have tasks or are chef
CREATE POLICY "projets_select_developers"
  ON projets FOR SELECT
  USING (
    auth.is_developer() AND (
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

-- Developers can read their own tasks + project tasks where they are chef
CREATE POLICY "taches_select_developers"
  ON taches FOR SELECT
  USING (
    auth.is_developer() AND (
      assignee_id = auth.uid() OR
      projet_id IN (SELECT id FROM projets WHERE chef_projet_id = auth.uid())
    )
  );

-- Developers can update their own tasks
CREATE POLICY "taches_update_developers"
  ON taches FOR UPDATE
  USING (auth.is_developer() AND assignee_id = auth.uid());

-- ============================================
-- Update RLS policies for factures table
-- ============================================

DROP POLICY IF EXISTS "factures_select_commercial" ON factures;
DROP POLICY IF EXISTS "factures_crud_manager" ON factures;

-- Developers can read all factures
CREATE POLICY "factures_select_developers"
  ON factures FOR SELECT
  USING (auth.is_developer());

-- ============================================
-- Update RLS policies for interactions table
-- ============================================

DROP POLICY IF EXISTS "interactions_insert" ON interactions;
DROP POLICY IF EXISTS "interactions_all_admin" ON interactions;

-- Developers can create interactions
CREATE POLICY "interactions_insert_developers"
  ON interactions FOR INSERT
  WITH CHECK (auth.is_developer());

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
-- developpeur_nocode: Read access + update own tasks (team member)
-- developpeur_automatisme: Read access + update own tasks (team member)
-- commercial: Manage own clients/contacts/opportunities, read projects/factures
-- client: Portal access only (their own projects/factures)
-- ============================================
