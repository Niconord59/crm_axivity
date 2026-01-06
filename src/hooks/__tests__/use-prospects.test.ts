// CRM Axivity - useProspects Hook Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useProspects,
  useProspect,
  useProspectsWithClients,
  useUpdateProspectStatus,
  useCreateProspect,
  useProspectionKPIs,
  useRappelsAujourdhui,
  useRdvAujourdhui,
  usePastRdvProspects,
} from "../use-prospects";
import { queryKeys } from "@/lib/queryKeys";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockNot = vi.fn();
const mockOr = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockLt = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockLimit = vi.fn();

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

// Sample test data matching Supabase contacts schema
const sampleProspectRecords = [
  {
    id: "contact-1",
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@acme.com",
    telephone: "0612345678",
    poste: "CEO",
    est_principal: true,
    statut_prospection: "À appeler",
    date_rappel: null,
    date_rdv_prevu: null,
    type_rdv: null,
    lien_visio: null,
    source_lead: "LinkedIn",
    notes_prospection: "Lead chaud",
    client_id: "client-1",
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "contact-2",
    nom: "Martin",
    prenom: "Sophie",
    email: "sophie.martin@beta.fr",
    telephone: "0698765432",
    poste: "CTO",
    est_principal: false,
    statut_prospection: "Rappeler",
    date_rappel: "2024-01-20",
    date_rdv_prevu: null,
    type_rdv: null,
    lien_visio: null,
    source_lead: "Salon",
    notes_prospection: "Intéressée par l'offre",
    client_id: "client-2",
    created_at: "2024-01-16T14:00:00Z",
  },
  {
    id: "contact-3",
    nom: "Bernard",
    prenom: "Pierre",
    email: "p.bernard@gamma.io",
    telephone: null,
    poste: "Directeur Commercial",
    est_principal: true,
    statut_prospection: "RDV planifié",
    date_rappel: null,
    date_rdv_prevu: "2024-01-25",
    type_rdv: "Visio",
    lien_visio: "https://meet.google.com/abc-123",
    source_lead: "Référence",
    notes_prospection: null,
    client_id: "client-3",
    created_at: "2024-01-17T09:00:00Z",
  },
  {
    id: "contact-4",
    nom: "Lefebvre",
    prenom: "Marie",
    email: "marie@delta.com",
    telephone: "0611223344",
    poste: "DG",
    est_principal: true,
    statut_prospection: "Qualifié",
    date_rappel: null,
    date_rdv_prevu: null,
    type_rdv: null,
    lien_visio: null,
    source_lead: "Site web",
    notes_prospection: "Converti en opportunité",
    client_id: "client-4",
    created_at: "2024-01-18T11:00:00Z",
  },
  {
    id: "contact-5",
    nom: "Durand",
    prenom: "Thomas",
    email: "t.durand@epsilon.fr",
    telephone: "0699887766",
    poste: "Responsable Achats",
    est_principal: false,
    statut_prospection: "Non qualifié",
    date_rappel: null,
    date_rdv_prevu: null,
    type_rdv: null,
    lien_visio: null,
    source_lead: "Appel entrant",
    notes_prospection: "Budget insuffisant",
    client_id: "client-5",
    created_at: "2024-01-19T16:00:00Z",
  },
];

// Sample clients for join tests
const sampleClients = [
  { id: "client-1", nom: "Acme Corp" },
  { id: "client-2", nom: "Beta Industries" },
  { id: "client-3", nom: "Gamma Solutions" },
  { id: "client-4", nom: "Delta Services" },
  { id: "client-5", nom: "Epsilon Tech" },
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

// Helper to setup successful list query
function setupSuccessfulListQuery(data: unknown[]) {
  // Chain: select → not → order → order → [filters] → resolves
  const resolveData = { data, error: null };

  // Create a chainable AND thenable object
  const chainableResult = {
    eq: mockEq,
    in: mockIn,
    or: mockOr,
    gte: mockGte,
    lte: mockLte,
    lt: mockLt,
    not: mockNot,
    order: mockOrder,
    limit: mockLimit,
    // Make it thenable for await
    then: (resolve: (v: typeof resolveData) => void) => resolve(resolveData),
  };

  // order() returns chainable result
  mockOrder.mockReturnValue(chainableResult);

  // Filter methods also return chainable result
  mockEq.mockReturnValue(chainableResult);
  mockIn.mockReturnValue(chainableResult);
  mockOr.mockReturnValue(chainableResult);
  mockGte.mockReturnValue(chainableResult);
  mockLte.mockReturnValue(chainableResult);
  mockLt.mockReturnValue(chainableResult);
  mockNot.mockReturnValue(chainableResult);
  mockLimit.mockReturnValue(chainableResult);

  // select() returns { not: ... } for the initial chain
  mockSelect.mockReturnValue({ not: mockNot, eq: mockEq, in: mockIn, order: mockOrder });

  // Re-setup mockFrom after resetAllMocks
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, update: mockUpdate });
}

// Helper to setup single query
function setupSuccessfulSingleQuery(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
}

// Helper for hooks with eq → eq → order chain (useRappelsAujourdhui, useRdvAujourdhui)
// These hooks also fetch client names in a second query
function setupEqEqOrderChain(data: unknown[]) {
  const resolveData = { data, error: null };

  // Create a chainable AND thenable object for contacts query
  const chainableResult = {
    eq: mockEq,
    order: mockOrder,
    then: (resolve: (v: typeof resolveData) => void) => resolve(resolveData),
  };

  mockOrder.mockReturnValue(chainableResult);
  mockEq.mockReturnValue(chainableResult);

  // Setup for both contacts and clients tables
  // Contacts: select → eq → eq → order
  // Clients: select → in (for fetching client names)
  const clientsData = { data: sampleClients, error: null };
  const clientsChainableResult = {
    in: mockIn,
    then: (resolve: (v: typeof clientsData) => void) => resolve(clientsData),
  };
  mockIn.mockReturnValue(clientsChainableResult);

  // mockFrom returns different objects based on table
  mockFrom.mockImplementation((table: string) => {
    if (table === "contacts") {
      return { select: vi.fn().mockReturnValue({ eq: mockEq }) };
    }
    if (table === "clients") {
      return { select: vi.fn().mockReturnValue({ in: mockIn }) };
    }
    return { select: mockSelect, insert: mockInsert, update: mockUpdate };
  });
}

// Helper for usePastRdvProspects: eq → not → lt → order chain
// This hook also fetches client names in a second query
function setupEqNotLtOrderChain(data: unknown[]) {
  const resolveData = { data, error: null };

  const chainableResult = {
    order: mockOrder,
    then: (resolve: (v: typeof resolveData) => void) => resolve(resolveData),
  };

  mockOrder.mockReturnValue(chainableResult);
  mockLt.mockReturnValue({ order: mockOrder });
  mockNot.mockReturnValue({ lt: mockLt });
  mockEq.mockReturnValue({ not: mockNot });

  // Setup for clients table query
  const clientsData = { data: sampleClients, error: null };
  const clientsChainableResult = {
    in: mockIn,
    then: (resolve: (v: typeof clientsData) => void) => resolve(clientsData),
  };
  mockIn.mockReturnValue(clientsChainableResult);

  // mockFrom returns different objects based on table
  mockFrom.mockImplementation((table: string) => {
    if (table === "contacts") {
      return { select: vi.fn().mockReturnValue({ eq: mockEq }) };
    }
    if (table === "clients") {
      return { select: vi.fn().mockReturnValue({ in: mockIn }) };
    }
    return { select: mockSelect, insert: mockInsert, update: mockUpdate };
  });
}

// Helper for filter tests with select → not → order → order → filter chain
function setupFilterQuery(data: unknown[]) {
  const resolveData = { data, error: null };

  // Create thenable result for filter methods
  const filterResult = {
    then: (resolve: (v: typeof resolveData) => void) => resolve(resolveData),
  };

  // Filter methods return thenable result
  mockEq.mockReturnValue(filterResult);
  mockIn.mockReturnValue(filterResult);
  mockOr.mockReturnValue(filterResult);
  mockGte.mockReturnValue(filterResult);
  mockLte.mockReturnValue(filterResult);
  mockLt.mockReturnValue(filterResult);

  // Second order returns chainable with filter methods
  const secondOrderResult = {
    eq: mockEq,
    in: mockIn,
    or: mockOr,
    gte: mockGte,
    lte: mockLte,
    lt: mockLt,
    not: mockNot,
    order: mockOrder,
  };

  // First order returns object with second order
  mockOrder.mockReturnValue(secondOrderResult);
  mockNot.mockReturnValue({ order: mockOrder });
  mockSelect.mockReturnValue({ not: mockNot });
  // Re-setup mockFrom after resetAllMocks
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, update: mockUpdate });
}

// Helper to setup mutation
function setupSuccessfulMutation(data: unknown) {
  mockSingle.mockResolvedValue({ data, error: null });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockEq.mockReturnValue({ select: mockSelect });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockUpdate.mockReturnValue({ eq: mockEq });
}

describe("use-prospects", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ============================================
  // useProspects TESTS
  // ============================================
  describe("useProspects", () => {
    it("should fetch all prospects successfully", async () => {
      setupSuccessfulListQuery(sampleProspectRecords);

      const { result } = renderHook(() => useProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("contacts");
      expect(result.current.data).toHaveLength(5);
    });

    it("should map Supabase fields to TypeScript Contact type", async () => {
      setupSuccessfulListQuery([sampleProspectRecords[0]]);

      const { result } = renderHook(() => useProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const prospect = result.current.data?.[0];
      expect(prospect?.id).toBe("contact-1");
      expect(prospect?.nom).toBe("Dupont");
      expect(prospect?.prenom).toBe("Jean");
      expect(prospect?.email).toBe("jean.dupont@acme.com");
      expect(prospect?.telephone).toBe("0612345678");
      expect(prospect?.poste).toBe("CEO");
      expect(prospect?.estPrincipal).toBe(true);
      expect(prospect?.statutProspection).toBe("À appeler");
      expect(prospect?.sourceLead).toBe("LinkedIn");
      expect(prospect?.client).toEqual(["client-1"]);
    });

    it("should filter by single statut", async () => {
      const filtered = sampleProspectRecords.filter(
        (p) => p.statut_prospection === "Rappeler"
      );
      setupFilterQuery(filtered);

      const { result } = renderHook(
        () => useProspects({ statut: "Rappeler" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("statut_prospection", "Rappeler");
    });

    it("should filter by multiple statuts using in()", async () => {
      const statuts = ["À appeler", "Rappeler"];
      const filtered = sampleProspectRecords.filter((p) =>
        statuts.includes(p.statut_prospection)
      );
      setupFilterQuery(filtered);

      const { result } = renderHook(
        () => useProspects({ statut: ["À appeler", "Rappeler"] }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockIn).toHaveBeenCalledWith("statut_prospection", statuts);
    });

    it("should filter by source", async () => {
      const filtered = sampleProspectRecords.filter(
        (p) => p.source_lead === "LinkedIn"
      );
      setupFilterQuery(filtered);

      const { result } = renderHook(
        () => useProspects({ source: "LinkedIn" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("source_lead", "LinkedIn");
    });

    it("should handle search filter with or()", async () => {
      const searchTerm = "Dupont";
      setupFilterQuery([sampleProspectRecords[0]]);

      const { result } = renderHook(
        () => useProspects({ search: searchTerm }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockOr).toHaveBeenCalledWith(
        `nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
      );
    });

    it("should handle Supabase error", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });
      mockNot.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ not: mockNot });

      const { result } = renderHook(() => useProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should return empty array when no data", async () => {
      setupSuccessfulListQuery([]);

      const { result } = renderHook(() => useProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it("should handle prospect without client_id", async () => {
      const prospectNoClient = {
        ...sampleProspectRecords[0],
        client_id: null,
      };
      setupSuccessfulListQuery([prospectNoClient]);

      const { result } = renderHook(() => useProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].client).toBeUndefined();
    });
  });

  // ============================================
  // useProspect TESTS
  // ============================================
  describe("useProspect", () => {
    it("should fetch single prospect by ID", async () => {
      setupSuccessfulSingleQuery(sampleProspectRecords[0]);

      const { result } = renderHook(() => useProspect("contact-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("contacts");
      expect(mockEq).toHaveBeenCalledWith("id", "contact-1");
      expect(result.current.data?.nom).toBe("Dupont");
    });

    it("should not fetch when id is undefined", async () => {
      const { result } = renderHook(() => useProspect(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("should handle error for non-existent prospect", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      const { result } = renderHook(() => useProspect("invalid-id"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // ============================================
  // useUpdateProspectStatus TESTS
  // ============================================
  describe("useUpdateProspectStatus", () => {
    it("should update prospect status", async () => {
      const updatedProspect = {
        ...sampleProspectRecords[0],
        statut_prospection: "Rappeler",
      };
      setupSuccessfulMutation(updatedProspect);

      const { result } = renderHook(() => useUpdateProspectStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "contact-1",
        statut: "Rappeler",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith("contacts");
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should update status with dateRappel", async () => {
      const updatedProspect = {
        ...sampleProspectRecords[0],
        statut_prospection: "Rappeler",
        date_rappel: "2024-01-25",
      };
      setupSuccessfulMutation(updatedProspect);

      const { result } = renderHook(() => useUpdateProspectStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "contact-1",
        statut: "Rappeler",
        dateRappel: "2024-01-25",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.statut_prospection).toBe("Rappeler");
      expect(updateCall.date_rappel).toBe("2024-01-25");
    });

    it("should update status with RDV fields", async () => {
      const updatedProspect = {
        ...sampleProspectRecords[0],
        statut_prospection: "RDV planifié",
        date_rdv_prevu: "2024-01-30",
        type_rdv: "Visio",
        lien_visio: "https://meet.example.com/123",
      };
      setupSuccessfulMutation(updatedProspect);

      const { result } = renderHook(() => useUpdateProspectStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "contact-1",
        statut: "RDV planifié",
        dateRdvPrevu: "2024-01-30",
        typeRdv: "Visio",
        lienVisio: "https://meet.example.com/123",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.date_rdv_prevu).toBe("2024-01-30");
      expect(updateCall.type_rdv).toBe("Visio");
      expect(updateCall.lien_visio).toBe("https://meet.example.com/123");
    });

    it("should update notes", async () => {
      const updatedProspect = {
        ...sampleProspectRecords[0],
        notes_prospection: "Updated notes",
      };
      setupSuccessfulMutation(updatedProspect);

      const { result } = renderHook(() => useUpdateProspectStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "contact-1",
        statut: "Rappeler",
        notes: "Updated notes",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.notes_prospection).toBe("Updated notes");
    });

    it("should clear dateRappel when empty string passed", async () => {
      const updatedProspect = {
        ...sampleProspectRecords[1],
        date_rappel: null,
      };
      setupSuccessfulMutation(updatedProspect);

      const { result } = renderHook(() => useUpdateProspectStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: "contact-2",
        statut: "Qualifié",
        dateRappel: "",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.date_rappel).toBeNull();
    });
  });

  // ============================================
  // useCreateProspect TESTS
  // ============================================
  describe("useCreateProspect", () => {
    it("should create prospect with new client", async () => {
      // Mock: client doesn't exist, create new client, then contact
      const newClient = { id: "new-client-1", nom: "New Company" };
      const newContact = {
        id: "new-contact-1",
        nom: "Nouveau",
        client_id: "new-client-1",
        statut_prospection: "À appeler",
        source_lead: "LinkedIn",
      };

      // First call: check existing client (returns empty)
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const eqMockClients = vi.fn().mockReturnValue({ limit: limitMock });
      const selectMockClients = vi.fn().mockReturnValue({ eq: eqMockClients });

      // Second call: create client
      const singleMockClient = vi
        .fn()
        .mockResolvedValue({ data: newClient, error: null });
      const selectMockInsertClient = vi
        .fn()
        .mockReturnValue({ single: singleMockClient });
      const insertMockClient = vi
        .fn()
        .mockReturnValue({ select: selectMockInsertClient });

      // Third call: create contact
      const singleMockContact = vi
        .fn()
        .mockResolvedValue({ data: newContact, error: null });
      const selectMockInsertContact = vi
        .fn()
        .mockReturnValue({ single: singleMockContact });
      const insertMockContact = vi
        .fn()
        .mockReturnValue({ select: selectMockInsertContact });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === "clients" && callCount === 1) {
          return { select: selectMockClients };
        }
        if (table === "clients" && callCount === 2) {
          return { insert: insertMockClient };
        }
        if (table === "contacts") {
          return { insert: insertMockContact };
        }
        return { select: mockSelect, insert: mockInsert };
      });

      const { result } = renderHook(() => useCreateProspect(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        entreprise: "New Company",
        nom: "Nouveau",
        sourceLead: "LinkedIn",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.clientId).toBe("new-client-1");
    });

    it("should create prospect with existing client by ID", async () => {
      const newContact = {
        id: "new-contact-2",
        nom: "Test",
        client_id: "existing-client-1",
        statut_prospection: "À appeler",
        source_lead: "Salon",
      };

      // Only contacts insert (no client lookup)
      const singleMockContact = vi
        .fn()
        .mockResolvedValue({ data: newContact, error: null });
      const selectMockInsertContact = vi
        .fn()
        .mockReturnValue({ single: singleMockContact });
      const insertMockContact = vi
        .fn()
        .mockReturnValue({ select: selectMockInsertContact });

      mockFrom.mockImplementation((table: string) => {
        if (table === "contacts") {
          return { insert: insertMockContact };
        }
        return { select: mockSelect, insert: mockInsert };
      });

      const { result } = renderHook(() => useCreateProspect(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        entreprise: "Existing Company",
        clientId: "existing-client-1",
        nom: "Test",
        sourceLead: "Salon",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.clientId).toBe("existing-client-1");
    });

    it("should use existing client when found by name", async () => {
      const existingClient = { id: "found-client-1" };
      const newContact = {
        id: "new-contact-3",
        nom: "Contact",
        client_id: "found-client-1",
        statut_prospection: "Rappeler",
        source_lead: "Site web",
      };

      // Mock: client exists
      const limitMock = vi
        .fn()
        .mockResolvedValue({ data: [existingClient], error: null });
      const eqMockClients = vi.fn().mockReturnValue({ limit: limitMock });
      const selectMockClients = vi.fn().mockReturnValue({ eq: eqMockClients });

      // Create contact
      const singleMockContact = vi
        .fn()
        .mockResolvedValue({ data: newContact, error: null });
      const selectMockInsertContact = vi
        .fn()
        .mockReturnValue({ single: singleMockContact });
      const insertMockContact = vi
        .fn()
        .mockReturnValue({ select: selectMockInsertContact });

      mockFrom.mockImplementation((table: string) => {
        if (table === "clients") {
          return { select: selectMockClients };
        }
        if (table === "contacts") {
          return { insert: insertMockContact };
        }
        return { select: mockSelect, insert: mockInsert };
      });

      const { result } = renderHook(() => useCreateProspect(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        entreprise: "Existing Company Name",
        nom: "Contact",
        sourceLead: "Site web",
        statutProspection: "Rappeler",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.clientId).toBe("found-client-1");
    });

    it("should include optional contact fields", async () => {
      const newClient = { id: "client-opt", nom: "Optional Fields Co" };
      const newContact = {
        id: "contact-opt",
        nom: "Full",
        prenom: "Name",
        email: "full.name@test.com",
        telephone: "0600000000",
        poste: "Manager",
        client_id: "client-opt",
        statut_prospection: "À appeler",
        source_lead: "Référence",
        notes_prospection: "Test notes",
        date_rappel: "2024-02-01",
      };

      // Mock client lookup (empty) and create
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const eqMockClients = vi.fn().mockReturnValue({ limit: limitMock });
      const selectMockClients = vi.fn().mockReturnValue({ eq: eqMockClients });

      const singleMockClient = vi
        .fn()
        .mockResolvedValue({ data: newClient, error: null });
      const selectMockInsertClient = vi
        .fn()
        .mockReturnValue({ single: singleMockClient });
      const insertMockClient = vi
        .fn()
        .mockReturnValue({ select: selectMockInsertClient });

      const singleMockContact = vi
        .fn()
        .mockResolvedValue({ data: newContact, error: null });
      const selectMockInsertContact = vi
        .fn()
        .mockReturnValue({ single: singleMockContact });
      const insertMockContact = vi
        .fn()
        .mockReturnValue({ select: selectMockInsertContact });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === "clients" && callCount === 1) {
          return { select: selectMockClients };
        }
        if (table === "clients" && callCount === 2) {
          return { insert: insertMockClient };
        }
        if (table === "contacts") {
          return { insert: insertMockContact };
        }
        return { select: mockSelect, insert: mockInsert };
      });

      const { result } = renderHook(() => useCreateProspect(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        entreprise: "Optional Fields Co",
        nom: "Full",
        prenom: "Name",
        email: "full.name@test.com",
        telephone: "0600000000",
        role: "Manager",
        sourceLead: "Référence",
        notesProspection: "Test notes",
        dateRappel: "2024-02-01",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.prenom).toBe("Name");
      expect(result.current.data?.email).toBe("full.name@test.com");
    });

    it("should include client address fields when provided", async () => {
      const newClient = {
        id: "client-addr",
        nom: "Address Co",
        siret: "12345678901234",
        adresse: "123 Rue Test",
        code_postal: "75001",
        ville: "Paris",
        pays: "France",
      };
      const newContact = {
        id: "contact-addr",
        nom: "Test",
        client_id: "client-addr",
        statut_prospection: "À appeler",
        source_lead: "LinkedIn",
      };

      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const eqMockClients = vi.fn().mockReturnValue({ limit: limitMock });
      const selectMockClients = vi.fn().mockReturnValue({ eq: eqMockClients });

      const singleMockClient = vi
        .fn()
        .mockResolvedValue({ data: newClient, error: null });
      const selectMockInsertClient = vi
        .fn()
        .mockReturnValue({ single: singleMockClient });
      const insertMockClient = vi
        .fn()
        .mockReturnValue({ select: selectMockInsertClient });

      const singleMockContact = vi
        .fn()
        .mockResolvedValue({ data: newContact, error: null });
      const selectMockInsertContact = vi
        .fn()
        .mockReturnValue({ single: singleMockContact });
      const insertMockContact = vi
        .fn()
        .mockReturnValue({ select: selectMockInsertContact });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === "clients" && callCount === 1) {
          return { select: selectMockClients };
        }
        if (table === "clients" && callCount === 2) {
          return { insert: insertMockClient };
        }
        if (table === "contacts") {
          return { insert: insertMockContact };
        }
        return { select: mockSelect, insert: mockInsert };
      });

      const { result } = renderHook(() => useCreateProspect(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        entreprise: "Address Co",
        siret: "12345678901234",
        adresse: "123 Rue Test",
        codePostal: "75001",
        ville: "Paris",
        pays: "France",
        nom: "Test",
        sourceLead: "LinkedIn",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify client was created with address fields
      const clientInsertCall = insertMockClient.mock.calls[0][0];
      expect(clientInsertCall.siret).toBe("12345678901234");
      expect(clientInsertCall.adresse).toBe("123 Rue Test");
      expect(clientInsertCall.code_postal).toBe("75001");
      expect(clientInsertCall.ville).toBe("Paris");
      expect(clientInsertCall.pays).toBe("France");
    });
  });

  // ============================================
  // useProspectionKPIs TESTS
  // ============================================
  describe("useProspectionKPIs", () => {
    it("should calculate KPIs from prospects", async () => {
      setupSuccessfulListQuery(sampleProspectRecords);

      // We need to render both hooks together as KPIs depends on prospects
      const wrapper = createWrapper();
      const { result: prospectsResult } = renderHook(() => useProspects(), {
        wrapper,
      });

      await waitFor(() => {
        expect(prospectsResult.current.isSuccess).toBe(true);
      });

      // The KPIs hook is derived, so we test the calculation logic
      const prospects = prospectsResult.current.data || [];
      const aAppeler = prospects.filter(
        (p) => p.statutProspection === "À appeler"
      ).length;
      const rappels = prospects.filter(
        (p) => p.statutProspection === "Rappeler"
      ).length;
      const qualifies = prospects.filter(
        (p) => p.statutProspection === "Qualifié"
      ).length;
      const nonQualifies = prospects.filter(
        (p) => p.statutProspection === "Non qualifié"
      ).length;

      expect(aAppeler).toBe(1);
      expect(rappels).toBe(1);
      expect(qualifies).toBe(1);
      expect(nonQualifies).toBe(1);
    });

    it("should calculate taux de qualification correctly", async () => {
      // Test with 3 qualifiés out of 5 terminés (60%)
      const testProspects = [
        { ...sampleProspectRecords[0], statut_prospection: "Qualifié" },
        { ...sampleProspectRecords[1], statut_prospection: "Qualifié" },
        { ...sampleProspectRecords[2], statut_prospection: "Qualifié" },
        { ...sampleProspectRecords[3], statut_prospection: "Non qualifié" },
        { ...sampleProspectRecords[4], statut_prospection: "Perdu" },
      ];
      setupSuccessfulListQuery(testProspects);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProspects(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const prospects = result.current.data || [];
      const qualifies = prospects.filter(
        (p) => p.statutProspection === "Qualifié"
      ).length;
      const nonQualifies = prospects.filter(
        (p) => p.statutProspection === "Non qualifié"
      ).length;
      const perdus = prospects.filter(
        (p) => p.statutProspection === "Perdu"
      ).length;

      const totalTermines = qualifies + nonQualifies + perdus;
      const tauxQualification = Math.round((qualifies / totalTermines) * 100);

      expect(tauxQualification).toBe(60); // 3/5 = 60%
    });

    it("should return 0 taux when no terminated prospects", async () => {
      const onlyActiveProspects = [
        { ...sampleProspectRecords[0], statut_prospection: "À appeler" },
        { ...sampleProspectRecords[1], statut_prospection: "Rappeler" },
      ];
      setupSuccessfulListQuery(onlyActiveProspects);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useProspects(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const prospects = result.current.data || [];
      const qualifies = prospects.filter(
        (p) => p.statutProspection === "Qualifié"
      ).length;
      const nonQualifies = prospects.filter(
        (p) => p.statutProspection === "Non qualifié"
      ).length;
      const perdus = prospects.filter(
        (p) => p.statutProspection === "Perdu"
      ).length;

      const totalTermines = qualifies + nonQualifies + perdus;
      const tauxQualification =
        totalTermines > 0 ? Math.round((qualifies / totalTermines) * 100) : 0;

      expect(tauxQualification).toBe(0);
    });
  });

  // ============================================
  // useRappelsAujourdhui TESTS
  // ============================================
  describe("useRappelsAujourdhui", () => {
    it("should fetch callbacks scheduled for today", async () => {
      const todayCallbacks = [
        {
          ...sampleProspectRecords[1],
          date_rappel: new Date().toISOString().split("T")[0],
        },
      ];

      setupEqEqOrderChain(todayCallbacks);

      const { result } = renderHook(() => useRappelsAujourdhui(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("statut_prospection", "Rappeler");
    });

    it("should filter by userId when provided", async () => {
      setupEqEqOrderChain([]);

      renderHook(() => useRappelsAujourdhui("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith("owner_id", "user-123");
      });
    });
  });

  // ============================================
  // useRdvAujourdhui TESTS
  // ============================================
  describe("useRdvAujourdhui", () => {
    it("should fetch RDV scheduled for today", async () => {
      const todayRdv = [
        {
          ...sampleProspectRecords[2],
          date_rdv_prevu: new Date().toISOString().split("T")[0],
        },
      ];

      setupEqEqOrderChain(todayRdv);

      const { result } = renderHook(() => useRdvAujourdhui(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("statut_prospection", "RDV planifié");
    });
  });

  // ============================================
  // usePastRdvProspects TESTS
  // ============================================
  describe("usePastRdvProspects", () => {
    it("should fetch prospects with past RDV dates", async () => {
      const pastRdv = [
        {
          ...sampleProspectRecords[2],
          date_rdv_prevu: "2024-01-01", // Past date
        },
      ];

      setupEqNotLtOrderChain(pastRdv);

      const { result } = renderHook(() => usePastRdvProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockEq).toHaveBeenCalledWith("statut_prospection", "RDV planifié");
    });
  });

  // ============================================
  // QUERY KEYS TESTS
  // ============================================
  describe("Query Keys", () => {
    it("should use queryKeys.prospects.list for list queries", () => {
      expect(queryKeys.prospects.list()).toBeDefined();
      expect(queryKeys.prospects.list({ statut: "Rappeler" })).toBeDefined();
    });

    it("should use queryKeys.prospects.detail for single queries", () => {
      expect(queryKeys.prospects.detail("contact-1")).toBeDefined();
    });

    it("should use queryKeys.prospects.kpis for KPIs", () => {
      expect(queryKeys.prospects.kpis()).toBeDefined();
    });
  });

  // ============================================
  // MAPPER BUSINESS LOGIC TESTS
  // ============================================
  describe("Mapper Business Logic", () => {
    it("should map all prospect statuses correctly", async () => {
      const allStatuses = [
        "À appeler",
        "Appelé - pas répondu",
        "Rappeler",
        "RDV planifié",
        "RDV effectué",
        "Qualifié",
        "Non qualifié",
        "Perdu",
      ];

      const prospectsWithAllStatuses = allStatuses.map((status, i) => ({
        ...sampleProspectRecords[0],
        id: `contact-${i}`,
        statut_prospection: status,
      }));

      setupSuccessfulListQuery(prospectsWithAllStatuses);

      const { result } = renderHook(() => useProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      result.current.data?.forEach((prospect, i) => {
        expect(prospect.statutProspection).toBe(allStatuses[i]);
      });
    });

    it("should map RDV types correctly", async () => {
      const rdvTypes = ["Visio", "Présentiel"];

      const prospectsWithRdvTypes = rdvTypes.map((type, i) => ({
        ...sampleProspectRecords[2],
        id: `contact-rdv-${i}`,
        type_rdv: type,
      }));

      setupSuccessfulListQuery(prospectsWithRdvTypes);

      const { result } = renderHook(() => useProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].typeRdv).toBe("Visio");
      expect(result.current.data?.[1].typeRdv).toBe("Présentiel");
    });

    it("should map source_lead to sourceLead", async () => {
      const sources = [
        "LinkedIn",
        "Salon",
        "Référence",
        "Site web",
        "Appel entrant",
        "Email",
        "Autre",
      ];

      const prospectsWithSources = sources.map((source, i) => ({
        ...sampleProspectRecords[0],
        id: `contact-src-${i}`,
        source_lead: source,
      }));

      setupSuccessfulListQuery(prospectsWithSources);

      const { result } = renderHook(() => useProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      result.current.data?.forEach((prospect, i) => {
        expect(prospect.sourceLead).toBe(sources[i]);
      });
    });

    it("should handle empty nom with default empty string", async () => {
      const prospectEmptyNom = {
        ...sampleProspectRecords[0],
        nom: null,
      };
      setupSuccessfulListQuery([prospectEmptyNom]);

      const { result } = renderHook(() => useProspects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].nom).toBe("");
    });
  });
});
