import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, createRecord, toolResult } from "../lib/crud.js";
import { getServiceClient } from "../lib/supabase.js";

export function registerJournalTempsTools(server: McpServer): void {
  server.tool(
    "log_time",
    "Enregistre du temps passé sur une tâche/projet.",
    {
      user_id: z.string().uuid(),
      tache_id: z.string().uuid().optional(),
      projet_id: z.string().uuid(),
      date: z.string().optional().describe("Date (ISO 8601, défaut: aujourd'hui)"),
      heures: z.number().min(0.1).describe("Nombre d'heures"),
      description: z.string().describe("Description du travail effectué"),
      facturable: z.boolean().default(true),
    },
    async (params) => {
      const data = await createRecord("journal_temps", {
        ...params,
        date: params.date ?? new Date().toISOString().split("T")[0],
      });
      return toolResult(data);
    },
  );

  server.tool(
    "get_timesheet",
    "Récupère la feuille de temps d'un membre de l'équipe.",
    {
      user_id: z.string().uuid(),
      date_from: z.string().optional().describe("Date de début (ISO 8601)"),
      date_to: z.string().optional().describe("Date de fin (ISO 8601)"),
      limit: z.number().min(1).max(200).default(100),
    },
    async ({ user_id, date_from, date_to, limit }) => {
      const supabase = getServiceClient();
      let query = supabase
        .from("journal_temps")
        .select("*, taches(id, titre), projets(id, nom)")
        .eq("user_id", user_id)
        .order("date", { ascending: false })
        .limit(limit);

      if (date_from) query = query.gte("date", date_from);
      if (date_to) query = query.lte("date", date_to);

      const { data, error } = await query;
      if (error) return toolResult({ error: error.message });

      const totalHeures = (data ?? []).reduce(
        (sum, e) => sum + ((e as Record<string, unknown>).heures as number ?? 0),
        0,
      );

      return toolResult({ entries: data, total_heures: totalHeures, count: data?.length ?? 0 });
    },
  );

  server.tool(
    "get_project_hours",
    "Récupère le total des heures passées sur un projet, par membre.",
    {
      projet_id: z.string().uuid(),
    },
    async ({ projet_id }) => {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from("journal_temps")
        .select("user_id, heures, profiles!user_id(nom, prenom)")
        .eq("projet_id", projet_id);

      if (error) return toolResult({ error: error.message });

      // Aggregate by user
      const byUser = new Map<string, { nom: string; prenom: string; heures: number }>();
      for (const entry of data ?? []) {
        const e = entry as Record<string, unknown>;
        const uid = e.user_id as string;
        const profile = e.profiles as { nom: string; prenom: string } | null;
        const existing = byUser.get(uid);
        if (existing) {
          existing.heures += (e.heures as number) ?? 0;
        } else {
          byUser.set(uid, {
            nom: profile?.nom ?? "",
            prenom: profile?.prenom ?? "",
            heures: (e.heures as number) ?? 0,
          });
        }
      }

      const total = Array.from(byUser.values()).reduce((s, u) => s + u.heures, 0);

      return toolResult({
        projet_id,
        par_membre: Object.fromEntries(byUser),
        total_heures: total,
      });
    },
  );
}
