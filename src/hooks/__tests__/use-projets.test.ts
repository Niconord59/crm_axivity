// CRM Axivity - useProjets Hook Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useProjets,
  useProjetsActifs,
  useProjet,
  useCreateProjet,
  useUpdateProjet,
} from "../use-projets";
import { queryKeys } from "@/lib/queryKeys";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
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
const sampleProjetRecords = [
  {
    id: "proj-1",
    id_projet: 1,
    nom: "Projet Alpha",
    brief: "Développement site web",
    statut: "En cours",
    date_debut: "2024-01-15",
    date_fin_prevue: "2024-06-30",
    date_fin_reelle: null,
    budget_initial: 50000,
    notes: "Projet prioritaire",
    priorite: "Haute",
    heures_estimees: 200,
    heures_passees: 80,
    client_id: "client-1",
    owner_id: "user-1",
  },
  {
    id: "proj-2",
    id_projet: 2,
    nom: "Projet Beta",
    brief: "Application mobile",
    statut: "Cadrage",
    date_debut: "2024-02-01",
    date_fin_prevue: "2024-08-15",
    date_fin_reelle: null,
    budget_initial: 75000,
    notes: null,
    priorite: "Moyenne",
    heures_estimees: 300,
    heures_passees: 0,
    client_id: "client-2",
    owner_id: "user-2",
  },
  {
    id: "proj-3",
    id_projet: 3,
    nom: "Projet Gamma",
    brief: "Maintenance annuelle",
    statut: "Terminé",
    date_debut: "2023-01-01",
    date_fin_prevue: "2023-12-31",
    date_fin_reelle: "2023-12-15",
    budget_initial: 30000,
    notes: "Client satisfait",
    priorite: "Basse",
    heures_estimees: 100,
    heures_passees: 95,
    client_id: "client-1",
    owner_id: "user-1",
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
  mockOrder.mockReset();
  mockEq.mockReset();
  mockIn.mockReset();
  mockSelect.mockReset();

  // Chain: select → order OR select → order → eq (filters)
  mockOrder.mockResolvedValue({ data, error: null });
  mockIn.mockReturnValue({ order: mockOrder });
  mockEq.mockReturnValue({ order: mockOrder, single: mockSingle });
  mockSelect.mockReturnValue({
    eq: (...args: unknown[]) => {
      mockEq(...args);
      return { order: mockOrder, single: mockSingle, eq: mockEq };
    },
    order: (...args: unknown[]) => {
      mockOrder(...args);
      return {
        eq: vi.fn().mockResolvedValue({ data, error: null }),
        in: mockIn,
        data,
        error: null,
      };
    },
    in: mockIn,
  });
}

// Helper to setup order → filter chain for useProjetsActifs
function setupSuccessfulProjetsActifsQuery(data: unknown[]) {
  mockOrder.mockReset();
  mockIn.mockReset();
  mockEq.mockReset();
  mockSelect.mockReset();

  // Chain: select → in → order (returns Promise)
  mockOrder.mockResolvedValue({ data, error: null });
  mockIn.mockReturnValue({ order: mockOrder });
  mockSelect.mockReturnValue({ in: mockIn });
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
  mockEq.mockReturnValue({ order: mockOrder, single: mockSingle });
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    in: mockIn,
  });
}

describe("use-projets hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // useProjets
  // ===========================================================================
  describe("useProjets", () => {
    it("should fetch all projects successfully", async () => {
      setupSuccessfulQuery(sampleProjetRecords);

      const { result } = renderHook(() => useProjets(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("projets");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockOrder).toHaveBeenCalledWith("date_debut", {
        ascending: false,
        nullsFirst: false,
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.[0].nomProjet).toBe("Projet Alpha");
      expect(result.current.data?.[0].budget).toBe(50000);
    });

    it("should accept statut filter option", async () => {
      const enCoursRecords = sampleProjetRecords.filter(
        (r) => r.statut === "En cours"
      );

      mockOrder.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: enCoursRecords, error: null }),
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
        eq: mockEq,
      });

      const { result } = renderHook(
        () => useProjets({ statut: "En cours" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].statut).toBe("En cours");
    });

    it("should accept clientId filter option", async () => {
      const client1Records = sampleProjetRecords.filter(
        (r) => r.client_id === "client-1"
      );

      mockOrder.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: client1Records, error: null }),
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
        eq: mockEq,
      });

      const { result } = renderHook(
        () => useProjets({ clientId: "client-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it("should handle empty results", async () => {
      setupSuccessfulQuery([]);

      const { result } = renderHook(() => useProjets(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should handle query errors", async () => {
      setupQueryError("Database connection failed");

      const { result } = renderHook(() => useProjets(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.projets.list({});
      expect(expectedKey).toEqual(["projets", "list", {}]);
    });

    it("should have correct query key with filters", () => {
      const expectedKey = queryKeys.projets.list({
        statut: "En cours",
        clientId: "client-1",
      });
      expect(expectedKey).toEqual([
        "projets",
        "list",
        { statut: "En cours", clientId: "client-1" },
      ]);
    });
  });

  // ===========================================================================
  // useProjetsActifs
  // ===========================================================================
  describe("useProjetsActifs", () => {
    it("should fetch active projects (En cours and Cadrage)", async () => {
      const activeRecords = sampleProjetRecords.filter(
        (r) => r.statut === "En cours" || r.statut === "Cadrage"
      );
      setupSuccessfulProjetsActifsQuery(activeRecords);

      const { result } = renderHook(() => useProjetsActifs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("projets");
      expect(mockIn).toHaveBeenCalledWith("statut", ["En cours", "Cadrage"]);

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every(
        (p) => p.statut === "En cours" || p.statut === "Cadrage"
      )).toBe(true);
    });

    it("should filter by userId when provided", async () => {
      const user1ActiveRecords = sampleProjetRecords.filter(
        (r) => (r.statut === "En cours" || r.statut === "Cadrage") && r.owner_id === "user-1"
      );

      mockOrder.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: user1ActiveRecords, error: null }),
      });
      mockIn.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ in: mockIn });

      const { result } = renderHook(() => useProjetsActifs("user-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].ownerId).toBe("user-1");
    });

    it("should order by date_fin_prevue ascending", async () => {
      setupSuccessfulProjetsActifsQuery([]);

      renderHook(() => useProjetsActifs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockOrder).toHaveBeenCalledWith("date_fin_prevue", {
          ascending: true,
          nullsFirst: false,
        });
      });
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.projets.actifs();
      expect(expectedKey).toEqual(["projets", "actifs", undefined]);
    });

    it("should have correct query key with userId", () => {
      const expectedKey = queryKeys.projets.actifs("user-1");
      expect(expectedKey).toEqual(["projets", "actifs", "user-1"]);
    });
  });

  // ===========================================================================
  // useProjet (single)
  // ===========================================================================
  describe("useProjet", () => {
    it("should fetch a single project by id", async () => {
      setupSuccessfulSingleQuery(sampleProjetRecords[0]);

      const { result } = renderHook(() => useProjet("proj-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("projets");
      expect(mockEq).toHaveBeenCalledWith("id", "proj-1");

      expect(result.current.data?.id).toBe("proj-1");
      expect(result.current.data?.nomProjet).toBe("Projet Alpha");
      expect(result.current.data?.budget).toBe(50000);
    });

    it("should not fetch when id is undefined", async () => {
      const { result } = renderHook(() => useProjet(undefined), {
        wrapper: createWrapper(),
      });

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should map all fields correctly", async () => {
      setupSuccessfulSingleQuery(sampleProjetRecords[0]);

      const { result } = renderHook(() => useProjet("proj-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const projet = result.current.data;
      expect(projet?.idProjet).toBe(1);
      expect(projet?.briefProjet).toBe("Développement site web");
      expect(projet?.dateDebut).toBe("2024-01-15");
      expect(projet?.dateFinPrevue).toBe("2024-06-30");
      expect(projet?.totalHeuresEstimees).toBe(200);
      expect(projet?.totalHeuresPassees).toBe(80);
      expect(projet?.client).toEqual(["client-1"]);
      expect(projet?.ownerId).toBe("user-1");
    });

    it("should handle not found error", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Row not found", code: "PGRST116" },
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useProjet("non-existent"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.projets.detail("proj-1");
      expect(expectedKey).toEqual(["projets", "detail", "proj-1"]);
    });
  });

  // ===========================================================================
  // useCreateProjet
  // ===========================================================================
  describe("useCreateProjet", () => {
    it("should create a new project", async () => {
      const newRecord = {
        id: "proj-new",
        id_projet: 4,
        nom: "Nouveau Projet",
        brief: "Test brief",
        statut: "Cadrage",
        date_debut: "2024-04-01",
        date_fin_prevue: "2024-09-30",
        date_fin_reelle: null,
        budget_initial: 40000,
        notes: "Nouveau projet",
        priorite: "Moyenne",
        heures_estimees: null,
        heures_passees: null,
        client_id: "client-1",
        owner_id: "user-1",
      };
      setupSuccessfulInsert(newRecord);

      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateProjet(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        nomProjet: "Nouveau Projet",
        briefProjet: "Test brief",
        statut: "Cadrage",
        dateDebut: "2024-04-01",
        dateFinPrevue: "2024-09-30",
        budget: 40000,
        notes: "Nouveau projet",
        client: ["client-1"],
        ownerId: "user-1",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("projets");
      expect(mockInsert).toHaveBeenCalled();

      expect(result.current.data?.nomProjet).toBe("Nouveau Projet");
      expect(result.current.data?.budget).toBe(40000);

      // Should invalidate queries on success
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    });

    it("should handle creation errors", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useCreateProjet(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ nomProjet: "Test" });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should use default status Cadrage when not provided", async () => {
      const newRecord = {
        id: "proj-default",
        id_projet: 5,
        nom: "Default Status",
        brief: "Default Status",
        statut: "Cadrage",
        date_debut: null,
        date_fin_prevue: null,
        date_fin_reelle: null,
        budget_initial: null,
        notes: null,
        priorite: null,
        heures_estimees: null,
        heures_passees: null,
        client_id: null,
        owner_id: null,
      };
      setupSuccessfulInsert(newRecord);

      const { result } = renderHook(() => useCreateProjet(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ nomProjet: "Default Status" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The mapper should use default "Cadrage" status
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.statut).toBe("Cadrage");
    });

    it("should pass ownerId when provided", async () => {
      const newRecord = {
        id: "proj-owner",
        id_projet: 6,
        nom: "With Owner",
        brief: "With Owner",
        statut: "Cadrage",
        date_debut: null,
        date_fin_prevue: null,
        date_fin_reelle: null,
        budget_initial: null,
        notes: null,
        priorite: null,
        heures_estimees: null,
        heures_passees: null,
        client_id: null,
        owner_id: "user-1",
      };
      setupSuccessfulInsert(newRecord);

      const { result } = renderHook(() => useCreateProjet(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ nomProjet: "With Owner", ownerId: "user-1" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.owner_id).toBe("user-1");
    });
  });

  // ===========================================================================
  // useUpdateProjet
  // ===========================================================================
  describe("useUpdateProjet", () => {
    it("should update a project", async () => {
      const updatedRecord = {
        ...sampleProjetRecords[0],
        budget_initial: 60000,
        notes: "Updated notes",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useUpdateProjet(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "proj-1",
        data: { budget: 60000, notes: "Updated notes" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("projets");
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", "proj-1");

      expect(result.current.data?.budget).toBe(60000);
      expect(result.current.data?.notes).toBe("Updated notes");
    });

    it("should cancel queries and update cache optimistically", async () => {
      const updatedRecord = {
        ...sampleProjetRecords[0],
        statut: "En pause",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();
      const cancelQueriesSpy = vi.spyOn(queryClient, "cancelQueries");

      const { result } = renderHook(() => useUpdateProjet(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "proj-1",
        data: { statut: "En pause" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify optimistic update flow was triggered
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

      const { result } = renderHook(() => useUpdateProjet(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "proj-1",
        data: { budget: 60000 },
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should handle partial updates", async () => {
      const updatedRecord = {
        ...sampleProjetRecords[0],
        notes: "Only notes updated",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateProjet(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "proj-1",
        data: { notes: "Only notes updated" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.notes).toBe("Only notes updated");
      // Other fields should not be included
      expect(updateCall.budget_initial).toBeUndefined();
    });

    it("should update status correctly", async () => {
      const updatedRecord = {
        ...sampleProjetRecords[0],
        statut: "Terminé",
        date_fin_reelle: "2024-03-15",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateProjet(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "proj-1",
        data: { statut: "Terminé", dateFinReelle: "2024-03-15" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.statut).toBe("Terminé");
      expect(updateCall.date_fin_reelle).toBe("2024-03-15");
    });

    it("should handle ownerId update", async () => {
      const updatedRecord = {
        ...sampleProjetRecords[0],
        owner_id: "user-2",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateProjet(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "proj-1",
        data: { ownerId: "user-2" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.owner_id).toBe("user-2");
    });

    it("should allow clearing ownerId", async () => {
      const updatedRecord = {
        ...sampleProjetRecords[0],
        owner_id: null,
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateProjet(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "proj-1",
        data: { ownerId: "" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.owner_id).toBe(null);
    });
  });

  // ===========================================================================
  // Query Keys
  // ===========================================================================
  describe("Query Keys", () => {
    it("should have all required query key factories", () => {
      expect(queryKeys.projets.all).toEqual(["projets"]);
      expect(queryKeys.projets.lists()).toEqual(["projets", "list"]);
      expect(queryKeys.projets.list()).toEqual(["projets", "list", undefined]);
      expect(queryKeys.projets.actifs()).toEqual(["projets", "actifs", undefined]);
      expect(queryKeys.projets.details()).toEqual(["projets", "detail"]);
      expect(queryKeys.projets.detail("123")).toEqual(["projets", "detail", "123"]);
    });

    it("should generate consistent keys for cache invalidation", () => {
      // All queries should share the same base key for bulk invalidation
      const allKey = queryKeys.projets.all;
      const listKey = queryKeys.projets.list();
      const actifsKey = queryKeys.projets.actifs();
      const detailKey = queryKeys.projets.detail("123");

      expect(listKey[0]).toBe(allKey[0]);
      expect(actifsKey[0]).toBe(allKey[0]);
      expect(detailKey[0]).toBe(allKey[0]);
    });
  });
});
