-- ============================================
-- Add linkedin column to contacts table
-- Migration: 10_contacts_linkedin_column.sql
-- Date: 2025-12-19
-- ============================================

-- Add linkedin URL column to contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS linkedin TEXT;

-- Add comment for documentation
COMMENT ON COLUMN contacts.linkedin IS 'LinkedIn profile URL of the contact';
