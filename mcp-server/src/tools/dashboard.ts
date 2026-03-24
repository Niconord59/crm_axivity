import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolResult } from "../lib/crud.js";
import { getServiceClient } from "../lib/supabase.js";

export function registerDashboardTools(server: McpServer): void {
  server.tool(
    "get_kpis",
    "Récupère les KPIs principaux du CRM (clients, pipeline, CA, projets).",
    {},
    async () => {
      const supabase = getServiceClient();

      const [
        clientsRes,
        clientsActifsRes,
        oppsRes,
        oppsGagneesRes,
        projetsRes,
        projetsActifsRes,
        facturesRes,
        facturesPayeesRes,
        facturesImpayeesRes,
        tachesRetardRes,
      ] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("statut", "Actif"),
        supabase.from("opportunites").select("valeur_estimee, valeur_ponderee").not("statut", "in", '("Gagné","Perdu")'),
        supabase.from("opportunites").select("valeur_estimee").eq("statut", "Gagné"),
        supabase.from("projets").select("id", { count: "exact", head: true }),
        supabase.from("projets").select("id", { count: "exact", head: true }).eq("statut", "En cours"),
        supabase.from("factures").select("id", { count: "exact", head: true }),
        supabase.from("factures").select("montant_ttc").eq("statut", "Payé"),
        supabase.from("factures").select("montant_ttc").in("statut", ["Envoyé", "En retard"]),
        supabase.from("taches").select("id", { count: "exact", head: true })
          .lt("date_echeance", new Date().toISOString())
          .neq("statut", "Terminé"),
      ]);

      const pipelineValue = (oppsRes.data ?? []).reduce(
        (s, o) => s + ((o as Record<string, number>).valeur_estimee ?? 0), 0,
      );
      const pipelineWeighted = (oppsRes.data ?? []).reduce(
        (s, o) => s + ((o as Record<string, number>).valeur_ponderee ?? 0), 0,
      );
      const caGagne = (oppsGagneesRes.data ?? []).reduce(
        (s, o) => s + ((o as Record<string, number>).valeur_estimee ?? 0), 0,
      );
      const caEncaisse = (facturesPayeesRes.data ?? []).reduce(
        (s, f) => s + ((f as Record<string, number>).montant_ttc ?? 0), 0,
      );
      const impaye = (facturesImpayeesRes.data ?? []).reduce(
        (s, f) => s + ((f as Record<string, number>).montant_ttc ?? 0), 0,
      );

      return toolResult({
        clients: {
          total: clientsRes.count ?? 0,
          actifs: clientsActifsRes.count ?? 0,
        },
        pipeline: {
          opportunites_ouvertes: oppsRes.data?.length ?? 0,
          valeur_totale: pipelineValue,
          valeur_ponderee: pipelineWeighted,
          ca_gagne: caGagne,
        },
        projets: {
          total: projetsRes.count ?? 0,
          en_cours: projetsActifsRes.count ?? 0,
        },
        finance: {
          total_factures: facturesRes.count ?? 0,
          ca_encaisse: caEncaisse,
          impaye_total: impaye,
        },
        alertes: {
          taches_en_retard: tachesRetardRes.count ?? 0,
        },
      });
    },
  );

  server.tool(
    "get_pipeline_value",
    "Récupère la valeur du pipeline par étape.",
    {},
    async () => {
      const supabase = getServiceClient();
      const statuts = ["Qualifié", "Proposition", "Négociation"];

      const results: Record<string, { count: number; value: number; weighted: number }> = {};

      for (const statut of statuts) {
        const { data } = await supabase
          .from("opportunites")
          .select("valeur_estimee, valeur_ponderee")
          .eq("statut", statut);

        const items = data ?? [];
        results[statut] = {
          count: items.length,
          value: items.reduce((s, o) => s + ((o as Record<string, number>).valeur_estimee ?? 0), 0),
          weighted: items.reduce((s, o) => s + ((o as Record<string, number>).valeur_ponderee ?? 0), 0),
        };
      }

      return toolResult(results);
    },
  );

  server.tool(
    "get_lifecycle_funnel",
    "Récupère le funnel lifecycle des contacts (Lead → MQL → SQL → Opportunity → Customer).",
    {},
    async () => {
      const supabase = getServiceClient();
      const stages = ["Lead", "MQL", "SQL", "Opportunity", "Customer", "Evangelist", "Churned"];
      const funnel: Record<string, number> = {};

      for (const stage of stages) {
        const { count } = await supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("lifecycle_stage", stage);
        funnel[stage] = count ?? 0;
      }

      // Conversion rates
      const total = Object.values(funnel).reduce((s, v) => s + v, 0);
      const conversions: Record<string, string> = {};
      for (let i = 1; i < stages.length - 1; i++) {
        const prev = funnel[stages[i - 1]];
        const curr = funnel[stages[i]];
        if (prev > 0) {
          conversions[`${stages[i - 1]} → ${stages[i]}`] = `${Math.round((curr / prev) * 100)}%`;
        }
      }

      return toolResult({ funnel, total_contacts: total, conversion_rates: conversions });
    },
  );

  server.tool(
    "get_revenue_chart",
    "Récupère le CA mensuel (factures payées) pour les N derniers mois.",
    {},
    async () => {
      const supabase = getServiceClient();
      const months = 12;
      const data: { month: string; revenue: number }[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const start = `${year}-${String(month).padStart(2, "0")}-01`;
        const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

        const { data: factures } = await supabase
          .from("factures")
          .select("montant_ttc")
          .eq("statut", "Payé")
          .gte("date_paiement", start)
          .lt("date_paiement", nextMonth);

        const revenue = (factures ?? []).reduce(
          (s, f) => s + ((f as Record<string, number>).montant_ttc ?? 0), 0,
        );

        data.push({
          month: `${year}-${String(month).padStart(2, "0")}`,
          revenue: Math.round(revenue * 100) / 100,
        });
      }

      return toolResult(data);
    },
  );
}
