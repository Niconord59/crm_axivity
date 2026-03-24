import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, createRecord, updateRecord, deleteRecord, toolResult } from "../lib/crud.js";
import { getServiceClient } from "../lib/supabase.js";

export function registerDevisTools(server: McpServer): void {
  server.tool(
    "list_lignes_devis",
    "Liste les lignes de devis d'une opportunité.",
    {
      opportunite_id: z.string().uuid(),
    },
    async ({ opportunite_id }) => {
      const result = await listRecords("lignes_devis", {
        filters: { opportunite_id },
        select: "*, catalogue_services(id, nom, prix_unitaire)",
        orderBy: "created_at",
        ascending: true,
        limit: 100,
      });
      return toolResult(result);
    },
  );

  server.tool(
    "add_ligne_devis",
    "Ajoute une ligne au devis d'une opportunité.",
    {
      opportunite_id: z.string().uuid(),
      service_id: z.string().uuid().optional().describe("ID du service dans le catalogue"),
      description: z.string().describe("Description de la prestation"),
      quantite: z.number().min(0).default(1),
      prix_unitaire: z.number().min(0),
      remise_pourcent: z.number().min(0).max(100).default(0),
    },
    async (params) => {
      const montant_ht = params.quantite * params.prix_unitaire * (1 - params.remise_pourcent / 100);
      const data = await createRecord("lignes_devis", { ...params, montant_ht });
      return toolResult(data);
    },
  );

  server.tool(
    "update_ligne_devis",
    "Met à jour une ligne de devis.",
    {
      id: z.string().uuid(),
      description: z.string().optional(),
      quantite: z.number().min(0).optional(),
      prix_unitaire: z.number().min(0).optional(),
      remise_pourcent: z.number().min(0).max(100).optional(),
    },
    async ({ id, ...updates }) => {
      const payload: Record<string, unknown> = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );

      // Recalculate montant_ht
      if (payload.quantite !== undefined || payload.prix_unitaire !== undefined || payload.remise_pourcent !== undefined) {
        const { getServiceClient: getSC } = await import("../lib/supabase.js");
        const supabase = getSC();
        const { data: current } = await supabase.from("lignes_devis").select("*").eq("id", id).single();
        if (current) {
          const q = (payload.quantite ?? current.quantite) as number;
          const p = (payload.prix_unitaire ?? current.prix_unitaire) as number;
          const r = (payload.remise_pourcent ?? current.remise_pourcent) as number;
          payload.montant_ht = q * p * (1 - r / 100);
        }
      }

      const data = await updateRecord("lignes_devis", id, payload);
      return toolResult(data);
    },
  );

  server.tool(
    "delete_ligne_devis",
    "Supprime une ligne de devis.",
    { id: z.string().uuid() },
    async ({ id }) => {
      await deleteRecord("lignes_devis", id);
      return toolResult({ success: true, message: `Ligne de devis ${id} supprimée` });
    },
  );

  server.tool(
    "calculate_devis_total",
    "Calcule le total d'un devis (somme des lignes HT + TTC).",
    {
      opportunite_id: z.string().uuid(),
      taux_tva: z.number().min(0).max(100).default(20),
    },
    async ({ opportunite_id, taux_tva }) => {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from("lignes_devis")
        .select("montant_ht")
        .eq("opportunite_id", opportunite_id);

      if (error) return toolResult({ error: error.message });

      const totalHT = (data ?? []).reduce(
        (sum, l) => sum + ((l as { montant_ht: number }).montant_ht ?? 0),
        0,
      );
      const totalTTC = totalHT * (1 + taux_tva / 100);

      return toolResult({
        opportunite_id,
        nombre_lignes: data?.length ?? 0,
        total_ht: Math.round(totalHT * 100) / 100,
        taux_tva,
        total_ttc: Math.round(totalTTC * 100) / 100,
      });
    },
  );
}
