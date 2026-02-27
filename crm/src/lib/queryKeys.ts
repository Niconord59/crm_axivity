// CRM Axivity - Query Keys Factory
// Centralized query keys for React Query cache management
//
// Usage:
//   import { queryKeys } from "@/lib/queryKeys";
//   useQuery({ queryKey: queryKeys.clients.all, ... });
//   useQuery({ queryKey: queryKeys.clients.detail(id), ... });
//   queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });

export const queryKeys = {
  // =========================================================================
  // CLIENTS
  // =========================================================================
  clients: {
    all: ["clients"] as const,
    lists: () => [...queryKeys.clients.all, "list"] as const,
    list: (filters?: { statut?: string; secteur?: string }) =>
      [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },

  // =========================================================================
  // CONTACTS
  // =========================================================================
  contacts: {
    all: ["contacts"] as const,
    lists: () => [...queryKeys.contacts.all, "list"] as const,
    list: (filters?: { clientId?: string }) =>
      [...queryKeys.contacts.lists(), filters] as const,
    details: () => [...queryKeys.contacts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
  },

  // =========================================================================
  // OPPORTUNITES
  // =========================================================================
  opportunites: {
    all: ["opportunites"] as const,
    lists: () => [...queryKeys.opportunites.all, "list"] as const,
    list: (filters?: { statut?: string; clientId?: string }) =>
      [...queryKeys.opportunites.lists(), filters] as const,
    byStatut: () => [...queryKeys.opportunites.all, "par-statut"] as const,
    details: () => [...queryKeys.opportunites.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.opportunites.details(), id] as const,
  },

  // =========================================================================
  // OPPORTUNITE CONTACTS (N:N Pivot Table)
  // =========================================================================
  opportuniteContacts: {
    all: ["opportunite-contacts"] as const,
    lists: () => [...queryKeys.opportuniteContacts.all, "list"] as const,
    byOpportunite: (opportuniteId: string) =>
      [...queryKeys.opportuniteContacts.all, "by-opportunite", opportuniteId] as const,
    byContact: (contactId: string) =>
      [...queryKeys.opportuniteContacts.all, "by-contact", contactId] as const,
    detail: (id: string) =>
      [...queryKeys.opportuniteContacts.all, "detail", id] as const,
  },

  // =========================================================================
  // PROJETS
  // =========================================================================
  projets: {
    all: ["projets"] as const,
    lists: () => [...queryKeys.projets.all, "list"] as const,
    list: (filters?: { statut?: string; clientId?: string }) =>
      [...queryKeys.projets.lists(), filters] as const,
    actifs: (userId?: string) => [...queryKeys.projets.all, "actifs", userId] as const,
    details: () => [...queryKeys.projets.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projets.details(), id] as const,
  },

  // =========================================================================
  // TACHES
  // =========================================================================
  taches: {
    all: ["taches"] as const,
    lists: () => [...queryKeys.taches.all, "list"] as const,
    list: (filters?: { projetId?: string; statut?: string; membreId?: string }) =>
      [...queryKeys.taches.lists(), filters] as const,
    enRetard: (userId?: string) => [...queryKeys.taches.all, "en-retard", userId] as const,
    mesTaches: (membreId?: string) => [...queryKeys.taches.all, "mes-taches", membreId] as const,
    details: () => [...queryKeys.taches.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.taches.details(), id] as const,
  },

  // =========================================================================
  // FACTURES
  // =========================================================================
  factures: {
    all: ["factures"] as const,
    lists: () => [...queryKeys.factures.all, "list"] as const,
    list: (filters?: { statut?: string; clientId?: string; projetId?: string }) =>
      [...queryKeys.factures.lists(), filters] as const,
    impayees: () => [...queryKeys.factures.all, "impayees"] as const,
    aRelancer: () => [...queryKeys.factures.all, "a-relancer"] as const,
    byDevis: (devisId: string | undefined) => [...queryKeys.factures.all, "by-devis", devisId] as const,
    details: () => [...queryKeys.factures.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.factures.details(), id] as const,
  },

  // =========================================================================
  // INTERACTIONS
  // =========================================================================
  interactions: {
    all: ["interactions"] as const,
    lists: () => [...queryKeys.interactions.all, "list"] as const,
    list: (filters?: { contactId?: string; clientId?: string }) =>
      [...queryKeys.interactions.lists(), filters] as const,
    lastDate: (filters?: { contactId?: string; clientId?: string }) =>
      [...queryKeys.interactions.all, "last-date", filters] as const,
    details: () => [...queryKeys.interactions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.interactions.details(), id] as const,
  },

  // =========================================================================
  // DEVIS & LIGNES DE DEVIS
  // =========================================================================
  devis: {
    all: ["devis"] as const,
    lists: () => [...queryKeys.devis.all, "list"] as const,
    list: (filters?: { opportuniteId?: string; clientId?: string; statut?: string; limit?: number }) =>
      [...queryKeys.devis.lists(), filters] as const,
    forOpportunite: (opportuniteId: string) =>
      [...queryKeys.devis.all, "opportunite", opportuniteId] as const,
    details: () => [...queryKeys.devis.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.devis.details(), id] as const,
  },

  lignesDevis: {
    all: ["lignes-devis"] as const,
    list: (opportuniteId: string) =>
      [...queryKeys.lignesDevis.all, opportuniteId] as const,
  },

  // =========================================================================
  // PROSPECTS (CONTACTS EN PROSPECTION)
  // =========================================================================
  prospects: {
    all: ["prospects"] as const,
    lists: () => [...queryKeys.prospects.all, "list"] as const,
    list: (filters?: { statut?: string | string[]; source?: string; dateRappel?: string; search?: string }) =>
      [...queryKeys.prospects.lists(), filters] as const,
    withClients: (filters?: { statut?: string | string[]; source?: string; dateRappel?: string; search?: string }) =>
      [...queryKeys.prospects.all, "with-clients", filters] as const,
    detail: (id: string) =>
      [...queryKeys.prospects.all, "detail", id] as const,
    byClient: (clientId: string) =>
      [...queryKeys.prospects.all, "by-client", clientId] as const,
    kpis: (prospectIds?: string[]) =>
      [...queryKeys.prospects.all, "kpis", prospectIds] as const,
    rappelsAujourdhui: (userId?: string) =>
      [...queryKeys.prospects.all, "rappels-aujourdhui", userId] as const,
    rdvAujourdhui: (userId?: string) =>
      [...queryKeys.prospects.all, "rdv-aujourdhui", userId] as const,
    pastRdv: () =>
      [...queryKeys.prospects.all, "past-rdv"] as const,
    upcomingRdv: () =>
      [...queryKeys.prospects.all, "upcoming-rdv"] as const,
  },

  // =========================================================================
  // EQUIPE
  // =========================================================================
  equipe: {
    all: ["equipe"] as const,
    lists: () => [...queryKeys.equipe.all, "list"] as const,
    list: (filters?: { role?: string }) =>
      [...queryKeys.equipe.lists(), filters] as const,
    charge: () => [...queryKeys.equipe.all, "charge"] as const,
    details: () => [...queryKeys.equipe.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.equipe.details(), id] as const,
  },

  // =========================================================================
  // SERVICES (CATALOGUE)
  // =========================================================================
  services: {
    all: ["services"] as const,
    lists: () => [...queryKeys.services.all, "list"] as const,
    list: (filters?: { categorie?: string; actifOnly?: boolean }) =>
      [...queryKeys.services.lists(), filters] as const,
    categories: () => [...queryKeys.services.all, "categories"] as const,
    details: () => [...queryKeys.services.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.services.details(), id] as const,
  },

  // =========================================================================
  // DASHBOARD
  // =========================================================================
  dashboard: {
    all: ["dashboard"] as const,
    kpis: () => [...queryKeys.dashboard.all, "kpis"] as const,
    projetsRecents: () => [...queryKeys.dashboard.all, "projets-recents"] as const,
    tachesUrgentes: () => [...queryKeys.dashboard.all, "taches-urgentes"] as const,
    lifecycleFunnel: () => [...queryKeys.dashboard.all, "lifecycle-funnel"] as const,
  },

  // =========================================================================
  // CALENDAR
  // =========================================================================
  calendar: {
    all: ["calendar"] as const,
    events: (range?: { start: string; end: string }) =>
      [...queryKeys.calendar.all, "events", range] as const,
    status: () => [...queryKeys.calendar.all, "status"] as const,
  },

  // =========================================================================
  // PROJET MEMBRES
  // =========================================================================
  projetMembres: {
    all: ["projet-membres"] as const,
    lists: () => [...queryKeys.projetMembres.all, "list"] as const,
    list: (projetId: string) =>
      [...queryKeys.projetMembres.lists(), projetId] as const,
    nonAssignes: () => [...queryKeys.projetMembres.all, "non-assignes"] as const,
  },

  // =========================================================================
  // EMAIL TEMPLATES
  // =========================================================================
  emailTemplates: {
    all: ["email-templates"] as const,
    lists: () => [...queryKeys.emailTemplates.all, "list"] as const,
    list: () => [...queryKeys.emailTemplates.lists()] as const,
    details: () => [...queryKeys.emailTemplates.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.emailTemplates.details(), id] as const,
  },

  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================
  notifications: {
    all: ["notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    list: (filters?: { unreadOnly?: boolean }) =>
      [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unread-count"] as const,
  },
} as const;

// Type helpers for query key inference
export type QueryKeys = typeof queryKeys;
