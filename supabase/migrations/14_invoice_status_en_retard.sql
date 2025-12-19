-- Migration: Ajouter le statut 'En retard' a l'enum invoice_status
-- Date: 2025-12-19
-- Requis par: Workflow N8N supabase_relances_factures.json (niveau N3)

-- Ajouter 'En retard' a l'enum invoice_status si pas deja present
DO $$
BEGIN
    -- Verifier si la valeur existe deja
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'En retard'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invoice_status')
    ) THEN
        ALTER TYPE invoice_status ADD VALUE 'En retard';
    END IF;
END $$;

COMMENT ON TYPE invoice_status IS 'Statuts possibles pour une facture: Brouillon, Envoyé, Payé, Annulé, En retard';
