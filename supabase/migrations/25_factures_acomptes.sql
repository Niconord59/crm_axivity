-- ============================================
-- Migration: Gestion des acomptes (conformité droit français)
-- Spec: docs/specs/011-facturation-acomptes/
-- Article 289 CGI - Facturation des acomptes
-- ============================================

-- 1. Enum type de facture
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'facture_type') THEN
    CREATE TYPE facture_type AS ENUM ('acompte', 'solde', 'unique');
  END IF;
END$$;

-- 2. Nouveaux champs sur factures
-- type_facture: distingue acompte, solde, ou facture unique (100%)
ALTER TABLE factures ADD COLUMN IF NOT EXISTS type_facture facture_type DEFAULT 'unique';

-- pourcentage_acompte: pourcentage du total projet (ex: 30.00 pour 30%)
ALTER TABLE factures ADD COLUMN IF NOT EXISTS pourcentage_acompte DECIMAL(5,2);

-- facture_parent_id: référence à la facture précédente (chaînage acompte → solde)
ALTER TABLE factures ADD COLUMN IF NOT EXISTS facture_parent_id UUID REFERENCES factures(id) ON DELETE SET NULL;

-- montant_total_projet: montant total HT du projet/devis (pour calculs et affichage)
ALTER TABLE factures ADD COLUMN IF NOT EXISTS montant_total_projet DECIMAL(12,2);

-- 3. Index pour les requêtes sur les acomptes
CREATE INDEX IF NOT EXISTS idx_factures_type ON factures(type_facture);
CREATE INDEX IF NOT EXISTS idx_factures_parent ON factures(facture_parent_id);
CREATE INDEX IF NOT EXISTS idx_factures_devis ON factures(devis_id);

-- 4. Commentaires
COMMENT ON COLUMN factures.type_facture IS 'Type: acompte (versement initial), solde (reste dû), unique (paiement intégral)';
COMMENT ON COLUMN factures.pourcentage_acompte IS 'Pourcentage du total projet (ex: 30.00 pour 30%)';
COMMENT ON COLUMN factures.facture_parent_id IS 'Référence à la facture précédente (chaînage acompte → solde)';
COMMENT ON COLUMN factures.montant_total_projet IS 'Montant total HT du projet/devis (pour calculs et affichage)';
