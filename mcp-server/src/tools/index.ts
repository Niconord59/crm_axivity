import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerClientTools } from "./clients.js";
import { registerContactTools } from "./contacts.js";
import { registerOpportuniteTools } from "./opportunites.js";
import { registerProjetTools } from "./projets.js";
import { registerTacheTools } from "./taches.js";
import { registerFactureTools } from "./factures.js";
import { registerDevisTools } from "./devis.js";
import { registerInteractionTools } from "./interactions.js";
import { registerJournalTempsTools } from "./journal-temps.js";
import { registerEquipeTools } from "./equipe.js";
import { registerCatalogueTools } from "./catalogue.js";
import { registerDashboardTools } from "./dashboard.js";

export function registerAllTools(server: McpServer): void {
  registerClientTools(server);
  registerContactTools(server);
  registerOpportuniteTools(server);
  registerProjetTools(server);
  registerTacheTools(server);
  registerFactureTools(server);
  registerDevisTools(server);
  registerInteractionTools(server);
  registerJournalTempsTools(server);
  registerEquipeTools(server);
  registerCatalogueTools(server);
  registerDashboardTools(server);
}
