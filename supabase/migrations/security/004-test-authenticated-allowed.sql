-- ============================================================================
-- 004-test-authenticated-allowed.sql
-- TESTS DE VALIDATION : Verification que l'acces authentifie fonctionne
-- CRM Axivity - Remediation securite P0-01/P0-02
-- ============================================================================
--
-- COMMENT EXECUTER :
--   Ces requetes doivent etre executees en tant que role `authenticated`
--   avec un JWT valide pour valider que l'application fonctionne.
--
-- METHODE 1 : Via Supabase SQL Editor
--   -- Simuler un utilisateur authentifie specifique
--   SET ROLE authenticated;
--   SET request.jwt.claims = '{"sub":"UUID_UTILISATEUR","role":"authenticated"}';
--   -- Executer les requetes ci-dessous
--   RESET ROLE;
--
-- METHODE 2 : Via l'interface de l'application
--   Se connecter avec fgratepanche@axivity.fr (admin)
--   Verifier que toutes les pages fonctionnent normalement
--
-- METHODE 3 : Via curl avec un token JWT valide
--   curl -H "apikey: ANON_KEY" \
--        -H "Authorization: Bearer JWT_TOKEN" \
--        -H "Content-Type: application/json" \
--        https://supabase.axivity.cloud/rest/v1/clients?select=*&limit=5
--   Resultat attendu : donnees retournees
--
-- ============================================================================

-- ============================================================================
-- PREPARATION : Recuperer l'UUID d'un utilisateur existant
-- ============================================================================
-- Executez d'abord en tant que superuser pour trouver l'UUID admin

-- SELECT id, email, role FROM profiles WHERE role = 'admin' LIMIT 1;
-- Copiez l'UUID retourne et remplacez-le dans les SET ci-dessous

-- ============================================================================
-- SIMULER UN UTILISATEUR AUTHENTIFIE (ADMIN)
-- ============================================================================
-- Remplacez UUID_ADMIN par l'UUID reel de fgratepanche@axivity.fr

SET ROLE authenticated;

-- Note: dans le SQL Editor de Supabase, vous pouvez utiliser :
-- SET request.jwt.claims = '{"sub":"UUID_ADMIN","role":"authenticated"}';
-- Pour simuler auth.uid() retournant l'UUID de l'admin

-- ============================================================================
-- TEST 1 : SELECT sur les tables principales (DOIT RETOURNER DES DONNEES)
-- ============================================================================

-- Chaque requete doit retourner au moins 1 ligne (si la table contient des donnees)
-- Si une requete retourne une erreur => L'ACCES AUTHENTIFIE EST CASSE

SELECT 'clients' AS table_test, COUNT(*) AS nb_lignes FROM clients;
SELECT 'contacts' AS table_test, COUNT(*) AS nb_lignes FROM contacts;
SELECT 'interactions' AS table_test, COUNT(*) AS nb_lignes FROM interactions;
SELECT 'projets' AS table_test, COUNT(*) AS nb_lignes FROM projets;
SELECT 'opportunites' AS table_test, COUNT(*) AS nb_lignes FROM opportunites;
SELECT 'taches' AS table_test, COUNT(*) AS nb_lignes FROM taches;
SELECT 'factures' AS table_test, COUNT(*) AS nb_lignes FROM factures;
SELECT 'journal_temps' AS table_test, COUNT(*) AS nb_lignes FROM journal_temps;
SELECT 'catalogue_services' AS table_test, COUNT(*) AS nb_lignes FROM catalogue_services;
SELECT 'lignes_devis' AS table_test, COUNT(*) AS nb_lignes FROM lignes_devis;
SELECT 'modeles_taches' AS table_test, COUNT(*) AS nb_lignes FROM modeles_taches;
SELECT 'objectifs' AS table_test, COUNT(*) AS nb_lignes FROM objectifs;
SELECT 'resultats_cles' AS table_test, COUNT(*) AS nb_lignes FROM resultats_cles;
SELECT 'connaissances' AS table_test, COUNT(*) AS nb_lignes FROM connaissances;
SELECT 'feedback_client' AS table_test, COUNT(*) AS nb_lignes FROM feedback_client;
SELECT 'partenaires' AS table_test, COUNT(*) AS nb_lignes FROM partenaires;
SELECT 'changelog' AS table_test, COUNT(*) AS nb_lignes FROM changelog;
SELECT 'scenarios_previsionnels' AS table_test, COUNT(*) AS nb_lignes FROM scenarios_previsionnels;
SELECT 'accomplissements' AS table_test, COUNT(*) AS nb_lignes FROM accomplissements;
SELECT 'demandes_evolution' AS table_test, COUNT(*) AS nb_lignes FROM demandes_evolution;
SELECT 'equipe' AS table_test, COUNT(*) AS nb_lignes FROM equipe;
SELECT 'projet_membres' AS table_test, COUNT(*) AS nb_lignes FROM projet_membres;
SELECT 'notifications' AS table_test, COUNT(*) AS nb_lignes FROM notifications;
SELECT 'devis' AS table_test, COUNT(*) AS nb_lignes FROM devis;
SELECT 'email_templates' AS table_test, COUNT(*) AS nb_lignes FROM email_templates;
SELECT 'opportunite_contacts' AS table_test, COUNT(*) AS nb_lignes FROM opportunite_contacts;
SELECT 'parametres_entreprise' AS table_test, COUNT(*) AS nb_lignes FROM parametres_entreprise;

-- ============================================================================
-- TEST 2 : profiles - Seul son propre profil visible
-- ============================================================================
-- Avec auth.uid() configure, cette requete ne doit retourner QUE le profil
-- de l'utilisateur authentifie (1 ligne max)

SELECT 'profiles (propre profil)' AS table_test, COUNT(*) AS nb_lignes FROM profiles;
-- RESULTAT ATTENDU : 1 (uniquement son propre profil)

-- ============================================================================
-- TEST 3 : INSERT authentifie sur table standard (DOIT REUSSIR)
-- ============================================================================

DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Inserer un client de test
    INSERT INTO clients (nom, statut)
    VALUES ('TEST_AUTH_VALIDATION', 'Prospect')
    RETURNING id INTO test_id;

    -- Verifier que l'insertion a reussi
    IF test_id IS NOT NULL THEN
        RAISE NOTICE '✅ INSERT authentifie reussi sur clients (id: %)', test_id;
        -- Nettoyer
        DELETE FROM clients WHERE id = test_id;
        RAISE NOTICE '✅ DELETE authentifie reussi sur clients';
    ELSE
        RAISE WARNING '❌ INSERT authentifie echoue sur clients';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur INSERT/DELETE authentifie sur clients: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 4 : UPDATE authentifie sur table standard (DOIT REUSSIR)
-- ============================================================================

DO $$
DECLARE
    test_id UUID;
    updated_count INTEGER;
BEGIN
    -- Creer un enregistrement de test
    INSERT INTO changelog (description, type)
    VALUES ('TEST_AUTH_UPDATE', 'Fix')
    RETURNING id INTO test_id;

    -- Mettre a jour
    UPDATE changelog SET description = 'TEST_AUTH_UPDATED' WHERE id = test_id;
    GET DIAGNOSTICS updated_count = ROW_COUNT;

    IF updated_count = 1 THEN
        RAISE NOTICE '✅ UPDATE authentifie reussi sur changelog';
    ELSE
        RAISE WARNING '❌ UPDATE authentifie echoue sur changelog';
    END IF;

    -- Nettoyer
    DELETE FROM changelog WHERE id = test_id;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur UPDATE authentifie sur changelog: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 5 : parametres_entreprise - INSERT/UPDATE/DELETE admin seulement
-- ============================================================================
-- Ce test necessite que auth.uid() soit configure avec l'UUID admin
-- Si execute sans context JWT, les tests d'ecriture echoueront (attendu)

-- SELECT doit fonctionner pour tout authentifie
SELECT 'parametres_entreprise (SELECT)' AS test, COUNT(*) AS nb FROM parametres_entreprise;

-- ============================================================================
-- TEST 6 : Verification exhaustive SELECT via boucle
-- ============================================================================

DO $$
DECLARE
    t TEXT;
    cnt INTEGER;
    tables_ok TEXT[] := '{}';
    tables_blocked TEXT[] := '{}';
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', t) INTO cnt;
            tables_ok := array_append(tables_ok, t);
        EXCEPTION WHEN OTHERS THEN
            tables_blocked := array_append(tables_blocked, t || ' (' || SQLERRM || ')');
        END;
    END LOOP;

    RAISE NOTICE '✅ Tables accessibles en authenticated: %', array_to_string(tables_ok, ', ');

    IF array_length(tables_blocked, 1) IS NOT NULL THEN
        RAISE WARNING '❌ Tables BLOQUEES pour authenticated: %', array_to_string(tables_blocked, ', ');
        RAISE WARNING 'Verifiez les politiques de ces tables!';
    ELSE
        RAISE NOTICE '✅ Toutes les tables sont accessibles - application fonctionnelle!';
    END IF;
END $$;

-- ============================================================================
-- TEST 7 : Verification service_role bypass (pour N8N)
-- ============================================================================
-- Ce test doit etre execute en tant que service_role
-- Le service_role bypass RLS nativement, donc TOUT doit fonctionner

-- RESET ROLE;
-- SET ROLE service_role;
-- SELECT 'service_role_clients' AS test, COUNT(*) FROM clients;
-- SELECT 'service_role_profiles' AS test, COUNT(*) FROM profiles;
-- RESET ROLE;

-- ============================================================================
-- RESTAURER LE ROLE NORMAL
-- ============================================================================
RESET ROLE;

-- ============================================================================
-- CHECKLIST DE VALIDATION POST-EXECUTION
-- ============================================================================
--
-- [ ] 001 - Script de verification execute, etat initial documente
-- [ ] 002 - Script d'activation RLS + politiques execute dans une transaction
-- [ ] 003 - Tests anonymes : TOUS les SELECT retournent 0 lignes
-- [ ] 003 - Tests anonymes : TOUS les INSERT/UPDATE/DELETE echouent
-- [ ] 004 - Tests authentifies : SELECT retourne des donnees sur toutes les tables
-- [ ] 004 - Tests authentifies : profiles retourne UNIQUEMENT le profil propre
-- [ ] 004 - Tests authentifies : INSERT/UPDATE/DELETE fonctionnent sur tables standard
-- [ ] 004 - Tests authentifies : parametres_entreprise en lecture seule (sauf admin)
-- [ ] APP - Se connecter a l'application web et verifier :
--     [ ] Dashboard charge correctement
--     [ ] Liste clients accessible
--     [ ] Liste projets accessible
--     [ ] Creation/modification client fonctionne
--     [ ] Generation devis fonctionne
--     [ ] Profil utilisateur visible et modifiable
-- [ ] N8N - Verifier que les workflows automatises fonctionnent :
--     [ ] Conversion opportunite → projet
--     [ ] Alertes taches en retard
--     [ ] Relances factures
-- [ ] BACKUP - Sauvegarder l'etat post-remediation
--
-- En cas de probleme : executer 002-rollback-rls.sql IMMEDIATEMENT
-- puis investiguer avec 001-verify-rls-status.sql
-- ============================================================================
