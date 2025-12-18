-- Migration: Ajouter les colonnes de relance à la table factures
-- Date: 2025-12-18

-- Ajouter niveau_relance si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'factures' AND column_name = 'niveau_relance'
    ) THEN
        ALTER TABLE factures ADD COLUMN niveau_relance INTEGER DEFAULT 0;
        COMMENT ON COLUMN factures.niveau_relance IS 'Niveau de relance calculé (0=pas en retard, 1=N1, 2=N2, 3=N3)';
    END IF;
END $$;

-- Ajouter niveau_relance_envoye si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'factures' AND column_name = 'niveau_relance_envoye'
    ) THEN
        ALTER TABLE factures ADD COLUMN niveau_relance_envoye INTEGER DEFAULT 0;
        COMMENT ON COLUMN factures.niveau_relance_envoye IS 'Dernier niveau de relance envoyé par email';
    END IF;
END $$;

-- Ajouter date_derniere_relance si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'factures' AND column_name = 'date_derniere_relance'
    ) THEN
        ALTER TABLE factures ADD COLUMN date_derniere_relance TIMESTAMPTZ;
        COMMENT ON COLUMN factures.date_derniere_relance IS 'Date du dernier email de relance envoyé';
    END IF;
END $$;

-- Index pour les requêtes de relance
CREATE INDEX IF NOT EXISTS idx_factures_relance
ON factures(statut, date_echeance)
WHERE statut = 'Envoyé';
