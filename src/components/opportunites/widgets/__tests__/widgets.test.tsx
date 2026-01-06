// CRM Axivity - OpportunityMiniSheet Widgets Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AmountSelector } from "../AmountSelector";
import { ProbabilitySlider } from "../ProbabilitySlider";
import { ManualNoteForm } from "../ManualNoteForm";
import { InteractionTimeline } from "../InteractionTimeline";
import type { Interaction } from "@/types";

// ===========================================================================
// AMOUNT SELECTOR TESTS
// ===========================================================================
describe("AmountSelector", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with label", () => {
      render(<AmountSelector value={10000} onChange={mockOnChange} />);

      expect(screen.getByText("Montant estimé")).toBeInTheDocument();
    });

    it("should display formatted value in input", () => {
      render(<AmountSelector value={50000} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      // French locale uses non-breaking space (NBSP)
      expect(input.getAttribute("value")).toMatch(/50.000/);
    });

    it("should render all preset buttons", () => {
      render(<AmountSelector value={0} onChange={mockOnChange} />);

      expect(screen.getByText("Montants rapides")).toBeInTheDocument();
      // Check for 6 preset buttons (5k, 10k, 25k, 50k, 100k, 200k)
      // Plus 4 increment/decrement buttons = 10 total
      const allButtons = screen.getAllByRole("button");
      expect(allButtons.length).toBe(10);
    });

    it("should render increment/decrement buttons", () => {
      render(<AmountSelector value={10000} onChange={mockOnChange} />);

      // +1k, +5k, -1k, -5k buttons
      expect(screen.getAllByRole("button", { name: /1k/ })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: /5k/ })).toHaveLength(2);
    });
  });

  describe("Input Changes", () => {
    it("should call onChange when typing in input", async () => {
      const user = userEvent.setup();
      render(<AmountSelector value={0} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "25000");

      expect(mockOnChange).toHaveBeenCalled();
    });

    it("should handle non-numeric input gracefully", () => {
      render(<AmountSelector value={0} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "abc" } });

      expect(mockOnChange).toHaveBeenCalledWith(0);
    });
  });

  describe("Preset Buttons", () => {
    it("should call onChange with preset value when clicked", async () => {
      const user = userEvent.setup();
      render(<AmountSelector value={0} onChange={mockOnChange} />);

      const preset50k = screen.getByRole("button", { name: /50.*000/ });
      await user.click(preset50k);

      expect(mockOnChange).toHaveBeenCalledWith(50000);
    });

    it("should highlight active preset button", () => {
      const { container } = render(<AmountSelector value={25000} onChange={mockOnChange} />);

      // The active preset should have default variant (not outline)
      const buttons = container.querySelectorAll("button");
      const preset25k = Array.from(buttons).find(btn => btn.textContent?.includes("25"));
      expect(preset25k).not.toHaveClass("variant-outline");
    });
  });

  describe("Increment/Decrement", () => {
    it("should increment by 1000 when +1k clicked", async () => {
      const user = userEvent.setup();
      render(<AmountSelector value={10000} onChange={mockOnChange} />);

      const incrementButtons = screen.getAllByRole("button", { name: /1k/ });
      // First +1k button
      await user.click(incrementButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(11000);
    });

    it("should increment by 5000 when +5k clicked", async () => {
      const user = userEvent.setup();
      render(<AmountSelector value={10000} onChange={mockOnChange} />);

      const incrementButtons = screen.getAllByRole("button", { name: /5k/ });
      await user.click(incrementButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(15000);
    });

    it("should decrement by 1000 when -1k clicked", async () => {
      const user = userEvent.setup();
      render(<AmountSelector value={10000} onChange={mockOnChange} />);

      const decrementButtons = screen.getAllByRole("button", { name: /1k/ });
      // Second -1k button
      await user.click(decrementButtons[1]);

      expect(mockOnChange).toHaveBeenCalledWith(9000);
    });

    it("should decrement to exactly 0 when value equals decrement amount", async () => {
      const user = userEvent.setup();
      // Use 5000 with -5k to get exactly 0
      render(<AmountSelector value={5000} onChange={mockOnChange} />);

      const decrementButtons = screen.getAllByRole("button", { name: /5k/ });
      // Second button with 5k is the -5k
      await user.click(decrementButtons[1]);

      expect(mockOnChange).toHaveBeenCalledWith(0);
    });

    it("should disable decrement button when value is too low", () => {
      render(<AmountSelector value={500} onChange={mockOnChange} />);

      const decrementButtons = screen.getAllByRole("button", { name: /1k/ });
      // -1k button should be disabled when value < 1000
      expect(decrementButtons[1]).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero value", () => {
      render(<AmountSelector value={0} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("0");
    });

    it("should handle large values", () => {
      render(<AmountSelector value={999999999} onChange={mockOnChange} />);

      const input = screen.getByRole("textbox");
      // French locale uses non-breaking space (NBSP)
      expect(input.getAttribute("value")).toMatch(/999.999.999/);
    });
  });
});

// ===========================================================================
// PROBABILITY SLIDER TESTS
// ===========================================================================
describe("ProbabilitySlider", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with label", () => {
      render(<ProbabilitySlider value={50} onChange={mockOnChange} montant={100000} />);

      expect(screen.getByText("Probabilité")).toBeInTheDocument();
    });

    it("should display current probability percentage", () => {
      render(<ProbabilitySlider value={75} onChange={mockOnChange} montant={100000} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("should render slider labels", () => {
      render(<ProbabilitySlider value={50} onChange={mockOnChange} montant={100000} />);

      expect(screen.getByText("Faible")).toBeInTheDocument();
      expect(screen.getByText("Moyen")).toBeInTheDocument();
      expect(screen.getByText("Fort")).toBeInTheDocument();
    });

    it("should display weighted value label", () => {
      render(<ProbabilitySlider value={50} onChange={mockOnChange} montant={100000} />);

      expect(screen.getByText("Valeur pondérée")).toBeInTheDocument();
    });
  });

  describe("Weighted Value Calculation", () => {
    it("should calculate weighted value correctly (50%)", () => {
      render(<ProbabilitySlider value={50} onChange={mockOnChange} montant={100000} />);

      // 100000 * 0.50 = 50000
      expect(screen.getByText(/50.*000/)).toBeInTheDocument();
    });

    it("should calculate weighted value correctly (75%)", () => {
      render(<ProbabilitySlider value={75} onChange={mockOnChange} montant={100000} />);

      // 100000 * 0.75 = 75000
      expect(screen.getByText(/75.*000/)).toBeInTheDocument();
    });

    it("should calculate weighted value correctly (0%)", () => {
      render(<ProbabilitySlider value={0} onChange={mockOnChange} montant={100000} />);

      // 100000 * 0 = 0
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("should calculate weighted value correctly (100%)", () => {
      render(<ProbabilitySlider value={100} onChange={mockOnChange} montant={50000} />);

      // 50000 * 1.0 = 50000
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("Slider Interaction", () => {
    it("should render slider component", () => {
      const { container } = render(
        <ProbabilitySlider value={50} onChange={mockOnChange} montant={100000} />
      );

      // Slider should be present
      const slider = container.querySelector("[role='slider']");
      expect(slider).toBeInTheDocument();
    });

    it("should have correct aria attributes", () => {
      const { container } = render(
        <ProbabilitySlider value={50} onChange={mockOnChange} montant={100000} />
      );

      const slider = container.querySelector("[role='slider']");
      expect(slider).toHaveAttribute("aria-valuenow", "50");
      expect(slider).toHaveAttribute("aria-valuemax", "100");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero montant", () => {
      render(<ProbabilitySlider value={50} onChange={mockOnChange} montant={0} />);

      // Should not crash, weighted value = 0
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should handle decimal probability values", () => {
      render(<ProbabilitySlider value={33} onChange={mockOnChange} montant={100000} />);

      expect(screen.getByText("33%")).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// MANUAL NOTE FORM TESTS
// ===========================================================================
describe("ManualNoteForm", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe("Rendering", () => {
    it("should render with label", () => {
      render(<ManualNoteForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText("Ajouter une note")).toBeInTheDocument();
    });

    it("should render textarea with placeholder", () => {
      render(<ManualNoteForm onSubmit={mockOnSubmit} />);

      expect(screen.getByPlaceholderText("Écrire une note...")).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<ManualNoteForm onSubmit={mockOnSubmit} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Input Changes", () => {
    it("should update textarea value on input", async () => {
      const user = userEvent.setup();
      render(<ManualNoteForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText("Écrire une note...");
      await user.type(textarea, "Ma note de test");

      expect(textarea).toHaveValue("Ma note de test");
    });
  });

  describe("Submit Behavior", () => {
    it("should call onSubmit with trimmed note", async () => {
      const user = userEvent.setup();
      render(<ManualNoteForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText("Écrire une note...");
      await user.type(textarea, "  Note avec espaces  ");

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnSubmit).toHaveBeenCalledWith("Note avec espaces");
    });

    it("should clear input after successful submit", async () => {
      const user = userEvent.setup();
      render(<ManualNoteForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText("Écrire une note...");
      await user.type(textarea, "Ma note");

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => {
        expect(textarea).toHaveValue("");
      });
    });

    it("should disable button when note is empty", () => {
      render(<ManualNoteForm onSubmit={mockOnSubmit} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should disable button when note is only whitespace", async () => {
      const user = userEvent.setup();
      render(<ManualNoteForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText("Écrire une note...");
      await user.type(textarea, "   ");

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should show loading state while submitting", async () => {
      // Make onSubmit take some time
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      render(<ManualNoteForm onSubmit={mockOnSubmit} />);

      const textarea = screen.getByPlaceholderText("Écrire une note...");
      await user.type(textarea, "Note de test");

      const button = screen.getByRole("button");
      await user.click(button);

      // Button should be disabled during submission
      expect(button).toBeDisabled();
    });
  });

  describe("Disabled State", () => {
    it("should show disabled message when isDisabled", () => {
      render(
        <ManualNoteForm
          onSubmit={mockOnSubmit}
          isDisabled={true}
          disabledMessage="Contact requis pour ajouter des notes"
        />
      );

      expect(screen.getByText("Contact requis pour ajouter des notes")).toBeInTheDocument();
    });

    it("should disable submit when isDisabled is true", async () => {
      const user = userEvent.setup();
      render(
        <ManualNoteForm
          onSubmit={mockOnSubmit}
          isDisabled={true}
        />
      );

      const textarea = screen.getByPlaceholderText("Écrire une note...");
      await user.type(textarea, "Note de test");

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should not call onSubmit when disabled", async () => {
      const user = userEvent.setup();
      render(
        <ManualNoteForm
          onSubmit={mockOnSubmit}
          isDisabled={true}
        />
      );

      const textarea = screen.getByPlaceholderText("Écrire une note...");
      await user.type(textarea, "Note de test");

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});

// ===========================================================================
// INTERACTION TIMELINE TESTS
// ===========================================================================
describe("InteractionTimeline", () => {
  const createInteraction = (overrides: Partial<Interaction> = {}): Interaction => ({
    id: "int-1",
    type: "Appel",
    objet: "Premier contact",
    date: "2024-01-15T10:30:00",
    resume: "Discussion initiale",
    prochaineTache: "Envoyer devis",
    contact: ["contact-1"],
    ...overrides,
  });

  describe("Loading State", () => {
    it("should show loading spinner when isLoading", () => {
      const { container } = render(
        <InteractionTimeline interactions={undefined} isLoading={true} />
      );

      // Should have spinner
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no interactions", () => {
      render(<InteractionTimeline interactions={[]} isLoading={false} />);

      expect(screen.getByText("Aucune interaction")).toBeInTheDocument();
      expect(screen.getByText("Les appels et emails seront enregistrés ici")).toBeInTheDocument();
    });

    it("should show empty state when interactions is undefined", () => {
      render(<InteractionTimeline interactions={undefined} isLoading={false} />);

      expect(screen.getByText("Aucune interaction")).toBeInTheDocument();
    });
  });

  describe("Interactions List", () => {
    it("should render interactions count", () => {
      const interactions = [
        createInteraction({ id: "int-1" }),
        createInteraction({ id: "int-2" }),
        createInteraction({ id: "int-3" }),
      ];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      expect(screen.getByText("3 interactions")).toBeInTheDocument();
    });

    it("should render singular form for 1 interaction", () => {
      const interactions = [createInteraction()];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      expect(screen.getByText("1 interaction")).toBeInTheDocument();
    });

    it("should render interaction subject", () => {
      const interactions = [createInteraction({ objet: "Appel de suivi" })];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      expect(screen.getByText("Appel de suivi")).toBeInTheDocument();
    });

    it("should render interaction type badge", () => {
      const interactions = [createInteraction({ type: "Appel" })];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      expect(screen.getByText("Appel")).toBeInTheDocument();
    });

    it("should render interaction resume when present", () => {
      const interactions = [createInteraction({ resume: "Compte-rendu de l'appel" })];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      expect(screen.getByText("Compte-rendu de l'appel")).toBeInTheDocument();
    });

    it("should render prochaineTache when present", () => {
      const interactions = [createInteraction({ prochaineTache: "Préparer proposition" })];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      expect(screen.getByText("Préparer proposition")).toBeInTheDocument();
    });
  });

  describe("Interaction Types Styling", () => {
    it("should render Email interaction with blue styling", () => {
      const interactions = [createInteraction({ type: "Email" })];
      const { container } = render(
        <InteractionTimeline interactions={interactions} isLoading={false} />
      );

      const blueIcon = container.querySelector(".bg-blue-100.text-blue-600");
      expect(blueIcon).toBeInTheDocument();
    });

    it("should render Appel interaction with orange styling", () => {
      const interactions = [createInteraction({ type: "Appel" })];
      const { container } = render(
        <InteractionTimeline interactions={interactions} isLoading={false} />
      );

      const orangeIcon = container.querySelector(".bg-orange-100.text-orange-600");
      expect(orangeIcon).toBeInTheDocument();
    });

    it("should render Réunion interaction with violet styling", () => {
      const interactions = [createInteraction({ type: "Réunion" })];
      const { container } = render(
        <InteractionTimeline interactions={interactions} isLoading={false} />
      );

      const violetIcon = container.querySelector(".bg-violet-100.text-violet-600");
      expect(violetIcon).toBeInTheDocument();
    });

    it("should render Note interaction with amber styling", () => {
      const interactions = [createInteraction({ type: "Note" })];
      const { container } = render(
        <InteractionTimeline interactions={interactions} isLoading={false} />
      );

      const amberIcon = container.querySelector(".bg-amber-100.text-amber-600");
      expect(amberIcon).toBeInTheDocument();
    });

    it("should render unknown type with gray styling", () => {
      const interactions = [createInteraction({ type: "Autre" as Interaction["type"] })];
      const { container } = render(
        <InteractionTimeline interactions={interactions} isLoading={false} />
      );

      const grayIcon = container.querySelector(".bg-gray-100.text-gray-600");
      expect(grayIcon).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("should format date in French locale", () => {
      const interactions = [createInteraction({ date: "2024-03-15T14:30:00" })];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      // Should contain French formatted date
      expect(screen.getByText(/mars/i)).toBeInTheDocument();
    });

    it("should not render date section when date is missing", () => {
      const interactions = [createInteraction({ date: undefined })];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      // Should not have date text
      expect(screen.queryByText(/janvier|février|mars/i)).not.toBeInTheDocument();
    });
  });

  describe("Timeline Structure", () => {
    it("should render Historique badge", () => {
      const interactions = [createInteraction()];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      expect(screen.getByText("Historique")).toBeInTheDocument();
    });

    it("should render multiple interactions", () => {
      const interactions = [
        createInteraction({ id: "int-1", objet: "Premier appel" }),
        createInteraction({ id: "int-2", objet: "Email de suivi" }),
        createInteraction({ id: "int-3", objet: "Réunion de présentation" }),
      ];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      expect(screen.getByText("Premier appel")).toBeInTheDocument();
      expect(screen.getByText("Email de suivi")).toBeInTheDocument();
      expect(screen.getByText("Réunion de présentation")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle interaction without resume", () => {
      const interactions = [createInteraction({ resume: undefined })];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      // Should still render without crashing
      expect(screen.getByText("Premier contact")).toBeInTheDocument();
    });

    it("should handle interaction without prochaineTache", () => {
      const interactions = [createInteraction({ prochaineTache: undefined })];
      render(<InteractionTimeline interactions={interactions} isLoading={false} />);

      // Should still render without crashing
      expect(screen.getByText("Premier contact")).toBeInTheDocument();
    });

    it("should handle empty objet", () => {
      const interactions = [createInteraction({ objet: "" })];

      // Should not crash
      expect(() => render(
        <InteractionTimeline interactions={interactions} isLoading={false} />
      )).not.toThrow();
    });
  });
});
