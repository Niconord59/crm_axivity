-- ============================================
-- QUICK FIX - Désactiver RLS pour développement
-- Exécuter ce script SI vous avez des erreurs 500
-- CRM Axivity - Supabase
-- ============================================

-- Désactiver RLS sur toutes les tables principales
ALTER TABLE IF EXISTS clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS taches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS factures DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS opportunites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS journal_temps DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS catalogue_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lignes_devis DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS modeles_taches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback_client DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partenaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS connaissances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accomplissements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS objectifs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resultats_cles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS changelog DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS demandes_evolution DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scenarios_previsionnels DISABLE ROW LEVEL SECURITY;

-- Ajouter colonnes manquantes
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS date_rdv_prevu DATE;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS objet TEXT;
ALTER TABLE taches ADD COLUMN IF NOT EXISTS date_terminee DATE;

-- Créer table équipe si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  email TEXT,
  role TEXT,
  capacite_hebdo DECIMAL(5,2) DEFAULT 35,
  charge_prevue_semaine DECIMAL(5,2) DEFAULT 0,
  capacite_atteinte DECIMAL(5,2) DEFAULT 0,
  profile_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS equipe DISABLE ROW LEVEL SECURITY;

-- Données test équipe (ignore si déjà existantes)
INSERT INTO equipe (nom, email, role)
SELECT 'Marie Dupont', 'marie@axivity.fr', 'Direction'
WHERE NOT EXISTS (SELECT 1 FROM equipe WHERE email = 'marie@axivity.fr');

INSERT INTO equipe (nom, email, role)
SELECT 'Jean Martin', 'jean@axivity.fr', 'Chef de Projet'
WHERE NOT EXISTS (SELECT 1 FROM equipe WHERE email = 'jean@axivity.fr');

INSERT INTO equipe (nom, email, role)
SELECT 'Sophie Bernard', 'sophie@axivity.fr', 'Développeur'
WHERE NOT EXISTS (SELECT 1 FROM equipe WHERE email = 'sophie@axivity.fr');
