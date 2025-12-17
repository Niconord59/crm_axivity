-- ============================================
-- Schéma de base de données CRM Axivity
-- Migration depuis Airtable vers Supabase
-- ============================================

-- ============================================
-- TYPES ENUM
-- ============================================

CREATE TYPE client_type AS ENUM ('PME', 'ETI', 'Grand Compte', 'Startup', 'Association');
CREATE TYPE client_status AS ENUM ('Prospect', 'Actif', 'Inactif', 'Churned');
CREATE TYPE opportunity_status AS ENUM ('Qualifié', 'Proposition', 'Négociation', 'Gagné', 'Perdu');
CREATE TYPE project_status AS ENUM ('Cadrage', 'En cours', 'En pause', 'Terminé', 'Annulé');
CREATE TYPE task_status AS ENUM ('À faire', 'En cours', 'En revue', 'Terminé');
CREATE TYPE task_priority AS ENUM ('Basse', 'Moyenne', 'Haute', 'Critique');
CREATE TYPE invoice_status AS ENUM ('Brouillon', 'Envoyé', 'Payé', 'Annulé');
CREATE TYPE interaction_type AS ENUM ('Email', 'Appel', 'Réunion', 'Note', 'Autre');
CREATE TYPE prospect_status AS ENUM (
  'À appeler', 'Appelé - pas répondu', 'Rappeler',
  'RDV planifié', 'RDV effectué', 'Qualifié', 'Non qualifié', 'Perdu'
);
CREATE TYPE prospect_source AS ENUM (
  'Appel entrant', 'LinkedIn', 'Site web', 'Salon', 'Recommandation', 'Achat liste', 'Autre'
);
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'commercial', 'membre', 'client');
CREATE TYPE rdv_type AS ENUM ('Visio', 'Présentiel');
CREATE TYPE partner_type AS ENUM ('Freelance', 'Agence', 'Partenaire');
CREATE TYPE changelog_type AS ENUM ('Feature', 'Fix', 'Breaking', 'Improvement');
CREATE TYPE evolution_status AS ENUM ('Proposé', 'Accepté', 'En cours', 'Terminé', 'Rejeté');

-- ============================================
-- TABLE: profiles (extension de auth.users)
-- ============================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'membre',
  telephone TEXT,
  poste TEXT,
  actif BOOLEAN DEFAULT true,
  client_id UUID, -- Pour les utilisateurs de type 'client'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================
-- TABLE: clients (T1)
-- ============================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type client_type,
  secteur TEXT,
  statut client_status DEFAULT 'Prospect',
  site_web TEXT,
  siret TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'France',
  date_premier_contact DATE,
  derniere_interaction DATE,
  sante_client TEXT, -- Calculé via trigger
  notes TEXT,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_statut ON clients(statut);
CREATE INDEX idx_clients_owner ON clients(owner_id);
CREATE INDEX idx_clients_nom ON clients(nom);

-- ============================================
-- TABLE: contacts (T2)
-- ============================================

CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  poste TEXT,
  est_principal BOOLEAN DEFAULT false,
  -- Champs prospection
  statut_prospection prospect_status,
  date_rappel DATE,
  source_lead prospect_source,
  notes_prospection TEXT,
  type_rdv rdv_type,
  lien_visio TEXT,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_client ON contacts(client_id);
CREATE INDEX idx_contacts_statut_prospection ON contacts(statut_prospection);
CREATE INDEX idx_contacts_date_rappel ON contacts(date_rappel);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);

-- ============================================
-- TABLE: interactions (T8)
-- ============================================

CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type interaction_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  resume TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_client ON interactions(client_id);
CREATE INDEX idx_interactions_contact ON interactions(contact_id);
CREATE INDEX idx_interactions_date ON interactions(date DESC);

-- ============================================
-- TABLE: projets (T4)
-- ============================================

CREATE TABLE public.projets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  brief TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  statut project_status DEFAULT 'Cadrage',
  date_debut DATE,
  date_fin_prevue DATE,
  date_fin_reelle DATE,
  budget_initial DECIMAL(12,2),
  heures_estimees DECIMAL(8,2),
  heures_passees DECIMAL(8,2) DEFAULT 0,
  montant_facture DECIMAL(12,2) DEFAULT 0,
  chef_projet_id UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projets_client ON projets(client_id);
CREATE INDEX idx_projets_statut ON projets(statut);
CREATE INDEX idx_projets_chef ON projets(chef_projet_id);

-- ============================================
-- TABLE: opportunites (T3)
-- ============================================

CREATE TABLE public.opportunites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  statut opportunity_status DEFAULT 'Qualifié',
  valeur_estimee DECIMAL(12,2),
  probabilite INTEGER DEFAULT 50 CHECK (probabilite BETWEEN 0 AND 100),
  valeur_ponderee DECIMAL(12,2) GENERATED ALWAYS AS (valeur_estimee * probabilite / 100) STORED,
  date_cloture_prevue DATE,
  notes TEXT,
  projet_id UUID REFERENCES projets(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunites_client ON opportunites(client_id);
CREATE INDEX idx_opportunites_statut ON opportunites(statut);
CREATE INDEX idx_opportunites_owner ON opportunites(owner_id);

-- ============================================
-- TABLE: catalogue_services (T14)
-- ============================================

CREATE TABLE public.catalogue_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  prix_unitaire DECIMAL(10,2),
  unite TEXT DEFAULT 'forfait',
  categorie TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: lignes_devis (T15)
-- ============================================

CREATE TABLE public.lignes_devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunite_id UUID REFERENCES opportunites(id) ON DELETE CASCADE,
  service_id UUID REFERENCES catalogue_services(id) ON DELETE SET NULL,
  description TEXT,
  quantite DECIMAL(10,2) DEFAULT 1,
  prix_unitaire DECIMAL(10,2),
  remise_pourcent DECIMAL(5,2) DEFAULT 0,
  montant_ht DECIMAL(12,2) GENERATED ALWAYS AS (
    quantite * prix_unitaire * (1 - remise_pourcent / 100)
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lignes_devis_opportunite ON lignes_devis(opportunite_id);

-- ============================================
-- TABLE: taches (T5)
-- ============================================

CREATE TABLE public.taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
  statut task_status DEFAULT 'À faire',
  priorite task_priority DEFAULT 'Moyenne',
  assignee_id UUID REFERENCES profiles(id),
  date_echeance DATE,
  heures_estimees DECIMAL(6,2),
  heures_passees DECIMAL(6,2) DEFAULT 0,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_taches_projet ON taches(projet_id);
CREATE INDEX idx_taches_assignee ON taches(assignee_id);
CREATE INDEX idx_taches_statut ON taches(statut);
CREATE INDEX idx_taches_echeance ON taches(date_echeance);

-- ============================================
-- TABLE: modeles_taches (T6)
-- ============================================

CREATE TABLE public.modeles_taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  heures_estimees DECIMAL(6,2),
  categorie TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: factures (T7)
-- ============================================

CREATE TABLE public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  projet_id UUID REFERENCES projets(id) ON DELETE SET NULL,
  statut invoice_status DEFAULT 'Brouillon',
  date_emission DATE,
  date_echeance DATE,
  montant_ht DECIMAL(12,2),
  taux_tva DECIMAL(5,2) DEFAULT 20,
  montant_ttc DECIMAL(12,2) GENERATED ALWAYS AS (
    montant_ht * (1 + taux_tva / 100)
  ) STORED,
  date_paiement DATE,
  niveau_relance INTEGER DEFAULT 0,
  date_derniere_relance DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_factures_client ON factures(client_id);
CREATE INDEX idx_factures_projet ON factures(projet_id);
CREATE INDEX idx_factures_statut ON factures(statut);

-- ============================================
-- TABLE: journal_temps (T9)
-- ============================================

CREATE TABLE public.journal_temps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  tache_id UUID REFERENCES taches(id) ON DELETE SET NULL,
  projet_id UUID REFERENCES projets(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  heures DECIMAL(5,2) NOT NULL CHECK (heures > 0),
  description TEXT,
  facturable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_temps_user ON journal_temps(user_id);
CREATE INDEX idx_journal_temps_projet ON journal_temps(projet_id);
CREATE INDEX idx_journal_temps_date ON journal_temps(date DESC);

-- ============================================
-- TABLE: objectifs (T12)
-- ============================================

CREATE TABLE public.objectifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  periode TEXT, -- Q1 2025, etc.
  proprietaire_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: resultats_cles (T13)
-- ============================================

CREATE TABLE public.resultats_cles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objectif_id UUID REFERENCES objectifs(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  valeur_cible DECIMAL(12,2),
  valeur_actuelle DECIMAL(12,2) DEFAULT 0,
  unite TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resultats_cles_objectif ON resultats_cles(objectif_id);

-- ============================================
-- TABLE: connaissances (T11)
-- ============================================

CREATE TABLE public.connaissances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  contenu TEXT,
  categorie TEXT,
  projet_id UUID REFERENCES projets(id) ON DELETE SET NULL,
  auteur_id UUID REFERENCES profiles(id),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connaissances_projet ON connaissances(projet_id);
CREATE INDEX idx_connaissances_tags ON connaissances USING GIN(tags);

-- ============================================
-- TABLE: feedback_client (T16)
-- ============================================

CREATE TABLE public.feedback_client (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  note INTEGER CHECK (note BETWEEN 1 AND 5),
  commentaire TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_projet ON feedback_client(projet_id);
CREATE INDEX idx_feedback_client ON feedback_client(client_id);

-- ============================================
-- TABLE: partenaires (T17)
-- ============================================

CREATE TABLE public.partenaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type partner_type,
  specialite TEXT,
  email TEXT,
  telephone TEXT,
  tarif_journalier DECIMAL(10,2),
  note_interne INTEGER CHECK (note_interne BETWEEN 1 AND 5),
  actif BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: changelog (T18)
-- ============================================

CREATE TABLE public.changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  auteur_id UUID REFERENCES profiles(id),
  type changelog_type,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: scenarios_previsionnels (T19)
-- ============================================

CREATE TABLE public.scenarios_previsionnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  hypotheses JSONB,
  resultats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: accomplissements (T20)
-- ============================================

CREATE TABLE public.accomplissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  categorie TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accomplissements_user ON accomplissements(user_id);
CREATE INDEX idx_accomplissements_date ON accomplissements(date DESC);

-- ============================================
-- TABLE: demandes_evolution (T21)
-- ============================================

CREATE TABLE public.demandes_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  priorite task_priority DEFAULT 'Moyenne',
  statut evolution_status DEFAULT 'Proposé',
  demandeur_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Ajouter la foreign key client_id dans profiles
-- (pour les utilisateurs de type client)
-- ============================================

ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_client
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
