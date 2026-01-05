import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock-url.com/file' } })),
      download: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
};

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Helper to reset all mocks
export function resetSupabaseMocks() {
  vi.clearAllMocks();
}

// Helper to mock a successful query response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockQueryResponse(tableName: string, data: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockSupabaseClient.from as any).mockReturnValueOnce({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: data[0] || null, error: null })),
        order: vi.fn(() => Promise.resolve({ data, error: null })),
      })),
      order: vi.fn(() => Promise.resolve({ data, error: null })),
      single: vi.fn(() => Promise.resolve({ data: data[0] || null, error: null })),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });
}

// Helper to mock a query error
export function mockQueryError(tableName: string, errorMessage: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockSupabaseClient.from as any).mockReturnValueOnce({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: { message: errorMessage } })),
        order: vi.fn(() => Promise.resolve({ data: null, error: { message: errorMessage } })),
      })),
      order: vi.fn(() => Promise.resolve({ data: null, error: { message: errorMessage } })),
      single: vi.fn(() => Promise.resolve({ data: null, error: { message: errorMessage } })),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });
}

// Sample test data
export const sampleClients = [
  {
    id: '1',
    nom: 'Acme Corp',
    secteur_activite: 'Tech',
    statut: 'Actif',
    type_client: 'PME',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    nom: 'Beta Inc',
    secteur_activite: 'Finance',
    statut: 'Prospect',
    type_client: 'ETI',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

export const sampleOpportunites = [
  {
    id: '1',
    nom: 'Projet Alpha',
    valeur_estimee: 50000,
    probabilite: 75,
    statut: 'Proposition',
    client: ['1'],
    date_cloture_prevue: '2024-06-01',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    nom: 'Projet Beta',
    valeur_estimee: 30000,
    probabilite: 50,
    statut: 'Qualifie',
    client: ['2'],
    date_cloture_prevue: '2024-07-01',
    created_at: '2024-01-02T00:00:00Z',
  },
];
