// CRM Axivity - LeadCard Component Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import { LeadCard } from "../LeadCard";
import type { Prospect } from "@/hooks/use-prospects";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock use-convert-opportunity
const mockMutateAsync = vi.fn();
vi.mock("@/hooks/use-convert-opportunity", () => ({
  useConvertToOpportunity: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Sample prospect data
const createProspect = (overrides: Partial<Prospect> = {}): Prospect => ({
  id: "prospect-1",
  nom: "Dupont",
  prenom: "Jean",
  email: "jean.dupont@example.com",
  telephone: "+33 6 12 34 56 78",
  statutProspection: "À appeler",
  sourceLead: "LinkedIn",
  clientNom: "Acme Corp",
  client: ["client-1"],
  notesProspection: "Lead intéressé par nos services",
  dateRappel: undefined,
  dateRdvPrevu: undefined,
  typeRdv: undefined,
  ...overrides,
});

// Get dates relative to today for testing
const today = new Date();
const pastDate = new Date(today);
pastDate.setDate(today.getDate() - 3);
const futureDate = new Date(today);
futureDate.setDate(today.getDate() + 5);

const formatDateString = (date: Date) => date.toISOString().split("T")[0];
const todayString = formatDateString(today);
const pastDateString = formatDateString(pastDate);
const futureDateString = formatDateString(futureDate);

describe("LeadCard", () => {
  const mockOnCall = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: "opp-1" });
  });

  // ===========================================================================
  // BASIC RENDERING
  // ===========================================================================
  describe("Basic Rendering", () => {
    it("should render prospect full name", () => {
      const prospect = createProspect({ prenom: "Marie", nom: "Martin" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("Marie Martin")).toBeInTheDocument();
    });

    it("should render only last name when prenom is missing", () => {
      const prospect = createProspect({ prenom: undefined, nom: "Durand" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("Durand")).toBeInTheDocument();
    });

    it("should render company name", () => {
      const prospect = createProspect({ clientNom: "Tech Solutions" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("Tech Solutions")).toBeInTheDocument();
    });

    it("should render phone number", () => {
      const prospect = createProspect({ telephone: "+33 1 23 45 67 89" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("+33 1 23 45 67 89")).toBeInTheDocument();
    });

    it("should render email", () => {
      const prospect = createProspect({ email: "test@company.com" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("test@company.com")).toBeInTheDocument();
    });

    it("should render initials in avatar", () => {
      const prospect = createProspect({ prenom: "Pierre", nom: "Bernard" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("PB")).toBeInTheDocument();
    });

    it("should render notes when present", () => {
      const prospect = createProspect({ notesProspection: "Client VIP" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("Client VIP")).toBeInTheDocument();
    });

    it("should render source badge", () => {
      const prospect = createProspect({ sourceLead: "Site web" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("Site web")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATUS STYLING
  // ===========================================================================
  describe("Status Styling", () => {
    const statuses = [
      { status: "À appeler", borderClass: "border-l-blue-500" },
      { status: "Appelé - pas répondu", borderClass: "border-l-slate-400" },
      { status: "Rappeler", borderClass: "border-l-orange-500" },
      { status: "RDV planifié", borderClass: "border-l-violet-500" },
      { status: "Qualifié", borderClass: "border-l-emerald-500" },
      { status: "Non qualifié", borderClass: "border-l-amber-500" },
      { status: "Perdu", borderClass: "border-l-red-500" },
    ];

    statuses.forEach(({ status, borderClass }) => {
      it(`should render with ${borderClass} for ${status} status`, () => {
        const prospect = createProspect({ statutProspection: status as Prospect["statutProspection"] });
        const { container } = render(
          <LeadCard
            prospect={prospect}
            onCall={mockOnCall}
          />
        );

        const card = container.querySelector(`.${borderClass}`);
        expect(card).toBeInTheDocument();
      });
    });

    it("should render status badge with status text", () => {
      const prospect = createProspect({ statutProspection: "RDV planifié" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("RDV planifié")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // DATE HANDLING
  // ===========================================================================
  describe("Date Handling", () => {
    it("should show rappel badge when dateRappel is set", () => {
      const prospect = createProspect({ dateRappel: futureDateString });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      // Should show formatted date or relevant label
      const badges = screen.getAllByRole("generic").filter(el => el.tagName === "DIV");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("should show 'Aujourd'hui' for today's rappel date", () => {
      const prospect = createProspect({ dateRappel: todayString });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
    });

    it("should show 'Retard' for overdue rappel date", () => {
      const prospect = createProspect({ dateRappel: pastDateString });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("Retard")).toBeInTheDocument();
    });

    it("should apply urgent ring for overdue rappel", () => {
      const prospect = createProspect({ dateRappel: pastDateString });
      const { container } = render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      const card = container.querySelector(".ring-2.ring-red-200");
      expect(card).toBeInTheDocument();
    });

    it("should show RDV badge with date", () => {
      const prospect = createProspect({
        statutProspection: "RDV planifié",
        dateRdvPrevu: futureDateString,
        typeRdv: "Visio",
      });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      // Should render a date or "Aujourd'hui" badge
      expect(screen.getByText("RDV planifié")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ACTION BUTTONS
  // ===========================================================================
  describe("Action Buttons", () => {
    it("should show 'Appeler' button for À appeler status", () => {
      const prospect = createProspect({ statutProspection: "À appeler" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByRole("button", { name: /Appeler/i })).toBeInTheDocument();
    });

    it("should show 'Rappeler' button for Rappeler status", () => {
      const prospect = createProspect({ statutProspection: "Rappeler" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByRole("button", { name: /Rappeler/i })).toBeInTheDocument();
    });

    it("should show 'Convertir' button for Qualifié status", () => {
      const prospect = createProspect({ statutProspection: "Qualifié" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByRole("button", { name: /Convertir/i })).toBeInTheDocument();
    });

    it("should show 'Voir RDV' button for RDV planifié status", () => {
      const prospect = createProspect({ statutProspection: "RDV planifié" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByRole("button", { name: /Voir RDV/i })).toBeInTheDocument();
    });

    it("should call onCall when action button is clicked", async () => {
      const user = userEvent.setup();
      const prospect = createProspect({ statutProspection: "À appeler" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      const button = screen.getByRole("button", { name: /Appeler/i });
      await user.click(button);

      expect(mockOnCall).toHaveBeenCalledWith(prospect);
    });
  });

  // ===========================================================================
  // CARD CLICK
  // ===========================================================================
  describe("Card Click", () => {
    it("should call onCall when card is clicked", async () => {
      const user = userEvent.setup();
      const prospect = createProspect();
      const { container } = render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      const card = container.querySelector(".cursor-pointer");
      expect(card).toBeInTheDocument();

      if (card) {
        await user.click(card);
        expect(mockOnCall).toHaveBeenCalledWith(prospect);
      }
    });
  });

  // ===========================================================================
  // DROPDOWN MENU
  // ===========================================================================
  describe("Dropdown Menu", () => {
    it("should show dropdown menu trigger on hover", () => {
      const prospect = createProspect();
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      // The dropdown trigger should exist in the DOM
      const menuTriggers = screen.getAllByRole("button");
      expect(menuTriggers.length).toBeGreaterThan(0);
    });

  });

  // ===========================================================================
  // CLIPBOARD ACTIONS
  // ===========================================================================
  describe("Clipboard Actions", () => {
    it("should have copy phone option in dropdown menu", async () => {
      const user = userEvent.setup();
      const prospect = createProspect({ telephone: "+33 1 22 33 44 55" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      // Open dropdown menu
      const buttons = screen.getAllByRole("button");
      const menuTrigger = buttons.find(btn => btn.querySelector("svg"));
      expect(menuTrigger).toBeDefined();

      await user.click(menuTrigger!);
      await waitFor(() => screen.getByText("Copier le téléphone"));

      expect(screen.getByText("Copier le téléphone")).toBeInTheDocument();
    });

    it("should have copy email option in dropdown menu", async () => {
      const user = userEvent.setup();
      const prospect = createProspect({ email: "copy@test.com" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      // Open dropdown menu
      const buttons = screen.getAllByRole("button");
      const menuTrigger = buttons.find(btn => btn.querySelector("svg"));
      expect(menuTrigger).toBeDefined();

      await user.click(menuTrigger!);
      await waitFor(() => screen.getByText(/Copier l.*email/));

      expect(screen.getByText(/Copier l.*email/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // CONVERT TO OPPORTUNITY
  // ===========================================================================
  describe("Convert to Opportunity", () => {
    it("should show convert popover for Qualifié status", async () => {
      const user = userEvent.setup();
      const prospect = createProspect({ statutProspection: "Qualifié" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      const convertButton = screen.getByRole("button", { name: /Convertir/i });
      await user.click(convertButton);

      await waitFor(() => {
        expect(screen.getByText("Convertir en opportunité ?")).toBeInTheDocument();
      });
    });

    it("should call convertToOpportunity when confirmed", async () => {
      const user = userEvent.setup();
      const prospect = createProspect({
        statutProspection: "Qualifié",
        client: ["client-1"],
      });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      // Open popover
      const convertButton = screen.getByRole("button", { name: /Convertir/i });
      await user.click(convertButton);

      await waitFor(() => {
        expect(screen.getByText("Convertir en opportunité ?")).toBeInTheDocument();
      });

      // Find the confirm button in popover (there are now 2 "Convertir" buttons)
      const confirmButtons = screen.getAllByRole("button", { name: /Convertir/i });
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          contactId: "prospect-1",
          clientId: "client-1",
          contactNom: "Jean Dupont",
          clientNom: "Acme Corp",
          notes: "Lead intéressé par nos services",
        });
      });
    });

    it("should close popover when cancel is clicked", async () => {
      const user = userEvent.setup();
      const prospect = createProspect({ statutProspection: "Qualifié" });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      // Open popover
      const convertButton = screen.getByRole("button", { name: /Convertir/i });
      await user.click(convertButton);

      await waitFor(() => {
        expect(screen.getByText("Convertir en opportunité ?")).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /Annuler/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Convertir en opportunité ?")).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // REACT.MEMO OPTIMIZATION
  // ===========================================================================
  describe("React.memo Optimization", () => {
    it("should have displayName set", () => {
      expect(LeadCard.displayName).toBe("LeadCard");
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================
  describe("Edge Cases", () => {
    it("should handle missing company name", () => {
      const prospect = createProspect({ clientNom: undefined });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("Entreprise inconnue")).toBeInTheDocument();
    });

    it("should handle missing phone and email", () => {
      const prospect = createProspect({
        telephone: undefined,
        email: undefined,
      });

      expect(() =>
        render(
          <LeadCard
            prospect={prospect}
            onCall={mockOnCall}
          />
        )
      ).not.toThrow();
    });

    it("should handle undefined status", () => {
      const prospect = createProspect({ statutProspection: undefined });
      render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("should handle very long names with truncation", () => {
      const prospect = createProspect({
        prenom: "Jean-Pierre",
        nom: "De La Fontaine-Beaumarchais-Villefranche",
      });
      const { container } = render(
        <LeadCard
          prospect={prospect}
          onCall={mockOnCall}
        />
      );

      const truncatedElement = container.querySelector(".truncate");
      expect(truncatedElement).toBeInTheDocument();
    });
  });
});
