-- ============================================================
-- DIAGNOSTIC: Multi-Device Session Issues
-- Run this in: Supabase SQL Editor (https://supabase.axivity.cloud)
-- Date: 2026-03-03
-- Purpose: Identify why logging in on a second device disconnects the first
-- ============================================================

-- ============================================================
-- 1. LIST ALL ACTIVE SESSIONS (per user)
--    If only 1 session exists per user → single-session mode is ON
-- ============================================================
SELECT
  s.id AS session_id,
  s.user_id,
  u.email,
  s.created_at,
  s.updated_at AS last_refreshed,
  s.not_after AS expires_at,
  s.tag,
  CASE
    WHEN s.not_after IS NULL THEN 'no expiry set'
    WHEN s.not_after > NOW() THEN 'ACTIVE'
    ELSE 'EXPIRED'
  END AS status,
  AGE(NOW(), s.updated_at) AS time_since_last_refresh
FROM auth.sessions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY u.email, s.created_at DESC;

-- ============================================================
-- 2. COUNT SESSIONS PER USER
--    CRITICAL: If max = 1, single-session mode is likely enabled
-- ============================================================
SELECT
  u.email,
  COUNT(s.id) AS total_sessions,
  COUNT(CASE WHEN s.not_after IS NULL OR s.not_after > NOW() THEN 1 END) AS active_sessions,
  COUNT(CASE WHEN s.not_after <= NOW() THEN 1 END) AS expired_sessions,
  MIN(s.created_at) AS oldest_session,
  MAX(s.created_at) AS newest_session
FROM auth.users u
LEFT JOIN auth.sessions s ON s.user_id = u.id
GROUP BY u.email
ORDER BY total_sessions DESC;

-- ============================================================
-- 3. CHECK RECENTLY DESTROYED SESSIONS
--    Look for sessions that were deleted/expired around the time
--    the second device logged in
-- ============================================================
SELECT
  s.id AS session_id,
  u.email,
  s.created_at,
  s.updated_at,
  s.not_after,
  CASE
    WHEN s.not_after IS NOT NULL AND s.not_after < s.updated_at + INTERVAL '5 minutes'
    THEN '⚠️ FORCE-EXPIRED (session was killed)'
    ELSE 'normal expiry'
  END AS expiry_type
FROM auth.sessions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.not_after IS NOT NULL
  AND s.not_after <= NOW()
ORDER BY s.not_after DESC
LIMIT 20;

-- ============================================================
-- 4. CHECK REFRESH TOKENS (token family analysis)
--    Multiple revoked tokens = token rotation issue
-- ============================================================
SELECT
  rt.session_id,
  u.email,
  COUNT(*) AS total_tokens,
  COUNT(CASE WHEN rt.revoked THEN 1 END) AS revoked_tokens,
  COUNT(CASE WHEN NOT rt.revoked THEN 1 END) AS active_tokens,
  MAX(rt.created_at) AS latest_token_created,
  MAX(rt.updated_at) AS latest_token_updated
FROM auth.refresh_tokens rt
JOIN auth.sessions s ON s.id = rt.session_id
JOIN auth.users u ON u.id = rt.user_id
GROUP BY rt.session_id, u.email
ORDER BY latest_token_created DESC
LIMIT 20;

-- ============================================================
-- 5. DETECT SINGLE-SESSION BEHAVIOR
--    Checks if sessions are being systematically replaced
-- ============================================================
WITH session_pairs AS (
  SELECT
    u.email,
    s.id AS session_id,
    s.created_at,
    s.not_after,
    LAG(s.not_after) OVER (PARTITION BY s.user_id ORDER BY s.created_at) AS prev_session_expired_at,
    LAG(s.created_at) OVER (PARTITION BY s.user_id ORDER BY s.created_at) AS prev_session_created_at
  FROM auth.sessions s
  JOIN auth.users u ON u.id = s.user_id
)
SELECT
  email,
  session_id,
  created_at AS new_session_created,
  prev_session_expired_at AS old_session_killed_at,
  CASE
    WHEN prev_session_expired_at IS NOT NULL
      AND ABS(EXTRACT(EPOCH FROM (prev_session_expired_at - created_at))) < 60
    THEN '🔴 OLD SESSION KILLED WHEN NEW ONE CREATED (single-session mode!)'
    WHEN prev_session_expired_at IS NOT NULL
      AND prev_session_expired_at < created_at
    THEN '🟡 Old session expired before new login'
    ELSE '🟢 Normal'
  END AS diagnosis
FROM session_pairs
WHERE prev_session_created_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- 6. SUMMARY & RECOMMENDATION
-- ============================================================
SELECT '--- DIAGNOSTIC SUMMARY ---' AS info
UNION ALL
SELECT 'Total users: ' || COUNT(DISTINCT id)::text FROM auth.users
UNION ALL
SELECT 'Total sessions: ' || COUNT(*)::text FROM auth.sessions
UNION ALL
SELECT 'Active sessions: ' || COUNT(*)::text FROM auth.sessions WHERE not_after IS NULL OR not_after > NOW()
UNION ALL
SELECT 'Max sessions per user: ' || COALESCE(MAX(cnt)::text, '0') FROM (
  SELECT COUNT(*) AS cnt FROM auth.sessions WHERE not_after IS NULL OR not_after > NOW() GROUP BY user_id
) sub
UNION ALL
SELECT CASE
  WHEN COALESCE(MAX(cnt), 0) <= 1
  THEN '🔴 SINGLE SESSION MODE DETECTED - Check Coolify: SESSIONS_SINGLE_PER_USER'
  ELSE '🟢 Multiple sessions allowed'
END FROM (
  SELECT COUNT(*) AS cnt FROM auth.sessions WHERE not_after IS NULL OR not_after > NOW() GROUP BY user_id
) sub;
