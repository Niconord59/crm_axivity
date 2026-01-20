// CRM Axivity - Factures Relance API Route Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
vi.stubEnv("N8N_WEBHOOK_URL", "https://n8n.test.local");

// Mock Supabase client - using hoisted mock function
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock global fetch for N8N webhook
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create NextRequest
function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/factures/relance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Sample data - facture with overdue date (7+ days)
const sampleFacture = {
  id: "facture-123",
  numero: "FAC-2025-001",
  montant_ht: 10000,
  montant_ttc: 12000,
  date_emission: "2024-12-01",
  date_echeance: "2024-12-15", // Past date to trigger relance
  statut: "En retard",
  projet_id: "projet-123",
  projets: {
    id: "projet-123",
    nom: "Projet Test",
    client_id: "client-123",
    clients: {
      id: "client-123",
      nom: "Client Test",
    },
  },
};

const sampleContact = {
  id: "contact-123",
  nom: "Dupont",
  prenom: "Jean",
  email: "jean.dupont@example.com",
};

describe("/api/factures/relance", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockReset();
  });

  // ============================================
  // REQUEST VALIDATION TESTS
  // ============================================
  describe("Request Validation", () => {
    it("should return 400 for missing factureId", async () => {
      const request = createRequest({});

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("invalides");
    });

    it("should return 400 for invalid UUID format", async () => {
      const request = createRequest({ factureId: "not-a-uuid" });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("invalide");
    });

    it("should return 400 for invalid JSON body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/factures/relance",
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
  // FACTURE NOT FOUND TESTS
  // ============================================
  describe("Facture Not Found", () => {
    it("should return 404 when facture does not exist", async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const request = createRequest({
        factureId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toContain("Facture non trouvée");
    });
  });

  // ============================================
  // VALIDATION ERRORS
  // ============================================
  describe("Validation Errors", () => {
    it("should return 400 when no contact email found", async () => {
      // Setup facture query success
      const factureSingleMock = vi.fn().mockResolvedValue({
        data: sampleFacture,
        error: null,
      });
      const factureEqMock = vi.fn().mockReturnValue({ single: factureSingleMock });
      const factureSelectMock = vi.fn().mockReturnValue({ eq: factureEqMock });

      // Setup contact query - no email
      const contactSingleMock = vi.fn().mockResolvedValue({
        data: { ...sampleContact, email: null },
        error: null,
      });
      const contactLimitMock = vi.fn().mockReturnValue({ single: contactSingleMock });
      const contactEqMock = vi.fn().mockReturnValue({ limit: contactLimitMock });
      const contactSelectMock = vi.fn().mockReturnValue({ eq: contactEqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "factures") {
          return { select: factureSelectMock };
        }
        if (table === "contacts") {
          return { select: contactSelectMock };
        }
        return { select: vi.fn() };
      });

      const request = createRequest({
        factureId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("email");
    });

    it("should return 400 when facture is not overdue", async () => {
      // Facture with future due date
      const factureNotOverdue = {
        ...sampleFacture,
        date_echeance: "2030-12-31", // Future date
      };

      const factureSingleMock = vi.fn().mockResolvedValue({
        data: factureNotOverdue,
        error: null,
      });
      const factureEqMock = vi.fn().mockReturnValue({ single: factureSingleMock });
      const factureSelectMock = vi.fn().mockReturnValue({ eq: factureEqMock });

      const contactSingleMock = vi.fn().mockResolvedValue({
        data: sampleContact,
        error: null,
      });
      const contactLimitMock = vi.fn().mockReturnValue({ single: contactSingleMock });
      const contactEqMock = vi.fn().mockReturnValue({ limit: contactLimitMock });
      const contactSelectMock = vi.fn().mockReturnValue({ eq: contactEqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "factures") {
          return { select: factureSelectMock };
        }
        if (table === "contacts") {
          return { select: contactSelectMock };
        }
        return { select: vi.fn() };
      });

      const request = createRequest({
        factureId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("pas en retard");
    });
  });

  // ============================================
  // N8N WEBHOOK ERRORS
  // ============================================
  describe("N8N Webhook Errors", () => {
    function setupSuccessfulQueries() {
      const factureSingleMock = vi.fn().mockResolvedValue({
        data: sampleFacture,
        error: null,
      });
      const factureEqMock = vi.fn().mockReturnValue({ single: factureSingleMock });
      const factureSelectMock = vi.fn().mockReturnValue({ eq: factureEqMock });
      const factureUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const contactSingleMock = vi.fn().mockResolvedValue({
        data: sampleContact,
        error: null,
      });
      const contactLimitMock = vi.fn().mockReturnValue({ single: contactSingleMock });
      const contactEqMock = vi.fn().mockReturnValue({ limit: contactLimitMock });
      const contactSelectMock = vi.fn().mockReturnValue({ eq: contactEqMock });

      const interactionInsertMock = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "factures") {
          return { select: factureSelectMock, update: factureUpdateMock };
        }
        if (table === "contacts") {
          return { select: contactSelectMock };
        }
        if (table === "interactions") {
          return { insert: interactionInsertMock };
        }
        return { select: vi.fn() };
      });
    }

    it("should return 502 when N8N webhook fails", async () => {
      setupSuccessfulQueries();

      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Webhook error"),
      });

      const request = createRequest({
        factureId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(502);
      expect(body.error).toContain("N8N");
    });
  });

  // ============================================
  // SUCCESSFUL RELANCE TESTS
  // ============================================
  describe("Successful Relance", () => {
    function setupSuccessfulMocks() {
      const factureSingleMock = vi.fn().mockResolvedValue({
        data: sampleFacture,
        error: null,
      });
      const factureEqMock = vi.fn().mockReturnValue({ single: factureSingleMock });
      const factureSelectMock = vi.fn().mockReturnValue({ eq: factureEqMock });
      const factureUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const contactSingleMock = vi.fn().mockResolvedValue({
        data: sampleContact,
        error: null,
      });
      const contactLimitMock = vi.fn().mockReturnValue({ single: contactSingleMock });
      const contactEqMock = vi.fn().mockReturnValue({ limit: contactLimitMock });
      const contactSelectMock = vi.fn().mockReturnValue({ eq: contactEqMock });

      const interactionInsertMock = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === "factures") {
          return { select: factureSelectMock, update: factureUpdateMock };
        }
        if (table === "contacts") {
          return { select: contactSelectMock };
        }
        if (table === "interactions") {
          return { insert: interactionInsertMock };
        }
        return { select: vi.fn() };
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }

    it("should return 200 with success message", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        factureId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain("Relance");
    });

    it("should include niveau_relance in response", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        factureId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(body.niveau_relance).toBeGreaterThan(0);
      expect(body.facture_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should call N8N webhook with correct payload", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        factureId: "550e8400-e29b-41d4-a716-446655440000",
      });

      await POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("relance-facture-manuelle"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.any(String),
        })
      );

      // Verify payload structure
      const callArgs = mockFetch.mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload).toMatchObject({
        facture_id: "facture-123",
        numero_facture: "FAC-2025-001",
        contact_email: "jean.dupont@example.com",
      });
    });

    it("should create interaction in CRM", async () => {
      const interactionInsertMock = vi.fn().mockResolvedValue({ error: null });

      const factureSingleMock = vi.fn().mockResolvedValue({
        data: sampleFacture,
        error: null,
      });
      const factureEqMock = vi.fn().mockReturnValue({ single: factureSingleMock });
      const factureSelectMock = vi.fn().mockReturnValue({ eq: factureEqMock });
      const factureUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const contactSingleMock = vi.fn().mockResolvedValue({
        data: sampleContact,
        error: null,
      });
      const contactLimitMock = vi.fn().mockReturnValue({ single: contactSingleMock });
      const contactEqMock = vi.fn().mockReturnValue({ limit: contactLimitMock });
      const contactSelectMock = vi.fn().mockReturnValue({ eq: contactEqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "factures") {
          return { select: factureSelectMock, update: factureUpdateMock };
        }
        if (table === "contacts") {
          return { select: contactSelectMock };
        }
        if (table === "interactions") {
          return { insert: interactionInsertMock };
        }
        return { select: vi.fn() };
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const request = createRequest({
        factureId: "550e8400-e29b-41d4-a716-446655440000",
      });

      await POST(request);

      expect(interactionInsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Email",
          client_id: "client-123",
        })
      );
    });
  });
});
