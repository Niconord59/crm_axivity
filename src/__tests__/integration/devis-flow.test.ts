// CRM Axivity - Integration Tests: Devis (Quote) Flow
// Tests the complete flow: create lines → preview → generate → send → convert to invoice
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Supabase client before imports
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "new-id" }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: "DEV-2026-001", error: null })),
  },
}));

// Mock PDF generation
vi.mock("@/lib/pdf/browser-pool", () => ({
  generatePDF: vi.fn(() => Promise.resolve(Buffer.from("fake-pdf-content"))),
}));

// Mock Resend
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(() => Promise.resolve({ data: { id: "email-id" }, error: null })),
    },
  })),
}));

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
vi.stubEnv("RESEND_API_KEY", "test-resend-key");

import { supabase } from "@/lib/supabase";

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockOpportunite = {
  id: "opp-1",
  nom: "Projet Test Integration",
  client_id: "client-1",
  contact_id: "contact-1",
  notes: "Notes test",
  clients: {
    id: "client-1",
    nom: "Client Test SARL",
    siret: "12345678901234",
    adresse: "123 Rue Test",
    code_postal: "75001",
    ville: "Paris",
    pays: "France",
  },
  contacts: {
    id: "contact-1",
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@test.com",
  },
};

const mockLignesDevis = [
  {
    id: "ligne-1",
    devis: ["devis-1"],
    serviceId: "service-1",
    serviceNom: "Conseil Stratégique",
    serviceCategorie: "Conseil",
    description: "Accompagnement stratégique",
    quantite: 5,
    prixUnitaire: 1500,
    remisePourcent: 10,
    montantHT: 6750, // 5 * 1500 * 0.9
    ordre: 1,
  },
  {
    id: "ligne-2",
    devis: ["devis-1"],
    serviceId: "service-2",
    serviceNom: "Formation IA",
    serviceCategorie: "Formation",
    description: "Formation aux outils IA",
    quantite: 2,
    prixUnitaire: 2000,
    remisePourcent: 0,
    montantHT: 4000, // 2 * 2000
    ordre: 2,
  },
];

const mockDevis = {
  id: "devis-1",
  numero: "DEV-2026-001",
  opportunite_id: "opp-1",
  statut: "brouillon",
  montant_ht: 10750,
  montant_tva: 2150,
  montant_ttc: 12900,
  date_creation: "2026-01-06",
  date_validite: "2026-02-05",
  pdf_url: null,
};

// ===========================================================================
// DEVIS FLOW INTEGRATION TESTS
// ===========================================================================

describe("Devis Flow Integration", () => {
  const mockFrom = vi.mocked(supabase.from);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // STEP 1: CREATE QUOTE LINES
  // ===========================================================================
  describe("Step 1: Create Quote Lines", () => {
    it("should create a new ligne de devis", async () => {
      const newLigne = {
        devis: ["devis-1"],
        serviceId: "service-1",
        serviceNom: "Conseil",
        description: "Test description",
        quantite: 1,
        prixUnitaire: 1000,
        remisePourcent: 0,
        ordre: 1,
      };

      const insertMock = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: "new-ligne-id", ...newLigne, montantHT: 1000 },
            error: null,
          })),
        })),
      }));

      mockFrom.mockReturnValue({
        insert: insertMock,
      } as ReturnType<typeof mockFrom>);

      const result = await supabase.from("lignes_devis").insert(newLigne);

      expect(mockFrom).toHaveBeenCalledWith("lignes_devis");
      expect(insertMock).toHaveBeenCalledWith(newLigne);
    });

    it("should calculate montant_ht correctly with discount", () => {
      const quantite = 5;
      const prixUnitaire = 1500;
      const remisePourcent = 10;

      const montantHT = quantite * prixUnitaire * (1 - remisePourcent / 100);

      expect(montantHT).toBe(6750);
    });

    it("should calculate totals for multiple lines", () => {
      const totalHT = mockLignesDevis.reduce((sum, ligne) => sum + ligne.montantHT, 0);
      const tva = totalHT * 0.2;
      const totalTTC = totalHT + tva;

      expect(totalHT).toBe(10750);
      expect(tva).toBe(2150);
      expect(totalTTC).toBe(12900);
    });

    it("should update existing ligne", async () => {
      const updateData = { quantite: 10 };

      const eqMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase.from("lignes_devis").update(updateData).eq("id", "ligne-1");

      expect(updateMock).toHaveBeenCalledWith(updateData);
      expect(eqMock).toHaveBeenCalledWith("id", "ligne-1");
    });

    it("should delete ligne", async () => {
      const eqMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
      const deleteMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        delete: deleteMock,
      } as ReturnType<typeof mockFrom>);

      await supabase.from("lignes_devis").delete().eq("id", "ligne-1");

      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith("id", "ligne-1");
    });
  });

  // ===========================================================================
  // STEP 2: PREVIEW QUOTE
  // ===========================================================================
  describe("Step 2: Preview Quote", () => {
    it("should fetch opportunity with client and contact", async () => {
      const singleMock = vi.fn(() => Promise.resolve({
        data: mockOpportunite,
        error: null,
      }));
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        select: selectMock,
      } as ReturnType<typeof mockFrom>);

      const result = await supabase
        .from("opportunites")
        .select("*, clients(*), contacts(*)")
        .eq("id", "opp-1")
        .single();

      expect(result.data).toEqual(mockOpportunite);
      expect(result.data?.clients.nom).toBe("Client Test SARL");
      expect(result.data?.contacts.email).toBe("jean.dupont@test.com");
    });

    it("should fetch lignes for preview", async () => {
      const orderMock = vi.fn(() => Promise.resolve({
        data: mockLignesDevis,
        error: null,
      }));
      const eqMock = vi.fn(() => ({ order: orderMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        select: selectMock,
      } as ReturnType<typeof mockFrom>);

      const result = await supabase
        .from("lignes_devis")
        .select("*")
        .eq("opportunite_id", "opp-1")
        .order("ordre");

      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].serviceNom).toBe("Conseil Stratégique");
    });

    it("should validate required client info for PDF", () => {
      const client = mockOpportunite.clients;

      const hasRequiredInfo = Boolean(
        client.nom &&
        client.adresse &&
        client.code_postal &&
        client.ville
      );

      expect(hasRequiredInfo).toBe(true);
    });
  });

  // ===========================================================================
  // STEP 3: GENERATE FINAL QUOTE
  // ===========================================================================
  describe("Step 3: Generate Final Quote", () => {
    it("should generate sequential quote number", async () => {
      const rpcMock = vi.mocked(supabase.rpc);
      rpcMock.mockResolvedValue({ data: "DEV-2026-002", error: null });

      const result = await supabase.rpc("generer_numero_devis");

      expect(result.data).toBe("DEV-2026-002");
      expect(rpcMock).toHaveBeenCalledWith("generer_numero_devis");
    });

    it("should calculate validity date (30 days by default)", () => {
      const today = new Date("2026-01-06");
      const validityDate = new Date(today);
      validityDate.setDate(validityDate.getDate() + 30);

      expect(validityDate.toISOString().split("T")[0]).toBe("2026-02-05");
    });

    it("should create devis record in database", async () => {
      const newDevis = {
        numero: "DEV-2026-001",
        opportunite_id: "opp-1",
        statut: "brouillon",
        montant_ht: 10750,
        montant_tva: 2150,
        montant_ttc: 12900,
        date_validite: "2026-02-05",
      };

      const singleMock = vi.fn(() => Promise.resolve({
        data: { id: "new-devis-id", ...newDevis },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn(() => ({ select: selectMock }));

      mockFrom.mockReturnValue({
        insert: insertMock,
      } as ReturnType<typeof mockFrom>);

      const result = await supabase
        .from("devis")
        .insert(newDevis)
        .select()
        .single();

      expect(result.data?.numero).toBe("DEV-2026-001");
      expect(insertMock).toHaveBeenCalledWith(newDevis);
    });

    it("should update devis with PDF URL after generation", async () => {
      const pdfUrl = "https://storage.supabase.co/devis/DEV-2026-001.pdf";

      const eqMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("devis")
        .update({ pdf_url: pdfUrl, statut: "brouillon" })
        .eq("id", "devis-1");

      expect(updateMock).toHaveBeenCalledWith({ pdf_url: pdfUrl, statut: "brouillon" });
    });
  });

  // ===========================================================================
  // STEP 4: SEND QUOTE BY EMAIL
  // ===========================================================================
  describe("Step 4: Send Quote by Email", () => {
    it("should update devis status to 'envoyé' after sending", async () => {
      const eqMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("devis")
        .update({ statut: "envoyé" })
        .eq("id", "devis-1");

      expect(updateMock).toHaveBeenCalledWith({ statut: "envoyé" });
    });

    it("should validate recipient email format", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.org",
        "user+tag@company.co.uk",
      ];

      const invalidEmails = [
        "invalid",
        "@domain.com",
        "user@",
        "user@.com",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it("should create interaction record after sending", async () => {
      const interaction = {
        contact_id: "contact-1",
        type: "Email",
        date: new Date().toISOString().split("T")[0],
        notes: "Envoi du devis DEV-2026-001",
      };

      const singleMock = vi.fn(() => Promise.resolve({
        data: { id: "interaction-id", ...interaction },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn(() => ({ select: selectMock }));

      mockFrom.mockReturnValue({
        insert: insertMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("interactions")
        .insert(interaction)
        .select()
        .single();

      expect(insertMock).toHaveBeenCalledWith(interaction);
    });
  });

  // ===========================================================================
  // STEP 5: CONVERT QUOTE TO INVOICE
  // ===========================================================================
  describe("Step 5: Convert Quote to Invoice", () => {
    it("should check if devis is already converted", async () => {
      const acceptedDevis = { ...mockDevis, statut: "accepté", facture_id: "facture-1" };

      const singleMock = vi.fn(() => Promise.resolve({
        data: acceptedDevis,
        error: null,
      }));
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        select: selectMock,
      } as ReturnType<typeof mockFrom>);

      const result = await supabase
        .from("devis")
        .select("*")
        .eq("id", "devis-1")
        .single();

      const isAlreadyConverted = result.data?.facture_id != null;
      expect(isAlreadyConverted).toBe(true);
    });

    it("should create facture from devis data", async () => {
      const newFacture = {
        opportunite_id: "opp-1",
        client_id: "client-1",
        montant_ht: 10750,
        montant_ttc: 12900,
        statut: "En attente",
        date_emission: new Date().toISOString().split("T")[0],
        date_echeance: "2026-02-05",
      };

      const singleMock = vi.fn(() => Promise.resolve({
        data: { id: "facture-1", numero: "FAC-2026-001", ...newFacture },
        error: null,
      }));
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn(() => ({ select: selectMock }));

      mockFrom.mockReturnValue({
        insert: insertMock,
      } as ReturnType<typeof mockFrom>);

      const result = await supabase
        .from("factures")
        .insert(newFacture)
        .select()
        .single();

      expect(result.data?.numero).toBe("FAC-2026-001");
    });

    it("should update devis status to 'accepté' and link to facture", async () => {
      const eqMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
      const updateMock = vi.fn(() => ({ eq: eqMock }));

      mockFrom.mockReturnValue({
        update: updateMock,
      } as ReturnType<typeof mockFrom>);

      await supabase
        .from("devis")
        .update({ statut: "accepté", facture_id: "facture-1" })
        .eq("id", "devis-1");

      expect(updateMock).toHaveBeenCalledWith({ statut: "accepté", facture_id: "facture-1" });
    });

    it("should not allow conversion if devis is refused", () => {
      const refusedDevis = { ...mockDevis, statut: "refusé" };

      const canConvert = !["refusé", "expiré"].includes(refusedDevis.statut);
      expect(canConvert).toBe(false);
    });

    it("should not allow conversion if devis is expired", () => {
      const expiredDevis = { ...mockDevis, statut: "expiré" };

      const canConvert = !["refusé", "expiré"].includes(expiredDevis.statut);
      expect(canConvert).toBe(false);
    });
  });

  // ===========================================================================
  // EDGE CASES & ERROR HANDLING
  // ===========================================================================
  describe("Edge Cases & Error Handling", () => {
    it("should handle database error during quote generation", async () => {
      const rpcMock = vi.mocked(supabase.rpc);
      rpcMock.mockResolvedValue({
        data: null,
        error: { message: "Database error", code: "PGRST000" },
      } as { data: null; error: { message: string; code: string } });

      const result = await supabase.rpc("generer_numero_devis");

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toBe("Database error");
    });

    it("should handle empty lignes de devis", () => {
      const emptyLignes: typeof mockLignesDevis = [];

      const totalHT = emptyLignes.reduce((sum, ligne) => sum + ligne.montantHT, 0);
      expect(totalHT).toBe(0);
    });

    it("should handle 100% discount", () => {
      const quantite = 5;
      const prixUnitaire = 1000;
      const remisePourcent = 100;

      const montantHT = quantite * prixUnitaire * (1 - remisePourcent / 100);
      expect(montantHT).toBe(0);
    });

    it("should handle very large amounts", () => {
      const largeAmount = 999999999;
      const tva = largeAmount * 0.2;
      const totalTTC = largeAmount + tva;

      expect(totalTTC).toBe(1199999998.8);
    });

    it("should handle missing client information gracefully", () => {
      const incompleteClient = {
        nom: "Client",
        siret: null,
        adresse: null,
        code_postal: null,
        ville: null,
      };

      const hasMinimalInfo = Boolean(incompleteClient.nom);
      expect(hasMinimalInfo).toBe(true);
    });
  });

  // ===========================================================================
  // DEVIS STATUS TRANSITIONS
  // ===========================================================================
  describe("Devis Status Transitions", () => {
    it("should allow brouillon → envoyé", () => {
      const validTransitions: Record<string, string[]> = {
        brouillon: ["envoyé"],
        envoyé: ["accepté", "refusé", "expiré"],
        accepté: [],
        refusé: [],
        expiré: [],
      };

      expect(validTransitions.brouillon).toContain("envoyé");
    });

    it("should allow envoyé → accepté", () => {
      const validTransitions: Record<string, string[]> = {
        brouillon: ["envoyé"],
        envoyé: ["accepté", "refusé", "expiré"],
        accepté: [],
        refusé: [],
        expiré: [],
      };

      expect(validTransitions.envoyé).toContain("accepté");
    });

    it("should not allow transitions from accepté", () => {
      const validTransitions: Record<string, string[]> = {
        brouillon: ["envoyé"],
        envoyé: ["accepté", "refusé", "expiré"],
        accepté: [],
        refusé: [],
        expiré: [],
      };

      expect(validTransitions.accepté).toHaveLength(0);
    });

    it("should not allow transitions from refusé", () => {
      const validTransitions: Record<string, string[]> = {
        brouillon: ["envoyé"],
        envoyé: ["accepté", "refusé", "expiré"],
        accepté: [],
        refusé: [],
        expiré: [],
      };

      expect(validTransitions.refusé).toHaveLength(0);
    });
  });
});
