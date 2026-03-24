import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, toolResult } from "../lib/crud.js";

export function registerClientTools(server: McpServer): void {
  server.tool(
    "list_clients",
    "Liste les clients avec filtres optionnels (statut, type, secteur). Retourne les données paginées.",
    {
      statut: z.enum(["Prospect", "Actif", "Inactif", "Churned"]).optional().describe("Filtrer par statut"),
      type: z.enum(["PME", "ETI", "Grand Compte", "Startup", "Association"]).optional().describe("Filtrer par type"),
      search: z.string().optional().describe("Recherche par nom"),
      limit: z.number().min(1).max(100).default(50).describe("Nombre de résultats"),
      offset: z.number().min(0).default(0).describe("Décalage pour la pagination"),
    },
    async ({ statut, type, search, limit, offset }) => {
      const filters: Record<string, string> = {};
      if (statut) filters.statut = statut;
      if (type) filters.type = type;

      // For search, we use ilike on the name
      if (search) {
        const { getServiceClient } = await import("../lib/supabase.js");
        const supabase = getServiceClient();
        const { data, error, count } = await supabase
          .from("clients")
          .select("*", { count: "exact" })
          .ilike("nom", `%${search}%`)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return toolResult({ error: error.message });
        return toolResult({ data, count, limit, offset });
      }

      const result = await listRecords("clients", { filters, limit, offset });
      return toolResult(result);
    },
  );

  server.tool(
    "get_client",
    "Récupère un client par ID avec ses contacts, projets et factures liés.",
    {
      id: z.string().uuid().describe("ID du client"),
    },
    async ({ id }) => {
      const data = await getRecord(
        "clients",
        id,
        "*, contacts(*), projets(*), factures(*), opportunites(*)",
      );
      return toolResult(data);
    },
  );

  server.tool(
    "create_client",
    "Crée un nouveau client dans le CRM.",
    {
      nom: z.string().describe("Nom de l'entreprise"),
      type: z.enum(["PME", "ETI", "Grand Compte", "Startup", "Association"]).optional(),
      statut: z.enum(["Prospect", "Actif", "Inactif", "Churned"]).default("Prospect"),
      secteur: z.string().optional().describe("Secteur d'activité"),
      site_web: z.string().optional(),
      siret: z.string().optional().describe("Numéro SIRET (14 chiffres)"),
      adresse: z.string().optional(),
      code_postal: z.string().optional(),
      ville: z.string().optional(),
      pays: z.string().default("France"),
      notes: z.string().optional(),
    },
    async (params) => {
      const data = await createRecord("clients", {
        ...params,
        date_premier_contact: new Date().toISOString(),
      });
      return toolResult(data);
    },
  );

  server.tool(
    "update_client",
    "Met à jour un client existant.",
    {
      id: z.string().uuid().describe("ID du client"),
      nom: z.string().optional(),
      type: z.enum(["PME", "ETI", "Grand Compte", "Startup", "Association"]).optional(),
      statut: z.enum(["Prospect", "Actif", "Inactif", "Churned"]).optional(),
      secteur: z.string().optional(),
      site_web: z.string().optional(),
      siret: z.string().optional(),
      adresse: z.string().optional(),
      code_postal: z.string().optional(),
      ville: z.string().optional(),
      pays: z.string().optional(),
      notes: z.string().optional(),
    },
    async ({ id, ...updates }) => {
      // Remove undefined values
      const payload = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );
      const data = await updateRecord("clients", id, payload);
      return toolResult(data);
    },
  );

  server.tool(
    "delete_client",
    "Supprime un client (attention: cascade sur contacts, projets, factures).",
    {
      id: z.string().uuid().describe("ID du client à supprimer"),
    },
    async ({ id }) => {
      await deleteRecord("clients", id);
      return toolResult({ success: true, message: `Client ${id} supprimé` });
    },
  );
}
