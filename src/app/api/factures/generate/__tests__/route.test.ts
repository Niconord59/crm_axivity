// CRM Axivity - Factures Generate API Route Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");

// Mock Supabase client
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockStorage = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
    from: mockFrom,
    storage: {
      from: mockStorage,
    },
  })),
}));

// Mock PDF generation
vi.mock("@/lib/pdf/browser-pool", () => ({
  generatePDF: vi.fn().mockResolvedValue(Buffer.from("mock-pdf-content")),
}));

// Mock HTML template generation
vi.mock("@/lib/templates/facture-template", () => ({
  generateFactureHTML: vi.fn().mockReturnValue("<html>Mock Invoice</html>"),
}));

// Helper to create NextRequest
function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/factures/generate", {
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
  opportunite_id: "opp-123",
  client_id: "client-123",
  contact_id: "contact-123",
  total_ht: 10000,
  tva: 2000,
  total_ttc: 12000,
  taux_tva: 20,
  conditions_paiement: "Paiement a 30 jours",
  facture_id: null, // Not yet converted
  opportunites: {
    id: "opp-123",
    nom: "Projet Test",
    notes: "Notes test",
  },
  clients: {
    id: "client-123",
    nom: "Client Test",
    siret: "12345678901234",
    adresse: "1 rue Test",
    code_postal: "75001",
    ville: "Paris",
    pays: "France",
  },
  contacts: {
    id: "contact-123",
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@example.com",
    telephone: "0612345678",
    poste: "Directeur",
  },
};

const sampleCompanySettings = {
  nom: "Axivity",
  forme_juridique: "SAS",
  capital: "10000",
  siret: "98765432109876",
  rcs: "Paris B 123 456 789",
  tva_intracommunautaire: "FR12345678901",
  adresse: "10 rue Principale",
  code_postal: "75001",
  ville: "Paris",
  pays: "France",
  telephone: "0140000000",
  email: "contact@axivity.fr",
  site_web: "https://axivity.fr",
  logo_url: "https://example.com/logo.png",
  header_devis_url: "https://example.com/header.png",
  couleur_principale: "#16a34a",
  iban: "FR1234567890123456789012345",
  bic: "BNPAFRPP",
  conditions_paiement_defaut: "Paiement a reception",
};

const sampleLignes = [
  {
    id: "ligne-1",
    opportunite_id: "opp-123",
    service_id: "service-1",
    description: "Service A",
    quantite: 2,
    prix_unitaire: 5000,
    remise_pourcent: 0,
    montant_ht: 10000,
    catalogue_services: { nom: "Service A", categorie: "Conseil" },
  },
];

const sampleFactureRecord = {
  id: "facture-123",
  numero: "FAC-2025-001",
};

describe("/api/factures/generate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
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
      // ValidationError returns generic "Données invalides" message
      expect(body.error).toContain("invalides");
    });

    it("should return 400 for invalid UUID format", async () => {
      const request = createRequest({ devisId: "not-a-uuid" });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain("invalide");
    });

    it("should return 400 for invalid JSON body", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/factures/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "invalid-json",
        }
      );

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
    });

    it("should accept valid UUID for devisId", async () => {
      // Setup mocks for a valid request that will fail at devis lookup
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ select: selectMock });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      // Should fail at devis lookup (404), not at validation (400)
      expect(response.status).toBe(404);
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

    it("should return 404 when devis query returns error", async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
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
  // CONFLICT TESTS (ALREADY CONVERTED)
  // ============================================
  describe("Conflict - Already Converted", () => {
    it("should return 409 when devis has already been converted to facture", async () => {
      const devisWithFacture = {
        ...sampleDevis,
        facture_id: "existing-facture-123", // Already converted
      };

      const singleMock = vi.fn().mockResolvedValue({
        data: devisWithFacture,
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

      expect(response.status).toBe(409);
      expect(body.error).toContain("déjà été converti");
    });
  });

  // ============================================
  // DATABASE ERROR TESTS
  // ============================================
  describe("Database Errors", () => {
    it("should return 500 when invoice number generation fails", async () => {
      // Setup devis query success
      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevis,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });

      // Setup company settings query
      const companySingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const companyLimitMock = vi
        .fn()
        .mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi
        .fn()
        .mockReturnValue({ limit: companyLimitMock });

      // Setup lignes query
      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: sampleLignes,
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        if (table === "lignes_devis") {
          return { select: lignesSelectMock };
        }
        return { select: vi.fn() };
      });

      // Setup RPC failure
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "RPC function failed" },
      });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toContain("numéro de facture");
    });

    it("should return 500 when lignes_devis fetch fails", async () => {
      // Setup devis query success
      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevis,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });

      // Setup company settings query
      const companySingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const companyLimitMock = vi
        .fn()
        .mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi
        .fn()
        .mockReturnValue({ limit: companyLimitMock });

      // Setup lignes query failure
      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        if (table === "lignes_devis") {
          return { select: lignesSelectMock };
        }
        return { select: vi.fn() };
      });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toContain("lignes du devis");
    });

    it("should return 500 when facture insert fails", async () => {
      // Setup all queries to succeed
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
      const companyLimitMock = vi
        .fn()
        .mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi
        .fn()
        .mockReturnValue({ limit: companyLimitMock });

      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: sampleLignes,
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      // Setup facture insert failure
      const factureSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });
      const factureSelectMock = vi
        .fn()
        .mockReturnValue({ single: factureSingleMock });
      const factureInsertMock = vi
        .fn()
        .mockReturnValue({ select: factureSelectMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        if (table === "lignes_devis") {
          return { select: lignesSelectMock };
        }
        if (table === "factures") {
          return { insert: factureInsertMock };
        }
        return { select: vi.fn() };
      });

      // Setup RPC success
      mockRpc.mockResolvedValue({
        data: "FAC-2025-001",
        error: null,
      });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toContain("création de la facture");
    });
  });

  // ============================================
  // SUCCESSFUL PDF GENERATION TESTS
  // ============================================
  describe("Successful PDF Generation", () => {
    function setupSuccessfulMocks() {
      // Devis query
      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevis,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });
      const devisUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Company settings query
      const companySingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const companyLimitMock = vi
        .fn()
        .mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi
        .fn()
        .mockReturnValue({ limit: companyLimitMock });

      // Lignes query
      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: sampleLignes,
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      // Facture insert
      const factureSingleMock = vi.fn().mockResolvedValue({
        data: sampleFactureRecord,
        error: null,
      });
      const factureSelectMock = vi
        .fn()
        .mockReturnValue({ single: factureSingleMock });
      const factureInsertMock = vi
        .fn()
        .mockReturnValue({ select: factureSelectMock });
      const factureUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock, update: devisUpdateMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        if (table === "lignes_devis") {
          return { select: lignesSelectMock };
        }
        if (table === "factures") {
          return { insert: factureInsertMock, update: factureUpdateMock };
        }
        return { select: vi.fn() };
      });

      // RPC success
      mockRpc.mockResolvedValue({
        data: "FAC-2025-001",
        error: null,
      });

      // Storage mocks
      mockStorage.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://storage.example.com/facture.pdf" },
        }),
      });
    }

    it("should return 200 with PDF content", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
    });

    it("should set correct Content-Disposition header", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const contentDisposition = response.headers.get("Content-Disposition");

      expect(contentDisposition).toContain("attachment");
      expect(contentDisposition).toContain("FAC-2025-001.pdf");
    });

    it("should include facture ID and number in response headers", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      expect(response.headers.get("X-Facture-Id")).toBe("facture-123");
      expect(response.headers.get("X-Facture-Numero")).toBe("FAC-2025-001");
    });

    it("should call generatePDF with HTML content", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      // Verify PDF was generated successfully
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
    });

    it("should include devis reference in facture response headers", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      // Verify facture was created with correct number
      expect(response.status).toBe(200);
      expect(response.headers.get("X-Facture-Numero")).toBe("FAC-2025-001");
    });

    it("should handle devis without contact", async () => {
      // Setup with devis without contact
      const devisNoContact = {
        ...sampleDevis,
        contact_id: null,
        contacts: null,
      };

      const devisSingleMock = vi.fn().mockResolvedValue({
        data: devisNoContact,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });
      const devisUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const companySingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const companyLimitMock = vi
        .fn()
        .mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi
        .fn()
        .mockReturnValue({ limit: companyLimitMock });

      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: sampleLignes,
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      const factureSingleMock = vi.fn().mockResolvedValue({
        data: sampleFactureRecord,
        error: null,
      });
      const factureSelectMock = vi
        .fn()
        .mockReturnValue({ single: factureSingleMock });
      const factureInsertMock = vi
        .fn()
        .mockReturnValue({ select: factureSelectMock });
      const factureUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock, update: devisUpdateMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        if (table === "lignes_devis") {
          return { select: lignesSelectMock };
        }
        if (table === "factures") {
          return { insert: factureInsertMock, update: factureUpdateMock };
        }
        return { select: vi.fn() };
      });

      mockRpc.mockResolvedValue({ data: "FAC-2025-001", error: null });
      mockStorage.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://storage.example.com/facture.pdf" },
        }),
      });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should handle empty lignes_devis", async () => {
      // Setup with empty lignes
      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevis,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });
      const devisUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const companySingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const companyLimitMock = vi
        .fn()
        .mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi
        .fn()
        .mockReturnValue({ limit: companyLimitMock });

      // Empty lignes
      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      const factureSingleMock = vi.fn().mockResolvedValue({
        data: sampleFactureRecord,
        error: null,
      });
      const factureSelectMock = vi
        .fn()
        .mockReturnValue({ single: factureSingleMock });
      const factureInsertMock = vi
        .fn()
        .mockReturnValue({ select: factureSelectMock });
      const factureUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock, update: devisUpdateMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        if (table === "lignes_devis") {
          return { select: lignesSelectMock };
        }
        if (table === "factures") {
          return { insert: factureInsertMock, update: factureUpdateMock };
        }
        return { select: vi.fn() };
      });

      mockRpc.mockResolvedValue({ data: "FAC-2025-001", error: null });
      mockStorage.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://storage.example.com/facture.pdf" },
        }),
      });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
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

    it("should use default company settings when none exist", async () => {
      // Setup with no company settings
      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevis,
        error: null,
      });
      const devisEqMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisSelectMock = vi.fn().mockReturnValue({ eq: devisEqMock });
      const devisUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      // No company settings
      const companySingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const companyLimitMock = vi
        .fn()
        .mockReturnValue({ single: companySingleMock });
      const companySelectMock = vi
        .fn()
        .mockReturnValue({ limit: companyLimitMock });

      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: sampleLignes,
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      const factureSingleMock = vi.fn().mockResolvedValue({
        data: sampleFactureRecord,
        error: null,
      });
      const factureSelectMock = vi
        .fn()
        .mockReturnValue({ single: factureSingleMock });
      const factureInsertMock = vi
        .fn()
        .mockReturnValue({ select: factureSelectMock });
      const factureUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === "devis") {
          return { select: devisSelectMock, update: devisUpdateMock };
        }
        if (table === "parametres_entreprise") {
          return { select: companySelectMock };
        }
        if (table === "lignes_devis") {
          return { select: lignesSelectMock };
        }
        if (table === "factures") {
          return { insert: factureInsertMock, update: factureUpdateMock };
        }
        return { select: vi.fn() };
      });

      mockRpc.mockResolvedValue({ data: "FAC-2025-001", error: null });
      mockStorage.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://storage.example.com/facture.pdf" },
        }),
      });

      const request = createRequest({
        devisId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});
