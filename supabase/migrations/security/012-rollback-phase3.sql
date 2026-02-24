-- ============================================================================
-- ROLLBACK P1-01 Phase 3 : Restaurer changelog et feedback_client
-- ============================================================================

-- 1. Remettre les tables dans public
ALTER TABLE IF EXISTS private.changelog SET SCHEMA public;
ALTER TABLE IF EXISTS private.feedback_client SET SCHEMA public;

-- 2. Supprimer les fonctions RPC créées (plus nécessaires si tables dans public)
DROP FUNCTION IF EXISTS public.log_changelog(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.get_changelog(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.create_feedback(UUID, UUID, INTEGER, TEXT, TEXT);

DO $$
BEGIN
  RAISE NOTICE '=== ROLLBACK Phase 3 terminé : changelog et feedback_client dans public, fonctions RPC supprimées ===';
END;
$$;
