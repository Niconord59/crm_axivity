-- Migration: Enable Realtime for main tables
-- Date: 2026-01-16
-- Description: Active les publications Realtime pour les tables principales du CRM
--              Cela permet aux clients de s'abonner aux changements en temps réel

-- Note: Cette migration utilise DO $$ pour ignorer les erreurs si une table
-- est déjà dans la publication (idempotent)

DO $$
DECLARE
    tables_to_add TEXT[] := ARRAY['contacts', 'clients', 'opportunites', 'projets', 'taches', 'factures', 'interactions', 'devis', 'lignes_devis', 'equipe'];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY tables_to_add
    LOOP
        -- Vérifier si la table n'est pas déjà dans la publication
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
            RAISE NOTICE 'Added table % to supabase_realtime publication', tbl;
        ELSE
            RAISE NOTICE 'Table % is already in supabase_realtime publication', tbl;
        END IF;
    END LOOP;
END $$;

-- Afficher les tables actuellement dans la publication
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
