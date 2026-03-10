-- Migration: Ajouter le champ linkedin_page pour les entreprises
-- Date: 2026-01-16
-- Description: Permet de stocker l'URL de la page LinkedIn de l'entreprise

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS linkedin_page TEXT;

COMMENT ON COLUMN clients.linkedin_page IS 'URL de la page LinkedIn de l''entreprise';
