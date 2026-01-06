// CRM Axivity - useFactures Hook Tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useFactures,
  useFacturesImpayees,
  useFacturesARelancer,
  useFacture,
  useCreateFacture,
  useUpdateFacture,
  useMarquerFacturePayee,
  useEnvoyerRelance,
} from "../use-factures";
import { queryKeys } from "@/lib/queryKeys";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGt = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample test data matching Supabase schema
const sampleFactureRecords = [
  {
    id: "fac-1",
    numero: "FAC-2024-001",
    statut: "Envoyé",
    montant_ht: 10000,
    taux_tva: 20,
    date_emission: "2024-01-15",
    date_echeance: "2024-02-15",
    date_paiement: null,
    notes: "Facture projet Alpha",
    niveau_relance: 0,
    niveau_relance_envoye: 0,
    date_derniere_relance: null,
    projet_id: "proj-1",
    client_id: "client-1",
  },
  {
    id: "fac-2",
    numero: "FAC-2024-002",
    statut: "Payé",
    montant_ht: 5000,
    taux_tva: 20,
    date_emission: "2024-01-20",
    date_echeance: "2024-02-20",
    date_paiement: "2024-02-18",
    notes: null,
    niveau_relance: 0,
    niveau_relance_envoye: 0,
    date_derniere_relance: null,
    projet_id: "proj-2",
    client_id: "client-1",
  },
  {
    id: "fac-3",
    numero: "FAC-2024-003",
    statut: "Envoyé",
    montant_ht: 15000,
    taux_tva: 20,
    date_emission: "2024-02-01",
    date_echeance: "2024-03-01",
    date_paiement: null,
    notes: "En attente de paiement",
    niveau_relance: 2,
    niveau_relance_envoye: 1,
    date_derniere_relance: "2024-03-05",
    projet_id: "proj-1",
    client_id: "client-2",
  },
  {
    id: "fac-4",
    numero: "FAC-2024-004",
    statut: "Brouillon",
    montant_ht: 8000,
    taux_tva: 20,
    date_emission: null,
    date_echeance: null,
    date_paiement: null,
    notes: "Draft",
    niveau_relance: 0,
    niveau_relance_envoye: 0,
    date_derniere_relance: null,
    projet_id: null,
    client_id: "client-1",
  },
];

// Create test QueryClient
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper component with QueryClient
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// Helper to setup successful query chain (no filters)
function setupSuccessfulQuery(data: unknown[]) {
  mockOrder.mockResolvedValue({ data, error: null });
  mockEq.mockReturnValue({ order: mockOrder, gt: mockGt });
  mockGt.mockReturnValue({ order: mockOrder });
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
  });
}

// Helper to setup query chain with filters
function setupFilteredQuery(data: unknown[]) {
  const mockOrderWithEq = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data, error: null }),
  });
  mockSelect.mockReturnValue({
    order: mockOrderWithEq,
    eq: mockEq,
  });
}

// Helper to setup successful single query
function setupSuccessfulSingleQuery(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
}

// Helper to setup successful insert
function setupSuccessfulInsert(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
}

// Helper to setup successful update
function setupSuccessfulUpdate(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

// Helper to setup query error
function setupQueryError(errorMessage: string) {
  mockOrder.mockResolvedValue({ data: null, error: { message: errorMessage } });
  mockEq.mockReturnValue({ order: mockOrder, gt: mockGt });
  mockGt.mockReturnValue({ order: mockOrder });
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
  });
}

describe("use-factures hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // useFactures
  // ===========================================================================
  describe("useFactures", () => {
    it("should fetch all invoices successfully", async () => {
      setupSuccessfulQuery(sampleFactureRecords);

      const { result } = renderHook(() => useFactures(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("factures");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockOrder).toHaveBeenCalledWith("date_emission", {
        ascending: false,
        nullsFirst: false,
      });

      expect(result.current.data).toHaveLength(4);
      expect(result.current.data?.[0].numero).toBe("FAC-2024-001");
      expect(result.current.data?.[0].montantHT).toBe(10000);
      expect(result.current.data?.[0].montantTTC).toBe(12000); // 10000 * 1.20
    });

    it("should accept statut filter option", async () => {
      const envoyeRecords = sampleFactureRecords.filter(
        (r) => r.statut === "Envoyé"
      );

      const mockOrderWithEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: envoyeRecords, error: null }),
      });
      mockSelect.mockReturnValue({
        order: mockOrderWithEq,
        eq: mockEq,
      });

      const { result } = renderHook(
        () => useFactures({ statut: "Envoyé" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every((f) => f.statut === "Envoyé")).toBe(true);
    });

    it("should accept clientId filter option", async () => {
      const client1Records = sampleFactureRecords.filter(
        (r) => r.client_id === "client-1"
      );

      const mockOrderWithEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: client1Records, error: null }),
      });
      mockSelect.mockReturnValue({
        order: mockOrderWithEq,
        eq: mockEq,
      });

      const { result } = renderHook(
        () => useFactures({ clientId: "client-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
    });

    it("should accept projetId filter option", async () => {
      const proj1Records = sampleFactureRecords.filter(
        (r) => r.projet_id === "proj-1"
      );

      const mockOrderWithEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: proj1Records, error: null }),
      });
      mockSelect.mockReturnValue({
        order: mockOrderWithEq,
        eq: mockEq,
      });

      const { result } = renderHook(
        () => useFactures({ projetId: "proj-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });

    it("should handle empty results", async () => {
      setupSuccessfulQuery([]);

      const { result } = renderHook(() => useFactures(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should handle query errors", async () => {
      setupQueryError("Database connection failed");

      const { result } = renderHook(() => useFactures(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.factures.list({});
      expect(expectedKey).toEqual(["factures", "list", {}]);
    });

    it("should have correct query key with filters", () => {
      const expectedKey = queryKeys.factures.list({
        statut: "Envoyé",
        clientId: "client-1",
        projetId: "proj-1",
      });
      expect(expectedKey).toEqual([
        "factures",
        "list",
        { statut: "Envoyé", clientId: "client-1", projetId: "proj-1" },
      ]);
    });
  });

  // ===========================================================================
  // useFacturesImpayees
  // ===========================================================================
  describe("useFacturesImpayees", () => {
    it("should fetch unpaid invoices (statut = Envoyé)", async () => {
      const unpaidRecords = sampleFactureRecords.filter(
        (r) => r.statut === "Envoyé"
      );

      mockOrder.mockResolvedValue({ data: unpaidRecords, error: null });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useFacturesImpayees(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("statut", "Envoyé");
      expect(mockOrder).toHaveBeenCalledWith("date_echeance", {
        ascending: true,
        nullsFirst: false,
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every((f) => f.statut === "Envoyé")).toBe(true);
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.factures.impayees();
      expect(expectedKey).toEqual(["factures", "impayees"]);
    });
  });

  // ===========================================================================
  // useFacturesARelancer
  // ===========================================================================
  describe("useFacturesARelancer", () => {
    it("should fetch invoices needing follow-up", async () => {
      const toFollowUp = sampleFactureRecords.filter(
        (r) => r.statut === "Envoyé" && r.niveau_relance > 0
      );

      mockOrder.mockResolvedValue({ data: toFollowUp, error: null });
      mockGt.mockReturnValue({ order: mockOrder });
      mockEq.mockReturnValue({ gt: mockGt });
      mockSelect.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useFacturesARelancer(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("statut", "Envoyé");
      expect(mockGt).toHaveBeenCalledWith("niveau_relance", 0);

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].niveauRelance).toBeGreaterThan(0);
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.factures.aRelancer();
      expect(expectedKey).toEqual(["factures", "a-relancer"]);
    });
  });

  // ===========================================================================
  // useFacture (single)
  // ===========================================================================
  describe("useFacture", () => {
    it("should fetch a single invoice by id", async () => {
      setupSuccessfulSingleQuery(sampleFactureRecords[0]);

      const { result } = renderHook(() => useFacture("fac-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("factures");
      expect(mockEq).toHaveBeenCalledWith("id", "fac-1");

      expect(result.current.data?.id).toBe("fac-1");
      expect(result.current.data?.numero).toBe("FAC-2024-001");
      expect(result.current.data?.montantTTC).toBe(12000);
    });

    it("should not fetch when id is undefined", async () => {
      const { result } = renderHook(() => useFacture(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should handle not found error", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Row not found", code: "PGRST116" },
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useFacture("non-existent"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should have correct query key", () => {
      const expectedKey = queryKeys.factures.detail("fac-1");
      expect(expectedKey).toEqual(["factures", "detail", "fac-1"]);
    });
  });

  // ===========================================================================
  // useCreateFacture
  // ===========================================================================
  describe("useCreateFacture", () => {
    it("should create a new invoice", async () => {
      const newRecord = {
        id: "fac-new",
        numero: "FAC-2024-005",
        statut: "Brouillon",
        montant_ht: 20000,
        taux_tva: 20,
        date_emission: "2024-03-01",
        date_echeance: "2024-04-01",
        date_paiement: null,
        notes: "New invoice",
        niveau_relance: 0,
        niveau_relance_envoye: 0,
        date_derniere_relance: null,
        projet_id: "proj-1",
        client_id: "client-1",
      };
      setupSuccessfulInsert(newRecord);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateFacture(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        numero: "FAC-2024-005",
        statut: "Brouillon",
        montantHT: 20000,
        dateEmission: "2024-03-01",
        dateEcheance: "2024-04-01",
        notes: "New invoice",
        projet: ["proj-1"],
        client: ["client-1"],
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("factures");
      expect(mockInsert).toHaveBeenCalled();

      expect(result.current.data?.numero).toBe("FAC-2024-005");
      expect(result.current.data?.montantTTC).toBe(24000); // 20000 * 1.20

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it("should handle creation errors", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Insert failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useCreateFacture(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ numero: "FAC-TEST" });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should use default status when not provided", async () => {
      const newRecord = {
        id: "fac-default",
        numero: "FAC-2024-006",
        statut: "Brouillon",
        montant_ht: 5000,
        taux_tva: 20,
        date_emission: null,
        date_echeance: null,
        date_paiement: null,
        notes: null,
        niveau_relance: 0,
        niveau_relance_envoye: 0,
        date_derniere_relance: null,
        projet_id: null,
        client_id: null,
      };
      setupSuccessfulInsert(newRecord);

      const { result } = renderHook(() => useCreateFacture(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ montantHT: 5000 });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.statut).toBe("Brouillon");
    });
  });

  // ===========================================================================
  // useUpdateFacture
  // ===========================================================================
  describe("useUpdateFacture", () => {
    it("should update an invoice", async () => {
      const updatedRecord = {
        ...sampleFactureRecords[0],
        statut: "Payé",
        date_paiement: "2024-02-20",
      };
      setupSuccessfulUpdate(updatedRecord);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateFacture(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate({
        id: "fac-1",
        data: { statut: "Payé", datePaiement: "2024-02-20" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("factures");
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", "fac-1");

      expect(result.current.data?.statut).toBe("Payé");
      expect(result.current.data?.datePaiement).toBe("2024-02-20");

      expect(invalidateSpy).toHaveBeenCalledTimes(2); // all + detail
    });

    it("should handle update errors", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateFacture(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "fac-1",
        data: { statut: "Payé" },
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should handle partial updates", async () => {
      const updatedRecord = {
        ...sampleFactureRecords[0],
        notes: "Updated notes only",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateFacture(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "fac-1",
        data: { notes: "Updated notes only" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.notes).toBe("Updated notes only");
      expect(updateCall.statut).toBeUndefined();
    });

    it("should update relance fields", async () => {
      const updatedRecord = {
        ...sampleFactureRecords[0],
        niveau_relance_envoye: 2,
        date_derniere_relance: "2024-03-10",
      };
      setupSuccessfulUpdate(updatedRecord);

      const { result } = renderHook(() => useUpdateFacture(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "fac-1",
        data: {
          niveauRelanceEnvoye: 2,
          dateDerniereRelance: "2024-03-10",
        },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.niveauRelanceEnvoye).toBe(2);
      expect(result.current.data?.dateDerniereRelance).toBe("2024-03-10");
    });
  });

  // ===========================================================================
  // useMarquerFacturePayee
  // ===========================================================================
  describe("useMarquerFacturePayee", () => {
    it("should mark invoice as paid with current date", async () => {
      const today = new Date().toISOString().split("T")[0];
      const paidRecord = {
        ...sampleFactureRecords[0],
        statut: "Payé",
        date_paiement: today,
      };
      setupSuccessfulUpdate(paidRecord);

      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useMarquerFacturePayee(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate("fac-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.statut).toBe("Payé");
      expect(updateCall.date_paiement).toBe(today);

      expect(result.current.data?.statut).toBe("Payé");
    });

    it("should handle marking payment errors", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Payment update failed" },
      });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useMarquerFacturePayee(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("fac-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should invalidate queries on success", async () => {
      const paidRecord = {
        ...sampleFactureRecords[0],
        statut: "Payé",
      };
      setupSuccessfulUpdate(paidRecord);

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useMarquerFacturePayee(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate("fac-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // useEnvoyerRelance
  // ===========================================================================
  describe("useEnvoyerRelance", () => {
    it("should send reminder via API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Relance envoyée",
          niveau_relance: 1,
          facture_id: "fac-1",
        }),
      });

      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useEnvoyerRelance(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate("fac-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/factures/relance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factureId: "fac-1" }),
      });

      expect(result.current.data?.success).toBe(true);
      expect(result.current.data?.niveau_relance).toBe(1);
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: "Facture non trouvée",
        }),
      });

      const { result } = renderHook(() => useEnvoyerRelance(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("non-existent");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Facture non trouvée");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useEnvoyerRelance(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("fac-1");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Network error");
    });

    it("should invalidate queries on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Relance envoyée",
          niveau_relance: 2,
          facture_id: "fac-1",
        }),
      });

      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useEnvoyerRelance(), {
        wrapper: ({ children }) =>
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children
          ),
      });

      result.current.mutate("fac-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Query Keys
  // ===========================================================================
  describe("Query Keys", () => {
    it("should have all required query key factories", () => {
      expect(queryKeys.factures.all).toEqual(["factures"]);
      expect(queryKeys.factures.lists()).toEqual(["factures", "list"]);
      expect(queryKeys.factures.list()).toEqual(["factures", "list", undefined]);
      expect(queryKeys.factures.impayees()).toEqual(["factures", "impayees"]);
      expect(queryKeys.factures.aRelancer()).toEqual(["factures", "a-relancer"]);
      expect(queryKeys.factures.details()).toEqual(["factures", "detail"]);
      expect(queryKeys.factures.detail("123")).toEqual(["factures", "detail", "123"]);
    });

    it("should generate consistent keys for cache invalidation", () => {
      const allKey = queryKeys.factures.all;
      const listKey = queryKeys.factures.list();
      const impayeesKey = queryKeys.factures.impayees();
      const aRelancerKey = queryKeys.factures.aRelancer();
      const detailKey = queryKeys.factures.detail("123");

      expect(listKey[0]).toBe(allKey[0]);
      expect(impayeesKey[0]).toBe(allKey[0]);
      expect(aRelancerKey[0]).toBe(allKey[0]);
      expect(detailKey[0]).toBe(allKey[0]);
    });
  });

  // ===========================================================================
  // Business Logic Tests
  // ===========================================================================
  describe("Business Logic", () => {
    it("should calculate montantTTC correctly with default TVA", async () => {
      const recordWithoutTVA = {
        id: "fac-no-tva",
        numero: "FAC-TEST",
        statut: "Brouillon",
        montant_ht: 1000,
        // taux_tva not specified - should default to 20%
      };
      setupSuccessfulSingleQuery(recordWithoutTVA);

      const { result } = renderHook(() => useFacture("fac-no-tva"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.montantTTC).toBe(1200); // 1000 * 1.20
    });

    it("should calculate montantTTC with custom TVA rate", async () => {
      const recordWithCustomTVA = {
        id: "fac-custom-tva",
        numero: "FAC-TEST",
        statut: "Brouillon",
        montant_ht: 1000,
        taux_tva: 5.5, // Reduced rate
      };
      setupSuccessfulSingleQuery(recordWithCustomTVA);

      const { result } = renderHook(() => useFacture("fac-custom-tva"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.montantTTC).toBe(1055); // 1000 * 1.055
    });

    it("should handle invoices with relance tracking", async () => {
      const recordWithRelance = sampleFactureRecords.find((r) => r.niveau_relance > 0);
      setupSuccessfulSingleQuery(recordWithRelance);

      const { result } = renderHook(() => useFacture("fac-3"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.niveauRelance).toBe(2);
      expect(result.current.data?.niveauRelanceEnvoye).toBe(1);
      expect(result.current.data?.dateDerniereRelance).toBe("2024-03-05");
    });
  });
});
