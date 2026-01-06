// CRM Axivity - useInteractions Hook Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useInteractions,
  useInteraction,
  useCreateInteraction,
  useLastInteractionDate,
} from "../use-interactions";
import { queryKeys } from "@/lib/queryKeys";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Sample test data matching Supabase schema
const sampleInteractionRecords = [
  {
    id: "inter-1",
    objet: "Premier contact commercial",
    type: "Appel",
    date: "2024-03-15",
    resume: "Discussion initiale sur les besoins",
    contact_id: "contact-1",
    client_id: "client-1",
    user_id: "user-1",
    created_at: "2024-03-15T10:00:00Z",
  },
  {
    id: "inter-2",
    objet: "Envoi de documentation",
    type: "Email",
    date: "2024-03-16",
    resume: "Documentation produit envoyée",
    contact_id: "contact-1",
    client_id: "client-1",
    user_id: "user-1",
    created_at: "2024-03-16T14:00:00Z",
  },
  {
    id: "inter-3",
    objet: "Réunion de présentation",
    type: "Réunion",
    date: "2024-03-20",
    resume: "Présentation du projet et devis",
    contact_id: "contact-2",
    client_id: "client-2",
    user_id: "user-2",
    created_at: "2024-03-20T09:00:00Z",
  },
  {
    id: "inter-4",
    objet: "Note interne",
    type: "Note",
    date: "2024-03-21",
    resume: "Point sur la négociation",
    contact_id: null,
    client_id: "client-1",
    user_id: "user-1",
    created_at: "2024-03-21T11:00:00Z",
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

// Helper to setup successful query chain (select → order)
function setupSuccessfulQuery(data: unknown[]) {
  mockOrder.mockReset();
  mockEq.mockReset();
  mockSelect.mockReset();

  mockOrder.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({
    order: (...args: unknown[]) => {
      mockOrder(...args);
      return {
        eq: vi.fn().mockResolvedValue({ data, error: null }),
        data,
        error: null,
      };
    },
    eq: mockEq,
  });
}

// Helper for useLastInteractionDate query chain (select → order → limit)
function setupLastDateQuery(data: unknown[] | null) {
  mockOrder.mockReset();
  mockLimit.mockReset();
  mockEq.mockReset();
  mockSelect.mockReset();

  mockLimit.mockResolvedValue({ data, error: null });
  mockOrder.mockReturnValue({
    limit: mockLimit,
    eq: vi.fn().mockReturnValue({ limit: mockLimit }),
  });
  mockSelect.mockReturnValue({
    order: mockOrder,
    eq: mockEq,
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

// Helper to setup query error
function setupQueryError(errorMessage: string) {
  mockOrder.mockResolvedValue({ data: null, error: { message: errorMessage } });
  mockSelect.mockReturnValue({
    order: mockOrder,
    eq: mockEq,
  });
}

describe("use-interactions hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // useInteractions
  // ===========================================================================
  describe("useInteractions", () => {
    it("should fetch all interactions successfully", async () => {
      setupSuccessfulQuery(sampleInteractionRecords);

      const { result } = renderHook(() => useInteractions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("interactions");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockOrder).toHaveBeenCalledWith("date", {
        ascending: false,
        nullsFirst: false,
      });

      expect(result.current.data).toHaveLength(4);
      expect(result.current.data?.[0].objet).toBe("Premier contact commercial");
    });

    it("should accept contactId filter option", async () => {
      const contact1Records = sampleInteractionRecords.filter(
        (r) => r.contact_id === "contact-1"
      );

      mockOrder.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: contact1Records, error: null }),
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
        eq: mockEq,
      });

      const { result } = renderHook(
        () => useInteractions({ contactId: "contact-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it("should accept clientId filter option", async () => {
      const client1Records = sampleInteractionRecords.filter(
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
        () => useInteractions({ clientId: "client-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
    });

    it("should handle empty results", async () => {
      setupSuccessfulQuery([]);

      const { result } = renderHook(() => useInteractions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should handle query errors", async () => {
      setupQueryError("Database connection failed");

      const { result } = renderHook(() => useInteractions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should map all fields correctly", async () => {
      setupSuccessfulQuery([sampleInteractionRecords[0]]);

      const { result } = renderHook(() => useInteractions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const interaction = result.current.data?.[0];
      expect(interaction?.id).toBe("inter-1");
      expect(interaction?.objet).toBe("Premier contact commercial");
      expect(interaction?.type).toBe("Appel");
      expect(interaction?.date).toBe("2024-03-15");
      expect(interaction?.resume).toBe("Discussion initiale sur les besoins");
      expect(interaction?.contact).toEqual(["contact-1"]);
      expect(interaction?.client).toEqual(["client-1"]);
      expect(interaction?.membreEquipe).toEqual(["user-1"]);
    });

    it("should handle null linked fields", async () => {
      setupSuccessfulQuery([sampleInteractionRecords[3]]); // Note with null contact_id

      const { result } = renderHook(() => useInteractions(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const interaction = result.current.data?.[0];
      expect(interaction?.contact).toBeUndefined();
      expect(interaction?.client).toEqual(["client-1"]);
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.interactions.list({});
      expect(expectedKey).toEqual(["interactions", "list", {}]);
    });

    it("should have correct query key with filters", () => {
      const expectedKey = queryKeys.interactions.list({
        contactId: "contact-1",
        clientId: "client-1",
      });
      expect(expectedKey).toEqual([
        "interactions",
        "list",
        { contactId: "contact-1", clientId: "client-1" },
      ]);
    });
  });

  // ===========================================================================
  // useInteraction (single)
  // ===========================================================================
  describe("useInteraction", () => {
    it("should fetch a single interaction by id", async () => {
      setupSuccessfulSingleQuery(sampleInteractionRecords[0]);

      const { result } = renderHook(() => useInteraction("inter-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("interactions");
      expect(mockEq).toHaveBeenCalledWith("id", "inter-1");

      expect(result.current.data?.id).toBe("inter-1");
      expect(result.current.data?.objet).toBe("Premier contact commercial");
    });

    it("should not fetch when id is undefined", async () => {
      const { result } = renderHook(() => useInteraction(undefined), {
        wrapper: createWrapper(),
      });

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

      const { result } = renderHook(() => useInteraction("non-existent"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.interactions.detail("inter-1");
      expect(expectedKey).toEqual(["interactions", "detail", "inter-1"]);
    });
  });

  // ===========================================================================
  // useCreateInteraction
  // ===========================================================================
  describe("useCreateInteraction", () => {
    it("should create a new interaction", async () => {
      const newRecord = {
        id: "inter-new",
        objet: "Nouvelle interaction",
        type: "Email",
        date: "2024-04-01",
        resume: "Test résumé",
        contact_id: "contact-1",
        client_id: "client-1",
        user_id: "user-1",
        created_at: new Date().toISOString(),
      };
      setupSuccessfulInsert(newRecord);

      const queryClient = createTestQueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateInteraction(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        objet: "Nouvelle interaction",
        type: "Email",
        date: "2024-04-01",
        resume: "Test résumé",
        contact: ["contact-1"],
        client: ["client-1"],
        membreEquipe: ["user-1"],
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("interactions");
      expect(mockInsert).toHaveBeenCalled();

      expect(result.current.data?.objet).toBe("Nouvelle interaction");
      expect(result.current.data?.type).toBe("Email");

      // Should invalidate interactions queries
      expect(invalidateQueriesSpy).toHaveBeenCalled();
    });

    it("should handle creation errors", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useCreateInteraction(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        objet: "Test",
        type: "Appel",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should pass correct data to insert", async () => {
      const newRecord = {
        id: "inter-check",
        objet: "Check insert",
        type: "Réunion",
        date: "2024-04-15",
        resume: "Vérification des données",
        contact_id: "contact-2",
        client_id: "client-2",
        user_id: "user-2",
        created_at: new Date().toISOString(),
      };
      setupSuccessfulInsert(newRecord);

      const { result } = renderHook(() => useCreateInteraction(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        objet: "Check insert",
        type: "Réunion",
        date: "2024-04-15",
        resume: "Vérification des données",
        contact: ["contact-2"],
        client: ["client-2"],
        membreEquipe: ["user-2"],
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.objet).toBe("Check insert");
      expect(insertCall.type).toBe("Réunion");
      expect(insertCall.date).toBe("2024-04-15");
      expect(insertCall.resume).toBe("Vérification des données");
      expect(insertCall.contact_id).toBe("contact-2");
      expect(insertCall.client_id).toBe("client-2");
      expect(insertCall.user_id).toBe("user-2");
    });

    it("should create interaction with minimal data", async () => {
      const newRecord = {
        id: "inter-minimal",
        objet: "Minimal",
        type: "Note",
        date: null,
        resume: null,
        contact_id: null,
        client_id: null,
        user_id: null,
        created_at: new Date().toISOString(),
      };
      setupSuccessfulInsert(newRecord);

      const { result } = renderHook(() => useCreateInteraction(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        objet: "Minimal",
        type: "Note",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.objet).toBe("Minimal");
      expect(insertCall.type).toBe("Note");
      expect(insertCall.contact_id).toBeUndefined();
    });
  });

  // ===========================================================================
  // useLastInteractionDate
  // ===========================================================================
  describe("useLastInteractionDate", () => {
    it("should fetch last interaction date for contact", async () => {
      setupLastDateQuery([{ date: "2024-03-16" }]);

      mockOrder.mockReturnValue({
        limit: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ date: "2024-03-16" }], error: null }),
        }),
      });
      mockSelect.mockReturnValue({ order: mockOrder });

      const { result } = renderHook(
        () => useLastInteractionDate({ contactId: "contact-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe("2024-03-16");
    });

    it("should fetch last interaction date for client", async () => {
      mockOrder.mockReturnValue({
        limit: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ date: "2024-03-21" }], error: null }),
        }),
      });
      mockSelect.mockReturnValue({ order: mockOrder });

      const { result } = renderHook(
        () => useLastInteractionDate({ clientId: "client-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe("2024-03-21");
    });

    it("should not fetch when no contactId or clientId provided", async () => {
      const { result } = renderHook(() => useLastInteractionDate(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should return null when no interactions found", async () => {
      mockOrder.mockReturnValue({
        limit: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });
      mockSelect.mockReturnValue({ order: mockOrder });

      const { result } = renderHook(
        () => useLastInteractionDate({ contactId: "contact-no-interactions" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(null);
    });

    it("should return null when interaction has no date", async () => {
      mockOrder.mockReturnValue({
        limit: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ date: null }], error: null }),
        }),
      });
      mockSelect.mockReturnValue({ order: mockOrder });

      const { result } = renderHook(
        () => useLastInteractionDate({ contactId: "contact-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(null);
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.interactions.lastDate({ contactId: "contact-1" });
      expect(expectedKey).toEqual(["interactions", "last-date", { contactId: "contact-1" }]);
    });

    it("should have correct query key with clientId", () => {
      const expectedKey = queryKeys.interactions.lastDate({ clientId: "client-1" });
      expect(expectedKey).toEqual(["interactions", "last-date", { clientId: "client-1" }]);
    });
  });

  // ===========================================================================
  // Query Keys
  // ===========================================================================
  describe("Query Keys", () => {
    it("should have all required query key factories", () => {
      expect(queryKeys.interactions.all).toEqual(["interactions"]);
      expect(queryKeys.interactions.lists()).toEqual(["interactions", "list"]);
      expect(queryKeys.interactions.list()).toEqual(["interactions", "list", undefined]);
      expect(queryKeys.interactions.details()).toEqual(["interactions", "detail"]);
      expect(queryKeys.interactions.detail("123")).toEqual(["interactions", "detail", "123"]);
    });

    it("should generate consistent keys for cache invalidation", () => {
      const allKey = queryKeys.interactions.all;
      const listKey = queryKeys.interactions.list();
      const detailKey = queryKeys.interactions.detail("123");
      const lastDateKey = queryKeys.interactions.lastDate({ contactId: "c1" });

      expect(listKey[0]).toBe(allKey[0]);
      expect(detailKey[0]).toBe(allKey[0]);
      expect(lastDateKey[0]).toBe(allKey[0]);
    });
  });
});
