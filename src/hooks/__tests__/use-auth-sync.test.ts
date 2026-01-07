import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock for auth state change callback
type AuthCallback = (event: string, session: unknown) => void;
let authChangeCallback: AuthCallback | null = null;

// Create mocks with hoisted vi.hoisted
const { mockSupabase, mockCreateClient } = vi.hoisted(() => {
  const mockAuth = {
    onAuthStateChange: vi.fn((callback: AuthCallback) => {
      authChangeCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    }),
  };

  return {
    mockSupabase: {
      auth: mockAuth,
    },
    mockCreateClient: vi.fn(() => ({
      auth: mockAuth,
    })),
  };
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: mockCreateClient,
}));

// Import after mocking
import { useAuthSync } from '../use-auth-sync';

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

  return {
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    },
    queryClient,
  };
}

describe('useAuthSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authChangeCallback = null;
  });

  it('should subscribe to auth state changes on mount', () => {
    const { wrapper } = createWrapper();

    renderHook(() => useAuthSync(), { wrapper });

    expect(mockCreateClient).toHaveBeenCalled();
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    expect(authChangeCallback).not.toBeNull();
  });

  it('should clear query cache on SIGNED_IN event', () => {
    const { wrapper, queryClient } = createWrapper();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    renderHook(() => useAuthSync(), { wrapper });

    // Simulate SIGNED_IN event
    act(() => {
      authChangeCallback?.('SIGNED_IN', { user: { id: '123' } });
    });

    expect(clearSpy).toHaveBeenCalled();
  });

  it('should clear query cache on SIGNED_OUT event without redirecting', () => {
    const { wrapper, queryClient } = createWrapper();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    renderHook(() => useAuthSync(), { wrapper });

    // Simulate SIGNED_OUT event
    act(() => {
      authChangeCallback?.('SIGNED_OUT', null);
    });

    expect(clearSpy).toHaveBeenCalled();
    // Note: This hook should NOT redirect - that's handled by use-auth.ts
  });

  it('should NOT invalidate cache on TOKEN_REFRESHED event', () => {
    const { wrapper, queryClient } = createWrapper();
    const clearSpy = vi.spyOn(queryClient, 'clear');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useAuthSync(), { wrapper });

    // Simulate TOKEN_REFRESHED event
    act(() => {
      authChangeCallback?.('TOKEN_REFRESHED', { user: { id: '123' } });
    });

    expect(clearSpy).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('should invalidate user/profile queries on USER_UPDATED event', () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useAuthSync(), { wrapper });

    // Simulate USER_UPDATED event
    act(() => {
      authChangeCallback?.('USER_UPDATED', { user: { id: '123' } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profiles'] });
  });

  it('should NOT take any action on INITIAL_SESSION event', () => {
    const { wrapper, queryClient } = createWrapper();
    const clearSpy = vi.spyOn(queryClient, 'clear');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useAuthSync(), { wrapper });

    // Simulate INITIAL_SESSION event
    act(() => {
      authChangeCallback?.('INITIAL_SESSION', { user: { id: '123' } });
    });

    expect(clearSpy).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('should unsubscribe from auth changes on unmount', () => {
    const { wrapper } = createWrapper();

    const { unmount } = renderHook(() => useAuthSync(), { wrapper });

    // Get the subscription mock
    const subscriptionResult = mockSupabase.auth.onAuthStateChange.mock.results[0].value;
    const unsubscribeSpy = subscriptionResult.data.subscription.unsubscribe;

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
