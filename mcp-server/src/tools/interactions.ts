import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, createRecord, toolResult } from "../lib/crud.js";
import { getServiceClient } from "../lib/supabase.js";

export function registerInteractionTools(server: McpServer): void {
  server.tool(
    "list_interactions",
    "Liste les interactions (emails, appels, réunions, notes) avec filtres.",
    {
      client_id: z.string().uuid().optional(),
      contact_id: z.string().uuid().optional(),
      type: z.enum(["Email", "Appel", "Réunion", "Note", "Autre"]).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    },
    async ({ client_id, contact_id, type, limit, offset }) => {
      const filters: Record<string, string> = {};
      if (client_id) filters.client_id = client_id;
      if (contact_id) filters.contact_id = contact_id;
      if (type) filters.type = type;

      const result = await listRecords("interactions", {
        filters,
        limit,
        offset,
        select: "*, clients(id, nom), contacts(id, nom, prenom), profiles!user_id(id, nom, prenom)",
        orderBy: "date",
      });
      return toolResult(result);
    },
  );

  server.tool(
    "create_interaction",
    "Enregistre une nouvelle interaction (appel, email, réunion, note).",
    {
      client_id: z.string().uuid(),
      contact_id: z.string().uuid().optional(),
      type: z.enum(["Email", "Appel", "Réunion", "Note", "Autre"]),
      date: z.string().optional().describe("Date de l'interaction (ISO 8601, défaut: maintenant)"),
      resume: z.string().describe("Résumé de l'interaction"),
      user_id: z.string().uuid().optional().describe("ID de l'utilisateur qui a fait l'interaction"),
    },
    async (params) => {
      const data = await createRecord("interactions", {
        ...params,
        date: params.date ?? new Date().toISOString(),
      });

      // Update derniere_interaction on client
      const supabase = getServiceClient();
      await supabase
        .from("clients")
        .update({ derniere_interaction: params.date ?? new Date().toISOString() })
        .eq("id", params.client_id);

      return toolResult(data);
    },
  );

  server.tool(
    "get_last_interaction",
    "Récupère la dernière interaction avec un client.",
    {
      client_id: z.string().uuid(),
    },
    async ({ client_id }) => {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from("interactions")
        .select("*, contacts(id, nom, prenom), profiles!user_id(id, nom, prenom)")
        .eq("client_id", client_id)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (error) return toolResult({ error: error.code === "PGRST116" ? "Aucune interaction trouvée" : error.message });
      return toolResult(data);
    },
  );
}
