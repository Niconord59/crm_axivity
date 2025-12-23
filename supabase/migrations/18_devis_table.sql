-- ============================================
-- Migration: Table des devis générés
-- Date: 2025-12-23
-- Description: Historique des devis avec numérotation séquentielle et statuts
-- ============================================

-- Enum pour les statuts de devis
CREATE TYPE statut_devis AS ENUM (
  'brouillon',
  'envoye',
  'accepte',
  'refuse',
  'expire'
);

-- Table des devis
CREATE TABLE IF NOT EXISTS devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Numéro séquentiel unique (DEV-2025-001)
  numero_devis TEXT UNIQUE NOT NULL,

  -- Relations
  opportunite_id UUID REFERENCES opportunites(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Statut
  statut statut_devis NOT NULL DEFAULT 'brouillon',

  -- Dates
  date_devis DATE NOT NULL DEFAULT CURRENT_DATE,
  date_validite DATE NOT NULL,
  date_envoi TIMESTAMPTZ,
  date_reponse TIMESTAMPTZ,

  -- Montants (snapshot au moment de la génération)
  total_ht NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tva NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(12, 2) NOT NULL DEFAULT 0,
  taux_tva NUMERIC(5, 2) NOT NULL DEFAULT 20.00,

  -- Conditions
  conditions_paiement TEXT,
  notes TEXT,

  -- PDF stocké
  pdf_url TEXT,
  pdf_filename TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour le compteur de numérotation par année
CREATE TABLE IF NOT EXISTS devis_compteur (
  annee INTEGER PRIMARY KEY,
  dernier_numero INTEGER NOT NULL DEFAULT 0
);

-- Fonction pour générer le prochain numéro de devis
CREATE OR REPLACE FUNCTION generer_numero_devis()
RETURNS TEXT AS $$
DECLARE
  annee_courante INTEGER;
  prochain_numero INTEGER;
  numero_formate TEXT;
BEGIN
  annee_courante := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Insérer ou mettre à jour le compteur pour l'année courante
  INSERT INTO devis_compteur (annee, dernier_numero)
  VALUES (annee_courante, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = devis_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO prochain_numero;

  -- Formater le numéro: DEV-2025-001
  numero_formate := 'DEV-' || annee_courante || '-' || LPAD(prochain_numero::TEXT, 3, '0');

  RETURN numero_formate;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour updated_at (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_devis_updated_at
  BEFORE UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour les recherches
CREATE INDEX idx_devis_opportunite ON devis(opportunite_id);
CREATE INDEX idx_devis_client ON devis(client_id);
CREATE INDEX idx_devis_statut ON devis(statut);
CREATE INDEX idx_devis_date ON devis(date_devis DESC);
CREATE INDEX idx_devis_numero ON devis(numero_devis);

-- RLS Policies
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis_compteur ENABLE ROW LEVEL SECURITY;

-- Politique: tous les utilisateurs authentifiés peuvent lire les devis
CREATE POLICY "Users can view all devis"
  ON devis FOR SELECT
  TO authenticated
  USING (true);

-- Politique: tous les utilisateurs authentifiés peuvent créer des devis
CREATE POLICY "Users can create devis"
  ON devis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique: tous les utilisateurs authentifiés peuvent modifier les devis
CREATE POLICY "Users can update devis"
  ON devis FOR UPDATE
  TO authenticated
  USING (true);

-- Politique: seuls les admins peuvent supprimer les devis
CREATE POLICY "Only admins can delete devis"
  ON devis FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique pour le compteur (lecture pour génération de numéro)
CREATE POLICY "Users can read devis_compteur"
  ON devis_compteur FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update devis_compteur"
  ON devis_compteur FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can modify devis_compteur"
  ON devis_compteur FOR UPDATE
  TO authenticated
  USING (true);

-- Storage bucket pour les PDFs de devis
INSERT INTO storage.buckets (id, name, public)
VALUES ('devis-pdf', 'devis-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- Politique storage: lecture publique
CREATE POLICY "Public devis PDF read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'devis-pdf');

-- Politique storage: upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload devis PDF"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'devis-pdf');

-- Politique storage: delete pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete devis PDF"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'devis-pdf');

-- Commentaires
COMMENT ON TABLE devis IS 'Historique des devis générés avec numérotation séquentielle';
COMMENT ON TABLE devis_compteur IS 'Compteur pour la numérotation séquentielle des devis par année';
COMMENT ON FUNCTION generer_numero_devis() IS 'Génère le prochain numéro de devis au format DEV-YYYY-NNN';
