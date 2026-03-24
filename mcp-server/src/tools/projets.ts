import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, toolResult } from "../lib/crud.js";
import { getServiceClient } from "../lib/supabase.js";

export function registerProjetTools(server: McpServer): void {
  server.tool(
    "list_projets",
    "Liste les projets avec filtres (statut, client, chef de projet).",
    {
      statut: z.enum(["Cadrage", "En cours", "En pause", "Terminé", "Annulé"]).optional(),
      client_id: z.string().uuid().optional(),
      chef_projet_id: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    },
    async ({ statut, client_id, chef_projet_id, limit, offset }) => {
      const filters: Record<string, string> = {};
      if (statut) filters.statut = statut;
      if (client_id) filters.client_id = client_id;
      if (chef_projet_id) filters.chef_projet_id = chef_projet_id;

      const result = await listRecords("projets", {
        filters,
        limit,
        offset,
        select: "*, clients(id, nom), profiles!chef_projet_id(id, nom, prenom)",
      });
      return toolResult(result);
    },
  );

  server.tool(
    "get_projet",
    "Récupère un projet avec tâches, factures, membres, temps passé.",
    { id: z.string().uuid() },
    async ({ id }) => {
      const data = await getRecord(
        "projets",
        id,
        "*, clients(id, nom), taches(*), factures(*), profiles!chef_projet_id(id, nom, prenom)",
      );
      return toolResult(data);
    },
  );

  server.tool(
    "create_projet",
    "Crée un nouveau projet lié à un client.",
    {
      nom: z.string(),
      brief: z.string().optional(),
      client_id: z.string().uuid(),
      statut: z.enum(["Cadrage", "En cours", "En pause", "Terminé", "Annulé"]).default("Cadrage"),
      date_debut: z.string().optional().describe("Date de début (ISO 8601)"),
      date_fin_prevue: z.string().optional(),
      budget_initial: z.number().min(0).optional(),
      heures_estimees: z.number().min(0).optional(),
      chef_projet_id: z.string().uuid().optional(),
      notes: z.string().optional(),
    },
    async (params) => {
      const data = await createRecord("projets", params);
      return toolResult(data);
    },
  );

  server.tool(
    "update_projet",
    "Met à jour un projet existant.",
    {
      id: z.string().uuid(),
      nom: z.string().optional(),
      brief: z.string().optional(),
      statut: z.enum(["Cadrage", "En cours", "En pause", "Terminé", "Annulé"]).optional(),
      date_debut: z.string().optional(),
      date_fin_prevue: z.string().optional(),
      date_fin_reelle: z.string().optional(),
      budget_initial: z.number().min(0).optional(),
      heures_estimees: z.number().min(0).optional(),
      chef_projet_id: z.string().uuid().optional(),
      notes: z.string().optional(),
    },
    async ({ id, ...updates }) => {
      const payload = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );
      const data = await updateRecord("projets", id, payload);
      return toolResult(data);
    },
  );

  server.tool(
    "get_project_progress",
    "Calcule l'avancement d'un projet (% tâches, heures, budget).",
    { id: z.string().uuid() },
    async ({ id }) => {
      const supabase = getServiceClient();

      const [projetRes, tachesRes, tempsRes] = await Promise.all([
        supabase.from("projets").select("*").eq("id", id).single(),
        supabase.from("taches").select("statut").eq("projet_id", id),
        supabase.from("journal_temps").select("heures").eq("projet_id", id),
      ]);

      if (projetRes.error) return toolResult({ error: projetRes.error.message });

      const projet = projetRes.data as Record<string, unknown>;
      const taches = (tachesRes.data ?? []) as { statut: string }[];
      const totalTaches = taches.length;
      const tachesTerminees = taches.filter((t) => t.statut === "Terminé").length;

      const heuresPassees = (tempsRes.data ?? []).reduce(
        (sum, t) => sum + ((t as { heures: number }).heures ?? 0),
        0,
      );

      return toolResult({
        projet: projet.nom,
        statut: projet.statut,
        taches: {
          total: totalTaches,
          terminees: tachesTerminees,
          pourcentage: totalTaches > 0 ? Math.round((tachesTerminees / totalTaches) * 100) : 0,
        },
        heures: {
          estimees: projet.heures_estimees ?? 0,
          passees: heuresPassees,
          pourcentage: (projet.heures_estimees as number) > 0
            ? Math.round((heuresPassees / (projet.heures_estimees as number)) * 100)
            : 0,
        },
        budget: {
          initial: projet.budget_initial ?? 0,
          facture: projet.montant_facture ?? 0,
        },
      });
    },
  );

  server.tool(
    "delete_projet",
    "Supprime un projet.",
    { id: z.string().uuid() },
    async ({ id }) => {
      await deleteRecord("projets", id);
      return toolResult({ success: true, message: `Projet ${id} supprimé` });
    },
  );
}
