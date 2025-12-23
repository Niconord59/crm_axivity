-- ============================================
-- Migration: Numérotation séquentielle des factures + Lien devis → facture
-- Date: 2025-12-23
-- Description: Ajoute compteur séquentiel pour factures FAC-YYYY-NNN
--              et colonnes pour lier devis à factures
-- ============================================

-- Table pour le compteur de numérotation des factures par année
CREATE TABLE IF NOT EXISTS factures_compteur (
  annee INTEGER PRIMARY KEY,
  dernier_numero INTEGER NOT NULL DEFAULT 0
);

-- Fonction pour générer le prochain numéro de facture
CREATE OR REPLACE FUNCTION generer_numero_facture()
RETURNS TEXT AS $$
DECLARE
  annee_courante INTEGER;
  prochain_numero INTEGER;
  numero_formate TEXT;
BEGIN
  annee_courante := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Insérer ou mettre à jour le compteur pour l'année courante
  INSERT INTO factures_compteur (annee, dernier_numero)
  VALUES (annee_courante, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = factures_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO prochain_numero;

  -- Formater le numéro: FAC-2025-001
  numero_formate := 'FAC-' || annee_courante || '-' || LPAD(prochain_numero::TEXT, 3, '0');

  RETURN numero_formate;
END;
$$ LANGUAGE plpgsql;

-- Ajouter colonnes pour lier devis à facture
ALTER TABLE devis ADD COLUMN IF NOT EXISTS facture_id UUID REFERENCES factures(id) ON DELETE SET NULL;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS date_conversion TIMESTAMPTZ;

-- Ajouter colonne devis_id dans factures pour traçabilité
ALTER TABLE factures ADD COLUMN IF NOT EXISTS devis_id UUID REFERENCES devis(id) ON DELETE SET NULL;

-- Ajouter colonnes PDF pour factures
ALTER TABLE factures ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS pdf_filename TEXT;

-- Ajouter colonnes contact et taux_tva pour factures
ALTER TABLE factures ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(5, 2) DEFAULT 20.00;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS conditions_paiement TEXT;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS objet TEXT;

-- RLS Policies pour factures_compteur
ALTER TABLE factures_compteur ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read factures_compteur"
  ON factures_compteur FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert factures_compteur"
  ON factures_compteur FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update factures_compteur"
  ON factures_compteur FOR UPDATE
  TO authenticated
  USING (true);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_devis_facture ON devis(facture_id);
CREATE INDEX IF NOT EXISTS idx_factures_devis ON factures(devis_id);

-- Storage bucket pour les PDFs de factures
INSERT INTO storage.buckets (id, name, public)
VALUES ('factures-pdf', 'factures-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- Politique storage: lecture publique
CREATE POLICY "Public factures PDF read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'factures-pdf');

-- Politique storage: upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload factures PDF"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'factures-pdf');

-- Politique storage: delete pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete factures PDF"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'factures-pdf');

-- Commentaires
COMMENT ON TABLE factures_compteur IS 'Compteur pour la numérotation séquentielle des factures par année';
COMMENT ON FUNCTION generer_numero_facture() IS 'Génère le prochain numéro de facture au format FAC-YYYY-NNN';
