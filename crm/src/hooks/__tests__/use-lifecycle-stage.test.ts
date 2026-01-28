// CRM Axivity - useLifecycleStage Hook Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useUpdateLifecycleStage,
  useBatchUpdateLifecycleStage,
  isLifecycleDowngrade,
  getNextLifecycleStage,
} from "../use-lifecycle-stage";
import { queryKeys } from "@/lib/queryKeys";
import type { LifecycleStage } from "@/types";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();

const mockFrom = vi.fn(() => ({
  update: mockUpdate,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

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

// Helper to setup successful single update
function setupSuccessfulUpdate(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

// Helper to setup successful batch update
function setupSuccessfulBatchUpdate(data: unknown[]) {
  mockSelect.mockResolvedValue({ data, error: null });
  mockIn.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ in: mockIn });
}

// Helper to setup update error
function setupUpdateError(errorMessage: string) {
  mockSingle.mockResolvedValue({
    data: null,
    error: { message: errorMessage },
  });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

describe("use-lifecycle-stage hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // Utility Functions
  // ===========================================================================
  describe("isLifecycleDowngrade", () => {
    it("should return false when current stage is undefined", () => {
      expect(isLifecycleDowngrade(undefined, "Lead")).toBe(false);
      expect(isLifecycleDowngrade(undefined, "Customer")).toBe(false);
    });

    it("should return false for forward transitions", () => {
      expect(isLifecycleDowngrade("Lead", "MQL")).toBe(false);
      expect(isLifecycleDowngrade("MQL", "SQL")).toBe(false);
      expect(isLifecycleDowngrade("SQL", "Opportunity")).toBe(false);
      expect(isLifecycleDowngrade("Opportunity", "Customer")).toBe(false);
      expect(isLifecycleDowngrade("Customer", "Evangelist")).toBe(false);
    });

    it("should return true for backward transitions", () => {
      expect(isLifecycleDowngrade("Customer", "Lead")).toBe(true);
      expect(isLifecycleDowngrade("Customer", "SQL")).toBe(true);
      expect(isLifecycleDowngrade("Opportunity", "MQL")).toBe(true);
      expect(isLifecycleDowngrade("SQL", "Lead")).toBe(true);
      expect(isLifecycleDowngrade("Evangelist", "Customer")).toBe(true);
    });

    it("should return false for same stage", () => {
      expect(isLifecycleDowngrade("Lead", "Lead")).toBe(false);
      expect(isLifecycleDowngrade("Customer", "Customer")).toBe(false);
    });

    it("should return false for Churned transition (special case)", () => {
      // Churned is not considered a downgrade - it's a terminal state
      expect(isLifecycleDowngrade("Customer", "Churned")).toBe(false);
      expect(isLifecycleDowngrade("Evangelist", "Churned")).toBe(false);
      expect(isLifecycleDowngrade("Lead", "Churned")).toBe(false);
    });
  });

  describe("getNextLifecycleStage", () => {
    it("should return Lead when current stage is undefined", () => {
      expect(getNextLifecycleStage(undefined)).toBe("Lead");
    });

    it("should return next stage in the funnel", () => {
      expect(getNextLifecycleStage("Lead")).toBe("MQL");
      expect(getNextLifecycleStage("MQL")).toBe("SQL");
      expect(getNextLifecycleStage("SQL")).toBe("Opportunity");
      expect(getNextLifecycleStage("Opportunity")).toBe("Customer");
      expect(getNextLifecycleStage("Customer")).toBe("Evangelist");
    });

    it("should return null for Evangelist (no next stage)", () => {
      expect(getNextLifecycleStage("Evangelist")).toBe(null);
    });

    it("should return null for Churned", () => {
      expect(getNextLifecycleStage("Churned")).toBe(null);
    });
  });

  // ===========================================================================
  // useUpdateLifecycleStage
  // ===========================================================================
  describe("useUpdateLifecycleStage", () => {
    it("should update lifecycle stage successfully", async () => {
      const updatedRecord = {
        id: "contact-1",
        lifecycle_stage: "MQL",
        lifecycle_stage_changed_at: "2024-03-20T10:00:00Z",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();
      const refetchQueriesSpy = vi.spyOn(queryClient, "refetchQueries");

      const { result } = renderHook(() => useUpdateLifecycleStage(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        contactId: "contact-1",
        newStage: "MQL",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("contacts");
      expect(mockUpdate).toHaveBeenCalledWith({
        lifecycle_stage: "MQL",
      });
      expect(mockEq).toHaveBeenCalledWith("id", "contact-1");

      expect(result.current.data?.lifecycleStage).toBe("MQL");
      expect(result.current.data?.id).toBe("contact-1");

      // Should refetch/invalidate queries
      expect(refetchQueriesSpy).toHaveBeenCalled();
    });

    it("should throw error on downgrade without forceDowngrade", async () => {
      const { result } = renderHook(() => useUpdateLifecycleStage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: "contact-1",
        newStage: "Lead",
        currentStage: "Customer",
        forceDowngrade: false,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect((result.current.error as Error).message).toContain("rétrogradage");
    });

    it("should allow downgrade with forceDowngrade: true", async () => {
      const updatedRecord = {
        id: "contact-1",
        lifecycle_stage: "Lead",
        lifecycle_stage_changed_at: "2024-03-20T10:00:00Z",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateLifecycleStage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: "contact-1",
        newStage: "Lead",
        currentStage: "Customer",
        forceDowngrade: true,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.lifecycleStage).toBe("Lead");
    });

    it("should allow forward transitions without forceDowngrade", async () => {
      const updatedRecord = {
        id: "contact-1",
        lifecycle_stage: "Customer",
        lifecycle_stage_changed_at: "2024-03-20T10:00:00Z",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateLifecycleStage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: "contact-1",
        newStage: "Customer",
        currentStage: "Opportunity",
        forceDowngrade: false,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.lifecycleStage).toBe("Customer");
    });

    it("should handle update errors", async () => {
      setupUpdateError("Database connection failed");

      const { result } = renderHook(() => useUpdateLifecycleStage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: "contact-1",
        newStage: "SQL",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should invalidate correct query keys on success", async () => {
      const updatedRecord = {
        id: "contact-1",
        lifecycle_stage: "SQL",
        lifecycle_stage_changed_at: "2024-03-20T10:00:00Z",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
      const refetchQueriesSpy = vi.spyOn(queryClient, "refetchQueries");

      const { result } = renderHook(() => useUpdateLifecycleStage(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        contactId: "contact-1",
        newStage: "SQL",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(refetchQueriesSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.prospects.all,
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.prospects.detail("contact-1"),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.prospects.kpis(),
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.contacts.all,
      });
    });
  });

  // ===========================================================================
  // useBatchUpdateLifecycleStage
  // ===========================================================================
  describe("useBatchUpdateLifecycleStage", () => {
    it("should batch update lifecycle stages successfully", async () => {
      const updatedRecords = [
        { id: "contact-1" },
        { id: "contact-2" },
        { id: "contact-3" },
      ];
      setupSuccessfulBatchUpdate(updatedRecords);

      const queryClient = createTestQueryClient();
      const refetchQueriesSpy = vi.spyOn(queryClient, "refetchQueries");

      const { result } = renderHook(() => useBatchUpdateLifecycleStage(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        contactIds: ["contact-1", "contact-2", "contact-3"],
        newStage: "MQL",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("contacts");
      expect(mockUpdate).toHaveBeenCalledWith({
        lifecycle_stage: "MQL",
      });
      expect(mockIn).toHaveBeenCalledWith("id", [
        "contact-1",
        "contact-2",
        "contact-3",
      ]);

      expect(result.current.data?.updated).toBe(3);
      expect(result.current.data?.contactIds).toEqual([
        "contact-1",
        "contact-2",
        "contact-3",
      ]);

      expect(refetchQueriesSpy).toHaveBeenCalled();
    });

    it("should handle empty contactIds array", async () => {
      const { result } = renderHook(() => useBatchUpdateLifecycleStage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactIds: [],
        newStage: "MQL",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.updated).toBe(0);
      expect(result.current.data?.contactIds).toEqual([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should handle batch update errors", async () => {
      mockSelect.mockResolvedValue({
        data: null,
        error: { message: "Batch update failed" },
      });
      mockIn.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ in: mockIn });

      const { result } = renderHook(() => useBatchUpdateLifecycleStage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactIds: ["contact-1", "contact-2"],
        newStage: "SQL",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should handle partial updates (some records not found)", async () => {
      const updatedRecords = [{ id: "contact-1" }]; // Only 1 of 3 updated
      setupSuccessfulBatchUpdate(updatedRecords);

      const { result } = renderHook(() => useBatchUpdateLifecycleStage(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactIds: ["contact-1", "contact-2", "contact-3"],
        newStage: "Opportunity",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.updated).toBe(1);
      expect(result.current.data?.contactIds).toEqual(["contact-1"]);
    });
  });

  // ===========================================================================
  // Query Keys
  // ===========================================================================
  describe("Query Keys Integration", () => {
    it("should use correct query keys for invalidation", () => {
      // Verify query keys structure
      expect(queryKeys.prospects.all).toEqual(["prospects"]);
      expect(queryKeys.prospects.detail("test-id")).toEqual([
        "prospects",
        "detail",
        "test-id",
      ]);
      expect(queryKeys.prospects.kpis()).toContain("kpis");
      expect(queryKeys.contacts.all).toEqual(["contacts"]);
      expect(queryKeys.contacts.detail("test-id")).toEqual([
        "contacts",
        "detail",
        "test-id",
      ]);
    });
  });
});
