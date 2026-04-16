import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolResult } from "../lib/crud.js";
import { getServiceClient } from "../lib/supabase.js";

export function registerEquipeTools(server: McpServer): void {
  server.tool(
    "list_equipe",
    "Liste les membres de l'équipe avec leur rôle.",
    {
      role: z.enum(["admin", "developpeur_nocode", "developpeur_automatisme", "commercial", "client"]).optional(),
      actif: z.boolean().default(true),
    },
    async ({ role, actif }) => {
      const supabase = getServiceClient();
      let query = supabase
        .from("profiles")
        .select("id, email, nom, prenom, role, telephone, poste, actif, avatar_url")
        .eq("actif", actif)
        .order("nom");

      if (role) query = query.eq("role", role);

      const { data, error } = await query;
      if (error) return toolResult({ error: error.message });
      return toolResult({ membres: data, count: data?.length ?? 0 });
    },
  );

  server.tool(
    "get_workload",
    "Affiche la charge de travail actuelle de l'équipe (tâches en cours par membre).",
    {},
    async () => {
      const supabase = getServiceClient();

      const { data: members } = await supabase
        .from("profiles")
        .select("id, nom, prenom, role")
        .eq("actif", true)
        .neq("role", "client");

      if (!members) return toolResult({ error: "Impossible de charger l'équipe" });

      const workload = [];
      for (const member of members) {
        const m = member as { id: string; nom: string; prenom: string; role: string };

        const [tachesRes, tempsRes] = await Promise.all([
          supabase
            .from("taches")
            .select("id, titre, statut, priorite, projet_id, projets(nom)")
            .eq("assignee_id", m.id)
            .neq("statut", "Terminé"),
          supabase
            .from("journal_temps")
            .select("heures")
            .eq("user_id", m.id)
            .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
        ]);

        const heuresSemaine = (tempsRes.data ?? []).reduce(
          (s, e) => s + ((e as { heures: number }).heures ?? 0),
          0,
        );

        workload.push({
          membre: `${m.prenom} ${m.nom}`,
          role: m.role,
          taches_en_cours: tachesRes.data?.length ?? 0,
          taches: tachesRes.data ?? [],
          heures_cette_semaine: heuresSemaine,
        });
      }

      return toolResult(workload);
    },
  );
}
