// CRM Axivity - API /devis/generate Route Tests
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock Supabase
const mockRpc = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
}));

// Mock PDF generation
vi.mock("@/lib/pdf/browser-pool", () => ({
  generatePDF: vi.fn(() => Promise.resolve(Buffer.from("mock-pdf-content"))),
}));

// Mock HTML template
vi.mock("@/lib/templates/devis-template", () => ({
  generateDevisHTML: vi.fn(() => "<html>Mock Devis</html>"),
}));

// Sample test data
const sampleOpportunite = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  nom: "Projet CRM Test",
  notes: "Notes de test",
  client_id: "client-123",
  contact_id: "contact-456",
  clients: {
    id: "client-123",
    nom: "Acme Corp",
    siret: "12345678901234",
    adresse: "123 Rue Test",
    code_postal: "75001",
    ville: "Paris",
    pays: "France",
  },
  contacts: {
    id: "contact-456",
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@acme.com",
    telephone: "0612345678",
    poste: "CEO",
  },
};

const sampleCompanySettings = {
  nom: "Ma Société",
  forme_juridique: "SAS",
  capital: "10000",
  siret: "98765432109876",
  rcs: "Paris B 123 456 789",
  tva_intracommunautaire: "FR12345678901",
  adresse: "456 Avenue Business",
  code_postal: "75008",
  ville: "Paris",
  pays: "France",
  telephone: "0140000000",
  email: "contact@masociete.fr",
  site_web: "https://masociete.fr",
  logo_url: null,
  header_devis_url: null,
  couleur_principale: "#0066cc",
  validite_devis_jours: 30,
  taux_tva_defaut: 20,
  conditions_paiement_defaut: "Paiement à 30 jours",
};

const sampleLignesDevis = [
  {
    id: "ligne-1",
    opportunite_id: "550e8400-e29b-41d4-a716-446655440000",
    service_id: "service-1",
    description: "Développement web",
    quantite: 10,
    prix_unitaire: 500,
    remise_pourcent: 0,
    montant_ht: 5000,
    catalogue_services: { nom: "Dev Web", categorie: "Développement" },
  },
  {
    id: "ligne-2",
    opportunite_id: "550e8400-e29b-41d4-a716-446655440000",
    service_id: "service-2",
    description: "Maintenance",
    quantite: 1,
    prix_unitaire: 1000,
    remise_pourcent: 10,
    montant_ht: 900,
    catalogue_services: { nom: "Maintenance", categorie: "Support" },
  },
];

const sampleDevisRecord = {
  id: "devis-001",
  numero_devis: "DEV-2026-001",
  opportunite_id: "550e8400-e29b-41d4-a716-446655440000",
  client_id: "client-123",
  contact_id: "contact-456",
  statut: "brouillon",
  total_ht: 5900,
  tva: 1180,
  total_ttc: 7080,
};

// Helper to create NextRequest
function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/devis/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

// Helper to setup Supabase mocks for successful flow
function setupSuccessfulMocks() {
  // Setup query chain for opportunites
  const oppSingleMock = vi.fn().mockResolvedValue({
    data: sampleOpportunite,
    error: null,
  });
  const oppEqMock = vi.fn().mockReturnValue({ single: oppSingleMock });
  const oppSelectMock = vi.fn().mockReturnValue({ eq: oppEqMock });

  // Setup query chain for parametres_entreprise
  const settingsSingleMock = vi.fn().mockResolvedValue({
    data: sampleCompanySettings,
    error: null,
  });
  const settingsLimitMock = vi.fn().mockReturnValue({ single: settingsSingleMock });
  const settingsSelectMock = vi.fn().mockReturnValue({ limit: settingsLimitMock });

  // Setup query chain for lignes_devis
  const lignesOrderMock = vi.fn().mockResolvedValue({
    data: sampleLignesDevis,
    error: null,
  });
  const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
  const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

  // Setup query chain for devis insert
  const devisSingleMock = vi.fn().mockResolvedValue({
    data: sampleDevisRecord,
    error: null,
  });
  const devisSelectMock = vi.fn().mockReturnValue({ single: devisSingleMock });
  const devisInsertMock = vi.fn().mockReturnValue({ select: devisSelectMock });

  // Setup query chain for devis update
  const devisUpdateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
  const devisUpdateMock = vi.fn().mockReturnValue({ eq: devisUpdateEqMock });

  mockFrom.mockImplementation((table: string) => {
    switch (table) {
      case "opportunites":
        return { select: oppSelectMock };
      case "parametres_entreprise":
        return { select: settingsSelectMock };
      case "lignes_devis":
        return { select: lignesSelectMock };
      case "devis":
        return {
          insert: devisInsertMock,
          update: devisUpdateMock,
        };
      default:
        return { select: mockSelect };
    }
  });

  // Setup RPC for quote number generation
  mockRpc.mockResolvedValue({ data: "DEV-2026-001", error: null });

  // Setup storage mocks
  mockUpload.mockResolvedValue({ data: { path: "devis-001/DEV-2026-001.pdf" }, error: null });
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: "https://storage.example.com/devis-001/DEV-2026-001.pdf" },
  });
}

describe("/api/devis/generate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set environment variables
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================
  describe("Request Validation", () => {
    it("should return 400 for missing opportuniteId", async () => {
      const request = createRequest({});

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for invalid UUID format", async () => {
      const request = createRequest({ opportuniteId: "not-a-uuid" });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe("VALIDATION_ERROR");
      expect(body.details?.opportuniteId).toBeDefined();
    });

    it("should return 400 for invalid JSON body", async () => {
      const request = new NextRequest("http://localhost:3000/api/devis/generate", {
        method: "POST",
        body: "invalid json {",
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("should accept valid UUID for opportuniteId", async () => {
      setupSuccessfulMocks();
      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      // Should not return 400 validation error
      expect(response.status).not.toBe(400);
    });
  });

  // ============================================
  // NOT FOUND TESTS
  // ============================================
  describe("Opportunity Not Found", () => {
    it("should return 404 when opportunity does not exist", async () => {
      // Setup mock to return null for opportunity
      const oppSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });
      const oppEqMock = vi.fn().mockReturnValue({ single: oppSingleMock });
      const oppSelectMock = vi.fn().mockReturnValue({ eq: oppEqMock });

      mockFrom.mockImplementation((table: string) => {
        if (table === "opportunites") {
          return { select: oppSelectMock };
        }
        return { select: mockSelect };
      });

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.code).toBe("NOT_FOUND");
      expect(body.error).toContain("Opportunité");
    });

    it("should return 404 when opportunity query returns error", async () => {
      const oppSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });
      const oppEqMock = vi.fn().mockReturnValue({ single: oppSingleMock });
      const oppSelectMock = vi.fn().mockReturnValue({ eq: oppEqMock });

      mockFrom.mockReturnValue({ select: oppSelectMock });

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // DATABASE ERROR TESTS
  // ============================================
  describe("Database Errors", () => {
    it("should return 500 when quote number generation fails", async () => {
      // Setup successful opportunity fetch but failed RPC
      const oppSingleMock = vi.fn().mockResolvedValue({
        data: sampleOpportunite,
        error: null,
      });
      const oppEqMock = vi.fn().mockReturnValue({ single: oppSingleMock });
      const oppSelectMock = vi.fn().mockReturnValue({ eq: oppEqMock });

      const settingsSingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const settingsLimitMock = vi.fn().mockReturnValue({ single: settingsSingleMock });
      const settingsSelectMock = vi.fn().mockReturnValue({ limit: settingsLimitMock });

      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: sampleLignesDevis,
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case "opportunites":
            return { select: oppSelectMock };
          case "parametres_entreprise":
            return { select: settingsSelectMock };
          case "lignes_devis":
            return { select: lignesSelectMock };
          default:
            return { select: mockSelect };
        }
      });

      // RPC returns error
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "RPC function failed" },
      });

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.code).toBe("DATABASE_ERROR");
    });

    it("should return 500 when lignes_devis fetch fails", async () => {
      // Setup successful opportunity fetch
      const oppSingleMock = vi.fn().mockResolvedValue({
        data: sampleOpportunite,
        error: null,
      });
      const oppEqMock = vi.fn().mockReturnValue({ single: oppSingleMock });
      const oppSelectMock = vi.fn().mockReturnValue({ eq: oppEqMock });

      const settingsSingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const settingsLimitMock = vi.fn().mockReturnValue({ single: settingsSingleMock });
      const settingsSelectMock = vi.fn().mockReturnValue({ limit: settingsLimitMock });

      // Lignes fetch returns error
      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case "opportunites":
            return { select: oppSelectMock };
          case "parametres_entreprise":
            return { select: settingsSelectMock };
          case "lignes_devis":
            return { select: lignesSelectMock };
          default:
            return { select: mockSelect };
        }
      });

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.code).toBe("DATABASE_ERROR");
    });

    it("should return 500 when RPC returns null data", async () => {
      // Setup successful fetches
      const oppSingleMock = vi.fn().mockResolvedValue({
        data: sampleOpportunite,
        error: null,
      });
      const oppEqMock = vi.fn().mockReturnValue({ single: oppSingleMock });
      const oppSelectMock = vi.fn().mockReturnValue({ eq: oppEqMock });

      const settingsSingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const settingsLimitMock = vi.fn().mockReturnValue({ single: settingsSingleMock });
      const settingsSelectMock = vi.fn().mockReturnValue({ limit: settingsLimitMock });

      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: sampleLignesDevis,
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case "opportunites":
            return { select: oppSelectMock };
          case "parametres_entreprise":
            return { select: settingsSelectMock };
          case "lignes_devis":
            return { select: lignesSelectMock };
          default:
            return { select: mockSelect };
        }
      });

      // RPC returns null data (no error but no quote number)
      mockRpc.mockResolvedValue({ data: null, error: null });

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.code).toBe("DATABASE_ERROR");
    });
  });

  // ============================================
  // SUCCESSFUL GENERATION TESTS
  // ============================================
  describe("Successful PDF Generation", () => {
    it("should return 200 with PDF content", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
    });

    it("should set correct Content-Disposition header", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const contentDisposition = response.headers.get("Content-Disposition");

      expect(contentDisposition).toContain("attachment");
      expect(contentDisposition).toContain("DEV-2026-001.pdf");
    });

    it("should include devis ID and number in response headers", async () => {
      setupSuccessfulMocks();

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      expect(response.headers.get("X-Devis-Id")).toBe("devis-001");
      expect(response.headers.get("X-Devis-Numero")).toBe("DEV-2026-001");
    });

    it("should call generatePDF with HTML content", async () => {
      setupSuccessfulMocks();
      const { generatePDF } = await import("@/lib/pdf/browser-pool");

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      await POST(request);

      expect(generatePDF).toHaveBeenCalledWith("<html>Mock Devis</html>");
    });

    it("should call generateDevisHTML with correct data structure", async () => {
      setupSuccessfulMocks();
      const { generateDevisHTML } = await import("@/lib/templates/devis-template");

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      await POST(request);

      expect(generateDevisHTML).toHaveBeenCalled();
      const callArg = (generateDevisHTML as Mock).mock.calls[0][0];

      expect(callArg.numeroDevis).toBe("DEV-2026-001");
      expect(callArg.client.nom).toBe("Acme Corp");
      expect(callArg.lignes).toHaveLength(2);
      expect(callArg.totalHT).toBe(5900);
      expect(callArg.tva).toBe(1180); // 5900 * 0.20
      expect(callArg.totalTTC).toBe(7080); // 5900 + 1180
    });

    it("should handle opportunity without contact", async () => {
      // Setup with no contact
      const oppWithoutContact = {
        ...sampleOpportunite,
        contact_id: null,
        contacts: null,
      };

      const oppSingleMock = vi.fn().mockResolvedValue({
        data: oppWithoutContact,
        error: null,
      });
      const oppEqMock = vi.fn().mockReturnValue({ single: oppSingleMock });
      const oppSelectMock = vi.fn().mockReturnValue({ eq: oppEqMock });

      const settingsSingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const settingsLimitMock = vi.fn().mockReturnValue({ single: settingsSingleMock });
      const settingsSelectMock = vi.fn().mockReturnValue({ limit: settingsLimitMock });

      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: sampleLignesDevis,
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevisRecord,
        error: null,
      });
      const devisSelectMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisInsertMock = vi.fn().mockReturnValue({ select: devisSelectMock });
      const devisUpdateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const devisUpdateMock = vi.fn().mockReturnValue({ eq: devisUpdateEqMock });

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case "opportunites":
            return { select: oppSelectMock };
          case "parametres_entreprise":
            return { select: settingsSelectMock };
          case "lignes_devis":
            return { select: lignesSelectMock };
          case "devis":
            return { insert: devisInsertMock, update: devisUpdateMock };
          default:
            return { select: mockSelect };
        }
      });

      mockRpc.mockResolvedValue({ data: "DEV-2026-001", error: null });
      mockUpload.mockResolvedValue({ data: { path: "test" }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://test.com" } });

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should handle empty lignes_devis", async () => {
      // Setup with no lines
      const oppSingleMock = vi.fn().mockResolvedValue({
        data: sampleOpportunite,
        error: null,
      });
      const oppEqMock = vi.fn().mockReturnValue({ single: oppSingleMock });
      const oppSelectMock = vi.fn().mockReturnValue({ eq: oppEqMock });

      const settingsSingleMock = vi.fn().mockResolvedValue({
        data: sampleCompanySettings,
        error: null,
      });
      const settingsLimitMock = vi.fn().mockReturnValue({ single: settingsSingleMock });
      const settingsSelectMock = vi.fn().mockReturnValue({ limit: settingsLimitMock });

      // Empty lignes
      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      const devisSingleMock = vi.fn().mockResolvedValue({
        data: { ...sampleDevisRecord, total_ht: 0, tva: 0, total_ttc: 0 },
        error: null,
      });
      const devisSelectMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisInsertMock = vi.fn().mockReturnValue({ select: devisSelectMock });
      const devisUpdateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const devisUpdateMock = vi.fn().mockReturnValue({ eq: devisUpdateEqMock });

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case "opportunites":
            return { select: oppSelectMock };
          case "parametres_entreprise":
            return { select: settingsSelectMock };
          case "lignes_devis":
            return { select: lignesSelectMock };
          case "devis":
            return { insert: devisInsertMock, update: devisUpdateMock };
          default:
            return { select: mockSelect };
        }
      });

      mockRpc.mockResolvedValue({ data: "DEV-2026-001", error: null });
      mockUpload.mockResolvedValue({ data: { path: "test" }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://test.com" } });

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const { generateDevisHTML } = await import("@/lib/templates/devis-template");

      expect(response.status).toBe(200);
      const callArg = (generateDevisHTML as Mock).mock.calls[0][0];
      expect(callArg.lignes).toHaveLength(0);
      expect(callArg.totalHT).toBe(0);
    });
  });

  // ============================================
  // CONFIGURATION TESTS
  // ============================================
  describe("Configuration", () => {
    it("should throw error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const body = await response.json();

      // Generic Error is converted to generic message by handleApiError
      expect(response.status).toBe(500);
      expect(body.error).toBe("Erreur serveur interne");
    });

    it("should use default company settings when none exist", async () => {
      // Setup with no company settings
      const oppSingleMock = vi.fn().mockResolvedValue({
        data: sampleOpportunite,
        error: null,
      });
      const oppEqMock = vi.fn().mockReturnValue({ single: oppSingleMock });
      const oppSelectMock = vi.fn().mockReturnValue({ eq: oppEqMock });

      // No company settings
      const settingsSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const settingsLimitMock = vi.fn().mockReturnValue({ single: settingsSingleMock });
      const settingsSelectMock = vi.fn().mockReturnValue({ limit: settingsLimitMock });

      const lignesOrderMock = vi.fn().mockResolvedValue({
        data: sampleLignesDevis,
        error: null,
      });
      const lignesEqMock = vi.fn().mockReturnValue({ order: lignesOrderMock });
      const lignesSelectMock = vi.fn().mockReturnValue({ eq: lignesEqMock });

      const devisSingleMock = vi.fn().mockResolvedValue({
        data: sampleDevisRecord,
        error: null,
      });
      const devisSelectMock = vi.fn().mockReturnValue({ single: devisSingleMock });
      const devisInsertMock = vi.fn().mockReturnValue({ select: devisSelectMock });
      const devisUpdateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const devisUpdateMock = vi.fn().mockReturnValue({ eq: devisUpdateEqMock });

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case "opportunites":
            return { select: oppSelectMock };
          case "parametres_entreprise":
            return { select: settingsSelectMock };
          case "lignes_devis":
            return { select: lignesSelectMock };
          case "devis":
            return { insert: devisInsertMock, update: devisUpdateMock };
          default:
            return { select: mockSelect };
        }
      });

      mockRpc.mockResolvedValue({ data: "DEV-2026-001", error: null });
      mockUpload.mockResolvedValue({ data: { path: "test" }, error: null });
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://test.com" } });

      const request = createRequest({
        opportuniteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const response = await POST(request);
      const { generateDevisHTML } = await import("@/lib/templates/devis-template");

      expect(response.status).toBe(200);
      const callArg = (generateDevisHTML as Mock).mock.calls[0][0];
      // Should use defaults: 30 days validity, 20% TVA
      expect(callArg.conditionsPaiement).toBe("Paiement à 30 jours fin de mois");
    });
  });
});
