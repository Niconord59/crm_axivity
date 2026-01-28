// CRM Axivity - useOpportuniteContacts Hook Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useOpportuniteContacts,
  useContactOpportunites,
  useAddContactToOpportunite,
  useUpdateOpportuniteContact,
  useRemoveContactFromOpportunite,
  useSetPrimaryContact,
} from "../use-opportunite-contacts";
import { queryKeys } from "@/lib/queryKeys";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Sample test data
const samplePivotRecords = [
  {
    id: "pivot-1",
    opportunite_id: "opp-1",
    contact_id: "contact-1",
    role: "Decideur",
    is_primary: true,
    created_at: "2024-03-15T10:00:00Z",
    updated_at: "2024-03-15T10:00:00Z",
    contacts: {
      id: "contact-1",
      nom: "Dupont",
      prenom: "Jean",
      email: "jean@example.com",
      telephone: "0123456789",
      poste: "CEO",
      est_principal: true,
      client_id: "client-1",
      created_at: "2024-03-10T09:00:00Z",
    },
  },
  {
    id: "pivot-2",
    opportunite_id: "opp-1",
    contact_id: "contact-2",
    role: "Influenceur",
    is_primary: false,
    created_at: "2024-03-16T10:00:00Z",
    updated_at: "2024-03-16T10:00:00Z",
    contacts: {
      id: "contact-2",
      nom: "Martin",
      prenom: "Marie",
      email: "marie@example.com",
      telephone: "0987654321",
      poste: "CTO",
      est_principal: false,
      client_id: "client-1",
      created_at: "2024-03-11T09:00:00Z",
    },
  },
];

const samplePivotWithOpportunites = [
  {
    id: "pivot-1",
    opportunite_id: "opp-1",
    contact_id: "contact-1",
    role: "Decideur",
    is_primary: true,
    created_at: "2024-03-15T10:00:00Z",
    updated_at: "2024-03-15T10:00:00Z",
    opportunites: {
      id: "opp-1",
      nom: "Projet Alpha",
      statut: "Négociation",
      valeur_estimee: 50000,
      probabilite: 70,
      date_cloture_estimee: "2024-06-30",
      client_id: "client-1",
      created_at: "2024-03-10T09:00:00Z",
    },
  },
  {
    id: "pivot-3",
    opportunite_id: "opp-2",
    contact_id: "contact-1",
    role: "Participant",
    is_primary: false,
    created_at: "2024-04-01T10:00:00Z",
    updated_at: "2024-04-01T10:00:00Z",
    opportunites: {
      id: "opp-2",
      nom: "Projet Beta",
      statut: "Gagné",
      valeur_estimee: 30000,
      probabilite: 100,
      date_cloture_estimee: "2024-04-15",
      client_id: "client-2",
      created_at: "2024-04-01T09:00:00Z",
    },
  },
];

const sampleClients = [
  { id: "client-1", nom: "Acme Corp" },
  { id: "client-2", nom: "Tech Solutions" },
];

// Create test QueryClient
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper component with QueryClient
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// Helper to setup query chain for useOpportuniteContacts
function setupOpportuniteContactsQuery(pivotData: unknown[], clientsData: unknown[]) {
  // Reset all mocks
  mockOrder.mockReset();
  mockEq.mockReset();
  mockSelect.mockReset();
  mockIn.mockReset();

  // Track which from() call we're on
  let fromCallCount = 0;

  mockFrom.mockImplementation((table: string) => {
    fromCallCount++;
    if (table === "opportunite_contacts") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: pivotData, error: null }),
            }),
          }),
        }),
      };
    } else if (table === "clients") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: clientsData, error: null }),
        }),
      };
    }
    return { select: mockSelect };
  });
}

// Helper to setup query chain for useContactOpportunites
function setupContactOpportunitesQuery(pivotData: unknown[], clientsData: unknown[]) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "opportunite_contacts") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: pivotData, error: null }),
          }),
        }),
      };
    } else if (table === "clients") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: clientsData, error: null }),
        }),
      };
    }
    return { select: mockSelect };
  });
}

// Helper for mutations
function setupSuccessfulInsert(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });

  mockFrom.mockReturnValue({
    insert: mockInsert,
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  });
}

describe("use-opportunite-contacts hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // useOpportuniteContacts
  // ===========================================================================
  describe("useOpportuniteContacts", () => {
    it("should fetch contacts for an opportunity", async () => {
      setupOpportuniteContactsQuery(samplePivotRecords, sampleClients);

      const { result } = renderHook(
        () => useOpportuniteContacts("opp-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].role).toBe("Decideur");
      expect(result.current.data?.[0].isPrimary).toBe(true);
      expect(result.current.data?.[0].contact?.nom).toBe("Dupont");
      expect(result.current.data?.[0].contact?.clientNom).toBe("Acme Corp");
    });

    it("should not fetch when opportuniteId is undefined", async () => {
      const { result } = renderHook(
        () => useOpportuniteContacts(undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should handle empty results", async () => {
      setupOpportuniteContactsQuery([], []);

      const { result } = renderHook(
        () => useOpportuniteContacts("opp-empty"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.opportuniteContacts.byOpportunite("opp-1");
      expect(expectedKey).toEqual(["opportunite-contacts", "by-opportunite", "opp-1"]);
    });

    it("should handle query errors", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" },
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(
        () => useOpportuniteContacts("opp-error"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ===========================================================================
  // useContactOpportunites
  // ===========================================================================
  describe("useContactOpportunites", () => {
    it("should fetch opportunities for a contact", async () => {
      setupContactOpportunitesQuery(samplePivotWithOpportunites, sampleClients);

      const { result } = renderHook(
        () => useContactOpportunites("contact-1"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].opportunite?.nom).toBe("Projet Alpha");
      expect(result.current.data?.[0].opportunite?.statut).toBe("Négociation");
      expect(result.current.data?.[1].opportunite?.nom).toBe("Projet Beta");
      expect(result.current.data?.[1].opportunite?.statut).toBe("Gagné");
    });

    it("should not fetch when contactId is undefined", async () => {
      const { result } = renderHook(
        () => useContactOpportunites(undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe("idle");
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.opportuniteContacts.byContact("contact-1");
      expect(expectedKey).toEqual(["opportunite-contacts", "by-contact", "contact-1"]);
    });
  });

  // ===========================================================================
  // useAddContactToOpportunite
  // ===========================================================================
  describe("useAddContactToOpportunite", () => {
    it("should add a contact to an opportunity", async () => {
      const newPivotRecord = {
        id: "pivot-new",
        opportunite_id: "opp-1",
        contact_id: "contact-3",
        role: "Utilisateur",
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValue({ data: newPivotRecord, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const queryClient = createTestQueryClient();
      const refetchQueriesSpy = vi.spyOn(queryClient, "refetchQueries");

      const { result } = renderHook(() => useAddContactToOpportunite(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        opportuniteId: "opp-1",
        contactId: "contact-3",
        role: "Utilisateur",
        isPrimary: false,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.role).toBe("Utilisateur");
      expect(result.current.data?.contactId).toBe("contact-3");
      expect(refetchQueriesSpy).toHaveBeenCalled();
    });

    it("should unset other primaries when adding as primary", async () => {
      const newPivotRecord = {
        id: "pivot-new",
        opportunite_id: "opp-1",
        contact_id: "contact-3",
        role: "Decideur",
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdateForPrimary = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockSingle.mockResolvedValue({ data: newPivotRecord, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      mockFrom.mockImplementation((table: string) => {
        if (table === "opportunite_contacts") {
          return {
            update: mockUpdateForPrimary,
            insert: mockInsert,
          };
        }
        return { insert: mockInsert };
      });

      const { result } = renderHook(() => useAddContactToOpportunite(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        opportuniteId: "opp-1",
        contactId: "contact-3",
        role: "Decideur",
        isPrimary: true,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdateForPrimary).toHaveBeenCalled();
      expect(result.current.data?.isPrimary).toBe(true);
    });

    it("should handle duplicate contact error", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "unique constraint violation", code: "23505" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const { result } = renderHook(() => useAddContactToOpportunite(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        opportuniteId: "opp-1",
        contactId: "contact-1", // Already exists
        role: "Participant",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect((result.current.error as Error).message).toContain("déjà associé");
    });
  });

  // ===========================================================================
  // useUpdateOpportuniteContact
  // ===========================================================================
  describe("useUpdateOpportuniteContact", () => {
    it("should update a contact role", async () => {
      const updatedRecord = {
        id: "pivot-1",
        opportunite_id: "opp-1",
        contact_id: "contact-1",
        role: "Influenceur",
        is_primary: true,
        created_at: "2024-03-15T10:00:00Z",
        updated_at: new Date().toISOString(),
      };

      mockSingle.mockResolvedValue({ data: updatedRecord, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const queryClient = createTestQueryClient();
      const refetchQueriesSpy = vi.spyOn(queryClient, "refetchQueries");

      const { result } = renderHook(() => useUpdateOpportuniteContact(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "pivot-1",
        opportuniteId: "opp-1",
        contactId: "contact-1",
        role: "Influenceur",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.role).toBe("Influenceur");
      expect(refetchQueriesSpy).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // useRemoveContactFromOpportunite
  // ===========================================================================
  describe("useRemoveContactFromOpportunite", () => {
    it("should remove a contact from an opportunity", async () => {
      mockEq.mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const queryClient = createTestQueryClient();
      const refetchQueriesSpy = vi.spyOn(queryClient, "refetchQueries");
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useRemoveContactFromOpportunite(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "pivot-1",
        opportuniteId: "opp-1",
        contactId: "contact-1",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", "pivot-1");
      expect(result.current.data?.id).toBe("pivot-1");
      expect(refetchQueriesSpy).toHaveBeenCalled();
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    });

    it("should handle delete errors", async () => {
      mockEq.mockResolvedValue({
        error: { message: "Delete failed" },
      });
      mockDelete.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const { result } = renderHook(() => useRemoveContactFromOpportunite(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "pivot-1",
        opportuniteId: "opp-1",
        contactId: "contact-1",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ===========================================================================
  // useSetPrimaryContact
  // ===========================================================================
  describe("useSetPrimaryContact", () => {
    it("should set a contact as primary", async () => {
      const updatedRecord = {
        id: "pivot-2",
        opportunite_id: "opp-1",
        contact_id: "contact-2",
        role: "Influenceur",
        is_primary: true,
        created_at: "2024-03-16T10:00:00Z",
        updated_at: new Date().toISOString(),
      };

      // Track update calls
      let updateCallCount = 0;
      const mockUpdateChain = () => ({
        eq: vi.fn((field: string, value: unknown) => {
          updateCallCount++;
          if (updateCallCount === 1) {
            // First update: unset all primaries
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          } else {
            // Second update: set new primary
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updatedRecord, error: null }),
              }),
            };
          }
        }),
      });

      mockFrom.mockReturnValue({
        update: mockUpdateChain,
      });

      const queryClient = createTestQueryClient();
      const refetchQueriesSpy = vi.spyOn(queryClient, "refetchQueries");

      const { result } = renderHook(() => useSetPrimaryContact(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        opportuniteId: "opp-1",
        contactId: "contact-2",
        pivotId: "pivot-2",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.isPrimary).toBe(true);
      expect(refetchQueriesSpy).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Query Keys
  // ===========================================================================
  describe("Query Keys", () => {
    it("should have all required query key factories", () => {
      expect(queryKeys.opportuniteContacts.all).toEqual(["opportunite-contacts"]);
      expect(queryKeys.opportuniteContacts.lists()).toEqual(["opportunite-contacts", "list"]);
      expect(queryKeys.opportuniteContacts.byOpportunite("opp-1")).toEqual([
        "opportunite-contacts",
        "by-opportunite",
        "opp-1",
      ]);
      expect(queryKeys.opportuniteContacts.byContact("contact-1")).toEqual([
        "opportunite-contacts",
        "by-contact",
        "contact-1",
      ]);
      expect(queryKeys.opportuniteContacts.detail("pivot-1")).toEqual([
        "opportunite-contacts",
        "detail",
        "pivot-1",
      ]);
    });

    it("should generate consistent keys for cache invalidation", () => {
      const allKey = queryKeys.opportuniteContacts.all;
      const byOppKey = queryKeys.opportuniteContacts.byOpportunite("opp-1");
      const byContactKey = queryKeys.opportuniteContacts.byContact("contact-1");
      const detailKey = queryKeys.opportuniteContacts.detail("pivot-1");

      // All keys should share the same base
      expect(byOppKey[0]).toBe(allKey[0]);
      expect(byContactKey[0]).toBe(allKey[0]);
      expect(detailKey[0]).toBe(allKey[0]);
    });
  });
});
