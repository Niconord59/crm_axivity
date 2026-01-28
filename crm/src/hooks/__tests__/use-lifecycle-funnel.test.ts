// CRM Axivity - useLifecycleFunnel Hook Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useLifecycleFunnel,
  calculateFunnelHealth,
  type LifecycleConversionRate,
} from "../use-lifecycle-funnel";

// Mock Supabase
const mockSelect = vi.fn();
const mockNot = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
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

// Helper to setup successful query
function setupSuccessfulQuery(contacts: unknown[]) {
  mockNot.mockResolvedValue({ data: contacts, error: null });
  mockSelect.mockReturnValue({ not: mockNot });
}

// Helper to setup query error
function setupQueryError(errorMessage: string) {
  mockNot.mockResolvedValue({
    data: null,
    error: { message: errorMessage },
  });
  mockSelect.mockReturnValue({ not: mockNot });
}

describe("use-lifecycle-funnel hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // useLifecycleFunnel
  // ===========================================================================
  describe("useLifecycleFunnel", () => {
    it("should fetch and calculate lifecycle funnel stats", async () => {
      const mockContacts = [
        { id: "1", lifecycle_stage: "Lead", created_at: "2024-01-01", lifecycle_stage_changed_at: "2024-01-01" },
        { id: "2", lifecycle_stage: "Lead", created_at: "2024-01-02", lifecycle_stage_changed_at: "2024-01-02" },
        { id: "3", lifecycle_stage: "MQL", created_at: "2024-01-03", lifecycle_stage_changed_at: "2024-01-05" },
        { id: "4", lifecycle_stage: "SQL", created_at: "2024-01-04", lifecycle_stage_changed_at: "2024-01-08" },
        { id: "5", lifecycle_stage: "Opportunity", created_at: "2024-01-05", lifecycle_stage_changed_at: "2024-01-10" },
        { id: "6", lifecycle_stage: "Customer", created_at: "2024-01-01", lifecycle_stage_changed_at: "2024-01-15" },
      ];
      setupSuccessfulQuery(mockContacts);

      const { result } = renderHook(() => useLifecycleFunnel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("contacts");
      expect(mockSelect).toHaveBeenCalledWith(
        "id, lifecycle_stage, created_at, lifecycle_stage_changed_at"
      );

      const data = result.current.data;
      expect(data).toBeDefined();
      expect(data?.totalContacts).toBe(6);
      expect(data?.churnedCount).toBe(0);

      // Check stage counts
      const leadStats = data?.stages.find((s) => s.stage === "Lead");
      expect(leadStats?.count).toBe(2);

      const mqlStats = data?.stages.find((s) => s.stage === "MQL");
      expect(mqlStats?.count).toBe(1);

      const customerStats = data?.stages.find((s) => s.stage === "Customer");
      expect(customerStats?.count).toBe(1);
    });

    it("should calculate stage percentages correctly", async () => {
      const mockContacts = [
        { id: "1", lifecycle_stage: "Lead", created_at: "2024-01-01", lifecycle_stage_changed_at: "2024-01-01" },
        { id: "2", lifecycle_stage: "Lead", created_at: "2024-01-02", lifecycle_stage_changed_at: "2024-01-02" },
        { id: "3", lifecycle_stage: "Lead", created_at: "2024-01-03", lifecycle_stage_changed_at: "2024-01-03" },
        { id: "4", lifecycle_stage: "Lead", created_at: "2024-01-04", lifecycle_stage_changed_at: "2024-01-04" },
        { id: "5", lifecycle_stage: "Customer", created_at: "2024-01-05", lifecycle_stage_changed_at: "2024-01-10" },
      ];
      setupSuccessfulQuery(mockContacts);

      const { result } = renderHook(() => useLifecycleFunnel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data;

      // 4 Leads out of 5 = 80%
      const leadStats = data?.stages.find((s) => s.stage === "Lead");
      expect(leadStats?.percentage).toBe(80);

      // 1 Customer out of 5 = 20%
      const customerStats = data?.stages.find((s) => s.stage === "Customer");
      expect(customerStats?.percentage).toBe(20);
    });

    it("should count churned contacts separately", async () => {
      const mockContacts = [
        { id: "1", lifecycle_stage: "Lead", created_at: "2024-01-01", lifecycle_stage_changed_at: "2024-01-01" },
        { id: "2", lifecycle_stage: "Churned", created_at: "2024-01-02", lifecycle_stage_changed_at: "2024-01-05" },
        { id: "3", lifecycle_stage: "Churned", created_at: "2024-01-03", lifecycle_stage_changed_at: "2024-01-06" },
        { id: "4", lifecycle_stage: "Customer", created_at: "2024-01-04", lifecycle_stage_changed_at: "2024-01-10" },
      ];
      setupSuccessfulQuery(mockContacts);

      const { result } = renderHook(() => useLifecycleFunnel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data;
      expect(data?.churnedCount).toBe(2);
      expect(data?.totalContacts).toBe(4);
    });

    it("should calculate average Lead to Customer cycle time", async () => {
      // Customer was created on Jan 1 and became Customer on Jan 15 = 14 days
      const mockContacts = [
        { id: "1", lifecycle_stage: "Lead", created_at: "2024-01-01", lifecycle_stage_changed_at: "2024-01-01" },
        { id: "2", lifecycle_stage: "Customer", created_at: "2024-01-01", lifecycle_stage_changed_at: "2024-01-15" }, // 14 days
        { id: "3", lifecycle_stage: "Customer", created_at: "2024-01-01", lifecycle_stage_changed_at: "2024-01-08" }, // 7 days
      ];
      setupSuccessfulQuery(mockContacts);

      const { result } = renderHook(() => useLifecycleFunnel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data;
      // Average of 14 and 7 = 10.5 → rounded to 11
      expect(data?.avgLeadToCustomerDays).toBe(11);
    });

    it("should return null for avgLeadToCustomerDays when no customers", async () => {
      const mockContacts = [
        { id: "1", lifecycle_stage: "Lead", created_at: "2024-01-01", lifecycle_stage_changed_at: "2024-01-01" },
        { id: "2", lifecycle_stage: "MQL", created_at: "2024-01-02", lifecycle_stage_changed_at: "2024-01-05" },
      ];
      setupSuccessfulQuery(mockContacts);

      const { result } = renderHook(() => useLifecycleFunnel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data;
      expect(data?.avgLeadToCustomerDays).toBeNull();
    });

    it("should handle empty contacts list", async () => {
      setupSuccessfulQuery([]);

      const { result } = renderHook(() => useLifecycleFunnel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data;
      expect(data?.totalContacts).toBe(0);
      expect(data?.churnedCount).toBe(0);
      expect(data?.avgLeadToCustomerDays).toBeNull();

      // All stages should have 0 count
      data?.stages.forEach((stage) => {
        expect(stage.count).toBe(0);
        expect(stage.percentage).toBe(0);
      });
    });

    it("should handle query errors", async () => {
      setupQueryError("Database connection failed");

      const { result } = renderHook(() => useLifecycleFunnel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should calculate conversion rates between stages", async () => {
      // Setup: 10 Leads, 5 MQL, 3 SQL, 2 Opportunity, 1 Customer
      const mockContacts = [
        ...Array(10).fill(null).map((_, i) => ({
          id: `lead-${i}`,
          lifecycle_stage: "Lead",
          created_at: "2024-01-01",
          lifecycle_stage_changed_at: "2024-01-01",
        })),
        ...Array(5).fill(null).map((_, i) => ({
          id: `mql-${i}`,
          lifecycle_stage: "MQL",
          created_at: "2024-01-01",
          lifecycle_stage_changed_at: "2024-01-05",
        })),
        ...Array(3).fill(null).map((_, i) => ({
          id: `sql-${i}`,
          lifecycle_stage: "SQL",
          created_at: "2024-01-01",
          lifecycle_stage_changed_at: "2024-01-10",
        })),
        ...Array(2).fill(null).map((_, i) => ({
          id: `opp-${i}`,
          lifecycle_stage: "Opportunity",
          created_at: "2024-01-01",
          lifecycle_stage_changed_at: "2024-01-15",
        })),
        {
          id: "customer-1",
          lifecycle_stage: "Customer",
          created_at: "2024-01-01",
          lifecycle_stage_changed_at: "2024-01-20",
        },
      ];
      setupSuccessfulQuery(mockContacts);

      const { result } = renderHook(() => useLifecycleFunnel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data;
      expect(data?.conversionRates).toBeDefined();
      expect(data?.conversionRates.length).toBeGreaterThan(0);

      // Verify Lead → MQL conversion rate is calculated
      const leadToMql = data?.conversionRates.find(
        (cr) => cr.fromStage === "Lead" && cr.toStage === "MQL"
      );
      expect(leadToMql).toBeDefined();
      expect(leadToMql?.rate).toBeGreaterThan(0);
    });

    it("should include all lifecycle stages in results", async () => {
      setupSuccessfulQuery([]);

      const { result } = renderHook(() => useLifecycleFunnel(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data;
      const stageNames = data?.stages.map((s) => s.stage);

      expect(stageNames).toContain("Lead");
      expect(stageNames).toContain("MQL");
      expect(stageNames).toContain("SQL");
      expect(stageNames).toContain("Opportunity");
      expect(stageNames).toContain("Customer");
      expect(stageNames).toContain("Evangelist");
      expect(stageNames).toContain("Churned");
    });
  });

  // ===========================================================================
  // calculateFunnelHealth
  // ===========================================================================
  describe("calculateFunnelHealth", () => {
    it("should return 0 for empty conversion rates", () => {
      expect(calculateFunnelHealth([])).toBe(0);
    });

    it("should calculate health based on average conversion rate", () => {
      const rates: LifecycleConversionRate[] = [
        { fromStage: "Lead", toStage: "MQL", rate: 50 },
        { fromStage: "MQL", toStage: "SQL", rate: 50 },
      ];
      // Average 50% = 100 health (capped)
      expect(calculateFunnelHealth(rates)).toBe(100);
    });

    it("should cap health at 100", () => {
      const rates: LifecycleConversionRate[] = [
        { fromStage: "Lead", toStage: "MQL", rate: 80 },
        { fromStage: "MQL", toStage: "SQL", rate: 70 },
      ];
      // Average 75% * 2 = 150 → capped at 100
      expect(calculateFunnelHealth(rates)).toBe(100);
    });

    it("should calculate proportionally for low conversion rates", () => {
      const rates: LifecycleConversionRate[] = [
        { fromStage: "Lead", toStage: "MQL", rate: 10 },
        { fromStage: "MQL", toStage: "SQL", rate: 10 },
      ];
      // Average 10% * 2 = 20 health
      expect(calculateFunnelHealth(rates)).toBe(20);
    });

    it("should round to nearest integer", () => {
      const rates: LifecycleConversionRate[] = [
        { fromStage: "Lead", toStage: "MQL", rate: 12.5 },
        { fromStage: "MQL", toStage: "SQL", rate: 12.5 },
      ];
      // Average 12.5% * 2 = 25
      expect(calculateFunnelHealth(rates)).toBe(25);
    });
  });
});
