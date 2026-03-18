import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock for auth state change callback
type AuthCallback = (event: string, session: { user?: { id: string; email?: string } } | null) => void;
let authChangeCallback: AuthCallback | null = null;

// Hoisted mocks
const { mockFrom, mockSignOut, mockOnAuthStateChange } = vi.hoisted(() => {
  const mockSingle = vi.fn(() =>
    Promise.resolve({
      data: {
        id: 'user-1',
        email: 'test@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'admin',
        avatar_url: null,
      },
      error: null,
    })
  );

  const mockEq = vi.fn(() => ({
    single: mockSingle,
  }));

  const mockSelect = vi.fn(() => ({
    eq: mockEq,
  }));

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
  }));

  const mockSignOut = vi.fn(() => Promise.resolve({ error: null }));

  const mockOnAuthStateChange = vi.fn();

  return { mockFrom, mockSingle, mockEq, mockSelect, mockSignOut, mockOnAuthStateChange };
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      onAuthStateChange: mockOnAuthStateChange.mockImplementation((callback: AuthCallback) => {
        authChangeCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }),
      signOut: mockSignOut,
    },
  }),
}));

// Import after mocking
import { useAuth, useCurrentUser } from '../use-auth';

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authChangeCallback = null;
  });

  it('should start with loading state and no user', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should subscribe to auth state changes on mount', () => {
    renderHook(() => useAuth());

    expect(mockOnAuthStateChange).toHaveBeenCalled();
    expect(authChangeCallback).not.toBeNull();
  });

  it('should fetch profile and set user when session exists', async () => {
    const { result } = renderHook(() => useAuth());

    // Simulate auth event with session
    act(() => {
      authChangeCallback?.('INITIAL_SESSION', {
        user: { id: 'user-1', email: 'test@example.com' },
      });
    });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    expect(result.current.user?.id).toBe('user-1');
    expect(result.current.user?.nom).toBe('Dupont');
    expect(result.current.user?.role).toBe('admin');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should set loading false only after profile is fetched (no race condition)', async () => {
    const { result } = renderHook(() => useAuth());

    // Before any event, isLoading is true
    expect(result.current.isLoading).toBe(true);

    // Simulate auth event
    act(() => {
      authChangeCallback?.('INITIAL_SESSION', {
        user: { id: 'user-1', email: 'test@example.com' },
      });
    });

    // After profile resolves, both user and isLoading should be set
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // User must be set BEFORE or AT THE SAME TIME as isLoading=false
    expect(result.current.user).not.toBeNull();
    expect(result.current.isAdmin()).toBe(true);
  });

  it('should clear user and stop loading when no session', async () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      authChangeCallback?.('INITIAL_SESSION', null);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should redirect to /login on SIGNED_OUT event', () => {
    renderHook(() => useAuth());

    act(() => {
      authChangeCallback?.('SIGNED_OUT', null);
    });

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('signOut should call supabase signOut and redirect', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('hasRole should check user role correctly', async () => {
    const { result } = renderHook(() => useAuth());

    // Set up user with admin role
    act(() => {
      authChangeCallback?.('INITIAL_SESSION', {
        user: { id: 'user-1', email: 'test@example.com' },
      });
    });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    expect(result.current.hasRole('admin')).toBe(true);
    expect(result.current.hasRole('commercial')).toBe(false);
    expect(result.current.hasRole(['admin', 'commercial'])).toBe(true);
  });

  it('isAdmin should return true for admin role', async () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      authChangeCallback?.('INITIAL_SESSION', {
        user: { id: 'user-1', email: 'test@example.com' },
      });
    });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    expect(result.current.isAdmin()).toBe(true);
  });

  it('isManager should return true for admin and developer roles', async () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      authChangeCallback?.('INITIAL_SESSION', {
        user: { id: 'user-1', email: 'test@example.com' },
      });
    });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    // admin is in the manager roles list
    expect(result.current.isManager()).toBe(true);
  });
});

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authChangeCallback = null;
  });

  it('should return user and isLoading from useAuth', () => {
    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isLoading');
  });
});
