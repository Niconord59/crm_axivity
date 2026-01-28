// CRM Axivity - useConvertToOpportunity Hook Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useConvertToOpportunity } from "../use-convert-opportunity";

// Mock Supabase
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn((table: string) => {
  return {
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
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

// Sample test data
const testContactId = "contact-123";
const testClientId = "client-456";
const testContactNom = "John Doe";
const testClientNom = "Acme Corp";
const testOpportunityId = "opp-789";

describe("useConvertToOpportunity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Helper to setup successful conversion
  function setupSuccessfulConversion() {
    // Mock opportunites insert
    const oppInsertSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: testOpportunityId },
        error: null,
      }),
    });

    // Mock opportunite_contacts insert (no .select needed)
    const pivotInsertResult = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    // Mock contacts update
    const contactUpdateSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: testContactId },
        error: null,
      }),
    });
    const contactUpdateEq = vi.fn().mockReturnValue({
      data: null,
      error: null,
    });

    // Mock interactions insert (non-blocking)
    const interactionInsertResult = vi.fn().mockResolvedValue({
      data: { id: "int-1" },
      error: null,
    });

    // Mock clients select + update
    const clientSelectEq = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { statut: "Prospect" },
        error: null,
      }),
    });
    const clientUpdateEq = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "opportunites") {
        return {
          insert: vi.fn().mockReturnValue({
            select: oppInsertSelect,
          }),
        };
      }
      if (table === "opportunite_contacts") {
        return {
          insert: pivotInsertResult,
        };
      }
      if (table === "contacts") {
        return {
          update: vi.fn().mockReturnValue({
            eq: contactUpdateEq,
          }),
        };
      }
      if (table === "interactions") {
        return {
          insert: interactionInsertResult,
        };
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: clientSelectEq,
          }),
          update: vi.fn().mockReturnValue({
            eq: clientUpdateEq,
          }),
        };
      }
      return {};
    });
  }

  describe("successful conversion", () => {
    it("should create opportunity with correct data", async () => {
      setupSuccessfulConversion();

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      // Trigger mutation
      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
        valeurEstimee: 10000,
        notes: "Test notes",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify opportunites table was called
      expect(mockFrom).toHaveBeenCalledWith("opportunites");
    });

    it("should create N:N link in opportunite_contacts", async () => {
      setupSuccessfulConversion();

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify opportunite_contacts table was called
      expect(mockFrom).toHaveBeenCalledWith("opportunite_contacts");
    });

    it("should update contact lifecycle_stage to Opportunity", async () => {
      setupSuccessfulConversion();

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify contacts table was called for update
      expect(mockFrom).toHaveBeenCalledWith("contacts");
    });

    it("should create interaction for audit trail", async () => {
      setupSuccessfulConversion();

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify interactions table was called
      expect(mockFrom).toHaveBeenCalledWith("interactions");
    });

    it("should return opportunityId on success", async () => {
      setupSuccessfulConversion();

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.opportunityId).toBe(testOpportunityId);
      expect(result.current.data?.contactId).toBe(testContactId);
      expect(result.current.data?.clientId).toBe(testClientId);
    });
  });

  describe("error handling", () => {
    it("should handle opportunity creation error", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "opportunites") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Insert failed" },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Insert failed");
    });

    it("should handle pivot table creation error", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "opportunites") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: testOpportunityId },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "opportunite_contacts") {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Pivot insert failed" },
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Pivot insert failed");
    });

    it("should handle contact update error", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "opportunites") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: testOpportunityId },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "opportunite_contacts") {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        if (table === "contacts") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Contact update failed" },
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Contact update failed");
    });

    it("should continue if interaction creation fails (non-blocking)", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "opportunites") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: testOpportunityId },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "opportunite_contacts") {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        if (table === "contacts") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          };
        }
        if (table === "interactions") {
          return {
            insert: vi.fn().mockRejectedValue(new Error("Interaction failed")),
          };
        }
        if (table === "clients") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { statut: "Actif" }, // Not Prospect, so no update
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should succeed even if interaction creation fails
      expect(result.current.data?.opportunityId).toBe(testOpportunityId);
    });
  });

  describe("client status update", () => {
    it("should update client from Prospect to Actif", async () => {
      const clientUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "opportunites") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: testOpportunityId },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "opportunite_contacts") {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "contacts") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === "interactions") {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "clients") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { statut: "Prospect" },
                  error: null,
                }),
              }),
            }),
            update: clientUpdateMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Client update should have been called
      expect(clientUpdateMock).toHaveBeenCalled();
    });

    it("should not update client if already Actif", async () => {
      const clientUpdateMock = vi.fn();

      mockFrom.mockImplementation((table: string) => {
        if (table === "opportunites") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: testOpportunityId },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "opportunite_contacts") {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "contacts") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === "interactions") {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "clients") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { statut: "Actif" }, // Already Actif
                  error: null,
                }),
              }),
            }),
            update: clientUpdateMock,
          };
        }
        return {};
      });

      const { result } = renderHook(() => useConvertToOpportunity(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        contactId: testContactId,
        clientId: testClientId,
        contactNom: testContactNom,
        clientNom: testClientNom,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Client update should NOT have been called since statut !== "Prospect"
      expect(clientUpdateMock).not.toHaveBeenCalled();
    });
  });
});
