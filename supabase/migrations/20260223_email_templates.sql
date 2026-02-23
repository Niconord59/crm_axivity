-- Migration: Create email_templates table for CRM email feature
-- Date: 2026-02-23

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  objet TEXT NOT NULL,
  contenu TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_email_templates_created_by ON email_templates(created_by);
CREATE INDEX idx_email_templates_nom ON email_templates(nom);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (true);
