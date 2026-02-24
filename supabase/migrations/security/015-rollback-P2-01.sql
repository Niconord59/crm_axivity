-- ============================================================================
-- ROLLBACK P2-01 : Supprimer les fonctions de monitoring auth
-- ============================================================================

DROP FUNCTION IF EXISTS public.audit_auth_config();
DROP FUNCTION IF EXISTS public.get_recent_logins(INTEGER);

DO $$
BEGIN
  RAISE NOTICE '=== ROLLBACK P2-01 terminé : fonctions monitoring supprimées ===';
END;
$$;
