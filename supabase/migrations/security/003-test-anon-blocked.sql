-- ============================================================================
-- 003-test-anon-blocked.sql
-- TESTS DE VALIDATION : Verification que l'acces anonyme est bloque
-- CRM Axivity - Remediation securite P0-01/P0-02
-- ============================================================================
--
-- COMMENT EXECUTER :
--   Ces requetes doivent etre executees en tant que role `anon` pour valider
--   que l'acces anonyme est effectivement bloque.
--
-- METHODE 1 : Via Supabase SQL Editor (simuler le role anon)
--   SET ROLE anon;
--   -- Executer les requetes ci-dessous
--   RESET ROLE;
--
-- METHODE 2 : Via curl avec la cle anon (sans token auth)
--   curl -H "apikey: ANON_KEY" \
--        -H "Content-Type: application/json" \
--        https://supabase.axivity.cloud/rest/v1/clients?select=*&limit=1
--   Resultat attendu : [] (tableau vide) ou erreur 403
--
-- METHODE 3 : Via le Supabase JavaScript client (sans session)
--   const { data, error } = await supabase.from('clients').select('*').limit(1)
--   Resultat attendu : data = [] ou error
--
-- ============================================================================

-- ============================================================================
-- SIMULER LE ROLE ANON
-- ============================================================================
-- IMPORTANT : Executez ceci dans le SQL Editor de Supabase
-- Cela simule un utilisateur non authentifie

SET ROLE anon;

-- ============================================================================
-- TEST 1 : SELECT sur les tables principales (DOIT RETOURNER 0 LIGNES)
-- ============================================================================

-- Chaque requete doit retourner un tableau VIDE
-- Si une requete retourne des donnees => LA SECURISATION A ECHOUE

SELECT 'clients' AS table_test, COUNT(*) AS nb_lignes FROM clients;
SELECT 'contacts' AS table_test, COUNT(*) AS nb_lignes FROM contacts;
SELECT 'profiles' AS table_test, COUNT(*) AS nb_lignes FROM profiles;
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
-- TEST 2 : INSERT anonyme (DOIT ECHOUER)
-- ============================================================================

-- Tentative d'insertion dans clients (donnees PII)
-- RESULTAT ATTENDU : Erreur "new row violates row-level security policy"
DO $$
BEGIN
    INSERT INTO clients (nom, statut) VALUES ('TEST_ANON_HACKER', 'Prospect');
    RAISE WARNING '❌ ECHEC SECURITE: INSERT anonyme dans clients a reussi!';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ INSERT anonyme bloque sur clients';
WHEN OTHERS THEN
    RAISE NOTICE '✅ INSERT anonyme bloque sur clients (erreur: %)', SQLERRM;
END $$;

-- Tentative d'insertion dans contacts (donnees PII)
DO $$
BEGIN
    INSERT INTO contacts (nom) VALUES ('TEST_ANON_HACKER');
    RAISE WARNING '❌ ECHEC SECURITE: INSERT anonyme dans contacts a reussi!';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ INSERT anonyme bloque sur contacts';
WHEN OTHERS THEN
    RAISE NOTICE '✅ INSERT anonyme bloque sur contacts (erreur: %)', SQLERRM;
END $$;

-- Tentative d'insertion dans profiles (elevation de privileges)
DO $$
BEGIN
    INSERT INTO profiles (id, email, nom, role)
    VALUES (gen_random_uuid(), 'hacker@evil.com', 'Hacker', 'admin');
    RAISE WARNING '❌ ECHEC SECURITE: INSERT anonyme dans profiles a reussi!';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ INSERT anonyme bloque sur profiles';
WHEN OTHERS THEN
    RAISE NOTICE '✅ INSERT anonyme bloque sur profiles (erreur: %)', SQLERRM;
END $$;

-- ============================================================================
-- TEST 3 : UPDATE anonyme (DOIT ECHOUER)
-- ============================================================================

DO $$
BEGIN
    UPDATE clients SET nom = 'HACKED' WHERE 1=1;
    RAISE WARNING '❌ ECHEC SECURITE: UPDATE anonyme dans clients a reussi!';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ UPDATE anonyme bloque sur clients';
WHEN OTHERS THEN
    RAISE NOTICE '✅ UPDATE anonyme bloque sur clients (erreur: %)', SQLERRM;
END $$;

DO $$
BEGIN
    UPDATE profiles SET role = 'admin' WHERE 1=1;
    RAISE WARNING '❌ ECHEC SECURITE: UPDATE anonyme dans profiles a reussi!';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ UPDATE anonyme bloque sur profiles';
WHEN OTHERS THEN
    RAISE NOTICE '✅ UPDATE anonyme bloque sur profiles (erreur: %)', SQLERRM;
END $$;

-- ============================================================================
-- TEST 4 : DELETE anonyme (DOIT ECHOUER)
-- ============================================================================

DO $$
BEGIN
    DELETE FROM clients WHERE 1=1;
    RAISE WARNING '❌ ECHEC SECURITE: DELETE anonyme dans clients a reussi!';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ DELETE anonyme bloque sur clients';
WHEN OTHERS THEN
    RAISE NOTICE '✅ DELETE anonyme bloque sur clients (erreur: %)', SQLERRM;
END $$;

DO $$
BEGIN
    DELETE FROM factures WHERE 1=1;
    RAISE WARNING '❌ ECHEC SECURITE: DELETE anonyme dans factures a reussi!';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ DELETE anonyme bloque sur factures';
WHEN OTHERS THEN
    RAISE NOTICE '✅ DELETE anonyme bloque sur factures (erreur: %)', SQLERRM;
END $$;

-- ============================================================================
-- TEST 5 : Verification exhaustive SELECT via boucle
-- ============================================================================

DO $$
DECLARE
    t TEXT;
    cnt INTEGER;
    tables_leaking TEXT[] := '{}';
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', t) INTO cnt;
        IF cnt > 0 THEN
            tables_leaking := array_append(tables_leaking, t || ' (' || cnt || ' lignes)');
        END IF;
    END LOOP;

    IF array_length(tables_leaking, 1) IS NOT NULL THEN
        RAISE WARNING '❌ TABLES ACCESSIBLES EN ANONYME: %', array_to_string(tables_leaking, ', ');
    ELSE
        RAISE NOTICE '✅ AUCUNE table accessible en anonyme - securisation reussie!';
    END IF;
END $$;

-- ============================================================================
-- RESTAURER LE ROLE NORMAL
-- ============================================================================
RESET ROLE;

-- ============================================================================
-- RESUME DES RESULTATS ATTENDUS
-- ============================================================================
-- Tous les SELECT doivent retourner 0 lignes
-- Tous les INSERT/UPDATE/DELETE doivent echouer
-- Le test exhaustif (TEST 5) doit afficher "AUCUNE table accessible"
--
-- Si un test echoue : une table est encore accessible en anonyme
-- Action : verifier les politiques avec 001-verify-rls-status.sql
-- ============================================================================
