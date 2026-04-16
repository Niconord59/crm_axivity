import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, createRecord, updateRecord, toolResult } from "../lib/crud.js";

export function registerCatalogueTools(server: McpServer): void {
  server.tool(
    "list_services",
    "Liste le catalogue de services disponibles.",
    {
      categorie: z.string().optional().describe("Filtrer par catégorie"),
      actif: z.boolean().default(true).describe("Afficher uniquement les services actifs"),
    },
    async ({ categorie, actif }) => {
      const filters: Record<string, string | boolean> = { actif };
      if (categorie) filters.categorie = categorie;

      const result = await listRecords("catalogue_services", {
        filters,
        limit: 100,
        orderBy: "categorie",
        ascending: true,
      });
      return toolResult(result);
    },
  );

  server.tool(
    "create_service",
    "Ajoute un nouveau service au catalogue.",
    {
      nom: z.string(),
      description: z.string().optional(),
      prix_unitaire: z.number().min(0),
      unite: z.string().default("forfait"),
      categorie: z.string().optional(),
    },
    async (params) => {
      const data = await createRecord("catalogue_services", { ...params, actif: true });
      return toolResult(data);
    },
  );

  server.tool(
    "update_service",
    "Met à jour un service du catalogue.",
    {
      id: z.string().uuid(),
      nom: z.string().optional(),
      description: z.string().optional(),
      prix_unitaire: z.number().min(0).optional(),
      unite: z.string().optional(),
      categorie: z.string().optional(),
      actif: z.boolean().optional(),
    },
    async ({ id, ...updates }) => {
      const payload = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );
      const data = await updateRecord("catalogue_services", id, payload);
      return toolResult(data);
    },
  );
}
