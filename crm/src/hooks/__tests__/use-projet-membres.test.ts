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
import {
  useProjetMembres,
  useProjetsMembres,
  useProjetsNonAssignes,
  useAddProjetMembre,
  useRemoveProjetMembre,
  useSetProjetMembres,
} from '../use-projet-membres';

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
const mockProjetMembres = [
  {
    id: 'pm-1',
    projet_id: 'proj-1',
    profile_id: 'profile-1',
    assigned_by: 'admin-1',
    assigned_at: '2024-01-15T10:00:00Z',
    profiles: {
      id: 'profile-1',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
    },
  },
  {
    id: 'pm-2',
    projet_id: 'proj-1',
    profile_id: 'profile-2',
    assigned_by: 'admin-1',
    assigned_at: '2024-01-15T11:00:00Z',
    profiles: {
      id: 'profile-2',
      nom: 'Martin',
      prenom: 'Marie',
      email: 'marie.martin@example.com',
    },
  },
];

describe('useProjetMembres', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch project members successfully', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockProjetMembres, error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useProjetMembres('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].profileNom).toBe('Jean Dupont');
    expect(result.current.data?.[0].profileEmail).toBe('jean.dupont@example.com');
  });

  it('should return empty array when projetId is undefined', async () => {
    const { result } = renderHook(() => useProjetMembres(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle missing table gracefully', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "projet_membres" does not exist' },
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useProjetMembres('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle errors', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useProjetMembres('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should map DB fields to ProjetMembre type correctly', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockProjetMembres, error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useProjetMembres('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const membre = result.current.data?.[0];
    expect(membre).toMatchObject({
      id: 'pm-1',
      projetId: 'proj-1',
      profileId: 'profile-1',
      assignedBy: 'admin-1',
      assignedAt: '2024-01-15T10:00:00Z',
      profileNom: 'Jean Dupont',
      profileEmail: 'jean.dupont@example.com',
    });
  });

  it('should handle profiles as array', async () => {
    const membresWithArrayProfiles = [{
      ...mockProjetMembres[0],
      profiles: [mockProjetMembres[0].profiles],
    }];

    const mockOrder = vi.fn().mockResolvedValue({ data: membresWithArrayProfiles, error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useProjetMembres('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0].profileNom).toBe('Jean Dupont');
  });
});

describe('useProjetsMembres', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch members for multiple projects', async () => {
    const membresMultipleProjects = [
      ...mockProjetMembres,
      {
        id: 'pm-3',
        projet_id: 'proj-2',
        profile_id: 'profile-3',
        assigned_by: 'admin-1',
        assigned_at: '2024-01-16T10:00:00Z',
        profiles: {
          id: 'profile-3',
          nom: 'Durand',
          prenom: 'Pierre',
          email: 'pierre.durand@example.com',
        },
      },
    ];

    const mockIn = vi.fn().mockResolvedValue({ data: membresMultipleProjects, error: null });
    const mockSelect = vi.fn().mockReturnValue({ in: mockIn });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useProjetsMembres(['proj-1', 'proj-2']), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.['proj-1']).toHaveLength(2);
    expect(result.current.data?.['proj-2']).toHaveLength(1);
  });

  it('should return empty object when projetIds is empty', async () => {
    const { result } = renderHook(() => useProjetsMembres([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('should handle missing table gracefully', async () => {
    const mockIn = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "projet_membres" does not exist' },
    });
    const mockSelect = vi.fn().mockReturnValue({ in: mockIn });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useProjetsMembres(['proj-1']), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({});
    consoleSpy.mockRestore();
  });
});

describe('useProjetsNonAssignes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return unassigned projects count', async () => {
    const mockProjets = [{ id: 'proj-1' }, { id: 'proj-2' }, { id: 'proj-3' }];
    const mockAssignments = [{ projet_id: 'proj-1' }];

    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'projets') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: mockProjets, error: null }),
          }),
        };
      }
      if (table === 'projet_membres') {
        return {
          select: vi.fn().mockResolvedValue({ data: mockAssignments, error: null }),
        };
      }
      return {};
    });

    const { result } = renderHook(() => useProjetsNonAssignes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.count).toBe(2);
    expect(result.current.data?.projetIds).toEqual(['proj-2', 'proj-3']);
  });

  it('should return 0 when no projects exist', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'projets') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {};
    });

    const { result } = renderHook(() => useProjetsNonAssignes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.count).toBe(0);
    expect(result.current.data?.projetIds).toEqual([]);
  });

  it('should handle missing projet_membres table gracefully', async () => {
    const mockProjets = [{ id: 'proj-1' }, { id: 'proj-2' }];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'projets') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: mockProjets, error: null }),
          }),
        };
      }
      if (table === 'projet_membres') {
        return {
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '42P01', message: 'relation does not exist' },
          }),
        };
      }
      return {};
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useProjetsNonAssignes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // All projects are unassigned if table doesn't exist
    expect(result.current.data?.count).toBe(2);
    consoleSpy.mockRestore();
  });
});

describe('useAddProjetMembre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a member to a project', async () => {
    const newMembre = {
      id: 'pm-new',
      projet_id: 'proj-1',
      profile_id: 'profile-new',
      assigned_by: 'admin-1',
      assigned_at: '2024-01-17T10:00:00Z',
      profiles: {
        id: 'profile-new',
        nom: 'Nouveau',
        prenom: 'User',
        email: 'nouveau@example.com',
      },
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: newMembre, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useAddProjetMembre(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      projetId: 'proj-1',
      profileId: 'profile-new',
      assignedBy: 'admin-1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInsert).toHaveBeenCalledWith({
      projet_id: 'proj-1',
      profile_id: 'profile-new',
      assigned_by: 'admin-1',
    });
  });

  it('should handle errors', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useAddProjetMembre(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      projetId: 'proj-1',
      profileId: 'profile-1',
      assignedBy: 'admin-1',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useRemoveProjetMembre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove a member from a project', async () => {
    const mockEqProfile = vi.fn().mockResolvedValue({ error: null });
    const mockEqProjet = vi.fn().mockReturnValue({ eq: mockEqProfile });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEqProjet });

    mockSupabase.from.mockReturnValue({
      delete: mockDelete,
    });

    const { result } = renderHook(() => useRemoveProjetMembre(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      projetId: 'proj-1',
      profileId: 'profile-1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockEqProjet).toHaveBeenCalledWith('projet_id', 'proj-1');
    expect(mockEqProfile).toHaveBeenCalledWith('profile_id', 'profile-1');
  });

  it('should handle errors', async () => {
    const mockEqProfile = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
    const mockEqProjet = vi.fn().mockReturnValue({ eq: mockEqProfile });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEqProjet });

    mockSupabase.from.mockReturnValue({
      delete: mockDelete,
    });

    const { result } = renderHook(() => useRemoveProjetMembre(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      projetId: 'proj-1',
      profileId: 'profile-1',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useSetProjetMembres', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set all members for a project', async () => {
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockReturnValue({
      delete: mockDelete,
      insert: mockInsert,
    });

    const { result } = renderHook(() => useSetProjetMembres(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      projetId: 'proj-1',
      profileIds: ['profile-1', 'profile-2'],
      assignedBy: 'admin-1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDeleteEq).toHaveBeenCalledWith('projet_id', 'proj-1');
    expect(mockInsert).toHaveBeenCalledWith([
      { projet_id: 'proj-1', profile_id: 'profile-1', assigned_by: 'admin-1' },
      { projet_id: 'proj-1', profile_id: 'profile-2', assigned_by: 'admin-1' },
    ]);
  });

  it('should only delete when profileIds is empty', async () => {
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockReturnValue({
      delete: mockDelete,
      insert: mockInsert,
    });

    const { result } = renderHook(() => useSetProjetMembres(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      projetId: 'proj-1',
      profileIds: [],
      assignedBy: 'admin-1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDeleteEq).toHaveBeenCalledWith('projet_id', 'proj-1');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should handle delete errors', async () => {
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

    mockSupabase.from.mockReturnValue({
      delete: mockDelete,
    });

    const { result } = renderHook(() => useSetProjetMembres(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      projetId: 'proj-1',
      profileIds: ['profile-1'],
      assignedBy: 'admin-1',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should handle insert errors', async () => {
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });
    const mockInsert = vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } });

    mockSupabase.from.mockReturnValue({
      delete: mockDelete,
      insert: mockInsert,
    });

    const { result } = renderHook(() => useSetProjetMembres(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      projetId: 'proj-1',
      profileIds: ['profile-1'],
      assignedBy: 'admin-1',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
