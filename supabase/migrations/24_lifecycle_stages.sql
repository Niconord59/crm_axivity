-- ============================================
-- Migration: Lifecycle Stages & N:N Contact-Opportunite
-- Date: 2026-01-28
-- Description: Implements HubSpot-inspired lifecycle model
--   - Adds lifecycle_stage enum to contacts
--   - Creates opportunite_contacts pivot table for N:N relationships
--   - Migrates existing data
-- Spec: docs/specs/009-lifecycle-model/spec.md
--
-- NOTE: Spec defined role as TEXT with CHECK constraint, but we use ENUM
-- for better type safety and consistency with other enums in this codebase.
-- ============================================

-- ============================================
-- ROLLBACK SCRIPT (run manually if needed)
-- ============================================
-- DROP TRIGGER IF EXISTS trg_lifecycle_stage_changed ON contacts;
-- DROP TRIGGER IF EXISTS trg_opportunite_contacts_updated_at ON opportunite_contacts;
-- DROP FUNCTION IF EXISTS update_lifecycle_stage_changed_at();
-- DROP FUNCTION IF EXISTS update_opportunite_contacts_updated_at();
-- DROP TABLE IF EXISTS opportunite_contacts;
-- ALTER TABLE contacts DROP COLUMN IF EXISTS lifecycle_stage_changed_at;
-- ALTER TABLE contacts DROP COLUMN IF EXISTS lifecycle_stage;
-- DROP TYPE IF EXISTS contact_role_enum;
-- DROP TYPE IF EXISTS lifecycle_stage_enum;
-- ============================================

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

-- Lifecycle stages for contacts (HubSpot-inspired)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lifecycle_stage_enum') THEN
        CREATE TYPE lifecycle_stage_enum AS ENUM (
            'Lead',
            'MQL',
            'SQL',
            'Opportunity',
            'Customer',
            'Evangelist',
            'Churned'
        );
        RAISE NOTICE 'Created enum lifecycle_stage_enum';
    ELSE
        RAISE NOTICE 'Enum lifecycle_stage_enum already exists';
    END IF;
END $$;

-- Contact roles in an opportunity
-- NOTE: Using ENUM instead of TEXT with CHECK (deviation from spec) for type safety
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_role_enum') THEN
        CREATE TYPE contact_role_enum AS ENUM (
            'Decideur',
            'Influenceur',
            'Utilisateur',
            'Participant'
        );
        RAISE NOTICE 'Created enum contact_role_enum';
    ELSE
        RAISE NOTICE 'Enum contact_role_enum already exists';
    END IF;
END $$;

-- ============================================
-- 2. ADD COLUMNS TO CONTACTS
-- ============================================

-- Add lifecycle_stage column
-- [F3 FIX] Added table_schema = 'public' filter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contacts'
          AND column_name = 'lifecycle_stage'
    ) THEN
        ALTER TABLE contacts
        ADD COLUMN lifecycle_stage lifecycle_stage_enum DEFAULT 'Lead';
        RAISE NOTICE 'Added column lifecycle_stage to contacts';
    ELSE
        RAISE NOTICE 'Column lifecycle_stage already exists on contacts';
    END IF;
END $$;

-- Add lifecycle_stage_changed_at column
-- [F3 FIX] Added table_schema = 'public' filter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contacts'
          AND column_name = 'lifecycle_stage_changed_at'
    ) THEN
        ALTER TABLE contacts
        ADD COLUMN lifecycle_stage_changed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added column lifecycle_stage_changed_at to contacts';
    ELSE
        RAISE NOTICE 'Column lifecycle_stage_changed_at already exists on contacts';
    END IF;
END $$;

-- [F10 FIX] Set lifecycle_stage_changed_at to created_at for existing contacts
-- This preserves historical data integrity instead of setting all to NOW()
UPDATE contacts
SET lifecycle_stage_changed_at = created_at
WHERE lifecycle_stage_changed_at IS NULL;

-- ============================================
-- 3. CREATE PIVOT TABLE opportunite_contacts
-- ============================================

-- [F7 FIX] Added NOT NULL constraint on role column
CREATE TABLE IF NOT EXISTS opportunite_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunite_id UUID NOT NULL REFERENCES opportunites(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    role contact_role_enum NOT NULL DEFAULT 'Participant',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(opportunite_id, contact_id)
);

-- [F6 FIX] Enforce single primary contact per opportunity at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunite_contacts_single_primary
ON opportunite_contacts(opportunite_id) WHERE is_primary = true;

-- ============================================
-- 4. ENABLE RLS ON NEW TABLE
-- ============================================

-- [F1 FIX] Enable Row Level Security
ALTER TABLE opportunite_contacts ENABLE ROW LEVEL SECURITY;

-- [F1 FIX] RLS Policies for opportunite_contacts
-- Roles: admin, developpeur_nocode, developpeur_automatisme, commercial, client

-- Admin: Full access
DROP POLICY IF EXISTS "Admin full access on opportunite_contacts" ON opportunite_contacts;
CREATE POLICY "Admin full access on opportunite_contacts"
ON opportunite_contacts FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Commercial: Full access to opportunities they own
DROP POLICY IF EXISTS "Commercial access on opportunite_contacts" ON opportunite_contacts;
CREATE POLICY "Commercial access on opportunite_contacts"
ON opportunite_contacts FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN opportunites o ON o.id = opportunite_contacts.opportunite_id
        WHERE p.id = auth.uid()
        AND p.role = 'commercial'
        AND o.owner_id = auth.uid()
    )
);

-- Developpeur NoCode: Read access (for project context)
DROP POLICY IF EXISTS "Developpeur nocode read on opportunite_contacts" ON opportunite_contacts;
CREATE POLICY "Developpeur nocode read on opportunite_contacts"
ON opportunite_contacts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'developpeur_nocode'
    )
);

-- Developpeur Automatisme: Read access (for project context)
DROP POLICY IF EXISTS "Developpeur automatisme read on opportunite_contacts" ON opportunite_contacts;
CREATE POLICY "Developpeur automatisme read on opportunite_contacts"
ON opportunite_contacts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'developpeur_automatisme'
    )
);

-- Client: Read access to own opportunities only (via client portal)
DROP POLICY IF EXISTS "Client read on opportunite_contacts" ON opportunite_contacts;
CREATE POLICY "Client read on opportunite_contacts"
ON opportunite_contacts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN opportunites o ON o.id = opportunite_contacts.opportunite_id
        JOIN clients c ON c.id = o.client_id
        WHERE p.id = auth.uid()
        AND p.role = 'client'
        AND p.client_id = c.id
    )
);

-- ============================================
-- 5. MIGRATE EXISTING DATA
-- ============================================

-- 5.1 Map statut_prospection to lifecycle_stage
-- [F4 FIX] Only update contacts that haven't been manually set
-- We check if lifecycle_stage was just set by this migration (equals DEFAULT 'Lead')
-- AND lifecycle_stage_changed_at equals created_at (never manually changed)
UPDATE contacts
SET lifecycle_stage = CASE
    WHEN statut_prospection = 'Qualifié' THEN 'Opportunity'::lifecycle_stage_enum
    WHEN statut_prospection IN ('À appeler', 'Appelé - pas répondu', 'Rappeler', 'RDV planifié', 'RDV effectué') THEN 'SQL'::lifecycle_stage_enum
    WHEN statut_prospection IN ('Non qualifié', 'Perdu') THEN 'Lead'::lifecycle_stage_enum
    ELSE 'Lead'::lifecycle_stage_enum
END,
lifecycle_stage_changed_at = created_at
WHERE lifecycle_stage = 'Lead'
  AND lifecycle_stage_changed_at = created_at;

-- 5.2 Migrate existing contact_id links to pivot table
-- Only insert if not already present (idempotent)
INSERT INTO opportunite_contacts (opportunite_id, contact_id, role, is_primary)
SELECT id, contact_id, 'Decideur'::contact_role_enum, true
FROM opportunites
WHERE contact_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM opportunite_contacts oc
    WHERE oc.opportunite_id = opportunites.id
      AND oc.contact_id = opportunites.contact_id
  );

-- ============================================
-- 6. CREATE INDEXES
-- ============================================

-- Index on opportunite_contacts for lookups by opportunite
CREATE INDEX IF NOT EXISTS idx_opportunite_contacts_opportunite
ON opportunite_contacts(opportunite_id);

-- Index on opportunite_contacts for lookups by contact
CREATE INDEX IF NOT EXISTS idx_opportunite_contacts_contact
ON opportunite_contacts(contact_id);

-- Index on contacts lifecycle_stage for filtering
CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle_stage
ON contacts(lifecycle_stage);

-- [F5 FIX] Index on is_primary for finding primary contacts quickly
CREATE INDEX IF NOT EXISTS idx_opportunite_contacts_is_primary
ON opportunite_contacts(opportunite_id, is_primary) WHERE is_primary = true;

-- ============================================
-- 7. CREATE TRIGGERS
-- ============================================

-- [F12 FIX] Explicit SECURITY INVOKER for trigger function
CREATE OR REPLACE FUNCTION update_lifecycle_stage_changed_at()
RETURNS TRIGGER
SECURITY INVOKER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.lifecycle_stage IS DISTINCT FROM NEW.lifecycle_stage THEN
        NEW.lifecycle_stage_changed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

-- Drop trigger if exists to make migration idempotent
DROP TRIGGER IF EXISTS trg_lifecycle_stage_changed ON contacts;

-- Create trigger for lifecycle_stage changes
CREATE TRIGGER trg_lifecycle_stage_changed
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_lifecycle_stage_changed_at();

-- [F2 FIX] Create updated_at trigger for opportunite_contacts
CREATE OR REPLACE FUNCTION update_opportunite_contacts_updated_at()
RETURNS TRIGGER
SECURITY INVOKER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunite_contacts_updated_at ON opportunite_contacts;

CREATE TRIGGER trg_opportunite_contacts_updated_at
BEFORE UPDATE ON opportunite_contacts
FOR EACH ROW
EXECUTE FUNCTION update_opportunite_contacts_updated_at();

-- ============================================
-- 8. ENABLE REALTIME ON NEW TABLE
-- ============================================

-- [F9 FIX] Added schemaname filter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'opportunite_contacts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE opportunite_contacts;
        RAISE NOTICE 'Added opportunite_contacts to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'Table opportunite_contacts already in supabase_realtime publication';
    END IF;
END $$;

-- ============================================
-- 9. POST-MIGRATION VERIFICATION
-- ============================================
-- [F13 FIX] Verification queries are now active RAISE statements

DO $$
DECLARE
    contact_count INTEGER;
    pivot_count INTEGER;
    opp_with_contact INTEGER;
BEGIN
    -- Count contacts by lifecycle_stage
    SELECT COUNT(*) INTO contact_count FROM contacts;
    RAISE NOTICE 'Total contacts: %', contact_count;

    -- Count entries in pivot table
    SELECT COUNT(*) INTO pivot_count FROM opportunite_contacts;
    RAISE NOTICE 'Entries in opportunite_contacts: %', pivot_count;

    -- Count opportunities that had contact_id
    SELECT COUNT(*) INTO opp_with_contact FROM opportunites WHERE contact_id IS NOT NULL;
    RAISE NOTICE 'Opportunities with contact_id: %', opp_with_contact;

    -- Verify all migrated
    IF pivot_count < opp_with_contact THEN
        RAISE WARNING 'Not all opportunities were migrated to pivot table! Expected %, got %', opp_with_contact, pivot_count;
    ELSE
        RAISE NOTICE 'Migration verification passed: all opportunities with contacts migrated';
    END IF;
END $$;
