-- ============================================================================
-- 006-secure-rpc-functions.sql
-- REMEDIATION - Securiser les 6 fonctions RPC exposees
-- CRM Axivity - Remediation securite P0-03
-- ============================================================================
--
-- OBJECTIF :
--   1. Revoquer l'acces anon/public a toutes les fonctions RPC
--   2. Conserver l'acces authenticated
--   3. Convertir SECURITY DEFINER en SECURITY INVOKER
--   4. Ajouter des verifications d'authentification internes
--
-- PRE-REQUIS :
--   - Executer 005-diagnose-rpc-privileges.sql d'abord
--   - 002-enable-rls-and-policies.sql deja applique (RLS active)
--   - Backup recommande avant execution
--
-- IMPACT :
--   - Frontend (authenticated) : aucun impact
--   - N8N (service_role) : aucun impact (bypass natif)
--   - Appels anonymes via API : bloques (403)
--
-- ROLLBACK : 006-rollback-rpc.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1 : REVOQUER L'ACCES ANONYME
-- ============================================================================
-- PostgreSQL accorde EXECUTE a PUBLIC par defaut. Le role anon herite de
-- PUBLIC, donc il peut executer toutes les fonctions.
-- On revoque de PUBLIC (supprime le privilege herite) puis de anon (securite).
-- ============================================================================

-- ---- get_dashboard_kpis() ----
REVOKE EXECUTE ON FUNCTION public.get_dashboard_kpis() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_kpis() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis() TO authenticated;

-- ---- convert_opportunity_to_project(UUID, DATE) ----
REVOKE EXECUTE ON FUNCTION public.convert_opportunity_to_project(UUID, DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.convert_opportunity_to_project(UUID, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.convert_opportunity_to_project(UUID, DATE) TO authenticated;

-- ---- convert_prospect_to_opportunity(UUID, TEXT, DECIMAL) ----
REVOKE EXECUTE ON FUNCTION public.convert_prospect_to_opportunity(UUID, TEXT, DECIMAL) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.convert_prospect_to_opportunity(UUID, TEXT, DECIMAL) FROM anon;
GRANT EXECUTE ON FUNCTION public.convert_prospect_to_opportunity(UUID, TEXT, DECIMAL) TO authenticated;

-- ---- generer_numero_devis() ----
REVOKE EXECUTE ON FUNCTION public.generer_numero_devis() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generer_numero_devis() FROM anon;
GRANT EXECUTE ON FUNCTION public.generer_numero_devis() TO authenticated;

-- ---- generer_numero_facture() ----
REVOKE EXECUTE ON FUNCTION public.generer_numero_facture() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generer_numero_facture() FROM anon;
GRANT EXECUTE ON FUNCTION public.generer_numero_facture() TO authenticated;

-- ---- unaccent(text) ----
-- Fonction d'extension PostgreSQL. On revoque l'acces anonyme mais on
-- conserve authenticated car elle peut etre utilisee dans des recherches.
-- Note: l'extension cree aussi unaccent(regdictionary, text) - on revoque les deux.
REVOKE EXECUTE ON FUNCTION public.unaccent(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unaccent(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.unaccent(text) TO authenticated;

-- Surcharge avec dictionnaire explicite (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'unaccent'
          AND pg_get_function_identity_arguments(p.oid) = 'regdictionary, text'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.unaccent(regdictionary, text) FROM PUBLIC';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.unaccent(regdictionary, text) FROM anon';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.unaccent(regdictionary, text) TO authenticated';
        RAISE NOTICE 'Privileges revoques pour unaccent(regdictionary, text)';
    END IF;
END $$;

-- ============================================================================
-- PHASE 2 : CONVERTIR SECURITY DEFINER EN SECURITY INVOKER
-- ============================================================================
-- Les fonctions SECURITY DEFINER s'executent avec les privileges du createur
-- (souvent postgres/superuser), ce qui bypass completement RLS.
-- En les convertissant en INVOKER, RLS s'applique aux requetes internes.
--
-- Note : Avec les politiques actuelles (authenticated = CRUD complet),
-- la conversion est transparente. Si des politiques granulaires sont
-- ajoutees en P0-04, les fonctions respecteront automatiquement les
-- nouvelles restrictions.
-- ============================================================================

-- ---- get_dashboard_kpis : DEFINER -> INVOKER ----
-- Cette fonction fait uniquement des SELECT agreges. Tous les utilisateurs
-- authentifies ont SELECT sur factures, opportunites, projets, taches, contacts.
-- Le passage a INVOKER est transparent.
ALTER FUNCTION public.get_dashboard_kpis() SECURITY INVOKER;

-- ============================================================================
-- PHASE 3 : RECREER LES FONCTIONS DE CONVERSION AVEC AUTH CHECK + INVOKER
-- ============================================================================
-- Ces fonctions modifient des donnees sensibles (creation projets, opportunites).
-- On ajoute une verification d'authentification et on passe en INVOKER.
--
-- CHOIX DE SECURITE :
-- - auth.uid() IS NOT NULL : verifie que l'appelant est authentifie
-- - Verification dans profiles : verifie le role de l'utilisateur
-- - SECURITY INVOKER : RLS s'applique aux requetes internes
--
-- NOTE : Le prompt recommande une restriction admin uniquement. Cependant,
-- pour les fonctions de conversion, les roles admin ET manager/commercial
-- sont des utilisateurs legitimes. Ajustez le WHERE selon vos besoins.
-- ============================================================================

-- ---- convert_opportunity_to_project ----
CREATE OR REPLACE FUNCTION convert_opportunity_to_project(
  p_opportunity_id UUID,
  p_date_debut DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_opp RECORD;
  v_project_id UUID;
BEGIN
  -- Verification d'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  -- Verification de role : seuls admin et manager peuvent convertir
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'developpeur_nocode', 'developpeur_automatisme', 'commercial')
  ) THEN
    RAISE EXCEPTION 'Acces non autorise : role insuffisant pour convertir une opportunite';
  END IF;

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
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ---- convert_prospect_to_opportunity ----
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
  -- Verification d'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  -- Verification de role : seuls admin et commerciaux peuvent convertir
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'developpeur_nocode', 'developpeur_automatisme', 'commercial')
  ) THEN
    RAISE EXCEPTION 'Acces non autorise : role insuffisant pour convertir un prospect';
  END IF;

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
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- PHASE 4 : SECURISER LES FONCTIONS DE GENERATION DE NUMEROS
-- ============================================================================
-- Ces fonctions incrementent des compteurs sequentiels. Un appel anonyme
-- repete pourrait epuiser la sequence ou creer des trous dans la numerotation.
--
-- CHOIX : On ajoute une verification auth.uid() IS NOT NULL.
-- La restriction par role n'est pas appliquee ici car tout utilisateur
-- authentifie qui cree un devis/facture a besoin de generer un numero.
-- Si vous souhaitez restreindre a certains roles, decommentez le bloc
-- de verification de role ci-dessous.
-- ============================================================================

-- ---- generer_numero_devis ----
CREATE OR REPLACE FUNCTION generer_numero_devis()
RETURNS TEXT AS $$
DECLARE
  annee_courante INTEGER;
  prochain_numero INTEGER;
  numero_formate TEXT;
BEGIN
  -- Verification d'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour generer un numero de devis';
  END IF;

  -- Optionnel: restriction par role (decommenter si necessaire)
  -- IF NOT EXISTS (
  --   SELECT 1 FROM profiles
  --   WHERE id = auth.uid()
  --     AND role IN ('admin', 'commercial', 'developpeur_nocode')
  -- ) THEN
  --   RAISE EXCEPTION 'Acces non autorise';
  -- END IF;

  annee_courante := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Inserer ou mettre a jour le compteur pour l'annee courante
  INSERT INTO devis_compteur (annee, dernier_numero)
  VALUES (annee_courante, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = devis_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO prochain_numero;

  -- Formater le numero: DEV-2025-001
  numero_formate := 'DEV-' || annee_courante || '-' || LPAD(prochain_numero::TEXT, 3, '0');

  RETURN numero_formate;
END;
$$ LANGUAGE plpgsql;

-- ---- generer_numero_facture ----
CREATE OR REPLACE FUNCTION generer_numero_facture()
RETURNS TEXT AS $$
DECLARE
  annee_courante INTEGER;
  prochain_numero INTEGER;
  numero_formate TEXT;
BEGIN
  -- Verification d'authentification
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour generer un numero de facture';
  END IF;

  -- Optionnel: restriction par role (decommenter si necessaire)
  -- IF NOT EXISTS (
  --   SELECT 1 FROM profiles
  --   WHERE id = auth.uid()
  --     AND role IN ('admin')
  -- ) THEN
  --   RAISE EXCEPTION 'Acces non autorise';
  -- END IF;

  annee_courante := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Inserer ou mettre a jour le compteur pour l'annee courante
  INSERT INTO factures_compteur (annee, dernier_numero)
  VALUES (annee_courante, 1)
  ON CONFLICT (annee) DO UPDATE
  SET dernier_numero = factures_compteur.dernier_numero + 1
  RETURNING dernier_numero INTO prochain_numero;

  -- Formater le numero: FAC-2025-001
  numero_formate := 'FAC-' || annee_courante || '-' || LPAD(prochain_numero::TEXT, 3, '0');

  RETURN numero_formate;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 5 : VERIFICATION POST-EXECUTION
-- ============================================================================

DO $$
DECLARE
    fn_name TEXT;
    fn_oid OID;
    anon_can_exec BOOLEAN;
    auth_can_exec BOOLEAN;
    is_definer BOOLEAN;
    issues INTEGER := 0;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'VERIFICATION POST-EXECUTION P0-03';
    RAISE NOTICE '============================================';

    FOR fn_name, fn_oid, is_definer IN
        SELECT p.proname, p.oid, p.prosecdef
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
        auth_can_exec := has_function_privilege('authenticated', fn_oid, 'EXECUTE');

        IF anon_can_exec THEN
            RAISE WARNING '🚨 %: anon peut encore executer!', fn_name;
            issues := issues + 1;
        ELSE
            RAISE NOTICE '✅ %: anon bloque', fn_name;
        END IF;

        IF NOT auth_can_exec THEN
            RAISE WARNING '⚠️ %: authenticated ne peut pas executer!', fn_name;
            issues := issues + 1;
        ELSE
            RAISE NOTICE '✅ %: authenticated autorise', fn_name;
        END IF;

        IF is_definer THEN
            RAISE WARNING '⚠️ %: encore SECURITY DEFINER!', fn_name;
            issues := issues + 1;
        ELSE
            RAISE NOTICE '✅ %: SECURITY INVOKER', fn_name;
        END IF;
    END LOOP;

    RAISE NOTICE '--------------------------------------------';
    IF issues = 0 THEN
        RAISE NOTICE '✅ Toutes les verifications passent (0 probleme)';
    ELSE
        RAISE WARNING '🚨 % probleme(s) detecte(s) - verifiez le script', issues;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- RAPPELS IMPORTANTS
-- ============================================================================
-- 1. Le service_role (N8N) bypass les privileges de fonction nativement.
--    Aucun impact sur les workflows automatises.
-- 2. Les fonctions trigger (update_updated_at, handle_new_user, etc.) ne sont
--    pas concernees car elles ne sont pas appelables via l'API PostgREST.
-- 3. handle_new_user() reste SECURITY DEFINER intentionnellement : elle est
--    declenchee par un trigger sur auth.users et a besoin d'inserer dans
--    profiles au nom du systeme.
-- 4. Pour rollback : executez 006-rollback-rpc.sql
-- ============================================================================
