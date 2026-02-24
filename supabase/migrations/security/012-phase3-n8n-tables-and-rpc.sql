-- ============================================================================
-- P1-01 Phase 3 : Migration des tables N8N-dépendantes + Fonctions RPC
-- ============================================================================
-- Tables déplacées (2) : changelog, feedback_client
-- Impact N8N : Le workflow supabase_conversion_opportunite_projet.json
--   utilise changelog pour logger les conversions. Il doit passer par RPC.
-- Rollback : 012-rollback-phase3.sql
-- ============================================================================

-- Vérifier les prérequis
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'private') THEN
    RAISE EXCEPTION 'Le schéma private n''existe pas. Exécuter les phases 1 et 2 d''abord.';
  END IF;
END;
$$;

-- ============================================================================
-- 1. Déplacer les tables vers private
-- ============================================================================

-- 1.1 changelog (utilisé par N8N conversion workflow)
ALTER TABLE IF EXISTS public.changelog SET SCHEMA private;

-- 1.2 feedback_client (utilisé par N8N feedback workflow indirectement)
ALTER TABLE IF EXISTS public.feedback_client SET SCHEMA private;

-- Accorder les droits
GRANT ALL ON ALL TABLES IN SCHEMA private TO service_role;

-- ============================================================================
-- 2. Fonctions RPC pour N8N (remplacent l'accès direct aux tables)
-- ============================================================================

-- 2.1 RPC pour logger dans changelog (N8N conversion workflow)
-- N8N appelle : supabase.rpc('log_changelog', { ... })
CREATE OR REPLACE FUNCTION public.log_changelog(
  p_description TEXT,
  p_type TEXT DEFAULT 'Improvement',
  p_auteur_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  v_id UUID;
  v_type private.changelog_type;
BEGIN
  -- Valider le type (utilise l'enum existant)
  BEGIN
    v_type := p_type::private.changelog_type;
  EXCEPTION WHEN invalid_text_representation THEN
    v_type := 'Improvement'::private.changelog_type;
  END;

  INSERT INTO private.changelog (description, type, auteur_id)
  VALUES (p_description, v_type, p_auteur_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Droits : service_role (N8N) + authenticated (utilisateurs CRM)
REVOKE ALL ON FUNCTION public.log_changelog(TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_changelog(TEXT, TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.log_changelog(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_changelog(TEXT, TEXT, UUID) TO service_role;

COMMENT ON FUNCTION public.log_changelog IS 'Insère une entrée dans le changelog (table privée). Utilisé par N8N et le frontend.';

-- 2.2 RPC pour lire le changelog (si le frontend veut l'afficher un jour)
CREATE OR REPLACE FUNCTION public.get_changelog(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  description TEXT,
  type TEXT,
  created_at TIMESTAMPTZ,
  auteur_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.description, c.type::TEXT, c.created_at, c.auteur_id
  FROM private.changelog c
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_changelog(INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_changelog(INTEGER, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_changelog(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_changelog(INTEGER, INTEGER) TO service_role;

COMMENT ON FUNCTION public.get_changelog IS 'Lecture paginée du changelog (table privée). SECURITY DEFINER.';

-- 2.3 RPC pour créer un feedback client (si N8N ou le frontend en a besoin)
CREATE OR REPLACE FUNCTION public.create_feedback(
  p_projet_id UUID,
  p_client_id UUID,
  p_note INTEGER DEFAULT NULL,
  p_commentaire TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'Post-Projet'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validation basique
  IF p_note IS NOT NULL AND (p_note < 1 OR p_note > 5) THEN
    RAISE EXCEPTION 'La note doit être entre 1 et 5';
  END IF;

  INSERT INTO private.feedback_client (projet_id, client_id, note, commentaire, type)
  VALUES (p_projet_id, p_client_id, p_note, p_commentaire, p_type)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_feedback(UUID, UUID, INTEGER, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_feedback(UUID, UUID, INTEGER, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_feedback(UUID, UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_feedback(UUID, UUID, INTEGER, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.create_feedback IS 'Crée un feedback client (table privée). Utilisé par N8N feedback workflow.';

-- ============================================================================
-- 3. Vérification
-- ============================================================================

DO $$
DECLARE
  v_count_private INTEGER;
  v_count_public INTEGER;
  v_total_private INTEGER;
  v_total_public INTEGER;
BEGIN
  -- Vérifier changelog et feedback_client
  SELECT COUNT(*) INTO v_count_private
  FROM information_schema.tables
  WHERE table_schema = 'private'
    AND table_name IN ('changelog', 'feedback_client');

  SELECT COUNT(*) INTO v_count_public
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('changelog', 'feedback_client');

  RAISE NOTICE '=== P1-01 Phase 3 : % tables N8N déplacées, % restent dans public ===',
    v_count_private, v_count_public;

  -- Total final
  SELECT COUNT(*) INTO v_total_private
  FROM information_schema.tables WHERE table_schema = 'private';

  SELECT COUNT(*) INTO v_total_public
  FROM information_schema.tables WHERE table_schema = 'public';

  RAISE NOTICE '=== BILAN FINAL P1-01 ===';
  RAISE NOTICE 'Tables dans public : % (exposées via API)', v_total_public;
  RAISE NOTICE 'Tables dans private : % (protégées)', v_total_private;
  RAISE NOTICE 'Fonctions RPC créées : log_changelog, get_changelog, create_feedback';
END;
$$;
