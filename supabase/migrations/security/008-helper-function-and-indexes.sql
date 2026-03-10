-- ============================================================================
-- 008-helper-function-and-indexes.sql
-- HELPERS & INDEXES pour les politiques RLS granulaires P0-04
-- CRM Axivity - Securite
-- ============================================================================
--
-- OBJECTIF :
--   1. Creer public.get_user_role() - SECURITY DEFINER + STABLE
--   2. Creer public.is_admin() / public.is_developer() - raccourcis
--   3. Creer public.get_team_profiles() - RPC pour afficher les noms d'equipe
--   4. Verifier/creer les index necessaires aux politiques RLS
--
-- PRE-REQUIS :
--   - 002-enable-rls-and-policies.sql (RLS active sur toutes les tables)
--   - 006-secure-rpc-functions.sql (RPC securisees)
--   - Table profiles existante avec colonne role (user_role enum)
--
-- NOTES :
--   - SECURITY DEFINER car profiles a RLS => la fonction bypass RLS pour
--     lire le role du user courant (sinon la requete echoue pour non-admin)
--   - STABLE => cache le resultat au niveau de la transaction (evite N requetes)
--   - Les fonctions auth.user_role() / auth.is_developer() existent deja
--     (migration 11). On cree des equivalents dans public.* pour les RLS
--     policies (les fonctions auth.* referencent deja profiles avec SECURITY
--     DEFINER, mais on prefere des helpers dedies dans public pour clarte)
--
-- ROLLBACK : DROP les fonctions et index crees ici
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1 : HELPER FUNCTIONS
-- ============================================================================

-- ---- public.get_user_role() ----
-- Retourne le role de l'utilisateur courant
-- SECURITY DEFINER : bypass RLS sur profiles (necessaire car profiles est protege)
-- STABLE : meme resultat dans la meme transaction => cache par le planner
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Restreindre l'acces : authenticated seulement
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

COMMENT ON FUNCTION public.get_user_role() IS
    'Retourne le role (user_role enum) de l utilisateur authentifie courant. '
    'SECURITY DEFINER pour bypass RLS sur profiles. STABLE pour cache transaction.';

-- ---- public.is_admin() ----
-- Raccourci : true si l'utilisateur courant est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT public.get_user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS
    'Retourne true si l utilisateur courant a le role admin.';

-- ---- public.is_developer() ----
-- Raccourci : true si l'utilisateur courant est developpeur (nocode ou automatisme)
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS BOOLEAN AS $$
    SELECT public.get_user_role() IN ('developpeur_nocode', 'developpeur_automatisme')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

REVOKE EXECUTE ON FUNCTION public.is_developer() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_developer() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_developer() TO authenticated;

COMMENT ON FUNCTION public.is_developer() IS
    'Retourne true si l utilisateur courant a un role developpeur (nocode ou automatisme).';

-- ---- public.get_team_profiles() ----
-- RPC pour afficher les noms/avatars des membres d'equipe
-- SECURITY DEFINER pour bypass RLS sur profiles
-- Retourne uniquement les champs publics (pas email, pas telephone)
CREATE OR REPLACE FUNCTION public.get_team_profiles()
RETURNS TABLE (
    id UUID,
    nom TEXT,
    prenom TEXT,
    avatar_url TEXT,
    role user_role
) AS $$
    SELECT p.id, p.nom, p.prenom, p.avatar_url, p.role
    FROM public.profiles p
    WHERE p.actif = true
$$ LANGUAGE sql SECURITY DEFINER STABLE;

REVOKE EXECUTE ON FUNCTION public.get_team_profiles() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_team_profiles() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_team_profiles() TO authenticated;

COMMENT ON FUNCTION public.get_team_profiles() IS
    'Retourne les profils publics (id, nom, prenom, avatar_url, role) des membres actifs. '
    'Utiliser pour afficher noms/avatars dans les composants (assignations, avatars equipe). '
    'SECURITY DEFINER pour bypass RLS sur profiles.';

-- ============================================================================
-- PHASE 2 : INDEX POUR LES POLITIQUES RLS
-- ============================================================================
-- Les index suivants optimisent les subqueries utilisees dans les politiques
-- granulaires (009-granular-rls-policies.sql).
-- On utilise IF NOT EXISTS car certains existent deja.

-- profiles(id) : deja PK, pas besoin d'index supplementaire

-- taches(assignee_id) : deja cree dans 01_schema.sql (idx_taches_assignee)
-- journal_temps(user_id) : deja cree dans 01_schema.sql (idx_journal_temps_user)
-- projet_membres(profile_id) : deja cree dans 20_projet_membres_notifications.sql (idx_projet_membres_profile)
-- notifications(user_id) : deja cree dans 20_projet_membres_notifications.sql (idx_notifications_user)

-- Index supplementaires pour les politiques granulaires :

-- connaissances(auteur_id) : utilise dans la politique "propre" pour developpeurs
CREATE INDEX IF NOT EXISTS idx_connaissances_auteur ON connaissances(auteur_id);

-- accomplissements(user_id) : deja idx_accomplissements_user, mais verifions
-- (deja cree dans 01_schema.sql)

-- demandes_evolution(demandeur_id) : utilise pour la politique "propre"
CREATE INDEX IF NOT EXISTS idx_demandes_evolution_demandeur ON demandes_evolution(demandeur_id);

-- changelog(auteur_id) : utilise pour la politique "propre"
CREATE INDEX IF NOT EXISTS idx_changelog_auteur ON changelog(auteur_id);

-- projets(chef_projet_id) : deja cree dans 01_schema.sql (idx_projets_chef)

-- ============================================================================
-- PHASE 3 : VERIFICATION
-- ============================================================================

DO $$
DECLARE
    fn_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fn_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_user_role', 'is_admin', 'is_developer', 'get_team_profiles');

    RAISE NOTICE '============================================';
    RAISE NOTICE 'VERIFICATION 008-helper-function-and-indexes';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Fonctions helper creees: % / 4', fn_count;

    IF fn_count < 4 THEN
        RAISE WARNING 'ATTENTION: seulement % fonctions creees sur 4!', fn_count;
    ELSE
        RAISE NOTICE 'OK - Toutes les fonctions helper sont en place';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- TEST RAPIDE (a executer manuellement apres le script)
-- ============================================================================
-- En tant qu'utilisateur authentifie :
--   SELECT public.get_user_role();         -- Devrait retourner votre role
--   SELECT public.is_admin();              -- true/false
--   SELECT public.is_developer();          -- true/false
--   SELECT * FROM public.get_team_profiles();  -- Liste des membres actifs
-- ============================================================================
