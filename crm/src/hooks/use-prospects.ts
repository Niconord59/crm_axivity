"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";
import type { Contact, ProspectStatus, ProspectSource, RdvType, LifecycleStage } from "@/types";
import {
  mapToContact,
  mapToContactOrThrow,
  mapToContacts,
} from "@/lib/mappers/contact.mapper";

// Summary of a linked opportunity (for display on LeadCard)
export interface ProspectOpportunite {
  id: string;
  nom: string;
  statut: string;
  valeurEstimee?: number;
}

// Extended prospect type with client name and opportunity info
export interface Prospect extends Contact {
  clientNom?: string;
  opportuniteCount?: number;
  opportunites?: ProspectOpportunite[];
  totalValeurPipeline?: number;
}

// Filters for prospects list
export interface ProspectFilters {
  statut?: ProspectStatus | ProspectStatus[];
  source?: ProspectSource;
  lifecycleStage?: LifecycleStage;
  dateRappel?: "today" | "this_week" | "overdue" | "all";
  search?: string;
}

// PRO-H1 — `mapToContact` est maintenant déplacé dans
// `@/lib/mappers/contact.mapper.ts` et validé via Zod au boundary. Les
// enums hors périmètre (statut_prospection inventé, source_lead drift…)
// font émettre un warning et sont ignorés plutôt que de produire un type
// corrompu. Voir aussi `mapToContactOrThrow` pour les queries `.single()`
// et `mapToContacts` pour les listes.

// Get today's date in ISO format (YYYY-MM-DD)
function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// Get date for end of this week (Sunday)
function getEndOfWeek(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + daysUntilSunday);
  return endOfWeek.toISOString().split("T")[0];
}

/**
 * Hook to fetch prospects (contacts with prospection status)
 */
export function useProspects(filters?: ProspectFilters) {
  return useQuery({
    queryKey: queryKeys.prospects.list(filters),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("*")
        .not("statut_prospection", "is", null)
        .order("date_rappel", { ascending: true, nullsFirst: false })
        .order("statut_prospection", { ascending: true });

      // Filter by status
      if (filters?.statut) {
        if (Array.isArray(filters.statut)) {
          query = query.in("statut_prospection", filters.statut);
        } else {
          query = query.eq("statut_prospection", filters.statut);
        }
      }

      // Filter by source
      if (filters?.source) {
        query = query.eq("source_lead", filters.source);
      }

      // Filter by lifecycle stage
      if (filters?.lifecycleStage) {
        query = query.eq("lifecycle_stage", filters.lifecycleStage);
      }

      // Filter by date rappel
      if (filters?.dateRappel && filters.dateRappel !== "all") {
        const today = getToday();

        switch (filters.dateRappel) {
          case "today":
            query = query.eq("date_rappel", today);
            break;
          case "this_week":
            query = query.gte("date_rappel", today).lte("date_rappel", getEndOfWeek());
            break;
          case "overdue":
            query = query
              .not("date_rappel", "is", null)
              .lt("date_rappel", today)
              .eq("statut_prospection", "Rappeler");
            break;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return mapToContacts(data || []);
    },
  });
}

/**
 * Hook to fetch a single prospect
 */
export function useProspect(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.prospects.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("Prospect ID required");

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToContactOrThrow(data);
    },
    enabled: !!id,
  });
}

// PRO-H2 — helpers partagés pour dériver `opportunites` à partir d'une
// jointure Supabase `opportunite_contacts(opportunites(...))`.
function extractOpportunites(
  opportuniteContactsRaw: unknown,
): ProspectOpportunite[] {
  if (!Array.isArray(opportuniteContactsRaw)) return [];

  const opps: ProspectOpportunite[] = [];
  for (const link of opportuniteContactsRaw) {
    if (!link || typeof link !== "object") continue;
    const opp = (link as Record<string, unknown>).opportunites as
      | Record<string, unknown>
      | null;
    if (!opp || typeof opp !== "object") continue;

    const id = typeof opp.id === "string" ? opp.id : null;
    if (!id) continue;
    // Dedup : un même contact peut pointer deux fois la même opportunité
    // via plusieurs rôles.
    if (opps.some((e) => e.id === id)) continue;

    opps.push({
      id,
      nom: typeof opp.nom === "string" ? opp.nom : "",
      statut: typeof opp.statut === "string" ? opp.statut : "",
      valeurEstimee:
        typeof opp.valeur_estimee === "number" ? opp.valeur_estimee : undefined,
    });
  }
  return opps;
}

function extractClientNom(clientsRaw: unknown): string | undefined {
  // Supabase retourne `clients` comme objet unique quand FK many→one.
  if (!clientsRaw || typeof clientsRaw !== "object") return undefined;
  const nom = (clientsRaw as Record<string, unknown>).nom;
  return typeof nom === "string" && nom.length > 0 ? nom : undefined;
}

/**
 * Hook to get prospects with client names and linked opportunities for display.
 *
 * PRO-H2 — Ce hook était auparavant dérivé de `useProspects` et faisait
 * 2 fetchs supplémentaires (clients + opportunite_contacts), avec une
 * queryKey qui n'incluait pas la liste d'IDs prospects → la query
 * d'enrichissement restait obsolète quand le parent refetchait. On passe
 * maintenant par un unique `select(...)` Supabase avec joins, ce qui :
 *  - supprime la cascade de 3 requêtes (1 seule au lieu de 3),
 *  - fait co-varier `clientNom` / `opportunites` avec les prospects
 *    (plus de staleness cross-query),
 *  - conserve la même signature `ProspectFilters` côté appelant.
 */
export function useProspectsWithClients(filters?: ProspectFilters) {
  // `search` est filtré côté client (réactif instantané) — on l'exclut
  // pour ne pas fragmenter le cache React Query par variation de saisie.
  const { search: _search, ...serverFilters } = filters || {};

  return useQuery({
    queryKey: queryKeys.prospects.withClients(serverFilters),
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<Prospect[]> => {
      let query = supabase
        .from("contacts")
        .select(
          "*, clients(id, nom), opportunite_contacts(opportunite_id, opportunites(id, nom, statut, valeur_estimee))",
        )
        .not("statut_prospection", "is", null)
        .order("date_rappel", { ascending: true, nullsFirst: false })
        .order("statut_prospection", { ascending: true });

      if (serverFilters.statut) {
        query = Array.isArray(serverFilters.statut)
          ? query.in("statut_prospection", serverFilters.statut)
          : query.eq("statut_prospection", serverFilters.statut);
      }

      if (serverFilters.source) {
        query = query.eq("source_lead", serverFilters.source);
      }

      if (serverFilters.lifecycleStage) {
        query = query.eq("lifecycle_stage", serverFilters.lifecycleStage);
      }

      if (serverFilters.dateRappel && serverFilters.dateRappel !== "all") {
        const today = getToday();
        switch (serverFilters.dateRappel) {
          case "today":
            query = query.eq("date_rappel", today);
            break;
          case "this_week":
            query = query.gte("date_rappel", today).lte("date_rappel", getEndOfWeek());
            break;
          case "overdue":
            query = query
              .not("date_rappel", "is", null)
              .lt("date_rappel", today)
              .eq("statut_prospection", "Rappeler");
            break;
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as Array<Record<string, unknown>>;
      const prospects: Prospect[] = [];

      for (const row of rows) {
        const contact = mapToContact(row);
        if (!contact) continue;

        const opps = extractOpportunites(row.opportunite_contacts);
        const prospect: Prospect = {
          ...contact,
          clientNom: extractClientNom(row.clients),
          opportuniteCount: opps.length,
          opportunites: opps.length > 0 ? opps : undefined,
          totalValeurPipeline:
            opps.length > 0
              ? opps.reduce((sum, o) => sum + (o.valeurEstimee || 0), 0)
              : undefined,
        };
        prospects.push(prospect);
      }

      return prospects;
    },
  });
}

/**
 * Hook to update prospect status
 */
export function useUpdateProspectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      statut,
      dateRappel,
      dateRdvPrevu,
      typeRdv,
      lienVisio,
      notes,
    }: {
      id: string;
      statut: ProspectStatus;
      dateRappel?: string;
      dateRdvPrevu?: string;
      typeRdv?: RdvType;
      lienVisio?: string;
      notes?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        statut_prospection: statut,
      };

      if (dateRappel !== undefined) {
        updateData.date_rappel = dateRappel || null;
      }

      if (dateRdvPrevu !== undefined) {
        updateData.date_rdv_prevu = dateRdvPrevu || null;
      }

      if (typeRdv !== undefined) {
        updateData.type_rdv = typeRdv || null;
      }

      if (lienVisio !== undefined) {
        updateData.lien_visio = lienVisio || null;
      }

      if (notes !== undefined) {
        updateData.notes_prospection = notes;
      }

      const { data, error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToContactOrThrow(data);
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({ queryKey: queryKeys.prospects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.prospects.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.prospects.kpis() });
    },
  });
}

/**
 * Hook to update a contact (full update, not just status)
 * Used by ContactForm for admin editing
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      nom,
      prenom,
      email,
      telephone,
      poste,
      linkedin,
      estPrincipal,
      clientId,
      statutProspection,
      dateRappel,
      dateRdvPrevu,
      typeRdv,
      lienVisio,
      sourceLead,
      notesProspection,
    }: {
      id: string;
      nom: string;
      prenom?: string;
      email?: string;
      telephone?: string;
      poste?: string;
      linkedin?: string;
      estPrincipal?: boolean;
      clientId?: string;
      statutProspection?: ProspectStatus;
      dateRappel?: string;
      dateRdvPrevu?: string;
      typeRdv?: RdvType;
      lienVisio?: string;
      sourceLead?: ProspectSource;
      notesProspection?: string;
    }) => {
      // Map camelCase form data to snake_case Supabase columns
      // Only include fields that are explicitly provided (not undefined)
      // This allows partial updates without overwriting existing data
      const updateData: Record<string, unknown> = {
        nom,
        updated_at: new Date().toISOString(),
      };

      // Only add fields if they were explicitly passed (including null/empty string)
      if (prenom !== undefined) updateData.prenom = prenom || null;
      if (email !== undefined) updateData.email = email || null;
      if (telephone !== undefined) updateData.telephone = telephone || null;
      if (poste !== undefined) updateData.poste = poste || null;
      if (linkedin !== undefined) updateData.linkedin = linkedin || null;
      if (estPrincipal !== undefined) updateData.est_principal = estPrincipal || false;
      if (clientId !== undefined) updateData.client_id = clientId || null;
      if (statutProspection !== undefined) updateData.statut_prospection = statutProspection || null;
      if (dateRappel !== undefined) updateData.date_rappel = dateRappel || null;
      if (dateRdvPrevu !== undefined) updateData.date_rdv_prevu = dateRdvPrevu || null;
      if (typeRdv !== undefined) updateData.type_rdv = typeRdv || null;
      if (lienVisio !== undefined) updateData.lien_visio = lienVisio || null;
      if (sourceLead !== undefined) updateData.source_lead = sourceLead || null;
      if (notesProspection !== undefined) updateData.notes_prospection = notesProspection || null;

      const { data, error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToContactOrThrow(data);
    },
    onSuccess: async (_, variables) => {
      // PRO-H2 — `useProspectsWithClients` est self-contained (1 seule query
      // avec joins), donc un invalidate prefix sur `prospects.all` suffit à
      // rafraîchir toutes les variantes (liste, with-clients, KPIs, …).
      await queryClient.refetchQueries({ queryKey: queryKeys.prospects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.prospects.detail(variables.id) });
      // Clients aussi si l'association a changé.
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

/**
 * Hook to delete a contact (admin only per RLS policy contacts_delete_admin)
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: queryKeys.prospects.lists() });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.prospects.all, "with-clients"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.prospects.kpis() });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

/**
 * Hook to create a new prospect (creates client if needed, then contact)
 */
export function useCreateProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      // Entreprise
      entreprise,
      clientId: existingClientId,
      secteurActivite,
      siteWeb,
      linkedinPage,
      telephoneEntreprise,
      siret,
      adresse,
      codePostal,
      ville,
      pays,
      // Contact
      nom,
      prenom,
      email,
      telephone,
      role,
      sourceLead,
      notesProspection,
      // Statut initial (optionnel, défaut "À appeler")
      statutProspection,
      dateRappel,
    }: {
      // Entreprise
      entreprise: string;
      clientId?: string;
      secteurActivite?: string;
      siteWeb?: string;
      linkedinPage?: string;
      telephoneEntreprise?: string;
      siret?: string;
      adresse?: string;
      codePostal?: string;
      ville?: string;
      pays?: string;
      // Contact
      nom: string;
      prenom?: string;
      email?: string;
      telephone?: string;
      role?: string;
      sourceLead: ProspectSource;
      notesProspection?: string;
      // Statut initial
      statutProspection?: ProspectStatus;
      dateRappel?: string;
    }) => {
      let clientId: string;

      // 1. Use existing client or create new one
      if (existingClientId) {
        clientId = existingClientId;
      } else {
        // Check if client exists by name
        const { data: existingClients } = await supabase
          .from("clients")
          .select("id")
          .eq("nom", entreprise)
          .limit(1);

        if (existingClients && existingClients.length > 0) {
          clientId = existingClients[0].id;
        } else {
          // Create new client
          const clientData: Record<string, unknown> = {
            nom: entreprise,
            statut: "Prospect",
          };

          if (secteurActivite) clientData.secteur = secteurActivite;
          if (siteWeb) clientData.site_web = siteWeb;
          if (linkedinPage) clientData.linkedin_page = linkedinPage;
          if (telephoneEntreprise) clientData.telephone = telephoneEntreprise;
          if (siret) clientData.siret = siret;
          if (adresse) clientData.adresse = adresse;
          if (codePostal) clientData.code_postal = codePostal;
          if (ville) clientData.ville = ville;
          if (pays) clientData.pays = pays;

          const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert(clientData)
            .select()
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      // 2. Create contact with prospection fields
      const contactData: Record<string, unknown> = {
        nom: nom,
        client_id: clientId,
        statut_prospection: statutProspection || "À appeler",
        source_lead: sourceLead,
      };

      if (prenom) contactData.prenom = prenom;
      if (email) contactData.email = email;
      if (telephone) contactData.telephone = telephone;
      if (role) contactData.poste = role;
      if (notesProspection) contactData.notes_prospection = notesProspection;
      if (dateRappel) contactData.date_rappel = dateRappel;

      const { data: record, error } = await supabase
        .from("contacts")
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;

      return { ...mapToContactOrThrow(record), clientId };
    },
    onSuccess: async () => {
      // Force refetch in correct order (prospects first, then derived queries)
      await queryClient.refetchQueries({ queryKey: queryKeys.prospects.all });
      await queryClient.refetchQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.prospects.kpis() });
    },
  });
}

/**
 * Hook to get prospection KPIs
 */
export function useProspectionKPIs() {
  const { data: prospects } = useProspects();

  return useQuery({
    queryKey: queryKeys.prospects.kpis(prospects?.map(p => p.id)),
    queryFn: async () => {
      if (!prospects) return null;

      const today = getToday();

      // Count by status
      const aAppeler = prospects.filter(p => p.statutProspection === "À appeler").length;
      const rappels = prospects.filter(p => p.statutProspection === "Rappeler").length;
      const qualifies = prospects.filter(p => p.statutProspection === "Qualifié").length;
      const nonQualifies = prospects.filter(p => p.statutProspection === "Non qualifié").length;
      const perdus = prospects.filter(p => p.statutProspection === "Perdu").length;

      // Rappels en retard
      const rappelsEnRetard = prospects.filter(
        p => p.statutProspection === "Rappeler" &&
             p.dateRappel &&
             p.dateRappel < today
      ).length;

      // Taux de qualification
      const totalTermines = qualifies + nonQualifies + perdus;
      const tauxQualification = totalTermines > 0
        ? Math.round((qualifies / totalTermines) * 100)
        : 0;

      return {
        total: prospects.length,
        aAppeler,
        rappels,
        rappelsEnRetard,
        qualifies,
        nonQualifies,
        perdus,
        tauxQualification,
      };
    },
    enabled: !!prospects,
  });
}

/**
 * Hook to fetch prospects with callbacks scheduled for today
 * Returns prospects with status "Rappeler" where dateRappel is today
 */
export function useRappelsAujourdhui(userId?: string) {
  return useQuery({
    queryKey: queryKeys.prospects.rappelsAujourdhui(userId),
    queryFn: async () => {
      const today = getToday();

      let query = supabase
        .from("contacts")
        .select("*")
        .eq("statut_prospection", "Rappeler")
        .eq("date_rappel", today)
        .order("created_at", { ascending: false });

      // Filter by owner if provided
      if (userId) {
        query = query.eq("owner_id", userId);
      }

      const { data: prospects, error } = await query;

      if (error) throw error;

      const mappedProspects = mapToContacts(prospects || []);

      if (mappedProspects.length > 0) {
        const clientIds = [...new Set(
          mappedProspects.flatMap(p => p.client || []).filter(Boolean)
        )];

        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from("clients")
            .select("id, nom")
            .in("id", clientIds);

          const clientMap = new Map<string, string>();
          (clients || []).forEach(c => clientMap.set(c.id, c.nom || ""));

          return mappedProspects.map(prospect => ({
            ...prospect,
            clientNom: prospect.client?.[0] ? clientMap.get(prospect.client[0]) : undefined,
          }));
        }
      }

      return mappedProspects as Prospect[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch RDV scheduled for today
 * Returns prospects with status "RDV planifié" where dateRdvPrevu is today
 */
export function useRdvAujourdhui(userId?: string) {
  return useQuery({
    queryKey: queryKeys.prospects.rdvAujourdhui(userId),
    queryFn: async () => {
      const today = getToday();

      let query = supabase
        .from("contacts")
        .select("*")
        .eq("statut_prospection", "RDV planifié")
        .eq("date_rdv_prevu", today)
        .order("created_at", { ascending: false });

      // Filter by owner if provided
      if (userId) {
        query = query.eq("owner_id", userId);
      }

      const { data: prospects, error } = await query;

      if (error) throw error;

      const mappedProspects = mapToContacts(prospects || []);

      if (mappedProspects.length > 0) {
        const clientIds = [...new Set(
          mappedProspects.flatMap(p => p.client || []).filter(Boolean)
        )];

        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from("clients")
            .select("id, nom")
            .in("id", clientIds);

          const clientMap = new Map<string, string>();
          (clients || []).forEach(c => clientMap.set(c.id, c.nom || ""));

          return mappedProspects.map(prospect => ({
            ...prospect,
            clientNom: prospect.client?.[0] ? clientMap.get(prospect.client[0]) : undefined,
          }));
        }
      }

      return mappedProspects as Prospect[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch prospects with past RDV dates (for notifications)
 * Returns prospects with status "RDV planifié" where dateRdvPrevu < today
 */
export function usePastRdvProspects() {
  return useQuery({
    queryKey: queryKeys.prospects.pastRdv(),
    queryFn: async () => {
      const today = getToday();

      // Fetch prospects with past RDV
      const { data: prospects, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("statut_prospection", "RDV planifié")
        .not("date_rdv_prevu", "is", null)
        .lt("date_rdv_prevu", today)
        .order("date_rdv_prevu", { ascending: true });

      if (error) throw error;

      const mappedProspects = mapToContacts(prospects || []);

      if (mappedProspects.length > 0) {
        // Get unique client IDs
        const clientIds = [...new Set(
          mappedProspects
            .flatMap(p => p.client || [])
            .filter(Boolean)
        )];

        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from("clients")
            .select("id, nom")
            .in("id", clientIds);

          const clientMap = new Map<string, string>();
          (clients || []).forEach(c => {
            clientMap.set(c.id, c.nom || "");
          });

          return mappedProspects.map(prospect => ({
            ...prospect,
            clientNom: prospect.client?.[0]
              ? clientMap.get(prospect.client[0])
              : undefined,
          }));
        }
      }

      return mappedProspects as Prospect[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch upcoming RDV prospects (for agenda view)
 * Returns prospects with status "RDV planifié" where dateRdvPrevu >= today
 */
export function useUpcomingRdvProspects() {
  return useQuery({
    queryKey: queryKeys.prospects.upcomingRdv(),
    queryFn: async () => {
      const today = getToday();

      const { data: prospects, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("statut_prospection", "RDV planifié")
        .not("date_rdv_prevu", "is", null)
        .gte("date_rdv_prevu", today)
        .order("date_rdv_prevu", { ascending: true });

      if (error) throw error;

      const mappedProspects = mapToContacts(prospects || []);

      if (mappedProspects.length > 0) {
        const clientIds = [...new Set(
          mappedProspects
            .flatMap(p => p.client || [])
            .filter(Boolean)
        )];

        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from("clients")
            .select("id, nom")
            .in("id", clientIds);

          const clientMap = new Map<string, string>();
          (clients || []).forEach(c => {
            clientMap.set(c.id, c.nom || "");
          });

          return mappedProspects.map(prospect => ({
            ...prospect,
            clientNom: prospect.client?.[0]
              ? clientMap.get(prospect.client[0])
              : undefined,
          }));
        }
      }

      return mappedProspects as Prospect[];
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all contacts for a specific client
 * Used in Client 360 page to display and edit contacts
 */
export function useContactsByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.prospects.byClient(clientId || ""),
    queryFn: async () => {
      if (!clientId) throw new Error("Client ID required");

      const { data: contacts, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("client_id", clientId)
        .order("est_principal", { ascending: false })
        .order("nom", { ascending: true });

      if (error) throw error;

      return mapToContacts(contacts || []);
    },
    enabled: !!clientId,
  });
}
