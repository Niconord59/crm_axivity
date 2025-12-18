-- ============================================
-- DONNÉES DE TEST CRM Axivity
-- Pour tester toutes les fonctionnalités frontend
-- ============================================

-- Nettoyer les données existantes (optionnel)
-- TRUNCATE clients, contacts, projets, opportunites, taches, factures, interactions CASCADE;

-- ============================================
-- CLIENTS (6 clients variés)
-- ============================================

INSERT INTO clients (id, nom, type, secteur, statut, site_web, siret, adresse, code_postal, ville, pays, date_premier_contact, notes) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'TechnoVision SAS', 'PME', 'Tech / SaaS', 'Actif', 'https://technovision.fr', '12345678901234', '15 rue de l''Innovation', '75011', 'Paris', 'France', '2024-03-15', 'Client historique, très satisfait des prestations'),
  ('a1000000-0000-0000-0000-000000000002', 'BioSanté Labs', 'ETI', 'Santé / Pharma', 'Actif', 'https://biosante-labs.com', '23456789012345', '42 avenue Pasteur', '69003', 'Lyon', 'France', '2024-06-01', 'Projet en cours de chatbot médical'),
  ('a1000000-0000-0000-0000-000000000003', 'EcoMobility', 'Startup', 'Mobilité / Transport', 'Actif', 'https://ecomobility.io', '34567890123456', '8 place de la Gare', '33000', 'Bordeaux', 'France', '2024-09-20', 'Startup prometteuse, levée de fonds en cours'),
  ('a1000000-0000-0000-0000-000000000004', 'Maison Gourmet', 'PME', 'Agroalimentaire', 'Prospect', 'https://maison-gourmet.fr', '45678901234567', '23 rue du Commerce', '44000', 'Nantes', 'France', '2024-11-10', 'Premier contact salon VivaTech'),
  ('a1000000-0000-0000-0000-000000000005', 'Finance Plus Group', 'Grand Compte', 'Finance / Banque', 'Actif', 'https://financeplus.com', '56789012345678', '1 esplanade de la Défense', '92800', 'Puteaux', 'France', '2024-01-08', 'Groupe international, exigences élevées'),
  ('a1000000-0000-0000-0000-000000000006', 'Association Solidarité', 'Association', 'Non-profit', 'Inactif', 'https://solidarite.org', '67890123456789', '5 rue de la Fraternité', '31000', 'Toulouse', 'France', '2023-06-15', 'Projet terminé, relation à réactiver');

-- ============================================
-- CONTACTS (2-3 par client)
-- ============================================

INSERT INTO contacts (id, client_id, nom, prenom, email, telephone, poste, est_principal, statut_prospection, source_lead, notes_prospection) VALUES
  -- TechnoVision
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Durand', 'Pierre', 'pierre.durand@technovision.fr', '06 12 34 56 78', 'CEO', true, 'Qualifié', 'Recommandation', 'Très réactif, décideur principal'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Martin', 'Claire', 'claire.martin@technovision.fr', '06 23 45 67 89', 'CTO', false, 'Qualifié', 'LinkedIn', 'Contact technique'),

  -- BioSanté Labs
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Lambert', 'Sophie', 'sophie.lambert@biosante-labs.com', '06 34 56 78 90', 'Directrice Innovation', true, 'RDV planifié', 'Site web', 'Projet chatbot en discussion'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Moreau', 'Antoine', 'antoine.moreau@biosante-labs.com', '06 45 67 89 01', 'DSI', false, 'Qualifié', 'Appel entrant', NULL),

  -- EcoMobility
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'Petit', 'Lucas', 'lucas.petit@ecomobility.io', '06 56 78 90 12', 'Fondateur', true, 'Qualifié', 'Salon', 'Rencontré au salon VivaTech'),

  -- Maison Gourmet
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000004', 'Dubois', 'Marie', 'marie.dubois@maison-gourmet.fr', '06 67 89 01 23', 'Responsable Digital', true, 'À appeler', 'Achat liste', 'Lead froid, à qualifier'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000004', 'Lefevre', 'Jean', 'jean.lefevre@maison-gourmet.fr', '06 78 90 12 34', 'DG', false, 'Rappeler', 'Recommandation', 'Pas disponible, rappeler semaine prochaine'),

  -- Finance Plus
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000005', 'Bernard', 'François', 'francois.bernard@financeplus.com', '06 89 01 23 45', 'Directeur Transformation', true, 'Qualifié', 'LinkedIn', 'Budget important validé'),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000005', 'Rousseau', 'Isabelle', 'isabelle.rousseau@financeplus.com', '06 90 12 34 56', 'Chef de Projet', false, 'Qualifié', NULL, 'Contact opérationnel'),

  -- Solidarité
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000006', 'Garcia', 'Carmen', 'carmen.garcia@solidarite.org', '06 01 23 45 67', 'Directrice', true, 'Non qualifié', 'Site web', 'Budget limité');

-- ============================================
-- PROJETS (5 projets variés)
-- ============================================

INSERT INTO projets (id, nom, brief, client_id, statut, date_debut, date_fin_prevue, date_fin_reelle, budget_initial, heures_estimees, heures_passees, montant_facture, priorite, notes) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Chatbot IA Service Client', 'Développement d''un chatbot intelligent pour le service client avec intégration CRM', 'a1000000-0000-0000-0000-000000000001', 'Terminé', '2024-04-01', '2024-07-31', '2024-08-15', 45000.00, 320, 340, 45000.00, 'Haute', 'Projet réussi, client très satisfait'),
  ('c1000000-0000-0000-0000-000000000002', 'Automatisation Process RH', 'Automatisation des workflows RH avec Make et Notion', 'a1000000-0000-0000-0000-000000000001', 'En cours', '2024-10-01', '2025-01-31', NULL, 28000.00, 200, 85, 14000.00, 'Moyenne', 'Phase 2 en cours'),
  ('c1000000-0000-0000-0000-000000000003', 'Assistant Médical IA', 'Chatbot d''aide au diagnostic pour médecins généralistes', 'a1000000-0000-0000-0000-000000000002', 'En cours', '2024-11-15', '2025-03-31', NULL, 65000.00, 450, 120, 20000.00, 'Critique', 'Projet stratégique, certification médicale requise'),
  ('c1000000-0000-0000-0000-000000000004', 'App Mobile Covoiturage', 'MVP application mobile de covoiturage avec IA matching', 'a1000000-0000-0000-0000-000000000003', 'Cadrage', '2025-01-15', '2025-06-30', NULL, 55000.00, 400, 0, 0.00, 'Haute', 'En attente validation budget'),
  ('c1000000-0000-0000-0000-000000000005', 'Dashboard Analytics', 'Tableau de bord temps réel pour analyse financière', 'a1000000-0000-0000-0000-000000000005', 'En cours', '2024-09-01', '2024-12-31', NULL, 35000.00, 250, 180, 25000.00, 'Haute', 'Livraison prévue fin décembre');

-- ============================================
-- OPPORTUNITÉS (6 opportunités variées)
-- ============================================

INSERT INTO opportunites (id, nom, client_id, contact_id, statut, valeur_estimee, probabilite, date_cloture_prevue, notes, projet_id) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Extension Chatbot - Module FAQ', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Négociation', 15000.00, 80, '2025-01-15', 'Devis envoyé, en attente validation', NULL),
  ('d1000000-0000-0000-0000-000000000002', 'Formation IA pour équipe', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'Proposition', 8000.00, 60, '2025-02-28', 'Formation 2 jours sur les outils IA', NULL),
  ('d1000000-0000-0000-0000-000000000003', 'Audit Process Digitaux', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000006', 'Qualifié', 12000.00, 40, '2025-03-31', 'Premier contact, besoin à qualifier', NULL),
  ('d1000000-0000-0000-0000-000000000004', 'Intégration API Bancaire', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000008', 'Négociation', 42000.00, 70, '2025-01-31', 'Projet complexe, sécurité critique', NULL),
  ('d1000000-0000-0000-0000-000000000005', 'Chatbot Service Client TechnoVision', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Gagné', 45000.00, 100, '2024-03-31', 'Converti en projet', 'c1000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000006', 'Site Vitrine Association', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000010', 'Perdu', 5000.00, 0, '2024-08-31', 'Budget insuffisant', NULL);

-- ============================================
-- TÂCHES (variées sur les projets)
-- ============================================

INSERT INTO taches (id, titre, description, projet_id, statut, priorite, date_echeance, heures_estimees, heures_passees, date_terminee) VALUES
  -- Projet Chatbot IA (Terminé)
  ('e1000000-0000-0000-0000-000000000001', 'Analyse des besoins', 'Recueil et formalisation des besoins client', 'c1000000-0000-0000-0000-000000000001', 'Terminé', 'Haute', '2024-04-15', 16, 18, '2024-04-14'),
  ('e1000000-0000-0000-0000-000000000002', 'Architecture technique', 'Conception de l''architecture du chatbot', 'c1000000-0000-0000-0000-000000000001', 'Terminé', 'Haute', '2024-04-30', 24, 22, '2024-04-28'),
  ('e1000000-0000-0000-0000-000000000003', 'Développement core', 'Développement du moteur de conversation', 'c1000000-0000-0000-0000-000000000001', 'Terminé', 'Critique', '2024-06-30', 120, 130, '2024-07-05'),

  -- Projet Automatisation RH (En cours)
  ('e1000000-0000-0000-0000-000000000004', 'Mapping process actuels', 'Documentation des workflows RH existants', 'c1000000-0000-0000-0000-000000000002', 'Terminé', 'Haute', '2024-10-15', 16, 14, '2024-10-12'),
  ('e1000000-0000-0000-0000-000000000005', 'Intégration Make', 'Configuration des scénarios Make', 'c1000000-0000-0000-0000-000000000002', 'En cours', 'Haute', '2024-12-20', 40, 25, NULL),
  ('e1000000-0000-0000-0000-000000000006', 'Tests utilisateurs', 'Validation avec l''équipe RH', 'c1000000-0000-0000-0000-000000000002', 'À faire', 'Moyenne', '2025-01-10', 24, 0, NULL),
  ('e1000000-0000-0000-0000-000000000007', 'Documentation', 'Rédaction de la documentation utilisateur', 'c1000000-0000-0000-0000-000000000002', 'À faire', 'Basse', '2025-01-25', 16, 0, NULL),

  -- Projet Assistant Médical (En cours)
  ('e1000000-0000-0000-0000-000000000008', 'Étude réglementaire', 'Analyse conformité RGPD et certification médicale', 'c1000000-0000-0000-0000-000000000003', 'Terminé', 'Critique', '2024-11-30', 32, 35, '2024-12-02'),
  ('e1000000-0000-0000-0000-000000000009', 'Base de connaissances médicales', 'Construction de la KB médicale', 'c1000000-0000-0000-0000-000000000003', 'En cours', 'Critique', '2025-01-31', 80, 45, NULL),
  ('e1000000-0000-0000-0000-000000000010', 'Interface médecin', 'Développement de l''interface utilisateur', 'c1000000-0000-0000-0000-000000000003', 'À faire', 'Haute', '2025-02-28', 60, 0, NULL),

  -- Projet Dashboard Analytics (En cours)
  ('e1000000-0000-0000-0000-000000000011', 'Connexion sources données', 'API et connecteurs vers les sources', 'c1000000-0000-0000-0000-000000000005', 'Terminé', 'Haute', '2024-09-30', 40, 38, '2024-09-28'),
  ('e1000000-0000-0000-0000-000000000012', 'Développement dashboards', 'Création des tableaux de bord', 'c1000000-0000-0000-0000-000000000005', 'En cours', 'Haute', '2024-12-15', 60, 50, NULL),
  ('e1000000-0000-0000-0000-000000000013', 'Alertes temps réel', 'Système de notifications', 'c1000000-0000-0000-0000-000000000005', 'En revue', 'Moyenne', '2024-12-20', 24, 22, NULL),
  ('e1000000-0000-0000-0000-000000000014', 'Recette finale', 'Tests et validation client', 'c1000000-0000-0000-0000-000000000005', 'À faire', 'Haute', '2024-12-31', 16, 0, NULL);

-- ============================================
-- FACTURES (variées)
-- ============================================

INSERT INTO factures (id, numero, client_id, projet_id, statut, date_emission, date_echeance, montant_ht, taux_tva, date_paiement, niveau_relance, notes) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'FAC-2024-001', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Payé', '2024-05-01', '2024-05-31', 15000.00, 20, '2024-05-28', 0, 'Acompte 30%'),
  ('f1000000-0000-0000-0000-000000000002', 'FAC-2024-002', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Payé', '2024-08-15', '2024-09-15', 30000.00, 20, '2024-09-10', 0, 'Solde projet chatbot'),
  ('f1000000-0000-0000-0000-000000000003', 'FAC-2024-003', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Payé', '2024-10-15', '2024-11-15', 14000.00, 20, '2024-11-10', 0, 'Acompte 50%'),
  ('f1000000-0000-0000-0000-000000000004', 'FAC-2024-004', 'a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'Envoyé', '2024-12-01', '2024-12-31', 20000.00, 20, NULL, 0, 'Acompte 30% projet médical'),
  ('f1000000-0000-0000-0000-000000000005', 'FAC-2024-005', 'a1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 'Envoyé', '2024-11-15', '2024-12-15', 25000.00, 20, NULL, 1, 'Relance J+1 envoyée'),
  ('f1000000-0000-0000-0000-000000000006', 'FAC-2024-006', 'a1000000-0000-0000-0000-000000000005', NULL, 'Brouillon', '2024-12-18', '2025-01-18', 10000.00, 20, NULL, 0, 'Prestation conseil'),
  ('f1000000-0000-0000-0000-000000000007', 'FAC-2024-007', 'a1000000-0000-0000-0000-000000000003', NULL, 'Annulé', '2024-10-01', '2024-10-31', 5000.00, 20, NULL, 0, 'Annulé - report projet');

-- ============================================
-- INTERACTIONS (historique client)
-- ============================================

INSERT INTO interactions (id, client_id, contact_id, type, date, objet, resume) VALUES
  -- TechnoVision
  ('11000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Réunion', '2024-03-15', 'Réunion de découverte', 'Première rencontre, présentation d''Axivity et identification des besoins en automatisation'),
  ('11000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Email', '2024-03-20', 'Envoi proposition commerciale', 'Proposition détaillée pour le chatbot IA service client'),
  ('11000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'Appel', '2024-04-02', 'Kick-off technique', 'Point technique avec le CTO sur l''architecture cible'),
  ('11000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Réunion', '2024-08-20', 'Bilan projet chatbot', 'Bilan très positif, client satisfait. Discussion sur phase 2'),
  ('11000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Email', '2024-12-10', 'Proposition extension FAQ', 'Nouvelle proposition pour module FAQ intelligent'),

  -- BioSanté Labs
  ('11000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'Appel', '2024-06-01', 'Premier contact', 'Contact entrant via le site web, intérêt pour IA médicale'),
  ('11000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'Réunion', '2024-06-15', 'Présentation détaillée', 'Présentation des solutions IA pour le secteur médical'),
  ('11000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'Réunion', '2024-11-10', 'Kick-off projet', 'Lancement officiel du projet assistant médical'),

  -- Finance Plus
  ('11000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000008', 'Réunion', '2024-01-08', 'Découverte besoins', 'Grand groupe, besoins complexes en dashboarding'),
  ('11000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000008', 'Email', '2024-09-05', 'Point projet mensuel', 'Avancement satisfaisant, quelques ajustements demandés'),

  -- Maison Gourmet (prospect)
  ('11000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000006', 'Note', '2024-11-10', 'Lead salon', 'Contact récupéré au salon VivaTech, à recontacter');

-- ============================================
-- MISE À JOUR derniere_interaction clients
-- ============================================

UPDATE clients SET derniere_interaction = '2024-12-10' WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE clients SET derniere_interaction = '2024-11-10' WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE clients SET derniere_interaction = NULL WHERE id = 'a1000000-0000-0000-0000-000000000003';
UPDATE clients SET derniere_interaction = '2024-11-10' WHERE id = 'a1000000-0000-0000-0000-000000000004';
UPDATE clients SET derniere_interaction = '2024-09-05' WHERE id = 'a1000000-0000-0000-0000-000000000005';
UPDATE clients SET derniere_interaction = '2023-06-15' WHERE id = 'a1000000-0000-0000-0000-000000000006'; -- >90 jours = santé rouge

-- ============================================
-- CATALOGUE SERVICES (pour les devis)
-- ============================================

INSERT INTO catalogue_services (id, nom, description, prix_unitaire, unite, categorie, actif) VALUES
  ('22000000-0000-0000-0000-000000000001', 'Audit Process', 'Audit et recommandations process métier', 2500.00, 'jour', 'Conseil', true),
  ('22000000-0000-0000-0000-000000000002', 'Développement Chatbot', 'Développement chatbot IA sur mesure', 5000.00, 'forfait', 'Développement', true),
  ('22000000-0000-0000-0000-000000000003', 'Formation IA', 'Formation équipe aux outils IA', 1500.00, 'jour', 'Formation', true),
  ('22000000-0000-0000-0000-000000000004', 'Automatisation Make/N8N', 'Configuration workflows automatisés', 800.00, 'jour', 'Automatisation', true),
  ('22000000-0000-0000-0000-000000000005', 'Support & Maintenance', 'Support mensuel et maintenance', 500.00, 'mois', 'Support', true);

-- ============================================
-- CONFIRMATION
-- ============================================

SELECT 'Données de test insérées avec succès !' AS message;
SELECT 'Clients: ' || COUNT(*) FROM clients;
SELECT 'Contacts: ' || COUNT(*) FROM contacts;
SELECT 'Projets: ' || COUNT(*) FROM projets;
SELECT 'Opportunités: ' || COUNT(*) FROM opportunites;
SELECT 'Tâches: ' || COUNT(*) FROM taches;
SELECT 'Factures: ' || COUNT(*) FROM factures;
SELECT 'Interactions: ' || COUNT(*) FROM interactions;
SELECT 'Services catalogue: ' || COUNT(*) FROM catalogue_services;
