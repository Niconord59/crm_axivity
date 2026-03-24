import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, toolResult } from "../lib/crud.js";
import { getServiceClient } from "../lib/supabase.js";

export function registerTacheTools(server: McpServer): void {
  server.tool(
    "list_taches",
    "Liste les tâches avec filtres (projet, statut, priorité, assigné).",
    {
      projet_id: z.string().uuid().optional(),
      statut: z.enum(["À faire", "En cours", "En revue", "Terminé"]).optional(),
      priorite: z.enum(["Basse", "Moyenne", "Haute", "Critique"]).optional(),
      assignee_id: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    },
    async ({ projet_id, statut, priorite, assignee_id, limit, offset }) => {
      const filters: Record<string, string> = {};
      if (projet_id) filters.projet_id = projet_id;
      if (statut) filters.statut = statut;
      if (priorite) filters.priorite = priorite;
      if (assignee_id) filters.assignee_id = assignee_id;

      const result = await listRecords("taches", {
        filters,
        limit,
        offset,
        select: "*, projets(id, nom), profiles!assignee_id(id, nom, prenom)",
        orderBy: "ordre",
        ascending: true,
      });
      return toolResult(result);
    },
  );

  server.tool(
    "get_tache",
    "Récupère une tâche avec son projet et le temps passé.",
    { id: z.string().uuid() },
    async ({ id }) => {
      const data = await getRecord(
        "taches",
        id,
        "*, projets(id, nom), profiles!assignee_id(id, nom, prenom), journal_temps(*)",
      );
      return toolResult(data);
    },
  );

  server.tool(
    "create_tache",
    "Crée une nouvelle tâche dans un projet.",
    {
      titre: z.string(),
      description: z.string().optional(),
      projet_id: z.string().uuid(),
      statut: z.enum(["À faire", "En cours", "En revue", "Terminé"]).default("À faire"),
      priorite: z.enum(["Basse", "Moyenne", "Haute", "Critique"]).default("Moyenne"),
      assignee_id: z.string().uuid().optional(),
      date_echeance: z.string().optional().describe("Date d'échéance (ISO 8601)"),
      heures_estimees: z.number().min(0).optional(),
    },
    async (params) => {
      const data = await createRecord("taches", params);
      return toolResult(data);
    },
  );

  server.tool(
    "update_tache",
    "Met à jour une tâche (statut, priorité, assignation, etc.).",
    {
      id: z.string().uuid(),
      titre: z.string().optional(),
      description: z.string().optional(),
      statut: z.enum(["À faire", "En cours", "En revue", "Terminé"]).optional(),
      priorite: z.enum(["Basse", "Moyenne", "Haute", "Critique"]).optional(),
      assignee_id: z.string().uuid().optional(),
      date_echeance: z.string().optional(),
      heures_estimees: z.number().min(0).optional(),
    },
    async ({ id, ...updates }) => {
      const payload = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );
      const data = await updateRecord("taches", id, payload);
      return toolResult(data);
    },
  );

  server.tool(
    "list_taches_en_retard",
    "Liste les tâches en retard (date d'échéance passée et non terminées).",
    {
      assignee_id: z.string().uuid().optional().describe("Filtrer par assigné"),
    },
    async ({ assignee_id }) => {
      const supabase = getServiceClient();
      let query = supabase
        .from("taches")
        .select("*, projets(id, nom), profiles!assignee_id(id, nom, prenom)")
        .lt("date_echeance", new Date().toISOString())
        .neq("statut", "Terminé")
        .order("date_echeance", { ascending: true });

      if (assignee_id) {
        query = query.eq("assignee_id", assignee_id);
      }

      const { data, error } = await query;
      if (error) return toolResult({ error: error.message });
      return toolResult({ data, count: data?.length ?? 0 });
    },
  );

  server.tool(
    "delete_tache",
    "Supprime une tâche.",
    { id: z.string().uuid() },
    async ({ id }) => {
      await deleteRecord("taches", id);
      return toolResult({ success: true, message: `Tâche ${id} supprimée` });
    },
  );
}
