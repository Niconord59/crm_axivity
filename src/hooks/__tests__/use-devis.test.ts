// CRM Axivity - useDevis Hook Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useDevisList,
  useDevis,
  useDevisForOpportunite,
  useCreateDevis,
  useUpdateDevis,
  useDeleteDevis,
  useUpdateDevisStatus,
  useUploadDevisPDF,
  useDuplicateDevisLines,
  STATUT_DEVIS_CONFIG,
  type StatutDevis,
} from "../use-devis";
import { queryKeys } from "@/lib/queryKeys";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockLimit = vi.fn();
const mockRpc = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageRemove = vi.fn();
const mockStorageGetPublicUrl = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
    storage: {
      from: () => ({
        upload: mockStorageUpload,
        remove: mockStorageRemove,
        getPublicUrl: mockStorageGetPublicUrl,
      }),
    },
  },
}));

// Sample test data matching Supabase schema
const sampleDevisRecords = [
  {
    id: "dev-1",
    numero_devis: "DEV-2024-001",
    opportunite_id: "opp-1",
    client_id: "client-1",
    contact_id: "contact-1",
    statut: "brouillon",
    date_devis: "2024-01-15",
    date_validite: "2024-02-15",
    date_envoi: null,
    date_reponse: null,
    total_ht: 10000,
    tva: 2000,
    total_ttc: 12000,
    taux_tva: 20,
    conditions_paiement: "30 jours",
    notes: "Devis projet Alpha",
    pdf_url: null,
    pdf_filename: null,
    created_by: "user-1",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    facture_id: null,
    date_conversion: null,
    clients: { nom: "Acme Corp" },
    opportunites: { nom: "Projet CRM" },
  },
  {
    id: "dev-2",
    numero_devis: "DEV-2024-002",
    opportunite_id: "opp-2",
    client_id: "client-2",
    contact_id: null,
    statut: "envoye",
    date_devis: "2024-01-20",
    date_validite: "2024-02-20",
    date_envoi: "2024-01-21",
    date_reponse: null,
    total_ht: 25000,
    tva: 5000,
    total_ttc: 30000,
    taux_tva: 20,
    conditions_paiement: null,
    notes: null,
    pdf_url: "https://storage.example.com/dev-2.pdf",
    pdf_filename: "dev-2/devis.pdf",
    created_by: "user-1",
    created_at: "2024-01-20T14:00:00Z",
    updated_at: "2024-01-21T09:00:00Z",
    facture_id: null,
    date_conversion: null,
    clients: { nom: "Beta Inc" },
    opportunites: { nom: "Site Web" },
  },
  {
    id: "dev-3",
    numero_devis: "DEV-2024-003",
    opportunite_id: "opp-1",
    client_id: "client-1",
    contact_id: "contact-1",
    statut: "accepte",
    date_devis: "2024-02-01",
    date_validite: "2024-03-01",
    date_envoi: "2024-02-02",
    date_reponse: "2024-02-10",
    total_ht: 50000,
    tva: 10000,
    total_ttc: 60000,
    taux_tva: 20,
    conditions_paiement: "50% acompte",
    notes: "Devis accepté",
    pdf_url: "https://storage.example.com/dev-3.pdf",
    pdf_filename: "dev-3/devis.pdf",
    created_by: "user-1",
    created_at: "2024-02-01T08:00:00Z",
    updated_at: "2024-02-10T15:00:00Z",
    facture_id: "fac-1",
    date_conversion: "2024-02-11",
    clients: { nom: "Acme Corp" },
    opportunites: { nom: "Projet CRM" },
  },
  {
    id: "dev-4",
    numero_devis: "DEV-2024-004",
    opportunite_id: "opp-3",
    client_id: "client-3",
    contact_id: null,
    statut: "refuse",
    date_devis: "2024-02-05",
    date_validite: "2024-03-05",
    date_envoi: "2024-02-06",
    date_reponse: "2024-02-15",
    total_ht: 15000,
    tva: 3000,
    total_ttc: 18000,
    taux_tva: 20,
    conditions_paiement: null,
    notes: "Trop cher selon client",
    pdf_url: null,
    pdf_filename: null,
    created_by: "user-2",
    created_at: "2024-02-05T11:00:00Z",
    updated_at: "2024-02-15T16:00:00Z",
    facture_id: null,
    date_conversion: null,
    clients: { nom: "Gamma SA" },
    opportunites: { nom: "Application Mobile" },
  },
];

// Sample lignes_devis for duplication tests
const sampleLignesDevis = [
  {
    id: "ligne-1",
    opportunite_id: "opp-1",
    service_id: "svc-1",
    description: "Développement frontend",
    quantite: 10,
    prix_unitaire: 500,
    remise_pourcent: 0,
  },
  {
    id: "ligne-2",
    opportunite_id: "opp-1",
    service_id: "svc-2",
    description: "Design UX",
    quantite: 5,
    prix_unitaire: 400,
    remise_pourcent: 10,
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

// Helper to setup successful list query (no filters)
function setupSuccessfulListQuery(data: unknown[]) {
  mockOrder.mockResolvedValue({ data, error: null });
  mockLimit.mockReturnValue({ order: mockOrder });
  mockEq.mockReturnValue({ order: mockOrder, eq: mockEq, limit: mockLimit });
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
  });
}

// Helper to setup single query
function setupSuccessfulSingleQuery(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockEq.mockReturnValue({ single: mockSingle, order: mockOrder });
  mockSelect.mockReturnValue({ eq: mockEq });
}

// Helper to setup mutation query
function setupSuccessfulMutation(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockDelete.mockReturnValue({ eq: mockEq });
}

describe("use-devis", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ============================================
  // STATUT CONFIG TESTS
  // ============================================
  describe("STATUT_DEVIS_CONFIG", () => {
    it("should have all 5 statut types configured", () => {
      const statuts: StatutDevis[] = [
        "brouillon",
        "envoye",
        "accepte",
        "refuse",
        "expire",
      ];

      statuts.forEach((statut) => {
        expect(STATUT_DEVIS_CONFIG[statut]).toBeDefined();
        expect(STATUT_DEVIS_CONFIG[statut].label).toBeDefined();
        expect(STATUT_DEVIS_CONFIG[statut].color).toBeDefined();
        expect(STATUT_DEVIS_CONFIG[statut].bgColor).toBeDefined();
      });
    });

    it("should have correct French labels", () => {
      expect(STATUT_DEVIS_CONFIG.brouillon.label).toBe("Brouillon");
      expect(STATUT_DEVIS_CONFIG.envoye.label).toBe("Envoyé");
      expect(STATUT_DEVIS_CONFIG.accepte.label).toBe("Accepté");
      expect(STATUT_DEVIS_CONFIG.refuse.label).toBe("Refusé");
      expect(STATUT_DEVIS_CONFIG.expire.label).toBe("Expiré");
    });

    it("should have appropriate colors for each status", () => {
      expect(STATUT_DEVIS_CONFIG.brouillon.bgColor).toContain("gray");
      expect(STATUT_DEVIS_CONFIG.envoye.bgColor).toContain("blue");
      expect(STATUT_DEVIS_CONFIG.accepte.bgColor).toContain("green");
      expect(STATUT_DEVIS_CONFIG.refuse.bgColor).toContain("red");
      expect(STATUT_DEVIS_CONFIG.expire.bgColor).toContain("orange");
    });
  });

  // ============================================
  // useDevisList TESTS
  // ============================================
  describe("useDevisList", () => {
    it("should fetch all devis successfully", async () => {
      setupSuccessfulListQuery(sampleDevisRecords);

      const { result } = renderHook(() => useDevisList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("devis");
      expect(result.current.data).toHaveLength(4);
      expect(result.current.data?.[0].numeroDevis).toBe("DEV-2024-001");
    });

    it("should map Supabase fields to TypeScript fields correctly", async () => {
      setupSuccessfulListQuery([sampleDevisRecords[0]]);

      const { result } = renderHook(() => useDevisList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const devis = result.current.data?.[0];
      expect(devis?.id).toBe("dev-1");
      expect(devis?.numeroDevis).toBe("DEV-2024-001");
      expect(devis?.opportuniteId).toBe("opp-1");
      expect(devis?.clientId).toBe("client-1");
      expect(devis?.totalHT).toBe(10000);
      expect(devis?.tva).toBe(2000);
      expect(devis?.totalTTC).toBe(12000);
      expect(devis?.tauxTva).toBe(20);
      expect(devis?.clientNom).toBe("Acme Corp");
      expect(devis?.opportuniteNom).toBe("Projet CRM");
    });

    it("should filter by opportuniteId", async () => {
      const filtered = sampleDevisRecords.filter(
        (d) => d.opportunite_id === "opp-1"
      );
      // Chain: select → order → eq(opportunite_id) → resolves with data
      // The .eq() is the terminal call that resolves
      mockEq.mockResolvedValue({ data: filtered, error: null });
      mockOrder.mockReturnValue({ eq: mockEq, limit: mockLimit });
      mockSelect.mockReturnValue({ order: mockOrder });

      const { result } = renderHook(
        () => useDevisList({ opportuniteId: "opp-1" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("opportunite_id", "opp-1");
    });

    it("should filter by statut", async () => {
      const filtered = sampleDevisRecords.filter(
        (d) => d.statut === "envoye"
      );
      // Chain: select → order → eq(statut) → resolves with data
      mockEq.mockResolvedValue({ data: filtered, error: null });
      mockOrder.mockReturnValue({ eq: mockEq, limit: mockLimit });
      mockSelect.mockReturnValue({ order: mockOrder });

      const { result } = renderHook(
        () => useDevisList({ statut: "envoye" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("statut", "envoye");
    });

    it("should apply limit option", async () => {
      // Chain: select → order → limit → resolves with data
      mockLimit.mockResolvedValue({
        data: sampleDevisRecords.slice(0, 2),
        error: null,
      });
      mockOrder.mockReturnValue({ eq: mockEq, limit: mockLimit });
      mockSelect.mockReturnValue({ order: mockOrder });

      const { result } = renderHook(() => useDevisList({ limit: 2 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockLimit).toHaveBeenCalledWith(2);
    });

    it("should handle Supabase error", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });
      mockSelect.mockReturnValue({ order: mockOrder });

      const { result } = renderHook(() => useDevisList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should return empty array when no data", async () => {
      setupSuccessfulListQuery([]);

      const { result } = renderHook(() => useDevisList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  // ============================================
  // useDevis TESTS
  // ============================================
  describe("useDevis", () => {
    it("should fetch single devis by ID", async () => {
      setupSuccessfulSingleQuery(sampleDevisRecords[0]);

      const { result } = renderHook(() => useDevis("dev-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("devis");
      expect(mockEq).toHaveBeenCalledWith("id", "dev-1");
      expect(result.current.data?.id).toBe("dev-1");
    });

    it("should not fetch when id is undefined", async () => {
      const { result } = renderHook(() => useDevis(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should handle devis with joined data", async () => {
      setupSuccessfulSingleQuery(sampleDevisRecords[2]);

      const { result } = renderHook(() => useDevis("dev-3"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.clientNom).toBe("Acme Corp");
      expect(result.current.data?.opportuniteNom).toBe("Projet CRM");
      expect(result.current.data?.factureId).toBe("fac-1");
    });

    it("should handle error for non-existent devis", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useDevis("invalid-id"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ============================================
  // useDevisForOpportunite TESTS
  // ============================================
  describe("useDevisForOpportunite", () => {
    it("should fetch devis for specific opportunity", async () => {
      const oppDevis = sampleDevisRecords.filter(
        (d) => d.opportunite_id === "opp-1"
      );
      mockOrder.mockResolvedValue({ data: oppDevis, error: null });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useDevisForOpportunite("opp-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("opportunite_id", "opp-1");
      expect(result.current.data).toHaveLength(2);
    });

    it("should not fetch when opportuniteId is undefined", async () => {
      const { result } = renderHook(() => useDevisForOpportunite(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should order results by created_at descending", async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });
      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });

      renderHook(() => useDevisForOpportunite("opp-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockOrder).toHaveBeenCalledWith("created_at", {
          ascending: false,
        });
      });
    });
  });

  // ============================================
  // useCreateDevis TESTS
  // ============================================
  describe("useCreateDevis", () => {
    it("should create devis with RPC-generated numero", async () => {
      mockRpc.mockResolvedValue({ data: "DEV-2024-005", error: null });
      const newDevis = {
        ...sampleDevisRecords[0],
        id: "dev-5",
        numero_devis: "DEV-2024-005",
      };
      mockSingle.mockResolvedValue({ data: newDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useCreateDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        opportuniteId: "opp-1",
        clientId: "client-1",
        dateValidite: "2024-02-15",
        totalHT: 10000,
        tva: 2000,
        totalTTC: 12000,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRpc).toHaveBeenCalledWith("generer_numero_devis");
      expect(mockFrom).toHaveBeenCalledWith("devis");
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should include optional fields when provided", async () => {
      mockRpc.mockResolvedValue({ data: "DEV-2024-006", error: null });
      const newDevis = { ...sampleDevisRecords[0], id: "dev-6" };
      mockSingle.mockResolvedValue({ data: newDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useCreateDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        opportuniteId: "opp-1",
        clientId: "client-1",
        contactId: "contact-1",
        dateValidite: "2024-02-15",
        totalHT: 10000,
        tva: 2000,
        totalTTC: 12000,
        tauxTva: 20,
        conditionsPaiement: "30 jours",
        notes: "Test notes",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.contact_id).toBe("contact-1");
      expect(insertCall.conditions_paiement).toBe("30 jours");
      expect(insertCall.notes).toBe("Test notes");
    });

    it("should handle RPC error", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "RPC failed" },
      });

      const { result } = renderHook(() => useCreateDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        opportuniteId: "opp-1",
        clientId: "client-1",
        dateValidite: "2024-02-15",
        totalHT: 10000,
        tva: 2000,
        totalTTC: 12000,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should set default status as brouillon", async () => {
      mockRpc.mockResolvedValue({ data: "DEV-2024-007", error: null });
      const newDevis = { ...sampleDevisRecords[0], id: "dev-7" };
      mockSingle.mockResolvedValue({ data: newDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useCreateDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        opportuniteId: "opp-1",
        clientId: "client-1",
        dateValidite: "2024-02-15",
        totalHT: 10000,
        tva: 2000,
        totalTTC: 12000,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.statut).toBe("brouillon");
    });
  });

  // ============================================
  // useUpdateDevis TESTS
  // ============================================
  describe("useUpdateDevis", () => {
    it("should update devis fields", async () => {
      const updatedDevis = { ...sampleDevisRecords[0], notes: "Updated notes" };
      mockSingle.mockResolvedValue({ data: updatedDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "dev-1",
        notes: "Updated notes",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("devis");
      expect(mockEq).toHaveBeenCalledWith("id", "dev-1");
    });

    it("should only include defined fields in update", async () => {
      const updatedDevis = { ...sampleDevisRecords[0], statut: "envoye" };
      mockSingle.mockResolvedValue({ data: updatedDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "dev-1",
        statut: "envoye",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.statut).toBe("envoye");
      expect(updateCall.notes).toBeUndefined();
    });

    it("should update PDF fields", async () => {
      const updatedDevis = {
        ...sampleDevisRecords[0],
        pdf_url: "https://new-url.com/doc.pdf",
        pdf_filename: "doc.pdf",
      };
      mockSingle.mockResolvedValue({ data: updatedDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "dev-1",
        pdfUrl: "https://new-url.com/doc.pdf",
        pdfFilename: "doc.pdf",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.pdf_url).toBe("https://new-url.com/doc.pdf");
      expect(updateCall.pdf_filename).toBe("doc.pdf");
    });
  });

  // ============================================
  // useDeleteDevis TESTS
  // ============================================
  describe("useDeleteDevis", () => {
    it("should delete devis without PDF", async () => {
      mockSingle.mockResolvedValue({
        data: { pdf_url: null, pdf_filename: null },
        error: null,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockDelete.mockReturnValue({ eq: mockEq });

      // Reset eq mock for delete call
      const deleteEq = vi.fn().mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: deleteEq });

      const { result } = renderHook(() => useDeleteDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("dev-4");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockStorageRemove).not.toHaveBeenCalled();
    });

    it("should delete devis with PDF (also removes from storage)", async () => {
      mockSingle.mockResolvedValue({
        data: {
          pdf_url: "https://storage.example.com/dev-2.pdf",
          pdf_filename: "dev-2/devis.pdf",
        },
        error: null,
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockStorageRemove.mockResolvedValue({ error: null });

      const deleteEq = vi.fn().mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: deleteEq });

      const { result } = renderHook(() => useDeleteDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("dev-2");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockStorageRemove).toHaveBeenCalledWith(["dev-2/devis.pdf"]);
    });

    it("should return deleted id on success", async () => {
      mockSingle.mockResolvedValue({
        data: { pdf_url: null, pdf_filename: null },
        error: null,
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      const deleteEq = vi.fn().mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: deleteEq });

      const { result } = renderHook(() => useDeleteDevis(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("dev-1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ id: "dev-1" });
    });
  });

  // ============================================
  // useUpdateDevisStatus TESTS
  // ============================================
  describe("useUpdateDevisStatus", () => {
    it("should update status to envoye with auto date_envoi", async () => {
      const updatedDevis = {
        ...sampleDevisRecords[0],
        statut: "envoye",
        date_envoi: "2024-01-20T10:00:00Z",
      };
      mockSingle.mockResolvedValue({ data: updatedDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateDevisStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: "dev-1", statut: "envoye" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.statut).toBe("envoye");
      expect(updateCall.date_envoi).toBeDefined();
    });

    it("should update status to accepte with auto date_reponse", async () => {
      const updatedDevis = {
        ...sampleDevisRecords[1],
        statut: "accepte",
        date_reponse: "2024-01-25T14:00:00Z",
      };
      mockSingle.mockResolvedValue({ data: updatedDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateDevisStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: "dev-2", statut: "accepte" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.statut).toBe("accepte");
      expect(updateCall.date_reponse).toBeDefined();
    });

    it("should update status to refuse with auto date_reponse", async () => {
      const updatedDevis = {
        ...sampleDevisRecords[1],
        statut: "refuse",
        date_reponse: "2024-01-25T14:00:00Z",
      };
      mockSingle.mockResolvedValue({ data: updatedDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateDevisStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: "dev-2", statut: "refuse" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.statut).toBe("refuse");
      expect(updateCall.date_reponse).toBeDefined();
    });

    it("should not set date_envoi for non-envoye status", async () => {
      const updatedDevis = { ...sampleDevisRecords[0], statut: "brouillon" };
      mockSingle.mockResolvedValue({ data: updatedDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUpdateDevisStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: "dev-1", statut: "brouillon" });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.date_envoi).toBeUndefined();
    });
  });

  // ============================================
  // useUploadDevisPDF TESTS
  // ============================================
  describe("useUploadDevisPDF", () => {
    it("should upload PDF and update devis record", async () => {
      mockStorageUpload.mockResolvedValue({ error: null });
      mockStorageGetPublicUrl.mockReturnValue({
        data: { publicUrl: "https://storage.example.com/dev-1/devis.pdf" },
      });

      const updatedDevis = {
        ...sampleDevisRecords[0],
        pdf_url: "https://storage.example.com/dev-1/devis.pdf",
        pdf_filename: "dev-1/devis.pdf",
      };
      mockSingle.mockResolvedValue({ data: updatedDevis, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockEq.mockReturnValue({ select: mockSelect });
      mockUpdate.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useUploadDevisPDF(), {
        wrapper: createWrapper(),
      });

      const pdfBlob = new Blob(["PDF content"], { type: "application/pdf" });

      result.current.mutate({
        devisId: "dev-1",
        pdfBlob,
        filename: "devis.pdf",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockStorageUpload).toHaveBeenCalledWith(
        "dev-1/devis.pdf",
        pdfBlob,
        { contentType: "application/pdf", upsert: true }
      );
    });

    it("should handle upload error", async () => {
      mockStorageUpload.mockResolvedValue({
        error: { message: "Upload failed" },
      });

      const { result } = renderHook(() => useUploadDevisPDF(), {
        wrapper: createWrapper(),
      });

      const pdfBlob = new Blob(["PDF content"], { type: "application/pdf" });

      result.current.mutate({
        devisId: "dev-1",
        pdfBlob,
        filename: "devis.pdf",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ============================================
  // useDuplicateDevisLines TESTS
  // ============================================
  describe("useDuplicateDevisLines", () => {
    it("should duplicate lines to new opportunity", async () => {
      // Mock fetch source lines
      const fetchSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: sampleLignesDevis,
          error: null,
        }),
      });

      // Mock insert new lines
      const insertSelect = vi.fn().mockResolvedValue({
        data: sampleLignesDevis.map((l, i) => ({
          ...l,
          id: `new-ligne-${i}`,
          opportunite_id: "opp-2",
        })),
        error: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: fetchSelect };
        }
        return {
          insert: vi.fn().mockReturnValue({ select: insertSelect }),
        };
      });

      const { result } = renderHook(() => useDuplicateDevisLines(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sourceOpportuniteId: "opp-1",
        targetOpportuniteId: "opp-2",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("lignes_devis");
    });

    it("should throw error when no lines to duplicate", async () => {
      const fetchSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockFrom.mockReturnValue({ select: fetchSelect });

      const { result } = renderHook(() => useDuplicateDevisLines(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        sourceOpportuniteId: "opp-empty",
        targetOpportuniteId: "opp-2",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Aucune ligne à dupliquer");
    });
  });

  // ============================================
  // QUERY KEYS TESTS
  // ============================================
  describe("Query Keys", () => {
    it("should use queryKeys.devis.list for list queries", () => {
      expect(queryKeys.devis.list()).toBeDefined();
      expect(queryKeys.devis.list({ opportuniteId: "opp-1" })).toBeDefined();
    });

    it("should use queryKeys.devis.detail for single queries", () => {
      expect(queryKeys.devis.detail("dev-1")).toBeDefined();
    });

    it("should use queryKeys.devis.forOpportunite for opportunity queries", () => {
      expect(queryKeys.devis.forOpportunite("opp-1")).toBeDefined();
    });
  });

  // ============================================
  // MAPPER TESTS (Business Logic)
  // ============================================
  describe("Mapper Business Logic", () => {
    it("should map totalHT, tva, totalTTC from Supabase fields", async () => {
      setupSuccessfulSingleQuery({
        id: "dev-test",
        total_ht: 15000,
        tva: 3000,
        total_ttc: 18000,
        taux_tva: 20,
      });

      const { result } = renderHook(() => useDevis("dev-test"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.totalHT).toBe(15000);
      expect(result.current.data?.tva).toBe(3000);
      expect(result.current.data?.totalTTC).toBe(18000);
    });

    it("should default tauxTva to 20 when not provided", async () => {
      setupSuccessfulSingleQuery({
        id: "dev-test",
        total_ht: 10000,
        tva: 2000,
        total_ttc: 12000,
        taux_tva: null,
      });

      const { result } = renderHook(() => useDevis("dev-test"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.tauxTva).toBe(20);
    });

    it("should default totals to 0 when null", async () => {
      setupSuccessfulSingleQuery({
        id: "dev-test",
        total_ht: null,
        tva: null,
        total_ttc: null,
      });

      const { result } = renderHook(() => useDevis("dev-test"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.totalHT).toBe(0);
      expect(result.current.data?.tva).toBe(0);
      expect(result.current.data?.totalTTC).toBe(0);
    });

    it("should handle TVA rate of 10%", async () => {
      setupSuccessfulSingleQuery({
        id: "dev-test",
        total_ht: 10000,
        tva: 1000,
        total_ttc: 11000,
        taux_tva: 10,
      });

      const { result } = renderHook(() => useDevis("dev-test"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.tauxTva).toBe(10);
      expect(result.current.data?.tva).toBe(1000);
    });

    it("should handle converted devis with facture reference", async () => {
      setupSuccessfulSingleQuery({
        id: "dev-converted",
        statut: "accepte",
        facture_id: "fac-123",
        date_conversion: "2024-02-15",
      });

      const { result } = renderHook(() => useDevis("dev-converted"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.factureId).toBe("fac-123");
      expect(result.current.data?.dateConversion).toBe("2024-02-15");
    });
  });
});
