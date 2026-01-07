-- ============================================
-- Migration: Ajout colonne tour_completed à profiles
-- Permet de persister l'état du tour d'onboarding côté serveur
-- ============================================

-- Ajouter la colonne tour_completed
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT false;

-- Ajouter la colonne tour_skipped pour différencier skip vs complete
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tour_skipped BOOLEAN DEFAULT false;

-- Ajouter la version du tour vue (pour relancer sur nouvelles versions)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tour_version TEXT DEFAULT '';

-- Commentaires
COMMENT ON COLUMN profiles.tour_completed IS 'True si l''utilisateur a complété le tour d''onboarding';
COMMENT ON COLUMN profiles.tour_skipped IS 'True si l''utilisateur a sauté le tour';
COMMENT ON COLUMN profiles.tour_version IS 'Version du tour vue par l''utilisateur';
