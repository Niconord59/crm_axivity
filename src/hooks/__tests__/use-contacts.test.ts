import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Create mock with hoisted vi.hoisted
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
    },
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Import after mocking
import { useUpdateContact, useContactsByClient } from '../use-prospects';

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// Sample contact data (Supabase format with snake_case)
const mockContactsFromDb = [
  {
    id: 'contact-1',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@example.com',
    telephone: '06 12 34 56 78',
    poste: 'Directeur Commercial',
    est_principal: true,
    client_id: 'client-123',
    statut_prospection: 'Qualifié',
    date_rappel: '2024-06-15',
    date_rdv_prevu: null,
    type_rdv: 'Visio',
    lien_visio: 'https://meet.google.com/xxx',
    source_lead: 'LinkedIn',
    notes_prospection: 'Contact intéressé',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'contact-2',
    nom: 'Martin',
    prenom: 'Marie',
    email: 'marie.martin@example.com',
    telephone: '06 98 76 54 32',
    poste: 'CEO',
    est_principal: false,
    client_id: 'client-123',
    statut_prospection: 'À appeler',
    date_rappel: '2024-06-20',
    date_rdv_prevu: null,
    type_rdv: null,
    lien_visio: null,
    source_lead: 'Site web',
    notes_prospection: null,
    created_at: '2024-01-02T00:00:00Z',
  },
];

describe('useContactsByClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch contacts for a client', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: mockContactsFromDb, error: null });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useContactsByClient('client-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('contacts');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('client_id', 'client-123');
    expect(result.current.data).toHaveLength(2);
  });

  it('should map snake_case to camelCase correctly', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: [mockContactsFromDb[0]], error: null });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useContactsByClient('client-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const contact = result.current.data?.[0];
    expect(contact).toMatchObject({
      id: 'contact-1',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
      telephone: '06 12 34 56 78',
      poste: 'Directeur Commercial',
      estPrincipal: true,
      statutProspection: 'Qualifié',
      dateRappel: '2024-06-15',
      typeRdv: 'Visio',
      lienVisio: 'https://meet.google.com/xxx',
      sourceLead: 'LinkedIn',
      notesProspection: 'Contact intéressé',
    });
    expect(contact?.client).toEqual(['client-123']);
  });

  it('should not fetch when clientId is undefined', () => {
    const { result } = renderHook(() => useContactsByClient(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useContactsByClient('client-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should return empty array when no contacts exist', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useContactsByClient('client-456'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useUpdateContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update a contact', async () => {
    const updatedContact = {
      ...mockContactsFromDb[0],
      nom: 'Dupont-Martin',
      email: 'updated@example.com',
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: updatedContact, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'contact-1',
      nom: 'Dupont-Martin',
      email: 'updated@example.com',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('contacts');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        nom: 'Dupont-Martin',
        email: 'updated@example.com',
      })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'contact-1');
  });

  it('should map camelCase input to snake_case for Supabase', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: mockContactsFromDb[0], error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'contact-1',
      nom: 'Test',
      prenom: 'User',
      estPrincipal: true,
      clientId: 'new-client-id',
      statutProspection: 'Qualifié',
      dateRappel: '2024-07-01',
      typeRdv: 'Présentiel',
      lienVisio: 'https://teams.microsoft.com/xxx',
      sourceLead: 'Recommandation',
      notesProspection: 'Notes updated',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        nom: 'Test',
        prenom: 'User',
        est_principal: true,
        client_id: 'new-client-id',
        statut_prospection: 'Qualifié',
        date_rappel: '2024-07-01',
        type_rdv: 'Présentiel',
        lien_visio: 'https://teams.microsoft.com/xxx',
        source_lead: 'Recommandation',
        notes_prospection: 'Notes updated',
      })
    );
  });

  it('should handle null values for optional fields', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: mockContactsFromDb[0], error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'contact-1',
      nom: 'Minimal Update',
      // All optional fields omitted
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        nom: 'Minimal Update',
        prenom: null,
        email: null,
        telephone: null,
        poste: null,
        linkedin: null,
        est_principal: false,
        client_id: null,
        statut_prospection: null,
        date_rappel: null,
        type_rdv: null,
        lien_visio: null,
        source_lead: null,
        notes_prospection: null,
      })
    );
  });

  it('should handle update errors', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'contact-1',
      nom: 'Test',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should include updated_at timestamp', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: mockContactsFromDb[0], error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'contact-1',
      nom: 'Test',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        updated_at: expect.any(String),
      })
    );
  });

  it('should return mapped contact data on success', async () => {
    const updatedDbContact = {
      id: 'contact-1',
      nom: 'Updated Name',
      prenom: 'Jean',
      email: 'jean@example.com',
      telephone: '06 00 00 00 00',
      poste: 'CEO',
      est_principal: true,
      client_id: 'client-abc',
      statut_prospection: 'Qualifié',
      date_rappel: '2024-08-01',
      date_rdv_prevu: '2024-08-05',
      type_rdv: 'Visio',
      lien_visio: 'https://meet.google.com/test',
      source_lead: 'LinkedIn',
      notes_prospection: 'Updated notes',
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: updatedDbContact, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useUpdateContact(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'contact-1',
      nom: 'Updated Name',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      id: 'contact-1',
      nom: 'Updated Name',
      prenom: 'Jean',
      estPrincipal: true,
      statutProspection: 'Qualifié',
    });
  });
});
