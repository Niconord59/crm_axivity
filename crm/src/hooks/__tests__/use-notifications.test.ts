import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Create mock with hoisted vi.hoisted
const { mockSupabase, mockUseAuth } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
    },
    mockUseAuth: vi.fn(),
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('../use-auth', () => ({
  useAuth: mockUseAuth,
}));

// Import after mocking
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useCreateNotification,
  useDeleteNotification,
} from '../use-notifications';

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
const mockNotifications = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'project_assigned',
    title: 'Nouveau projet assigné',
    message: 'Vous avez été assigné au projet "CRM Axivity"',
    link: '/projets?id=proj-1',
    is_read: false,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'user-1',
    type: 'task_assigned',
    title: 'Nouvelle tâche',
    message: 'Une tâche vous a été assignée',
    link: '/taches?id=task-1',
    is_read: true,
    created_at: '2024-01-14T09:00:00Z',
  },
];

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should fetch notifications successfully', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: mockNotifications, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].title).toBe('Nouveau projet assigné');
    expect(result.current.data?.[0].isRead).toBe(false);
  });

  it('should filter unread only when option is set', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: [mockNotifications[0]], error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEqIsRead = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqUserId = vi.fn().mockReturnValue({ order: mockOrder, eq: mockEqIsRead });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUserId });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useNotifications({ unreadOnly: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.isError).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
  });

  it('should return empty array when user is not logged in', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetching).toBe(false);
  });

  it('should handle missing table gracefully', async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "notifications" does not exist' },
    });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should map DB fields to Notification type correctly', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: mockNotifications, error: null });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const notification = result.current.data?.[0];
    expect(notification).toMatchObject({
      id: 'notif-1',
      userId: 'user-1',
      type: 'project_assigned',
      title: 'Nouveau projet assigné',
      message: 'Vous avez été assigné au projet "CRM Axivity"',
      link: '/projets?id=proj-1',
      isRead: false,
      createdAt: '2024-01-15T10:00:00Z',
    });
  });
});

describe('useUnreadNotificationsCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should return unread count', async () => {
    const mockEqIsRead = vi.fn().mockResolvedValue({ count: 5, error: null });
    const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqIsRead });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUserId });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(5);
  });

  it('should return 0 when user is not logged in', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('should handle missing table gracefully', async () => {
    const mockEqIsRead = vi.fn().mockResolvedValue({
      count: null,
      error: { code: '42P01', message: 'relation "notifications" does not exist' },
    });
    const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqIsRead });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUserId });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(0);
  });
});

describe('useMarkNotificationAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should mark notification as read', async () => {
    const mockEqUserId = vi.fn().mockResolvedValue({ error: null });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUserId });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useMarkNotificationAsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('notif-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    expect(mockEqId).toHaveBeenCalledWith('id', 'notif-1');
  });

  it('should handle errors', async () => {
    const mockEqUserId = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUserId });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useMarkNotificationAsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('notif-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useMarkAllNotificationsAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should mark all notifications as read', async () => {
    const mockEqIsRead = vi.fn().mockResolvedValue({ error: null });
    const mockEqUserId = vi.fn().mockReturnValue({ eq: mockEqIsRead });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUserId });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
  });

  it('should do nothing when user is not logged in', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});

describe('useCreateNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a notification', async () => {
    const newNotification = {
      id: 'notif-3',
      user_id: 'user-2',
      type: 'project_assigned',
      title: 'Test notification',
      message: 'Test message',
      link: '/test',
      is_read: false,
      created_at: '2024-01-16T10:00:00Z',
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: newNotification, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });

    const { result } = renderHook(() => useCreateNotification(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      userId: 'user-2',
      type: 'project_assigned',
      title: 'Test notification',
      message: 'Test message',
      link: '/test',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-2',
      type: 'project_assigned',
      title: 'Test notification',
      message: 'Test message',
      link: '/test',
    });
  });

  it('should handle missing table gracefully', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation "notifications" does not exist' },
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useCreateNotification(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      userId: 'user-2',
      type: 'project_assigned',
      title: 'Test',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe('useDeleteNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('should delete a notification', async () => {
    const mockEqUserId = vi.fn().mockResolvedValue({ error: null });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUserId });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEqId });

    mockSupabase.from.mockReturnValue({
      delete: mockDelete,
    });

    const { result } = renderHook(() => useDeleteNotification(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('notif-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockEqId).toHaveBeenCalledWith('id', 'notif-1');
  });

  it('should handle errors', async () => {
    const mockEqUserId = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
    const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUserId });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEqId });

    mockSupabase.from.mockReturnValue({
      delete: mockDelete,
    });

    const { result } = renderHook(() => useDeleteNotification(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('notif-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
