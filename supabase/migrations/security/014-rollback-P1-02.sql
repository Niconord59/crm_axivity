-- ============================================================================
-- ROLLBACK P1-02 : Restaurer get_dashboard_kpis sans auth check
-- ============================================================================

-- 1. Restaurer get_dashboard_kpis() sans le check auth.uid()
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'ca_mensuel', (
      SELECT COALESCE(SUM(montant_ht), 0)
      FROM factures
      WHERE statut = 'Payé'
        AND date_paiement >= date_trunc('month', CURRENT_DATE)
    ),
    'pipeline_total', (
      SELECT COALESCE(SUM(valeur_ponderee), 0)
      FROM opportunites
      WHERE statut NOT IN ('Gagné', 'Perdu')
    ),
    'projets_en_cours', (
      SELECT COUNT(*)
      FROM projets
      WHERE statut = 'En cours'
    ),
    'taches_en_retard', (
      SELECT COUNT(*)
      FROM taches
      WHERE statut != 'Terminé'
        AND date_echeance < CURRENT_DATE
    ),
    'prospects_a_appeler', (
      SELECT COUNT(*)
      FROM contacts
      WHERE statut_prospection = 'À appeler'
    ),
    'rappels_du_jour', (
      SELECT COUNT(*)
      FROM contacts
      WHERE statut_prospection = 'Rappeler'
        AND date_rappel = CURRENT_DATE
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 2. Supprimer get_pipeline_kpis()
DROP FUNCTION IF EXISTS public.get_pipeline_kpis();

DO $$
BEGIN
  RAISE NOTICE '=== ROLLBACK P1-02 terminé ===';
END;
$$;
