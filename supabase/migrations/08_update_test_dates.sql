-- ============================================
-- MISE À JOUR DES DATES TEST VERS 2025
-- Pour que les graphiques affichent des données
-- ============================================

-- Mettre à jour les factures avec des dates 2025
UPDATE factures SET
  date_emission = '2025-07-01',
  date_echeance = '2025-07-31',
  date_paiement = '2025-07-28'
WHERE id = 'f1000000-0000-0000-0000-000000000001';

UPDATE factures SET
  date_emission = '2025-09-15',
  date_echeance = '2025-10-15',
  date_paiement = '2025-10-10'
WHERE id = 'f1000000-0000-0000-0000-000000000002';

UPDATE factures SET
  date_emission = '2025-11-15',
  date_echeance = '2025-12-15',
  date_paiement = '2025-12-10'
WHERE id = 'f1000000-0000-0000-0000-000000000003';

UPDATE factures SET
  date_emission = '2025-12-01',
  date_echeance = '2025-12-31',
  date_paiement = NULL
WHERE id = 'f1000000-0000-0000-0000-000000000004';

UPDATE factures SET
  date_emission = '2025-11-15',
  date_echeance = '2025-12-15',
  date_paiement = NULL
WHERE id = 'f1000000-0000-0000-0000-000000000005';

UPDATE factures SET
  date_emission = '2025-12-18',
  date_echeance = '2026-01-18',
  date_paiement = NULL
WHERE id = 'f1000000-0000-0000-0000-000000000006';

-- Mettre à jour les projets avec des dates 2025
UPDATE projets SET
  date_debut = '2025-04-01',
  date_fin_prevue = '2025-07-31',
  date_fin_reelle = '2025-08-15'
WHERE id = 'c1000000-0000-0000-0000-000000000001';

UPDATE projets SET
  date_debut = '2025-10-01',
  date_fin_prevue = '2026-01-31',
  date_fin_reelle = NULL
WHERE id = 'c1000000-0000-0000-0000-000000000002';

UPDATE projets SET
  date_debut = '2025-11-15',
  date_fin_prevue = '2026-03-31',
  date_fin_reelle = NULL
WHERE id = 'c1000000-0000-0000-0000-000000000003';

UPDATE projets SET
  date_debut = '2026-01-15',
  date_fin_prevue = '2026-06-30',
  date_fin_reelle = NULL
WHERE id = 'c1000000-0000-0000-0000-000000000004';

UPDATE projets SET
  date_debut = '2025-09-01',
  date_fin_prevue = '2025-12-31',
  date_fin_reelle = NULL
WHERE id = 'c1000000-0000-0000-0000-000000000005';

-- Mettre à jour les tâches avec des dates 2025
UPDATE taches SET
  date_echeance = '2025-04-15',
  date_terminee = '2025-04-14'
WHERE id = 'e1000000-0000-0000-0000-000000000001';

UPDATE taches SET
  date_echeance = '2025-04-30',
  date_terminee = '2025-04-28'
WHERE id = 'e1000000-0000-0000-0000-000000000002';

UPDATE taches SET
  date_echeance = '2025-06-30',
  date_terminee = '2025-07-05'
WHERE id = 'e1000000-0000-0000-0000-000000000003';

UPDATE taches SET
  date_echeance = '2025-10-15',
  date_terminee = '2025-10-12'
WHERE id = 'e1000000-0000-0000-0000-000000000004';

UPDATE taches SET
  date_echeance = '2025-12-20',
  date_terminee = NULL
WHERE id = 'e1000000-0000-0000-0000-000000000005';

UPDATE taches SET
  date_echeance = '2026-01-10',
  date_terminee = NULL
WHERE id = 'e1000000-0000-0000-0000-000000000006';

UPDATE taches SET
  date_echeance = '2026-01-25',
  date_terminee = NULL
WHERE id = 'e1000000-0000-0000-0000-000000000007';

UPDATE taches SET
  date_echeance = '2025-11-30',
  date_terminee = '2025-12-02'
WHERE id = 'e1000000-0000-0000-0000-000000000008';

UPDATE taches SET
  date_echeance = '2026-01-31',
  date_terminee = NULL
WHERE id = 'e1000000-0000-0000-0000-000000000009';

UPDATE taches SET
  date_echeance = '2026-02-28',
  date_terminee = NULL
WHERE id = 'e1000000-0000-0000-0000-000000000010';

UPDATE taches SET
  date_echeance = '2025-09-30',
  date_terminee = '2025-09-28'
WHERE id = 'e1000000-0000-0000-0000-000000000011';

UPDATE taches SET
  date_echeance = '2025-12-15',
  date_terminee = NULL
WHERE id = 'e1000000-0000-0000-0000-000000000012';

UPDATE taches SET
  date_echeance = '2025-12-20',
  date_terminee = NULL
WHERE id = 'e1000000-0000-0000-0000-000000000013';

UPDATE taches SET
  date_echeance = '2025-12-31',
  date_terminee = NULL
WHERE id = 'e1000000-0000-0000-0000-000000000014';

-- Mettre à jour les opportunités
UPDATE opportunites SET
  date_cloture_prevue = '2026-01-15'
WHERE id = 'd1000000-0000-0000-0000-000000000001';

UPDATE opportunites SET
  date_cloture_prevue = '2026-02-28'
WHERE id = 'd1000000-0000-0000-0000-000000000002';

UPDATE opportunites SET
  date_cloture_prevue = '2026-03-31'
WHERE id = 'd1000000-0000-0000-0000-000000000003';

UPDATE opportunites SET
  date_cloture_prevue = '2026-01-31'
WHERE id = 'd1000000-0000-0000-0000-000000000004';

UPDATE opportunites SET
  date_cloture_prevue = '2025-03-31'
WHERE id = 'd1000000-0000-0000-0000-000000000005';

UPDATE opportunites SET
  date_cloture_prevue = '2025-08-31'
WHERE id = 'd1000000-0000-0000-0000-000000000006';

-- Mettre à jour les interactions (dernières en 2025)
UPDATE interactions SET date = '2025-03-15' WHERE id = '11000000-0000-0000-0000-000000000001';
UPDATE interactions SET date = '2025-03-20' WHERE id = '11000000-0000-0000-0000-000000000002';
UPDATE interactions SET date = '2025-04-02' WHERE id = '11000000-0000-0000-0000-000000000003';
UPDATE interactions SET date = '2025-08-20' WHERE id = '11000000-0000-0000-0000-000000000004';
UPDATE interactions SET date = '2025-12-10' WHERE id = '11000000-0000-0000-0000-000000000005';
UPDATE interactions SET date = '2025-06-01' WHERE id = '11000000-0000-0000-0000-000000000006';
UPDATE interactions SET date = '2025-06-15' WHERE id = '11000000-0000-0000-0000-000000000007';
UPDATE interactions SET date = '2025-11-10' WHERE id = '11000000-0000-0000-0000-000000000008';
UPDATE interactions SET date = '2025-01-08' WHERE id = '11000000-0000-0000-0000-000000000009';
UPDATE interactions SET date = '2025-09-05' WHERE id = '11000000-0000-0000-0000-000000000010';
UPDATE interactions SET date = '2025-11-10' WHERE id = '11000000-0000-0000-0000-000000000011';

-- Mettre à jour dernière interaction clients
UPDATE clients SET derniere_interaction = '2025-12-10' WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE clients SET derniere_interaction = '2025-11-10' WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE clients SET derniere_interaction = NULL WHERE id = 'a1000000-0000-0000-0000-000000000003';
UPDATE clients SET derniere_interaction = '2025-11-10' WHERE id = 'a1000000-0000-0000-0000-000000000004';
UPDATE clients SET derniere_interaction = '2025-09-05' WHERE id = 'a1000000-0000-0000-0000-000000000005';
UPDATE clients SET derniere_interaction = '2024-06-15' WHERE id = 'a1000000-0000-0000-0000-000000000006'; -- >90 jours = santé rouge

-- Mettre à jour date_premier_contact clients
UPDATE clients SET date_premier_contact = '2025-03-15' WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE clients SET date_premier_contact = '2025-06-01' WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE clients SET date_premier_contact = '2025-09-20' WHERE id = 'a1000000-0000-0000-0000-000000000003';
UPDATE clients SET date_premier_contact = '2025-11-10' WHERE id = 'a1000000-0000-0000-0000-000000000004';
UPDATE clients SET date_premier_contact = '2025-01-08' WHERE id = 'a1000000-0000-0000-0000-000000000005';
UPDATE clients SET date_premier_contact = '2024-06-15' WHERE id = 'a1000000-0000-0000-0000-000000000006';

-- Confirmation
SELECT 'Dates mises à jour vers 2025 !' AS message;

-- Vérifier les factures payées
SELECT numero, statut, date_paiement, montant_ht
FROM factures
WHERE statut = 'Payé'
ORDER BY date_paiement;
