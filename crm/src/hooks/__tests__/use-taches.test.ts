// CRM Axivity - useTaches Hook Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useTaches,
  useTachesEnRetard,
  useMesTaches,
  useTache,
  useCreateTache,
  useUpdateTache,
  useUpdateTacheStatut,
  useDeleteTache,
} from "../use-taches";
import { queryKeys } from "@/lib/queryKeys";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockLt = vi.fn();
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

// Get today's date for test comparisons
const today = new Date().toISOString().split("T")[0];
const pastDate = "2024-01-01";
const futureDate = "2030-12-31";

// Sample test data matching Supabase schema
const sampleTacheRecords = [
  {
    id: "tache-1",
    titre: "Développer API REST",
    description: "Créer les endpoints pour le CRM",
    statut: "En cours",
    priorite: "Haute",
    date_echeance: futureDate,
    heures_estimees: 16,
    heures_passees: 8,
    created_at: "2024-01-15T10:00:00Z",
    date_terminee: null,
    ordre: 1,
    projet_id: "proj-1",
    assignee_id: "user-1",
  },
  {
    id: "tache-2",
    titre: "Design UI mockups",
    description: "Créer les maquettes Figma",
    statut: "À faire",
    priorite: "Moyenne",
    date_echeance: pastDate, // Overdue
    heures_estimees: 8,
    heures_passees: 0,
    created_at: "2024-01-10T10:00:00Z",
    date_terminee: null,
    ordre: 2,
    projet_id: "proj-1",
    assignee_id: "user-2",
  },
  {
    id: "tache-3",
    titre: "Tests unitaires",
    description: "Écrire les tests Vitest",
    statut: "Terminé",
    priorite: "Haute",
    date_echeance: "2024-02-15",
    heures_estimees: 4,
    heures_passees: 5,
    created_at: "2024-01-20T10:00:00Z",
    date_terminee: "2024-02-10",
    ordre: 3,
    projet_id: "proj-2",
    assignee_id: "user-1",
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

// Helper to setup successful query chain (select → order → order)
function setupSuccessfulQuery(data: unknown[]) {
  mockOrder.mockReset();
  mockEq.mockReset();
  mockNeq.mockReset();
  mockLt.mockReset();
  mockSelect.mockReset();

  // Chain with double order (date then priority)
  const secondOrder = vi.fn().mockResolvedValue({ data, error: null });
  mockOrder.mockReturnValue({
    order: secondOrder,
    eq: vi.fn().mockResolvedValue({ data, error: null }),
  });
  mockSelect.mockReturnValue({
    order: mockOrder,
    eq: mockEq,
    neq: mockNeq,
  });
}

// Helper for useTachesEnRetard query chain (select → neq → lt → order)
function setupEnRetardQuery(data: unknown[]) {
  mockOrder.mockReset();
  mockLt.mockReset();
  mockNeq.mockReset();
  mockSelect.mockReset();

  mockOrder.mockResolvedValue({ data, error: null });
  mockLt.mockReturnValue({
    order: mockOrder,
    eq: vi.fn().mockResolvedValue({ data, error: null }),
  });
  mockNeq.mockReturnValue({ lt: mockLt });
  mockSelect.mockReturnValue({ neq: mockNeq });
}

// Helper for useMesTaches query chain (select → eq → neq → order → order)
function setupMesTachesQuery(data: unknown[]) {
  mockOrder.mockReset();
  mockNeq.mockReset();
  mockEq.mockReset();
  mockSelect.mockReset();

  const secondOrder = vi.fn().mockResolvedValue({ data, error: null });
  mockOrder.mockReturnValue({ order: secondOrder });
  mockNeq.mockReturnValue({ order: mockOrder });
  mockEq.mockReturnValue({ neq: mockNeq });
  mockSelect.mockReturnValue({ eq: mockEq });
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

// Helper to setup successful delete
function setupSuccessfulDelete() {
  mockEq.mockResolvedValue({ error: null });
  mockDelete.mockReturnValue({ eq: mockEq });
}

// Helper to setup query error
function setupQueryError(errorMessage: string) {
  const secondOrder = vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } });
  mockOrder.mockReturnValue({ order: secondOrder });
  mockSelect.mockReturnValue({
    order: mockOrder,
    eq: mockEq,
    neq: mockNeq,
  });
}

describe("use-taches hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // useTaches
  // ===========================================================================
  describe("useTaches", () => {
    it("should fetch all tasks successfully", async () => {
      setupSuccessfulQuery(sampleTacheRecords);

      const { result } = renderHook(() => useTaches(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("taches");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockOrder).toHaveBeenCalledWith("date_echeance", {
        ascending: true,
        nullsFirst: false,
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.[0].nom).toBe("Développer API REST");
    });

    it("should accept statut filter option", async () => {
      const enCoursRecords = sampleTacheRecords.filter(
        (r) => r.statut === "En cours"
      );

      const secondOrder = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: enCoursRecords, error: null }),
      });
      mockOrder.mockReturnValue({ order: secondOrder });
      mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq });

      const { result } = renderHook(
        () => useTaches({ statut: "En cours" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].statut).toBe("En cours");
    });

    it("should accept projetId filter option", async () => {
      const proj1Records = sampleTacheRecords.filter(
        (r) => r.projet_id === "proj-1"
      );

      const secondOrder = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: proj1Records, error: null }),
      });
      mockOrder.mockReturnValue({ order: secondOrder });
      mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq });

      const { result } = renderHook(
        () => useTaches({ projetId: "proj-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it("should accept membreEquipeId filter option", async () => {
      const user1Records = sampleTacheRecords.filter(
        (r) => r.assignee_id === "user-1"
      );

      const secondOrder = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: user1Records, error: null }),
      });
      mockOrder.mockReturnValue({ order: secondOrder });
      mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq });

      const { result } = renderHook(
        () => useTaches({ membreEquipeId: "user-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it("should handle empty results", async () => {
      setupSuccessfulQuery([]);

      const { result } = renderHook(() => useTaches(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should handle query errors", async () => {
      setupQueryError("Database connection failed");

      const { result } = renderHook(() => useTaches(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.taches.list({});
      expect(expectedKey).toEqual(["taches", "list", {}]);
    });
  });

  // ===========================================================================
  // useTachesEnRetard
  // ===========================================================================
  describe("useTachesEnRetard", () => {
    it("should fetch overdue tasks", async () => {
      const overdueRecords = sampleTacheRecords.filter(
        (r) => r.statut !== "Terminé" && r.date_echeance < today
      );
      setupEnRetardQuery(overdueRecords);

      const { result } = renderHook(() => useTachesEnRetard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockNeq).toHaveBeenCalledWith("statut", "Terminé");
      expect(mockLt).toHaveBeenCalledWith("date_echeance", today);
    });

    it("should filter by userId when provided", async () => {
      const user1OverdueRecords = sampleTacheRecords.filter(
        (r) => r.statut !== "Terminé" && r.date_echeance < today && r.assignee_id === "user-1"
      );

      mockOrder.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: user1OverdueRecords, error: null }),
      });
      mockLt.mockReturnValue({ order: mockOrder });
      mockNeq.mockReturnValue({ lt: mockLt });
      mockSelect.mockReturnValue({ neq: mockNeq });

      const { result } = renderHook(() => useTachesEnRetard("user-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.taches.enRetard();
      expect(expectedKey).toEqual(["taches", "en-retard", undefined]);
    });

    it("should have correct query key with userId", () => {
      const expectedKey = queryKeys.taches.enRetard("user-1");
      expect(expectedKey).toEqual(["taches", "en-retard", "user-1"]);
    });
  });

  // ===========================================================================
  // useMesTaches
  // ===========================================================================
  describe("useMesTaches", () => {
    it("should fetch my uncompleted tasks", async () => {
      const user1ActiveRecords = sampleTacheRecords.filter(
        (r) => r.assignee_id === "user-1" && r.statut !== "Terminé"
      );
      setupMesTachesQuery(user1ActiveRecords);

      const { result } = renderHook(() => useMesTaches("user-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("assignee_id", "user-1");
      expect(mockNeq).toHaveBeenCalledWith("statut", "Terminé");
    });

    it("should not fetch when membreEquipeId is undefined", async () => {
      const { result } = renderHook(() => useMesTaches(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should return empty array when membreEquipeId is undefined and query runs", async () => {
      // This tests the queryFn early return
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(queryKeys.taches.mesTaches(undefined), []);

      const { result } = renderHook(() => useMesTaches(undefined), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      expect(result.current.data).toEqual([]);
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.taches.mesTaches("user-1");
      expect(expectedKey).toEqual(["taches", "mes-taches", "user-1"]);
    });
  });

  // ===========================================================================
  // useTache (single)
  // ===========================================================================
  describe("useTache", () => {
    it("should fetch a single task by id", async () => {
      setupSuccessfulSingleQuery(sampleTacheRecords[0]);

      const { result } = renderHook(() => useTache("tache-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("taches");
      expect(mockEq).toHaveBeenCalledWith("id", "tache-1");

      expect(result.current.data?.id).toBe("tache-1");
      expect(result.current.data?.nom).toBe("Développer API REST");
    });

    it("should not fetch when id is undefined", async () => {
      const { result } = renderHook(() => useTache(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should map all fields correctly", async () => {
      setupSuccessfulSingleQuery(sampleTacheRecords[0]);

      const { result } = renderHook(() => useTache("tache-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const tache = result.current.data;
      expect(tache?.description).toBe("Créer les endpoints pour le CRM");
      expect(tache?.priorite).toBe("Haute");
      expect(tache?.heuresEstimees).toBe(16);
      expect(tache?.heuresReelles).toBe(8);
      expect(tache?.projet).toEqual(["proj-1"]);
      expect(tache?.membreEquipe).toEqual(["user-1"]);
    });

    it("should calculate estEnRetard correctly for overdue task", async () => {
      setupSuccessfulSingleQuery(sampleTacheRecords[1]); // Overdue task

      const { result } = renderHook(() => useTache("tache-2"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.estEnRetard).toBe(true);
    });

    it("should calculate estEnRetard false for completed task", async () => {
      setupSuccessfulSingleQuery(sampleTacheRecords[2]); // Completed task

      const { result } = renderHook(() => useTache("tache-3"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.estEnRetard).toBe(false);
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.taches.detail("tache-1");
      expect(expectedKey).toEqual(["taches", "detail", "tache-1"]);
    });
  });

  // ===========================================================================
  // useCreateTache
  // ===========================================================================
  describe("useCreateTache", () => {
    it("should create a new task", async () => {
      const newRecord = {
        id: "tache-new",
        titre: "Nouvelle tâche",
        description: "Description test",
        statut: "À faire",
        priorite: "Moyenne",
        date_echeance: futureDate,
        heures_estimees: 4,
        heures_passees: null,
        created_at: new Date().toISOString(),
        date_terminee: null,
        ordre: null,
        projet_id: "proj-1",
        assignee_id: "user-1",
      };
      setupSuccessfulInsert(newRecord);

      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateTache(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        nom: "Nouvelle tâche",
        description: "Description test",
        priorite: "Moyenne",
        dateEcheance: futureDate,
        heuresEstimees: 4,
        projet: ["proj-1"],
        membreEquipe: ["user-1"],
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("taches");
      expect(mockInsert).toHaveBeenCalled();

      expect(result.current.data?.nom).toBe("Nouvelle tâche");

      // Should invalidate both taches and projets queries
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    });

    it("should handle creation errors", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useCreateTache(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ nom: "Test" });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should use default status À faire when not provided", async () => {
      const newRecord = {
        id: "tache-default",
        titre: "Default Status",
        description: null,
        statut: "À faire",
        priorite: "Moyenne",
        date_echeance: null,
        heures_estimees: null,
        heures_passees: null,
        created_at: new Date().toISOString(),
        date_terminee: null,
        ordre: null,
        projet_id: null,
        assignee_id: null,
      };
      setupSuccessfulInsert(newRecord);

      const { result } = renderHook(() => useCreateTache(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ nom: "Default Status" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.statut).toBe("À faire");
      expect(insertCall.priorite).toBe("Moyenne");
    });
  });

  // ===========================================================================
  // useUpdateTache
  // ===========================================================================
  describe("useUpdateTache", () => {
    it("should update a task", async () => {
      const updatedRecord = {
        ...sampleTacheRecords[0],
        description: "Updated description",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useUpdateTache(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "tache-1",
        data: { description: "Updated description" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("taches");
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", "tache-1");

      expect(result.current.data?.description).toBe("Updated description");
    });

    it("should cancel queries for optimistic update", async () => {
      const updatedRecord = {
        ...sampleTacheRecords[0],
        priorite: "Basse",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();
      const cancelQueriesSpy = vi.spyOn(queryClient, "cancelQueries");

      const { result } = renderHook(() => useUpdateTache(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "tache-1",
        data: { priorite: "Basse" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

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

      const { result } = renderHook(() => useUpdateTache(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "tache-1",
        data: { description: "Test" },
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should handle partial updates", async () => {
      const updatedRecord = {
        ...sampleTacheRecords[0],
        heures_passees: 12,
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateTache(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "tache-1",
        data: { heuresReelles: 12 },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.heures_passees).toBe(12);
      expect(updateCall.titre).toBeUndefined();
    });
  });

  // ===========================================================================
  // useUpdateTacheStatut
  // ===========================================================================
  describe("useUpdateTacheStatut", () => {
    it("should update task status", async () => {
      const updatedRecord = {
        ...sampleTacheRecords[0],
        statut: "En pause",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useUpdateTacheStatut(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "tache-1",
        statut: "En pause",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: "En pause",
        })
      );
    });

    it("should set date_terminee when status is Terminé", async () => {
      const updatedRecord = {
        ...sampleTacheRecords[0],
        statut: "Terminé",
        date_terminee: today,
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateTacheStatut(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "tache-1",
        statut: "Terminé",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.statut).toBe("Terminé");
      expect(updateCall.date_terminee).toBe(today);
    });

    it("should not set date_terminee for non-Terminé status", async () => {
      const updatedRecord = {
        ...sampleTacheRecords[0],
        statut: "En cours",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateTacheStatut(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "tache-1",
        statut: "En cours",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.date_terminee).toBeUndefined();
    });

    it("should cancel queries for optimistic Kanban update", async () => {
      const updatedRecord = {
        ...sampleTacheRecords[0],
        statut: "En cours",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();
      const cancelQueriesSpy = vi.spyOn(queryClient, "cancelQueries");

      const { result } = renderHook(() => useUpdateTacheStatut(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "tache-1",
        statut: "En cours",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(cancelQueriesSpy).toHaveBeenCalled();
    });

    it("should handle status update error", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Status update failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateTacheStatut(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "tache-1",
        statut: "Terminé",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ===========================================================================
  // useDeleteTache
  // ===========================================================================
  describe("useDeleteTache", () => {
    it("should delete a task", async () => {
      setupSuccessfulDelete();

      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteTache(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate("tache-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("taches");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", "tache-1");

      // Should invalidate both taches and projets queries
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    });

    it("should handle delete error", async () => {
      mockEq.mockResolvedValue({ error: { message: "Delete failed" } });
      mockDelete.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useDeleteTache(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("tache-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  // ===========================================================================
  // Query Keys
  // ===========================================================================
  describe("Query Keys", () => {
    it("should have all required query key factories", () => {
      expect(queryKeys.taches.all).toEqual(["taches"]);
      expect(queryKeys.taches.lists()).toEqual(["taches", "list"]);
      expect(queryKeys.taches.list()).toEqual(["taches", "list", undefined]);
      expect(queryKeys.taches.enRetard()).toEqual(["taches", "en-retard", undefined]);
      expect(queryKeys.taches.mesTaches("user-1")).toEqual(["taches", "mes-taches", "user-1"]);
      expect(queryKeys.taches.details()).toEqual(["taches", "detail"]);
      expect(queryKeys.taches.detail("123")).toEqual(["taches", "detail", "123"]);
    });

    it("should generate consistent keys for cache invalidation", () => {
      const allKey = queryKeys.taches.all;
      const listKey = queryKeys.taches.list();
      const enRetardKey = queryKeys.taches.enRetard();
      const mesTachesKey = queryKeys.taches.mesTaches("user-1");
      const detailKey = queryKeys.taches.detail("123");

      expect(listKey[0]).toBe(allKey[0]);
      expect(enRetardKey[0]).toBe(allKey[0]);
      expect(mesTachesKey[0]).toBe(allKey[0]);
      expect(detailKey[0]).toBe(allKey[0]);
    });
  });
});
