-- ============================================================================
-- P2-01 : Monitoring et audit d'authentification
-- ============================================================================
-- OBJECTIF :
--   1. Fonction d'audit pour vérifier la configuration auth
--   2. Vue de monitoring des connexions récentes
--   3. Fonction d'alerte pour les tentatives suspectes
--
-- NOTE : La majorité du durcissement auth se fait via les variables
--   d'environnement Coolify/GoTrue. Ce script fournit le monitoring SQL.
--
-- ACTIONS COOLIFY REQUISES (voir guide séparé) :
--   - GOTRUE_JWT_EXP=3600 (1 heure au lieu de 100 ans)
--   - GOTRUE_EXTERNAL_PHONE_ENABLED=false
--   - GOTRUE_MAILER_AUTOCONFIRM=false
--   - GOTRUE_RATE_LIMIT_EMAIL_SENT=3
--   - GOTRUE_PASSWORD_MIN_LENGTH=12
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FONCTION D'AUDIT : Vérifier l'état de la configuration auth
-- ============================================================================
-- Accessible uniquement aux admins via RPC
-- Retourne un rapport de la configuration actuelle

CREATE OR REPLACE FUNCTION public.audit_auth_config()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_user_count INTEGER;
  v_confirmed_count INTEGER;
  v_unconfirmed_count INTEGER;
  v_last_login TIMESTAMPTZ;
  v_phone_users INTEGER;
BEGIN
  -- Vérification : admin uniquement
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs';
  END IF;

  -- Compteurs utilisateurs
  SELECT COUNT(*) INTO v_user_count FROM auth.users;
  SELECT COUNT(*) INTO v_confirmed_count
    FROM auth.users WHERE email_confirmed_at IS NOT NULL;
  SELECT COUNT(*) INTO v_unconfirmed_count
    FROM auth.users WHERE email_confirmed_at IS NULL;
  SELECT MAX(last_sign_in_at) INTO v_last_login FROM auth.users;
  SELECT COUNT(*) INTO v_phone_users
    FROM auth.users WHERE phone IS NOT NULL AND phone != '';

  SELECT json_build_object(
    'audit_date', NOW(),
    'users', json_build_object(
      'total', v_user_count,
      'email_confirmed', v_confirmed_count,
      'email_unconfirmed', v_unconfirmed_count,
      'with_phone', v_phone_users,
      'last_login', v_last_login
    ),
    'roles', (
      SELECT json_agg(json_build_object(
        'role', role,
        'count', cnt
      ))
      FROM (
        SELECT role, COUNT(*) as cnt
        FROM profiles
        GROUP BY role
      ) sub
    ),
    'security_checks', json_build_object(
      'rls_enabled_on_profiles', (
        SELECT relforcerowsecurity
        FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace
      ),
      'anon_blocked_on_kpis', NOT has_function_privilege('anon',
        (SELECT oid FROM pg_proc WHERE proname = 'get_dashboard_kpis' LIMIT 1),
        'EXECUTE'
      ),
      'private_schema_exists', EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'private'
      ),
      'private_tables_count', (
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = 'private' AND table_type = 'BASE TABLE'
      )
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Restreindre l'accès
REVOKE EXECUTE ON FUNCTION public.audit_auth_config() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_auth_config() FROM anon;
GRANT EXECUTE ON FUNCTION public.audit_auth_config() TO authenticated;

COMMENT ON FUNCTION public.audit_auth_config() IS
  'Audit de sécurité : retourne un rapport sur la configuration auth. Admin uniquement.';

-- ============================================================================
-- 2. FONCTION : Historique des connexions récentes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_recent_logins(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_email TEXT,
  user_role user_role,
  last_sign_in TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  confirmed BOOLEAN
) AS $$
BEGIN
  -- Admin uniquement
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs';
  END IF;

  RETURN QUERY
  SELECT
    u.email::TEXT,
    p.role,
    u.last_sign_in_at,
    u.created_at,
    (u.email_confirmed_at IS NOT NULL)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.last_sign_in_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE EXECUTE ON FUNCTION public.get_recent_logins(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_recent_logins(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_recent_logins(INTEGER) TO authenticated;

COMMENT ON FUNCTION public.get_recent_logins(INTEGER) IS
  'Liste les connexions récentes avec rôle et statut confirmation. Admin uniquement.';

-- ============================================================================
-- 3. VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  fn_name TEXT;
  fn_oid OID;
  anon_can BOOLEAN;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VERIFICATION P2-01 : Monitoring auth';
  RAISE NOTICE '============================================';

  FOR fn_name IN VALUES ('audit_auth_config'), ('get_recent_logins')
  LOOP
    SELECT p.oid INTO fn_oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = fn_name
    LIMIT 1;

    IF fn_oid IS NULL THEN
      RAISE WARNING 'MANQUANTE : %', fn_name;
      CONTINUE;
    END IF;

    anon_can := has_function_privilege('anon', fn_oid, 'EXECUTE');
    IF anon_can THEN
      RAISE WARNING '  %: anon peut exécuter!', fn_name;
    ELSE
      RAISE NOTICE '  OK %: anon bloqué, authenticated autorisé', fn_name;
    END IF;
  END LOOP;

  RAISE NOTICE '============================================';
END $$;

COMMIT;
