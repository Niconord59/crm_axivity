// CRM Axivity - QuoteLinesTable Component Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuoteLinesTable } from "../QuoteLinesTable";
import type { LigneDevis } from "@/types";

// Mock ServiceSelector to avoid complex service loading
vi.mock("../ServiceSelector", () => ({
  ServiceSelector: ({ onSelect, placeholder }: { onSelect: (s: unknown) => void, placeholder: string }) => (
    <select
      data-testid="service-selector"
      onChange={(e) => {
        if (e.target.value === "service-1") {
          onSelect({
            id: "service-1",
            nom: "Service Test",
            prixUnitaire: 1000,
            categorie: "Conseil",
          });
        }
      }}
    >
      <option value="">{placeholder}</option>
      <option value="service-1">Service Test</option>
    </select>
  ),
}));

// Sample ligne data
const createLigne = (overrides: Partial<LigneDevis> = {}): LigneDevis => ({
  id: "ligne-1",
  devis: ["devis-1"],
  serviceId: "service-1",
  serviceNom: "Service Test",
  serviceCategorie: "Conseil",
  description: "Description test",
  quantite: 2,
  prixUnitaire: 1000,
  remisePourcent: 10,
  montantHT: 1800, // 2 * 1000 * (1 - 0.10)
  ordre: 1,
  ...overrides,
});

describe("QuoteLinesTable", () => {
  const mockOnUpdateLine = vi.fn();
  const mockOnDeleteLine = vi.fn();
  const mockOnAddLine = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // BASIC RENDERING
  // ===========================================================================
  describe("Basic Rendering", () => {
    it("should render table headers", () => {
      render(
        <QuoteLinesTable
          lignes={[]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      expect(screen.getByText("Service / Description")).toBeInTheDocument();
      expect(screen.getByText("Qté")).toBeInTheDocument();
      expect(screen.getByText("Prix unit.")).toBeInTheDocument();
      expect(screen.getByText("Rem. %")).toBeInTheDocument();
      expect(screen.getByText("Total HT")).toBeInTheDocument();
    });

    it("should render add line button", () => {
      render(
        <QuoteLinesTable
          lignes={[]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      expect(screen.getByRole("button", { name: /Ajouter une ligne/i })).toBeInTheDocument();
    });

    it("should render empty state when no lignes", () => {
      render(
        <QuoteLinesTable
          lignes={[]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      expect(screen.getByText("Aucune ligne de devis")).toBeInTheDocument();
      expect(screen.getByText(/Cliquez sur le bouton ci-dessous/)).toBeInTheDocument();
    });

    it("should not show empty state when lignes exist", () => {
      const lignes = [createLigne()];
      render(
        <QuoteLinesTable
          lignes={lignes}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      expect(screen.queryByText("Aucune ligne de devis")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // LINE RENDERING
  // ===========================================================================
  describe("Line Rendering", () => {
    it("should render all lignes", () => {
      const lignes = [
        createLigne({ id: "ligne-1", description: "Ligne 1" }),
        createLigne({ id: "ligne-2", description: "Ligne 2" }),
        createLigne({ id: "ligne-3", description: "Ligne 3" }),
      ];
      render(
        <QuoteLinesTable
          lignes={lignes}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      expect(screen.getByDisplayValue("Ligne 1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Ligne 2")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Ligne 3")).toBeInTheDocument();
    });

    it("should display line values in inputs", () => {
      const ligne = createLigne({
        quantite: 5,
        prixUnitaire: 500,
        remisePourcent: 15,
      });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
      expect(screen.getByDisplayValue("500")).toBeInTheDocument();
      expect(screen.getByDisplayValue("15")).toBeInTheDocument();
    });

    it("should calculate and display line total", () => {
      const ligne = createLigne({
        quantite: 2,
        prixUnitaire: 1000,
        remisePourcent: 10,
      });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      // Total = 2 * 1000 * (1 - 0.10) = 1800
      expect(screen.getByText(/1.*800/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ADD LINE
  // ===========================================================================
  describe("Add Line", () => {
    it("should call onAddLine when button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuoteLinesTable
          lignes={[]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      const addButton = screen.getByRole("button", { name: /Ajouter une ligne/i });
      await user.click(addButton);

      expect(mockOnAddLine).toHaveBeenCalledTimes(1);
    });

    it("should disable add button when loading", () => {
      render(
        <QuoteLinesTable
          lignes={[]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
          isLoading={true}
        />
      );

      const addButton = screen.getByRole("button", { name: /Ajouter une ligne/i });
      expect(addButton).toBeDisabled();
    });
  });

  // ===========================================================================
  // UPDATE LINE
  // ===========================================================================
  describe("Update Line", () => {
    it("should call onUpdateLine when quantity is changed", async () => {
      const user = userEvent.setup();
      const ligne = createLigne({ quantite: 1 });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      const quantityInput = screen.getByDisplayValue("1");
      await user.clear(quantityInput);
      await user.type(quantityInput, "5");
      fireEvent.blur(quantityInput);

      expect(mockOnUpdateLine).toHaveBeenCalledWith("ligne-1", { quantite: 5 });
    });

    it("should call onUpdateLine when price is changed", async () => {
      const user = userEvent.setup();
      const ligne = createLigne({ prixUnitaire: 100 });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      const priceInput = screen.getByDisplayValue("100");
      await user.clear(priceInput);
      await user.type(priceInput, "200");
      fireEvent.blur(priceInput);

      expect(mockOnUpdateLine).toHaveBeenCalledWith("ligne-1", { prixUnitaire: 200 });
    });

    it("should call onUpdateLine when discount is changed", async () => {
      const user = userEvent.setup();
      const ligne = createLigne({ remisePourcent: 0 });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      const discountInput = screen.getByDisplayValue("0");
      await user.clear(discountInput);
      await user.type(discountInput, "25");
      fireEvent.blur(discountInput);

      expect(mockOnUpdateLine).toHaveBeenCalledWith("ligne-1", { remisePourcent: 25 });
    });

    it("should call onUpdateLine when description is changed", async () => {
      const user = userEvent.setup();
      const ligne = createLigne({ description: "Original" });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      const descInput = screen.getByDisplayValue("Original");
      await user.clear(descInput);
      await user.type(descInput, "Updated description");
      fireEvent.blur(descInput);

      expect(mockOnUpdateLine).toHaveBeenCalledWith("ligne-1", { description: "Updated description" });
    });

    it("should cap discount at 100%", async () => {
      const user = userEvent.setup();
      const ligne = createLigne({ remisePourcent: 50 });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      const discountInput = screen.getByDisplayValue("50");
      await user.clear(discountInput);
      await user.type(discountInput, "150");
      fireEvent.blur(discountInput);

      expect(mockOnUpdateLine).toHaveBeenCalledWith("ligne-1", { remisePourcent: 100 });
    });
  });

  // ===========================================================================
  // DELETE LINE
  // ===========================================================================
  describe("Delete Line", () => {
    it("should call onDeleteLine when delete button is clicked", async () => {
      const user = userEvent.setup();
      const ligne = createLigne();
      const { container } = render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      // Find delete button by its icon
      const deleteButton = container.querySelector("button.text-destructive");
      expect(deleteButton).toBeInTheDocument();

      await user.click(deleteButton!);

      expect(mockOnDeleteLine).toHaveBeenCalledWith("ligne-1");
    });
  });

  // ===========================================================================
  // SERVICE SELECTION
  // ===========================================================================
  describe("Service Selection", () => {
    it("should update line when service is selected", async () => {
      const user = userEvent.setup();
      const ligne = createLigne({ serviceId: undefined });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      const serviceSelect = screen.getByTestId("service-selector");
      await user.selectOptions(serviceSelect, "service-1");

      expect(mockOnUpdateLine).toHaveBeenCalledWith("ligne-1", expect.objectContaining({
        serviceId: "service-1",
        description: "Service Test",
        prixUnitaire: 1000,
      }));
    });
  });

  // ===========================================================================
  // CALCULATION
  // ===========================================================================
  describe("Calculation", () => {
    it("should calculate total correctly with no discount", () => {
      const ligne = createLigne({
        quantite: 3,
        prixUnitaire: 500,
        remisePourcent: 0,
      });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      // Total = 3 * 500 = 1500
      expect(screen.getByText(/1.*500/)).toBeInTheDocument();
    });

    it("should calculate total correctly with discount", () => {
      const ligne = createLigne({
        quantite: 4,
        prixUnitaire: 250,
        remisePourcent: 20,
      });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      // Total = 4 * 250 * (1 - 0.20) = 800
      expect(screen.getByText(/800/)).toBeInTheDocument();
    });

    it("should handle zero quantity", () => {
      const ligne = createLigne({
        quantite: 0,
        prixUnitaire: 1000,
        remisePourcent: 0,
      });
      render(
        <QuoteLinesTable
          lignes={[ligne]}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      // Total = 0
      expect(screen.getByText(/0,00.*€/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================
  describe("Edge Cases", () => {
    it("should handle empty description", () => {
      const ligne = createLigne({ description: "" });

      expect(() =>
        render(
          <QuoteLinesTable
            lignes={[ligne]}
            onUpdateLine={mockOnUpdateLine}
            onDeleteLine={mockOnDeleteLine}
            onAddLine={mockOnAddLine}
          />
        )
      ).not.toThrow();
    });

    it("should handle undefined serviceId", () => {
      const ligne = createLigne({ serviceId: undefined });

      expect(() =>
        render(
          <QuoteLinesTable
            lignes={[ligne]}
            onUpdateLine={mockOnUpdateLine}
            onDeleteLine={mockOnDeleteLine}
            onAddLine={mockOnAddLine}
          />
        )
      ).not.toThrow();
    });

    it("should handle multiple lines correctly", () => {
      const lignes = [
        createLigne({ id: "ligne-1", quantite: 1, prixUnitaire: 100, remisePourcent: 0 }),
        createLigne({ id: "ligne-2", quantite: 2, prixUnitaire: 200, remisePourcent: 10 }),
        createLigne({ id: "ligne-3", quantite: 3, prixUnitaire: 300, remisePourcent: 20 }),
      ];
      render(
        <QuoteLinesTable
          lignes={lignes}
          onUpdateLine={mockOnUpdateLine}
          onDeleteLine={mockOnDeleteLine}
          onAddLine={mockOnAddLine}
        />
      );

      // All service selectors should be rendered
      const serviceSelectors = screen.getAllByTestId("service-selector");
      expect(serviceSelectors).toHaveLength(3);
    });
  });
});
