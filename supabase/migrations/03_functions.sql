-- ============================================
-- Functions et Triggers
-- CRM Axivity - Supabase
-- ============================================

-- ============================================
-- TRIGGER: Mise à jour automatique de updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer à toutes les tables avec updated_at
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_projets_updated_at BEFORE UPDATE ON projets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_opportunites_updated_at BEFORE UPDATE ON opportunites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_taches_updated_at BEFORE UPDATE ON taches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_factures_updated_at BEFORE UPDATE ON factures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_connaissances_updated_at BEFORE UPDATE ON connaissances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGER: Création automatique du profil
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'prenom'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TRIGGER: Calcul santé client
-- ============================================

CREATE OR REPLACE FUNCTION calculate_client_health()
RETURNS TRIGGER AS $$
DECLARE
  days_since_interaction INTEGER;
BEGIN
  -- Calculer jours depuis dernière interaction
  IF NEW.derniere_interaction IS NOT NULL THEN
    days_since_interaction := CURRENT_DATE - NEW.derniere_interaction;

    IF days_since_interaction > 90 THEN
      NEW.sante_client := '🔴 À relancer';
    ELSIF days_since_interaction > 60 THEN
      NEW.sante_client := '🟠 Attention';
    ELSIF days_since_interaction > 30 THEN
      NEW.sante_client := '🟡 OK';
    ELSE
      NEW.sante_client := '🟢 Actif';
    END IF;
  ELSE
    NEW.sante_client := '⚪ Nouveau';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_client_health
  BEFORE INSERT OR UPDATE OF derniere_interaction ON clients
  FOR EACH ROW EXECUTE FUNCTION calculate_client_health();

-- ============================================
-- TRIGGER: Mise à jour dernière interaction client
-- ============================================

CREATE OR REPLACE FUNCTION update_client_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients
  SET derniere_interaction = NEW.date
  WHERE id = NEW.client_id
    AND (derniere_interaction IS NULL OR derniere_interaction < NEW.date);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_interaction_update_client
  AFTER INSERT ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_client_last_interaction();

-- ============================================
-- TRIGGER: Mise à jour heures passées projet
-- ============================================

CREATE OR REPLACE FUNCTION update_project_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE projets
    SET heures_passees = COALESCE((
      SELECT SUM(heures) FROM journal_temps WHERE projet_id = OLD.projet_id
    ), 0)
    WHERE id = OLD.projet_id;
    RETURN OLD;
  ELSE
    UPDATE projets
    SET heures_passees = COALESCE((
      SELECT SUM(heures) FROM journal_temps WHERE projet_id = NEW.projet_id
    ), 0)
    WHERE id = NEW.projet_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_journal_temps_update_project
  AFTER INSERT OR UPDATE OR DELETE ON journal_temps
  FOR EACH ROW EXECUTE FUNCTION update_project_hours();

-- ============================================
-- TRIGGER: Mise à jour heures passées tâche
-- ============================================

CREATE OR REPLACE FUNCTION update_task_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.tache_id IS NOT NULL THEN
      UPDATE taches
      SET heures_passees = COALESCE((
        SELECT SUM(heures) FROM journal_temps WHERE tache_id = OLD.tache_id
      ), 0)
      WHERE id = OLD.tache_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.tache_id IS NOT NULL THEN
      UPDATE taches
      SET heures_passees = COALESCE((
        SELECT SUM(heures) FROM journal_temps WHERE tache_id = NEW.tache_id
      ), 0)
      WHERE id = NEW.tache_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_journal_temps_update_task
  AFTER INSERT OR UPDATE OR DELETE ON journal_temps
  FOR EACH ROW EXECUTE FUNCTION update_task_hours();

-- ============================================
-- TRIGGER: Générer numéro facture
-- ============================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  next_number INTEGER;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');

    SELECT COALESCE(MAX(
      CAST(SUBSTRING(numero FROM 6) AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM factures
    WHERE numero LIKE year_prefix || '-%';

    NEW.numero := year_prefix || '-' || LPAD(next_number::TEXT, 4, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_facture_numero
  BEFORE INSERT ON factures
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ============================================
-- FUNCTION: Convertir opportunité en projet
-- ============================================

CREATE OR REPLACE FUNCTION convert_opportunity_to_project(
  p_opportunity_id UUID,
  p_date_debut DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_opp RECORD;
  v_project_id UUID;
BEGIN
  -- Récupérer l'opportunité
  SELECT * INTO v_opp FROM opportunites WHERE id = p_opportunity_id;

  IF v_opp IS NULL THEN
    RAISE EXCEPTION 'Opportunité non trouvée';
  END IF;

  IF v_opp.statut != 'Gagné' THEN
    RAISE EXCEPTION 'L''opportunité doit être en statut Gagné';
  END IF;

  IF v_opp.projet_id IS NOT NULL THEN
    RAISE EXCEPTION 'Un projet existe déjà pour cette opportunité';
  END IF;

  -- Créer le projet
  INSERT INTO projets (
    nom,
    brief,
    client_id,
    statut,
    date_debut,
    budget_initial,
    notes
  ) VALUES (
    v_opp.nom,
    'Projet créé depuis opportunité: ' || v_opp.nom,
    v_opp.client_id,
    'Cadrage',
    p_date_debut,
    v_opp.valeur_estimee,
    v_opp.notes
  )
  RETURNING id INTO v_project_id;

  -- Lier le projet à l'opportunité
  UPDATE opportunites SET projet_id = v_project_id WHERE id = p_opportunity_id;

  -- Mettre à jour le statut du client
  UPDATE clients SET statut = 'Actif' WHERE id = v_opp.client_id AND statut = 'Prospect';

  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Convertir prospect en opportunité
-- ============================================

CREATE OR REPLACE FUNCTION convert_prospect_to_opportunity(
  p_contact_id UUID,
  p_nom TEXT,
  p_valeur_estimee DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_contact RECORD;
  v_opportunity_id UUID;
BEGIN
  -- Récupérer le contact
  SELECT * INTO v_contact FROM contacts WHERE id = p_contact_id;

  IF v_contact IS NULL THEN
    RAISE EXCEPTION 'Contact non trouvé';
  END IF;

  IF v_contact.statut_prospection != 'Qualifié' THEN
    RAISE EXCEPTION 'Le prospect doit être qualifié';
  END IF;

  -- Créer l'opportunité
  INSERT INTO opportunites (
    nom,
    client_id,
    contact_id,
    statut,
    valeur_estimee,
    notes,
    owner_id
  ) VALUES (
    p_nom,
    v_contact.client_id,
    p_contact_id,
    'Qualifié',
    p_valeur_estimee,
    v_contact.notes_prospection,
    v_contact.owner_id
  )
  RETURNING id INTO v_opportunity_id;

  RETURN v_opportunity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: KPIs Dashboard
-- ============================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Activer Realtime sur les tables principales
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE opportunites;
ALTER PUBLICATION supabase_realtime ADD TABLE projets;
ALTER PUBLICATION supabase_realtime ADD TABLE taches;
ALTER PUBLICATION supabase_realtime ADD TABLE factures;
ALTER PUBLICATION supabase_realtime ADD TABLE interactions;
