-- ============================================================================
-- P1-01 Phase 1 : Création du schéma privé + Migration des tables SYSTEM
-- ============================================================================
-- Tables déplacées : devis_compteur, factures_compteur, record_manager_v2, tabular_document_rows
-- Risque : FAIBLE - Aucune de ces tables n'est utilisée par le frontend ni N8N
-- Rollback : 010-rollback-phase1.sql
-- ============================================================================

-- 1. Créer le schéma privé (non exposé par PostgREST)
CREATE SCHEMA IF NOT EXISTS private;

-- Accorder les droits au service_role (pour les triggers et fonctions internes)
GRANT USAGE ON SCHEMA private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA private TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA private GRANT ALL ON TABLES TO service_role;

-- Le rôle postgres (owner) a déjà tous les droits
-- Le rôle authenticated n'a PAS accès au schéma private (c'est le but)
-- Le rôle anon n'a PAS accès au schéma private

COMMENT ON SCHEMA private IS 'Schéma non exposé par PostgREST. Tables internes, compteurs, et données système.';

-- ============================================================================
-- 2. Déplacer les tables SYSTEM vers le schéma privé
-- ============================================================================

-- 2.1 devis_compteur (utilisé uniquement par la fonction generer_numero_devis)
ALTER TABLE IF EXISTS public.devis_compteur SET SCHEMA private;

-- 2.2 factures_compteur (utilisé uniquement par la fonction generer_numero_facture)
ALTER TABLE IF EXISTS public.factures_compteur SET SCHEMA private;

-- 2.3 record_manager_v2 (table système interne, aucune référence)
ALTER TABLE IF EXISTS public.record_manager_v2 SET SCHEMA private;

-- 2.4 tabular_document_rows (données de documents internes, aucune référence)
ALTER TABLE IF EXISTS public.tabular_document_rows SET SCHEMA private;

-- ============================================================================
-- 3. Mettre à jour les fonctions qui référencent les tables déplacées
-- ============================================================================

-- 3.1 Recréer generer_numero_devis() avec référence qualifiée
CREATE OR REPLACE FUNCTION public.generer_numero_devis()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
  v_resultat TEXT;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Incrémenter le compteur pour l'année en cours (table privée)
  INSERT INTO private.devis_compteur (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = private.devis_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO v_numero;

  -- Formater : DEV-2026-001
  v_resultat := 'DEV-' || v_annee::TEXT || '-' || LPAD(v_numero::TEXT, 3, '0');

  RETURN v_resultat;
END;
$$;

-- 3.2 Recréer generer_numero_facture() avec référence qualifiée
CREATE OR REPLACE FUNCTION public.generer_numero_facture()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
  v_resultat TEXT;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Incrémenter le compteur pour l'année en cours (table privée)
  INSERT INTO private.factures_compteur (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = private.factures_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO v_numero;

  -- Formater : FAC-2026-001
  v_resultat := 'FAC-' || v_annee::TEXT || '-' || LPAD(v_numero::TEXT, 3, '0');

  RETURN v_resultat;
END;
$$;

-- Maintenir les permissions existantes
REVOKE ALL ON FUNCTION public.generer_numero_devis() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generer_numero_devis() FROM anon;
GRANT EXECUTE ON FUNCTION public.generer_numero_devis() TO authenticated;

REVOKE ALL ON FUNCTION public.generer_numero_facture() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generer_numero_facture() FROM anon;
GRANT EXECUTE ON FUNCTION public.generer_numero_facture() TO authenticated;

-- ============================================================================
-- 4. Vérification
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Vérifier que le schéma private existe
  SELECT COUNT(*) INTO v_count FROM information_schema.schemata WHERE schema_name = 'private';
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Le schéma private n''a pas été créé';
  END IF;

  -- Vérifier que les tables sont dans le schéma private
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'private'
    AND table_name IN ('devis_compteur', 'factures_compteur', 'record_manager_v2', 'tabular_document_rows');

  RAISE NOTICE '=== P1-01 Phase 1 : % tables déplacées vers private ===', v_count;

  -- Vérifier que les tables ne sont plus dans public
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('devis_compteur', 'factures_compteur', 'record_manager_v2', 'tabular_document_rows');

  IF v_count > 0 THEN
    RAISE WARNING '% tables sont encore dans public!', v_count;
  ELSE
    RAISE NOTICE 'Toutes les tables system sont dans private.';
  END IF;

  -- Tester que generer_numero_devis fonctionne encore
  -- (ne peut être testé qu'avec un rôle authentifié)
  RAISE NOTICE 'Fonctions de numérotation mises à jour avec private.devis_compteur et private.factures_compteur';
END;
$$;
