// CRM Axivity - CallResultDialog Component Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import { CallResultDialog } from "../CallResultDialog";
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

// Mock hooks
vi.mock("@/hooks/use-prospects", async () => {
  const actual = await vi.importActual("@/hooks/use-prospects");
  return {
    ...actual,
    useUpdateProspectStatus: () => ({
      mutateAsync: vi.fn(),
    }),
  };
});

vi.mock("@/hooks/use-interactions", () => ({
  useCreateInteraction: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  }),
  useInteractions: () => ({
    data: [],
    isLoading: false,
  }),
  useDeleteInteraction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateInteraction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-convert-opportunity", () => ({
  useConvertToOpportunity: () => ({
    mutateAsync: vi.fn(),
  }),
}));

// Mock use-clients with client data including siteWeb and linkedinPage
const mockClient = {
  id: "client-1",
  nom: "Acme Corporation",
  statut: "Prospect",
  secteurActivite: "Technology",
  siret: "12345678901234",
  siteWeb: "https://www.acme-corporation-very-long-domain-name.com/about/company",
  linkedinPage: "https://www.linkedin.com/company/acme-corp",
  adresse: "123 Main Street",
  codePostal: "75001",
  ville: "Paris",
  pays: "France",
  contacts: [],
  projets: [],
  opportunites: [],
  caTotal: 50000,
};

vi.mock("@/hooks/use-clients", () => ({
  useClient: (id: string | undefined) => ({
    data: id ? mockClient : null,
    isLoading: false,
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
  clientNom: "Acme Corporation",
  client: ["client-1"],
  notesProspection: "Lead intéressé par nos services",
  dateRappel: undefined,
  dateRdvPrevu: undefined,
  typeRdv: undefined,
  ...overrides,
});

describe("CallResultDialog", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // BASIC RENDERING
  // ===========================================================================
  describe("Basic Rendering", () => {
    it("should render dialog when open with prospect", async () => {
      const prospect = createProspect();
      render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={prospect}
        />
      );

      await waitFor(() => {
        // Use getAllByText since the name appears in multiple places (header + lead tab)
        const nameElements = screen.getAllByText("Jean Dupont");
        expect(nameElements.length).toBeGreaterThan(0);
      });
    });

    it("should not render when prospect is null", () => {
      const { container } = render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={null}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("should display prospect status badge", async () => {
      const prospect = createProspect({ statutProspection: "Qualifié" });
      render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={prospect}
        />
      );

      await waitFor(() => {
        // Status badge appears in header
        const badges = screen.getAllByText("Qualifié");
        expect(badges.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // COMPANY TAB - SITE WEB AND LINKEDIN DISPLAY
  // ===========================================================================
  describe("Company Tab - Link Display", () => {
    it("should display 'Voir le site' instead of full URL for website", async () => {
      const user = userEvent.setup();
      const prospect = createProspect();

      render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={prospect}
        />
      );

      // Click on Company tab
      const companyTab = await screen.findByRole("tab", { name: /entreprise/i });
      await user.click(companyTab);

      // Wait for company data to load and verify "Voir le site" is shown
      await waitFor(() => {
        expect(screen.getByText("Voir le site")).toBeInTheDocument();
      });

      // The full URL should NOT be visible in the UI
      expect(screen.queryByText(mockClient.siteWeb)).not.toBeInTheDocument();
    });

    it("should display 'Voir la page' for LinkedIn link", async () => {
      const user = userEvent.setup();
      const prospect = createProspect();

      render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={prospect}
        />
      );

      // Click on Company tab
      const companyTab = await screen.findByRole("tab", { name: /entreprise/i });
      await user.click(companyTab);

      // Wait for company data to load and verify "Voir la page" is shown
      await waitFor(() => {
        expect(screen.getByText("Voir la page")).toBeInTheDocument();
      });

      // The full LinkedIn URL should NOT be visible in the UI
      expect(screen.queryByText(mockClient.linkedinPage)).not.toBeInTheDocument();
    });

    it("should have clickable links for website and LinkedIn", async () => {
      const user = userEvent.setup();
      const prospect = createProspect();

      render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={prospect}
        />
      );

      // Click on Company tab
      const companyTab = await screen.findByRole("tab", { name: /entreprise/i });
      await user.click(companyTab);

      await waitFor(() => {
        // Check that the website link has correct href
        const siteLink = screen.getByText("Voir le site").closest("a");
        expect(siteLink).toHaveAttribute("href", mockClient.siteWeb);
        expect(siteLink).toHaveAttribute("target", "_blank");

        // Check that the LinkedIn link has correct href
        const linkedinLink = screen.getByText("Voir la page").closest("a");
        expect(linkedinLink).toHaveAttribute("href", mockClient.linkedinPage);
        expect(linkedinLink).toHaveAttribute("target", "_blank");
      });
    });

    it("should display company name in header", async () => {
      const user = userEvent.setup();
      const prospect = createProspect();

      render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={prospect}
        />
      );

      // Click on Company tab
      const companyTab = await screen.findByRole("tab", { name: /entreprise/i });
      await user.click(companyTab);

      await waitFor(() => {
        // Company name may appear multiple times (header + company tab)
        const companyNames = screen.getAllByText("Acme Corporation");
        expect(companyNames.length).toBeGreaterThan(0);
      });
    });

    it("should display SIRET when available", async () => {
      const user = userEvent.setup();
      const prospect = createProspect();

      render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={prospect}
        />
      );

      // Click on Company tab
      const companyTab = await screen.findByRole("tab", { name: /entreprise/i });
      await user.click(companyTab);

      await waitFor(() => {
        expect(screen.getByText("12345678901234")).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // TABS NAVIGATION
  // ===========================================================================
  describe("Tabs Navigation", () => {
    it("should have Lead, Entreprise, Historique, Agenda, and Résultat tabs", async () => {
      const prospect = createProspect();
      render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={prospect}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /lead/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /entreprise/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /historique/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /agenda/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /résultat/i })).toBeInTheDocument();
      });
    });

    it("should switch to Lead tab and display contact info", async () => {
      const user = userEvent.setup();
      const prospect = createProspect();

      render(
        <CallResultDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          prospect={prospect}
        />
      );

      const leadTab = await screen.findByRole("tab", { name: /lead/i });
      await user.click(leadTab);

      await waitFor(() => {
        // Name appears in multiple places
        const nameElements = screen.getAllByText("Jean Dupont");
        expect(nameElements.length).toBeGreaterThan(0);
        // Phone number should be visible
        const phoneElements = screen.getAllByText("+33 6 12 34 56 78");
        expect(phoneElements.length).toBeGreaterThan(0);
      });
    });
  });
});
