-- ============================================
-- Migration: Ajouter colonne telephone à clients
-- Date: 2025-12-22
-- Description: Colonne telephone manquante pour les entreprises
-- ============================================

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS telephone TEXT;

-- Notification pour recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';
