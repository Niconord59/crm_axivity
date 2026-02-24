-- ============================================================================
-- ROLLBACK P1-01 Phase 2 : Restaurer les tables Internal Only dans public
-- ============================================================================

ALTER TABLE IF EXISTS private.connaissances SET SCHEMA public;
ALTER TABLE IF EXISTS private.accomplissements SET SCHEMA public;
ALTER TABLE IF EXISTS private.demandes_evolution SET SCHEMA public;
ALTER TABLE IF EXISTS private.scenarios_previsionnels SET SCHEMA public;
ALTER TABLE IF EXISTS private.modeles_taches SET SCHEMA public;
ALTER TABLE IF EXISTS private.documents_v2 SET SCHEMA public;
ALTER TABLE IF EXISTS private.partenaires SET SCHEMA public;

DO $$
BEGIN
  RAISE NOTICE '=== ROLLBACK Phase 2 terminé : 7 tables restaurées dans public ===';
END;
$$;
