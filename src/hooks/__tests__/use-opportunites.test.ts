// CRM Axivity - useOpportunites Hook Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useOpportunites,
  useOpportunitesParStatut,
  useOpportunite,
  useCreateOpportunite,
  useUpdateOpportunite,
  useUpdateOpportuniteStatut,
} from "../use-opportunites";
import { queryKeys } from "@/lib/queryKeys";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNot = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Sample test data matching Supabase schema
const sampleOpportuniteRecords = [
  {
    id: "opp-1",
    nom: "Projet Alpha",
    statut: "Proposition",
    valeur_estimee: 50000,
    probabilite: 75,
    date_cloture_prevue: "2024-06-30",
    source: "LinkedIn",
    notes: "Client intéressé",
    created_at: "2024-01-15T10:00:00Z",
    client_id: "client-1",
    contact_id: "contact-1",
    projet_id: null,
  },
  {
    id: "opp-2",
    nom: "Projet Beta",
    statut: "Qualifié",
    valeur_estimee: 30000,
    probabilite: 50,
    date_cloture_prevue: "2024-07-15",
    source: "Referral",
    notes: null,
    created_at: "2024-02-01T10:00:00Z",
    client_id: "client-2",
    contact_id: null,
    projet_id: null,
  },
  {
    id: "opp-3",
    nom: "Projet Gamma",
    statut: "Négociation",
    valeur_estimee: 100000,
    probabilite: 90,
    date_cloture_prevue: "2024-05-15",
    source: "Website",
    notes: "Closing soon",
    created_at: "2024-02-15T10:00:00Z",
    client_id: "client-1",
    contact_id: "contact-2",
    projet_id: null,
  },
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

// Helper to setup successful query chain
function setupSuccessfulQuery(data: unknown[]) {
  // Reset mocks first
  mockOrder.mockReset();
  mockNot.mockReset();
  mockEq.mockReset();
  mockSelect.mockReset();

  // Chain: select → eq → order OR select → order OR select → not → order
  mockOrder.mockResolvedValue({ data, error: null });
  mockNot.mockReturnValue({ order: mockOrder });
  mockEq.mockReturnValue({ order: mockOrder, single: mockSingle });
  mockSelect.mockReturnValue({
    eq: (...args: unknown[]) => {
      mockEq(...args);
      return { order: mockOrder, single: mockSingle, eq: mockEq };
    },
    order: mockOrder,
    not: mockNot,
  });
}

// Helper to setup successful single query
function setupSuccessfulSingleQuery(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
}

// Helper to setup successful insert
function setupSuccessfulInsert(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
}

// Helper to setup successful update
function setupSuccessfulUpdate(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

// Helper to setup query error
function setupQueryError(errorMessage: string) {
  mockOrder.mockResolvedValue({ data: null, error: { message: errorMessage } });
  mockNot.mockReturnValue({ order: mockOrder });
  mockEq.mockReturnValue({ order: mockOrder, single: mockSingle });
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    not: mockNot,
  });
}

describe("use-opportunites hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // useOpportunites
  // ===========================================================================
  describe("useOpportunites", () => {
    it("should fetch all opportunities successfully", async () => {
      setupSuccessfulQuery(sampleOpportuniteRecords);

      const { result } = renderHook(() => useOpportunites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("opportunites");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockOrder).toHaveBeenCalledWith("date_cloture_prevue", {
        ascending: true,
        nullsFirst: false,
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.[0].nom).toBe("Projet Alpha");
      expect(result.current.data?.[0].valeurEstimee).toBe(50000);
      expect(result.current.data?.[0].valeurPonderee).toBe(37500); // 50000 * 0.75
    });

    it("should accept statut filter option", async () => {
      // Setup mock that handles order → eq chain
      const propositionRecords = sampleOpportuniteRecords.filter(
        (r) => r.statut === "Proposition"
      );

      const mockOrderWithEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: propositionRecords, error: null }),
      });
      mockSelect.mockReturnValue({
        order: mockOrderWithEq,
        eq: mockEq,
        not: mockNot,
      });

      const { result } = renderHook(
        () => useOpportunites({ statut: "Proposition" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].statut).toBe("Proposition");
    });

    it("should accept clientId filter option", async () => {
      // Setup mock that handles order → eq chain
      const client1Records = sampleOpportuniteRecords.filter(
        (r) => r.client_id === "client-1"
      );

      const mockOrderWithEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: client1Records, error: null }),
      });
      mockSelect.mockReturnValue({
        order: mockOrderWithEq,
        eq: mockEq,
        not: mockNot,
      });

      const { result } = renderHook(
        () => useOpportunites({ clientId: "client-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it("should handle empty results", async () => {
      setupSuccessfulQuery([]);

      const { result } = renderHook(() => useOpportunites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should handle query errors", async () => {
      setupQueryError("Database connection failed");

      const { result } = renderHook(() => useOpportunites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.opportunites.list({});
      expect(expectedKey).toEqual(["opportunites", "list", {}]);
    });

    it("should have correct query key with filters", () => {
      const expectedKey = queryKeys.opportunites.list({
        statut: "Proposition",
        clientId: "client-1",
      });
      expect(expectedKey).toEqual([
        "opportunites",
        "list",
        { statut: "Proposition", clientId: "client-1" },
      ]);
    });
  });

  // ===========================================================================
  // useOpportunitesParStatut (Kanban)
  // ===========================================================================
  describe("useOpportunitesParStatut", () => {
    it("should fetch and group opportunities by status", async () => {
      // This query excludes Gagné and Perdu
      const activeRecords = sampleOpportuniteRecords.filter(
        (r) => !["Gagné", "Perdu"].includes(r.statut)
      );
      setupSuccessfulQuery(activeRecords);

      const { result } = renderHook(() => useOpportunitesParStatut(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockNot).toHaveBeenCalledWith("statut", "in", '("Gagné","Perdu")');

      const grouped = result.current.data;
      expect(grouped).toBeDefined();
      expect(grouped?.["Qualifié"]).toHaveLength(1);
      expect(grouped?.["Proposition"]).toHaveLength(1);
      expect(grouped?.["Négociation"]).toHaveLength(1);
      expect(grouped?.["Gagné"]).toHaveLength(0);
      expect(grouped?.["Perdu"]).toHaveLength(0);
    });

    it("should initialize all status groups even when empty", async () => {
      setupSuccessfulQuery([]);

      const { result } = renderHook(() => useOpportunitesParStatut(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const grouped = result.current.data;
      expect(grouped?.["Qualifié"]).toEqual([]);
      expect(grouped?.["Proposition"]).toEqual([]);
      expect(grouped?.["Négociation"]).toEqual([]);
      expect(grouped?.["Gagné"]).toEqual([]);
      expect(grouped?.["Perdu"]).toEqual([]);
    });

    it("should map records correctly with calculated fields", async () => {
      setupSuccessfulQuery([sampleOpportuniteRecords[0]]);

      const { result } = renderHook(() => useOpportunitesParStatut(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const propositionOpps = result.current.data?.["Proposition"];
      expect(propositionOpps?.[0].valeurPonderee).toBe(37500);
      expect(propositionOpps?.[0].client).toEqual(["client-1"]);
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.opportunites.byStatut();
      expect(expectedKey).toEqual(["opportunites", "par-statut"]);
    });
  });

  // ===========================================================================
  // useOpportunite (single)
  // ===========================================================================
  describe("useOpportunite", () => {
    it("should fetch a single opportunity by id", async () => {
      setupSuccessfulSingleQuery(sampleOpportuniteRecords[0]);

      const { result } = renderHook(() => useOpportunite("opp-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("opportunites");
      expect(mockEq).toHaveBeenCalledWith("id", "opp-1");

      expect(result.current.data?.id).toBe("opp-1");
      expect(result.current.data?.nom).toBe("Projet Alpha");
    });

    it("should not fetch when id is undefined", async () => {
      const { result } = renderHook(() => useOpportunite(undefined), {
        wrapper: createWrapper(),
      });

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should handle not found error", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Row not found", code: "PGRST116" },
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useOpportunite("non-existent"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.opportunites.detail("opp-1");
      expect(expectedKey).toEqual(["opportunites", "detail", "opp-1"]);
    });
  });

  // ===========================================================================
  // useCreateOpportunite
  // ===========================================================================
  describe("useCreateOpportunite", () => {
    it("should create a new opportunity", async () => {
      const newRecord = {
        id: "opp-new",
        nom: "New Project",
        statut: "Qualifié",
        valeur_estimee: 25000,
        probabilite: 60,
        date_cloture_prevue: "2024-08-01",
        source: "Website",
        notes: "New lead",
        created_at: "2024-03-01T10:00:00Z",
        client_id: "client-1",
        contact_id: null,
        projet_id: null,
      };
      setupSuccessfulInsert(newRecord);

      const queryClient = createTestQueryClient();
      const refetchSpy = vi.spyOn(queryClient, "refetchQueries");

      const { result } = renderHook(() => useCreateOpportunite(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        nom: "New Project",
        statut: "Qualifié",
        valeurEstimee: 25000,
        probabilite: 60,
        dateClotureEstimee: "2024-08-01",
        source: "Website",
        notes: "New lead",
        client: ["client-1"],
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("opportunites");
      expect(mockInsert).toHaveBeenCalled();

      expect(result.current.data?.nom).toBe("New Project");
      expect(result.current.data?.valeurPonderee).toBe(15000); // 25000 * 0.6

      // Should refetch queries on success
      expect(refetchSpy).toHaveBeenCalled();
    });

    it("should handle creation errors", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useCreateOpportunite(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ nom: "Test" });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should use default status when not provided", async () => {
      const newRecord = {
        id: "opp-default",
        nom: "Default Status Project",
        statut: "Qualifié",
        valeur_estimee: null,
        probabilite: null,
        date_cloture_prevue: null,
        source: null,
        notes: null,
        created_at: "2024-03-01T10:00:00Z",
        client_id: null,
        contact_id: null,
        projet_id: null,
      };
      setupSuccessfulInsert(newRecord);

      const { result } = renderHook(() => useCreateOpportunite(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ nom: "Default Status Project" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The mapper should use default "Qualifié" status
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.statut).toBe("Qualifié");
    });
  });

  // ===========================================================================
  // useUpdateOpportunite
  // ===========================================================================
  describe("useUpdateOpportunite", () => {
    it("should update an opportunity", async () => {
      const updatedRecord = {
        ...sampleOpportuniteRecords[0],
        valeur_estimee: 75000,
        probabilite: 80,
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useUpdateOpportunite(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "opp-1",
        data: { valeurEstimee: 75000, probabilite: 80 },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("opportunites");
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", "opp-1");

      expect(result.current.data?.valeurEstimee).toBe(75000);
      expect(result.current.data?.valeurPonderee).toBe(60000); // 75000 * 0.80
    });

    it("should cancel queries and update cache optimistically", async () => {
      const updatedRecord = {
        ...sampleOpportuniteRecords[0],
        valeur_estimee: 75000,
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();
      const cancelQueriesSpy = vi.spyOn(queryClient, "cancelQueries");

      const { result } = renderHook(() => useUpdateOpportunite(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "opp-1",
        data: { valeurEstimee: 75000 },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify optimistic update flow was triggered (cancelQueries called in onMutate)
      expect(cancelQueriesSpy).toHaveBeenCalled();
    });

    it("should handle mutation error gracefully", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateOpportunite(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "opp-1",
        data: { valeurEstimee: 75000 },
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should handle partial updates", async () => {
      const updatedRecord = {
        ...sampleOpportuniteRecords[0],
        notes: "Updated notes only",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateOpportunite(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "opp-1",
        data: { notes: "Updated notes only" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.notes).toBe("Updated notes only");
      // Other fields should not be included
      expect(updateCall.valeur_estimee).toBeUndefined();
    });
  });

  // ===========================================================================
  // useUpdateOpportuniteStatut (Kanban drag & drop)
  // ===========================================================================
  describe("useUpdateOpportuniteStatut", () => {
    it("should update opportunity status", async () => {
      const updatedRecord = {
        ...sampleOpportuniteRecords[0],
        statut: "Négociation",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useUpdateOpportuniteStatut(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "opp-1",
        statut: "Négociation",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdate).toHaveBeenCalledWith({ statut: "Négociation" });
    });

    it("should cancel queries for optimistic Kanban update", async () => {
      const updatedRecord = {
        ...sampleOpportuniteRecords[0],
        statut: "Négociation",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();
      const cancelQueriesSpy = vi.spyOn(queryClient, "cancelQueries");

      const { result } = renderHook(() => useUpdateOpportuniteStatut(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "opp-1",
        statut: "Négociation",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify optimistic update flow was triggered
      expect(cancelQueriesSpy).toHaveBeenCalled();
      expect(result.current.data?.statut).toBe("Négociation");
    });

    it("should handle status update error", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Status update failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateOpportuniteStatut(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "opp-1",
        statut: "Négociation",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should handle moving to Gagné status", async () => {
      const updatedRecord = {
        ...sampleOpportuniteRecords[0],
        statut: "Gagné",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateOpportuniteStatut(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "opp-1",
        statut: "Gagné",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.statut).toBe("Gagné");
    });

    it("should handle moving to Perdu status", async () => {
      const updatedRecord = {
        ...sampleOpportuniteRecords[0],
        statut: "Perdu",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateOpportuniteStatut(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "opp-1",
        statut: "Perdu",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.statut).toBe("Perdu");
    });

    it("should not duplicate when cache is empty", async () => {
      const updatedRecord = {
        ...sampleOpportuniteRecords[0],
        statut: "Négociation",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();
      // No cache data set

      const { result } = renderHook(() => useUpdateOpportuniteStatut(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "opp-1",
        statut: "Négociation",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should complete without errors even without cache
      expect(result.current.data?.statut).toBe("Négociation");
    });
  });

  // ===========================================================================
  // Query Keys
  // ===========================================================================
  describe("Query Keys", () => {
    it("should have all required query key factories", () => {
      expect(queryKeys.opportunites.all).toEqual(["opportunites"]);
      expect(queryKeys.opportunites.lists()).toEqual(["opportunites", "list"]);
      expect(queryKeys.opportunites.list()).toEqual(["opportunites", "list", undefined]);
      expect(queryKeys.opportunites.byStatut()).toEqual(["opportunites", "par-statut"]);
      expect(queryKeys.opportunites.details()).toEqual(["opportunites", "detail"]);
      expect(queryKeys.opportunites.detail("123")).toEqual(["opportunites", "detail", "123"]);
    });

    it("should generate consistent keys for cache invalidation", () => {
      // All queries should share the same base key for bulk invalidation
      const allKey = queryKeys.opportunites.all;
      const listKey = queryKeys.opportunites.list();
      const byStatutKey = queryKeys.opportunites.byStatut();
      const detailKey = queryKeys.opportunites.detail("123");

      expect(listKey[0]).toBe(allKey[0]);
      expect(byStatutKey[0]).toBe(allKey[0]);
      expect(detailKey[0]).toBe(allKey[0]);
    });
  });
});
