-- ============================================================================
-- ROLLBACK P1-01 Phase 1 : Restaurer les tables system dans public
-- ============================================================================

-- 1. Remettre les tables dans public
ALTER TABLE IF EXISTS private.devis_compteur SET SCHEMA public;
ALTER TABLE IF EXISTS private.factures_compteur SET SCHEMA public;
ALTER TABLE IF EXISTS private.record_manager_v2 SET SCHEMA public;
ALTER TABLE IF EXISTS private.tabular_document_rows SET SCHEMA public;

-- 2. Recréer generer_numero_devis() avec référence public (originale)
CREATE OR REPLACE FUNCTION public.generer_numero_devis()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
  v_resultat TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);

  INSERT INTO devis_compteur (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = devis_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO v_numero;

  v_resultat := 'DEV-' || v_annee::TEXT || '-' || LPAD(v_numero::TEXT, 3, '0');
  RETURN v_resultat;
END;
$$;

-- 3. Recréer generer_numero_facture() avec référence public (originale)
CREATE OR REPLACE FUNCTION public.generer_numero_facture()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_annee INTEGER;
  v_numero INTEGER;
  v_resultat TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  v_annee := EXTRACT(YEAR FROM CURRENT_DATE);

  INSERT INTO factures_compteur (annee, dernier_numero)
  VALUES (v_annee, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = factures_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO v_numero;

  v_resultat := 'FAC-' || v_annee::TEXT || '-' || LPAD(v_numero::TEXT, 3, '0');
  RETURN v_resultat;
END;
$$;

-- 4. Restaurer permissions
REVOKE ALL ON FUNCTION public.generer_numero_devis() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generer_numero_devis() FROM anon;
GRANT EXECUTE ON FUNCTION public.generer_numero_devis() TO authenticated;

REVOKE ALL ON FUNCTION public.generer_numero_facture() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generer_numero_facture() FROM anon;
GRANT EXECUTE ON FUNCTION public.generer_numero_facture() TO authenticated;

-- Note : Le schéma private est conservé (peut être supprimé manuellement si besoin)
-- DROP SCHEMA IF EXISTS private CASCADE;

RAISE NOTICE '=== ROLLBACK Phase 1 terminé ===';
