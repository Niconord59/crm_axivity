import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, toolResult } from "../lib/crud.js";
import { getServiceClient } from "../lib/supabase.js";

export function registerFactureTools(server: McpServer): void {
  server.tool(
    "list_factures",
    "Liste les factures avec filtres (statut, client, projet).",
    {
      statut: z.enum(["Brouillon", "Envoyé", "Payé", "Annulé", "En retard"]).optional(),
      client_id: z.string().uuid().optional(),
      projet_id: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    },
    async ({ statut, client_id, projet_id, limit, offset }) => {
      const filters: Record<string, string> = {};
      if (statut) filters.statut = statut;
      if (client_id) filters.client_id = client_id;
      if (projet_id) filters.projet_id = projet_id;

      const result = await listRecords("factures", {
        filters,
        limit,
        offset,
        select: "*, clients(id, nom), projets(id, nom)",
      });
      return toolResult(result);
    },
  );

  server.tool(
    "get_facture",
    "Récupère une facture par ID avec client et projet.",
    { id: z.string().uuid() },
    async ({ id }) => {
      const data = await getRecord(
        "factures",
        id,
        "*, clients(id, nom, siret, adresse, code_postal, ville), projets(id, nom)",
      );
      return toolResult(data);
    },
  );

  server.tool(
    "create_facture",
    "Crée une nouvelle facture.",
    {
      client_id: z.string().uuid(),
      projet_id: z.string().uuid().optional(),
      statut: z.enum(["Brouillon", "Envoyé", "Payé", "Annulé"]).default("Brouillon"),
      date_emission: z.string().optional().describe("Date d'émission (ISO 8601)"),
      date_echeance: z.string().optional().describe("Date d'échéance (ISO 8601)"),
      montant_ht: z.number().min(0),
      taux_tva: z.number().min(0).max(100).default(20),
      notes: z.string().optional(),
    },
    async (params) => {
      const montant_ttc = params.montant_ht * (1 + params.taux_tva / 100);
      const data = await createRecord("factures", {
        ...params,
        montant_ttc,
        date_emission: params.date_emission ?? new Date().toISOString(),
      });
      return toolResult(data);
    },
  );

  server.tool(
    "update_facture",
    "Met à jour une facture existante.",
    {
      id: z.string().uuid(),
      statut: z.enum(["Brouillon", "Envoyé", "Payé", "Annulé", "En retard"]).optional(),
      montant_ht: z.number().min(0).optional(),
      taux_tva: z.number().min(0).max(100).optional(),
      date_paiement: z.string().optional().describe("Date de paiement effectif"),
      notes: z.string().optional(),
    },
    async ({ id, ...updates }) => {
      const payload: Record<string, unknown> = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );

      // Recalculate TTC if HT or TVA changes
      if (payload.montant_ht !== undefined || payload.taux_tva !== undefined) {
        const current = await getRecord("factures", id) as Record<string, unknown>;
        const ht = (payload.montant_ht ?? current.montant_ht) as number;
        const tva = (payload.taux_tva ?? current.taux_tva) as number;
        payload.montant_ttc = ht * (1 + tva / 100);
      }

      const data = await updateRecord("factures", id, payload);
      return toolResult(data);
    },
  );

  server.tool(
    "list_factures_impayees",
    "Liste les factures impayées (envoyées mais non payées, triées par urgence).",
    {},
    async () => {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from("factures")
        .select("*, clients(id, nom)")
        .in("statut", ["Envoyé", "En retard"])
        .order("date_echeance", { ascending: true });

      if (error) return toolResult({ error: error.message });

      const total = (data ?? []).reduce(
        (sum, f) => sum + ((f as Record<string, unknown>).montant_ttc as number ?? 0),
        0,
      );

      return toolResult({
        factures: data,
        count: data?.length ?? 0,
        total_impaye: total,
      });
    },
  );

  server.tool(
    "delete_facture",
    "Supprime une facture.",
    { id: z.string().uuid() },
    async ({ id }) => {
      await deleteRecord("factures", id);
      return toolResult({ success: true, message: `Facture ${id} supprimée` });
    },
  );
}
