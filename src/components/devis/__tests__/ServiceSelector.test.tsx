// CRM Axivity - ServiceSelector Component Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServiceSelector } from "../ServiceSelector";
import type { CatalogueService } from "@/types";

// Mock scrollIntoView for cmdk
Element.prototype.scrollIntoView = vi.fn();

// Mock useServices hook
const mockServices: CatalogueService[] = [
  {
    id: "service-1",
    nom: "Conseil Stratégique",
    description: "Accompagnement stratégique personnalisé",
    categorie: "Conseil",
    prixUnitaire: 1500,
    unite: "jour",
    actif: true,
    ordre: 1,
  },
  {
    id: "service-2",
    nom: "Développement Web",
    description: "Création de sites web",
    categorie: "Développement",
    prixUnitaire: 800,
    unite: "jour",
    actif: true,
    ordre: 2,
  },
  {
    id: "service-3",
    nom: "Formation IA",
    description: "Formation aux outils IA",
    categorie: "Formation",
    prixUnitaire: 2000,
    unite: "jour",
    actif: true,
    ordre: 3,
  },
  {
    id: "service-4",
    nom: "Audit Technique",
    description: null,
    categorie: "Conseil",
    prixUnitaire: 1200,
    unite: "forfait",
    actif: true,
    ordre: 4,
  },
];

vi.mock("@/hooks/use-services", () => ({
  useServices: vi.fn(() => ({
    data: mockServices,
    isLoading: false,
  })),
}));

// Import after mock
import { useServices } from "@/hooks/use-services";
const mockUseServices = vi.mocked(useServices);

describe("ServiceSelector", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseServices.mockReturnValue({
      data: mockServices,
      isLoading: false,
      error: null,
      isError: false,
    } as ReturnType<typeof useServices>);
  });

  // ===========================================================================
  // BASIC RENDERING
  // ===========================================================================
  describe("Basic Rendering", () => {
    it("should render with placeholder when no value", () => {
      render(<ServiceSelector onSelect={mockOnSelect} />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByText("Sélectionner un service...")).toBeInTheDocument();
    });

    it("should render custom placeholder", () => {
      render(<ServiceSelector onSelect={mockOnSelect} placeholder="Choose a service" />);

      expect(screen.getByText("Choose a service")).toBeInTheDocument();
    });

    it("should render selected service name when value is set", () => {
      render(<ServiceSelector value="service-1" onSelect={mockOnSelect} />);

      expect(screen.getByText("Conseil Stratégique")).toBeInTheDocument();
    });

    it("should be disabled when disabled prop is true", () => {
      render(<ServiceSelector onSelect={mockOnSelect} disabled={true} />);

      expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("should be disabled when loading", () => {
      mockUseServices.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        isError: false,
      } as ReturnType<typeof useServices>);

      render(<ServiceSelector onSelect={mockOnSelect} />);

      expect(screen.getByRole("combobox")).toBeDisabled();
    });
  });

  // ===========================================================================
  // DROPDOWN OPENING
  // ===========================================================================
  describe("Dropdown Opening", () => {
    it("should open dropdown when clicked", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Rechercher un service...")).toBeInTheDocument();
      });
    });

    it("should show services grouped by category", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText("Conseil")).toBeInTheDocument();
        expect(screen.getByText("Développement")).toBeInTheDocument();
        expect(screen.getByText("Formation")).toBeInTheDocument();
      });
    });

    it("should show all services from mock data", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText("Conseil Stratégique")).toBeInTheDocument();
        expect(screen.getByText("Développement Web")).toBeInTheDocument();
        expect(screen.getByText("Formation IA")).toBeInTheDocument();
        expect(screen.getByText("Audit Technique")).toBeInTheDocument();
      });
    });

    it("should show service prices", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        // Price format: "1 500 € / jour"
        expect(screen.getByText(/1.*500.*€.*jour/)).toBeInTheDocument();
        expect(screen.getByText(/800.*€.*jour/)).toBeInTheDocument();
      });
    });

    it("should show service descriptions when present", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText("Accompagnement stratégique personnalisé")).toBeInTheDocument();
        expect(screen.getByText("Création de sites web")).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // SERVICE SELECTION
  // ===========================================================================
  describe("Service Selection", () => {
    it("should call onSelect with service when selected", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText("Conseil Stratégique")).toBeInTheDocument();
      });

      const option = screen.getByText("Conseil Stratégique");
      await user.click(option);

      expect(mockOnSelect).toHaveBeenCalledWith(mockServices[0]);
    });

    it("should close dropdown after selection", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText("Conseil Stratégique")).toBeInTheDocument();
      });

      const option = screen.getByText("Conseil Stratégique");
      await user.click(option);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Rechercher un service...")).not.toBeInTheDocument();
      });
    });

    it("should display selected service in button when value is set", () => {
      render(<ServiceSelector value="service-1" onSelect={mockOnSelect} />);

      // The button should show the selected service name
      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveTextContent("Conseil Stratégique");
    });
  });

  // ===========================================================================
  // CLEAR SELECTION
  // ===========================================================================
  describe("Clear Selection", () => {
    it("should show clear option when value is set", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector value="service-1" onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText("Ligne libre (sans service)")).toBeInTheDocument();
      });
    });

    it("should not show clear option when no value", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.queryByText("Ligne libre (sans service)")).not.toBeInTheDocument();
      });
    });

    it("should call onSelect with null when clear option is clicked", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector value="service-1" onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText("Ligne libre (sans service)")).toBeInTheDocument();
      });

      const clearOption = screen.getByText("Ligne libre (sans service)");
      await user.click(clearOption);

      expect(mockOnSelect).toHaveBeenCalledWith(null);
    });
  });

  // ===========================================================================
  // SEARCH FUNCTIONALITY
  // ===========================================================================
  describe("Search Functionality", () => {
    it("should have search input in dropdown", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Rechercher un service...")).toBeInTheDocument();
      });
    });

    it("should show empty message when no services match", async () => {
      mockUseServices.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useServices>);

      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText("Aucun service trouvé.")).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // CATEGORY GROUPING
  // ===========================================================================
  describe("Category Grouping", () => {
    it("should group multiple services in same category", async () => {
      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        // Both Conseil services should be in the same group
        expect(screen.getByText("Conseil Stratégique")).toBeInTheDocument();
        expect(screen.getByText("Audit Technique")).toBeInTheDocument();
      });
    });

    it("should handle service without category", async () => {
      mockUseServices.mockReturnValue({
        data: [{
          id: "service-no-cat",
          nom: "Service Sans Catégorie",
          description: null,
          categorie: undefined,
          prixUnitaire: 500,
          unite: "heure",
          actif: true,
          ordre: 1,
        }] as CatalogueService[],
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useServices>);

      const user = userEvent.setup();
      render(<ServiceSelector onSelect={mockOnSelect} />);

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);

      await waitFor(() => {
        expect(screen.getByText("Autres")).toBeInTheDocument();
        expect(screen.getByText("Service Sans Catégorie")).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================
  describe("Edge Cases", () => {
    it("should handle value that does not exist in services", () => {
      render(<ServiceSelector value="non-existent-id" onSelect={mockOnSelect} />);

      // Should show placeholder since service is not found
      expect(screen.getByText("Sélectionner un service...")).toBeInTheDocument();
    });

    it("should handle empty services array", () => {
      mockUseServices.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useServices>);

      expect(() => render(<ServiceSelector onSelect={mockOnSelect} />)).not.toThrow();
    });

    it("should handle undefined services data", () => {
      mockUseServices.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        isError: false,
      } as ReturnType<typeof useServices>);

      expect(() => render(<ServiceSelector onSelect={mockOnSelect} />)).not.toThrow();
    });
  });
});
