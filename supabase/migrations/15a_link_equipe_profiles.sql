-- ============================================
-- Lier les membres de l'équipe à leurs profils
-- CRM Axivity - Supabase
-- ============================================

-- ============================================
-- ÉTAPE 1: Voir l'état actuel (equipe sans profile_id)
-- ============================================
SELECT e.id, e.nom, e.email, e.role AS role_equipe, e.profile_id
FROM equipe e
ORDER BY e.nom;

-- ============================================
-- ÉTAPE 2: Voir les profils disponibles
-- ============================================
SELECT id, email, nom, prenom, role AS role_profile
FROM profiles
ORDER BY nom;

-- ============================================
-- ÉTAPE 3: Prévisualiser les correspondances par email
-- ============================================
SELECT
  e.id AS equipe_id,
  e.nom AS equipe_nom,
  e.email AS equipe_email,
  e.role AS role_equipe,
  p.id AS profile_id,
  p.email AS profile_email,
  p.role AS role_profile
FROM equipe e
LEFT JOIN profiles p ON LOWER(e.email) = LOWER(p.email)
ORDER BY e.nom;

-- ============================================
-- ÉTAPE 4: Mettre à jour les profile_id en matchant par email
-- ============================================
UPDATE equipe e
SET profile_id = p.id
FROM profiles p
WHERE LOWER(e.email) = LOWER(p.email)
  AND e.profile_id IS NULL;

-- ============================================
-- ÉTAPE 5: Vérifier le résultat
-- ============================================
SELECT
  e.id,
  e.nom,
  e.email,
  e.role AS role_legacy,
  p.role AS role_profile
FROM equipe e
LEFT JOIN profiles p ON e.profile_id = p.id
ORDER BY e.nom;

-- ============================================
-- OPTIONNEL: Lier manuellement un membre à un profil
-- (si les emails ne matchent pas)
-- ============================================
-- UPDATE equipe
-- SET profile_id = 'UUID_DU_PROFILE'
-- WHERE id = 'UUID_DU_MEMBRE_EQUIPE';
