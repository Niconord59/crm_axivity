import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const CRM_SCHEMA = `# CRM Axivity — Database Schema

## Tables principales

### clients
- id (UUID PK), nom, type (PME|ETI|Grand Compte|Startup|Association)
- statut (Prospect|Actif|Inactif|Churned), secteur, site_web
- siret, adresse, code_postal, ville, pays
- date_premier_contact, derniere_interaction, sante_client
- notes, owner_id (FK profiles), created_at, updated_at

### contacts
- id (UUID PK), client_id (FK clients), nom, prenom, email, telephone, poste
- est_principal (bool), linkedin
- statut_prospection (À appeler|Appelé - pas répondu|Rappeler|RDV planifié|RDV effectué|Qualifié|Non qualifié|Perdu)
- date_rappel, date_rdv_prevu, type_rdv (Visio|Présentiel), lien_visio
- source_lead, notes_prospection
- lifecycle_stage (Lead|MQL|SQL|Opportunity|Customer|Evangelist|Churned)
- lifecycle_stage_changed_at, owner_id (FK profiles), created_at, updated_at

### opportunites
- id (UUID PK), nom, client_id (FK clients), contact_id (FK contacts)
- statut (Qualifié|Proposition|Négociation|Gagné|Perdu)
- valeur_estimee, probabilite (0-100), valeur_ponderee (calculé)
- date_cloture_prevue, notes, projet_id (FK projets)
- owner_id (FK profiles), created_at, updated_at

### opportunite_contacts (N:N pivot)
- id, opportunite_id, contact_id, role (Decideur|Influenceur|Utilisateur|Participant)
- is_primary (bool), created_at, updated_at

### projets
- id (UUID PK), nom, brief, client_id (FK clients)
- statut (Cadrage|En cours|En pause|Terminé|Annulé)
- date_debut, date_fin_prevue, date_fin_reelle
- budget_initial, heures_estimees, heures_passees, montant_facture
- chef_projet_id (FK profiles), notes, feedback_envoye
- created_at, updated_at

### taches
- id (UUID PK), titre, description, projet_id (FK projets)
- statut (À faire|En cours|En revue|Terminé)
- priorite (Basse|Moyenne|Haute|Critique)
- assignee_id (FK profiles), date_echeance
- heures_estimees, heures_passees, ordre
- created_at, updated_at

### factures
- id (UUID PK), numero (UNIQUE), client_id (FK clients), projet_id (FK projets)
- statut (Brouillon|Envoyé|Payé|Annulé|En retard)
- date_emission, date_echeance, montant_ht, taux_tva (def 20%)
- montant_ttc (calculé), date_paiement
- niveau_relance (0-3), date_derniere_relance
- notes, created_at, updated_at

### lignes_devis
- id, opportunite_id (FK opportunites), service_id (FK catalogue_services)
- description, quantite, prix_unitaire, remise_pourcent
- montant_ht (calculé), created_at

### interactions
- id, client_id (FK clients), contact_id (FK contacts)
- type (Email|Appel|Réunion|Note|Autre), date, resume
- user_id (FK profiles), created_at

### journal_temps
- id, user_id (FK profiles), tache_id (FK taches), projet_id (FK projets)
- date, heures (>0), description, facturable (bool), created_at

### catalogue_services
- id, nom, description, prix_unitaire, unite, categorie, actif (bool), created_at

### equipe (via profiles)
- id (UUID PK), email, nom, prenom, avatar_url
- role (admin|developpeur_nocode|developpeur_automatisme|commercial|client)
- telephone, poste, actif (bool), client_id, created_at, updated_at

### connaissances
- id, titre, contenu, categorie, projet_id (FK projets)
- auteur_id (FK profiles), tags (TEXT[]), created_at, updated_at

### objectifs
- id, titre, description, periode, proprietaire_id (FK profiles), created_at

### resultats_cles
- id, objectif_id (FK objectifs), titre, valeur_cible, valeur_actuelle, unite, created_at

### feedback_client
- id, projet_id (FK projets), client_id (FK clients)
- note (1-5), commentaire, date, created_at

### parametres_entreprise
- cle (TEXT PK), valeur (JSONB), updated_at

### email_templates
- id, nom, objet, contenu, variables (TEXT[]), created_by (FK profiles), created_at
`;

export function registerSchemaResource(server: McpServer): void {
  server.resource("crm-schema", "crm://schema", async () => ({
    contents: [
      {
        uri: "crm://schema",
        mimeType: "text/markdown",
        text: CRM_SCHEMA,
      },
    ],
  }));
}
