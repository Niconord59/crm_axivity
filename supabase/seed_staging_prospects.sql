-- ============================================
-- DONNÉES DE TEST PROSPECTION - Staging
-- 5 prospects crédibles pour fgratepanche@axivity.fr
-- À exécuter dans le SQL Editor de staging
-- ============================================

-- Résoudre dynamiquement le user_id + créer le profil si manquant
DO $$
DECLARE
  v_owner_id UUID;
  v_email TEXT := 'fgratepanche@axivity.fr';
BEGIN
  -- Trouver le user_id de fgratepanche@axivity.fr
  SELECT id INTO v_owner_id FROM auth.users WHERE email = v_email;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur % introuvable dans auth.users', v_email;
  END IF;

  RAISE NOTICE 'owner_id trouvé: %', v_owner_id;

  -- Créer le profil s'il n'existe pas (corrige l'erreur 406 sur /profiles)
  INSERT INTO public.profiles (id, email, nom, role)
  VALUES (v_owner_id, v_email, 'fgratepanche', 'admin')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Profil vérifié/créé pour %', v_email;

  -- ============================================
  -- 1. CLIENTS (5 entreprises prospects)
  -- ============================================

  INSERT INTO clients (id, nom, type, secteur, statut, site_web, siret, adresse, code_postal, ville, pays, date_premier_contact, notes, owner_id) VALUES
    ('aa100000-0000-0000-0000-000000000001', 'DataFlow Consulting', 'PME', 'Conseil / Data', 'Prospect',
     'https://dataflow-consulting.fr', '91234567800014', '28 rue de Courcelles', '75008', 'Paris', 'France',
     '2026-02-18', 'Cabinet de conseil spécialisé data & BI (15 consultants). Cherche à automatiser la génération de rapports clients Power BI. Contact via LinkedIn.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000002', 'Groupe Hélios Énergie', 'ETI', 'Énergie / Renouvelable', 'Prospect',
     'https://helios-energie.com', '82345678900023', '15 boulevard Michelet', '13008', 'Marseille', 'France',
     '2026-01-25', 'ETI en forte croissance, 200 salariés, 3 sites de production. Rencontré au salon Energaia à Montpellier. Besoin d''un outil de suivi de chantiers photovoltaïques.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000003', 'Atelier Numérique', 'Startup', 'Agence digitale', 'Prospect',
     'https://atelier-numerique.io', '93456789000032', '12 rue de la Part-Dieu', '69003', 'Lyon', 'France',
     '2026-03-05', 'Petite agence web (8 personnes) recommandée par Lucas Petit d''EcoMobility. Veut un chatbot IA pour qualifier les leads entrants sur les sites de ses clients.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000004', 'Clinique Vétérinaire du Parc', 'PME', 'Santé animale', 'Prospect',
     'https://clinique-vet-duparc.fr', '84567890100041', '45 allée des Demoiselles', '31400', 'Toulouse', 'France',
     '2026-02-03', 'Clinique vétérinaire multi-sites (3 établissements, 12 vétérinaires). Contact entrant via le site web. Cherche à automatiser la prise de RDV et les rappels vaccins par SMS.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000005', 'LogiPro Transport', 'ETI', 'Logistique / Transport', 'Prospect',
     'https://logipro-transport.fr', '75678901200050', 'Zone Industrielle des Près', '59650', 'Villeneuve-d''Ascq', 'France',
     '2026-01-14', 'Transporteur régional, 80 véhicules, 120 chauffeurs. Appel entrant suite à une recommandation de Finance Plus Group. Projet ambitieux de digitalisation des process de livraison.',
     v_owner_id);

  -- ============================================
  -- 2. CONTACTS (1 par entreprise, statuts variés)
  -- ============================================

  INSERT INTO contacts (id, client_id, nom, prenom, email, telephone, poste, est_principal, statut_prospection, date_rappel, date_rdv_prevu, type_rdv, lien_visio, source_lead, notes_prospection, owner_id, lifecycle_stage, linkedin) VALUES
    -- DataFlow: RDV planifié le 17/03, visio
    ('bb100000-0000-0000-0000-000000000001', 'aa100000-0000-0000-0000-000000000001',
     'Carpentier', 'Julien', 'j.carpentier@dataflow-consulting.fr', '06 81 42 73 09',
     'Directeur Data & Analytics', true, 'RDV planifié', NULL, '2026-03-17', 'Visio',
     'https://meet.google.com/abc-defg-hij', 'LinkedIn',
     '[18/02/2026] Contacté via LinkedIn après publication sur l''automatisation BI. Très intéressé par nos solutions de reporting automatisé.
[25/02/2026] Appel de qualification - 15 consultants, utilisent Power BI mais veulent automatiser la génération de rapports mensuels. Budget ~15-20k€.
[05/03/2026] RDV visio calé pour le 17/03 pour démo de notre solution.',
     v_owner_id, 'MQL', 'https://linkedin.com/in/juliencarpentier'),

    -- Hélios: Rappeler mi-mars (budget Q2)
    ('bb100000-0000-0000-0000-000000000002', 'aa100000-0000-0000-0000-000000000002',
     'Vignon', 'Nathalie', 'n.vignon@helios-energie.com', '04 91 55 23 87',
     'Directrice de la Transformation Digitale', true, 'Rappeler', '2026-03-14', NULL, NULL,
     NULL, 'Salon',
     '[25/01/2026] Rencontrée au salon Energaia à Montpellier. Très dynamique, pilote la transformation digitale du groupe. 3 sites de production.
[03/02/2026] Envoi doc commerciale par email. A partagé en interne avec le DSI.
[20/02/2026] Appel - en réunion budget Q2, me rappeler mi-mars pour savoir si le projet est validé.',
     v_owner_id, 'Lead', 'https://linkedin.com/in/nathalie-vignon'),

    -- Atelier Numérique: À appeler (recommandation fraîche)
    ('bb100000-0000-0000-0000-000000000003', 'aa100000-0000-0000-0000-000000000003',
     'Leclerc', 'Romain', 'romain@atelier-numerique.io', '07 62 19 84 33',
     'Co-fondateur & CEO', true, 'À appeler', NULL, NULL, NULL,
     NULL, 'Recommandation',
     '[05/03/2026] Lucas Petit (EcoMobility) m''a recommandé de le contacter. Romain cherche un chatbot IA pour qualifier les leads sur les sites de ses clients. À appeler cette semaine.',
     v_owner_id, 'Lead', NULL),

    -- Clinique Vét: RDV effectué, en attente devis
    ('bb100000-0000-0000-0000-000000000004', 'aa100000-0000-0000-0000-000000000004',
     'Faure', 'Émilie', 'dr.faure@clinique-vet-duparc.fr', '05 61 33 78 42',
     'Directrice - Vétérinaire', true, 'RDV effectué', NULL, '2026-02-27', 'Visio',
     NULL, 'Site web',
     '[03/02/2026] Formulaire site web - cherche solution automatisation RDV + rappels vaccins SMS pour ses 3 cliniques.
[10/02/2026] Appel de qualification - 3 cliniques, 12 vétérinaires, ~800 RDV/mois. Process 100% papier/téléphone actuellement.
[27/02/2026] RDV visio effectué - très bon échange, elle veut un devis pour automatiser prise RDV en ligne + rappels SMS J-1 + rappels vaccins annuels. Budget flexible si ROI démontré.',
     v_owner_id, 'SQL', 'https://linkedin.com/in/emilie-faure-vet'),

    -- LogiPro: Qualifié, proposition envoyée
    ('bb100000-0000-0000-0000-000000000005', 'aa100000-0000-0000-0000-000000000005',
     'Delannoy', 'Marc', 'm.delannoy@logipro-transport.fr', '03 20 67 45 12',
     'Responsable Opérations & SI', true, 'Qualifié', NULL, '2026-01-22', 'Présentiel',
     NULL, 'Appel entrant',
     '[14/01/2026] Appel entrant - recommandé par François Bernard de Finance Plus Group. Besoin de digitaliser les bons de livraison et le suivi chauffeurs.
[22/01/2026] RDV en présentiel dans leurs locaux à Villeneuve-d''Ascq. 80 véhicules, 120 chauffeurs. Process papier à 100%. Gros potentiel.
[05/02/2026] Envoi proposition commerciale - Phase 1: app mobile chauffeurs + scan BL (18k€) / Phase 2: dashboard temps réel (12k€).
[28/02/2026] Retour positif sur la proposition. En attente validation DG (Marc n''est pas le décideur final). Décision attendue fin mars.',
     v_owner_id, 'Opportunity', 'https://linkedin.com/in/marc-delannoy-logistique');

  -- ============================================
  -- 3. INTERACTIONS (historique crédible)
  -- ============================================

  -- === DataFlow Consulting (3 interactions) ===
  INSERT INTO interactions (client_id, contact_id, type, date, objet, resume, user_id) VALUES
    ('aa100000-0000-0000-0000-000000000001', 'bb100000-0000-0000-0000-000000000001',
     'Email', '2026-02-18', 'Prise de contact LinkedIn',
     'Message LinkedIn envoyé suite à sa publication sur l''automatisation des rapports BI. Réponse rapide, intéressé par un échange.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000001', 'bb100000-0000-0000-0000-000000000001',
     'Appel', '2026-02-25', 'Appel de qualification',
     'Appel de 25 min. 15 consultants, utilisent Power BI. Problème : chaque consultant passe 2h/semaine à générer les mêmes rapports manuellement. Budget validé entre 15 et 20k€. Décideur = lui-même + associé.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000001', 'bb100000-0000-0000-0000-000000000001',
     'Email', '2026-03-05', 'Confirmation RDV démo 17/03',
     'Email de confirmation du RDV visio pour le 17 mars. Envoi du lien Google Meet. Julien sera accompagné de son associé Thomas.',
     v_owner_id);

  -- === Groupe Hélios Énergie (3 interactions) ===
  INSERT INTO interactions (client_id, contact_id, type, date, objet, resume, user_id) VALUES
    ('aa100000-0000-0000-0000-000000000002', 'bb100000-0000-0000-0000-000000000002',
     'Réunion', '2026-01-25', 'Rencontre salon Energaia',
     'Échange de 20 min sur le stand. Nathalie pilote la transformation digitale du Groupe Hélios (200 salariés, 3 sites). Besoin d''un outil de suivi chantiers photovoltaïques. Carte de visite récupérée.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000002', 'bb100000-0000-0000-0000-000000000002',
     'Email', '2026-02-03', 'Envoi documentation commerciale',
     'Envoi de notre plaquette + cas d''usage secteur énergie. Elle a répondu qu''elle partagerait en interne avec le DSI.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000002', 'bb100000-0000-0000-0000-000000000002',
     'Appel', '2026-02-20', 'Suivi - point budget Q2',
     'Appel rapide. Nathalie est en pleine réunion budgétaire pour le Q2. Le projet est sur la table mais pas encore validé. Me demande de la rappeler mi-mars.',
     v_owner_id);

  -- === Clinique Vétérinaire du Parc (3 interactions) ===
  INSERT INTO interactions (client_id, contact_id, type, date, objet, resume, user_id) VALUES
    ('aa100000-0000-0000-0000-000000000004', 'bb100000-0000-0000-0000-000000000004',
     'Email', '2026-02-03', 'Demande entrante site web',
     'Formulaire de contact reçu via le site. Dr Faure cherche une solution pour automatiser la prise de RDV et les rappels vaccins par SMS pour ses 3 cliniques vétérinaires.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000004', 'bb100000-0000-0000-0000-000000000004',
     'Appel', '2026-02-10', 'Appel de qualification',
     'Appel de 30 min. 3 cliniques (Toulouse centre, Ramonville, Balma), 12 vétérinaires, ~800 RDV/mois. Tout est géré par téléphone et cahier papier. 2 secrétaires à temps plein juste pour les RDV. Très motivée pour moderniser.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000004', 'bb100000-0000-0000-0000-000000000004',
     'Réunion', '2026-02-27', 'RDV visio - présentation solution',
     'Visio d''1h. Présentation de notre solution d''automatisation RDV + SMS. Très bon échange. Elle veut : 1) prise de RDV en ligne intégrée au site, 2) rappels SMS J-1 automatiques, 3) rappels vaccins annuels automatiques. Budget flexible si on peut démontrer le ROI (économie d''1 secrétaire). Demande un devis.',
     v_owner_id);

  -- === LogiPro Transport (4 interactions) ===
  INSERT INTO interactions (client_id, contact_id, type, date, objet, resume, user_id) VALUES
    ('aa100000-0000-0000-0000-000000000005', 'bb100000-0000-0000-0000-000000000005',
     'Appel', '2026-01-14', 'Appel entrant - recommandation',
     'Appel entrant de Marc Delannoy, recommandé par François Bernard (Finance Plus Group). Transporteur régional, 80 véhicules, 120 chauffeurs. Tout est géré en papier (bons de livraison, feuilles de route). Veut digitaliser.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000005', 'bb100000-0000-0000-0000-000000000005',
     'Réunion', '2026-01-22', 'RDV présentiel - visite locaux',
     'Visite des locaux à Villeneuve-d''Ascq. Vu le dépôt, les process papier en action. Les chauffeurs remplissent des bons de livraison carbone en 3 exemplaires. Marc montre les classeurs de suivi. Potentiel énorme de digitalisation. Discuté Phase 1 (app mobile) et Phase 2 (dashboard).',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000005', 'bb100000-0000-0000-0000-000000000005',
     'Email', '2026-02-05', 'Envoi proposition commerciale',
     'Envoi de la proposition détaillée en 2 phases : Phase 1 app mobile chauffeurs + scan BL (18k€, 3 mois) / Phase 2 dashboard temps réel flotte (12k€, 2 mois). Total 30k€.',
     v_owner_id),

    ('aa100000-0000-0000-0000-000000000005', 'bb100000-0000-0000-0000-000000000005',
     'Appel', '2026-02-28', 'Retour sur proposition',
     'Marc a présenté la proposition au DG. Retour positif, le DG est convaincu par le ROI. Mais il veut valider avec le DAF avant de signer. Décision attendue fin mars. Marc est confiant.',
     v_owner_id);

  -- === Atelier Numérique: PAS d'interaction (lead froid, à appeler) ===

  -- ============================================
  -- 4. OPPORTUNITÉ (seul le prospect "Qualifié" a une opportunité)
  -- ============================================

  INSERT INTO opportunites (id, nom, client_id, contact_id, statut, valeur_estimee, probabilite, date_cloture_prevue, notes, owner_id) VALUES
    ('dd100000-0000-0000-0000-000000000001',
     'Digitalisation bons de livraison - LogiPro',
     'aa100000-0000-0000-0000-000000000005', 'bb100000-0000-0000-0000-000000000005',
     'Négociation', 30000, 65, '2026-04-15',
     'Phase 1: App mobile chauffeurs + scan BL (18k€) / Phase 2: Dashboard temps réel flotte (12k€). En attente validation DG+DAF. Décision fin mars.',
     v_owner_id);

  -- ============================================
  -- 5. LIEN N:N opportunite_contacts (requis pour que la LeadCard détecte l'opportunité)
  -- ============================================

  INSERT INTO opportunite_contacts (opportunite_id, contact_id, role, is_primary) VALUES
    ('dd100000-0000-0000-0000-000000000001', 'bb100000-0000-0000-0000-000000000005', 'Decideur', true);

  -- ============================================
  -- CONFIRMATION
  -- ============================================
  RAISE NOTICE '✅ Profil vérifié/créé';
  RAISE NOTICE '✅ 5 clients prospects insérés';
  RAISE NOTICE '✅ 5 contacts avec statuts variés insérés';
  RAISE NOTICE '✅ 13 interactions historiques insérées';
  RAISE NOTICE '✅ 1 opportunité pipeline + lien N:N insérée (LogiPro - Qualifié)';
  RAISE NOTICE 'owner_id utilisé: %', v_owner_id;

END $$;
