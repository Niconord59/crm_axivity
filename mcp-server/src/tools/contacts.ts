import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord, toolResult } from "../lib/crud.js";

export function registerContactTools(server: McpServer): void {
  server.tool(
    "list_contacts",
    "Liste les contacts avec filtres (client, statut prospection, lifecycle stage).",
    {
      client_id: z.string().uuid().optional().describe("Filtrer par client"),
      statut_prospection: z.string().optional().describe("Filtrer par statut de prospection"),
      lifecycle_stage: z.enum(["Lead", "MQL", "SQL", "Opportunity", "Customer", "Evangelist", "Churned"]).optional(),
      search: z.string().optional().describe("Recherche par nom/prénom/email"),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    },
    async ({ client_id, statut_prospection, lifecycle_stage, search, limit, offset }) => {
      if (search) {
        const { getServiceClient } = await import("../lib/supabase.js");
        const supabase = getServiceClient();
        const { data, error, count } = await supabase
          .from("contacts")
          .select("*, clients(id, nom)", { count: "exact" })
          .or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,email.ilike.%${search}%`)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return toolResult({ error: error.message });
        return toolResult({ data, count, limit, offset });
      }

      const filters: Record<string, string> = {};
      if (client_id) filters.client_id = client_id;
      if (statut_prospection) filters.statut_prospection = statut_prospection;
      if (lifecycle_stage) filters.lifecycle_stage = lifecycle_stage;

      const result = await listRecords("contacts", {
        filters,
        limit,
        offset,
        select: "*, clients(id, nom)",
      });
      return toolResult(result);
    },
  );

  server.tool(
    "get_contact",
    "Récupère un contact par ID avec son client, ses opportunités et interactions.",
    {
      id: z.string().uuid(),
    },
    async ({ id }) => {
      const data = await getRecord(
        "contacts",
        id,
        "*, clients(id, nom), interactions(*), opportunite_contacts(*, opportunites(id, nom, statut, valeur_estimee))",
      );
      return toolResult(data);
    },
  );

  server.tool(
    "create_contact",
    "Crée un nouveau contact lié à un client.",
    {
      client_id: z.string().uuid().describe("ID du client"),
      nom: z.string(),
      prenom: z.string().optional(),
      email: z.string().email().optional(),
      telephone: z.string().optional(),
      poste: z.string().optional(),
      est_principal: z.boolean().default(false),
      linkedin: z.string().optional(),
      statut_prospection: z.string().optional(),
      source_lead: z.string().optional(),
      lifecycle_stage: z.enum(["Lead", "MQL", "SQL", "Opportunity", "Customer", "Evangelist", "Churned"]).default("Lead"),
      notes_prospection: z.string().optional(),
    },
    async (params) => {
      const data = await createRecord("contacts", {
        ...params,
        lifecycle_stage_changed_at: new Date().toISOString(),
      });
      return toolResult(data);
    },
  );

  server.tool(
    "update_contact",
    "Met à jour un contact existant.",
    {
      id: z.string().uuid(),
      nom: z.string().optional(),
      prenom: z.string().optional(),
      email: z.string().email().optional(),
      telephone: z.string().optional(),
      poste: z.string().optional(),
      est_principal: z.boolean().optional(),
      linkedin: z.string().optional(),
      notes_prospection: z.string().optional(),
    },
    async ({ id, ...updates }) => {
      const payload = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined),
      );
      const data = await updateRecord("contacts", id, payload);
      return toolResult(data);
    },
  );

  server.tool(
    "update_prospect_status",
    "Met à jour le statut de prospection d'un contact avec les champs associés (date_rappel, date_rdv, etc.).",
    {
      id: z.string().uuid(),
      statut_prospection: z.enum([
        "À appeler", "Appelé - pas répondu", "Rappeler",
        "RDV planifié", "RDV effectué", "Qualifié", "Non qualifié", "Perdu",
      ]),
      date_rappel: z.string().optional().describe("Date de rappel (ISO 8601)"),
      date_rdv_prevu: z.string().optional().describe("Date du RDV prévu (ISO 8601)"),
      type_rdv: z.enum(["Visio", "Présentiel"]).optional(),
      lien_visio: z.string().optional(),
    },
    async ({ id, ...updates }) => {
      const data = await updateRecord("contacts", id, updates);
      return toolResult(data);
    },
  );

  server.tool(
    "update_lifecycle_stage",
    "Met à jour le lifecycle stage d'un contact (Lead → MQL → SQL → Opportunity → Customer → Evangelist).",
    {
      id: z.string().uuid(),
      lifecycle_stage: z.enum(["Lead", "MQL", "SQL", "Opportunity", "Customer", "Evangelist", "Churned"]),
    },
    async ({ id, lifecycle_stage }) => {
      const data = await updateRecord("contacts", id, {
        lifecycle_stage,
        lifecycle_stage_changed_at: new Date().toISOString(),
      });
      return toolResult(data);
    },
  );

  server.tool(
    "delete_contact",
    "Supprime un contact.",
    { id: z.string().uuid() },
    async ({ id }) => {
      await deleteRecord("contacts", id);
      return toolResult({ success: true, message: `Contact ${id} supprimé` });
    },
  );
}
