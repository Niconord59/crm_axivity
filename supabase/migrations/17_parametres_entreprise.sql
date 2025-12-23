-- Migration: Create parametres_entreprise table for company settings
-- Used for quote generation and company branding

-- Create the table (single row for company settings)
CREATE TABLE IF NOT EXISTS public.parametres_entreprise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Company identity
  nom TEXT NOT NULL DEFAULT 'Mon Entreprise',
  forme_juridique TEXT, -- SAS, SARL, etc.
  capital TEXT, -- "10 000 €"
  -- Legal identifiers
  siret TEXT,
  rcs TEXT, -- "RCS Paris 123 456 789"
  tva_intracommunautaire TEXT, -- "FR12345678900"
  -- Address
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'France',
  -- Contact
  telephone TEXT,
  email TEXT,
  site_web TEXT,
  -- Branding
  logo_url TEXT, -- URL to logo image
  header_devis_url TEXT, -- URL to quote header image
  couleur_principale TEXT DEFAULT '#2563eb', -- Primary brand color
  -- Quote settings
  conditions_paiement_defaut TEXT DEFAULT 'Paiement à 30 jours date de facture.',
  validite_devis_jours INTEGER DEFAULT 30,
  taux_tva_defaut DECIMAL(5,2) DEFAULT 20.00,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_parametres_entreprise_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_parametres_entreprise_updated_at ON public.parametres_entreprise;
CREATE TRIGGER trigger_parametres_entreprise_updated_at
  BEFORE UPDATE ON public.parametres_entreprise
  FOR EACH ROW
  EXECUTE FUNCTION update_parametres_entreprise_updated_at();

-- Insert default row if not exists
INSERT INTO public.parametres_entreprise (nom)
SELECT 'Mon Entreprise'
WHERE NOT EXISTS (SELECT 1 FROM public.parametres_entreprise);

-- RLS policies (admin only)
ALTER TABLE public.parametres_entreprise ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users (needed for quote generation)
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.parametres_entreprise;
CREATE POLICY "Allow read for authenticated users"
  ON public.parametres_entreprise
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert/update/delete for admin only
DROP POLICY IF EXISTS "Allow all for admin" ON public.parametres_entreprise;
CREATE POLICY "Allow all for admin"
  ON public.parametres_entreprise
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company-assets bucket
DROP POLICY IF EXISTS "Allow public read on company-assets" ON storage.objects;
CREATE POLICY "Allow public read on company-assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'company-assets');

DROP POLICY IF EXISTS "Allow admin upload on company-assets" ON storage.objects;
CREATE POLICY "Allow admin upload on company-assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin update on company-assets" ON storage.objects;
CREATE POLICY "Allow admin update on company-assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admin delete on company-assets" ON storage.objects;
CREATE POLICY "Allow admin delete on company-assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE public.parametres_entreprise IS 'Company settings for quote generation and branding';
