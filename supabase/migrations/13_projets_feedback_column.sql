-- Migration: Ajouter la colonne feedback_envoye a la table projets
-- Date: 2025-12-19
-- Requis par: Workflow N8N supabase_feedback_post_projet.json

-- Ajouter feedback_envoye si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projets' AND column_name = 'feedback_envoye'
    ) THEN
        ALTER TABLE projets ADD COLUMN feedback_envoye BOOLEAN DEFAULT false;
        COMMENT ON COLUMN projets.feedback_envoye IS 'Indique si un email de feedback post-projet a ete envoye au client';
    END IF;
END $$;

-- Index pour les requetes du workflow feedback
CREATE INDEX IF NOT EXISTS idx_projets_feedback
ON projets(statut, feedback_envoye, date_fin_reelle)
WHERE statut = 'Terminé' AND feedback_envoye = false;
