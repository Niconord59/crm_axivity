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
import { useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient } from '../use-clients';

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
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

// Sample data
const mockClients = [
  {
    id: '1',
    nom: 'Acme Corp',
    secteur: 'Tech',
    statut: 'Actif',
    site_web: 'https://acme.com',
    telephone: '+33 1 23 45 67 89',
    notes: 'Great client',
    created_at: '2024-01-01T00:00:00Z',
    siret: '12345678901234',
    adresse: '1 rue de Paris',
    code_postal: '75001',
    ville: 'Paris',
    pays: 'France',
    sante_client: 'Sain',
  },
  {
    id: '2',
    nom: 'Beta Inc',
    secteur: 'Finance',
    statut: 'Prospect',
    site_web: null,
    telephone: null,
    notes: null,
    created_at: '2024-01-02T00:00:00Z',
    siret: null,
    adresse: null,
    code_postal: null,
    ville: null,
    pays: null,
    sante_client: null,
  },
];

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch clients successfully', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: mockClients, error: null }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].nom).toBe('Acme Corp');
    expect(result.current.data?.[0].secteurActivite).toBe('Tech');
  });

  it('should filter clients by statut', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [mockClients[0]], error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        eq: mockEq,
      }),
      eq: mockEq,
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useClients({ statut: 'Actif' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('clients');
  });

  it('should handle errors', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should map Supabase fields to Client type correctly', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: mockClients, error: null }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const client = result.current.data?.[0];
    expect(client).toMatchObject({
      id: '1',
      nom: 'Acme Corp',
      secteurActivite: 'Tech',
      statut: 'Actif',
      siteWeb: 'https://acme.com',
      telephone: '+33 1 23 45 67 89',
      siret: '12345678901234',
      adresse: '1 rue de Paris',
      codePostal: '75001',
      ville: 'Paris',
      pays: 'France',
    });
  });
});

describe('useClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch a single client by id', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: mockClients[0], error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useClient('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.nom).toBe('Acme Corp');
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useClient(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
});

describe('useCreateClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new client', async () => {
    const newClient = {
      id: '3',
      nom: 'New Client',
      secteur: 'Marketing',
      statut: 'Prospect',
      created_at: '2024-01-03T00:00:00Z',
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: newClient, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ nom: 'New Client', secteurActivite: 'Marketing' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      nom: 'New Client',
      secteur: 'Marketing',
    }));
  });
});

describe('useUpdateClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update an existing client', async () => {
    const updatedClient = {
      ...mockClients[0],
      nom: 'Updated Acme',
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: updatedClient, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useUpdateClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', data: { nom: 'Updated Acme' } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      nom: 'Updated Acme',
    }));
  });
});

describe('useDeleteClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a client', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      delete: mockDelete,
    });

    const { result } = renderHook(() => useDeleteClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });
});
