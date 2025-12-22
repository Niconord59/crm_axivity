-- ============================================
-- Migration: Changer interactions.date en TIMESTAMPTZ
-- Date: 2025-12-22
-- Description: Permet de stocker l'heure des interactions
-- ============================================

-- Changer le type de la colonne date de DATE vers TIMESTAMPTZ
ALTER TABLE public.interactions
ALTER COLUMN date TYPE TIMESTAMPTZ
USING date::TIMESTAMPTZ;

-- Mettre à jour la valeur par défaut
ALTER TABLE public.interactions
ALTER COLUMN date SET DEFAULT NOW();

-- Notification pour recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';
