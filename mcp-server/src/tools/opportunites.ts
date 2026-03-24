import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, toolResult } from "../lib/crud.js";
import { getServiceClient } from "../lib/supabase.js";

export function registerOpportuniteTools(server: McpServer): void {
  server.tool(
    "list_opportunites",
    "Liste les opportunités du pipeline commercial avec filtres.",
    {
      statut: z.enum(["Qualifié", "Proposition", "Négociation", "Gagné", "Perdu"]).optional(),
      client_id: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    },
    async ({ statut, client_id, limit, offset }) => {
      const filters: Record<string, string> = {};
      if (statut) filters.statut = statut;
      if (client_id) filters.client_id = client_id;

      const result = await listRecords("opportunites", {
        filters,
        limit,
        offset,
        select: "*, clients(id, nom), contacts(id, nom, prenom)",
      });
      return toolResult(result);
    },
  );

  server.tool(
    "get_opportunite",
    "Récupère une opportunité avec client, contacts, lignes de devis.",
    { id: z.string().uuid() },
    async ({ id }) => {
      const data = await getRecord(
        "opportunites",
        id,
        "*, clients(id, nom), contacts(id, nom, prenom), lignes_devis(*, catalogue_services(nom)), opportunite_contacts(*, contacts(id, nom, prenom, email, poste))",
      );
      return toolResult(data);
    },
  );

  server.tool(
    "create_opportunite",
    "Crée une nouvelle opportunité dans le pipeline.",
    {
      nom: z.string().describe("Nom de l'opportunité"),
      client_id: z.string().uuid(),
      contact_id: z.string().uuid().optional().describe("Contact principal"),
      statut: z.enum(["Qualifié", "Proposition", "Négociation", "Gagné", "Perdu"]).default("Qualifié"),
      valeur_estimee: z.number().min(0).describe("Valeur estimée en euros"),
      probabilite: z.number().min(0).max(100).default(50).describe("Probabilité de conversion (%)"),
      date_cloture_prevue: z.string().optional().describe("Date de clôture prévue (ISO 8601)"),
      notes: z.string().optional(),
    },
    async (params) => {
      const data = await createRecord("opportunites", {
        ...params,
        valeur_ponderee: params.valeur_estimee * params.probabilite / 100,
      });
      return toolResult(data);
    },
  );

  server.tool(
    "update_opportunite",
    "Met à jour une opportunité existante.",
    {
      id: z.string().uuid(),
      nom: z.string().optional(),
      statut: z.enum(["Qualifié", "Proposition", "Négociation", "Gagné", "Perdu"]).optional(),
      valeur_estimee: z.number().min(0).optional(),
      probabilite: z.number().min(0).max(100).optional(),
      date_cloture_prevue: z.string().optional(),
      notes: z.string().optional(),
    },
    async ({ id, ...updates }) => {
      const payload: Record<string, unknown> = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );

      // Recalculate valeur_ponderee if needed
      if (payload.valeur_estimee !== undefined || payload.probabilite !== undefined) {
        const current = await getRecord("opportunites", id) as Record<string, unknown>;
        const valeur = (payload.valeur_estimee ?? current.valeur_estimee) as number;
        const proba = (payload.probabilite ?? current.probabilite) as number;
        payload.valeur_ponderee = valeur * proba / 100;
      }

      const data = await updateRecord("opportunites", id, payload);
      return toolResult(data);
    },
  );

  server.tool(
    "move_opportunity_stage",
    "Déplace une opportunité vers un nouveau stage du pipeline (Kanban).",
    {
      id: z.string().uuid(),
      statut: z.enum(["Qualifié", "Proposition", "Négociation", "Gagné", "Perdu"]),
    },
    async ({ id, statut }) => {
      const data = await updateRecord("opportunites", id, { statut });
      return toolResult(data);
    },
  );

  server.tool(
    "get_pipeline_kanban",
    "Récupère le pipeline commercial groupé par statut (vue Kanban).",
    {},
    async () => {
      const supabase = getServiceClient();
      const statuts = ["Qualifié", "Proposition", "Négociation", "Gagné", "Perdu"];
      const pipeline: Record<string, unknown[]> = {};
      let totalValue = 0;
      let weightedValue = 0;

      for (const statut of statuts) {
        const { data } = await supabase
          .from("opportunites")
          .select("*, clients(id, nom)")
          .eq("statut", statut)
          .order("created_at", { ascending: false });
        pipeline[statut] = data ?? [];
        for (const opp of data ?? []) {
          const o = opp as Record<string, unknown>;
          totalValue += (o.valeur_estimee as number) ?? 0;
          weightedValue += (o.valeur_ponderee as number) ?? 0;
        }
      }

      return toolResult({
        pipeline,
        summary: {
          total_opportunities: Object.values(pipeline).flat().length,
          total_value: totalValue,
          weighted_value: weightedValue,
        },
      });
    },
  );

  server.tool(
    "delete_opportunite",
    "Supprime une opportunité (cascade: lignes de devis supprimées).",
    { id: z.string().uuid() },
    async ({ id }) => {
      await deleteRecord("opportunites", id);
      return toolResult({ success: true, message: `Opportunité ${id} supprimée` });
    },
  );
}
