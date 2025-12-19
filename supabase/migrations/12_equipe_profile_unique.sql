-- ============================================
-- Add unique constraint on equipe.profile_id
-- This allows upsert on profile_id for team member creation
-- ============================================

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'equipe_profile_id_key'
  ) THEN
    ALTER TABLE equipe ADD CONSTRAINT equipe_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- For existing users who were invited but don't have equipe records,
-- you can manually insert them like this:
-- INSERT INTO equipe (profile_id, nom, email, role, capacite_hebdo)
-- SELECT p.id, CONCAT(p.prenom, ' ', p.nom), p.email, 'Développeur', 35
-- FROM profiles p
-- WHERE p.id NOT IN (SELECT profile_id FROM equipe WHERE profile_id IS NOT NULL)
-- AND p.role IN ('admin', 'developpeur_nocode', 'developpeur_automatisme', 'commercial');
