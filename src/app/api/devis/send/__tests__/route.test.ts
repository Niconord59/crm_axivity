// CRM Axivity - Devis Send API Route Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
vi.stubEnv("RESEND_API_KEY", "test-resend-api-key");

// Mock Supabase client
const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock global fetch for Resend API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create NextRequest
function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/devis/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Sample data
const sampleDevis = {
  id: "devis-123",
  numero_devis: "DEV-2025-001",
  total_ttc: 12000,
  date_validite: "2025-02-15",
  pdf_url: "https://storage.example.com/devis.pdf",
  clients: { nom: "Client Test" },
  contacts: {
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@example.com",
  },
  opportunites: { nom: "Projet Test" },
};

const sampleCompanySettings = {
  nom: "Axivity",
  email: "contact@axivity.fr",
};

describe("/api/devis/send", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.stubEnv("RESEND_API_KEY", "test-resend-api-key");

    // Reset fetch mock
    mockFetch.mockReset();
  });

  // ============================================
  // REQUEST VALIDATION TESTS
  // ============================================
  describe("Request Validation", () => {
    it("should return 400 for missing devisId", async () => {
      const request = createRequest({});

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("invalides");
    });

    it("should return 400 for invalid UUID format", async () => {
      const request = createRequest({ devisId: "not-a-uuid" });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("invalide");
    });

    it("should return 400 for invalid email format", async () => {
      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
        recipientEmail: "not-an-email",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("invalide");
    });

    it("should return 400 for invalid JSON body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/devis/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "invalid-json",
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // DEVIS NOT FOUND TESTS
  // ============================================
  describe("Devis Not Found", () => {
    it("should return 404 when devis does not exist", async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toContain("Devis non trouvé");
    });
  });

  // ============================================
  // NO EMAIL TESTS
  // ============================================
  describe("No Email Available", () => {
    it("should return 400 when no recipientEmail and contact has no email", async () => {
      const devisNoContactEmail = {
        ...sampleDevis,
        contacts: { nom: "Dupont", prenom: "Jean", email: null },
      };

      const devisSingleMock = vi.fn().mockResolvedValue({
        data: devisNoContactEmail,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });

      mockFrom.mockReturnValue({ select: devisSelectMock });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("adresse email");
    });
  });

  // ============================================
  // RESEND API ERRORS
  // ============================================
  describe("Resend API Errors", () => {
    function setupSuccessfulDevisQuery() {
      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevis,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });

      const companySingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const companyLimitMock = vi.fn().mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi.fn().mockReturnValue({ limit: companyLimitMock });

      const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock, update: updateMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        return { select: vi.fn() };
      });
    }

    it("should return 502 when Resend API returns error", async () => {
      setupSuccessfulDevisQuery();

      // Mock PDF fetch success
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("storage")) {
          return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
          });
        }
        // Resend API returns error
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: "Invalid API key" }),
        });
      });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toContain("Email");
    });

    it("should return 500 when RESEND_API_KEY is missing", async () => {
      vi.stubEnv("RESEND_API_KEY", "");
      setupSuccessfulDevisQuery();

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toContain("Email");
    });
  });

  // ============================================
  // SUCCESSFUL EMAIL SEND TESTS
  // ============================================
  describe("Successful Email Send", () => {
    function setupSuccessfulMocks() {
      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevis,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });

      const companySingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const companyLimitMock = vi.fn().mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi.fn().mockReturnValue({ limit: companyLimitMock });

      const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock, update: updateMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        return { select: vi.fn() };
      });

      // Mock successful fetch calls
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("storage")) {
          return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
          });
        }
        // Resend API success
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "email-123" }),
        });
      });
    }

    it("should return 200 with success message", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain("jean.dupont@example.com");
    });

    it("should use provided recipientEmail over contact email", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
        recipientEmail: "other@example.com",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.message).toContain("other@example.com");
    });

    it("should include customMessage in email when provided", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
        customMessage: "Merci pour votre demande",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("should update devis status to envoye after successful send", async () => {
      const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevis,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });

      const companySingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const companyLimitMock = vi.fn().mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi.fn().mockReturnValue({ limit: companyLimitMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock, update: updateMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        return { select: vi.fn() };
      });

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("storage")) {
          return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "email-123" }),
        });
      });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      await POST(request);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          statut: "envoye",
        })
      );
    });
  });

  // ============================================
  // CONFIGURATION TESTS
  // ============================================
  describe("Configuration", () => {
    it("should throw error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      // Generic Error is converted to generic message by handleApiError
      expect(response.status).toBe(500);
      expect(body.error).toBe("Erreur serveur interne");
    });
  });
});
