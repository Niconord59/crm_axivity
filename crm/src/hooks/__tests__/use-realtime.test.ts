import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

// Use vi.hoisted to define mocks that will be available in vi.mock factory
const { mockOn, mockSubscribe, mockRemoveChannel, mockChannel } = vi.hoisted(() => {
  const mockOn = vi.fn();
  const mockSubscribe = vi.fn();
  const mockRemoveChannel = vi.fn();

  const mockChannel = {
    on: mockOn,
    subscribe: mockSubscribe,
  };

  // Setup default implementations
  mockOn.mockReturnValue(mockChannel);
  mockSubscribe.mockImplementation((callback: (status: string) => void) => {
    setTimeout(() => callback("SUBSCRIBED"), 0);
    return mockChannel;
  });

  return { mockOn, mockSubscribe, mockRemoveChannel, mockChannel };
});

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  },
}));

// Import after mock
import {
  useProspectionRealtime,
  usePipelineRealtime,
  useProjetsRealtime,
  useFacturesRealtime,
  useDashboardRealtime,
} from "../use-realtime";
import { supabase } from "@/lib/supabase";

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("use-realtime hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockOn.mockReturnValue(mockChannel);
    mockSubscribe.mockImplementation((callback: (status: string) => void) => {
      setTimeout(() => callback("SUBSCRIBED"), 0);
      return mockChannel;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("useProspectionRealtime", () => {
    it("should create a channel and subscribe to contacts and clients tables", () => {
      renderHook(() => useProspectionRealtime(), {
        wrapper: createWrapper(),
      });

      // Should create channel
      expect(supabase.channel).toHaveBeenCalledWith("prospection-realtime");

      // Should subscribe to contacts
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        expect.any(Function)
      );

      // Should subscribe to clients
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        expect.any(Function)
      );

      // Should call subscribe
      expect(mockSubscribe).toHaveBeenCalled();
    });

    it("should not create channel when disabled", () => {
      renderHook(() => useProspectionRealtime(false), {
        wrapper: createWrapper(),
      });

      expect(supabase.channel).not.toHaveBeenCalled();
    });

    it("should cleanup channel on unmount", () => {
      const { unmount } = renderHook(() => useProspectionRealtime(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe("usePipelineRealtime", () => {
    it("should subscribe to opportunites, clients, contacts, and interactions tables", () => {
      renderHook(() => usePipelineRealtime(), {
        wrapper: createWrapper(),
      });

      expect(supabase.channel).toHaveBeenCalledWith("pipeline-realtime");

      // Should subscribe to 4 tables
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "opportunites" },
        expect.any(Function)
      );
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        expect.any(Function)
      );
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        expect.any(Function)
      );
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "interactions" },
        expect.any(Function)
      );
    });

    it("should cleanup on unmount", () => {
      const { unmount } = renderHook(() => usePipelineRealtime(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe("useProjetsRealtime", () => {
    it("should subscribe to projets and taches tables", () => {
      renderHook(() => useProjetsRealtime(), {
        wrapper: createWrapper(),
      });

      expect(supabase.channel).toHaveBeenCalledWith("projets-realtime");

      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "projets" },
        expect.any(Function)
      );
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "taches" },
        expect.any(Function)
      );
    });

    it("should cleanup on unmount", () => {
      const { unmount } = renderHook(() => useProjetsRealtime(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe("useFacturesRealtime", () => {
    it("should subscribe to factures, devis, and lignes_devis tables", () => {
      renderHook(() => useFacturesRealtime(), {
        wrapper: createWrapper(),
      });

      expect(supabase.channel).toHaveBeenCalledWith("factures-realtime");

      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "factures" },
        expect.any(Function)
      );
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "devis" },
        expect.any(Function)
      );
      expect(mockOn).toHaveBeenCalledWith(
        "postgres_changes",
        { event: "*", schema: "public", table: "lignes_devis" },
        expect.any(Function)
      );
    });

    it("should cleanup on unmount", () => {
      const { unmount } = renderHook(() => useFacturesRealtime(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe("useDashboardRealtime", () => {
    it("should subscribe to all main tables", () => {
      renderHook(() => useDashboardRealtime(), {
        wrapper: createWrapper(),
      });

      expect(supabase.channel).toHaveBeenCalledWith("dashboard-realtime");

      // Should subscribe to 6 tables
      const expectedTables = ["clients", "opportunites", "projets", "taches", "factures", "contacts"];
      expectedTables.forEach((table) => {
        expect(mockOn).toHaveBeenCalledWith(
          "postgres_changes",
          { event: "*", schema: "public", table },
          expect.any(Function)
        );
      });
    });

    it("should not create channel when disabled", () => {
      renderHook(() => useDashboardRealtime(false), {
        wrapper: createWrapper(),
      });

      expect(supabase.channel).not.toHaveBeenCalled();
    });

    it("should cleanup on unmount", () => {
      const { unmount } = renderHook(() => useDashboardRealtime(), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe("Query invalidation on change", () => {
    it("should invalidate queries when a contact change is received", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Capture the callback passed to .on() for contacts
      let contactsCallback: ((payload: { eventType: string }) => void) | null = null;
      mockOn.mockImplementation((type: string, config: { table: string }, callback: (payload: { eventType: string }) => void) => {
        if (config.table === "contacts") {
          contactsCallback = callback;
        }
        return mockChannel;
      });

      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);

      renderHook(() => useProspectionRealtime(), { wrapper });

      // Simulate a change event
      if (contactsCallback) {
        contactsCallback({ eventType: "INSERT" });
      }

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["prospects"] });
      });
    });

    it("should invalidate both clients and prospects when a client change is received", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      // Capture the callback for clients
      let clientsCallback: ((payload: { eventType: string }) => void) | null = null;
      mockOn.mockImplementation((type: string, config: { table: string }, callback: (payload: { eventType: string }) => void) => {
        if (config.table === "clients") {
          clientsCallback = callback;
        }
        return mockChannel;
      });

      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);

      renderHook(() => useProspectionRealtime(), { wrapper });

      // Simulate a change event
      if (clientsCallback) {
        clientsCallback({ eventType: "UPDATE" });
      }

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["clients"] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["prospects"] });
      });
    });
  });
});
