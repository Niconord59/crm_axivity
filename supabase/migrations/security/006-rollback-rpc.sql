-- ============================================================================
-- 006-rollback-rpc.sql
-- ROLLBACK - Restaurer l'etat d'avant 006-secure-rpc-functions.sql
-- CRM Axivity - Remediation securite P0-03
-- ============================================================================
--
-- OBJECTIF : Revenir a l'etat initial si la remediation cause des problemes
-- QUAND    : Uniquement si le frontend ou les workflows sont casses apres 006
--
-- CE QUI EST RESTAURE :
--   1. EXECUTE accorde a PUBLIC (= anon peut executer a nouveau)
--   2. SECURITY DEFINER sur les 3 fonctions qui l'avaient
--   3. Corps original des fonctions (sans verification auth)
--
-- ⚠️ ATTENTION : Ce script RE-EXPOSE les fonctions a des appels anonymes.
--    Ne l'executez que si necessaire et reappliquez 006 apres correction.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1 : RESTAURER LES PRIVILEGES EXECUTE
-- ============================================================================

-- Restaurer EXECUTE a PUBLIC pour toutes les fonctions
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_opportunity_to_project(UUID, DATE) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_prospect_to_opportunity(UUID, TEXT, DECIMAL) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.generer_numero_devis() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.generer_numero_facture() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.unaccent(text) TO PUBLIC;

-- Surcharge unaccent si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'unaccent'
          AND pg_get_function_identity_arguments(p.oid) = 'regdictionary, text'
    ) THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.unaccent(regdictionary, text) TO PUBLIC';
    END IF;
END $$;

-- ============================================================================
-- PHASE 2 : RESTAURER SECURITY DEFINER
-- ============================================================================

ALTER FUNCTION public.get_dashboard_kpis() SECURITY DEFINER;

-- ============================================================================
-- PHASE 3 : RESTAURER LES CORPS ORIGINAUX DES FONCTIONS
-- ============================================================================

-- ---- convert_opportunity_to_project (original: SECURITY DEFINER, sans auth check) ----
CREATE OR REPLACE FUNCTION convert_opportunity_to_project(
  p_opportunity_id UUID,
  p_date_debut DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_opp RECORD;
  v_project_id UUID;
BEGIN
  -- Recuperer l'opportunite
  SELECT * INTO v_opp FROM opportunites WHERE id = p_opportunity_id;

  IF v_opp IS NULL THEN
    RAISE EXCEPTION 'Opportunite non trouvee';
  END IF;

  IF v_opp.statut != 'Gagné' THEN
    RAISE EXCEPTION 'L''opportunite doit etre en statut Gagne';
  END IF;

  IF v_opp.projet_id IS NOT NULL THEN
    RAISE EXCEPTION 'Un projet existe deja pour cette opportunite';
  END IF;

  -- Creer le projet
  INSERT INTO projets (
    nom,
    brief,
    client_id,
    statut,
    date_debut,
    budget_initial,
    notes
  ) VALUES (
    v_opp.nom,
    'Projet cree depuis opportunite: ' || v_opp.nom,
    v_opp.client_id,
    'Cadrage',
    p_date_debut,
    v_opp.valeur_estimee,
    v_opp.notes
  )
  RETURNING id INTO v_project_id;

  -- Lier le projet a l'opportunite
  UPDATE opportunites SET projet_id = v_project_id WHERE id = p_opportunity_id;

  -- Mettre a jour le statut du client
  UPDATE clients SET statut = 'Actif' WHERE id = v_opp.client_id AND statut = 'Prospect';

  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---- convert_prospect_to_opportunity (original: SECURITY DEFINER, sans auth check) ----
CREATE OR REPLACE FUNCTION convert_prospect_to_opportunity(
  p_contact_id UUID,
  p_nom TEXT,
  p_valeur_estimee DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_contact RECORD;
  v_opportunity_id UUID;
BEGIN
  -- Recuperer le contact
  SELECT * INTO v_contact FROM contacts WHERE id = p_contact_id;

  IF v_contact IS NULL THEN
    RAISE EXCEPTION 'Contact non trouve';
  END IF;

  IF v_contact.statut_prospection != 'Qualifié' THEN
    RAISE EXCEPTION 'Le prospect doit etre qualifie';
  END IF;

  -- Creer l'opportunite
  INSERT INTO opportunites (
    nom,
    client_id,
    contact_id,
    statut,
    valeur_estimee,
    notes,
    owner_id
  ) VALUES (
    p_nom,
    v_contact.client_id,
    p_contact_id,
    'Qualifié',
    p_valeur_estimee,
    v_contact.notes_prospection,
    v_contact.owner_id
  )
  RETURNING id INTO v_opportunity_id;

  RETURN v_opportunity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---- generer_numero_devis (original: sans auth check) ----
CREATE OR REPLACE FUNCTION generer_numero_devis()
RETURNS TEXT AS $$
DECLARE
  annee_courante INTEGER;
  prochain_numero INTEGER;
  numero_formate TEXT;
BEGIN
  annee_courante := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  INSERT INTO devis_compteur (annee, dernier_numero)
  VALUES (annee_courante, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = devis_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO prochain_numero;

  numero_formate := 'DEV-' || annee_courante || '-' || LPAD(prochain_numero::TEXT, 3, '0');

  RETURN numero_formate;
END;
$$ LANGUAGE plpgsql;

-- ---- generer_numero_facture (original: sans auth check) ----
CREATE OR REPLACE FUNCTION generer_numero_facture()
RETURNS TEXT AS $$
DECLARE
  annee_courante INTEGER;
  prochain_numero INTEGER;
  numero_formate TEXT;
BEGIN
  annee_courante := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  INSERT INTO factures_compteur (annee, dernier_numero)
  VALUES (annee_courante, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = factures_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO prochain_numero;

  numero_formate := 'FAC-' || annee_courante || '-' || LPAD(prochain_numero::TEXT, 3, '0');

  RETURN numero_formate;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 4 : VERIFICATION POST-ROLLBACK
-- ============================================================================

DO $$
DECLARE
    fn_name TEXT;
    fn_oid OID;
    anon_can_exec BOOLEAN;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'VERIFICATION POST-ROLLBACK P0-03';
    RAISE NOTICE '============================================';

    FOR fn_name, fn_oid IN
        SELECT p.proname, p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN (
            'get_dashboard_kpis',
            'convert_opportunity_to_project',
            'convert_prospect_to_opportunity',
            'generer_numero_devis',
            'generer_numero_facture'
          )
    LOOP
        anon_can_exec := has_function_privilege('anon', fn_oid, 'EXECUTE');

        IF anon_can_exec THEN
            RAISE NOTICE '⚠️ %: anon peut executer (etat restaure)', fn_name;
        ELSE
            RAISE WARNING '🚨 %: anon toujours bloque - rollback incomplet', fn_name;
        END IF;
    END LOOP;

    RAISE NOTICE '--------------------------------------------';
    RAISE NOTICE '⚠️ Les fonctions sont a nouveau exposees anonymement.';
    RAISE NOTICE '⚠️ Reappliquez 006-secure-rpc-functions.sql apres correction.';
END $$;

COMMIT;
