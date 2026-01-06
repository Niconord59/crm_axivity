// CRM Axivity - ProspectionKPIs Component Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock Supabase client before any imports that use it
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

import { ProspectionKPIs } from "../ProspectionKPIs";
import type { ProspectionKPIData } from "@/hooks/use-prospects";

// Mock useProspectionKPIs hook
const mockKPIs: ProspectionKPIData = {
  total: 100,
  aAppeler: 25,
  rappels: 15,
  rappelsEnRetard: 3,
  qualifies: 40,
  tauxQualification: 40,
};

vi.mock("@/hooks/use-prospects", () => ({
  useProspectionKPIs: vi.fn(() => ({
    data: mockKPIs,
    isLoading: false,
  })),
}));

// Import after mock
import { useProspectionKPIs } from "@/hooks/use-prospects";
const mockUseProspectionKPIs = vi.mocked(useProspectionKPIs);

describe("ProspectionKPIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProspectionKPIs.mockReturnValue({
      data: mockKPIs,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useProspectionKPIs>);
  });

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================
  describe("Loading State", () => {
    it("should show 4 skeletons when loading", () => {
      mockUseProspectionKPIs.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
      } as ReturnType<typeof useProspectionKPIs>);

      const { container } = render(<ProspectionKPIs />);

      // Should show 4 skeleton elements
      const skeletons = container.querySelectorAll(".h-\\[108px\\]");
      expect(skeletons.length).toBe(4);
    });

    it("should not show KPI cards when loading", () => {
      mockUseProspectionKPIs.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
      } as ReturnType<typeof useProspectionKPIs>);

      render(<ProspectionKPIs />);

      expect(screen.queryByText("Leads à appeler")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // KPI RENDERING
  // ===========================================================================
  describe("KPI Rendering", () => {
    it("should render all 4 KPI cards", () => {
      render(<ProspectionKPIs />);

      expect(screen.getByText("Leads à appeler")).toBeInTheDocument();
      expect(screen.getByText("Rappels en attente")).toBeInTheDocument();
      expect(screen.getByText("Taux qualification")).toBeInTheDocument();
      expect(screen.getByText("Rappels en retard")).toBeInTheDocument();
    });

    it("should display correct values for leads à appeler", () => {
      render(<ProspectionKPIs />);

      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("sur 100 total")).toBeInTheDocument();
    });

    it("should display correct values for rappels en attente", () => {
      render(<ProspectionKPIs />);

      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("3 en retard")).toBeInTheDocument();
    });

    it("should display qualification rate as percentage", () => {
      render(<ProspectionKPIs />);

      expect(screen.getByText("40%")).toBeInTheDocument();
      expect(screen.getByText("40 qualifiés")).toBeInTheDocument();
    });

    it("should display overdue callbacks count", () => {
      render(<ProspectionKPIs />);

      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("À traiter en priorité")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // VARIANT STYLING
  // ===========================================================================
  describe("Variant Styling", () => {
    it("should apply destructive variant when rappels en retard > 0", () => {
      const { container } = render(<ProspectionKPIs />);

      // Check for destructive border class on cards
      const destructiveCards = container.querySelectorAll(".border-destructive");
      expect(destructiveCards.length).toBe(2); // Both "Rappels en attente" and "Rappels en retard"
    });

    it("should not apply destructive variant when rappels en retard is 0", () => {
      mockUseProspectionKPIs.mockReturnValue({
        data: {
          ...mockKPIs,
          rappelsEnRetard: 0,
        },
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useProspectionKPIs>);

      const { container } = render(<ProspectionKPIs />);

      // No destructive cards when no overdue
      const destructiveCards = container.querySelectorAll(".border-destructive");
      expect(destructiveCards.length).toBe(0);
    });

    it("should show 'Tous à jour' when no rappels en retard", () => {
      mockUseProspectionKPIs.mockReturnValue({
        data: {
          ...mockKPIs,
          rappelsEnRetard: 0,
        },
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useProspectionKPIs>);

      render(<ProspectionKPIs />);

      expect(screen.getByText("Tous à jour")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================
  describe("Edge Cases", () => {
    it("should handle undefined kpis data", () => {
      mockUseProspectionKPIs.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useProspectionKPIs>);

      render(<ProspectionKPIs />);

      // Should show 0 for all values
      expect(screen.getByText("Leads à appeler")).toBeInTheDocument();
      expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    });

    it("should handle zero values gracefully", () => {
      mockUseProspectionKPIs.mockReturnValue({
        data: {
          total: 0,
          aAppeler: 0,
          rappels: 0,
          rappelsEnRetard: 0,
          qualifies: 0,
          tauxQualification: 0,
        },
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useProspectionKPIs>);

      render(<ProspectionKPIs />);

      expect(screen.getByText("sur 0 total")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(screen.getByText("0 qualifiés")).toBeInTheDocument();
    });

    it("should handle large numbers", () => {
      mockUseProspectionKPIs.mockReturnValue({
        data: {
          total: 99999,
          aAppeler: 50000,
          rappels: 25000,
          rappelsEnRetard: 10000,
          qualifies: 30000,
          tauxQualification: 85,
        },
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useProspectionKPIs>);

      render(<ProspectionKPIs />);

      expect(screen.getByText("50000")).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("should handle 100% qualification rate", () => {
      mockUseProspectionKPIs.mockReturnValue({
        data: {
          ...mockKPIs,
          tauxQualification: 100,
          qualifies: 100,
        },
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useProspectionKPIs>);

      render(<ProspectionKPIs />);

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("100 qualifiés")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // GRID LAYOUT
  // ===========================================================================
  describe("Grid Layout", () => {
    it("should render KPIs in a responsive grid", () => {
      const { container } = render(<ProspectionKPIs />);

      // Check for responsive grid classes
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("sm:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-4");
    });

    it("should have proper gap between cards", () => {
      const { container } = render(<ProspectionKPIs />);

      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("gap-4");
    });
  });

  // ===========================================================================
  // TOOLTIPS
  // ===========================================================================
  describe("Tooltips", () => {
    it("should have cursor-help class for KPI titles (tooltip triggers)", () => {
      const { container } = render(<ProspectionKPIs />);

      // Titles with tooltips have cursor-help class
      const tooltipTriggers = container.querySelectorAll(".cursor-help");
      expect(tooltipTriggers.length).toBe(4); // One for each KPI
    });
  });
});
