import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const ENUMS = {
  client_type: ["PME", "ETI", "Grand Compte", "Startup", "Association"],
  client_status: ["Prospect", "Actif", "Inactif", "Churned"],
  opportunity_status: ["Qualifié", "Proposition", "Négociation", "Gagné", "Perdu"],
  project_status: ["Cadrage", "En cours", "En pause", "Terminé", "Annulé"],
  task_status: ["À faire", "En cours", "En revue", "Terminé"],
  task_priority: ["Basse", "Moyenne", "Haute", "Critique"],
  invoice_status: ["Brouillon", "Envoyé", "Payé", "Annulé", "En retard"],
  interaction_type: ["Email", "Appel", "Réunion", "Note", "Autre"],
  prospect_status: [
    "À appeler", "Appelé - pas répondu", "Rappeler",
    "RDV planifié", "RDV effectué", "Qualifié", "Non qualifié", "Perdu",
  ],
  prospect_source: [
    "Appel entrant", "LinkedIn", "Site web", "Salon", "Recommandation", "Achat liste", "Autre",
  ],
  rdv_type: ["Visio", "Présentiel"],
  user_role: ["admin", "developpeur_nocode", "developpeur_automatisme", "commercial", "client"],
  lifecycle_stage: ["Lead", "MQL", "SQL", "Opportunity", "Customer", "Evangelist", "Churned"],
  contact_role: ["Decideur", "Influenceur", "Utilisateur", "Participant"],
  facture_type: ["Facture", "Acompte", "Solde"],
  changelog_type: ["Feature", "Fix", "Breaking", "Improvement"],
  evolution_status: ["Proposé", "Accepté", "En cours", "Terminé", "Rejeté"],
};

export function registerEnumsResource(server: McpServer): void {
  server.resource("crm-enums", "crm://enums", async () => ({
    contents: [
      {
        uri: "crm://enums",
        mimeType: "application/json",
        text: JSON.stringify(ENUMS, null, 2),
      },
    ],
  }));
}
